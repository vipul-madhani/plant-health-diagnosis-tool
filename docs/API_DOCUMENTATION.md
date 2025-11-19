# Plant Health Diagnosis Tool - API Documentation

## Overview

The Plant Health Diagnosis Tool API provides endpoints for plant image diagnosis, disease identification, treatment recommendations, and geo-aware organic solutions.

## Base URL

```
https://api.plantdiagnosis.com/v1
```

## Authentication

All endpoints require Bearer token authentication in the Authorization header:

```
Authorization: Bearer YOUR_TOKEN_HERE
```

## Endpoints

### 1. Diagnose Plant

**POST** `/diagnosis/analyze`

Analyze a plant image to identify diseases and plant species.

**Request:**
```json
{
  "image_url": "https://example.com/plant.jpg",
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

**Response:**
```json
{
  "status": "success",
  "plant_species": "Tomato (Solanum lycopersicum)",
  "confidence": 0.92,
  "diseases": [
    {
      "name": "Late Blight",
      "confidence": 0.87,
      "severity": "high",
      "description": "Fungal disease affecting tomato leaves"
    }
  ],
  "recommendations": {
    "immediate_actions": ["Remove infected leaves", "Improve air circulation"],
    "organic_treatments": ["Copper fungicide", "Neem oil"],
    "preventive_measures": ["Water at soil level", "Avoid overhead watering"]
  },
  "geo_solutions": [
    {
      "solution": "Local organic farmer co-op",
      "distance_km": 2.5,
      "contact": "info@localfarm.com"
    }
  ]
}
```

### 2. Get Treatment Options

**GET** `/treatments/{disease_id}`

Get detailed treatment options for a specific disease.

**Response:**
```json
{
  "disease_id": "late_blight_001",
  "disease_name": "Late Blight",
  "organic_treatments": [
    {
      "name": "Copper Sulfate",
      "dosage": "2-3 tbsp per gallon",
      "frequency": "Every 7-10 days",
      "effectiveness": 0.85
    }
  ]
}
```

### 3. Community Validation

**POST** `/community/validate`

Submit diagnosis for community validation and crowd-sourced feedback.

**Request:**
```json
{
  "diagnosis_id": "diag_123",
  "confidence_rating": 8,
  "feedback": "Matches my plant symptoms"
}
```

## Error Handling

| Status Code | Meaning |
|-------------|----------|
| 200 | Success |
| 400 | Bad Request |
| 401 | Unauthorized |
| 404 | Not Found |
| 500 | Server Error |

## Rate Limiting

- 100 requests per minute for authenticated users
- 10 requests per minute for unauthenticated requests

## Implementation

For implementation details, see the backend API code in `/backend-api`.
