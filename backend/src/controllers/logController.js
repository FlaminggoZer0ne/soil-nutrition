const { ActivityLog, User, Op } = require('../models');

/**
 * Fetch all activity logs (Admin Only)
 */
async function getAll(req, res) {
  const { user_id, date_start, date_end } = req.query;

  const whereClause = {};

  if (user_id) {
    whereClause.user_id = parseInt(user_id);
  }

  if (date_start && date_end) {
    // End date should cover the whole day
    const start = new Date(date_start);
    const end = new Date(date_end);
    end.setHours(23, 59, 59, 999);
    
    whereClause.created_at = {
      [Op.between]: [start, end]
    };
  } else if (date_start) {
    whereClause.created_at = {
      [Op.gte]: new Date(date_start)
    };
  } else if (date_end) {
    const end = new Date(date_end);
    end.setHours(23, 59, 59, 999);
    whereClause.created_at = {
      [Op.lte]: end
    };
  }

  try {
    const logs = await ActivityLog.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['nama', 'index_pegawai']
        }
      ],
      order: [['created_at', 'DESC']],
      limit: 200 // Limit to avoid massive queries
    });
    return res.json(logs);
  } catch (error) {
    console.error('Fetch Logs Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil riwayat aktivitas.' });
  }
}

module.exports = {
  getAll
};
