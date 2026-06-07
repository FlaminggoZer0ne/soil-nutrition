const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middleware/authMiddleware');

router.get('/summary', verifyToken, dashboardController.getSummary);
router.get('/tren-ph', verifyToken, dashboardController.getTrenPH);
router.get('/resume', verifyToken, dashboardController.getResume);
router.get('/heatmap', verifyToken, dashboardController.getHeatmap);

module.exports = router;
