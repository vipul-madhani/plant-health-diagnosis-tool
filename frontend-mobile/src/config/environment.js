/**
 * AgriIQ Mobile App - Environment Configuration
 * 
 * This file manages environment-specific configuration for development and production.
 * Updated: November 23, 2025
 * 
 * CREDENTIALS INCLUDED:
 * - Razorpay Test Keys
 * - Firebase Android App Config
 * - Firebase iOS App Config
 */

const ENV = {
  development: {
    // Local Development API
    // Replace with your computer's LAN IP address (find with ipconfig or ifconfig)
    // Example: 'http://192.168.1.100:8000' or use localhost for emulator
    API_BASE_URL: 'http://localhost:8000',
    
    // Razorpay Test Credentials
    RAZORPAY_KEY_ID: 'rzp_test_Rit4Xu1MbE7FYb',
    
    // Firebase Mobile App Configuration (Android + iOS)
    FIREBASE_CONFIG: {
      apiKey: 'AIzaSyDdMJ-Jdalf4F5AeTEanr9yxK0NMwbf6PY',
      authDomain: 'agriiq-f19c5.firebaseapp.com',
      projectId: 'agriiq-f19c5',
      storageBucket: 'agriiq-f19c5.firebasestorage.app',
      messagingSenderId: '418032934340',
      appId: '1:418032934340:android:a12893a6d2ed5f3ec41891', // Android App ID
      iosAppId: '1:418032934340:ios:40e6d0a1acfdb4c6c41891', // iOS App ID
      measurementId: 'G-H4LQCWNT0M',
    },
    
    // Payment Amounts (in INR)
    DETAILED_REPORT_AMOUNT: 99,
    CONSULTATION_AMOUNT: 199,
    
    // Usage Limits
    FREE_ANALYSIS_LIMIT: 3,
    
    // Socket.io endpoint
    SOCKET_URL: 'http://localhost:5000',
  },
  
  production: {
    // Production API
    API_BASE_URL: 'https://api.agriiq.in',
    
    // Razorpay Live Credentials (Replace with live keys when deploying)
    RAZORPAY_KEY_ID: 'rzp_live_your_key_here',
    
    // Firebase Production Configuration (Same as dev for now)
    FIREBASE_CONFIG: {
      apiKey: 'AIzaSyDdMJ-Jdalf4F5AeTEanr9yxK0NMwbf6PY',
      authDomain: 'agriiq-f19c5.firebaseapp.com',
      projectId: 'agriiq-f19c5',
      storageBucket: 'agriiq-f19c5.firebasestorage.app',
      messagingSenderId: '418032934340',
      appId: '1:418032934340:android:a12893a6d2ed5f3ec41891',
      iosAppId: '1:418032934340:ios:40e6d0a1acfdb4c6c41891',
      measurementId: 'G-H4LQCWNT0M',
    },
    
    // Payment Amounts (in INR)
    DETAILED_REPORT_AMOUNT: 99,
    CONSULTATION_AMOUNT: 199,
    
    // Usage Limits
    FREE_ANALYSIS_LIMIT: 3,
    
    // Socket.io endpoint
    SOCKET_URL: 'https://api.agriiq.in',
  },
};

/**
 * Get environment variables based on development mode
 * @returns {Object} Environment configuration
 */
const getEnvVars = () => {
  // __DEV__ is true when running locally via Expo
  if (__DEV__) {
    return ENV.development;
  }
  return ENV.production;
};

export default getEnvVars;

/**
 * SETUP INSTRUCTIONS FOR LOCAL TESTING:
 * 
 * 1. If testing on physical device (not emulator):
 *    - Find your local IP address:
 *      * Mac/Linux: Run 'ifconfig | grep inet' in terminal
 *      * Windows: Run 'ipconfig' in command prompt
 *      * Look for 192.168.x.x or 10.0.x.x address
 *    - Update API_BASE_URL: 'http://YOUR_IP_HERE:8000'
 * 
 * 2. For Android/iOS emulator:
 *    - Keep API_BASE_URL as 'http://localhost:8000'
 *    - Emulators can access host machine via localhost
 * 
 * 3. Firebase Setup:
 *    ✅ Android: Already configured with google-services.json
 *    ✅ iOS: Already configured with GoogleService-Info.plist
 * 
 * 4. For Production Deployment:
 *    - Update API_BASE_URL to your live domain
 *    - Replace Razorpay test key with live key
 *    - Ensure Firebase config matches production environment
 */
