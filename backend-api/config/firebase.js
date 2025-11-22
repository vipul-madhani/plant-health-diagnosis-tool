const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
let firebaseApp = null;

function initializeFirebase() {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Initialize with service account from environment
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
      : require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json');

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    console.log('✅ Firebase initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    return null;
  }
}

/**
 * Send push notification to a single device
 * @param {string} token - FCM device token
 * @param {object} notification - Notification payload
 * @param {object} data - Data payload
 */
async function sendPushNotification(token, notification, data = {}) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    const message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
        imageUrl: notification.imageUrl || null,
      },
      data,
      android: {
        priority: 'high',
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
            badge: 1,
          },
        },
      },
    };

    const response = await admin.messaging().send(message);
    console.log('✅ Push notification sent:', response);
    
    return {
      success: true,
      messageId: response,
    };
  } catch (error) {
    console.error('❌ Push notification error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send push notification to multiple devices
 * @param {array} tokens - Array of FCM device tokens
 * @param {object} notification - Notification payload
 * @param {object} data - Data payload
 */
async function sendMulticastNotification(tokens, notification, data = {}) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    const message = {
      tokens,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data,
      android: {
        priority: 'high',
      },
      apns: {
        payload: {
          aps: {
            sound: 'default',
          },
        },
      },
    };

    const response = await admin.messaging().sendMulticast(message);
    console.log(`✅ Sent to ${response.successCount}/${tokens.length} devices`);
    
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('❌ Multicast notification error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Log analytics event (server-side)
 * Note: For mobile apps, use Firebase Analytics SDK directly
 * This is for server-side event logging to Firebase
 */
function logAnalyticsEvent(eventName, params = {}) {
  // Firebase Analytics events are typically logged from client-side
  // For server-side tracking, you may use Firebase Cloud Functions or custom logging
  console.log(`📊 Analytics Event: ${eventName}`, params);
  
  // TODO: Implement custom analytics logging to your preferred service
  // (Mixpanel, Segment, Google Analytics, etc.)
}

/**
 * Subscribe device token to a topic
 * @param {string} token - FCM device token
 * @param {string} topic - Topic name
 */
async function subscribeToTopic(token, topic) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    await admin.messaging().subscribeToTopic(token, topic);
    console.log(`✅ Subscribed to topic: ${topic}`);
    
    return { success: true };
  } catch (error) {
    console.error('❌ Topic subscription error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Send notification to a topic
 * @param {string} topic - Topic name
 * @param {object} notification - Notification payload
 * @param {object} data - Data payload
 */
async function sendTopicNotification(topic, notification, data = {}) {
  try {
    if (!firebaseApp) {
      initializeFirebase();
    }

    const message = {
      topic,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data,
    };

    const response = await admin.messaging().send(message);
    console.log(`✅ Topic notification sent: ${response}`);
    
    return {
      success: true,
      messageId: response,
    };
  } catch (error) {
    console.error('❌ Topic notification error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  initializeFirebase,
  sendPushNotification,
  sendMulticastNotification,
  logAnalyticsEvent,
  subscribeToTopic,
  sendTopicNotification,
};
