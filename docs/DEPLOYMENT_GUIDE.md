# 🚀 DEPLOYMENT & COMPILATION GUIDE

**Plant Health Diagnosis Tool - Complete Setup for Local Development**

---

## 📚 TABLE OF CONTENTS

1. [Prerequisites](#prerequisites)
2. [Cloning the Repository](#cloning-repository)
3. [Backend Setup](#backend-setup)
4. [Web Frontend Setup](#web-frontend-setup)
5. [Mobile Frontend Setup](#mobile-frontend-setup)
6. [Database Configuration](#database-configuration)
7. [Environment Variables](#environment-variables)
8. [Running the Application](#running-application)
9. [Building for Production](#building-production)
10. [Troubleshooting](#troubleshooting)

---

## ✅ PREREQUISITES

### Required Software

- **Git**: 2.30+
- **Python**: 3.8+ (for backend)
- **Node.js**: 16+ and npm 8+ (for frontends)
- **MongoDB**: 5.0+ or MongoDB Atlas account
- **VS Code**: Latest version (recommended)
- **Xcode Command Line Tools** (macOS only)

### Verify Installations

```bash
# Check versions
git --version
python3 --version
node --version
npm --version
mongo --version  # or mongosh --version
```

---

## 📋 CLONING THE REPOSITORY

### Step 1: Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/vipul-madhani/plant-health-diagnosis-tool.git

# Navigate to project directory
cd plant-health-diagnosis-tool

# View project structure
ls -la
```

You should see:
```
├── backend-api/
├── frontend-web/
├── frontend-mobile/
├── docs/
└── README.md
```

---

## 🐍 BACKEND SETUP

### Step 1: Create Virtual Environment

```bash
cd backend-api

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
# macOS/Linux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# You should see (venv) in your terminal prompt
```

### Step 2: Install Dependencies

```bash
# Upgrade pip
pip install --upgrade pip

# Install requirements
pip install -r requirements.txt
```

**Expected packages**:
- Flask==2.3.3
- flask-cors==4.0.0
- pymongo==4.5.0
- tensorflow==2.12.0
- pillow==10.0.0
- bcrypt==4.0.1
- pyjwt==2.8.0

### Step 3: Configure Environment

Create `.env` file in `backend-api/`:

```bash
touch .env
```

Add the following:

```env
# Flask Configuration
FLASK_APP=app.py
FLASK_ENV=development
SECRET_KEY=your-secret-key-change-in-production

# MongoDB Configuration
MONGO_URI=mongodb://localhost:27017/plant_health
# Or for MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/plant_health

# API Configuration
API_PORT=5000
CORS_ORIGINS=http://localhost:3000,http://localhost:19006

# File Upload
UPLOAD_FOLDER=uploads
MAX_FILE_SIZE=5242880  # 5MB

# Email Configuration (optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Step 4: Initialize Database

```bash
# If using local MongoDB, start it:
# macOS:
brew services start mongodb-community

# Linux:
sudo systemctl start mongod

# Verify MongoDB is running
mongosh
# Should connect successfully, then type 'exit'
```

### Step 5: Run Backend Server

```bash
# Make sure virtual environment is activated
python app.py
```

You should see:
```
 * Running on http://127.0.0.1:5000
 * Restarting with stat
 * Debugger is active!
```

Test the API:
```bash
curl http://localhost:5000/api/health
# Should return: {"status": "healthy"}
```

---

## ⚛️ WEB FRONTEND SETUP

### Step 1: Navigate to Web Frontend

```bash
# Open new terminal
cd plant-health-diagnosis-tool/frontend-web
```

### Step 2: Install Dependencies

```bash
# Install all packages
npm install
```

This installs:
- React 18.2.0
- React Router DOM 6.15.0
- Axios 1.5.0
- React Icons 4.11.0
- Tailwind CSS 3.3.3

### Step 3: Configure Environment

Create `.env` file in `frontend-web/`:

```bash
touch .env
```

Add:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

### Step 4: Run Development Server

```bash
npm start
```

Browser should open automatically at `http://localhost:3000`

If not, manually open: http://localhost:3000

---

## 📱 MOBILE FRONTEND SETUP

### Step 1: Navigate to Mobile Frontend

```bash
# Open new terminal
cd plant-health-diagnosis-tool/frontend-mobile
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- React Native (via Expo)
- Expo SDK 49.0.0
- React Navigation 6.x
- Expo Camera, Image Picker

### Step 3: Configure Environment

Create `.env` file in `frontend-mobile/`:

```env
API_URL=http://localhost:5000/api
ENV=development
```

### Step 4: Start Expo Development Server

```bash
npx expo start
```

You'll see:
```
› Metro waiting on exp://192.168.x.x:19000
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)
```

**Options to run**:
- Press `i` for iOS Simulator (macOS only)
- Press `a` for Android Emulator
- Scan QR code with Expo Go app on your phone

---

## 📦 DATABASE CONFIGURATION

### Option 1: Local MongoDB

```bash
# Install MongoDB (macOS)
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community

# Verify
mongosh
```

### Option 2: MongoDB Atlas (Cloud)

1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster
4. Get connection string
5. Update `.env` in `backend-api/`:

```env
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/plant_health?retryWrites=true&w=majority
```

---

## ⌛ RUNNING THE APPLICATION

### Complete Startup Sequence

**Terminal 1 - Backend**:
```bash
cd backend-api
source venv/bin/activate
python app.py
# Backend running on http://localhost:5000
```

**Terminal 2 - Web Frontend**:
```bash
cd frontend-web
npm start
# Web app running on http://localhost:3000
```

**Terminal 3 - Mobile Frontend** (optional):
```bash
cd frontend-mobile
npx expo start
# Scan QR code with Expo Go
```

### Test the Complete Flow

1. Open http://localhost:3000
2. Register as Farmer or Agronomist
3. Upload plant image
4. Create consultation
5. Verify in database:

```bash
mongosh
use plant_health
db.consultations.find().pretty()
```

---

## 🏭 BUILDING FOR PRODUCTION

### Backend Production

```bash
cd backend-api

# Update .env
FLASK_ENV=production
SECRET_KEY=<generate-strong-secret-key>

# Use production-grade WSGI server
pip install gunicorn
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Web Frontend Production Build

```bash
cd frontend-web

# Update .env
REACT_APP_API_URL=https://your-api-domain.com/api

# Build optimized production bundle
npm run build

# Serve with static server
npx serve -s build -p 3000
```

Production build creates `build/` folder with optimized files.

### Mobile Frontend Production Build

```bash
cd frontend-mobile

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

---

## 🔧 TROUBLESHOOTING

### Issue: Port 5000 Already in Use

```bash
# Find process using port 5000
lsof -ti:5000

# Kill the process
kill -9 $(lsof -ti:5000)

# Or use different port in backend .env
API_PORT=5001
```

### Issue: MongoDB Connection Failed

```bash
# Check if MongoDB is running
brew services list | grep mongo

# Restart MongoDB
brew services restart mongodb-community

# Check connection string in .env
```

### Issue: npm install fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

### Issue: Python packages conflict

```bash
# Delete virtual environment
rm -rf venv

# Recreate
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Issue: CORS Errors

Update `backend-api/.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:19006
```

And in `backend-api/app.py`:
```python
CORS(app, origins=os.getenv('CORS_ORIGINS').split(','))
```

---

## 📝 VS CODE RECOMMENDED EXTENSIONS

1. **Python** (ms-python.python)
2. **ES7+ React/Redux/React-Native snippets** (dsznajder.es7-react-js-snippets)
3. **Tailwind CSS IntelliSense** (bradlc.vscode-tailwindcss)
4. **MongoDB for VS Code** (mongodb.mongodb-vscode)
5. **GitLens** (eamodio.gitlens)
6. **Prettier** (esbenp.prettier-vscode)

---

## 🚀 DEPLOYMENT TARGETS

### Backend Options
- **Heroku**: Easy deployment with free tier
- **DigitalOcean**: $5/month droplet
- **AWS EC2**: Scalable cloud hosting
- **Google Cloud Run**: Serverless containers

### Frontend Web Options
- **Vercel**: Automatic deployments from Git
- **Netlify**: CI/CD with form handling
- **GitHub Pages**: Free static hosting
- **AWS S3 + CloudFront**: CDN distribution

### Mobile Options
- **Expo Application Services (EAS)**: Build and submit to app stores
- **App Store Connect**: iOS distribution
- **Google Play Console**: Android distribution

---

**Generated**: November 20, 2025  
**Platform**: macOS/Linux/Windows  
**Last Updated**: Ready for VS Code Development
