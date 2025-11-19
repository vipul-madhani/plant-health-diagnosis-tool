# System Architecture - Plant Health Diagnosis Tool

## Overview

The Plant Health Diagnosis Tool is a comprehensive AI-powered system designed to diagnose plant health issues through image analysis. This document details the system architecture, components, APIs, and data flow.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
├──────────────────────┬──────────────────┬──────────────────┤
│  Web App (React)     │  Mobile App      │  Admin Dashboard │
│  - Plant diagnosis   │  (React Native)  │  - Analytics     │
│  - Image upload      │  - AR guides     │  - User mgmt     │
│  - Treatment advice  │  - Offline mode  │  - Reporting     │
└──────────────────────┴──────────────────┴──────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                         │
│              (Flask REST API - Port 5000)                   │
├──────────────────────────────────────────────────────────────┤
│ • Request routing & validation                              │
│ • Authentication & authorization                            │
│ • Rate limiting & caching                                  │
│ • CORS handling                                             │
└──────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────┬────────────────────┬────────────────┐
│  ML/AI Layer         │  Business Logic    │  Data Layer    │
├──────────────────────┼────────────────────┼────────────────┤
│ • TensorFlow Models  │ • Diagnosis Engine │ • Firebase DB  │
│ • Image Processing   │ • Treatment Recs   │ • Cloud Storage│
│ • OpenCV Pipeline    │ • Validation Logic │ • Caching      │
│ • Feature Extraction │ • Geo-aware Logic  │ • User data    │
└──────────────────────┴────────────────────┴────────────────┘
```

## Component Architecture

### 1. Frontend Layer

#### Web Application (React)
- **Framework**: React.js with TypeScript
- **State Management**: Redux or Context API
- **UI Library**: Material-UI or Ant Design
- **Real-time Updates**: WebSocket connections
- **Key Features**:
  - Image upload with drag-and-drop
  - Real-time diagnosis results
  - Treatment recommendation display
  - Plant disease database browsing
  - User community interactions

#### Mobile Application (React Native)
- **Framework**: React Native with Expo
- **Platform Support**: iOS and Android
- **Offline Capability**: Local diagnosis model caching
- **AR Integration**: ARKit (iOS) and ARCore (Android)
- **Key Features**:
  - Camera integration for real-time plant scanning
  - AR-based treatment guides
  - Offline plant identification
  - Geolocation-based recommendations
  - Push notifications for plant care reminders

### 2. API Gateway Layer (Flask REST API)

Running on `http://localhost:5000` (development) or deployed on Render/Railway (production)

#### Core Endpoints

**Health Check**
```
GET /api/health
Response:
{
  "status": "healthy",
  "service": "Plant Health Diagnosis API",
  "version": "1.0.0"
}
```

**Plant Diagnosis**
```
POST /api/diagnose
Request:
{
  "image": <binary_image_data>,
  "latitude": 40.7128,
  "longitude": -74.0060,
  "user_id": "uuid"
}
Response:
{
  "primary_diagnosis": {
    "disease_name": "Powdery Mildew",
    "confidence": 0.92,
    "severity": "moderate",
    "affected_areas": 0.35
  },
  "secondary_diagnoses": [
    {"disease_name": "Rust", "confidence": 0.15}
  ],
  "treatment_recommendations": [
    {
      "treatment": "Organic sulfur spray",
      "availability_nearby": true,
      "cost_range": "$5-15"
    }
  ],
  "image_quality_score": 0.85,
  "requires_expert_review": false
}
```

**Get Plant Species**
```
GET /api/species
Response:
[
  {"id": 1, "name": "Tomato", "scientific_name": "Solanum lycopersicum"},
  {"id": 2, "name": "Lettuce", "scientific_name": "Lactuca sativa"}
]
```

**Community Validation**
```
POST /api/diagnoses/{id}/validate
Request:
{
  "expert_id": "uuid",
  "validation_result": "confirmed",
  "notes": "Confirmed powdery mildew infection"
}
```

