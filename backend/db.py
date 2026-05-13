from __future__ import annotations

import json
import sqlite3
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
