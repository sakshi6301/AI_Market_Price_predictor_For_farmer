from __future__ import annotations

import math
from functools import lru_cache

import joblib
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from . import db
from .data import CITY_MULTIPLIERS, clamp, crop_profile
from .train_model import FEATURES, MODEL_PATH, ensure_model

PROJECT_DIR = Path(__file__).resolve().parents[1]
FRONTEND_DIST = PROJECT_DIR / "frontend" / "dist"

app = FastAPI(title="AI Market Price Predictor API", version="2.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1|\[::1\]|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

if (FRONTEND_DIST / "assets").exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="assets")


class PredictionInput(BaseModel):
    crop: str = "Tomato"
    soil: str = "Red soil"
    temperature: float = Field(29, ge=0, le=60)
    humidity: float = Field(62, ge=0, le=100)
    rainfall: float = Field(48, ge=0, le=300)
    state: str = "Maharashtra"
    region: str = "Pune"
    season: str = "Zaid"
    forecastDays: int = Field(5, ge=1, le=30)
    yieldQty: int = Field(11, ge=1, le=1000)
    month: int = Field(default_factory=lambda: datetime.now().month, ge=1, le=12)
    mandiName: str = "Pune"
    msp: float = Field(0, ge=0)
    arrivalQty: float = Field(1000, ge=0)
    rainfallHistory: float = Field(48, ge=0, le=500)
    demandTrend: float = Field(0, ge=-1, le=1)


class AuthInput(BaseModel):
    email: str
    password: str


class RegisterInput(AuthInput):
    name: str = "Farmer"
    mobile: str = ""
    state: str = "Maharashtra"
    district: str = "Pune"
    farmSize: str = "2-5 acres"
    lang: str = "en"


class AlertInput(BaseModel):
    crop: str
    condition: str
    threshold: float
    state: str | None = None


@app.on_event("startup")
def startup() -> None:
    db.init_db()
    ensure_model()


@lru_cache(maxsize=1)
def model_bundle() -> dict:
    ensure_model()
    return joblib.load(MODEL_PATH)


def feature_payload(input_data: PredictionInput) -> dict:
    profile = crop_profile(input_data.crop)
    return {
        "crop": input_data.crop,
        "state": input_data.state,
        "region": input_data.region,
        "soil": input_data.soil,
        "season": input_data.season,
        "temperature": input_data.temperature,
        "humidity": input_data.humidity,
        "rainfall": input_data.rainfall,
        "forecastDays": input_data.forecastDays,
        "yieldQty": input_data.yieldQty,
        "month": input_data.month,
        "mandiName": input_data.mandiName or input_data.region,
        "msp": input_data.msp or profile["base"] * 0.82,
        "arrivalQty": input_data.arrivalQty,
        "rainfallHistory": input_data.rainfallHistory,
        "demandTrend": input_data.demandTrend,
        "demand": profile["demand"],
        "volatility": profile["volatility"],
    }


def infer_business_fields(input_data: PredictionInput, predicted: float) -> dict:
    profile = crop_profile(input_data.crop)
    city_score = CITY_MULTIPLIERS.get(input_data.region, 1)
    current = round(profile["base"] * city_score)
    change = ((predicted - current) / current) * 100 if current else 0
    confidence = round(clamp(92 - profile["volatility"] * 70 - abs(change) * 0.18, 62, 96))
    risk = "High" if change < -4 or profile["volatility"] > 0.20 else "Medium" if change < 2 else "Low"
    demand = "High" if profile["demand"] > 0.77 else "Medium" if profile["demand"] > 0.68 else "Stable"
    soil_match = 1 if input_data.soil == profile["soil"] else 0.75
    season_match = 1 if input_data.season == profile["season"] else 0.78
    rainfall_fit = 1 - min(abs(input_data.rainfall - 55), 80) / 160
    crop_fit = round(clamp((soil_match * 0.38 + season_match * 0.34 + rainfall_fit * 0.28) * 100, 38, 98))
    return {
        "current": current,
        "change": round(change, 1),
        "confidence": confidence,
        "risk": risk,
        "demand": demand,
        "sellingWindow": f"Hold {min(input_data.forecastDays, 7)} days" if change > 5 else "Sell soon" if change < -2 else "Watch market",
        "cropFit": crop_fit,
    }


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "database": db.describe_database(), "model": str(MODEL_PATH.name)}


@app.get("/")
def root():
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    return {"name": "AI Market Price Predictor API", "docs": "/docs", "api": "/api", "predict": "POST /api/predict"}


@app.get("/api")
def api_index() -> dict:
    return {
        "message": "Use /docs for interactive API testing. /api/predict requires POST JSON input.",
        "endpoints": [
            "POST /api/auth/register",
            "POST /api/auth/login",
            "GET /api/model-info",
            "POST /api/predict",
            "GET /api/history",
            "POST /api/history",
            "GET /api/alerts",
            "POST /api/alerts",
        ],
    }


@app.post("/api/auth/register")
def register(payload: RegisterInput) -> dict:
    try:
        user = db.create_user(payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status_code=409, detail=str(exc)) from exc
    return {"user": user}


@app.post("/api/auth/login")
def login(payload: AuthInput) -> dict:
    user = db.authenticate_user(payload.email, payload.password)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email/mobile or password")
    return {"user": user}


@app.get("/api/model-info")
def model_info() -> dict:
    return model_bundle()["metrics"]


@app.post("/api/predict")
def predict(input_data: PredictionInput) -> dict:
    bundle = model_bundle()
    payload = feature_payload(input_data)
    features = [{name: payload[name] for name in FEATURES}]
    predicted = float(bundle["pipeline"].predict(features)[0])
    rounded_prediction = int(round(predicted / 10) * 10)
    response = {
        "predicted": rounded_prediction,
        "modelSource": "FastAPI + scikit-learn trained ensemble",
        "models": bundle["metrics"]["models"],
        "metrics": {
            "mae": bundle["metrics"]["mae"],
            "r2": bundle["metrics"]["r2"],
            "trainingRows": bundle["metrics"]["training_rows"],
            "dataSource": bundle["metrics"].get("data_source", "unknown"),
        },
        **infer_business_fields(input_data, rounded_prediction),
    }
    return response


@app.get("/api/history")
def history() -> list[dict]:
    return db.list_predictions()


@app.post("/api/history")
def save_history(input_data: PredictionInput) -> dict:
    result = predict(input_data)
    return db.save_prediction(input_data.model_dump(), result)


@app.get("/api/alerts")
def alerts() -> list[dict]:
    return db.list_alerts()


@app.post("/api/alerts")
def create_alert(alert: AlertInput) -> dict:
    return db.save_alert(alert.model_dump())


@app.get("/{path:path}")
def frontend_fallback(path: str):
    if path.startswith("api") or path in {"docs", "openapi.json"}:
        raise HTTPException(status_code=404, detail="Not found")
    index_file = FRONTEND_DIST / "index.html"
    if index_file.exists():
        return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="Frontend build not found. Run npm run build first.")
