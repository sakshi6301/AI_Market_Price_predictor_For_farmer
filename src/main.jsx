import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  Camera,
  Calculator,
  CloudSun,
  History,
  Languages,
  LayoutDashboard,
  Leaf,
  LineChart,
  LogIn,
  LogOut,
  Scale,
  Send,
  ShieldCheck,
  Sprout,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { STATES_DISTRICTS } from "./locationData.js";
import { fetchModelInfo, fetchPrediction, fetchPredictionHistory, saveAlertToDatabase, savePredictionToDatabase } from "./api.js";
import { buildTrend, compareCropChoices, diagnoseHealth, getCityWeather, predictPrice, recommendCrops, crops } from "./mlEngine.js";
import "./styles.css";

const LANGS = {
  en: { name: "English", label: "EN" },
  hi: { name: "Hindi", label: "HI" },
  mr: { name: "Marathi", label: "MR" },
};

const COPY = {
  en: { title: "AI Market Price Predictor", subtitle: "Crop prices, crop choice, alerts, health photo intake, and prediction history", dashboard: "Dashboard", predict: "Predict", compare: "Compare", alerts: "Alerts", health: "Health", history: "History", profile: "Profile" },
  hi: { title: "एआई मार्केट प्राइस प्रेडिक्टर", subtitle: "फसल भाव, तुलना, अलर्ट, फोटो स्वास्थ्य और इतिहास", dashboard: "डैशबोर्ड", predict: "अनुमान", compare: "तुलना", alerts: "अलर्ट", health: "स्वास्थ्य", history: "इतिहास", profile: "प्रोफाइल" },
  mr: { title: "एआय मार्केट प्राइस प्रेडिक्टर", subtitle: "पीक भाव, तुलना, अलर्ट, फोटो आरोग्य आणि इतिहास", dashboard: "डॅशबोर्ड", predict: "अंदाज", compare: "तुलना", alerts: "अलर्ट", health: "आरोग्य", history: "इतिहास", profile: "प्रोफाइल" },
};

