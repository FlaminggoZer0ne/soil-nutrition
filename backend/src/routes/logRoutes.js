const express = require('express');
const router = express.Router();
const logController = require('../controllers/logController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Log auditing route is admin only
router.get('/', verifyToken, isAdmin, logController.getAll);

module.exports = router;
