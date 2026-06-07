const express = require('express');
const router = express.Router();
const blockController = require('../controllers/blockController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// Get all blocks (all authenticated users can read to select blocks)
router.get('/', verifyToken, blockController.getAll);

// Admin-only block actions
router.post('/', verifyToken, isAdmin, blockController.create);
router.delete('/:id', verifyToken, isAdmin, blockController.remove);

module.exports = router;
