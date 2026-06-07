const { Block, ActivityLog } = require('../models');

/**
 * Get all Blocks (accessible to all logged-in users, optional filtering by PG)
 */
async function getAll(req, res) {
  const { pg } = req.query;
  const whereClause = {};
  if (pg) {
    whereClause.pg = pg;
  }

  try {
    const blocks = await Block.findAll({
      where: whereClause,
      order: [['block_code', 'ASC']]
    });
    return res.json(blocks);
  } catch (error) {
    console.error('Get Blocks Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil daftar blok.' });
  }
}

/**
 * Create a new Block (Admin Only)
 */
async function create(req, res) {
  const { pg, block_code, status, luas, populasi, clone, wk_tanam, tahun_tanam, tanggal_tanam } = req.body;
  const adminUser = req.user;

  if (!pg || !block_code || !status || !luas || !populasi || !clone || !wk_tanam || !tahun_tanam || !tanggal_tanam) {
    return res.status(400).json({ message: 'Semua field blok tanam wajib diisi.' });
  }

  try {
    const blockCodeFormatted = block_code.trim().toUpperCase();
    const existing = await Block.findOne({ 
      where: { 
        pg: pg.toUpperCase(), 
        block_code: blockCodeFormatted 
      } 
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Kode blok ini sudah terdaftar untuk PG yang dipilih.' });
    }

    const block = await Block.create({
      pg: pg.toUpperCase(),
      block_code: blockCodeFormatted,
      status,
      luas: parseFloat(luas),
      populasi: parseInt(populasi),
      clone,
      wk_tanam: parseInt(wk_tanam),
      tahun_tanam: parseInt(tahun_tanam),
      tanggal_tanam
    });

    await ActivityLog.create({
      user_id: adminUser.id,
      aksi: 'create',
      tabel_target: 'blocks',
      data_id: block.id,
      detail: block.toJSON()
    });

    return res.status(201).json({
      message: 'Blok tanam berhasil dibuat.',
      block
    });
  } catch (error) {
    console.error('Create Block Error:', error);
    return res.status(500).json({ message: 'Gagal membuat blok tanam baru.' });
  }
}

/**
 * Delete a Block (Admin Only)
 */
async function remove(req, res) {
  const { id } = req.params;
  const adminUser = req.user;

  try {
    const block = await Block.findByPk(id);
    if (!block) {
      return res.status(404).json({ message: 'Blok tanam tidak ditemukan.' });
    }

    const blockData = block.toJSON();
    await block.destroy();

    await ActivityLog.create({
      user_id: adminUser.id,
      aksi: 'delete',
      tabel_target: 'blocks',
      data_id: parseInt(id),
      detail: blockData
    });

    return res.json({ message: 'Blok tanam berhasil dihapus.' });
  } catch (error) {
    console.error('Delete Block Error:', error);
    return res.status(500).json({ message: 'Gagal menghapus blok tanam.' });
  }
}

module.exports = {
  getAll,
  create,
  remove
};
