const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ========================================
// Consultation Model (MySQL/Sequelize)
// ========================================
const Consultation = sequelize.define(
  'Consultation',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    farmerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    agronomistId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'SET NULL',
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
    paymentId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'payments',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: 'Consultation fee in INR',
    },
    status: {
      type: DataTypes.ENUM('pending', 'active', 'completed', 'cancelled'),
      defaultValue: 'pending',
      allowNull: false,
    },
    // Payment tracking
    paymentStatus: {
      type: DataTypes.ENUM('pending', 'collected'),
      defaultValue: 'pending',
      allowNull: false,
      comment: 'Collection status for agronomist payout',
    },
    agronomistEarning: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '70% of amount for agronomist',
    },
    platformCommission: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      comment: '30% of amount for platform',
    },
    collectedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When farmer marked payment as collected',
    },
    // FIFO tracking
    assignedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'When assigned to agronomist',
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Chat tracking
    lastMessageTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    unreadCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    // Additional data
    plantImage: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    diagnosis: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Final consultation summary by agronomist',
    },
  },
  {
    tableName: 'consultations',
    timestamps: true,
    indexes: [
      { fields: ['farmerId'] },
      { fields: ['agronomistId'] },
      { fields: ['status'] },
      { fields: ['paymentStatus'] },
      { fields: ['createdAt'] }, // For FIFO sorting
      { fields: ['status', 'createdAt'] }, // FIFO queue
    ],
  }
);

module.exports = Consultation;