**Treatment Feedback**
```
POST /api/treatments/{id}/feedback
Request:
{
  "user_id": "uuid",
  "effectiveness": 8,
  "notes": "Worked well, plant recovered",
  "timestamp": "2025-01-20T10:30:00Z"
}
```

### 3. ML/AI Layer

#### Image Processing Pipeline
```python
1. Image Validation
   - Size: 224x224 (standardized for model)
   - Format: JPEG/PNG
   - Quality check: Blur detection, lighting analysis

2. Preprocessing
   - Normalization: Mean subtraction, scaling
   - Augmentation: Rotation, flipping, color jittering
   - Enhancement: Histogram equalization, CLAHE

3. Feature Extraction
   - Color histograms
   - Texture features (GLCM)
   - Shape descriptors
   - Bag-of-words from pre-trained CNN

4. Model Inference
   - Input: Preprocessed image
   - Model: TensorFlow CNN (ResNet50 or EfficientNet)
   - Output: Disease probability distribution

5. Post-processing
   - Confidence thresholding
   - Ensemble voting (multi-model)
   - Uncertainty estimation
```

#### Model Architecture

**Primary Diagnosis Model**
- Base: ResNet50 (pre-trained on ImageNet)
- Fine-tuning dataset: PlantVillage (54K images)
- Classes: 38 plant disease categories
- Accuracy: ~96% on test set
- Inference time: <500ms on CPU

**Secondary Diagnosis Model**
- Purpose: Detect co-occurring diseases
- Approach: Multi-label classification
- Classes: Disease pairs/combinations
- Improves treatment recommendations

**Image Quality Assessment Model**
- Evaluates: Blur, lighting, composition
- Provides confidence score (0-1)
- Flags images requiring re-capture

### 4. Business Logic Layer

#### Diagnosis Engine
```python
class DiagnosisEngine:
    def diagnose(image, geo_data):
        1. Validate image quality
        2. Run primary diagnosis
        3. Run secondary diagnosis (if primary < 0.95)
        4. Generate treatment recommendations
        5. Apply geo-aware filtering
        6. Compile results
        return diagnosis_result
```

#### Treatment Recommendation System
- **Data Source**: Treatment database + community feedback
- **Filtering**: By location, season, organic/conventional preference
- **Ranking**: By effectiveness rating + availability
- **Integration**: Local business partnerships for sourcing

#### Community Validation System
- Experts review high-uncertainty diagnoses
- Feedback loop improves model over time
- Reputation system for community contributors
- Crowdsourced treatment effectiveness data

### 5. Data Layer

#### Database Schema

**Users Table**
```sql
users (
  id UUID PRIMARY KEY,
  email STRING UNIQUE,
  password_hash STRING,
  name STRING,
  location GEOGRAPHY,
  preferences JSON,
  created_at TIMESTAMP
)
```

**Diagnoses Table**
```sql
diagnoses (
  id UUID PRIMARY KEY,
  user_id UUID FOREIGN KEY,
  image_url STRING,
  primary_disease STRING,
  confidence FLOAT,
  secondary_diseases JSON,
  validation_status ENUM,
  created_at TIMESTAMP,
  SPATIAL INDEX (location)
)
```

**Treatment Feedback Table**
```sql
treatment_feedback (
  id UUID PRIMARY KEY,
  diagnosis_id UUID FOREIGN KEY,
  treatment_id STRING,
  effectiveness INTEGER (1-10),
  notes TEXT,
  created_at TIMESTAMP
)
```

#### Cloud Services
- **Firebase Firestore**: Real-time database
- **Firebase Storage**: Image storage
- **Firebase Auth**: User authentication
- **Cloud CDN**: Image serving optimization

## Data Flow Diagrams

### Diagnosis Request Flow
```
User captures image
    ↓
Client app uploads to API
    ↓
API validates request (auth, rate limit)
    ↓
Image stored in Firebase Storage
    ↓
Image sent to ML pipeline
    ↓
Preprocessing (resize, normalize)
    ↓
Model inference (primary + secondary)
    ↓
Treatment recommendations generated
    ↓
Results stored in Firestore
    ↓
Response sent to client
    ↓
Client displays results
```

