import analytics from '@react-native-firebase/analytics';

class AnalyticsService {
  async logEvent(eventName, params = {}) {
    try {
      await analytics().logEvent(eventName, {
        ...params,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  // User Actions
  async logAnalysisAttempt(imageUri, userId) {
    await this.logEvent('analysis_attempt', {
      user_id: userId,
      has_image: !!imageUri,
    });
  }

  async logPaidAnalysis(analysisId, amount, userId) {
    await this.logEvent('paid_analysis', {
      analysis_id: analysisId,
      amount: amount,
      user_id: userId,
      currency: 'INR',
    });
  }

  async logConsultationRequest(analysisId, userId) {
    await this.logEvent('consultation_request', {
      analysis_id: analysisId,
      user_id: userId,
    });
  }

  async logUpgradePromptShown(userId, remaining) {
    await this.logEvent('upgrade_prompt_shown', {
      user_id: userId,
      analyses_remaining: remaining,
    });
  }

  async logAIBotEngaged(consultationId, userId) {
    await this.logEvent('AI_bot_engaged', {
      consultation_id: consultationId,
      user_id: userId,
    });
  }

  async logPaymentCompleted(orderId, amount, type, userId) {
    await this.logEvent('payment_completed', {
      order_id: orderId,
      amount: amount,
      payment_type: type,
      user_id: userId,
      currency: 'INR',
    });
  }

  async logPaymentFailed(orderId, error, userId) {
    await this.logEvent('payment_failed', {
      order_id: orderId,
      error: error,
      user_id: userId,
    });
  }

  // Screen Views
  async logScreenView(screenName, userId) {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
      user_id: userId,
    });
  }

  // User Properties
  async setUserProperties(userId, properties) {
    try {
      await analytics().setUserId(userId);
      await analytics().setUserProperties(properties);
    } catch (error) {
      console.error('Set user properties error:', error);
    }
  }
}

export default new AnalyticsService();