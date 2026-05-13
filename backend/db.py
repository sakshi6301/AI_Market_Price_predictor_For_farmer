from __future__ import annotations

import json
import secrets
import sqlite3
from hashlib import pbkdf2_hmac
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent / "market_data.db"


def connect() -> sqlite3.Connection:
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def init_db() -> None:
    with connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                mobile TEXT,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                state TEXT,
                district TEXT,
                farm_size TEXT,
                lang TEXT NOT NULL DEFAULT 'en',
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS predictions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                crop TEXT NOT NULL,
                state TEXT NOT NULL,
                region TEXT NOT NULL,
                predicted_price REAL NOT NULL,
                confidence INTEGER NOT NULL,
                payload TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )
        ensure_demo_user(connection)


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    password_salt = salt or secrets.token_hex(16)
    digest = pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(password_salt), 120_000)
    return digest.hex(), password_salt


def ensure_demo_user(connection: sqlite3.Connection) -> None:
    existing = connection.execute("SELECT id FROM users WHERE email = ?", ("demo@farm.ai",)).fetchone()
    if existing:
        return
    password_hash, salt = hash_password("demo123")
    connection.execute(
        """
        INSERT INTO users (name, email, mobile, password_hash, salt, state, district, farm_size, lang)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        ("Farmer", "demo@farm.ai", "", password_hash, salt, "Maharashtra", "Pune", "2-5 acres", "en"),
    )


def public_user(row: sqlite3.Row) -> dict:
    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "mobile": row["mobile"] or "",
        "state": row["state"] or "Maharashtra",
        "district": row["district"] or "Pune",
        "farmSize": row["farm_size"] or "2-5 acres",
        "lang": row["lang"] or "en",
        "createdAt": row["created_at"],
    }


def create_user(payload: dict) -> dict:
    password_hash, salt = hash_password(payload["password"])
    with connect() as connection:
        try:
            cursor = connection.execute(
                """
                INSERT INTO users (name, email, mobile, password_hash, salt, state, district, farm_size, lang)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    payload.get("name") or "Farmer",
                    payload["email"],
                    payload.get("mobile") or "",
                    password_hash,
                    salt,
                    payload.get("state") or "Maharashtra",
                    payload.get("district") or "Pune",
                    payload.get("farmSize") or "2-5 acres",
                    payload.get("lang") or "en",
                ),
            )
        except sqlite3.IntegrityError as exc:
            raise ValueError("Email already registered") from exc
        row = connection.execute("SELECT * FROM users WHERE id = ?", (cursor.lastrowid,)).fetchone()
    return public_user(row)


def authenticate_user(identifier: str, password: str) -> dict | None:
    with connect() as connection:
        row = connection.execute(
            "SELECT * FROM users WHERE email = ? OR mobile = ?",
            (identifier, identifier),
        ).fetchone()
    if not row:
        return None
    password_hash, _ = hash_password(password, row["salt"])
    if not secrets.compare_digest(password_hash, row["password_hash"]):
        return None
    return public_user(row)
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                crop TEXT NOT NULL,
                condition TEXT NOT NULL,
                threshold REAL NOT NULL,
                state TEXT,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )
            """
        )


def save_prediction(input_payload: dict, result_payload: dict) -> dict:
    with connect() as connection:
        cursor = connection.execute(
            """
            INSERT INTO predictions (crop, state, region, predicted_price, confidence, payload)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                input_payload["crop"],
                input_payload["state"],
                input_payload["region"],
                result_payload["predicted"],
                result_payload["confidence"],
                json.dumps({"input": input_payload, "prediction": result_payload}),
            ),
        )
        prediction_id = cursor.lastrowid
        row = connection.execute("SELECT * FROM predictions WHERE id = ?", (prediction_id,)).fetchone()
    return prediction_row(row)


def list_predictions(limit: int = 30) -> list[dict]:
    with connect() as connection:
        rows = connection.execute(
            "SELECT * FROM predictions ORDER BY created_at DESC, id DESC LIMIT ?",
            (limit,),
        ).fetchall()
    return [prediction_row(row) for row in rows]


def save_alert(payload: dict) -> dict:
    with connect() as connection:
        cursor = connection.execute(
            "INSERT INTO alerts (crop, condition, threshold, state) VALUES (?, ?, ?, ?)",
            (payload["crop"], payload["condition"], payload["threshold"], payload.get("state") or None),
        )
        alert_id = cursor.lastrowid
        row = connection.execute("SELECT * FROM alerts WHERE id = ?", (alert_id,)).fetchone()
    return dict(row)


def list_alerts() -> list[dict]:
    with connect() as connection:
        rows = connection.execute("SELECT * FROM alerts ORDER BY created_at DESC, id DESC").fetchall()
    return [dict(row) for row in rows]


def prediction_row(row: sqlite3.Row) -> dict:
    payload = json.loads(row["payload"])
    return {
        "id": row["id"],
        "savedAt": row["created_at"],
        "input": payload["input"],
        "prediction": payload["prediction"],
    }
