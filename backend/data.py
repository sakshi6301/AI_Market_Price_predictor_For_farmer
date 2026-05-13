from __future__ import annotations


CROPS = {
    "Wheat": {"base": 2425, "volatility": 0.08, "demand": 0.73, "season": "Rabi", "soil": "Alluvial soil", "water_need": "Medium"},
    "Rice": {"base": 3100, "volatility": 0.10, "demand": 0.78, "season": "Kharif", "soil": "Clay soil", "water_need": "High"},
    "Corn/Maize": {"base": 2250, "volatility": 0.12, "demand": 0.70, "season": "Kharif", "soil": "Alluvial soil", "water_need": "Medium"},
    "Soybean": {"base": 4550, "volatility": 0.13, "demand": 0.66, "season": "Kharif", "soil": "Black soil", "water_need": "Medium"},
    "Cotton": {"base": 6500, "volatility": 0.11, "demand": 0.69, "season": "Kharif", "soil": "Black soil", "water_need": "Medium"},
    "Tomato": {"base": 2200, "volatility": 0.19, "demand": 0.76, "season": "Zaid", "soil": "Red soil", "water_need": "Medium"},
    "Onion": {"base": 1850, "volatility": 0.24, "demand": 0.82, "season": "Rabi", "soil": "Black soil", "water_need": "Low"},
    "Potato": {"base": 1600, "volatility": 0.17, "demand": 0.71, "season": "Rabi", "soil": "Sandy soil", "water_need": "Medium"},
    "Sugarcane": {"base": 3550, "volatility": 0.07, "demand": 0.74, "season": "Kharif", "soil": "Black soil", "water_need": "High"},
    "Mustard": {"base": 5450, "volatility": 0.10, "demand": 0.73, "season": "Rabi", "soil": "Alluvial soil", "water_need": "Low"},
    "Groundnut": {"base": 6800, "volatility": 0.14, "demand": 0.68, "season": "Kharif", "soil": "Sandy soil", "water_need": "Low"},
    "Chilli": {"base": 10500, "volatility": 0.22, "demand": 0.79, "season": "Zaid", "soil": "Red soil", "water_need": "Medium"},
    "Turmeric": {"base": 12800, "volatility": 0.20, "demand": 0.80, "season": "Kharif", "soil": "Red soil", "water_need": "Medium"},
    "Garlic": {"base": 9200, "volatility": 0.25, "demand": 0.81, "season": "Rabi", "soil": "Alluvial soil", "water_need": "Low"},
    "Mango": {"base": 5200, "volatility": 0.21, "demand": 0.84, "season": "Zaid", "soil": "Red soil", "water_need": "Low"},
    "Banana": {"base": 1800, "volatility": 0.15, "demand": 0.75, "season": "Kharif", "soil": "Alluvial soil", "water_need": "High"},
    "Grapes": {"base": 6100, "volatility": 0.20, "demand": 0.78, "season": "Zaid", "soil": "Black soil", "water_need": "Medium"},
    "Pomegranate": {"base": 7800, "volatility": 0.22, "demand": 0.80, "season": "Zaid", "soil": "Sandy soil", "water_need": "Low"},
}

CITY_MULTIPLIERS = {
    "Pune": 1.00,
    "Mumbai": 1.12,
    "Nashik": 0.96,
    "Nagpur": 0.92,
    "Delhi": 1.08,
    "Bangalore": 1.04,
    "Hyderabad": 1.03,
    "Ahmedabad": 1.06,
    "Ludhiana": 1.02,
    "Indore": 0.98,
    "Jaipur": 1.01,
    "Lucknow": 0.99,
    "Patna": 0.95,
    "Kolkata": 1.05,
    "Chennai": 1.07,
    "Bhopal": 0.97,
    "Raipur": 0.94,
    "Bhubaneswar": 0.96,
    "Kochi": 1.10,
    "Guwahati": 1.03,
}

STATES = [
    "Maharashtra",
    "Karnataka",
    "Telangana",
    "Gujarat",
    "Rajasthan",
    "Kerala",
    "Tamil Nadu",
    "Punjab",
    "Haryana",
    "Uttar Pradesh",
    "Bihar",
    "West Bengal",
    "Odisha",
    "Assam",
    "Delhi",
]

SOILS = ["Black soil", "Red soil", "Alluvial soil", "Sandy soil", "Clay soil"]
SEASONS = ["Kharif", "Rabi", "Zaid"]

SOIL_FIT = {
    "Black soil": {"Cotton": 1.16, "Soybean": 1.12, "Onion": 1.08, "Wheat": 1.02, "Grapes": 1.06},
    "Red soil": {"Tomato": 1.13, "Potato": 1.05, "Rice": 0.94, "Mango": 1.08, "Chilli": 1.07, "Turmeric": 1.08},
    "Alluvial soil": {"Rice": 1.12, "Wheat": 1.11, "Corn/Maize": 1.08, "Mustard": 1.04, "Banana": 1.07, "Garlic": 1.05},
    "Sandy soil": {"Potato": 1.14, "Tomato": 1.06, "Onion": 0.97, "Groundnut": 1.08, "Pomegranate": 1.08},
    "Clay soil": {"Rice": 1.16, "Wheat": 1.09, "Cotton": 0.96, "Sugarcane": 1.04},
}


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def crop_profile(crop: str) -> dict:
    return CROPS.get(crop, CROPS["Tomato"])
