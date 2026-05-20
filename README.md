# AI Market Price Predictor

## Run the Project

Open two terminals from this folder.

Terminal 1:

```powershell
npm run backend
```

Terminal 2:

```powershell
npm run dev
```

Then open:

```text
http://127.0.0.1:5174
```

The React frontend lives in `frontend/`. The app starts on the login page every time it is opened.

## MongoDB Atlas Database

The backend uses MongoDB Atlas for users, prediction history, and alerts. Set these environment variables before starting the backend:

```powershell
$env:MONGODB_URI="mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority"
$env:MONGODB_DB_NAME="ai_market_price_predictor"
npm run backend
```

The backend creates and uses these Atlas collections:

```text
users
predictions
alerts
```

## Train the ML Model

```powershell
npm run train:model
```

For real mandi/APMC/Agmarknet data, place the CSV at:

```text
backend/data/mandi_prices.csv
```

This creates the trained scikit-learn model in:

```text
backend/model_artifacts/crop_price_model.joblib
```

## What This Uses

- React + Vite frontend
- FastAPI backend
- MongoDB Atlas database
- scikit-learn trained ensemble model
- joblib model persistence
- Backend login/register with PBKDF2 password hashing

See `TECH_REPORT.md` for the full explanation.
