// Vercel Serverless entry point
require('dotenv').config();

let app;
try {
  app = require('../src/app');
} catch (err) {
  // If app fails to load, return the error so we can diagnose
  const express = require('express');
  app = express();
  app.use((req, res) => {
    res.status(500).json({
      error: 'App failed to load',
      message: err.message,
      stack: err.stack
    });
  });
}

module.exports = app;
