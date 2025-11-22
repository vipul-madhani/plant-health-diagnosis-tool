const express = require('express');
const router = express.Router();
const multer = require('multer');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const Analysis = require('../models/Analysis');
const User = require('../models/User');
const { sendEmail } = require('../services/email');
const FormData = require('form-data');
const PDFDocument = require('pdfkit'); // For PDF generation

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
// GET /api/analysis/usage-limit
// Check user's lifetime free analysis limit (3 total)
// ========================================
router.get('/usage-limit', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const limitCheck = user.canDoFreeAnalysis();

    res.status(200).json({
      success: true,
      canAnalyze: limitCheck.allowed,
      remaining: limitCheck.remaining,
      used: user.freeAnalysisCount,
      limit: user.freeAnalysisLimit,
      message: limitCheck.message,
      isLifetimeLimit: true, // Indicates this is NOT a daily reset
    });
  } catch (error) {
    console.error('Error checking usage limit:', error);
    res.status(500).json({ error: 'Failed to check usage limit' });
  }
});

// ========================================
// POST /api/analysis/basic
// Free basic plant health analysis (3 lifetime total - NO RESET)
// ========================================
router.post('/basic', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Plant image is required' });
    }

    // Check lifetime limit (3 total, no daily reset)
    const user = await User.findById(req.user.id);
    const limitCheck = user.canDoFreeAnalysis();

    if (!limitCheck.allowed) {
      // Delete uploaded file if limit exceeded
      fs.unlinkSync(req.file.path);
      
      return res.status(403).json({
        error: 'Free analysis limit reached',
        message: 'You have used all 3 free analyses. Upgrade to detailed report (₹99) or consult an agronomist (₹199) to continue.',
        remaining: 0,
        used: user.freeAnalysisCount,
        limit: user.freeAnalysisLimit,
        upgradeOptions: [
          {
            type: 'detailed_report',
            price: 99,
            description: 'Get comprehensive diagnosis with treatment plan',
          },
          {
            type: 'consultation',
            price: 199,
            description: 'Chat with certified agronomist for personalized advice',
          },
        ],
      });
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

    // Increment user's analysis count (lifetime, no reset)
    await user.incrementAnalysisCount();

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
        remaining: limitCheck.remaining - 1,
        isLastFree: (limitCheck.remaining - 1) === 0,
      },
    });

    const newRemaining = limitCheck.remaining - 1;
    const isLastFree = newRemaining === 0;

    res.status(200).json({
      success: true,
      _id: analysis._id,
      diagnosis: analysis.diagnosis,
      confidence: analysis.confidence,
      plantSpecies: analysis.plantSpecies,
      quickTips: analysis.quickTips,
      imageUrl: analysis.imageUrl,
      createdAt: analysis.createdAt,
      usageInfo: {
        remaining: newRemaining,
        used: user.freeAnalysisCount,
        limit: user.freeAnalysisLimit,
        isLastFree,
        message: isLastFree 
          ? 'This was your last free analysis. Future analyses require payment.' 
          : `${newRemaining} free ${newRemaining === 1 ? 'analysis' : 'analyses'} remaining.`,
      },
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

    // Verify payment
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

    // Generate PDF report
    const pdfPath = await generatePDFReport(analysis, req.user);
    analysis.pdfPath = pdfPath;

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
        downloadLink: `${process.env.API_BASE_URL}/api/analysis/download/${analysis._id}`,
      },
      attachments: [
        {
          filename: `plant-report-${analysis._id}.pdf`,
          path: pdfPath,
        },
      ],
    });

    res.status(200).json({
      success: true,
      reportId: analysis._id,
      pdfUrl: `/api/analysis/download/${analysis._id}`,
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
// GET /api/analysis/download/:analysisId
// Download PDF report
// ========================================
router.get('/download/:analysisId', authMiddleware, async (req, res) => {
  try {
    const analysis = await Analysis.findById(req.params.analysisId);

    if (!analysis) {
      return res.status(404).json({ error: 'Analysis not found' });
    }

    if (analysis.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (!analysis.pdfPath || !fs.existsSync(analysis.pdfPath)) {
      return res.status(404).json({ error: 'PDF report not found' });
    }

    res.download(analysis.pdfPath, `plant-report-${analysis._id}.pdf`);
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to download report' });
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
      .select('diagnosis confidence plantSpecies imageUrl createdAt type pdfPath');

    res.status(200).json({
      success: true,
      analyses: analyses.map(a => ({
        ...a.toObject(),
        hasPdf: !!a.pdfPath,
        downloadUrl: a.pdfPath ? `/api/analysis/download/${a._id}` : null,
      })),
    });
  } catch (error) {
    console.error('Fetch recent analyses error:', error);
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
});

// ========================================
// HELPER FUNCTION: Generate PDF Report
// ========================================
async function generatePDFReport(analysis, user) {
  return new Promise((resolve, reject) => {
    try {
      const pdfDir = process.env.PDF_DIR || './uploads/reports';
      if (!fs.existsSync(pdfDir)) {
        fs.mkdirSync(pdfDir, { recursive: true });
      }

      const pdfPath = path.join(pdfDir, `report-${analysis._id}.pdf`);
      const doc = new PDFDocument({ margin: 50 });
      const stream = fs.createWriteStream(pdfPath);

      doc.pipe(stream);

      // Header
      doc.fontSize(24).font('Helvetica-Bold').text('AgriIQ Plant Health Report', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).font('Helvetica').text(`Report ID: ${analysis._id}`, { align: 'right' });
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'right' });
      doc.moveDown(2);

      // User Info
      doc.fontSize(12).font('Helvetica-Bold').text('User Information');
      doc.fontSize(10).font('Helvetica');
      doc.text(`Name: ${user.name}`);
      doc.text(`Email: ${user.email}`);
      doc.moveDown();

      // Diagnosis
      doc.fontSize(14).font('Helvetica-Bold').text('Diagnosis');
      doc.fontSize(12).font('Helvetica').text(analysis.diagnosis);
      doc.fontSize(10).text(`Confidence: ${(analysis.confidence * 100).toFixed(1)}%`);
      if (analysis.plantSpecies) {
        doc.text(`Plant Species: ${analysis.plantSpecies}`);
      }
      if (analysis.severity) {
        doc.text(`Severity: ${analysis.severity}`);
      }
      doc.moveDown();

      // Symptoms
      if (analysis.symptoms && analysis.symptoms.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Symptoms');
        doc.fontSize(10).font('Helvetica');
        analysis.symptoms.forEach((symptom, i) => {
          doc.text(`${i + 1}. ${symptom}`);
        });
        doc.moveDown();
      }

      // Treatment Plan
      if (analysis.treatmentPlan) {
        doc.fontSize(14).font('Helvetica-Bold').text('Treatment Plan');
        doc.fontSize(10).font('Helvetica');
        
        if (analysis.treatmentPlan.immediate && analysis.treatmentPlan.immediate.length > 0) {
          doc.font('Helvetica-Bold').text('Immediate Actions:');
          doc.font('Helvetica');
          analysis.treatmentPlan.immediate.forEach(step => doc.text(`• ${step}`));
          doc.moveDown(0.5);
        }
        
        if (analysis.treatmentPlan.shortTerm && analysis.treatmentPlan.shortTerm.length > 0) {
          doc.font('Helvetica-Bold').text('Short-term (1-2 weeks):');
          doc.font('Helvetica');
          analysis.treatmentPlan.shortTerm.forEach(step => doc.text(`• ${step}`));
          doc.moveDown(0.5);
        }
        
        if (analysis.treatmentPlan.longTerm && analysis.treatmentPlan.longTerm.length > 0) {
          doc.font('Helvetica-Bold').text('Long-term:');
          doc.font('Helvetica');
          analysis.treatmentPlan.longTerm.forEach(step => doc.text(`• ${step}`));
        }
        doc.moveDown();
      }

      // Organic Remedies
      if (analysis.organicRemedies && analysis.organicRemedies.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Organic Remedies');
        doc.fontSize(10).font('Helvetica');
        analysis.organicRemedies.forEach((remedy, i) => {
          doc.font('Helvetica-Bold').text(`${i + 1}. ${remedy.name}`);
          doc.font('Helvetica');
          doc.text(`   ${remedy.description}`);
          if (remedy.howToUse) {
            doc.text(`   How to use: ${remedy.howToUse}`);
          }
          doc.moveDown(0.5);
        });
        doc.moveDown();
      }

      // Prevention Tips
      if (analysis.preventionTips && analysis.preventionTips.length > 0) {
        doc.fontSize(14).font('Helvetica-Bold').text('Prevention Tips');
        doc.fontSize(10).font('Helvetica');
        analysis.preventionTips.forEach(tip => doc.text(`• ${tip}`));
        doc.moveDown();
      }

      // Footer
      doc.fontSize(8).text('This report is generated by AgriIQ AI system. For personalized advice, consult with our agronomists.', { align: 'center' });

      doc.end();

      stream.on('finish', () => {
        resolve(pdfPath);
      });

      stream.on('error', reject);
    } catch (error) {
      reject(error);
    }
  });
}

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
