# AI Market Price Predictor - Technology Report

## Project Type

Full-stack crop market price prediction app.

## Frontend

- React 19: builds the farmer dashboard, prediction form, alerts, history, health-photo intake, and profile screens.
- Vite: development server, React build pipeline, and `/api` proxy to the backend.
- JavaScript / JSX: frontend application logic.
- CSS: responsive layout, panels, forms, dashboard, dark mode, and reduced typography scale.
- lucide-react: icons for navigation and actions.
- localStorage: keeps a browser fallback copy of session, settings, alerts, and prediction history.

## Backend

- Python 3 virtual environment: isolated backend runtime inside `.venv`.
- FastAPI: REST API for prediction, model metadata, history, alerts, and health checks.
- Uvicorn: ASGI server for running FastAPI locally.
- Pydantic: request validation for prediction and alert payloads.
- SQLite: local database stored at `backend/market_data.db`.
- sqlite3: built-in Python database adapter used by `backend/db.py`.

## Machine Learning

- scikit-learn: real trained ML library used for model training and inference.
- joblib: saves and loads the trained model artifact.
- numpy/scipy: numerical runtime used by scikit-learn.

The trained model is a `VotingRegressor` ensemble:

- Ridge Regression: stable linear baseline.
- RandomForestRegressor: tree-based nonlinear model for crop, soil, city, and weather interactions.
- GradientBoostingRegressor: boosted decision trees for residual correction and trend sensitivity.

The model is trained by `backend/train_model.py` on generated crop-market training rows with these features:

- Crop
- State
- Region/city
- Soil
- Season
- Temperature
- Humidity
- Rainfall
- Forecast days
- Yield quantity
- Crop demand
- Crop volatility

The target value is crop market price per quintal. The training script stores:

- `backend/model_artifacts/crop_price_model.joblib`
- `backend/model_artifacts/metrics.json`

## API Endpoints

- `GET /api/health`: backend and model health.
- `GET /api/model-info`: algorithm, model list, features, MAE, R2, and training row count.
- `POST /api/predict`: predicts crop price using the trained scikit-learn model.
- `GET /api/history`: reads saved predictions from SQLite.
- `POST /api/history`: saves a prediction to SQLite.
- `GET /api/alerts`: reads saved alerts from SQLite.
- `POST /api/alerts`: saves an alert to SQLite.

## Data Flow

1. React collects crop, city, soil, season, weather, forecast days, and yield.
2. React sends the input to `POST /api/predict`.
3. FastAPI validates the payload with Pydantic.
4. The scikit-learn pipeline transforms categorical and numeric features.
5. The trained ensemble predicts price per quintal.
6. FastAPI returns prediction, confidence, risk, demand, crop fit, and model metrics.
7. SQLite stores prediction and alert records.
8. React displays the backend result. If the backend is offline, it uses the old local JavaScript predictor as a fallback.

## Important Note

This now uses a real trained scikit-learn model and a real backend/database. The training data is generated inside the project from crop profiles and market/weather assumptions because no external government market dataset was provided. For production accuracy, replace the generated rows with real mandi/APMC price history and retrain the same pipeline.
