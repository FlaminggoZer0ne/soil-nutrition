const bcrypt = require('bcryptjs');
const { User, ActivityLog } = require('../models');

/**
 * List all users (excluding password hashes)
 */
async function getAll(req, res) {
  try {
    const users = await User.findAll({
      attributes: ['id', 'nama', 'index_pegawai', 'role', 'pg_akses', 'aktif', 'created_at'],
      order: [['created_at', 'DESC']]
    });
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil daftar pengguna.' });
  }
}

/**
 * Create a new user
 */
async function create(req, res) {
  const { nama, index_pegawai, password, role, pg_akses } = req.body;
  const adminUser = req.user;

  if (!nama || !index_pegawai || !password || !role || !pg_akses) {
    return res.status(400).json({ message: 'Semua kolom data wajib diisi.' });
  }

  try {
    const existing = await User.findOne({ where: { index_pegawai } });
    if (existing) {
      return res.status(400).json({ message: 'Nomor indeks pegawai sudah terdaftar.' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      nama,
      index_pegawai,
      password_hash,
      role,
      pg_akses: Array.isArray(pg_akses) ? pg_akses : [pg_akses],
      aktif: true
    });

    // Log action
    await ActivityLog.create({
      user_id: adminUser.id,
      aksi: 'create',
      tabel_target: 'users',
      data_id: user.id,
      detail: { index_pegawai, nama, role, pg_akses }
    });

    return res.status(201).json({
      message: 'Pengguna berhasil dibuat.',
      user: {
        id: user.id,
        nama: user.nama,
        index_pegawai: user.index_pegawai,
        role: user.role,
        pg_akses: user.pg_akses,
        aktif: user.aktif
      }
    });
  } catch (error) {
    console.error('Create User Error:', error);
    return res.status(500).json({ message: 'Gagal membuat pengguna baru.' });
  }
}

/**
 * Update user details
 */
async function update(req, res) {
  const { id } = req.params;
  const { nama, index_pegawai, password, role, pg_akses, aktif } = req.body;
  const adminUser = req.user;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }

    // Do not allow self-disabling or role modification to prevent lockout
    if (user.id === adminUser.id && (aktif === false || role !== 'admin')) {
      return res.status(400).json({ message: 'Anda tidak dapat menonaktifkan atau mengubah role akun Anda sendiri.' });
    }

    const previousData = { ...user.toJSON() };

    const updateFields = {};
    if (nama) updateFields.nama = nama;
    if (index_pegawai) {
      const existing = await User.findOne({ where: { index_pegawai } });
      if (existing && existing.id !== user.id) {
        return res.status(400).json({ message: 'Nomor indeks pegawai sudah digunakan oleh pengguna lain.' });
      }
      updateFields.index_pegawai = index_pegawai;
    }
    if (password) {
      updateFields.password_hash = await bcrypt.hash(password, 12);
    }
    if (role) updateFields.role = role;
    if (pg_akses) updateFields.pg_akses = Array.isArray(pg_akses) ? pg_akses : [pg_akses];
    if (aktif !== undefined) updateFields.aktif = !!aktif;

    await user.update(updateFields);

    // Log update
    await ActivityLog.create({
      user_id: adminUser.id,
      aksi: 'update',
      tabel_target: 'users',
      data_id: user.id,
      detail: {
        sebelum: previousData,
        sesudah: user.toJSON()
      }
    });

    return res.json({
      message: 'Profil pengguna berhasil diperbarui.',
      user: {
        id: user.id,
        nama: user.nama,
        index_pegawai: user.index_pegawai,
        role: user.role,
        pg_akses: user.pg_akses,
        aktif: user.aktif
      }
    });
  } catch (error) {
    console.error('Update User Error:', error);
    return res.status(500).json({ message: 'Gagal memperbarui pengguna.' });
  }
}

/**
 * Toggle user active state
 */
async function toggleStatus(req, res) {
  const { id } = req.params;
  const adminUser = req.user;

  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'Pengguna tidak ditemukan.' });
    }

    if (user.id === adminUser.id) {
      return res.status(400).json({ message: 'Anda tidak bisa mengubah status aktif akun Anda sendiri.' });
    }

    user.aktif = !user.aktif;
    await user.save();

    // Log action
    await ActivityLog.create({
      user_id: adminUser.id,
      aksi: 'update',
      tabel_target: 'users',
      data_id: user.id,
      detail: { note: `Mengubah status aktif user ${user.index_pegawai} menjadi ${user.aktif}` }
    });

    return res.json({ message: `Status pengguna berhasil diubah menjadi ${user.aktif ? 'Aktif' : 'Nonaktif'}.`, user });
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengubah status aktif pengguna.' });
  }
}

module.exports = {
  getAll,
  create,
  update,
  toggleStatus
};
