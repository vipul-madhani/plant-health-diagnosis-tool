# 🌱 AgriIQ - AI-Powered Plant Health Diagnosis

> Intelligent plant disease detection and agronomist consultation platform for Indian farmers. Upload plant images, get instant AI diagnosis, and connect with expert agronomists for personalized treatment plans.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Website](https://img.shields.io/badge/Website-agriiq.com-green)](https://agriiq.com)

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## 🌟 Overview

AgriIQ is a comprehensive plant health diagnosis platform designed specifically for Indian agriculture. Using state-of-the-art machine learning models, we help farmers identify crop diseases, pests, and nutrient deficiencies instantly. Our platform connects farmers with verified agronomists for expert consultation when needed.

**Website**: [agriiq.com](https://agriiq.com)  
**Mobile App**: Available on iOS and Android (coming soon)

## ✨ Features

### Core Features
- 🤖 **AI-Powered Diagnosis** - Instant disease detection using advanced ML models
- 👨‍🌾 **Expert Consultation** - Connect with agronomists via FIFO matching system
- 💬 **Real-Time Chat** - Communicate with experts through in-app messaging
- 💰 **Fair Pricing** - Transparent 30-70 commission split (Platform 30%, Agronomist 70%)
- 🌍 **Regional Solutions** - Localized recommendations for Indian crops and seasons
- 📱 **Offline Mode** - Works without internet, syncs when connected
- 🔔 **Smart Notifications** - Real-time updates on consultations and payments

### Advanced Features
- **ML Model Enrichment** - Continuous learning from new disease data
- **Performance Tracking** - Real-time accuracy monitoring and drift detection
- **Multi-Language Support** - Hindi, Marathi, and English (coming soon)
- **Voice Messages** - Communicate in local languages via voice notes
- **Payment Collection** - INR-based payment tracking (no immediate UPI)
- **Community Knowledge** - 80%+ effectiveness-rated solutions auto-published

## 📁 Project Structure

```
agriiq/
├── frontend-web/           # ReactJS web application (agriiq.com)
│   └── src/
│       ├── pages/          # Homepage, diagnosis, admin dashboard
│       ├── services/       # API integration
│       └── context/        # Auth & state management
├── frontend-mobile/        # React Native mobile app
│   └── src/
│       ├── screens/        # Home, chat, consultation, profile
│       ├── services/       # Offline sync, media handling
│       └── navigation/     # Tab & stack navigation
├── backend-api/            # Python Flask backend (api.agriiq.com)
│   ├── routes/             # API endpoints
│   ├── services/           # ML tracking, dataset management
│   ├── models/             # Database schemas
│   └── config/             # Environment configuration
├── ml-model/               # ML model training & inference
│   ├── dataset/            # Training data with versioning
│   ├── experiments/        # Training job tracking
│   └── performance/        # Accuracy metrics & logs
├── docs/                   # Comprehensive documentation
│   ├── ML_ENRICHMENT_GUIDE.md
│   ├── ARCHITECTURE.md
│   └── DEPLOYMENT_GUIDE.md
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **Web**: ReactJS + Material-UI
- **Mobile**: React Native + Expo
- **State**: Context API + AsyncStorage/LocalStorage

### Backend
- **API**: Python Flask with Blueprint architecture
- **Database**: MySQL with Sequelize ORM
- **ML Framework**: TensorFlow/PyTorch
- **Model**: EfficientNet B0 (fine-tuned for Indian crops)

### Infrastructure
- **Domain**: agriiq.com
- **API**: api.agriiq.com
- **Mobile**: app.agriiq.com
- **Storage**: AWS S3 / Azure Blob
- **Database**: MySQL / MongoDB Atlas
- **Notifications**: Firebase Cloud Messaging
- **Payments**: Razorpay (INR only)

### ML Operations
- **Dataset Management**: Automated versioning with quality gates
- **Performance Tracking**: Real-time accuracy monitoring
- **Retraining**: Automated triggers on accuracy drop or drift
- **Experiment Tracking**: Hyperparameter logging and comparison

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.8+
- MySQL 8.0+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/vipul-madhani/plant-health-diagnosis-tool.git
cd plant-health-diagnosis-tool

# Backend setup
cd backend-api
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your configuration
python app.py

# Frontend web setup
cd ../frontend-web
npm install
npm start

# Mobile app setup
cd ../frontend-mobile
npm install
npx expo start
```

### Environment Configuration

Copy `.env.example` to `.env` and configure:

```bash
# Required
API_BASE_URL=https://api.agriiq.com
FRONTEND_WEB_URL=https://agriiq.com
DB_HOST=your-mysql-host
JWT_SECRET_KEY=your-secret-key

# Optional (for production)
AWS_S3_BUCKET=agriiq-media
FCM_CREDENTIALS_PATH=./config/firebase-credentials.json
RAZORPAY_KEY_ID=your-razorpay-key
```

## 📚 Documentation

- **[ML Enrichment Guide](docs/ML_ENRICHMENT_GUIDE.md)** - Complete ML workflow, dataset management, and retraining
- **[Architecture Overview](docs/ARCHITECTURE.md)** - System design and component interaction
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment instructions
- **[API Documentation](docs/API_DOCUMENTATION.md)** - REST API endpoints reference
- **[Implementation Status](IMPLEMENTATION_STATUS.md)** - Current project completion status

## 🗺️ Roadmap

### Completed ✅
- [x] Repository setup and architecture
- [x] Backend API with JWT authentication
- [x] Frontend web application
- [x] React Native mobile app
- [x] ML dataset management system
- [x] Performance tracking and monitoring
- [x] Automated retraining pipeline
- [x] Offline sync for mobile
- [x] Media handling (images, voice)
- [x] Push notification infrastructure
- [x] Admin ML dashboard

### In Progress 🚧
- [ ] Multi-language support (Hindi, Marathi)
- [ ] PWA service worker for web
- [ ] Advanced analytics dashboard
- [ ] Expert validation workflow

### Upcoming 📅
- [ ] ML model training with Indian crop dataset
- [ ] Beta testing with farmers
- [ ] Mobile app store deployment
- [ ] Production launch
- [ ] Community features expansion

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📧 Contact

**AgriIQ Team**
- **Website**: [agriiq.com](https://agriiq.com)
- **Email**: support@agriiq.com
- **GitHub**: [@vipul-madhani](https://github.com/vipul-madhani)

Project Repository: [https://github.com/vipul-madhani/plant-health-diagnosis-tool](https://github.com/vipul-madhani/plant-health-diagnosis-tool)

---

⭐ **Star this repo** if you find it helpful!  
🌾 Built with ❤️ for Indian farmers
