const { Sequelize } = require('sequelize');

// Use DATABASE_URL for production (Neon PostgreSQL)
// For local development, set DATABASE_URL in backend/.env
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required. Please set it in backend/.env');
}

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production'
      ? { require: true, rejectUnauthorized: false }
      : false
  },
  logging: false
});

module.exports = sequelize;