const UI = {
  en: {
    ...COPY.en,
    fullWorkflow: "Farmer workspace",
    currentDecision: "Current decision",
    predictedPrice: "Predicted price",
    current: "Current",
    change: "Change",
    confidence: "Confidence",
    risk: "Risk",
    demand: "Demand",
    cropFit: "Crop fit",
    pricePrediction: "Price Prediction",
    crop: "Crop",
    cropName: "Crop name",
    state: "State",
    district: "District",
    season: "Season",
    soil: "Soil",
    temperature: "Temperature",
    humidity: "Humidity",
    rainfall: "Rainfall",
    forecast: "Forecast",
    expectedYield: "Expected yield",
    weather: "Weather",
    recommendedCrops: "Recommended Crops",
    compareTitle: "Should I grow this or that?",
    recommended: "Recommended",
    alternative: "Alternative",
    setAlert: "Set Price Alert",
    activeAlerts: "Active Alerts",
    condition: "Condition",
    threshold: "Threshold Rs/q",
    addAlert: "Add Alert",
    above: "Rises above",
    below: "Falls below",
    allIndia: "All India",
    noAlerts: "No alerts yet.",
    healthTitle: "Crop Photo Health Predictor",
    healthHelp: "Select or type the crop, upload a crop photo, then review the local scan result.",
    uploadPhoto: "Upload crop photo",
    healthResult: "Health Result",
    localPhotoScan: "Local photo scan",
    file: "File",
    healthNote: "The photo scan runs locally using color signals. Production apps should use a secure backend vision model.",
    historicalAnalytics: "Historical Analytics",
    predictionHistory: "Prediction History",
    saveHistoryHint: "Save predictions to compare them later with the current situation.",
    profitCalculator: "Profit Calculator",
    investment: "Investment",
    return: "Return",
    profit: "Profit",
    share: "Share",
    save: "Save",
    dark: "Dark",
    light: "Light",
    logout: "Logout",
    language: "Language",
    best: "Best",
    perQuintal: "per quintal",
    noSevereRain: "No severe rain warning.",
    highRain: "High rainfall expected, watch disease risk.",
    selectSameCrop: "select same crop to compare",
    delete: "Delete",
    remove: "Remove",
    name: "Name",
    location: "Location",
    farmSize: "Farm size",
  },
  hi: {
    ...COPY.hi,
    fullWorkflow: "किसान कार्यक्षेत्र",
    currentDecision: "वर्तमान निर्णय",
    predictedPrice: "अनुमानित भाव",
    current: "वर्तमान",
    change: "बदलाव",
    confidence: "विश्वास",
    risk: "जोखिम",
    demand: "मांग",
    cropFit: "फसल उपयुक्तता",
    pricePrediction: "भाव अनुमान",
    crop: "फसल",
    cropName: "फसल नाम",
    state: "राज्य",
    district: "जिला",
    season: "मौसम",
    soil: "मिट्टी",
    temperature: "तापमान",
    humidity: "नमी",
    rainfall: "वर्षा",
    forecast: "पूर्वानुमान",
    expectedYield: "अपेक्षित उपज",
    weather: "मौसम",
    recommendedCrops: "सुझाई गई फसलें",
    compareTitle: "यह उगाऊं या वह?",
    recommended: "सुझाव",
    alternative: "विकल्प",
    setAlert: "भाव अलर्ट सेट करें",
    activeAlerts: "सक्रिय अलर्ट",
    condition: "शर्त",
    threshold: "सीमा Rs/q",
    addAlert: "अलर्ट जोड़ें",
    above: "ऊपर जाए",
    below: "नीचे जाए",
    allIndia: "संपूर्ण भारत",
    noAlerts: "अभी कोई अलर्ट नहीं.",
    healthTitle: "फसल फोटो स्वास्थ्य जांच",
    healthHelp: "फसल चुनें या नाम लिखें, फोटो अपलोड करें, फिर स्थानीय जांच देखें.",
    uploadPhoto: "फसल फोटो अपलोड करें",
    healthResult: "स्वास्थ्य परिणाम",
    localPhotoScan: "स्थानीय फोटो स्कैन",
    file: "फाइल",
    healthNote: "फोटो स्कैन स्थानीय रंग संकेतों से चलता है. उत्पादन ऐप में सुरक्षित बैकएंड विजन मॉडल लगाएं.",
    historicalAnalytics: "ऐतिहासिक विश्लेषण",
    predictionHistory: "अनुमान इतिहास",
    saveHistoryHint: "बाद में तुलना के लिए अनुमान सेव करें.",
    profitCalculator: "लाभ कैलकुलेटर",
    investment: "निवेश",
    return: "रिटर्न",
    profit: "लाभ",
    share: "शेयर",
    save: "सेव",
    dark: "डार्क",
    light: "लाइट",
    logout: "लॉगआउट",
    language: "भाषा",
    best: "सर्वश्रेष्ठ",
    perQuintal: "प्रति क्विंटल",
    noSevereRain: "कोई गंभीर वर्षा चेतावनी नहीं.",
    highRain: "अधिक वर्षा संभव, रोग जोखिम देखें.",
    selectSameCrop: "तुलना के लिए वही फसल चुनें",
    delete: "हटाएं",
    remove: "हटाएं",
    name: "नाम",
    location: "स्थान",
    farmSize: "खेत आकार",
  },
  mr: {
    ...COPY.mr,
    fullWorkflow: "शेतकरी कार्यक्षेत्र",
    currentDecision: "सध्याचा निर्णय",
    predictedPrice: "अंदाजित भाव",
    current: "सध्याचा",
    change: "बदल",
    confidence: "विश्वास",
    risk: "जोखीम",
    demand: "मागणी",
    cropFit: "पीक योग्यता",
    pricePrediction: "भाव अंदाज",
    crop: "पीक",
    cropName: "पीक नाव",
    state: "राज्य",
    district: "जिल्हा",
    season: "हंगाम",
    soil: "माती",
    temperature: "तापमान",
    humidity: "आर्द्रता",
    rainfall: "पाऊस",
    forecast: "अंदाज",
    expectedYield: "अपेक्षित उत्पादन",
    weather: "हवामान",
    recommendedCrops: "सुचवलेली पिके",
    compareTitle: "हे पीक घ्यावे की ते?",
    recommended: "शिफारस",
    alternative: "पर्याय",
    setAlert: "भाव अलर्ट सेट करा",
    activeAlerts: "सक्रिय अलर्ट",
    condition: "अट",
    threshold: "मर्यादा Rs/q",
    addAlert: "अलर्ट जोडा",
    above: "वर गेल्यास",
    below: "खाली गेल्यास",
    allIndia: "संपूर्ण भारत",
    noAlerts: "अजून अलर्ट नाहीत.",
    healthTitle: "पीक फोटो आरोग्य तपासणी",
    healthHelp: "पीक निवडा किंवा नाव लिहा, फोटो अपलोड करा आणि स्थानिक तपासणी पाहा.",
    uploadPhoto: "पीक फोटो अपलोड करा",
    healthResult: "आरोग्य निकाल",
    localPhotoScan: "स्थानिक फोटो स्कॅन",
    file: "फाइल",
    healthNote: "फोटो स्कॅन स्थानिक रंग संकेत वापरतो. उत्पादन अॅपमध्ये सुरक्षित बॅकएंड विजन मॉडेल वापरा.",
    historicalAnalytics: "ऐतिहासिक विश्लेषण",
    predictionHistory: "अंदाज इतिहास",
    saveHistoryHint: "नंतर तुलना करण्यासाठी अंदाज सेव करा.",
    profitCalculator: "नफा कॅलक्युलेटर",
    investment: "गुंतवणूक",
    return: "परतावा",
    profit: "नफा",
    share: "शेअर",
    save: "सेव",
    dark: "डार्क",
    light: "लाइट",
    logout: "लॉगआउट",
    language: "भाषा",
    best: "सर्वोत्तम",
    perQuintal: "प्रति क्विंटल",
    noSevereRain: "गंभीर पावसाचा इशारा नाही.",
    highRain: "जास्त पावसाची शक्यता, रोग जोखीम पहा.",
    selectSameCrop: "तुलनेसाठी तेच पीक निवडा",
    delete: "हटवा",
    remove: "हटवा",
    name: "नाव",
    location: "ठिकाण",
    farmSize: "शेत आकार",
  },
};