### Community Validation Flow
```
Diagnosis uncertainty > threshold
    ↓
Flagged for expert review
    ↓
Notification sent to expert community
    ↓
Expert reviews diagnosis & image
    ↓
Validation submitted with feedback
    ↓
Model retrained with feedback data
    ↓
User notified of expert validation
```

## API Endpoints Summary

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh JWT token

### Diagnosis
- `POST /api/diagnose` - Perform diagnosis
- `GET /api/diagnoses/{id}` - Get diagnosis details
- `GET /api/diagnoses?user_id=...` - Get user's diagnoses
- `DELETE /api/diagnoses/{id}` - Delete diagnosis

### Plant Data
- `GET /api/species` - List all plant species
- `GET /api/diseases` - List known diseases
- `GET /api/diseases/{id}` - Disease details

### Community
- `GET /api/diagnoses/{id}/validations` - Get expert validations
- `POST /api/diagnoses/{id}/validate` - Submit expert validation
- `GET /api/community/experts` - List expert validators

### Feedback
- `POST /api/treatments/{id}/feedback` - Submit treatment feedback
- `GET /api/treatments/{id}/feedback` - Get feedback for treatment
- `GET /api/user/feedback` - User's treatment feedback

## Deployment Architecture

### Development
- **Backend**: Local Flask server (localhost:5000)
- **Database**: Firebase (free tier)
- **Storage**: Firebase Storage
- **Frontend**: npm dev server

### Production
- **Backend**: Render or Railway deployment
- **Database**: Firebase (paid tier)
- **CDN**: Cloudflare for caching
- **Monitoring**: Sentry for error tracking
- **Analytics**: Google Analytics

## Security Considerations

1. **Authentication**: JWT tokens with 1-hour expiration
2. **Authorization**: Role-based access control (user, expert, admin)
3. **Data Encryption**: HTTPS for all communications
4. **Image Privacy**: Encrypt sensitive medical data
5. **Rate Limiting**: 100 requests/hour per user
6. **Input Validation**: Sanitize all user inputs
7. **CORS**: Restricted to whitelisted domains

## Performance Optimization

1. **Caching**: Redis for API response caching
2. **Image Compression**: WebP format for storage
3. **Lazy Loading**: Progressive image loading
4. **Database Indexing**: GiST index on spatial data
5. **Async Processing**: Celery for background tasks
6. **Load Balancing**: Multiple API instances

## Scalability Plan

### Phase 1 (Current)
- Single API instance
- Firebase backend
- Up to 1,000 daily users

### Phase 2 (Q2 2025)
- Load-balanced API (3 instances)
- Database replication
- Caching layer
- Up to 10,000 daily users

### Phase 3 (Q4 2025)
- Kubernetes orchestration
- Auto-scaling groups
- Multi-region deployment
- Up to 100,000 daily users

## Technology Stack Summary

| Layer | Technology |
|-------|------------|
| Frontend (Web) | React, Redux, Material-UI |
| Frontend (Mobile) | React Native, Expo |
| API | Flask, Python 3.11 |
| ML/AI | TensorFlow, Scikit-learn |
| Image Processing | OpenCV, Pillow |
| Database | Firebase Firestore |
| Storage | Firebase Storage |
| Authentication | Firebase Auth, JWT |
| Deployment | Render/Railway, Docker |
| Monitoring | Sentry, Google Analytics |
| CI/CD | GitHub Actions |

## Future Enhancements

1. **Advanced ML**: Transformers for better accuracy
2. **3D Scanning**: Use depth cameras for plant analysis
3. **IoT Integration**: Connect with soil sensors
4. **Blockchain**: Transparent supply chain for treatments
5. **AI Chatbot**: Plant care assistant with NLP
6. **AR Marketplace**: In-app treatment marketplace
