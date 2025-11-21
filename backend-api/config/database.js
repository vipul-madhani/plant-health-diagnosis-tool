const { Sequelize } = require('sequelize');
require('dotenv').config();

// ========================================
// MySQL Database Configuration
// ========================================
const sequelize = new Sequelize(
  process.env.DB_NAME || 'plant_health_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
    timezone: '+05:30', // IST timezone
  }
);

// ========================================
// Test Database Connection
// ========================================
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL database connection established successfully.');
  } catch (error) {
    console.error('❌ Unable to connect to MySQL database:', error);
    process.exit(1);
  }
}

// ========================================
// Sync Database Models
// ========================================
async function syncDatabase(options = {}) {
  try {
    await sequelize.sync(options);
    console.log('✅ Database models synchronized successfully.');
  } catch (error) {
    console.error('❌ Error synchronizing database:', error);
    throw error;
  }
}

module.exports = {
  sequelize,
  testConnection,
  syncDatabase,
};