const ALL_CROPS = Object.keys(crops);
const soilOptions = ["Black soil", "Red soil", "Alluvial soil", "Sandy soil", "Clay soil"];
const seasonOptions = ["Kharif", "Rabi", "Zaid"];
const farmSizes = ["< 1 acre", "1-2 acres", "2-5 acres", "5-10 acres", "10+ acres"];
const defaultUser = { name: "Farmer", mobile: "", email: "demo@farm.ai", password: "demo123", state: "Maharashtra", district: "Pune", farmSize: "2-5 acres", lang: "en", notifications: true };
const initialInput = { crop: "Tomato", soil: "Red soil", temperature: 29, humidity: 62, rainfall: 48, state: "Maharashtra", region: "Pune", season: "Zaid", forecastDays: 5, yieldQty: 11 };
const localModelStatus = { source: "Browser fallback predictor", detail: "Start the FastAPI backend to use the trained scikit-learn model." };

function inputWithWeather(input) {
  const weather = getCityWeather(input);
  return { ...input, temperature: weather.temperature, humidity: weather.humidity, rainfall: weather.rainfall };
}

function formatINR(value) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`;
}

function readStored(key, fallback) {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function Stat({ label, value, tone = "info" }) {
  return <div className={`stat ${tone}`}><span>{label}</span><strong>{value}</strong></div>;
}

function SelectField({ label, value, onChange, options, optional = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {optional && <option value="">Optional</option>}
        {options.map((option) => <option key={option}>{option}</option>)}
      </select>
    </label>
  );
}

function TextField({ label, value, placeholder, onChange, type = "text", required = false }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type={type} required={required} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function CropField({ label, value, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input list="crop-options" value={value} placeholder="Select or type crop name" onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function NumberField({ label, value, min, max, unit, onChange }) {
  return (
    <label className="field">
      <span>{label}</span>
      <div className="number-row">
        <input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} />
        <output>{value}{unit}</output>
      </div>
    </label>
  );
}

function TrendChart({ values }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const points = values.map((value, index) => {
    const x = (index / Math.max(values.length - 1, 1)) * 100;
    const y = 84 - ((value - min) / Math.max(max - min, 1)) * 68;
    return `${x},${y}`;
  });
  return <svg className="trend-chart" viewBox="0 0 100 100" role="img" aria-label="Market price trend"><polyline points={points.join(" ")} />{values.map((value, index) => <circle key={index} cx={(index / Math.max(values.length - 1, 1)) * 100} cy={84 - ((value - min) / Math.max(max - min, 1)) * 68} r="1.8" />)}</svg>;
}

function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "demo@farm.ai", mobile: "", password: "demo123", state: "Maharashtra", district: "Pune", farmSize: "2-5 acres", lang: "en" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function update(key, value) {
    setForm((current) => key === "state" ? { ...current, state: value, district: STATES_DISTRICTS[value][0] } : { ...current, [key]: value });
  }

  function switchMode(nextMode) {
    setMode(nextMode);
    setError("");
    setSuccess("");
  }

  function submit(event) {
    event.preventDefault();
    if (!form.email || !form.password) {
      setError("Email/mobile and password are required.");
      return;
    }
    const users = readStored("farm-users", []);
    const availableUsers = users.some((item) => item.email === defaultUser.email) ? users : [defaultUser, ...users];
    if (mode === "register") {
      const user = { ...defaultUser, ...form, name: form.name || "Farmer", createdAt: new Date().toISOString() };
      writeStored("farm-users", [user, ...availableUsers.filter((item) => item.email !== user.email)]);
      setMode("login");
      setError("");
      setSuccess("Registration successful. Please login with your account.");
      setForm((current) => ({ ...current, password: "" }));
      return;
    }
    const found = availableUsers.find((item) => (item.email === form.email || item.mobile === form.email) && item.password === form.password);
    if (!found) {
      setSuccess("");
      setError("Account not found. Please register first or check your password.");
      return;
    }
    writeStored("farm-session", found);
    onAuth(found);
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand auth-brand"><Leaf /><div><strong>AI Market Price Predictor</strong><span>Secure farmer workspace</span></div></div>
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => switchMode("login")}><LogIn /> Login</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => switchMode("register")}><UserPlus /> Register</button>
        </div>
        <form onSubmit={submit} className="auth-form">
          {mode === "register" && <TextField label="Name" value={form.name} placeholder="Farmer name" onChange={(value) => update("name", value)} />}
          <TextField label="Email or mobile" value={form.email} placeholder="demo@farm.ai" onChange={(value) => update("email", value)} required />
          {mode === "register" && <TextField label="Mobile" value={form.mobile} placeholder="Optional mobile number" onChange={(value) => update("mobile", value)} />}
          <TextField label="Password" type="password" value={form.password} placeholder="Enter password" onChange={(value) => update("password", value)} required />
          {mode === "register" && (
            <div className="form-grid">
              <SelectField label="State" value={form.state} onChange={(value) => update("state", value)} options={Object.keys(STATES_DISTRICTS)} />
              <SelectField label="District" value={form.district} onChange={(value) => update("district", value)} options={STATES_DISTRICTS[form.state]} />
              <SelectField label="Farm size" value={form.farmSize} onChange={(value) => update("farmSize", value)} options={farmSizes} />
              <label className="field">
                <span>Language</span>
                <select value={form.lang} onChange={(event) => update("lang", event.target.value)}>
                  {Object.entries(LANGS).map(([code, item]) => <option value={code} key={code}>{item.label} {item.name}</option>)}
                </select>
              </label>
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
          {success && <div className="form-success">{success}</div>}
          <button className="primary-action" type="submit">{mode === "login" ? "Login" : "Create account"}</button>
          {mode === "login" ? (
            <p className="auth-switch">Don't have an account? <button type="button" onClick={() => switchMode("register")}>Register</button></p>
          ) : (
            <p className="auth-switch">Already have an account? <button type="button" onClick={() => switchMode("login")}>Login</button></p>
          )}
        </form>
      </section>
    </main>
  );
}

function AlertBanner({ alerts, onDismiss }) {
  if (!alerts.length) return null;
  return (
    <div className="alert-banner">
      {alerts.map((alert) => (
        <div key={alert.id}>
          <span><strong>Price alert:</strong> {alert.crop} is {formatINR(alert.lastPrice)}/q and {alert.condition === "above" ? "crossed above" : "dropped below"} {formatINR(alert.threshold)}/q.</span>
          <button onClick={() => onDismiss(alert.id)} aria-label="Dismiss alert">x</button>
        </div>
      ))}
    </div>
  );
}

function ShareSheet({ text, onClose }) {
  const [copied, setCopied] = useState(false);
  async function copyText() {
    await navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="share-sheet" onClick={(event) => event.stopPropagation()}>
        <h2>Share Prediction</h2>
        <p className="muted">Send this crop price report to a buyer, family member, or farmer group.</p>
        <div className="share-actions">
          <button onClick={() => navigator.share ? navigator.share({ title: "Crop prediction", text }) : copyText()}>Share</button>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank")}>WhatsApp</button>
          <button onClick={() => window.open(`mailto:?subject=Crop%20Price%20Prediction&body=${encodeURIComponent(text)}`)}>Email</button>
          <button onClick={copyText}>{copied ? "Copied" : "Copy"}</button>
        </div>
        <pre>{text}</pre>
        <button className="plain-button" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(() => readStored("farm-session", null));
  const [input, setInput] = useState(() => inputWithWeather(readStored("market-input", initialInput)));
  const [language, setLanguage] = useState(() => readStored("market-language", user?.lang ?? "en"));
  const [activeTab, setActiveTab] = useState("dashboard");
  const [theme, setTheme] = useState("light");
  const [costs, setCosts] = useState({ seed: 4200, fertilizer: 2600, water: 1300, transport: 2200, labour: 3600 });
  const [alerts, setAlerts] = useState(() => readStored("price-alerts", []));
  const [alertForm, setAlertForm] = useState({ crop: "Tomato", condition: "above", threshold: 2500, state: "" });
  const [dismissedAlerts, setDismissedAlerts] = useState([]);
  const [shareOpen, setShareOpen] = useState(false);
  const [history, setHistory] = useState(() => readStored("prediction-history", []));
  const [compare, setCompare] = useState({ cropA: "Tomato", cropB: "Onion" });
  const [healthCrop, setHealthCrop] = useState("Tomato");
  const [healthPhoto, setHealthPhoto] = useState(null);
  const [healthPreview, setHealthPreview] = useState("");
  const [symptoms, setSymptoms] = useState(["Yellow leaves"]);
  const [profileForm, setProfileForm] = useState(() => readStored("farm-session", defaultUser) || defaultUser);
  const [apiPrediction, setApiPrediction] = useState(null);
  const [modelStatus, setModelStatus] = useState(localModelStatus);

  const copy = UI[language] ?? UI.en;
  const t = (key) => copy[key] ?? UI.en[key] ?? key;
  const tabs = [
    { id: "dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { id: "prediction", label: t("predict"), icon: TrendingUp },
    { id: "compare", label: t("compare"), icon: Scale },
    { id: "alerts", label: t("alerts"), icon: Bell },
    { id: "health", label: t("health"), icon: Camera },
    { id: "history", label: t("history"), icon: History },
    { id: "profile", label: t("profile"), icon: ShieldCheck },
  ];
  const districtOptions = STATES_DISTRICTS[input.state] ?? [];
  const weather = useMemo(() => getCityWeather(input), [input.state, input.region, input.season]);
  const fallbackPrediction = useMemo(() => predictPrice(input), [input]);
  const prediction = apiPrediction ?? fallbackPrediction;
  const trend = useMemo(() => buildTrend(input.crop, input.region), [input.crop, input.region]);
  const recommendations = useMemo(() => recommendCrops(input), [input]);
  const comparison = useMemo(() => compareCropChoices(input, compare.cropA, compare.cropB), [input, compare]);
  const health = useMemo(() => diagnoseHealth(symptoms, healthCrop, healthPhoto), [symptoms, healthCrop, healthPhoto]);
  const investment = Object.values(costs).reduce((sum, value) => sum + Math.max(0, Number(value) || 0), 0);
  const expectedReturn = prediction.predicted * input.yieldQty;
  const profit = expectedReturn - investment;
  const activeAlerts = alerts.filter((alert) => {
    if (dismissedAlerts.includes(alert.id)) return false;
    if (alert.crop !== input.crop) return false;
    if (alert.state && alert.state !== input.state) return false;
    return alert.condition === "above" ? prediction.predicted >= alert.threshold : prediction.predicted <= alert.threshold;
  }).map((alert) => ({ ...alert, lastPrice: prediction.predicted }));

  const shareText = `${input.crop} forecast for ${input.region}, ${input.state}
