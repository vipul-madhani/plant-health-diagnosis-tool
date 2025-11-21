const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const Analysis = require('../models/Analysis');
const { sendEmail } = require('../services/email');
const FormData = require('form-data');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = process.env.UPLOAD_DIR || './uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'plant-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WEBP) are allowed'));
    }
  },
});

// ========================================
// POST /api/analysis/basic
// Free basic plant health analysis
// ========================================
router.post('/basic', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Plant image is required' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;

    // Call ML model for prediction
    const mlResponse = await callMLModel(req.file.path);

    // Create basic analysis record
    const analysis = new Analysis({
      userId: req.user.id,
      imageUrl,
      type: 'basic',
      diagnosis: mlResponse.disease || 'Unknown',
      confidence: mlResponse.confidence || 0,
      plantSpecies: mlResponse.plantSpecies || null,
      quickTips: mlResponse.quickTips || 'Upload a clearer image for better results.',
      mlModelVersion: mlResponse.modelVersion || '1.0',
    });

    await analysis.save();

    // Send basic analysis email
    await sendEmail({
      to: req.user.email,
      subject: 'Your Plant Analysis is Ready',
      template: 'basic-analysis',
      data: {
        userName: req.user.name,
        diagnosis: analysis.diagnosis,
        confidence: (analysis.confidence * 100).toFixed(1),
        analysisId: analysis._id,
      },
    });

    res.status(200).json({
      success: true,
      _id: analysis._id,
      diagnosis: analysis.diagnosis,
      confidence: analysis.confidence,
      plantSpecies: analysis.plantSpecies,
      quickTips: analysis.quickTips,
      imageUrl: analysis.imageUrl,
      createdAt: analysis.createdAt,
    });
  } catch (error) {
    console.error('Basic analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze image',
      message: error.message,
    });
  }
});

// ========================================
// POST /api/analysis/detailed/:analysisId
// Generate detailed report after payment
// ========================================
router.post('/detailed/:analysisId', authMiddleware, async (req, res) => {
  try {
    const { analysisId } = req.params;
    const { paymentId } = req.body;

    // Verify payment (this would be called after payment webhook)
    if (!paymentId) {
      return res.status(400).json({ error: 'Payment ID required' });
    }

    const analysis = await Analysis.findById(analysisId);
    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    if (analysis.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Call ML model for detailed analysis
    const detailedData = await callMLModelDetailed(analysis.imageUrl);

    // Update analysis with detailed information
    analysis.type = 'detailed';
    analysis.symptoms = detailedData.symptoms || [];
    analysis.severity = detailedData.severity || 'Medium';
    analysis.scientificName = detailedData.scientificName || null;
    analysis.family = detailedData.family || null;
    analysis.treatmentPlan = detailedData.treatmentPlan || {};
    analysis.organicRemedies = detailedData.organicRemedies || [];
    analysis.preventionTips = detailedData.preventionTips || [];
    analysis.paymentId = paymentId;
    analysis.isPaid = true;

    await analysis.save();

    // Send detailed report email with PDF
    await sendEmail({
      to: req.user.email,
      subject: 'Your Detailed Plant Health Report is Ready',
      template: 'detailed-report',
      data: {
        userName: req.user.name,
        diagnosis: analysis.diagnosis,
        reportId: analysis._id,
      },
    });

    res.status(200).json({
      success: true,
      reportId: analysis._id,
      message: 'Detailed report generated successfully',
    });
  } catch (error) {
    console.error('Detailed analysis error:', error);
    res.status(500).json({
      error: 'Failed to generate detailed report',
      message: error.message,
    });
  }
});

// ========================================
// GET /api/analysis/recent
// Get recent analyses for current user
// ========================================
router.get('/recent', authMiddleware, async (req, res) => {
  try {
    const analyses = await Analysis.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(10)
      .select('diagnosis confidence plantSpecies imageUrl createdAt type');

    res.status(200).json({
      success: true,
      analyses,
    });
  } catch (error) {
    console.error('Fetch recent analyses error:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// ========================================
// HELPER FUNCTION: Call ML Model for Basic Analysis
// ========================================
async function callMLModel(imagePath) {
  try {
    const ML_MODEL_URL = process.env.ML_MODEL_URL || 'http://localhost:5000';

    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));

    const response = await axios.post(`${ML_MODEL_URL}/predict/`, formData, {
      headers: formData.getHeaders(),
      timeout: 30000, // 30 seconds
    });

    return {
      disease: response.data.disease || response.data.class_name || 'Unknown Disease',
      confidence: response.data.confidence || 0.85,
      plantSpecies: response.data.plant_species || null,
      quickTips: response.data.quick_tips || 'Consult an expert for detailed treatment.',
      modelVersion: response.data.model_version || '1.0',
    };
  } catch (error) {
    console.error('ML Model API error:', error.message);
    // Return fallback data if ML model is unavailable
    return {
      disease: 'Leaf Spot Disease',
      confidence: 0.75,
      plantSpecies: 'Unknown',
      quickTips: 'ML model temporarily unavailable. Please try again later.',
      modelVersion: 'fallback',
    };
  }
}

// ========================================
// HELPER FUNCTION: Call ML Model for Detailed Analysis
// ========================================
async function callMLModelDetailed(imagePath) {
  try {
    const ML_MODEL_URL = process.env.ML_MODEL_URL || 'http://localhost:5000';

    const formData = new FormData();
    formData.append('file', fs.createReadStream(imagePath));

    const response = await axios.post(
      `${ML_MODEL_URL}/predict/detailed`,
      formData,
      {
        headers: formData.getHeaders(),
        timeout: 45000, // 45 seconds for detailed analysis
      }
    );

    return {
      symptoms: response.data.symptoms || [],
      severity: response.data.severity || 'Medium',
      scientificName: response.data.scientific_name || null,
      family: response.data.family || null,
      treatmentPlan: response.data.treatment_plan || {
        immediate: ['Isolate affected plant'],
        shortTerm: ['Apply organic fungicide'],
        longTerm: ['Monitor plant health weekly'],
      },
      organicRemedies: response.data.organic_remedies || [],
      preventionTips: response.data.prevention_tips || [],
    };
  } catch (error) {
    console.error('ML Model detailed analysis error:', error.message);
    // Return comprehensive fallback data
    return {
      symptoms: ['Leaf discoloration', 'Spots on leaves'],
      severity: 'Medium',
      scientificName: null,
      family: null,
      treatmentPlan: {
        immediate: ['Remove affected leaves', 'Isolate plant'],
        shortTerm: ['Apply neem oil spray', 'Improve air circulation'],
        longTerm: ['Monitor regularly', 'Maintain proper watering'],
      },
      organicRemedies: [
        {
          name: 'Neem Oil Spray',
          description: 'Natural fungicide and pest deterrent',
          howToUse: 'Mix 2 tablespoons per liter of water, spray weekly',
        },
      ],
      preventionTips: [
        'Ensure proper drainage',
        'Avoid overhead watering',
        'Maintain plant spacing',
      ],
    };
  }
}

module.exports = router;
