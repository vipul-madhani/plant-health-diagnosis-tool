const mongoose = require('mongoose');

const analysisSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    imageUrl: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['basic', 'detailed'],
      default: 'basic',
      index: true,
    },
    // Basic Analysis Fields
    diagnosis: {
      type: String,
      required: true,
    },
    confidence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0,
    },
    plantSpecies: {
      type: String,
      default: null,
    },
    quickTips: {
      type: String,
      default: '',
    },
    mlModelVersion: {
      type: String,
      default: '1.0',
    },

    // Detailed Analysis Fields
    symptoms: {
      type: [String],
      default: [],
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: null,
    },
    scientificName: {
      type: String,
      default: null,
    },
    family: {
      type: String,
      default: null,
    },
    treatmentPlan: {
      immediate: {
        type: [String],
        default: [],
      },
      shortTerm: {
        type: [String],
        default: [],
      },
      longTerm: {
        type: [String],
        default: [],
      },
    },
    organicRemedies: [
      {
        name: String,
        description: String,
        howToUse: String,
      },
    ],
    preventionTips: {
      type: [String],
      default: [],
    },

    // Payment & PDF
    isPaid: {
      type: Boolean,
      default: false,
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    pdfPath: {
      type: String,
      default: null,
    },

    // Soft delete
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ userId: 1, type: 1 });

const Analysis = mongoose.model('Analysis', analysisSchema);

module.exports = Analysis;
