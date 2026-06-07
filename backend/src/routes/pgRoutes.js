const express = require('express');
const router = express.Router();
const pgController = require('../controllers/pgController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Get all PGs (all authenticated users can read to populate dropdowns)
router.get('/', verifyToken, pgController.getAll);

// Admin-only PG actions
router.post('/', verifyToken, isAdmin, pgController.create);
router.delete('/:id', verifyToken, isAdmin, pgController.remove);

module.exports = router;
