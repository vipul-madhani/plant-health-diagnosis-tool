const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const Consultation = require('../models/Consultation');
const User = require('../models/User');
const Analysis = require('../models/Analysis');
const Message = require('../models/Message');
const { sendEmail } = require('../services/email');
const aiBotService = require('../services/ai_bot_service');

// ========================================
// GET /api/consultation/agronomists/available
// Get count of online agronomists
// ========================================
router.get('/agronomists/available', authMiddleware, async (req, res) => {
  try {
    const count = await User.getOnlineAgronomistsCount();
    const agronomists = await User.getAvailableAgronomists();

    res.status(200).json({
      success: true,
      count,
      agronomists: agronomists.map(a => ({
        id: a._id,
        name: a.name,
        specialization: a.specialization,
        totalConsultations: a.totalConsultations,
        effectivenessRating: a.effectivenessRating,
        lastActive: a.lastActiveAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching available agronomists:', error);
    res.status(500).json({ error: 'Failed to fetch agronomists' });
  }
});

// ========================================
// POST /api/consultation/create
// Create new consultation (after payment)
// ========================================
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { analysisId, plantName, symptoms, imageUrls, region, season, paymentId } = req.body;

    if (!analysisId || !plantName || !symptoms) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Verify analysis belongs to user
    const analysis = await Analysis.findById(analysisId);
    if (!analysis || analysis.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Create consultation
    const consultation = new Consultation({
      userId: req.user.id,
      analysisId,
      plantName,
      symptoms,
      imageUrls: imageUrls || [analysis.imageUrl],
      region: region || req.user.region,
      season,
      amount: 199, // ₹199 for consultation
      paymentId,
      status: 'pending',
    });

    await consultation.save();

    // Get queue position
    const queuePosition = await Consultation.getQueuePosition(consultation._id);
    consultation.queuePosition = queuePosition;
    await consultation.save();

    // Send notification email
    await sendEmail({
      to: req.user.email,
      subject: 'Consultation Request Submitted',
      template: 'consultation-created',
      data: {
        userName: req.user.name,
        consultationId: consultation._id,
        queuePosition,
        plantName,
      },
    });

    // Schedule AI bot activation after 2 minutes if no agronomist accepts
    setTimeout(async () => {
      const shouldActivate = await aiBotService.shouldActivateBot(consultation._id);
      if (shouldActivate) {
        await aiBotService.activateForConsultation(consultation._id);
      }
    }, 2 * 60 * 1000); // 2 minutes

    res.status(201).json({
      success: true,
      consultation: {
        id: consultation._id,
        queuePosition,
        status: consultation.status,
        estimatedWaitTime: queuePosition * 5, // Rough estimate: 5 min per consultation
      },
    });
  } catch (error) {
    console.error('Error creating consultation:', error);
    res.status(500).json({ error: 'Failed to create consultation' });
  }
});

// ========================================
// GET /api/consultation/queue
// Get FIFO queue for agronomists
// ========================================
router.get('/queue', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'agronomist') {
      return res.status(403).json({ error: 'Only agronomists can view queue' });
    }

    const queue = await Consultation.getFIFOQueue();

    res.status(200).json({
      success: true,
      queue: queue.map((c, index) => ({
        id: c._id,
        position: index + 1,
        plantName: c.plantName,
        symptoms: c.symptoms,
        region: c.region,
        season: c.season,
        farmerName: c.userId.name,
        farmerPhone: c.userId.phone,
        imageUrls: c.imageUrls,
        diagnosis: c.analysisId?.diagnosis,
        confidence: c.analysisId?.confidence,
        createdAt: c.createdAt,
        waitTime: Math.round((Date.now() - c.createdAt.getTime()) / 60000), // Minutes
      })),
    });
  } catch (error) {
    console.error('Error fetching queue:', error);
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// ========================================
// POST /api/consultation/:id/accept
// Agronomist accepts consultation manually
// ========================================
router.post('/:id/accept', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'agronomist') {
      return res.status(403).json({ error: 'Only agronomists can accept consultations' });
    }

    const consultation = await Consultation.findById(req.params.id)
      .populate('userId', 'name email phone');

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    if (consultation.status !== 'pending') {
      return res.status(400).json({ error: 'Consultation already accepted or completed' });
    }

    // Accept consultation
    await consultation.acceptByAgronomist(req.user.id);

    // Update agronomist status
    await User.findByIdAndUpdate(req.user.id, {
      isOnline: true,
      lastActiveAt: new Date(),
    });

    // If AI bot was active, notify handoff
    if (consultation.isAiBotAssisted) {
      await aiBotService.notifyAgronomistJoined(consultation._id, req.user.name);
    }

    // Send email to farmer
    await sendEmail({
      to: consultation.userId.email,
      subject: 'Agronomist Assigned to Your Consultation',
      template: 'agronomist-assigned',
      data: {
        userName: consultation.userId.name,
        agronomistName: req.user.name,
        consultationId: consultation._id,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Consultation accepted successfully',
      consultation: {
        id: consultation._id,
        status: consultation.status,
        farmer: {
          name: consultation.userId.name,
          phone: consultation.userId.phone,
        },
        waitTime: consultation.waitTimeMinutes,
      },
    });
  } catch (error) {
    console.error('Error accepting consultation:', error);
    res.status(500).json({ error: 'Failed to accept consultation' });
  }
});

// ========================================
// GET /api/consultation/my-consultations
// Get user's consultations
// ========================================
router.get('/my-consultations', authMiddleware, async (req, res) => {
  try {
    const consultations = await Consultation.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .populate('agronomistId', 'name specialization')
      .populate('analysisId', 'diagnosis confidence');

    res.status(200).json({
      success: true,
      consultations: consultations.map(c => ({
        id: c._id,
        plantName: c.plantName,
        status: c.status,
        isAiBotAssisted: c.isAiBotAssisted,
        agronomist: c.agronomistId ? {
          name: c.agronomistId.name,
          specialization: c.agronomistId.specialization,
        } : null,
        diagnosis: c.analysisId?.diagnosis,
        amount: c.amount,
        paymentStatus: c.paymentStatus,
        createdAt: c.createdAt,
        completedAt: c.completedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching consultations:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// ========================================
// GET /api/consultation/agronomist/active
// Get agronomist's active consultations
// ========================================
router.get('/agronomist/active', authMiddleware, async (req, res) => {
  try {
    if (req.user.role !== 'agronomist') {
      return res.status(403).json({ error: 'Only agronomists can view this' });
    }

    const consultations = await Consultation.find({
      agronomistId: req.user.id,
      status: { $in: ['accepted', 'in_progress'] },
    })
      .sort({ acceptedAt: -1 })
      .populate('userId', 'name phone region')
      .populate('analysisId', 'diagnosis confidence imageUrl');

    res.status(200).json({
      success: true,
      consultations: consultations.map(c => ({
        id: c._id,
        farmer: {
          name: c.userId.name,
          phone: c.userId.phone,
          region: c.userId.region,
        },
        plantName: c.plantName,
        symptoms: c.symptoms,
        diagnosis: c.analysisId?.diagnosis,
        status: c.status,
        isAiBotAssisted: c.isAiBotAssisted,
        earning: c.agronomistEarning,
        acceptedAt: c.acceptedAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching active consultations:', error);
    res.status(500).json({ error: 'Failed to fetch consultations' });
  }
});

// ========================================
// POST /api/consultation/:id/complete
// Complete consultation
// ========================================
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const consultation = await Consultation.findById(req.params.id)
      .populate('userId', 'name email')
      .populate('agronomistId', 'name');

    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    // Only agronomist or farmer can complete
    const isAgronomist = req.user.role === 'agronomist' && consultation.agronomistId?._id.toString() === req.user.id;
    const isFarmer = consultation.userId._id.toString() === req.user.id;

    if (!isAgronomist && !isFarmer) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    await consultation.complete();

    // Update agronomist stats
    if (consultation.agronomistId) {
      await User.findByIdAndUpdate(consultation.agronomistId, {
        $inc: { 
          totalConsultations: 1,
          totalEarnings: consultation.agronomistEarning,
          pendingEarnings: consultation.agronomistEarning,
        },
      });
    }

    // Send completion email
    await sendEmail({
      to: consultation.userId.email,
      subject: 'Consultation Completed',
      template: 'consultation-completed',
      data: {
        userName: consultation.userId.name,
        agronomistName: consultation.agronomistId?.name || 'AI Assistant',
        consultationId: consultation._id,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Consultation completed successfully',
    });
  } catch (error) {
    console.error('Error completing consultation:', error);
    res.status(500).json({ error: 'Failed to complete consultation' });
  }
});

// ========================================
// POST /api/consultation/:id/rate
// Rate consultation
// ========================================
router.post('/:id/rate', authMiddleware, async (req, res) => {
  try {
    const { rating, feedback } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const consultation = await Consultation.findById(req.params.id);
    if (!consultation) {
      return res.status(404).json({ error: 'Consultation not found' });
    }

    if (consultation.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    consultation.userRating = rating;
    consultation.userFeedback = feedback;
    await consultation.save();

    // Update agronomist effectiveness rating
    if (consultation.agronomistId) {
      const allRatings = await Consultation.find({
        agronomistId: consultation.agronomistId,
        userRating: { $ne: null },
      }).select('userRating');

      const avgRating = allRatings.reduce((sum, c) => sum + c.userRating, 0) / allRatings.length;
      const effectiveness = (avgRating / 5) * 100;

      await User.findByIdAndUpdate(consultation.agronomistId, {
        effectivenessRating: effectiveness,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Rating submitted successfully',
    });
  } catch (error) {
    console.error('Error rating consultation:', error);
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

module.exports = router;
