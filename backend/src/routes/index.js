const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const phRoutes = require('./phRoutes');
const dashboardRoutes = require('./dashboardRoutes');
const userRoutes = require('./userRoutes');
const logRoutes = require('./logRoutes');
const pgRoutes = require('./pgRoutes');
const blockRoutes = require('./blockRoutes');
const statusRoutes = require('./statusRoutes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/ph', phRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/users', userRoutes);
router.use('/logs', logRoutes);
router.use('/pg', pgRoutes);
router.use('/blocks', blockRoutes);
router.use('/statuses', statusRoutes);

module.exports = router;
