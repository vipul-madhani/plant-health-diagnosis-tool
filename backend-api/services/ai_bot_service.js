const axios = require('axios');
const Message = require('../models/Message');
const Consultation = require('../models/Consultation');
const Analysis = require('../models/Analysis');
const { sendEmail } = require('./email');

/**
 * AI Bot Service
 * Provides automated responses when no agronomist is available
 * Uses ML model predictions + internet knowledge + community insights
 */

class AiBotService {
  constructor() {
    this.botUserId = 'ai-bot-system'; // Special ID for bot messages
    this.aiApiUrl = process.env.OPENAI_API_URL || null;
    this.aiApiKey = process.env.OPENAI_API_KEY || null;
  }

  /**
   * Check if AI bot should be activated for a consultation
   * Activate if no agronomist accepts within 2 minutes
   */
  async shouldActivateBot(consultationId) {
    try {
      const consultation = await Consultation.findById(consultationId);
      if (!consultation || consultation.status !== 'pending') {
        return false;
      }

      const waitTime = Date.now() - consultation.createdAt.getTime();
      const twoMinutes = 2 * 60 * 1000;

      return waitTime >= twoMinutes;
    } catch (error) {
      console.error('Error checking bot activation:', error);
      return false;
    }
  }

  /**
   * Activate AI bot for a consultation
   */
  async activateForConsultation(consultationId) {
    try {
      const consultation = await Consultation.findById(consultationId)
        .populate('userId', 'name email')
        .populate('analysisId');

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Mark consultation as AI-assisted
      await consultation.activateAiBot();

      // Send welcome message
      const welcomeMessage = await this.sendWelcomeMessage(consultation);

      // Send notification email
      await sendEmail({
        to: consultation.userId.email,
        subject: 'Your Consultation is Now Active',
        template: 'ai-bot-activated',
        data: {
          userName: consultation.userId.name,
          consultationId: consultation._id,
          message: 'Our AI assistant is now helping you with your plant health query.',
        },
      });

      return {
        success: true,
        message: 'AI bot activated successfully',
        welcomeMessage,
      };
    } catch (error) {
      console.error('Error activating AI bot:', error);
      throw error;
    }
  }

  /**
   * Send welcome message from AI bot
   */
  async sendWelcomeMessage(consultation) {
    const welcomeText = `Hello! I'm AgriIQ's AI Assistant. 🌱\n\nI see you're experiencing issues with your ${consultation.plantName}. While we're connecting you with our expert agronomists, I'm here to provide immediate guidance based on:\n\n• Advanced ML disease detection\n• Community-verified solutions\n• Regional best practices\n• Scientific research\n\nFeel free to ask me anything about your plant's condition, and I'll provide detailed recommendations! An agronomist will join our chat as soon as one becomes available.`;

    const message = new Message({
      consultationId: consultation._id,
      senderId: this.botUserId,
      receiverId: consultation.userId,
      content: welcomeText,
      messageType: 'text',
      isFromBot: true,
    });

    await message.save();
    return message;
  }

  /**
   * Generate AI response to user query
   */
  async generateResponse(consultationId, userMessage) {
    try {
      const consultation = await Consultation.findById(consultationId)
        .populate('analysisId')
        .populate('userId', 'name region');

      if (!consultation) {
        throw new Error('Consultation not found');
      }

      // Build context from analysis data
      const context = this.buildContext(consultation, userMessage);

      // Get AI response
      let aiResponse;
      if (this.aiApiUrl && this.aiApiKey) {
        aiResponse = await this.callAiApi(context);
      } else {
        // Fallback to rule-based response
        aiResponse = await this.generateRuleBasedResponse(consultation, userMessage);
      }

      // Save bot message
      const botMessage = new Message({
        consultationId: consultation._id,
        senderId: this.botUserId,
        receiverId: consultation.userId,
        content: aiResponse,
        messageType: 'text',
        isFromBot: true,
      });

      await botMessage.save();

      return {
        success: true,
        message: botMessage,
      };
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw error;
    }
  }

  /**
   * Build context for AI response
   */
  buildContext(consultation, userMessage) {
    const analysis = consultation.analysisId;
    
    return {
      disease: analysis.diagnosis,
      confidence: analysis.confidence,
      plantSpecies: analysis.plantSpecies,
      symptoms: consultation.symptoms,
      region: consultation.userId.region,
      season: consultation.season,
      userQuery: userMessage,
    };
  }

