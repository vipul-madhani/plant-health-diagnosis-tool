const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ========================================
// Payment Model (MySQL/Sequelize)
// ========================================
const Payment = sequelize.define(
  'Payment',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    orderId: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      comment: 'Razorpay order ID',
    },
    razorpayPaymentId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Razorpay payment ID after capture',
    },
    type: {
      type: DataTypes.ENUM('detailed_report', 'consultation'),
      allowNull: false,
    },
    analysisId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'analyses',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    consultationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'consultations',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Amount in INR before GST',
    },
    gstAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: '18% GST amount',
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Total amount including GST',
    },
    currency: {
      type: DataTypes.STRING(3),
      defaultValue: 'INR',
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending',
      allowNull: false,
    },
    failureReason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'payments',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['orderId'] },
      { fields: ['status'] },
      { fields: ['type'] },
      { fields: ['userId', 'createdAt'] },
    ],
  }
);

module.exports = Payment;
