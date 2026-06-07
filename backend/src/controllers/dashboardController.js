const { PHData, WeeklyPopulasi, Block } = require('../models');
const { Op } = require('../models');

/**
 * Get Summary Cards statistics
 */
async function getSummary(req, res) {
  const user = req.user;
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  // Determine PG scope based on role
  const pgFilter = {};
  if (user.role !== 'admin') {
    pgFilter.pg = { [Op.in]: user.pg_akses || [] };
  }

  try {
    // Fetch all pH data matching PG filter
    const allPH = await PHData.findAll({ where: pgFilter });

    // 1. Total unique blocks disampling in current year & month
    const uniqueBlocksYear = new Set(
      allPH.filter(p => p.tahun_sampling === currentYear).map(p => `${p.pg}-${p.lokasi}`)
    );
    const totalYearSamples = uniqueBlocksYear.size;

    const uniqueBlocksMonth = new Set(
      allPH.filter(p => p.tahun_sampling === currentYear && p.bulan_sampling === currentMonth).map(p => `${p.pg}-${p.lokasi}`)
    );
    const totalMonthSamples = uniqueBlocksMonth.size;

    // 2. Average pH (average of block averages)
    const blockAverages = {};
    allPH.forEach(p => {
      const key = `${p.pg}-${p.lokasi}`;
      if (!blockAverages[key]) {
        blockAverages[key] = { sum: 0, count: 0 };
      }
      blockAverages[key].sum += parseFloat(p.ph_tanah);
      blockAverages[key].count++;
    });

    const blockAvgValues = Object.values(blockAverages).map(b => b.sum / b.count);
    const avgPH = blockAvgValues.length > 0 
      ? (blockAvgValues.reduce((sum, val) => sum + val, 0) / blockAvgValues.length).toFixed(2)
      : '0.00';

    // 3. Count of sampled blocks (all time)
    const sampledBlocks = [...new Set(allPH.map(p => p.lokasi))];
    const sampledBlocksCount = sampledBlocks.length;

    // 4. Count of blocks NOT yet sampled in the current month
    const allBlocksList = await Block.findAll({ where: pgFilter });
    
    // Unique blocks in Block
    const uniqueWeeklyBlocksMap = {};
    allBlocksList.forEach(b => {
      uniqueWeeklyBlocksMap[`${b.pg}-${b.block_code}`] = true;
    });
    const totalBlocksCount = Object.keys(uniqueWeeklyBlocksMap).length;

    // Sampled blocks this month
    const sampledThisMonthSet = new Set(
      allPH
        .filter(p => p.tahun_sampling === currentYear && p.bulan_sampling === currentMonth)
        .map(p => `${p.pg}-${p.lokasi}`)
    );

    let unsampledCount = 0;
    Object.keys(uniqueWeeklyBlocksMap).forEach(key => {
      if (!sampledThisMonthSet.has(key)) {
        unsampledCount++;
      }
    });

    return res.json({
      totalYearSamples, // unique blocks count for year
      totalMonthSamples, // unique blocks count for month
      averagePH: parseFloat(avgPH) || 0,
      sampledBlocksCount,
      unsampledBlocksCount: unsampledCount,
      totalBlocksCount
    });

  } catch (error) {
    console.error('Get Dashboard Summary Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data ringkasan dashboard.' });
  }
}

/**
 * Get pH average trends for current year (weekly or monthly)
 */
async function getTrenPH(req, res) {
  const { pg, view } = req.query; // view can be 'week' or 'month', default is 'week'
  const user = req.user;
  const currentYear = new Date().getFullYear();

  // PG Scope
  const pgFilter = {};
  if (user.role !== 'admin') {
    pgFilter.pg = { [Op.in]: user.pg_akses || [] };
  } else if (pg) {
    pgFilter.pg = pg;
  }

  try {
    // Fetch all pH data in current year
    const allPH = await PHData.findAll({
      where: {
        ...pgFilter,
        tahun_sampling: currentYear
      }
    });

    if (view === 'month') {
      const monthNames = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
      const monthMap = {};
      allPH.forEach(p => {
        const mon = p.bulan_sampling;
        if (!mon || mon < 1 || mon > 12) return;
        const pgName = p.pg;
        const ph = parseFloat(p.ph_tanah);
        
        if (!monthMap[mon]) {
          monthMap[mon] = { 
            month: monthNames[mon], 
            _sums: {}, 
            _counts: {} 
          };
        }

        if (!monthMap[mon]._sums[pgName]) {
          monthMap[mon]._sums[pgName] = 0;
          monthMap[mon]._counts[pgName] = 0;
        }

        monthMap[mon]._sums[pgName] += ph;
        monthMap[mon]._counts[pgName]++;
      });

      const sortedTrends = Object.keys(monthMap).map(mon => {
        const mIdx = parseInt(mon, 10);
        const entry = { month: monthNames[mIdx] };
        const mData = monthMap[mon];
        
        ['PG1', 'PG2', 'PG3', 'PG4'].forEach(pgName => {
          if (mData._counts[pgName] > 0) {
            entry[pgName] = parseFloat((mData._sums[pgName] / mData._counts[pgName]).toFixed(2));
          }
        });
        
        return entry;
      }).sort((a, b) => {
        return monthNames.indexOf(a.month) - monthNames.indexOf(b.month);
      });

      return res.json(sortedTrends);

    } else {
      // Default: Group by week
      const weekMap = {};
      allPH.forEach(p => {
        const wk = p.week_sampling;
        const pgName = p.pg;
        const ph = parseFloat(p.ph_tanah);
        
        if (!weekMap[wk]) {
          weekMap[wk] = { 
            week: `Wk ${wk}`, 
            _sums: {}, 
            _counts: {} 
          };
        }

        if (!weekMap[wk]._sums[pgName]) {
          weekMap[wk]._sums[pgName] = 0;
          weekMap[wk]._counts[pgName] = 0;
        }

        weekMap[wk]._sums[pgName] += ph;
        weekMap[wk]._counts[pgName]++;
      });

      // Compute averages
      const sortedTrends = Object.keys(weekMap).map(wk => {
        const entry = { week: `Wk ${wk}` };
        const wData = weekMap[wk];
        
        ['PG1', 'PG2', 'PG3', 'PG4'].forEach(pgName => {
          if (wData._counts[pgName] > 0) {
            entry[pgName] = parseFloat((wData._sums[pgName] / wData._counts[pgName]).toFixed(2));
          }
        });
        
        return entry;
      }).sort((a, b) => {
        const wA = parseInt(a.week.replace('Wk ', ''));
        const wB = parseInt(b.week.replace('Wk ', ''));
        return wA - wB;
      });

      return res.json(sortedTrends);
    }

  } catch (error) {
    console.error('Get Trends Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data tren pH.' });
  }
}

