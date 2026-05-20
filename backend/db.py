from __future__ import annotations

import os
import secrets
from datetime import datetime, timezone
from hashlib import pbkdf2_hmac
from typing import Any

from pymongo import ASCENDING, DESCENDING, MongoClient
from pymongo.errors import DuplicateKeyError

MONGODB_URI = os.getenv("MONGODB_URI", "").strip()
MONGODB_DB_NAME = os.getenv("MONGODB_DB_NAME", "ai_market_price_predictor")
_mongo_client: MongoClient | None = None


def mongo_database():
    global _mongo_client
    if not MONGODB_URI:
        raise RuntimeError("MONGODB_URI is required. Configure your MongoDB Atlas connection string before starting the backend.")
    if _mongo_client is None:
        _mongo_client = MongoClient(MONGODB_URI, serverSelectionTimeoutMS=6000)
    return _mongo_client[MONGODB_DB_NAME]


def describe_database() -> dict:
    return {"type": "mongodb_atlas", "database": MONGODB_DB_NAME}


def init_db() -> None:
    database = mongo_database()
    database.command("ping")
    database.users.create_index([("email", ASCENDING)], unique=True)
    database.users.create_index([("mobile", ASCENDING)], sparse=True)
    database.predictions.create_index([("created_at", DESCENDING)])
    database.alerts.create_index([("created_at", DESCENDING)])
    ensure_demo_user()


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    password_salt = salt or secrets.token_hex(16)
    digest = pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(password_salt), 120_000)
    return digest.hex(), password_salt


def ensure_demo_user() -> None:
    database = mongo_database()
    existing = database.users.find_one({"email": "demo@farm.ai"}, {"_id": 1})
    if existing:
        return
    password_hash, salt = hash_password("demo123")
    database.users.insert_one({
        "name": "Farmer",
        "email": "demo@farm.ai",
        "mobile": "",
        "password_hash": password_hash,
        "salt": salt,
        "state": "Maharashtra",
        "district": "Pune",
        "farm_size": "2-5 acres",
        "lang": "en",
        "created_at": datetime.now(timezone.utc),
    })


def timestamp(value: Any) -> str:
    if isinstance(value, datetime):
        return value.isoformat()
    return str(value or "")


def public_user(row: dict) -> dict:
    return {
        "id": str(row["_id"]),
        "name": row["name"],
        "email": row["email"],
        "mobile": row.get("mobile") or "",
        "state": row.get("state") or "Maharashtra",
        "district": row.get("district") or "Pune",
        "farmSize": row.get("farm_size") or "2-5 acres",
        "lang": row.get("lang") or "en",
        "createdAt": timestamp(row.get("created_at")),
    }


def create_user(payload: dict) -> dict:
    password_hash, salt = hash_password(payload["password"])
    user_doc = {
        "name": payload.get("name") or "Farmer",
        "email": payload["email"],
        "mobile": payload.get("mobile") or "",
        "password_hash": password_hash,
        "salt": salt,
        "state": payload.get("state") or "Maharashtra",
        "district": payload.get("district") or "Pune",
        "farm_size": payload.get("farmSize") or "2-5 acres",
        "lang": payload.get("lang") or "en",
        "created_at": datetime.now(timezone.utc),
    }
    try:
        result = mongo_database().users.insert_one(user_doc)
    except DuplicateKeyError as exc:
        raise ValueError("Email already registered") from exc
    user_doc["_id"] = result.inserted_id
    return public_user(user_doc)


def authenticate_user(identifier: str, password: str) -> dict | None:
    row = mongo_database().users.find_one({"$or": [{"email": identifier}, {"mobile": identifier}]})
    if not row:
        return None
    password_hash, _ = hash_password(password, row["salt"])
    if not secrets.compare_digest(password_hash, row["password_hash"]):
        return None
    return public_user(row)


def save_prediction(input_payload: dict, result_payload: dict) -> dict:
    payload = {"input": input_payload, "prediction": result_payload}
    doc = {
        "crop": input_payload["crop"],
        "state": input_payload["state"],
        "region": input_payload["region"],
        "predicted_price": result_payload["predicted"],
        "confidence": result_payload["confidence"],
        "payload": payload,
        "created_at": datetime.now(timezone.utc),
    }
    result = mongo_database().predictions.insert_one(doc)
    doc["_id"] = result.inserted_id
    return prediction_row(doc)


def list_predictions(limit: int = 30) -> list[dict]:
    rows = mongo_database().predictions.find().sort("created_at", DESCENDING).limit(limit)
    return [prediction_row(row) for row in rows]


def save_alert(payload: dict) -> dict:
    doc = {
        "crop": payload["crop"],
        "condition": payload["condition"],
        "threshold": payload["threshold"],
        "state": payload.get("state") or None,
        "created_at": datetime.now(timezone.utc),
    }
    result = mongo_database().alerts.insert_one(doc)
    doc["_id"] = result.inserted_id
    return alert_row(doc)


def list_alerts() -> list[dict]:
    rows = mongo_database().alerts.find().sort("created_at", DESCENDING)
    return [alert_row(row) for row in rows]


def alert_row(row: dict) -> dict:
    return {
        "id": str(row["_id"]),
        "crop": row["crop"],
        "condition": row["condition"],
        "threshold": row["threshold"],
        "state": row.get("state"),
        "created_at": timestamp(row.get("created_at")),
    }


def prediction_row(row: dict) -> dict:
    payload = row["payload"]
    return {
        "id": str(row["_id"]),
        "savedAt": timestamp(row.get("created_at")),
        "input": payload["input"],
        "prediction": payload["prediction"],
    }
