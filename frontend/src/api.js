const API_BASE = "http://127.0.0.1:8000";

export async function fetchPrediction(input, signal) {
  const response = await fetch(`${API_BASE}/api/predict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
  if (!response.ok) throw new Error("Prediction API failed");
  return response.json();
}

export async function fetchModelInfo(signal) {
  const response = await fetch(`${API_BASE}/api/model-info`, { signal });
  if (!response.ok) throw new Error("Model info API failed");
  return response.json();
}

export async function fetchPredictionHistory(signal) {
  const response = await fetch(`${API_BASE}/api/history`, { signal });
  if (!response.ok) throw new Error("History API failed");
  return response.json();
}

export async function savePredictionToDatabase(input) {
  const response = await fetch(`${API_BASE}/api/history`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!response.ok) throw new Error("Save prediction API failed");
  return response.json();
}

export async function saveAlertToDatabase(alert) {
  const response = await fetch(`${API_BASE}/api/alerts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alert),
  });
  if (!response.ok) throw new Error("Save alert API failed");
  return response.json();
}
