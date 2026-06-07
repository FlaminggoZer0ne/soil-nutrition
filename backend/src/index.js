require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const { sequelize } = require('./models');
const seedDatabase = require('./utils/seeder');
const apiRouter = require('./routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(morgan('dev'));

// Serve API Routes
app.use('/api', apiRouter);

// Fallback error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({ message: 'Terjadi kesalahan internal pada server.' });
});

// Database Sync and Server Initialization
async function startServer() {
  try {
    await sequelize.sync({ alter: true });
    console.log('📚 Database synced successfully.');

    // Seed initial data if empty
    await seedDatabase();

    // Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server running in port ${PORT}`);
      console.log(`📡 API endpoints ready at http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
