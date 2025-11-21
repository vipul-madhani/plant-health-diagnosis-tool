const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ========================================
// Analysis Model (MySQL/Sequelize)
// ========================================
const Analysis = sequelize.define(
  'Analysis',
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
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('basic', 'detailed'),
      defaultValue: 'basic',
      allowNull: false,
    },
    // Basic Analysis Fields
    diagnosis: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    confidence: {
      type: DataTypes.DECIMAL(5, 4),
      defaultValue: 0.0,
      allowNull: false,
      validate: {
        min: 0,
        max: 1,
      },
    },
    plantSpecies: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    quickTips: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    mlModelVersion: {
      type: DataTypes.STRING(50),
      defaultValue: '1.0',
    },
    // Detailed Analysis Fields
    symptoms: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of symptom strings',
    },
    severity: {
      type: DataTypes.ENUM('Low', 'Medium', 'High', 'Critical'),
      allowNull: true,
    },
    scientificName: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    family: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    treatmentPlan: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Object with immediate, shortTerm, longTerm arrays',
    },
    organicRemedies: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of remedy objects',
    },
    preventionTips: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Array of prevention tip strings',
    },
    // Payment & PDF
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      allowNull: false,
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
    pdfPath: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    // Soft delete
    isDeleted: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'analyses',
    timestamps: true,
    indexes: [
      { fields: ['userId'] },
      { fields: ['type'] },
      { fields: ['isPaid'] },
      { fields: ['isDeleted'] },
      { fields: ['userId', 'createdAt'] },
    ],
  }
);

module.exports = Analysis;
