const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

// ========================================
// User Model (MySQL/Sequelize)
// ========================================
const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    role: {
      type: DataTypes.ENUM('user', 'agronomist', 'admin'),
      defaultValue: 'user',
      allowNull: false,
    },
    profilePicture: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    // Agronomist-specific fields
    specialization: {
      type: DataTypes.STRING(200),
      allowNull: true,
    },
    experience: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Years of experience',
    },
    certifications: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of certification names',
    },
    region: {
      type: DataTypes.ENUM('North', 'South', 'East', 'West', 'Central', 'Northeast'),
      allowNull: true,
    },
    // Payout tracking
    totalEarned: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      allowNull: false,
    },
    pendingPayout: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      allowNull: false,
    },
    collectedPayout: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0.0,
      allowNull: false,
    },
    // Account status
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    lastLoginAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['region'] },
    ],
  }
);

// ========================================
// Instance Methods
// ========================================

// Hash password before saving
User.beforeCreate(async (user) => {
  if (user.password) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
});

// Compare password method
User.prototype.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Get safe user data (without password)
User.prototype.toSafeObject = function () {
  const { password, ...safeData } = this.toJSON();
  return safeData;
};

module.exports = User;
