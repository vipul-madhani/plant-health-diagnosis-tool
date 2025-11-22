# 🚀 AgriIQ Local Testing Guide

**Complete guide to test AgriIQ on your local machine before deploying to production.**

---

## ✅ What's Already Set Up

Your repository now has the following configuration files ready:

1. **Root `.env`** - Backend environment variables with localhost and production URLs
2. **`frontend-web/.env.local`** - React web app configuration
3. **`frontend-mobile/src/config/environment.js`** - Mobile app environment configuration

---

## 📋 Prerequisites

### Required Software:
- Node.js v16+ (LTS recommended)
- npm or yarn
- MongoDB (local or Atlas)
- Git
- VSCode (recommended)

### For Mobile Testing:
- Expo CLI: `npm install -g expo-cli`
- Expo Go app on your phone (iOS/Android)
- OR Android Studio/Xcode for emulators

---

## 🔧 Step 1: Clone and Setup

```bash
# Clone repository
git clone https://github.com/vipul-madhani/plant-health-diagnosis-tool.git
cd plant-health-diagnosis-tool

# Pull latest changes
git pull origin main
```

---

## 🔑 Step 2: Configure Credentials

### A. Get Your Actual Credentials:

**Razorpay:**
1. Go to: https://dashboard.razorpay.com/app/keys
2. Copy your `Key ID` and `Key Secret`
3. Use **test** keys for local development

**Firebase:**
1. Go to: https://console.firebase.google.com/
2. Select your project > ⚙️ Settings > General
3. Scroll to "Your apps" > Web app > Copy config

**MongoDB:**
- Local: `mongodb://localhost:27017/agriiq`
- OR use your MongoDB Atlas connection string

**Find Your Local IP Address:**
```bash
# Mac/Linux
ifconfig | grep inet

# Windows
ipconfig

# Look for 192.168.x.x or 10.0.x.x
```

### B. Update Configuration Files:

**1. Update Root `.env`:**
```bash
cd plant-health-diagnosis-tool
# Edit .env and fill in actual values
```

**2. Create `frontend-web/.env.local`:**
```bash
cd frontend-web
cp .env.local .env.local
# Edit and add your actual Razorpay and Firebase credentials
```

**3. Update `frontend-mobile/src/config/environment.js`:**
- Replace `192.168.1.100` with YOUR actual local IP
- Add your actual Razorpay and Firebase credentials

---

## 🚀 Step 3: Start All Services

### Terminal 1: Backend API
```bash
cd backend-api
npm install
npm run dev

# Should start at: http://localhost:8000
# Test: curl http://localhost:8000/api/health
```

### Terminal 2: Frontend Web
```bash
cd frontend-web
npm install
npm start

# Should open at: http://localhost:3000
```

### Terminal 3: Mobile App
```bash
cd frontend-mobile
npm install
npm start

# Scan QR code with Expo Go app
# OR press 'a' for Android emulator
# OR press 'i' for iOS simulator
```

---

## ✔️ Step 4: Verify Everything Works

### Backend Tests:
1. Visit: `http://localhost:8000`
2. Should see API running message
3. Check console for MongoDB connection

### Web App Tests:
1. Open: `http://localhost:3000`
2. Test registration/login
3. Upload a plant image
4. Check if API calls work in browser DevTools > Network

### Mobile App Tests:
1. Open app in Expo Go
2. Test registration/login
3. Try uploading an image
4. Check if API calls reach backend (check backend terminal)

---

## 🐛 Troubleshooting

### Issue: "Cannot connect to backend" from mobile
**Solution:** 
- Update `API_BASE_URL` in `frontend-mobile/src/config/environment.js` with your actual LAN IP
- Make sure phone and computer are on same WiFi
- Disable firewall temporarily to test

### Issue: "MongoDB connection failed"
**Solution:**
- Start MongoDB: `brew services start mongodb-community` (Mac) or `sudo service mongod start` (Linux)
- OR use MongoDB Atlas connection string

### Issue: "Port 8000 already in use"
**Solution:**
```bash
# Kill process on port 8000
lsof -ti:8000 | xargs kill -9
```

### Issue: "Firebase/Razorpay not working"
**Solution:**
- Double-check credentials are correct
- Ensure no extra spaces in .env files
- Restart all terminals after updating .env

---

## 📦 Ready for Production?

Once local testing is complete:

1. **Update all `.env` files** with production values:
   - Use `https://api.agriiq.com` instead of localhost
   - Use Razorpay **live** keys
   - Use production MongoDB connection

2. **Deploy to your VPS**:
   - Upload code
   - Run `npm install` in all folders
   - Start services with PM2 or similar
   - Configure Nginx reverse proxy

3. **Mobile app build**:
   - Run `expo build:android` or `expo build:ios`
   - Submit to Play Store/App Store

---

## 📚 Additional Resources

- **Backend API Docs**: `/docs/API_DOCUMENTATION.md`
- **Deployment Guide**: `/docs/DEPLOYMENT.md`
- **Implementation Status**: `/docs/IMPLEMENTATION_STATUS.md`

---

**Ready to launch! 🚀**
