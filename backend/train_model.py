from __future__ import annotations

import json
import math
import random
import csv
from datetime import datetime
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor, VotingRegressor
from sklearn.feature_extraction import DictVectorizer
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from .data import CITY_MULTIPLIERS, CROPS, SEASONS, SOIL_FIT, SOILS, STATES, clamp, crop_profile

BASE_DIR = Path(__file__).resolve().parent
ARTIFACT_DIR = BASE_DIR / "model_artifacts"
DATASET_PATH = BASE_DIR / "data" / "mandi_prices.csv"
MODEL_PATH = ARTIFACT_DIR / "crop_price_model.joblib"
METRICS_PATH = ARTIFACT_DIR / "metrics.json"

FEATURES = [
    "crop",
    "state",
    "region",
    "soil",
    "season",
    "temperature",
    "humidity",
    "rainfall",
    "forecastDays",
    "yieldQty",
    "month",
    "mandiName",
    "msp",
    "arrivalQty",
    "rainfallHistory",
    "demandTrend",
    "demand",
    "volatility",
]

def soil_score(soil: str, crop: str) -> float:
    profile = crop_profile(crop)
    return SOIL_FIT.get(soil, {}).get(crop, 1.08 if soil == profile["soil"] else 0.98)


def season_score(season: str, rainfall: float, temperature: float, crop: str) -> float:
    profile = crop_profile(crop)
    if season == profile["season"]:
        return 1.11
    if (season == "Kharif" and rainfall > 80) or (season == "Zaid" and temperature > 31):
        return 1.03
    return 0.96


def weather_score(temperature: float, humidity: float, rainfall: float, crop: str) -> float:
    profile = crop_profile(crop)
    temp_penalty = abs(temperature - 28) * 0.008
    humidity_boost = (humidity - 55) * 0.002
    rainfall_boost = 0.08 if rainfall > 55 else -0.07 if rainfall < 18 else 0.02
    water_penalty = 0
    if profile["water_need"] == "High" and rainfall < 45:
        water_penalty = -0.08
    elif profile["water_need"] == "Low" and rainfall > 95:
        water_penalty = -0.06
    return clamp(1 + humidity_boost + rainfall_boost + water_penalty - temp_penalty, 0.78, 1.20)


def labeled_price(row: dict, rng: random.Random) -> float:
    profile = crop_profile(row["crop"])
    city = CITY_MULTIPLIERS.get(row["region"], 1)
    soil = soil_score(row["soil"], row["crop"])
    season = season_score(row["season"], row["rainfall"], row["temperature"], row["crop"])
    climate = weather_score(row["temperature"], row["humidity"], row["rainfall"], row["crop"])
    demand = 1 + profile["demand"] * 0.09 + (row.get("demandTrend", 0) * 0.03)
    trend = 1 + row["forecastDays"] * profile["volatility"] * 0.006
    msp_floor = 1 + min(row.get("msp", 0), profile["base"] * 1.2) / max(profile["base"], 1) * 0.025
    arrival_pressure = 1 - min(row.get("arrivalQty", 0), 8000) / 8000 * 0.06
    rainfall_memory = 1 + (row.get("rainfallHistory", row["rainfall"]) - row["rainfall"]) * 0.0008
    supply_noise = rng.normalvariate(0, profile["volatility"] * 0.18)
    cyclical_market = math.sin((row["forecastDays"] + len(row["region"])) * 0.65) * profile["volatility"] * 0.09
    price = profile["base"] * city * soil * season * climate * demand * trend * msp_floor * arrival_pressure * rainfall_memory * (1 + supply_noise + cyclical_market)
    return round(max(250, price), 2)


def build_training_rows(total_rows: int = 4500, seed: int = 42) -> tuple[list[dict], list[float]]:
    rng = random.Random(seed)
    crops = list(CROPS)
    regions = list(CITY_MULTIPLIERS)
    rows: list[dict] = []
    targets: list[float] = []
    for _ in range(total_rows):
        crop = rng.choice(crops)
        profile = crop_profile(crop)
        season = rng.choice(SEASONS)
        temperature = clamp(rng.normalvariate(29 if season != "Rabi" else 24, 5), 12, 44)
        rainfall = clamp(rng.normalvariate(70 if season == "Kharif" else 30, 28), 0, 150)
        humidity = clamp(rng.normalvariate(65 if rainfall > 50 else 52, 14), 20, 95)
        row = {
            "crop": crop,
            "state": rng.choice(STATES),
            "region": rng.choice(regions),
            "soil": rng.choice(SOILS),
            "season": season,
            "temperature": round(temperature, 1),
            "humidity": round(humidity, 1),
            "rainfall": round(rainfall, 1),
            "forecastDays": rng.randint(1, 15),
            "yieldQty": rng.randint(1, 120),
            "month": rng.randint(1, 12),
            "mandiName": rng.choice(regions),
            "msp": round(profile["base"] * rng.uniform(0.72, 1.05), 2),
            "arrivalQty": round(rng.uniform(80, 7000), 2),
            "rainfallHistory": round(clamp(rainfall + rng.normalvariate(0, 18), 0, 180), 1),
            "demandTrend": round(rng.uniform(-0.2, 0.35), 3),
            "demand": profile["demand"],
            "volatility": profile["volatility"],
        }
        rows.append(row)
        targets.append(labeled_price(row, rng))
    return rows, targets


