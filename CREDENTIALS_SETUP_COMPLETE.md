# 🎉 AgriIQ Credentials Setup Complete!

**Date:** November 23, 2025  
**Status:** ✅ All Firebase and Razorpay credentials configured

---

## 📱 Firebase Apps Configuration

### Project Details
- **Project ID:** `agriiq-f19c5`
- **Project Number:** `418032934340`
- **Storage Bucket:** `agriiq-f19c5.firebasestorage.app`

### ✅ Android App
- **Package Name:** `com.agriiq.app`
- **App ID:** `1:418032934340:android:a12893a6d2ed5f3ec41891`
- **API Key:** `AIzaSyDdMJ-Jdalf4F5AeTEanr9yxK0NMwbf6PY`
- **Config File:** `google-services.json` (download from Firebase Console)
- **Location:** Place in `frontend-mobile/android/app/`

### ✅ iOS App
- **Bundle ID:** `com.agriiq.app`
- **App ID:** `1:418032934340:ios:40e6d0a1acfdb4c6c41891`
- **Config File:** `GoogleService-Info.plist` (download from Firebase Console)
- **Location:** Place in `frontend-mobile/ios/`

### ✅ Web App
- **App ID:** `1:418032934340:web:e380d1dd499945d7c41891`
- **API Key:** `AIzaSyCVLE-gpZ6bedKrcXdwuJzSNwaE2QLapBo`
- **Auth Domain:** `agriiq-f19c5.firebaseapp.com`
- **Measurement ID:** `G-H4LQCWNT0M`

---

## 💳 Razorpay Configuration (TEST MODE)

- **Key ID:** `rzp_test_Rit4Xu1MbE7FYb`
- **Key Secret:** `J8zpa8lpp9rbBU7MusyMQS8Q`
- **Environment:** Testing/Development
- **Currency:** INR (Indian Rupees)

### Payment Amounts
- **Detailed Report:** ₹99
- **Consultation:** ₹199

---

## 📂 Configuration Files Updated

### ✅ Backend API
**File:** `backend-api/.env.test`
```bash
# Key highlights:
RAZORPAY_KEY_ID=rzp_test_Rit4Xu1MbE7FYb
RAZORPAY_KEY_SECRET=J8zpa8lpp9rbBU7MusyMQS8Q
FIREBASE_PROJECT_ID=agriiq-f19c5
FIREBASE_API_KEY=AIzaSyDdMJ-Jdalf4F5AeTEanr9yxK0NMwbf6PY
FREE_ANALYSIS_LIMIT=3
```

### ✅ Web Frontend
**File:** `frontend-web/.env.local`
```bash
# Key highlights:
REACT_APP_FIREBASE_API_KEY=AIzaSyCVLE-gpZ6bedKrcXdwuJzSNwaE2QLapBo
REACT_APP_FIREBASE_PROJECT_ID=agriiq-f19c5
REACT_APP_FIREBASE_APP_ID=1:418032934340:web:e380d1dd499945d7c41891
REACT_APP_FIREBASE_MEASUREMENT_ID=G-H4LQCWNT0M
REACT_APP_RAZORPAY_KEY_ID=rzp_test_Rit4Xu1MbE7FYb
```

### ✅ Mobile App
**File:** `frontend-mobile/src/config/environment.js`
```javascript
// Firebase Config
FIREBASE_CONFIG: {
  apiKey: 'AIzaSyDdMJ-Jdalf4F5AeTEanr9yxK0NMwbf6PY',
  projectId: 'agriiq-f19c5',
  appId: '1:418032934340:android:a12893a6d2ed5f3ec41891',
  iosAppId: '1:418032934340:ios:40e6d0a1acfdb4c6c41891',
}

// Razorpay
RAZORPAY_KEY_ID: 'rzp_test_Rit4Xu1MbE7FYb'
```

---

## 🚀 Next Steps for Local Testing

