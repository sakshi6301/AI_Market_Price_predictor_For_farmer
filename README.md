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
http://127.0.0.1:5173
```

The React frontend lives in `frontend/`. The app starts on the login page every time it is opened.

## Train the ML Model

```powershell
npm run train:model
```

This creates the trained scikit-learn model in:

```text
backend/model_artifacts/crop_price_model.joblib
```

## What This Uses

- React + Vite frontend
- FastAPI backend
- SQLite database
- scikit-learn trained ensemble model
- joblib model persistence

See `TECH_REPORT.md` for the full explanation.
