const { logAnalyticsEvent } = require('../config/firebase');

/**
 * Analytics Middleware
 * Tracks key user actions and events throughout the application
 */

const ANALYTICS_EVENTS = {
  // User Events
  USER_REGISTERED: 'user_registered',
  USER_LOGIN: 'user_login',
  USER_LOGOUT: 'user_logout',
  
  // Analysis Events
  ANALYSIS_STARTED: 'analysis_started',
  ANALYSIS_COMPLETED: 'analysis_completed',
  ANALYSIS_FAILED: 'analysis_failed',
  FREE_LIMIT_REACHED: 'free_limit_reached',
  
  // Payment Events
  PAYMENT_INITIATED: 'payment_initiated',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  DETAILED_REPORT_PURCHASED: 'detailed_report_purchased',
  CONSULTATION_PURCHASED: 'consultation_purchased',
  
  // Consultation Events
  CONSULTATION_CREATED: 'consultation_created',
  CONSULTATION_ACCEPTED: 'consultation_accepted',
  CONSULTATION_COMPLETED: 'consultation_completed',
  AI_BOT_ACTIVATED: 'ai_bot_activated',
  AGRONOMIST_JOINED: 'agronomist_joined',
  
  // Engagement Events
  MESSAGE_SENT: 'message_sent',
  REPORT_DOWNLOADED: 'report_downloaded',
  RATING_SUBMITTED: 'rating_submitted',
  UPGRADE_PROMPT_SHOWN: 'upgrade_prompt_shown',
  UPGRADE_CLICKED: 'upgrade_clicked',
};

/**
 * Track event with user context
 * @param {string} eventName - Event name from ANALYTICS_EVENTS
 * @param {object} userId - User ID (optional)
 * @param {object} properties - Additional event properties
 */
function trackEvent(eventName, userId = null, properties = {}) {
  const eventData = {
    timestamp: new Date().toISOString(),
    userId,
    ...properties,
  };

  // Log to Firebase Analytics
  logAnalyticsEvent(eventName, eventData);

  // Log to console for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log(`📊 [Analytics] ${eventName}:`, eventData);
  }

  // TODO: Add additional analytics providers here
  // - Mixpanel: mixpanel.track(eventName, eventData)
  // - Segment: analytics.track(userId, eventName, eventData)
  // - Google Analytics: gtag('event', eventName, eventData)
}

/**
 * Middleware to track API requests
 */
function trackApiRequest(req, res, next) {
  const startTime = Date.now();

  // Track response time
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = req.user?.id || null;

    trackEvent('api_request', userId, {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      userAgent: req.get('user-agent'),
    });
  });

  next();
}

/**
 * Track user registration
 */
function trackUserRegistration(userId, userDetails) {
  trackEvent(ANALYTICS_EVENTS.USER_REGISTERED, userId, {
    role: userDetails.role,
    region: userDetails.region,
    registrationMethod: userDetails.registrationMethod || 'email',
  });
}

/**
 * Track user login
 */
function trackUserLogin(userId, loginMethod = 'email') {
  trackEvent(ANALYTICS_EVENTS.USER_LOGIN, userId, {
    loginMethod,
  });
}

/**
 * Track analysis started
 */
function trackAnalysisStarted(userId, analysisType = 'basic') {
  trackEvent(ANALYTICS_EVENTS.ANALYSIS_STARTED, userId, {
    analysisType,
  });
}

/**
 * Track analysis completed
 */
function trackAnalysisCompleted(userId, analysisDetails) {
  trackEvent(ANALYTICS_EVENTS.ANALYSIS_COMPLETED, userId, {
    analysisType: analysisDetails.type,
    diagnosis: analysisDetails.diagnosis,
    confidence: analysisDetails.confidence,
    remaining: analysisDetails.remaining,
  });
}

/**
 * Track free limit reached
 */
function trackFreeLimitReached(userId) {
  trackEvent(ANALYTICS_EVENTS.FREE_LIMIT_REACHED, userId, {
    totalFreeUsed: 3,
  });
}

/**
 * Track payment initiated
 */