Predicted: ${formatINR(prediction.predicted)}/quintal
Current: ${formatINR(prediction.current)}/quintal
Weather: ${weather.condition}, ${weather.temperature}C, ${weather.humidity}% humidity, ${weather.rainfall}mm rain
Demand: ${prediction.demand}
Risk: ${prediction.risk}
Sell guidance: ${prediction.sellingWindow}
Confidence: ${prediction.confidence}%`;

  useEffect(() => writeStored("market-input", input), [input]);
  useEffect(() => writeStored("market-language", language), [language]);
  useEffect(() => writeStored("price-alerts", alerts), [alerts]);
  useEffect(() => writeStored("prediction-history", history), [history]);
  useEffect(() => {
    if (user) setProfileForm(user);
  }, [user]);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    fetchPrediction(input, controller.signal)
      .then((result) => {
        setApiPrediction(result);
        setModelStatus({
          source: result.modelSource,
          detail: `Trained on ${result.metrics?.trainingRows ?? "ML"} rows, MAE ${result.metrics?.mae ?? "n/a"}, R2 ${result.metrics?.r2 ?? "n/a"}`,
        });
      })
      .catch(() => {
        setApiPrediction(null);
        setModelStatus(localModelStatus);
      });
    return () => controller.abort();
  }, [input, user]);
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    fetchModelInfo(controller.signal)
      .then((info) => setModelStatus({
        source: `${info.algorithm}: ${info.models.join(", ")}`,
        detail: `Training rows ${info.training_rows}, MAE ${info.mae}, R2 ${info.r2}`,
      }))
      .catch(() => setModelStatus(localModelStatus));
    fetchPredictionHistory(controller.signal)
      .then((items) => {
        if (Array.isArray(items) && items.length) setHistory(items);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [user]);

  if (!user) return <AuthScreen onAuth={(nextUser) => { setUser(nextUser); setLanguage(nextUser.lang || "en"); }} />;

  function updateInput(key, value) {
    setInput((current) => {
      if (key === "state") return inputWithWeather({ ...current, state: value, region: STATES_DISTRICTS[value][0] });
      if (key === "region" || key === "season") return inputWithWeather({ ...current, [key]: value });
      return { ...current, [key]: value };
    });
  }

  function syncWeather() {
    setInput((current) => inputWithWeather(current));
  }

  async function savePrediction() {
    try {
      const saved = await savePredictionToDatabase(input);
      setHistory((current) => [saved, ...current.filter((item) => item.id !== saved.id)].slice(0, 30));
    } catch {
      const item = { id: Date.now(), savedAt: new Date().toLocaleString(), input, prediction };
      setHistory((current) => [item, ...current].slice(0, 30));
    }
  }

  async function addAlert() {
    const threshold = Math.max(1, Number(alertForm.threshold) || 0);
    const nextAlert = { id: Date.now(), crop: alertForm.crop || input.crop, condition: alertForm.condition, threshold, state: alertForm.state, createdAt: new Date().toLocaleDateString() };
    try {
      const saved = await saveAlertToDatabase(nextAlert);
      setAlerts((current) => [saved, ...current]);
    } catch {
      setAlerts((current) => [nextAlert, ...current]);
    }
  }

  function saveProfile(event) {
    event.preventDefault();
    const nextUser = { ...user, ...profileForm };
    const users = readStored("farm-users", []);
    writeStored("farm-users", [nextUser, ...users.filter((item) => item.email !== nextUser.email)]);
    writeStored("farm-session", nextUser);
    setUser(nextUser);
    setLanguage(nextUser.lang || "en");
    setInput((current) => inputWithWeather({ ...current, state: nextUser.state, region: nextUser.district }));
  }

  async function onHealthPhoto(file) {
    if (!file) return;
    setHealthPreview(URL.createObjectURL(file));
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const size = 80;
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    context.drawImage(bitmap, 0, 0, size, size);
    const pixels = context.getImageData(0, 0, size, size).data;
    let green = 0;
    let yellow = 0;
    let dry = 0;
    let pale = 0;
    for (let index = 0; index < pixels.length; index += 16) {
      const red = pixels[index];
      const g = pixels[index + 1];
      const blue = pixels[index + 2];
      if (g > red * 1.08 && g > blue * 1.08) green += 1;
      if (red > 120 && g > 105 && blue < 105) yellow += 1;
      if (red > 95 && g > 65 && blue < 75 && red > g * 1.12) dry += 1;
      if (red > 180 && g > 180 && blue > 170) pale += 1;
    }
    const total = green + yellow + dry + pale || 1;
    const detected = [];
    if (yellow / total > 0.22) detected.push("Yellow leaves");
    if (dry / total > 0.18) detected.push("Dry soil");
    if (pale / total > 0.18) detected.push("White spots");
    if (green / total < 0.35) detected.push("Slow growth");
    setSymptoms(detected.length ? detected : ["No visible stress"]);
    setHealthPhoto({ name: file.name, size: file.size, type: file.type, green, yellow, dry, pale });
  }

  function logout() {
    localStorage.removeItem("farm-session");
    setUser(null);
  }

  return (
    <main className={`app ${theme}`}>
      <datalist id="crop-options">{ALL_CROPS.map((crop) => <option key={crop} value={crop} />)}</datalist>
      <aside className="sidebar">
        <div className="brand"><Leaf /><div><strong>{copy.title}</strong><span>{user.name} · {LANGS[language]?.name}</span></div></div>
        <nav>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return <button key={tab.id} className={activeTab === tab.id ? "active" : ""} onClick={() => setActiveTab(tab.id)}><Icon />{tab.label}</button>;
          })}
        </nav>
        <button className="ghost" onClick={logout}><LogOut /> {t("logout")}</button>
      </aside>

      <section className="content">
        <AlertBanner alerts={activeAlerts} onDismiss={(id) => setDismissedAlerts((current) => [...current, id])} />
        <header className="topbar">
          <div><p className="eyebrow">{t("fullWorkflow")}</p><h1>{copy.title}</h1><p>{copy.subtitle}</p></div>
          <div className="top-actions">
            <label className="icon-select"><Languages /><select value={language} aria-label={t("language")} onChange={(event) => setLanguage(event.target.value)}>{Object.entries(LANGS).map(([code, item]) => <option value={code} key={code}>{item.name}</option>)}</select></label>
            <button onClick={() => setShareOpen(true)} className="icon-button"><Send />{t("share")}</button>
            <button onClick={savePrediction} className="icon-button"><History />{t("save")}</button>
            <button onClick={() => setTheme(theme === "light" ? "dark" : "light")} className="icon-button">{theme === "light" ? t("dark") : t("light")}</button>
          </div>
        </header>

        <section id="dashboard" className={`hero-panel ${activeTab !== "dashboard" ? "tab-hidden" : ""}`}>
          <div><p className="eyebrow">{t("currentDecision")}</p><h2>{input.crop} in {input.region}: {formatINR(prediction.predicted)}/{t("perQuintal")}</h2><p>{input.crop} · {input.state} · {input.season} · {prediction.sellingWindow}</p></div>
          <div className="hero-grid"><Stat label={t("risk")} value={prediction.risk} tone={prediction.risk === "High" ? "risk" : "profit"} /><Stat label={t("demand")} value={prediction.demand} tone="warning" /><Stat label={t("cropFit")} value={`${prediction.cropFit}%`} tone="info" /></div>
        </section>

        <section className={`grid predict-layout ${activeTab !== "prediction" ? "tab-hidden" : ""}`} id="prediction">
          <article className="panel predict-controls">
            <div className="panel-title compact-title"><Sprout /><h2>{t("pricePrediction")}</h2></div>
            <div className="form-grid compact-form">
              <CropField label="Crop" value={input.crop} onChange={(value) => updateInput("crop", value)} />
              <SelectField label="State" value={input.state} onChange={(value) => updateInput("state", value)} options={Object.keys(STATES_DISTRICTS)} />
              <SelectField label="City" value={input.region} onChange={(value) => updateInput("region", value)} options={districtOptions} />
              <SelectField label="Season" value={input.season} onChange={(value) => updateInput("season", value)} options={seasonOptions} />
              <SelectField label="Soil" value={input.soil} onChange={(value) => updateInput("soil", value)} options={soilOptions} />
              <NumberField label="Temp" value={input.temperature} min={12} max={44} unit="C" onChange={(value) => updateInput("temperature", value)} />
              <NumberField label="Humidity" value={input.humidity} min={20} max={95} unit="%" onChange={(value) => updateInput("humidity", value)} />
              <NumberField label="Rain" value={input.rainfall} min={0} max={140} unit="mm" onChange={(value) => updateInput("rainfall", value)} />
              <NumberField label="Days" value={input.forecastDays} min={1} max={15} unit="d" onChange={(value) => updateInput("forecastDays", value)} />
              <NumberField label="Yield" value={input.yieldQty} min={1} max={120} unit="q" onChange={(value) => updateInput("yieldQty", value)} />
            </div>
          </article>
          <article className="panel result-panel">
            <div className="price-tag"><span>{input.crop} - {input.region}</span><strong>{formatINR(prediction.predicted)}</strong><small>{prediction.sellingWindow}</small></div>
            <div className="stats-row"><Stat label={t("current")} value={formatINR(prediction.current)} /><Stat label={t("change")} value={`${prediction.change}%`} tone={prediction.change >= 0 ? "profit" : "risk"} /><Stat label={t("confidence")} value={`${prediction.confidence}%`} /></div>
            <div className="forecast-strip">
              <span>{weather.condition}</span>
              <strong>{weather.temperature}C</strong>
              <span>{weather.rainfall}mm rain</span>
            </div>
            <p className="muted model-note"><strong>{modelStatus.source}</strong><br />{modelStatus.detail}</p>
          </article>
        </section>

        <section className={`grid two dashboard-grid ${activeTab !== "dashboard" ? "tab-hidden" : ""}`}>
          <article className="panel">
            <div className="panel-title"><CloudSun /><h2>{t("weather")} - {input.region}</h2></div>
            <div className="weather-card">
              <strong>{weather.temperature}C</strong>
              <span>{weather.condition}</span>
              <span>{weather.humidity}% humidity - {weather.rainfall}mm rain - {weather.wind} km/h wind</span>
            </div>
            <p className="muted">{weather.advisory}</p>
            <button className="plain-button compact" onClick={syncWeather}>Apply this city weather to prediction</button>
          </article>
          <article className="panel"><div className="panel-title"><Leaf /><h2>{t("recommendedCrops")}</h2></div><div className="recommend-list">{recommendations.map((item) => <div key={item.name}><strong>{item.name}</strong><span>{item.score}%</span><small>{item.reason}</small></div>)}</div></article>
        </section>

        <section className={`grid compare-layout ${activeTab !== "compare" ? "tab-hidden" : ""}`} id="compare">
          <article className="panel compare-controls">
            <div className="panel-title compact-title"><Scale /><h2>Compare</h2></div>
            <div className="form-grid compact-form"><CropField label="Crop A" value={compare.cropA} onChange={(value) => setCompare((current) => ({ ...current, cropA: value }))} /><CropField label="Crop B" value={compare.cropB} onChange={(value) => setCompare((current) => ({ ...current, cropB: value }))} /></div>
            <div className="decision-banner">
              <span>Best choice</span>
              <strong>{comparison[0]?.crop}</strong>
              <small>{input.region} - {input.season} - {input.soil}</small>
            </div>
          </article>
          <article className="panel">
            <div className="compare-list compact-compare">{comparison.map((item) => <div className={item.crop === comparison[0]?.crop ? "compare-card winner" : "compare-card"} key={item.crop}><div className="compare-head"><strong>{item.crop}</strong><span>{item.score}/100</span></div><div className="compare-metrics"><b>{formatINR(item.predicted)}/q</b><b>{formatINR(item.netReturn)} net</b><b>{item.risk} risk</b></div><div className="badge-row">{item.badges.map((badge) => <span key={badge}>{badge}</span>)}</div><small>{item.advice} {item.rank === 1 && comparison[1] ? `${formatINR(Math.abs(item.margin))} better net return.` : item.reason}</small><div className="score-track"><span style={{ width: `${item.score}%` }} /></div></div>)}</div>
          </article>
        </section>

        <section className={`grid two ${activeTab !== "alerts" ? "tab-hidden" : ""}`} id="alerts">
          <article className="panel">
            <div className="panel-title"><Bell /><h2>{t("setAlert")}</h2></div>
            <div className="form-grid"><CropField label="Crop name" value={alertForm.crop} onChange={(value) => setAlertForm((current) => ({ ...current, crop: value }))} /><SelectField label="Condition" value={alertForm.condition} onChange={(value) => setAlertForm((current) => ({ ...current, condition: value }))} options={["above", "below"]} /><TextField label="Threshold Rs/q" type="number" value={alertForm.threshold} onChange={(value) => setAlertForm((current) => ({ ...current, threshold: value }))} /><SelectField label="State" optional value={alertForm.state} onChange={(value) => setAlertForm((current) => ({ ...current, state: value }))} options={Object.keys(STATES_DISTRICTS)} /></div>
            <button className="primary-action" onClick={addAlert}>{t("addAlert")}</button>
          </article>
          <article className="panel">
            <div className="panel-title"><Bell /><h2>{t("activeAlerts")} ({alerts.length})</h2></div>
            <div className="history-list">{alerts.length === 0 ? <p className="muted">No alerts yet.</p> : alerts.map((alert) => <div key={alert.id}><span>{alert.crop}</span><strong>{alert.condition === "above" ? "Rises above" : "Falls below"} {formatINR(alert.threshold)}/q</strong><small>{alert.state || "All India"} · {alert.createdAt}</small><button onClick={() => setAlerts((current) => current.filter((item) => item.id !== alert.id))}><Trash2 /> Remove</button></div>)}</div>
          </article>
        </section>

        <section className={`grid two ${activeTab !== "health" ? "tab-hidden" : ""}`} id="health">
          <article className="panel">
            <div className="panel-title"><Camera /><h2>{t("healthTitle")}</h2></div>
            <p className="muted">{t("healthHelp")}</p>
            <div className="form-grid"><CropField label={t("cropName")} value={healthCrop} onChange={setHealthCrop} /><label className="field"><span>{t("uploadPhoto")}</span><input type="file" accept="image/*" onChange={(event) => onHealthPhoto(event.target.files?.[0])} /></label></div>
            {healthPreview && <img className="photo-preview" src={healthPreview} alt="Uploaded crop" />}
            <div className="chips">{["Yellow leaves", "Dry soil", "Slow growth", "White spots"].map((symptom) => <button key={symptom} className={symptoms.includes(symptom) ? "active" : ""} onClick={() => setSymptoms((current) => current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom])}>{symptom}</button>)}</div>
          </article>
          <article className="panel"><div className="panel-title"><ShieldCheck /><h2>{t("healthResult")}</h2></div><div className={`guidance severity-${health.severity.toLowerCase()}`}><div className="health-score"><strong>{health.issue}</strong><span>{health.severity} risk - {health.confidence}% confidence</span></div><p>{health.advice}</p><p>{health.prevention}</p></div><div className="action-list">{health.actions.map((action) => <span key={action}>{action}</span>)}</div><div className="model-list"><div><span>Treatment</span><strong>{health.fertilizer}</strong></div>{healthPhoto && <><div><span>{t("localPhotoScan")}</span><strong>{symptoms.join(", ")}</strong></div><div><span>{t("file")}</span><strong>{healthPhoto.name}</strong></div></>}</div><p className="muted">{t("healthNote")}</p></article>
        </section>

        <section className={`grid two ${activeTab !== "history" ? "tab-hidden" : ""}`} id="history">
          <article className="panel"><div className="panel-title"><LineChart /><h2>{t("historicalAnalytics")}</h2></div><TrendChart values={trend} /></article>
          <article className="panel"><div className="panel-title"><History /><h2>Prediction History</h2></div><div className="history-list">{history.length === 0 ? <p className="muted">Save predictions to compare them later with the current situation.</p> : history.map((item) => <div key={item.id}><span>{item.savedAt}</span><strong>{item.input.crop}: {formatINR(item.prediction.predicted)}/q</strong><small>{item.input.region}, {item.input.state} · Current now: {item.input.crop === input.crop ? formatINR(prediction.predicted) : "select same crop to compare"}</small><button onClick={() => setHistory((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 /> Delete</button></div>)}</div></article>
        </section>

        <section className={`grid two ${activeTab !== "profile" ? "tab-hidden" : ""}`}>
          <article className="panel"><div className="panel-title"><Calculator /><h2>{t("profitCalculator")}</h2></div><div className="cost-grid">{Object.entries(costs).map(([key, value]) => <label key={key}><span>{key}</span><input type="number" min="0" value={value} onChange={(event) => setCosts((current) => ({ ...current, [key]: Math.max(0, Number(event.target.value) || 0) }))} /></label>)}</div><div className="profit-strip"><Stat label={t("investment")} value={formatINR(investment)} /><Stat label={t("return")} value={formatINR(expectedReturn)} /><Stat label={t("profit")} value={formatINR(profit)} tone={profit > 0 ? "profit" : "risk"} /></div></article>
          <article className="panel" id="profile"><div className="panel-title"><Users /><h2>{t("profile")}</h2></div><form className="profile-form" onSubmit={saveProfile}><TextField label={t("name")} value={profileForm.name || ""} onChange={(value) => setProfileForm((current) => ({ ...current, name: value }))} /><SelectField label={t("state")} value={profileForm.state || input.state} onChange={(value) => setProfileForm((current) => ({ ...current, state: value, district: STATES_DISTRICTS[value][0] }))} options={Object.keys(STATES_DISTRICTS)} /><SelectField label={t("district")} value={profileForm.district || input.region} onChange={(value) => setProfileForm((current) => ({ ...current, district: value }))} options={STATES_DISTRICTS[profileForm.state || input.state]} /><SelectField label={t("farmSize")} value={profileForm.farmSize || farmSizes[1]} onChange={(value) => setProfileForm((current) => ({ ...current, farmSize: value }))} options={farmSizes} /><SelectField label={t("language")} value={profileForm.lang || language} onChange={(value) => setProfileForm((current) => ({ ...current, lang: value }))} options={Object.keys(LANGS)} /><button className="primary-action" type="submit">{t("save")}</button></form></article>
        </section>

      </section>
      {shareOpen && <ShareSheet text={shareText} onClose={() => setShareOpen(false)} />}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
