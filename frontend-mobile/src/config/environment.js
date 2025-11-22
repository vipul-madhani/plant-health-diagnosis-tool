/**
 * AgriIQ Mobile App - Environment Configuration
 * 
 * This file manages environment-specific configuration for development and production.
 * Update the values with your actual credentials before testing.
 * 
 * IMPORTANT: Never commit real credentials to Git.
 */

const ENV = {
  development: {
    // Local Development API
    // Replace with your computer's LAN IP address (find with ipconfig or ifconfig)
    API_BASE_URL: 'http://192.168.1.100:8000',
    
    // Razorpay Test Credentials
    RAZORPAY_KEY_ID: 'rzp_test_your_key_here',
    
    // Firebase Development Configuration
    FIREBASE_CONFIG: {
      apiKey: 'your_firebase_api_key_here',
      authDomain: 'your-project.firebaseapp.com',
      projectId: 'your_firebase_project_id',
      storageBucket: 'your-project.appspot.com',
      messagingSenderId: 'your_messaging_sender_id',
      appId: 'your_firebase_app_id',
      measurementId: 'G-XXXXXXXXXX',
    },
  },
  
  production: {
    // Production API
    API_BASE_URL: 'https://api.agriiq.com',
    
    // Razorpay Live Credentials
    RAZORPAY_KEY_ID: 'rzp_live_your_key_here',
    
    // Firebase Production Configuration
    FIREBASE_CONFIG: {
      apiKey: 'your_firebase_api_key_here',
      authDomain: 'your-project.firebaseapp.com',
      projectId: 'your_firebase_project_id',
      storageBucket: 'your-project.appspot.com',
      messagingSenderId: 'your_messaging_sender_id',
      appId: 'your_firebase_app_id',
      measurementId: 'G-XXXXXXXXXX',
    },
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
 * SETUP INSTRUCTIONS:
 * 
 * 1. Find your local IP address:
 *    - Mac/Linux: Run 'ifconfig | grep inet' in terminal
 *    - Windows: Run 'ipconfig' in command prompt
 *    - Look for 192.168.x.x or 10.0.x.x address
 * 
 * 2. Update API_BASE_URL in development with your IP:
 *    API_BASE_URL: 'http://YOUR_IP_HERE:8000'
 * 
 * 3. Add your Razorpay keys from: https://dashboard.razorpay.com/app/keys
 * 
 * 4. Add Firebase config from: Firebase Console > Project Settings > General
 * 
 * 5. For production, update with live credentials
 */
