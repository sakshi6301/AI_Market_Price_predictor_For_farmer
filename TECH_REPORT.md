# AI Market Price Predictor - Technology Report

## Project Type

Full-stack crop market price prediction app.

## Frontend

- React 19: builds the farmer dashboard, prediction form, alerts, history, health-photo intake, and profile screens.
- Vite: development server, React build pipeline, and `/api` proxy to the backend.
- JavaScript / JSX: frontend application logic.
- CSS: responsive layout, panels, forms, dashboard, dark mode, and reduced typography scale.
- lucide-react: icons for navigation and actions.
- localStorage: keeps browser-side session and UI preferences.

## Backend

- Python 3 virtual environment: isolated backend runtime inside `.venv`.
- FastAPI: REST API for prediction, model metadata, history, alerts, and health checks.
- Uvicorn: ASGI server for running FastAPI locally.
- Pydantic: request validation for prediction and alert payloads.
- MongoDB Atlas: cloud database for users, prediction history, and alerts.
- pymongo/dnspython: MongoDB Atlas driver and SRV connection support used by `backend/db.py`.
- PBKDF2-HMAC-SHA256: password hashing for backend login/register.

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
- Date/month
- Mandi name
- MSP
- Arrival quantity
- Rainfall history
- Demand trend
- Crop demand
- Crop volatility

The target value is crop market price per quintal. The training script stores:

- `backend/model_artifacts/crop_price_model.joblib`
- `backend/model_artifacts/metrics.json`

## API Endpoints

- `GET /api/health`: backend and model health.
- `GET /api/model-info`: algorithm, model list, features, MAE, R2, and training row count.
- `POST /api/predict`: predicts crop price using the trained scikit-learn model.
- `GET /api/history`: reads saved predictions from MongoDB Atlas.
- `POST /api/history`: saves a prediction to MongoDB Atlas.
- `GET /api/alerts`: reads saved alerts from MongoDB Atlas.
- `POST /api/alerts`: saves an alert to MongoDB Atlas.

## Data Flow

1. React collects crop, city, soil, season, weather, forecast days, and yield.
2. React sends the input to `POST /api/predict`.
3. FastAPI validates the payload with Pydantic.
4. The scikit-learn pipeline transforms categorical and numeric features.
5. The trained ensemble predicts price per quintal.
6. FastAPI returns prediction, confidence, risk, demand, crop fit, and model metrics.
7. MongoDB Atlas stores user, prediction, and alert records.
8. React displays the backend result. If the backend is offline, it uses the old local JavaScript predictor as a fallback.

## Important Note

This now uses a real trained scikit-learn model and a real backend/database. The trainer first looks for real mandi/APMC/Agmarknet-style CSV data at `backend/data/mandi_prices.csv`. If that file has enough valid rows, it trains from the CSV. If no real CSV is present, it falls back to generated market-profile rows so the project remains runnable.
