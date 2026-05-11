import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Bell,
  Bot,
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
  MapPin,
  Mic,
  Scale,
  Send,
  ShieldCheck,
  Sprout,
  Trash2,
  TrendingUp,
  UserPlus,
  Users,
} from "lucide-react";
import { buildTrend, compareCities, compareCropChoices, diagnoseHealth, predictPrice, recommendCrops, crops } from "./mlEngine.js";
import "./styles.css";

const STATES_DISTRICTS = {
  "Andhra Pradesh": ["Alluri Sitharama Raju", "Anakapalli", "Anantapur", "Bapatla", "Chittoor", "East Godavari", "Eluru", "Guntur", "Kakinada", "Krishna", "Kurnool", "Nandyal", "Nellore", "Palnadu", "Prakasam", "Sri Sathya Sai", "Srikakulam", "Tirupati", "Visakhapatnam", "Vizianagaram", "West Godavari", "YSR Kadapa"],
  "Arunachal Pradesh": ["Anjaw", "Changlang", "East Kameng", "East Siang", "Itanagar Capital Complex", "Kamle", "Kurung Kumey", "Lohit", "Longding", "Lower Dibang Valley", "Lower Siang", "Lower Subansiri", "Namsai", "Pakke Kessang", "Papum Pare", "Shi Yomi", "Siang", "Tawang", "Tirap", "Upper Dibang Valley", "Upper Siang", "Upper Subansiri", "West Kameng", "West Siang"],
  Assam: ["Baksa", "Barpeta", "Biswanath", "Bongaigaon", "Cachar", "Charaideo", "Darrang", "Dhemaji", "Dhubri", "Dibrugarh", "Goalpara", "Golaghat", "Guwahati", "Hailakandi", "Hojai", "Jorhat", "Kamrup", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Morigaon", "Nagaon", "Nalbari", "Sivasagar", "Sonitpur", "Tinsukia", "Udalguri"],
  Bihar: ["Araria", "Aurangabad", "Banka", "Begusarai", "Bhagalpur", "Bhojpur", "Buxar", "Darbhanga", "Gaya", "Gopalganj", "Jamui", "Jehanabad", "Katihar", "Khagaria", "Kishanganj", "Madhubani", "Munger", "Muzaffarpur", "Nalanda", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Siwan", "Vaishali"],
  Chhattisgarh: ["Balod", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bijapur", "Bilaspur", "Dantewada", "Dhamtari", "Durg", "Gariaband", "Janjgir-Champa", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Korea", "Mahasamund", "Mungeli", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"],
  Goa: ["North Goa", "South Goa"],
  Gujarat: ["Ahmedabad", "Amreli", "Anand", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Dahod", "Devbhoomi Dwarka", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch", "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha", "Surat", "Surendranagar", "Vadodara", "Valsad"],
  Haryana: ["Ambala", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurugram", "Hisar", "Jhajjar", "Jind", "Kaithal", "Karnal", "Kurukshetra", "Mahendragarh", "Nuh", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa", "Sonipat", "Yamunanagar"],
  "Himachal Pradesh": ["Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur", "Solan", "Una"],
  Jharkhand: ["Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla", "Hazaribagh", "Jamtara", "Khunti", "Koderma", "Latehar", "Lohardaga", "Palamu", "Ramgarh", "Ranchi", "Sahibganj", "Saraikela Kharsawan", "Simdega", "West Singhbhum"],
  Karnataka: ["Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikkaballapur", "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davangere", "Dharwad", "Gadag", "Hassan", "Haveri", "Kalaburagi", "Kodagu", "Kolar", "Koppal", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi", "Vijayapura", "Yadgir"],
  Kerala: ["Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram", "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"],
  "Madhya Pradesh": ["Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur", "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Guna", "Gwalior", "Hoshangabad", "Indore", "Jabalpur", "Katni", "Khandwa", "Khargone", "Mandsaur", "Morena", "Narsinghpur", "Neemuch", "Raisen", "Rewa", "Sagar", "Satna", "Sehore", "Shivpuri", "Ujjain", "Vidisha"],
  Maharashtra: ["Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Buldhana", "Chandrapur", "Dhule", "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kolhapur", "Latur", "Mumbai", "Nagpur", "Nanded", "Nandurbar", "Nashik", "Osmanabad", "Palghar", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara", "Solapur", "Thane", "Wardha", "Washim", "Yavatmal"],
  Manipur: ["Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kangpokpi", "Noney", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"],
  Meghalaya: ["East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills", "South West Garo Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"],
  Mizoram: ["Aizawl", "Champhai", "Kolasib", "Lawngtlai", "Lunglei", "Mamit", "Saiha", "Serchhip"],
  Nagaland: ["Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Peren", "Phek", "Tuensang", "Wokha", "Zunheboto"],
  Odisha: ["Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Bhubaneswar", "Boudh", "Cuttack", "Dhenkanal", "Ganjam", "Jagatsinghpur", "Jajpur", "Kalahandi", "Kendrapara", "Keonjhar", "Koraput", "Mayurbhanj", "Nabarangpur", "Puri", "Rayagada", "Sambalpur", "Sundargarh"],
  Punjab: ["Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur", "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Muktsar", "Patiala", "Rupnagar", "Sangrur", "Tarn Taran"],
  Rajasthan: ["Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh", "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunu", "Jodhpur", "Kota", "Nagaur", "Pali", "Sikar", "Tonk", "Udaipur"],
  Sikkim: ["East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"],
  "Tamil Nadu": ["Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Kanchipuram", "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai", "Ramanathapuram", "Salem", "Sivaganga", "Thanjavur", "Theni", "Tiruchirappalli", "Tirunelveli", "Tiruppur", "Vellore", "Virudhunagar"],
  Telangana: ["Adilabad", "Bhadradri Kothagudem", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Kamareddy", "Karimnagar", "Khammam", "Mahabubabad", "Mahbubnagar", "Medak", "Medchal Malkajgiri", "Nalgonda", "Nizamabad", "Rangareddy", "Sangareddy", "Siddipet", "Suryapet", "Warangal"],
  Tripura: ["Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"],
  "Uttar Pradesh": ["Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amethi", "Ayodhya", "Azamgarh", "Baghpat", "Bahraich", "Ballia", "Banda", "Barabanki", "Bareilly", "Basti", "Bijnor", "Bulandshahr", "Deoria", "Etawah", "Farrukhabad", "Fatehpur", "Ghaziabad", "Ghazipur", "Gorakhpur", "Hardoi", "Jaunpur", "Jhansi", "Kanpur", "Lakhimpur Kheri", "Lucknow", "Mathura", "Meerut", "Moradabad", "Muzaffarnagar", "Prayagraj", "Raebareli", "Rampur", "Saharanpur", "Sitapur", "Sultanpur", "Unnao", "Varanasi"],
  Uttarakhand: ["Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh", "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"],
  "West Bengal": ["Alipurduar", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Hooghly", "Howrah", "Jalpaiguri", "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "North 24 Parganas", "Paschim Bardhaman", "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "South 24 Parganas", "Uttar Dinajpur"],
  "Andaman and Nicobar Islands": ["Nicobar", "North and Middle Andaman", "South Andaman"],
  Chandigarh: ["Chandigarh"],
  "Dadra and Nagar Haveli and Daman and Diu": ["Dadra and Nagar Haveli", "Daman", "Diu"],
  Delhi: ["Central Delhi", "East Delhi", "New Delhi", "North Delhi", "Shahdara", "South Delhi", "West Delhi"],
  "Jammu and Kashmir": ["Anantnag", "Baramulla", "Budgam", "Doda", "Jammu", "Kathua", "Kishtwar", "Kupwara", "Pulwama", "Rajouri", "Samba", "Srinagar", "Udhampur"],
  Ladakh: ["Kargil", "Leh"],
  Lakshadweep: ["Lakshadweep"],
  Puducherry: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
};

const LANGS = {
  en: { name: "English", label: "EN" },
  hi: { name: "Hindi", label: "हि" },
  mr: { name: "Marathi", label: "मर" },
  ta: { name: "Tamil", label: "த" },
  te: { name: "Telugu", label: "తె" },
  bn: { name: "Bengali", label: "বা" },
  gu: { name: "Gujarati", label: "ગુ" },
  kn: { name: "Kannada", label: "ಕ" },
  ml: { name: "Malayalam", label: "മ" },
  pa: { name: "Punjabi", label: "ਪੰ" },
  or: { name: "Odia", label: "ଓ" },
  as: { name: "Assamese", label: "অ" },
  ur: { name: "Urdu", label: "اُ" },
  ne: { name: "Nepali", label: "ने" },
  kok: { name: "Konkani", label: "Ko" },
  mai: { name: "Maithili", label: "मै" },
  sa: { name: "Sanskrit", label: "सं" },
  sd: { name: "Sindhi", label: "سن" },
  ks: { name: "Kashmiri", label: "کش" },
  mni: { name: "Manipuri", label: "মৈ" },
  brx: { name: "Bodo", label: "बो" },
  sat: { name: "Santali", label: "ᱥᱟ" },
  doi: { name: "Dogri", label: "डो" },
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
    mandiComparison: "Mandi Comparison",
    recommendedCrops: "Recommended Crops",
    compareTitle: "Should I grow this or that?",
    compareHelp: "Compare two crops for your state, district, season, soil, weather, fit, demand, risk, and expected return.",
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
    voiceInput: "Voice Input",
    voiceReady: "Ready for mobile speech-to-text integration.",
    chatbot: "AI Chatbot",
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
    mandiComparison: "मंडी तुलना",
    recommendedCrops: "सुझाई गई फसलें",
    compareTitle: "यह उगाऊं या वह?",
    compareHelp: "अपने राज्य, जिला, मौसम, मिट्टी, मांग, जोखिम और रिटर्न के आधार पर दो फसलों की तुलना करें.",
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
    voiceInput: "वॉइस इनपुट",
    voiceReady: "मोबाइल स्पीच-टू-टेक्स्ट के लिए तैयार.",
    chatbot: "एआई चैटबॉट",
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
    mandiComparison: "बाजार तुलना",
    recommendedCrops: "सुचवलेली पिके",
    compareTitle: "हे पीक घ्यावे की ते?",
    compareHelp: "तुमच्या राज्य, जिल्हा, हंगाम, माती, मागणी, जोखीम आणि परताव्यानुसार दोन पिकांची तुलना करा.",
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
    voiceInput: "वॉइस इनपुट",
    voiceReady: "मोबाइल स्पीच-टू-टेक्स्टसाठी तयार.",
    chatbot: "एआय चॅटबॉट",
  },
};

Object.keys(LANGS).forEach((code) => {
  UI[code] = UI[code] || { ...UI.en };
});

const ALL_CROPS = Object.keys(crops);
const soilOptions = ["Black soil", "Red soil", "Alluvial soil", "Sandy soil", "Clay soil"];
const seasonOptions = ["Kharif", "Rabi", "Zaid"];
const farmSizes = ["< 1 acre", "1-2 acres", "2-5 acres", "5-10 acres", "10+ acres"];
const defaultUser = { name: "Farmer", mobile: "", email: "demo@farm.ai", state: "Maharashtra", district: "Pune", farmSize: "2-5 acres", lang: "en", notifications: true };
const initialInput = { crop: "Tomato", soil: "Red soil", temperature: 29, humidity: 62, rainfall: 48, state: "Maharashtra", region: "Pune", season: "Zaid", forecastDays: 5, yieldQty: 11 };

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
  const [form, setForm] = useState({ name: "", email: "demo@farm.ai", mobile: "", password: "", state: "Maharashtra", district: "Pune", farmSize: "2-5 acres", lang: "en" });
  const [error, setError] = useState("");

  function update(key, value) {
    setForm((current) => key === "state" ? { ...current, state: value, district: STATES_DISTRICTS[value][0] } : { ...current, [key]: value });
  }

  function submit(event) {
    event.preventDefault();
    if (!form.email || !form.password) {
      setError("Email/mobile and password are required.");
      return;
    }
    const users = readStored("farm-users", []);
    if (mode === "register") {
      const user = { ...defaultUser, ...form, name: form.name || "Farmer", createdAt: new Date().toISOString() };
      writeStored("farm-users", [user, ...users.filter((item) => item.email !== user.email)]);
      writeStored("farm-session", user);
      onAuth(user);
      return;
    }
    const found = users.find((item) => item.email === form.email) ?? { ...defaultUser, email: form.email, lang: form.lang };
    writeStored("farm-session", found);
    onAuth(found);
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand auth-brand"><Leaf /><div><strong>AI Market Price Predictor</strong><span>Secure farmer workspace</span></div></div>
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}><LogIn /> Login</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}><UserPlus /> Register</button>
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
          <button className="primary-action" type="submit">{mode === "login" ? "Login" : "Create account"}</button>
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
  const [input, setInput] = useState(() => readStored("market-input", initialInput));
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
  const prediction = useMemo(() => predictPrice(input), [input]);
  const trend = useMemo(() => buildTrend(input.crop, input.region), [input.crop, input.region]);
  const cityPrices = useMemo(() => compareCities(input.crop), [input.crop]);
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
Demand: ${prediction.demand}
Risk: ${prediction.risk}
Sell guidance: ${prediction.sellingWindow}
Confidence: ${prediction.confidence}%`;

  useEffect(() => writeStored("market-input", input), [input]);
  useEffect(() => writeStored("market-language", language), [language]);
  useEffect(() => writeStored("price-alerts", alerts), [alerts]);
  useEffect(() => writeStored("prediction-history", history), [history]);

  if (!user) return <AuthScreen onAuth={(nextUser) => { setUser(nextUser); setLanguage(nextUser.lang || "en"); }} />;

  function updateInput(key, value) {
    setInput((current) => {
      if (key === "state") return { ...current, state: value, region: STATES_DISTRICTS[value][0] };
      return { ...current, [key]: value };
    });
  }

  function savePrediction() {
    const item = { id: Date.now(), savedAt: new Date().toLocaleString(), input, prediction };
    setHistory((current) => [item, ...current].slice(0, 30));
  }

  function addAlert() {
    const threshold = Math.max(1, Number(alertForm.threshold) || 0);
    setAlerts((current) => [{ id: Date.now(), crop: alertForm.crop || input.crop, condition: alertForm.condition, threshold, state: alertForm.state, createdAt: new Date().toLocaleDateString() }, ...current]);
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

        <section className={`grid two ${activeTab !== "prediction" ? "tab-hidden" : ""}`} id="prediction">
          <article className="panel">
            <div className="panel-title"><Sprout /><h2>{t("pricePrediction")}</h2></div>
            <div className="form-grid">
              <CropField label={t("crop")} value={input.crop} onChange={(value) => updateInput("crop", value)} />
              <SelectField label={t("state")} value={input.state} onChange={(value) => updateInput("state", value)} options={Object.keys(STATES_DISTRICTS)} />
              <SelectField label={t("district")} value={input.region} onChange={(value) => updateInput("region", value)} options={districtOptions} />
              <SelectField label={t("season")} value={input.season} onChange={(value) => updateInput("season", value)} options={seasonOptions} />
              <SelectField label={t("soil")} value={input.soil} onChange={(value) => updateInput("soil", value)} options={soilOptions} />
              <NumberField label={t("temperature")} value={input.temperature} min={12} max={44} unit="C" onChange={(value) => updateInput("temperature", value)} />
              <NumberField label={t("humidity")} value={input.humidity} min={20} max={95} unit="%" onChange={(value) => updateInput("humidity", value)} />
              <NumberField label={t("rainfall")} value={input.rainfall} min={0} max={140} unit="mm" onChange={(value) => updateInput("rainfall", value)} />
              <NumberField label={t("forecast")} value={input.forecastDays} min={1} max={15} unit="d" onChange={(value) => updateInput("forecastDays", value)} />
              <NumberField label={t("expectedYield")} value={input.yieldQty} min={1} max={120} unit="q" onChange={(value) => updateInput("yieldQty", value)} />
            </div>
          </article>
          <article className="panel result-panel">
            <div className="price-tag"><span>{t("predictedPrice")}</span><strong>{formatINR(prediction.predicted)}</strong><small>{t("perQuintal")}</small></div>
            <div className="stats-row"><Stat label={t("current")} value={formatINR(prediction.current)} /><Stat label={t("change")} value={`${prediction.change}%`} tone={prediction.change >= 0 ? "profit" : "risk"} /><Stat label={t("confidence")} value={`${prediction.confidence}%`} /></div>
            <div className="model-list">{prediction.models.map((model) => <div key={model.name}><span>{model.name}</span><strong>{formatINR(model.value)}</strong></div>)}</div>
          </article>
        </section>

        <section className={`grid three ${activeTab !== "dashboard" ? "tab-hidden" : ""}`}>
          <article className="panel"><div className="panel-title"><CloudSun /><h2>Weather</h2></div><div className="weather-card"><strong>{input.temperature}C</strong><span>{input.humidity}% humidity</span><span>{input.rainfall}mm rainfall</span></div><p className="muted">Rain alert: {input.rainfall > 75 ? "High rainfall expected, watch disease risk." : "No severe rain warning."}</p></article>
          <article className="panel"><div className="panel-title"><MapPin /><h2>Mandi Comparison</h2></div><div className="city-list">{cityPrices.slice(0, 6).map((item, index) => <div key={item.city}><span>{index === 0 ? "Best" : item.city}</span><strong>{item.city}: {formatINR(item.price)}</strong></div>)}</div></article>
          <article className="panel"><div className="panel-title"><Leaf /><h2>Recommended Crops</h2></div><div className="recommend-list">{recommendations.map((item) => <div key={item.name}><strong>{item.name}</strong><span>{item.score}% match</span><small>{item.reason}</small></div>)}</div></article>
        </section>

        <section className={`grid two ${activeTab !== "compare" ? "tab-hidden" : ""}`} id="compare">
          <article className="panel">
            <div className="panel-title"><Scale /><h2>Should I Grow This or That?</h2></div>
            <div className="form-grid"><CropField label="Crop A" value={compare.cropA} onChange={(value) => setCompare((current) => ({ ...current, cropA: value }))} /><CropField label="Crop B" value={compare.cropB} onChange={(value) => setCompare((current) => ({ ...current, cropB: value }))} /></div>
          </article>
          <article className="panel">
            <div className="compare-list">{comparison.map((item, index) => <div className={index === 0 ? "compare-card winner" : "compare-card"} key={item.crop}><span>{index === 0 ? "Recommended" : "Alternative"}</span><strong>{item.crop}</strong><p>{formatINR(item.predicted)}/q · {item.fit}% fit · {item.demand} demand · {item.risk} risk</p><small>{item.reason}</small></div>)}</div>
          </article>
        </section>

        <section className={`grid two ${activeTab !== "alerts" ? "tab-hidden" : ""}`} id="alerts">
          <article className="panel">
            <div className="panel-title"><Bell /><h2>Set Price Alert</h2></div>
            <div className="form-grid"><CropField label="Crop name" value={alertForm.crop} onChange={(value) => setAlertForm((current) => ({ ...current, crop: value }))} /><SelectField label="Condition" value={alertForm.condition} onChange={(value) => setAlertForm((current) => ({ ...current, condition: value }))} options={["above", "below"]} /><TextField label="Threshold Rs/q" type="number" value={alertForm.threshold} onChange={(value) => setAlertForm((current) => ({ ...current, threshold: value }))} /><SelectField label="State" optional value={alertForm.state} onChange={(value) => setAlertForm((current) => ({ ...current, state: value }))} options={Object.keys(STATES_DISTRICTS)} /></div>
            <button className="primary-action" onClick={addAlert}>Add Alert</button>
          </article>
          <article className="panel">
            <div className="panel-title"><Bell /><h2>Active Alerts ({alerts.length})</h2></div>
            <div className="history-list">{alerts.length === 0 ? <p className="muted">No alerts yet.</p> : alerts.map((alert) => <div key={alert.id}><span>{alert.crop}</span><strong>{alert.condition === "above" ? "Rises above" : "Falls below"} {formatINR(alert.threshold)}/q</strong><small>{alert.state || "All India"} · {alert.createdAt}</small><button onClick={() => setAlerts((current) => current.filter((item) => item.id !== alert.id))}><Trash2 /> Remove</button></div>)}</div>
          </article>
        </section>

        <section className={`grid two ${activeTab !== "health" ? "tab-hidden" : ""}`} id="health">
          <article className="panel">
            <div className="panel-title"><Camera /><h2>Crop Photo Health Predictor</h2></div>
            <div className="form-grid"><CropField label="Crop name" value={healthCrop} onChange={setHealthCrop} /><label className="field"><span>Upload crop photo</span><input type="file" accept="image/*" onChange={(event) => onHealthPhoto(event.target.files?.[0])} /></label></div>
            {healthPreview && <img className="photo-preview" src={healthPreview} alt="Uploaded crop" />}
            <div className="chips">{["Yellow leaves", "Dry soil", "Slow growth", "White spots"].map((symptom) => <button key={symptom} className={symptoms.includes(symptom) ? "active" : ""} onClick={() => setSymptoms((current) => current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom])}>{symptom}</button>)}</div>
          </article>
          <article className="panel"><div className="panel-title"><ShieldCheck /><h2>Health Result</h2></div><div className="guidance"><strong>{health.issue}</strong><span>{health.fertilizer}</span><p>{health.advice} {health.prevention}</p></div>{healthPhoto && <div className="model-list"><div><span>Local photo scan</span><strong>{symptoms.join(", ")}</strong></div><div><span>File</span><strong>{healthPhoto.name}</strong></div></div>}<p className="muted">The photo scan runs locally using color signals. A production app can replace this with a secure backend vision model.</p></article>
        </section>

        <section className={`grid two ${activeTab !== "history" ? "tab-hidden" : ""}`} id="history">
          <article className="panel"><div className="panel-title"><LineChart /><h2>Historical Analytics</h2></div><TrendChart values={trend} /></article>
          <article className="panel"><div className="panel-title"><History /><h2>Prediction History</h2></div><div className="history-list">{history.length === 0 ? <p className="muted">Save predictions to compare them later with the current situation.</p> : history.map((item) => <div key={item.id}><span>{item.savedAt}</span><strong>{item.input.crop}: {formatINR(item.prediction.predicted)}/q</strong><small>{item.input.region}, {item.input.state} · Current now: {item.input.crop === input.crop ? formatINR(prediction.predicted) : "select same crop to compare"}</small><button onClick={() => setHistory((current) => current.filter((entry) => entry.id !== item.id))}><Trash2 /> Delete</button></div>)}</div></article>
        </section>

        <section className={`grid three ${activeTab !== "profile" ? "tab-hidden" : ""}`}>
          <article className="panel"><div className="panel-title"><Calculator /><h2>Profit Calculator</h2></div><div className="cost-grid">{Object.entries(costs).map(([key, value]) => <label key={key}><span>{key}</span><input type="number" min="0" value={value} onChange={(event) => setCosts((current) => ({ ...current, [key]: Math.max(0, Number(event.target.value) || 0) }))} /></label>)}</div><div className="profit-strip"><Stat label="Investment" value={formatINR(investment)} /><Stat label="Return" value={formatINR(expectedReturn)} /><Stat label="Profit" value={formatINR(profit)} tone={profit > 0 ? "profit" : "risk"} /></div></article>
          <article className="panel"><div className="panel-title"><Bot /><h2>AI Chatbot</h2></div><div className="chat-box"><p>Farmer: Should I sell {input.crop}?</p><strong>Assistant: {prediction.sellingWindow}. Demand is {prediction.demand.toLowerCase()} and risk is {prediction.risk.toLowerCase()}.</strong></div></article>
          <article className="panel" id="profile"><div className="panel-title"><Users /><h2>Profile</h2></div><div className="model-list"><div><span>Name</span><strong>{user.name}</strong></div><div><span>Location</span><strong>{user.district}, {user.state}</strong></div><div><span>Farm size</span><strong>{user.farmSize}</strong></div><div><span>Language</span><strong>{LANGS[language]?.name}</strong></div></div></article>
        </section>

        <section className={`grid three ${activeTab !== "profile" ? "tab-hidden" : ""}`} id="community">
          <article className="panel"><div className="panel-title"><Mic /><h2>Voice Input</h2></div><button className="voice-button">Predict {input.crop} price in {input.region}</button><p className="muted">Ready for mobile speech-to-text integration.</p></article>
        </section>
      </section>
      {shareOpen && <ShareSheet text={shareText} onClose={() => setShareOpen(false)} />}