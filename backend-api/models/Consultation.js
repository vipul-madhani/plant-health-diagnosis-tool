const mongoose = require('mongoose');

const consultationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    agronomistId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    analysisId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Analysis',
      required: true,
    },
    
    // Consultation Details
    plantName: {
      type: String,
      required: true,
    },
    symptoms: {
      type: String,
      required: true,
    },
    imageUrls: {
      type: [String],
      default: [],
    },
    region: {
      type: String,
      enum: ['North', 'South', 'East', 'West', 'Central', 'Northeast'],
      required: true,
    },
    season: {
      type: String,
      enum: ['Summer', 'Monsoon', 'Winter', 'Spring', 'Autumn'],
      required: true,
    },

    // Status Flow
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
      index: true,
    },
    
    // AI Bot Support
    isAiBotAssisted: {
      type: Boolean,
      default: false,
    },
    aiBotActivatedAt: {
      type: Date,
      default: null,
    },
    
    // Manual Acceptance Tracking
    acceptedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    
    // FIFO Queue Position
    queuePosition: {
      type: Number,
      default: null,
    },
    waitTimeMinutes: {
      type: Number,
      default: 0,
    },

    // Payment & Commission
    amount: {
      type: Number,
      required: true,
      default: 199, // ₹199 for consultation
    },
    platformCommission: {
      type: Number,
      default: 0, // 30% = amount * 0.3
    },
    agronomistEarning: {
      type: Number,
      default: 0, // 70% = amount * 0.7
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'collected'],
      default: 'pending',
      index: true,
    },
    paymentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
      default: null,
    },
    collectedAt: {
      type: Date,
      default: null,
    },

    // Effectiveness Tracking
    userRating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },
    userFeedback: {
      type: String,
      default: null,
    },
    effectiveness: {
      type: Number,
      min: 0,
      max: 100,
      default: null,
    },

    // Notes
    agronomistNotes: {
      type: String,
      default: null,
    },
    adminNotes: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
consultationSchema.index({ userId: 1, createdAt: -1 });
consultationSchema.index({ agronomistId: 1, status: 1 });
consultationSchema.index({ status: 1, createdAt: 1 }); // For FIFO queue
consultationSchema.index({ createdAt: 1 }); // For FIFO ordering

// Calculate commission split before saving
consultationSchema.pre('save', function (next) {
  if (this.isModified('amount')) {
    this.platformCommission = Math.round(this.amount * 0.3);
    this.agronomistEarning = Math.round(this.amount * 0.7);
  }
  next();
});

// Static method to get FIFO queue
consultationSchema.statics.getFIFOQueue = async function () {
  return await this.find({ status: 'pending' })
    .sort({ createdAt: 1 }) // Oldest first (FIFO)
    .populate('userId', 'name email phone region')
    .populate('analysisId', 'diagnosis imageUrl');
};

// Static method to get queue position
consultationSchema.statics.getQueuePosition = async function (consultationId) {
  const consultation = await this.findById(consultationId);
  if (!consultation) return null;

  const position = await this.countDocuments({
    status: 'pending',
    createdAt: { $lt: consultation.createdAt },
  });

  return position + 1; // Position starts from 1
};

// Method to activate AI bot
consultationSchema.methods.activateAiBot = async function () {
  this.isAiBotAssisted = true;
  this.aiBotActivatedAt = new Date();
  this.status = 'in_progress';
  await this.save();
};

// Method to accept consultation
consultationSchema.methods.acceptByAgronomist = async function (agronomistId) {
  this.agronomistId = agronomistId;
  this.status = 'accepted';
  this.acceptedAt = new Date();
  
  // Calculate wait time
  const waitTime = Math.round((this.acceptedAt - this.createdAt) / 60000); // In minutes
  this.waitTimeMinutes = waitTime;
  
  await this.save();
};

// Method to complete consultation
consultationSchema.methods.complete = async function () {
  this.status = 'completed';
  this.completedAt = new Date();
  await this.save();
};

const Consultation = mongoose.model('Consultation', consultationSchema);

module.exports = Consultation;
