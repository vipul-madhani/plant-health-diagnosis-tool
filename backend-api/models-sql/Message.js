const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

// ========================================
// Message Model (MySQL/Sequelize)
// ========================================
const Message = sequelize.define(
  'Message',
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    consultationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'consultations',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    senderRole: {
      type: DataTypes.ENUM('user', 'agronomist'),
      allowNull: false,
    },
    text: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [1, 2000],
      },
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: 'messages',
    timestamps: true,
    indexes: [
      { fields: ['consultationId'] },
      { fields: ['senderId'] },
      { fields: ['consultationId', 'createdAt'] },
      { fields: ['consultationId', 'isRead'] },
    ],
  }
);

module.exports = Message;
