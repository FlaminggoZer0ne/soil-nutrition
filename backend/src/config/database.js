const { Sequelize } = require('sequelize');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required.');
}

// Parse sslmode from URL if present, handle Neon's require sslmode
const dbUrl = process.env.DATABASE_URL;

const sequelize = new Sequelize(dbUrl, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  },
  logging: false,
  pool: {
    max: 2,        // Vercel serverless: keep pool small
    min: 0,
    acquire: 10000,
    idle: 10000
  }
});

module.exports = sequelize;