  /**
   * Call external AI API (OpenAI, etc.)
   */
  async callAiApi(context) {
    try {
      const prompt = `You are AgriIQ's plant health expert assistant. Based on the following information, provide detailed, actionable advice:\n\nDisease Detected: ${context.disease}\nConfidence: ${(context.confidence * 100).toFixed(1)}%\nPlant Species: ${context.plantSpecies || 'Unknown'}\nSymptoms: ${context.symptoms}\nRegion: ${context.region}\nSeason: ${context.season}\n\nUser's Question: ${context.userQuery}\n\nProvide a comprehensive response with:\n1. Diagnosis confirmation\n2. Treatment recommendations (organic preferred)\n3. Prevention tips\n4. Regional considerations\n\nKeep the tone friendly and supportive.`;

      const response = await axios.post(
        this.aiApiUrl,
        {
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert agricultural AI assistant specializing in plant health diagnosis and organic farming practices.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          max_tokens: 500,
          temperature: 0.7,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.aiApiKey}`,
          },
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('AI API error:', error.message);
      // Fallback to rule-based
      return this.generateRuleBasedResponse(consultation, context.userQuery);
    }
  }

  /**
   * Generate rule-based response (fallback)
   */
  async generateRuleBasedResponse(consultation, userMessage) {
    const analysis = consultation.analysisId;
    const disease = analysis.diagnosis.toLowerCase();

    // Check message intent
    const msg = userMessage.toLowerCase();

    if (msg.includes('treatment') || msg.includes('cure') || msg.includes('remedy')) {
      return this.getTreatmentResponse(disease, consultation.region);
    }

    if (msg.includes('prevent') || msg.includes('avoid')) {
      return this.getPreventionResponse(disease);
    }

    if (msg.includes('organic') || msg.includes('natural')) {
      return this.getOrganicRemedies(disease);
    }

    if (msg.includes('urgent') || msg.includes('severe') || msg.includes('dying')) {
      return this.getUrgentResponse(disease);
    }

    // Default comprehensive response
    return this.getComprehensiveResponse(consultation);
  }

  /**
   * Get treatment response
   */
  getTreatmentResponse(disease, region) {
    return `Based on the detected ${disease}, here's a recommended treatment plan:\n\n**Immediate Actions:**\n• Isolate affected plant to prevent spread\n• Remove severely damaged leaves\n• Improve air circulation around the plant\n\n**Treatment:**\n• Apply neem oil spray (2 tbsp per liter water) every 3 days\n• Use copper-based fungicide for severe cases\n• Ensure proper drainage to avoid waterlogging\n\n**Regional Tip for ${region}:**\n• Adjust watering schedule based on local climate\n• Consider using locally available organic pesticides\n\nWould you like specific product recommendations or more details on organic remedies?`;
  }

  /**
   * Get prevention response
   */
  getPreventionResponse(disease) {
    return `To prevent ${disease} in the future:\n\n**Cultural Practices:**\n• Maintain proper plant spacing (min 2 feet)\n• Avoid overhead watering\n• Water early morning, not evening\n• Remove fallen leaves regularly\n\n**Soil Management:**\n• Ensure good drainage\n• Add organic compost monthly\n• Maintain soil pH 6.0-7.0\n\n**Monitoring:**\n• Inspect plants weekly\n• Look for early symptoms\n• Act quickly at first sign\n\nWant me to explain any of these practices in detail?`;
  }

  /**
   * Get organic remedies
   */
  getOrganicRemedies(disease) {
    return `Here are effective organic remedies for ${disease}:\n\n**1. Neem Oil Solution**\n• Mix 2 tbsp neem oil + 1 tsp dish soap per liter water\n• Spray every 7 days\n• Apply in evening to avoid leaf burn\n\n**2. Garlic-Chili Spray**\n• Blend 10 garlic cloves + 2 green chilies\n• Dilute in 1 liter water\n• Strain and spray on affected areas\n\n**3. Baking Soda Mix**\n• 1 tbsp baking soda + 1 tbsp vegetable oil\n• Mix in 4 liters water\n• Effective against fungal diseases\n\n**4. Turmeric Paste**\n• Mix turmeric powder with water\n• Apply on infected stems/leaves\n• Natural antiseptic\n\nThese are safe, chemical-free, and locally available! Which one would you like to try first?`;
  }

  /**
   * Get urgent response
   */
  getUrgentResponse(disease) {
    return `⚠️ I understand this seems urgent. Here's what you should do RIGHT NOW:\n\n**IMMEDIATE STEPS (Next 30 mins):**\n1. Move plant away from healthy plants\n2. Remove all heavily damaged/dead parts\n3. Stop watering for now\n4. Take clear photos of symptoms\n\n**WITHIN 24 HOURS:**\n1. Apply emergency treatment (neem oil spray)\n2. Check roots for rot\n3. Improve drainage if soggy soil\n\n**IMPORTANT:**\nI'm an AI assistant. For critical cases, I strongly recommend:\n• Waiting for our expert agronomist (joining soon)\n• Visiting local agricultural extension office\n• Consulting a plant pathologist if plant is valuable\n\nThe detected ${disease} is typically manageable with proper care. Stay calm and follow these steps. I'm here to help!\n\nWhat's your plant's current condition? Still has green leaves?`;
  }

  /**
   * Get comprehensive response
   */
  getComprehensiveResponse(consultation) {
    const analysis = consultation.analysisId;
    return `Based on our ML analysis, your ${consultation.plantName} shows signs of **${analysis.diagnosis}** (${(analysis.confidence * 100).toFixed(1)}% confidence).\n\n**Quick Summary:**\n• Disease: ${analysis.diagnosis}\n• Severity: Moderate\n• Prognosis: Good with treatment\n\n**What This Means:**\nThis condition is common in ${consultation.season} season and is treatable with proper care.\n\n**Next Steps:**\n1. Start with neem oil treatment\n2. Improve plant care routine\n3. Monitor daily for changes\n\n**I can help you with:**\n• Detailed treatment plans\n• Organic remedies\n• Prevention strategies\n• Product recommendations\n• Regional-specific advice\n\nWhat would you like to know more about?`;
  }

  /**
   * Notify when agronomist joins
   */
  async notifyAgronomistJoined(consultationId, agronomistName) {
    const consultation = await Consultation.findById(consultationId);
    if (!consultation) return;

    const message = new Message({
      consultationId: consultation._id,
      senderId: this.botUserId,
      receiverId: consultation.userId,
      content: `Good news! 🎉 **${agronomistName}**, our expert agronomist, has joined the consultation. They'll take over from here and provide personalized guidance. Feel free to ask them anything!`,
      messageType: 'text',
      isFromBot: true,
    });

    await message.save();
    return message;
  }
}

module.exports = new AiBotService();
