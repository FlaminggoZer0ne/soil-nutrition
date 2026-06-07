const { LocationStatus, ActivityLog } = require('../models');

/**
 * Get all Location Statuses (accessible to all logged-in users)
 */
async function getAll(req, res) {
  try {
    const statuses = await LocationStatus.findAll({ order: [['nama', 'ASC']] });
    return res.json(statuses);
  } catch (error) {
    console.error('Get Location Statuses Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil daftar status lokasi.' });
  }
}

/**
 * Create a new Location Status (Admin Only)
 */
async function create(req, res) {
  const { nama } = req.body;
  const adminUser = req.user;

  if (!nama) {
    return res.status(400).json({ message: 'Nama status lokasi wajib diisi.' });
  }

  try {
    const statusNama = nama.trim().toUpperCase();
    const existing = await LocationStatus.findOne({ where: { nama: statusNama } });
    if (existing) {
      return res.status(400).json({ message: 'Nama status lokasi sudah terdaftar.' });
    }

    const status = await LocationStatus.create({
      nama: statusNama
    });

    await ActivityLog.create({
      user_id: adminUser.id,
      aksi: 'create',
      tabel_target: 'location_statuses',
      data_id: status.id,
      detail: { nama: status.nama }
    });

    return res.status(201).json({
      message: 'Status lokasi berhasil dibuat.',
      status
    });
  } catch (error) {
    console.error('Create Location Status Error:', error);
    return res.status(500).json({ message: 'Gagal membuat status lokasi baru.' });
  }
}

/**
 * Delete a Location Status (Admin Only)
 */
async function remove(req, res) {
  const { id } = req.params;
  const adminUser = req.user;

  try {
    const status = await LocationStatus.findByPk(id);
    if (!status) {
      return res.status(404).json({ message: 'Status lokasi tidak ditemukan.' });
    }

    const nama = status.nama;
    await status.destroy();

    await ActivityLog.create({
      user_id: adminUser.id,
      aksi: 'delete',
      tabel_target: 'location_statuses',
      data_id: parseInt(id),
      detail: { nama }
    });

    return res.json({ message: 'Status lokasi berhasil dihapus.' });
  } catch (error) {
    console.error('Delete Location Status Error:', error);
    return res.status(500).json({ message: 'Gagal menghapus status lokasi.' });
  }
}

module.exports = {
  getAll,
  create,
  remove
};
