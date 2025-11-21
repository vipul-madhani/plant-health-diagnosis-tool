const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { authMiddleware } = require('../middleware/auth');
const Analysis = require('../models/Analysis');
const { generateDetailedReport } = require('../services/reportGenerator');

// ========================================
// GET /api/reports
// Get all reports for current user
// ========================================
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { filter = 'all', page = 1, limit = 10 } = req.query;

    const query = { userId: req.user.id };

    // Apply filter
    if (filter === 'paid') {
      query.type = 'detailed';
      query.isPaid = true;
    } else if (filter === 'free') {
      query.type = 'basic';
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const reports = await Analysis.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .select(
        'diagnosis confidence plantSpecies imageUrl createdAt type severity isPaid'
      );

    const total = await Analysis.countDocuments(query);

    res.status(200).json({
      success: true,
      reports,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Fetch reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// ========================================
// GET /api/reports/:reportId
// Get detailed report by ID
// ========================================
router.get('/:reportId', authMiddleware, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Analysis.findById(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check authorization
    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // For detailed reports, check if user has paid
    if (report.type === 'detailed' && !report.isPaid) {
      return res.status(403).json({
        error: 'Payment required',
        message: 'This is a paid report. Please complete payment to access.',
      });
    }

    res.status(200).json({
      success: true,
      _id: report._id,
      diagnosis: report.diagnosis,
      confidence: report.confidence,
      plantSpecies: report.plantSpecies,
      scientificName: report.scientificName,
      family: report.family,
      imageUrl: report.imageUrl,
      type: report.type,
      severity: report.severity,
      symptoms: report.symptoms || [],
      treatmentPlan: report.treatmentPlan || {},
      organicRemedies: report.organicRemedies || [],
      preventionTips: report.preventionTips || [],
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    });
  } catch (error) {
    console.error('Fetch report error:', error);
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// ========================================
// GET /api/reports/:reportId/download
// Download report as PDF
// ========================================
router.get('/:reportId/download', authMiddleware, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Analysis.findById(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check authorization
    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Only detailed reports can be downloaded
    if (report.type !== 'detailed' || !report.isPaid) {
      return res.status(403).json({
        error: 'Access denied',
        message:
          'Only paid detailed reports can be downloaded. Please upgrade to detailed report.',
      });
    }

    // Check if PDF already exists
    if (report.pdfPath && fs.existsSync(report.pdfPath)) {
      return res.download(report.pdfPath, `plant-health-report-${reportId}.pdf`);
    }

    // Generate PDF
    const user = req.user;
    const pdfPath = await generateDetailedReport(report, user);

    // Save PDF path to database
    report.pdfPath = pdfPath;
    await report.save();

    // Send PDF file
    res.download(pdfPath, `plant-health-report-${reportId}.pdf`, (err) => {
      if (err) {
        console.error('PDF download error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Failed to download PDF' });
        }
      }
    });
  } catch (error) {
    console.error('Download report error:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
});

// ========================================
// DELETE /api/reports/:reportId
// Delete a report (soft delete)
// ========================================
router.delete('/:reportId', authMiddleware, async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await Analysis.findById(reportId);

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Check authorization
    if (report.userId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    // Soft delete - mark as deleted instead of removing
    report.isDeleted = true;
    report.deletedAt = new Date();
    await report.save();

    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
    });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

// ========================================
// GET /api/reports/stats/summary
// Get report statistics for current user
// ========================================
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const totalReports = await Analysis.countDocuments({
      userId,
      isDeleted: { $ne: true },
    });

    const detailedReports = await Analysis.countDocuments({
      userId,
      type: 'detailed',
      isPaid: true,
      isDeleted: { $ne: true },
    });

    const basicReports = await Analysis.countDocuments({
      userId,
      type: 'basic',
      isDeleted: { $ne: true },
    });

    // Get most common diagnoses
    const topDiagnoses = await Analysis.aggregate([
      { $match: { userId: req.user._id, isDeleted: { $ne: true } } },
      { $group: { _id: '$diagnosis', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalReports,
        detailedReports,
        basicReports,
        topDiagnoses: topDiagnoses.map((d) => ({
          diagnosis: d._id,
          count: d.count,
        })),
      },
    });
  } catch (error) {
    console.error('Fetch stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;
