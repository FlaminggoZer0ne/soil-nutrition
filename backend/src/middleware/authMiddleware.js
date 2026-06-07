const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Load environment variables (fallback if not in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_soil_nutrition_2026';

/**
 * Middleware to verify JWT token.
 */
async function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ message: 'Akses ditolak. Token tidak disediakan.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak. Format token tidak valid.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }
    
    if (!user.aktif) {
      return res.status(403).json({ message: 'Akun dinonaktifkan.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Token tidak valid atau telah kedaluwarsa.' });
  }
}

/**
 * Middleware to restrict access to admin users only.
 */
function isAdmin(req, res, next) {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({ message: 'Akses ditolak. Hanya untuk Administrator.' });
  }
}

/**
 * Middleware to restrict access to admin or viewer only.
 */
function isAdminOrViewer(req, res, next) {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'viewer')) {
    next();
  } else {
    return res.status(403).json({ message: 'Akses ditolak.' });
  }
}

module.exports = {
  verifyToken,
  isAdmin,
  isAdminOrViewer,
  JWT_SECRET
};
