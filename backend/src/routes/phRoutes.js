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

// Middleware: block viewer from write operations
function denyViewer(req, res, next) {
  if (req.user && req.user.role === 'viewer') {
    return res.status(403).json({ message: 'Akses ditolak. Role Viewer hanya dapat melihat dan mengekspor data.' });
  }
  next();
}

// Lookup block info (all roles)
router.get('/lookup-block', verifyToken, phController.lookupBlock);

// Export & template (all roles including viewer)
router.get('/export', verifyToken, phController.exportExcel);
router.get('/template', verifyToken, phController.downloadTemplate);

// Import (viewer cannot import)
router.post('/import', verifyToken, denyViewer, upload.single('file'), phController.importExcel);

// Read (all roles)
router.get('/', verifyToken, phController.getAll);
router.get('/:id', verifyToken, phController.getById);

// Write (viewer cannot create/update/delete)
router.post('/', verifyToken, denyViewer, phController.create);
router.put('/:id', verifyToken, denyViewer, phController.update);
router.delete('/:id', verifyToken, denyViewer, phController.remove);

module.exports = router;
