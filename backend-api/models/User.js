const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ['farmer', 'agronomist', 'admin'],
      default: 'farmer',
      index: true,
    },
    phone: {
      type: String,
      default: null,
    },
    region: {
      type: String,
      enum: ['North', 'South', 'East', 'West', 'Central', 'Northeast'],
      default: 'Central',
    },

    // Lifetime Usage Tracking (3 free analyses TOTAL - no daily reset)
    freeAnalysisCount: {
      type: Number,
      default: 0,
      max: 3,
    },
    freeAnalysisLimit: {
      type: Number,
      default: 3,
    },
    hasReachedFreeLimit: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Agronomist-specific fields
    isOnline: {
      type: Boolean,
      default: false,
      index: true,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
    specialization: {
      type: [String],
      default: [],
    },
    yearsOfExperience: {
      type: Number,
      default: 0,
    },
    certifications: {
      type: [String],
      default: [],
    },
    totalConsultations: {
      type: Number,
      default: 0,
    },
    effectivenessRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    totalEarnings: {
      type: Number,
      default: 0,
    },
    pendingEarnings: {
      type: Number,
      default: 0,
    },
    collectedEarnings: {
      type: Number,
      default: 0,
    },

    // Notification tokens
    fcmToken: {
      type: String,
      default: null,
    },
    deviceTokens: {
      type: [String],
      default: [],
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isOnline: 1 });
userSchema.index({ lastActiveAt: -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user can do free analysis (3 lifetime total)
userSchema.methods.canDoFreeAnalysis = function () {
  if (this.freeAnalysisCount >= this.freeAnalysisLimit) {
    return { 
      allowed: false, 
      remaining: 0,
      message: 'You have used all 3 free analyses. Please purchase a detailed report or consultation to continue.'
    };
  }

  return { 
    allowed: true, 
    remaining: this.freeAnalysisLimit - this.freeAnalysisCount,
    message: `${this.freeAnalysisLimit - this.freeAnalysisCount} free analyses remaining`
  };
};

// Method to increment analysis count (no reset - lifetime limit)
userSchema.methods.incrementAnalysisCount = async function () {
  this.freeAnalysisCount += 1;
  
  if (this.freeAnalysisCount >= this.freeAnalysisLimit) {
    this.hasReachedFreeLimit = true;
  }
  
  await this.save();
};

// Method to update online status
userSchema.methods.updateOnlineStatus = async function (isOnline) {
  this.isOnline = isOnline;
  this.lastActiveAt = new Date();
  await this.save();
};

// Static method to get online agronomists count
userSchema.statics.getOnlineAgronomistsCount = async function () {
  // Consider agronomist online if active in last 5 minutes
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  const count = await this.countDocuments({
    role: 'agronomist',
    isActive: true,
    $or: [
      { isOnline: true },
      { lastActiveAt: { $gte: fiveMinutesAgo } }
    ]
  });

  return count;
};

// Static method to get available agronomists
userSchema.statics.getAvailableAgronomists = async function () {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  
  return await this.find({
    role: 'agronomist',
    isActive: true,
    $or: [
      { isOnline: true },
      { lastActiveAt: { $gte: fiveMinutesAgo } }
    ]
  }).select('name email region specialization totalConsultations effectivenessRating lastActiveAt');
};

const User = mongoose.model('User', userSchema);

module.exports = User;
