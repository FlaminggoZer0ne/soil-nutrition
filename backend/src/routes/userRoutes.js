const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');

// All user management routes are protected and restricted to administrators
router.get('/', verifyToken, isAdmin, userController.getAll);
router.post('/', verifyToken, isAdmin, userController.create);
router.put('/:id', verifyToken, isAdmin, userController.update);
router.put('/:id/toggle', verifyToken, isAdmin, userController.toggleStatus);

module.exports = router;
