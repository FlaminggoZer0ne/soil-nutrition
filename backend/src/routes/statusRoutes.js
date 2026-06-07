const express = require('express');
const router = express.Router();
const statusController = require('../controllers/statusController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Get all Location Statuses (all authenticated users can read to populate dropdowns)
router.get('/', verifyToken, statusController.getAll);

// Admin-only Location Status actions
router.post('/', verifyToken, isAdmin, statusController.create);
router.delete('/:id', verifyToken, isAdmin, statusController.remove);

module.exports = router;
