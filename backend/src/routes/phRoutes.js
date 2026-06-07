const express = require('express');
const router = express.Router();
const phController = require('../controllers/phController');
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const multer = require('multer');

// Configure multer to store files in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// Lookup blocks info
router.get('/lookup-block', verifyToken, phController.lookupBlock);

// Export & Import
router.get('/export', verifyToken, phController.exportExcel);
router.get('/template', verifyToken, phController.downloadTemplate);
router.post('/import', verifyToken, upload.single('file'), phController.importExcel);

// CRUD
router.get('/', verifyToken, phController.getAll);
router.get('/:id', verifyToken, phController.getById);
router.post('/', verifyToken, phController.create);
router.put('/:id', verifyToken, phController.update);
router.delete('/:id', verifyToken, phController.remove); // Delete: admin anytime, user within 24h

module.exports = router;
