const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, ActivityLog } = require('../models');
const { JWT_SECRET } = require('../middleware/authMiddleware');

/**
 * User Login
 */
async function login(req, res) {
  const { index_pegawai, password } = req.body;

  if (!index_pegawai || !password) {
    return res.status(400).json({ message: 'Nomor indeks pegawai dan password wajib diisi.' });
  }

  try {
    const user = await User.findOne({ where: { index_pegawai } });
    if (!user) {
      return res.status(401).json({ message: 'Nomor indeks pegawai atau password salah.' });
    }

    if (!user.aktif) {
      return res.status(403).json({ message: 'Akun Anda dinonaktifkan. Silakan hubungi admin.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: 'Nomor indeks pegawai atau password salah.' });
    }

    // Sign Token
    const token = jwt.sign(
      { id: user.id, role: user.role, index_pegawai: user.index_pegawai },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Record Log
    await ActivityLog.create({
      user_id: user.id,
      aksi: 'login',
      tabel_target: 'users',
      data_id: user.id,
      detail: { index_pegawai: user.index_pegawai, ip: req.ip }
    });

    return res.json({
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        nama: user.nama,
        index_pegawai: user.index_pegawai,
        role: user.role,
        pg_akses: user.pg_akses
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan sistem saat login.' });
  }
}

/**
 * Get current profile details
 */
async function getProfile(req, res) {
  try {
    const user = req.user;
    return res.json({
      id: user.id,
      nama: user.nama,
      index_pegawai: user.index_pegawai,
      role: user.role,
      pg_akses: user.pg_akses
    });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil data profil.' });
  }
}

/**
 * Simulated Forgot Password
 */
async function forgotPassword(req, res) {
  const { index_pegawai } = req.body;
  if (!index_pegawai) {
    return res.status(400).json({ message: 'Nomor indeks pegawai wajib diisi.' });
  }

  try {
    const user = await User.findOne({ where: { index_pegawai } });
    if (!user) {
      return res.json({ message: 'Jika nomor indeks terdaftar, permintaan reset akan diproses oleh admin.' });
    }

    // Create a mock reset log
    await ActivityLog.create({
      user_id: user.id,
      aksi: 'reset_password_request',
      tabel_target: 'users',
      data_id: user.id,
      detail: { note: `Mengajukan reset password untuk NIP: ${index_pegawai}` }
    });

    return res.json({
      message: 'Permintaan reset kata sandi telah dikirim ke Administrator. Silakan hubungi admin Anda.'
    });
  } catch (error) {
    console.error('Forgot Password Error:', error);
    return res.status(500).json({ message: 'Terjadi kesalahan sistem saat meminta reset password.' });
  }
}

module.exports = {
  login,
  getProfile,
  forgotPassword
};