def first_value(row: dict, names: list[str], default: str = "") -> str:
    normalized = {key.strip().lower(): value for key, value in row.items()}
    for name in names:
        value = normalized.get(name.lower())
        if value not in (None, ""):
            return str(value).strip()
    return default


def to_float(value: str, default: float = 0) -> float:
    try:
        return float(str(value).replace(",", "").strip())
    except ValueError:
        return default


def month_from_date(value: str) -> int:
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%Y/%m/%d"):
        try:
            return datetime.strptime(value.strip(), fmt).month
        except ValueError:
            continue
    return datetime.now().month


def load_real_market_rows(path: Path = DATASET_PATH) -> tuple[list[dict], list[float], str]:
    if not path.exists():
        return [], [], "synthetic_generated_market_profiles"
    rows: list[dict] = []
    targets: list[float] = []
    with path.open(newline="", encoding="utf-8-sig") as handle:
        reader = csv.DictReader(handle)
        for raw in reader:
            crop = first_value(raw, ["Commodity", "commodity", "crop", "Crop"], "Tomato").title()
            state = first_value(raw, ["State", "STATE", "state"], "Maharashtra")
            district = first_value(raw, ["District Name", "District", "district"], "Pune")
            market = first_value(raw, ["Market Name", "Market", "mandi", "Mandi Name"], district)
            modal_price = to_float(first_value(raw, ["Modal_price", "Modal Price", "modal_price", "modal price", "Price"], "0"))
            min_price = to_float(first_value(raw, ["Min_price", "Min Price", "min_price"], "0"))
            max_price = to_float(first_value(raw, ["Max_price", "Max Price", "max_price"], "0"))
            price = modal_price or ((min_price + max_price) / 2 if max_price else min_price)
            if price <= 0:
                continue
            profile = crop_profile(crop if crop in CROPS else "Tomato")
            month = month_from_date(first_value(raw, ["Price Date", "date", "Date"], ""))
            rows.append({
                "crop": crop,
                "state": state,
                "region": district,
                "soil": profile["soil"],
                "season": profile["season"],
                "temperature": 29,
                "humidity": 62,
                "rainfall": 48,
                "forecastDays": 5,
                "yieldQty": 10,
                "month": month,
                "mandiName": market,
                "msp": to_float(first_value(raw, ["MSP", "msp"], "0"), profile["base"] * 0.82),
                "arrivalQty": to_float(first_value(raw, ["Arrival", "Arrivals", "arrivalQty", "Arrival Qty"], "0"), 1000),
                "rainfallHistory": 48,
                "demandTrend": 0,
                "demand": profile["demand"],
                "volatility": profile["volatility"],
            })
            targets.append(price)
    return rows, targets, "real_mandi_csv"


def train_model() -> dict:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)
    rows, target, data_source = load_real_market_rows()
    if len(rows) < 100:
        rows, target = build_training_rows()
        data_source = "synthetic_generated_market_profiles"
    y = np.array(target)
    indices = np.arange(len(y))
    train_idx, test_idx = train_test_split(indices, test_size=0.18, random_state=7)

    def slice_features(selected):
        return [rows[idx] for idx in selected]

    ensemble = VotingRegressor(
        estimators=[
            ("ridge", Ridge(alpha=0.8)),
            ("random_forest", RandomForestRegressor(n_estimators=160, random_state=9, min_samples_leaf=3)),
            ("gradient_boosting", GradientBoostingRegressor(random_state=11, n_estimators=130, learning_rate=0.06, max_depth=3)),
        ],
        weights=[0.16, 0.54, 0.30],
    )
    pipeline = Pipeline([("vectorize", DictVectorizer(sparse=False)), ("model", ensemble)])
    pipeline.fit(slice_features(train_idx), y[train_idx])
    predictions = pipeline.predict(slice_features(test_idx))
    metrics = {
        "algorithm": "VotingRegressor ensemble",
        "models": ["Ridge Regression", "RandomForestRegressor", "GradientBoostingRegressor"],
        "training_rows": len(rows),
        "test_rows": len(test_idx),
        "mae": round(float(mean_absolute_error(y[test_idx], predictions)), 2),
        "r2": round(float(r2_score(y[test_idx], predictions)), 4),
        "target": "crop market price per quintal",
        "features": FEATURES,
        "data_source": data_source,
        "real_dataset_path": str(DATASET_PATH),
    }
    joblib.dump({"pipeline": pipeline, "metrics": metrics}, MODEL_PATH)
    METRICS_PATH.write_text(json.dumps(metrics, indent=2), encoding="utf-8")
    return metrics


def ensure_model() -> dict:
    if not MODEL_PATH.exists():
        return train_model()
    return joblib.load(MODEL_PATH)["metrics"]


if __name__ == "__main__":
    print(json.dumps(train_model(), indent=2))