function trackPaymentInitiated(userId, paymentDetails) {
  trackEvent(ANALYTICS_EVENTS.PAYMENT_INITIATED, userId, {
    amount: paymentDetails.amount,
    currency: 'INR',
    type: paymentDetails.type, // 'detailed_report' or 'consultation'
    orderId: paymentDetails.orderId,
  });
}

/**
 * Track payment success
 */
function trackPaymentSuccess(userId, paymentDetails) {
  const eventName = paymentDetails.type === 'detailed_report' 
    ? ANALYTICS_EVENTS.DETAILED_REPORT_PURCHASED
    : ANALYTICS_EVENTS.CONSULTATION_PURCHASED;

  trackEvent(eventName, userId, {
    amount: paymentDetails.amount,
    currency: 'INR',
    paymentId: paymentDetails.paymentId,
    orderId: paymentDetails.orderId,
  });

  // Also track generic payment success
  trackEvent(ANALYTICS_EVENTS.PAYMENT_SUCCESS, userId, paymentDetails);
}

/**
 * Track payment failed
 */
function trackPaymentFailed(userId, paymentDetails) {
  trackEvent(ANALYTICS_EVENTS.PAYMENT_FAILED, userId, {
    amount: paymentDetails.amount,
    type: paymentDetails.type,
    reason: paymentDetails.reason,
  });
}

/**
 * Track consultation created
 */
function trackConsultationCreated(userId, consultationDetails) {
  trackEvent(ANALYTICS_EVENTS.CONSULTATION_CREATED, userId, {
    consultationId: consultationDetails.id,
    queuePosition: consultationDetails.queuePosition,
    agronomistsAvailable: consultationDetails.agronomistsAvailable,
  });
}

/**
 * Track AI bot activated
 */
function trackAiBotActivated(userId, consultationId) {
  trackEvent(ANALYTICS_EVENTS.AI_BOT_ACTIVATED, userId, {
    consultationId,
    reason: 'no_agronomist_available',
  });
}

/**
 * Track agronomist accepted consultation
 */
function trackConsultationAccepted(agronomistId, consultationDetails) {
  trackEvent(ANALYTICS_EVENTS.CONSULTATION_ACCEPTED, agronomistId, {
    consultationId: consultationDetails.id,
    waitTime: consultationDetails.waitTime,
    earning: consultationDetails.earning,
  });

  // Also track from user perspective
  trackEvent(ANALYTICS_EVENTS.AGRONOMIST_JOINED, consultationDetails.userId, {
    consultationId: consultationDetails.id,
    agronomistId,
  });
}

/**
 * Track consultation completed
 */
function trackConsultationCompleted(userId, consultationDetails) {
  trackEvent(ANALYTICS_EVENTS.CONSULTATION_COMPLETED, userId, {
    consultationId: consultationDetails.id,
    duration: consultationDetails.duration,
    rating: consultationDetails.rating,
    wasAiBotAssisted: consultationDetails.wasAiBotAssisted,
  });
}

/**
 * Track upgrade prompt shown
 */
function trackUpgradePromptShown(userId, context) {
  trackEvent(ANALYTICS_EVENTS.UPGRADE_PROMPT_SHOWN, userId, {
    context, // 'limit_reached', 'after_analysis', 'in_app'
  });
}

/**
 * Track upgrade clicked
 */
function trackUpgradeClicked(userId, upgradeType) {
  trackEvent(ANALYTICS_EVENTS.UPGRADE_CLICKED, userId, {
    upgradeType, // 'detailed_report' or 'consultation'
  });
}

/**
 * Track report downloaded
 */
function trackReportDownloaded(userId, reportId) {
  trackEvent(ANALYTICS_EVENTS.REPORT_DOWNLOADED, userId, {
    reportId,
  });
}

module.exports = {
  ANALYTICS_EVENTS,
  trackEvent,
  trackApiRequest,
  trackUserRegistration,
  trackUserLogin,
  trackAnalysisStarted,
  trackAnalysisCompleted,
  trackFreeLimitReached,
  trackPaymentInitiated,
  trackPaymentSuccess,
  trackPaymentFailed,
  trackConsultationCreated,
  trackAiBotActivated,
  trackConsultationAccepted,
  trackConsultationCompleted,
  trackUpgradePromptShown,
  trackUpgradeClicked,
  trackReportDownloaded,
};
