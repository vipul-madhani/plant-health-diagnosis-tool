const { sequelize } = require('../config/database');

// Import all models
const User = require('./User');
const Analysis = require('./Analysis');
const Payment = require('./Payment');
const Consultation = require('./Consultation');
const Message = require('./Message');

// ========================================
// Define Associations/Relationships
// ========================================

// User has many Analyses
User.hasMany(Analysis, {
  foreignKey: 'userId',
  as: 'analyses',
});
Analysis.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User has many Payments
User.hasMany(Payment, {
  foreignKey: 'userId',
  as: 'payments',
});
Payment.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User (Farmer) has many Consultations
User.hasMany(Consultation, {
  foreignKey: 'farmerId',
  as: 'farmerConsultations',
});
Consultation.belongsTo(User, {
  foreignKey: 'farmerId',
  as: 'farmer',
});

// User (Agronomist) has many Consultations
User.hasMany(Consultation, {
  foreignKey: 'agronomistId',
  as: 'agronomistConsultations',
});
Consultation.belongsTo(User, {
  foreignKey: 'agronomistId',
  as: 'agronomist',
});

// Analysis belongs to Payment
Analysis.belongsTo(Payment, {
  foreignKey: 'paymentId',
  as: 'payment',
});
Payment.hasOne(Analysis, {
  foreignKey: 'paymentId',
  as: 'analysis',
});

// Consultation belongs to Analysis
Consultation.belongsTo(Analysis, {
  foreignKey: 'analysisId',
  as: 'analysis',
});
Analysis.hasMany(Consultation, {
  foreignKey: 'analysisId',
  as: 'consultations',
});

// Consultation belongs to Payment
Consultation.belongsTo(Payment, {
  foreignKey: 'paymentId',
  as: 'payment',
});
Payment.hasOne(Consultation, {
  foreignKey: 'paymentId',
  as: 'consultation',
});

// Consultation has many Messages
Consultation.hasMany(Message, {
  foreignKey: 'consultationId',
  as: 'messages',
});
Message.belongsTo(Consultation, {
  foreignKey: 'consultationId',
  as: 'consultation',
});

// User has many Messages (as sender)
User.hasMany(Message, {
  foreignKey: 'senderId',
  as: 'sentMessages',
});
Message.belongsTo(User, {
  foreignKey: 'senderId',
  as: 'sender',
});

// ========================================
// Export all models
// ========================================
module.exports = {
  sequelize,
  User,
  Analysis,
  Payment,
  Consultation,
  Message,
};
