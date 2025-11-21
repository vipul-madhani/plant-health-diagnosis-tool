const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    consultationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Consultation',
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    senderRole: {
      type: String,
      enum: ['farmer', 'agronomist'],
      required: true,
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient message retrieval
messageSchema.index({ consultationId: 1, createdAt: 1 });
messageSchema.index({ consultationId: 1, isRead: 1 });

const Message = mongoose.model('Message', messageSchema);

module.exports = Message;