### 1. Backend Setup
```bash
cd backend-api

# Copy test environment file
cp .env.test .env

# Update MySQL credentials in .env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=agriiq_db
DB_USER=your_mysql_username
DB_PASSWORD=your_mysql_password

# Add SMTP email credentials
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password

# Install dependencies
npm install

# Start server
npm start
```

### 2. Web Frontend Setup
```bash
cd frontend-web

# Dependencies already configured
npm install

# Start development server
npm start

# Opens at http://localhost:3000
```

### 3. Mobile App Setup

#### Download Firebase Config Files First:
1. **Android:** 
   - Go to Firebase Console → Project Settings → Your Apps → Android app
   - Click "Download google-services.json"
   - Place in `frontend-mobile/android/app/google-services.json`

2. **iOS:**
   - Go to Firebase Console → Project Settings → Your Apps → iOS app
   - Click "Download GoogleService-Info.plist"
   - Place in `frontend-mobile/ios/GoogleService-Info.plist`

#### Then Run Mobile App:
```bash
cd frontend-mobile

# Install dependencies
npm install

# Start Expo
npx expo start

# For Android emulator
npx expo run:android

# For iOS simulator (Mac only)
npx expo run:ios

# For physical device
# Scan QR code with Expo Go app
```

---

## ⚠️ Important Notes

### For Testing on Physical Devices
If testing mobile app on a physical device (not emulator), update the API URL:

1. Find your computer's IP address:
   ```bash
   # Mac/Linux
   ifconfig | grep inet
   
   # Windows
   ipconfig
   ```

2. Update `frontend-mobile/src/config/environment.js`:
   ```javascript
   API_BASE_URL: 'http://YOUR_IP_ADDRESS:8000'
   ```

### Database Setup
You mentioned using MySQL instead of MongoDB:

```bash
# Create database
mysql -u root -p
CREATE DATABASE agriiq_db;

# Run migrations (if you have migration files)
cd backend-api
npm run migrate
```

### Email Configuration (SMTP)
For Gmail:
1. Enable 2-Factor Authentication
2. Generate App-Specific Password: https://myaccount.google.com/apppasswords
3. Add to `.env`:
   ```
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-char-app-password
   ```

---

## 🔐 Security Best Practices

### ❌ DO NOT Commit to Git:
- `.env` files with real credentials
- `google-services.json`
- `GoogleService-Info.plist`
- Any files with API keys or secrets

### ✅ For Production:
1. Replace Razorpay test keys with live keys
2. Update Firebase with production environment variables
3. Enable Firebase App Check for security
4. Set up proper CORS policies
5. Use environment variables on your server (not committed files)

---

## 📊 What's Configured

| Component | Status | Details |
|-----------|--------|----------|
| Firebase Android | ✅ Complete | App ID, package name configured |
| Firebase iOS | ✅ Complete | App ID, bundle ID configured |
| Firebase Web | ✅ Complete | Full web config with analytics |
| Razorpay Test | ✅ Complete | Test keys for development |
| Backend API | ✅ Complete | Environment file with all credentials |
| Web Frontend | ✅ Complete | React env with Firebase + Razorpay |
| Mobile App | ✅ Complete | Environment config for Android/iOS |
| Payment Amounts | ✅ Complete | ₹99 and ₹199 configured |
| Usage Limits | ✅ Complete | 3 free analyses per user |

---

## 🎯 Ready for Testing!

All credentials are now configured in your repository. You can:

1. **Pull the latest code** from GitHub to your local VS Code
2. **Follow the setup steps** above for each component
3. **Download Firebase config files** (google-services.json and GoogleService-Info.plist)
4. **Add your MySQL credentials** to `.env`
5. **Start testing** the complete application!

---

## 📞 Support Resources

- **Firebase Console:** https://console.firebase.google.com/project/agriiq-f19c5
- **Razorpay Dashboard:** https://dashboard.razorpay.com/
- **Repository:** https://github.com/vipul-madhani/plant-health-diagnosis-tool

---

**Last Updated:** November 23, 2025, 12:25 AM IST
