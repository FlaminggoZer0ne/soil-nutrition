const { PG, ActivityLog } = require('../models');

/**
 * Get all PGs (accessible to all logged-in users)
 */
async function getAll(req, res) {
  try {
    const pgs = await PG.findAll({ order: [['nama', 'ASC']] });
    return res.json(pgs);
  } catch (error) {
    console.error('Get PGs Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil daftar PG.' });
  }
}

/**
 * Create a new PG (Admin Only)
 */
async function create(req, res) {
  const { nama } = req.body;
  const adminUser = req.user;

  if (!nama) {
    return res.status(400).json({ message: 'Nama PG wajib diisi.' });
  }

  try {
    const pgNama = nama.trim().toUpperCase();
    const existing = await PG.findOne({ where: { nama: pgNama } });
    if (existing) {
      return res.status(400).json({ message: 'Nama PG sudah terdaftar.' });
    }

    const pg = await PG.create({
      nama: pgNama
    });

    await ActivityLog.create({
      user_id: adminUser.id,
      aksi: 'create',
      tabel_target: 'pgs',
      data_id: pg.id,
      detail: { nama: pg.nama }
    });

    return res.status(201).json({
      message: 'PG berhasil dibuat.',
      pg
    });
  } catch (error) {
    console.error('Create PG Error:', error);
    return res.status(500).json({ message: 'Gagal membuat PG baru.' });
  }
}

/**
 * Delete a PG (Admin Only)
 */
async function remove(req, res) {
  const { id } = req.params;
  const adminUser = req.user;

  try {
    const pg = await PG.findByPk(id);
    if (!pg) {
      return res.status(404).json({ message: 'PG tidak ditemukan.' });
    }

    const nama = pg.nama;
    await pg.destroy();

    await ActivityLog.create({
      user_id: adminUser.id,
      aksi: 'delete',
      tabel_target: 'pgs',
      data_id: parseInt(id),
      detail: { nama }
    });

    return res.json({ message: 'PG berhasil dihapus.' });
  } catch (error) {
    console.error('Delete PG Error:', error);
    return res.status(500).json({ message: 'Gagal menghapus PG.' });
  }
}

module.exports = {
  getAll,
  create,
  remove
};
