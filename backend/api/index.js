// Vercel Serverless entry point
require('dotenv').config();

// Explicitly require pg so Sequelize can find it
// This is needed when Vercel deploys without correct root directory
try {
  require('pg');
} catch(e) {
  console.error('pg not found:', e.message);
}

let app;
try {
  app = require('../src/app');
} catch (err) {
  const express = require('express');
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      error: 'App failed to load',
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined
    });
  });
}

module.exports = app;
