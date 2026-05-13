const currentHost = window.location.hostname || "127.0.0.1";
const API_BASES = Array.from(new Set([
  "",
  `http://${currentHost}:8000`,
  "http://127.0.0.1:8000",
  "http://localhost:8000",
]));

async function requestJson(path, options = {}) {
  let lastError;
  for (const base of API_BASES) {
    try {
      const response = await fetch(`${base}${path}`, options);
      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json") ? await response.json() : null;
      if (!response.ok) throw new Error(payload?.detail || "Request failed");
      return payload;
    } catch (error) {
      lastError = error;
      if (!(error instanceof TypeError)) throw error;
    }
  }
  throw new Error(lastError instanceof TypeError ? "Backend is not reachable. Keep npm run backend running and refresh this page." : lastError?.message || "Backend request failed");
}

export async function loginUser(credentials) {
  return requestJson("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
  });
}

export async function registerUser(payload) {
  return requestJson("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export async function fetchPrediction(input, signal) {
  return requestJson("/api/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal,
  });
}

export async function fetchModelInfo(signal) {
  return requestJson("/api/model-info", { signal });
}

export async function fetchPredictionHistory(signal) {
  return requestJson("/api/history", { signal });
}

export async function savePredictionToDatabase(input) {
  return requestJson("/api/history", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
}

export async function saveAlertToDatabase(alert) {
  return requestJson("/api/alerts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(alert),
  });
}