/**
 * Get Resume Table Matrix (Average pH per block per crop age month)
 * Ages: Month -3 to Month +20
 */
async function getResume(req, res) {
  const user = req.user;
  const { pg } = req.query;

  const pgFilter = {};
  if (user.role !== 'admin') {
    pgFilter.pg = { [Op.in]: user.pg_akses || [] };
  } else if (pg) {
    pgFilter.pg = pg;
  }

  try {
    // Fetch all pH data
    const allPH = await PHData.findAll({ where: pgFilter });

    // Filter by crop age range
    const filtered = allPH.filter(p => 
      p.umur_saat_sampling !== null && 
      p.umur_saat_sampling >= -3 && 
      p.umur_saat_sampling <= 20
    );

    // Group and average in JS
    const resumeMap = {};
    filtered.forEach(p => {
      const pgName = p.pg;
      const block = p.lokasi;
      const status = p.status_lokasi;
      const yearTanam = p.tahun_tanam || '-';
      const age = p.umur_saat_sampling;
      const ph = parseFloat(p.ph_tanah);

      const key = `${pgName}_${block}_${status}_${yearTanam}`;

      if (!resumeMap[key]) {
        resumeMap[key] = {
          pg: pgName,
          block,
          status,
          tahun_tanam: yearTanam,
          _sums: {},
          _counts: {},
          ages: {}
        };
      }

      if (!resumeMap[key]._sums[age]) {
        resumeMap[key]._sums[age] = 0;
        resumeMap[key]._counts[age] = 0;
      }

      resumeMap[key]._sums[age] += ph;
      resumeMap[key]._counts[age]++;
    });

    // Compute averages
    const result = Object.values(resumeMap).map(row => {
      for (let m = -3; m <= 20; m++) {
        if (row._counts[m] > 0) {
          row.ages[m] = parseFloat((row._sums[m] / row._counts[m]).toFixed(1));
        }
      }
      delete row._sums;
      delete row._counts;
      return row;
    });

    return res.json(result);

  } catch (error) {
    console.error('Get Resume Matrix Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data resume pH tanah.' });
  }
}

/**
 * Get Heatmap pH classification per Block
 */
async function getHeatmap(req, res) {
  const user = req.user;
  const { pg } = req.query;

  const pgFilter = {};
  if (user.role !== 'admin') {
    pgFilter.pg = { [Op.in]: user.pg_akses || [] };
  } else if (pg) {
    pgFilter.pg = pg;
  }

  try {
    // Fetch all pH data
    const allPH = await PHData.findAll({ where: pgFilter });

    // Group by block to average pH
    const blockMap = {};
    allPH.forEach(p => {
      const key = `${p.pg}_${p.lokasi}_${p.status_lokasi}`;
      if (!blockMap[key]) {
        blockMap[key] = {
          pg: p.pg,
          block: p.lokasi,
          status_lokasi: p.status_lokasi,
          _sum: 0,
          _count: 0
        };
      }
      blockMap[key]._sum += parseFloat(p.ph_tanah);
      blockMap[key]._count++;
    });

    const data = Object.values(blockMap).map(b => {
      const avg = b._sum / b._count;
      let status = 'Hijau Gelap';
      let colorClass = 'darkgreen';
      
      if (avg < 5.0) {
        status = 'Merah';
        colorClass = 'red';
      } else if (avg <= 5.5) {
        status = 'Kuning';
        colorClass = 'yellow';
      } else if (avg <= 6.0) {
        status = 'Hijau Muda';
        colorClass = 'lightgreen';
      }

      return {
        pg: b.pg,
        block: b.block,
        status_lokasi: b.status_lokasi,
        ph: parseFloat(avg.toFixed(2)),
        status,
        colorClass
      };
    });

    return res.json(data);
  } catch (error) {
    console.error('Get Heatmap Data Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data heatmap pH.' });
  }
}

module.exports = {
  getSummary,
  getTrenPH,
  getResume,
  getHeatmap
};
