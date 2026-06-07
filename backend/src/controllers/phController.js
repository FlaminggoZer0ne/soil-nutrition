const { PHData, WeeklyPopulasi, Block, ActivityLog, User, Op } = require('../models');
const { getWeekNumber, getMonthFromDate, getYearFromDate, getAgeInMonths } = require('../utils/calculator');
const ExcelJS = require('exceljs');
const XLSX = require('xlsx');

/**
 * Get all pH data with filters & role restriction
 */
async function getAll(req, res) {
  const { pg, tahun, minggu, lokasi, status_lokasi, pengirim } = req.query;
  const user = req.user;

  // Query conditions
  const whereClause = {};

  // Role Restriction: user can only see their allowed PGs
  if (user.role !== 'admin') {
    const allowedPGs = user.pg_akses || [];
    if (pg && allowedPGs.includes(pg)) {
      whereClause.pg = pg;
    } else {
      whereClause.pg = { [Op.in]: allowedPGs };
    }
  } else if (pg) {
    whereClause.pg = pg;
  }

  // Filters
  if (tahun) whereClause.tahun_sampling = parseInt(tahun);
  if (minggu) whereClause.week_sampling = parseInt(minggu);
  if (lokasi) whereClause.lokasi = { [Op.like]: `%${lokasi}%` };
  if (status_lokasi) whereClause.status_lokasi = status_lokasi;
  if (pengirim) whereClause.pengirim_sampel = { [Op.like]: `%${pengirim}%` };

  try {
    const data = await PHData.findAll({
      where: whereClause,
      order: [['created_at', 'DESC']]
    });
    return res.json(data);
  } catch (error) {
    console.error('Get pH Data Error:', error);
    return res.status(500).json({ message: 'Gagal mengambil data pH tanah.' });
  }
}

/**
 * Get single pH record
 */
async function getById(req, res) {
  const { id } = req.params;
  const user = req.user;

  try {
    const record = await PHData.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: 'Data tidak ditemukan.' });
    }

    // Check authorization for non-admin
    if (user.role !== 'admin' && !user.pg_akses.includes(record.pg)) {
      return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki akses untuk PG ini.' });
    }

    return res.json(record);
  } catch (error) {
    return res.status(500).json({ message: 'Gagal mengambil data pH.' });
  }
}

/**
 * Lookup Block Info (for auto-filling form)
 */
async function lookupBlock(req, res) {
  const { block, pg } = req.query;

  if (!block || !pg) {
    return res.status(400).json({ message: 'Parameter block dan pg wajib diberikan.' });
  }

  try {
    const populasi = await Block.findOne({
      where: {
        block_code: block.trim().toUpperCase(),
        pg: pg.trim().toUpperCase()
      }
    });

    if (!populasi) {
      return res.status(404).json({ message: 'Blok tidak ditemukan di database data blok.' });
    }

    return res.json(populasi);
  } catch (error) {
    console.error('Lookup block error:', error);
    return res.status(500).json({ message: 'Gagal mencari detail data blok.' });
  }
}

/**
 * Create pH Data
 */
async function create(req, res) {
  const {
    kode_percobaan,
    pg,
    tanggal_kirim,
    tanggal_selesai,
    tanggal_sampling,
    tanggal_tanam_manual,
    lokasi,
    status_lokasi,
    no_plot,
    samples // Array of pH numbers, e.g., [5.5, 5.8, 6.2]
  } = req.body;

  const user = req.user;

  // Validation
  if (!pg || !tanggal_kirim || !tanggal_selesai || !tanggal_sampling || !lokasi || !status_lokasi || no_plot === undefined || !Array.isArray(samples) || samples.length === 0) {
    return res.status(400).json({ message: 'Semua kolom wajib diisi, termasuk minimal satu nilai pH sampel.' });
  }

  const plotNum = parseInt(no_plot);
  if (isNaN(plotNum) || plotNum <= 0) {
    return res.status(400).json({ message: 'Nomor plot harus berupa angka positif.' });
  }

  // Validate all samples
  for (let i = 0; i < samples.length; i++) {
    const ph = parseFloat(samples[i]);
    if (isNaN(ph) || ph < 0 || ph > 14) {
      return res.status(400).json({ message: `Nilai pH sampel ke-${i + 1} harus berada di antara 0 dan 14.` });
    }
  }

  if (new Date(tanggal_selesai) < new Date(tanggal_kirim)) {
    return res.status(400).json({ message: 'Tanggal selesai analisa tidak boleh sebelum tanggal kirim.' });
  }

  // Auth check
  if (user.role !== 'admin' && !user.pg_akses.includes(pg)) {
    return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki akses input ke PG ini.' });
  }

  try {
    // 1. Calculate values
    const week_sampling = getWeekNumber(tanggal_sampling);
    const bulan_sampling = getMonthFromDate(tanggal_sampling);
    const tahun_sampling = getYearFromDate(tanggal_sampling);
    const block_weekly = `${lokasi.trim()} - ${status_lokasi.trim()}`;

    // 2. Lookup block population info from Block table
    const lookup = await Block.findOne({
      where: { block_code: lokasi.trim().toUpperCase(), pg: pg.trim().toUpperCase() }
    });

    let wk_tanam = null;
    let tahun_tanam = null;
    let tanggal_tanam = tanggal_tanam_manual || null;
    let umur_saat_sampling = null;

    if (lookup) {
      wk_tanam = lookup.wk_tanam;
      tahun_tanam = lookup.tahun_tanam;
      if (!tanggal_tanam) {
        tanggal_tanam = lookup.tanggal_tanam;
      }
    }

    if (tanggal_tanam) {
      umur_saat_sampling = getAgeInMonths(tanggal_sampling, tanggal_tanam);
    }

    // 3. Create records for each sample
    const createdRecords = [];
    for (let i = 0; i < samples.length; i++) {
      const ph = parseFloat(samples[i]);
      const record = await PHData.create({
        user_id: user.id,
        kode_percobaan: kode_percobaan || '-',
        pengirim_sampel: user.nama,
        pg,
        tanggal_kirim,
        tanggal_selesai,
        tanggal_sampling,
        week_sampling,
        bulan_sampling,
        tahun_sampling,
        lokasi: lokasi.trim().toUpperCase(),
        status_lokasi: status_lokasi.trim(),
        block_weekly,
        wk_tanam,
        tahun_tanam,
        tanggal_tanam,
        umur_saat_sampling,
        no_plot: plotNum,
        no_sample: i + 1,
        ph_tanah: ph
      });
      createdRecords.push(record);
    }

    // 4. Log Action
    const avgPH = samples.reduce((acc, curr) => acc + parseFloat(curr), 0) / samples.length;
    await ActivityLog.create({
      user_id: user.id,
      aksi: 'create',
      tabel_target: 'ph_data',
      data_id: createdRecords[0].id,
      detail: { block_weekly, no_plot: plotNum, samples_count: samples.length, avg_ph: avgPH.toFixed(2) }
    });

    return res.status(201).json({ message: 'Data pH berhasil ditambahkan.', data: createdRecords });
  } catch (error) {
    console.error('Create PH Data Error:', error);
    return res.status(500).json({ message: 'Gagal menyimpan data pH tanah.' });
  }
}

/**
 * Update pH Data
 */
async function update(req, res) {
  const { id } = req.params;
  const {
    kode_percobaan,
    pg,
    tanggal_kirim,
    tanggal_selesai,
    tanggal_sampling,
    tanggal_tanam_manual,
    lokasi,
    status_lokasi,
    no_plot,
    no_sample,
    ph_tanah
  } = req.body;

  const user = req.user;

  try {
    const record = await PHData.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: 'Data tidak ditemukan.' });
    }

    // Role check & Edit Limit (24 hours for normal users)
    if (user.role !== 'admin') {
      if (!user.pg_akses.includes(record.pg) || (pg && !user.pg_akses.includes(pg))) {
        return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki akses untuk PG ini.' });
      }

      // 24 hour validation
      const now = new Date();
      const createdAt = new Date(record.created_at);
      const hoursDiff = Math.abs(now - createdAt) / 36e5; // diff in hours
      if (hoursDiff > 24) {
        return res.status(403).json({ message: 'Akses ditolak. Data hanya bisa diubah dalam waktu 24 jam setelah diinput.' });
      }
    }

    // Validation
    const ph = parseFloat(ph_tanah);
    if (ph_tanah !== undefined) {
      if (isNaN(ph) || ph < 0 || ph > 14) {
        return res.status(400).json({ message: 'Nilai pH tanah harus berada di antara 0 dan 14.' });
      }
    }

    if (tanggal_kirim && tanggal_selesai) {
      if (new Date(tanggal_selesai) < new Date(tanggal_kirim)) {
        return res.status(400).json({ message: 'Tanggal selesai analisa tidak boleh sebelum tanggal kirim.' });
      }
    }

    const previousData = { ...record.toJSON() };

    // Calculate changes
    const updatedFields = {
      kode_percobaan: kode_percobaan !== undefined ? (kode_percobaan || '-') : record.kode_percobaan,
      pg: pg || record.pg,
      tanggal_kirim: tanggal_kirim || record.tanggal_kirim,
      tanggal_selesai: tanggal_selesai || record.tanggal_selesai,
      tanggal_sampling: tanggal_sampling || record.tanggal_sampling,
      lokasi: lokasi ? lokasi.trim().toUpperCase() : record.lokasi,
      status_lokasi: status_lokasi ? status_lokasi.trim() : record.status_lokasi,
      no_plot: no_plot !== undefined ? parseInt(no_plot) : record.no_plot,
      no_sample: no_sample !== undefined ? parseInt(no_sample) : record.no_sample,
      ph_tanah: ph_tanah !== undefined ? ph : record.ph_tanah
    };

    // Recalculate if date or location changes
    if (updatedFields.tanggal_sampling !== record.tanggal_sampling || updatedFields.lokasi !== record.lokasi || updatedFields.pg !== record.pg || updatedFields.status_lokasi !== record.status_lokasi || tanggal_tanam_manual !== undefined) {
      updatedFields.week_sampling = getWeekNumber(updatedFields.tanggal_sampling);
      updatedFields.bulan_sampling = getMonthFromDate(updatedFields.tanggal_sampling);
      updatedFields.tahun_sampling = getYearFromDate(updatedFields.tanggal_sampling);
      updatedFields.block_weekly = `${updatedFields.lokasi} - ${updatedFields.status_lokasi}`;

      // Re-lookup population info from Block table
      const lookup = await Block.findOne({
        where: { block_code: updatedFields.lokasi, pg: updatedFields.pg }
      });

      if (lookup) {
        updatedFields.wk_tanam = lookup.wk_tanam;
        updatedFields.tahun_tanam = lookup.tahun_tanam;
        updatedFields.tanggal_tanam = tanggal_tanam_manual !== undefined ? (tanggal_tanam_manual || lookup.tanggal_tanam) : record.tanggal_tanam;
      } else {
        updatedFields.wk_tanam = null;
        updatedFields.tahun_tanam = null;
        updatedFields.tanggal_tanam = tanggal_tanam_manual !== undefined ? (tanggal_tanam_manual || null) : record.tanggal_tanam;
      }

      if (updatedFields.tanggal_tanam) {
        updatedFields.umur_saat_sampling = getAgeInMonths(updatedFields.tanggal_sampling, updatedFields.tanggal_tanam);
      } else {
        updatedFields.umur_saat_sampling = null;
      }
    }



    await record.update(updatedFields);

    // Log update
    await ActivityLog.create({
      user_id: user.id,
      aksi: 'update',
      tabel_target: 'ph_data',
      data_id: record.id,
      detail: {
        sebelum: previousData,
        sesudah: record.toJSON()
      }
    });

    return res.json({ message: 'Data pH berhasil diperbarui.', data: record });
  } catch (error) {
    console.error('Update pH Data Error:', error);
    return res.status(500).json({ message: 'Gagal memperbarui data pH tanah.' });
  }
}

/**
 * Delete pH Data (Admin: kapan saja; User biasa: dalam 24 jam)
 */
async function remove(req, res) {
  const { id } = req.params;
  const user = req.user;

  try {
    const record = await PHData.findByPk(id);
    if (!record) {
      return res.status(404).json({ message: 'Data tidak ditemukan.' });
    }

    // Check PG access for non-admin
    if (user.role !== 'admin') {
      const allowedPGs = user.pg_akses || [];
      if (!allowedPGs.includes(record.pg)) {
        return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki akses untuk PG ini.' });
      }

      // 24-hour restriction for non-admin
      const now = new Date();
      const createdAt = new Date(record.created_at);
      const hoursDiff = Math.abs(now - createdAt) / 36e5;
      if (hoursDiff > 24) {
        return res.status(403).json({ message: 'Akses ditolak. Data hanya dapat dihapus dalam 24 jam setelah diinput. Hubungi Administrator.' });
      }
    }

    const deletedData = record.toJSON();
    await record.destroy();

    // Log delete
    await ActivityLog.create({
      user_id: user.id,
      aksi: 'delete',
      tabel_target: 'ph_data',
      data_id: id,
      detail: { data_terhapus: deletedData }
    });

    return res.json({ message: 'Data pH berhasil dihapus.' });
  } catch (error) {
    console.error('Delete pH Data Error:', error);
    return res.status(500).json({ message: 'Gagal menghapus data pH tanah.' });
  }
}

/**
 * Bulk Import Excel Template
 */
async function importExcel(req, res) {
  const user = req.user;

  if (!req.file) {
    return res.status(400).json({ message: 'File Excel wajib diunggah.' });
  }

  try {
    // Read buffer
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Parse as JSON. We need the raw header mapping
    const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
    
    if (rows.length === 0) {
      return res.status(400).json({ message: 'File Excel kosong atau format salah.' });
    }

    console.log(`📥 Importing ${rows.length} rows from Excel...`);
    let importedCount = 0;
    let skippedCount = 0;
    const errors = [];

    // Process each row
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      
      const pgVal = (row['PG'] || row['pg'] || '').toString().toUpperCase().trim();
      const tglSamplingVal = row['Tgl Sampling'] || row['Tanggal Sampling'] || row['tgl_sampling'];
      const tglKirimVal = row['Tgl Kirim'] || row['Tanggal Kirim'] || row['tgl_kirim'];
      const tglSelesaiVal = row['Tgl Selesai'] || row['Tanggal Selesai'] || row['tgl_selesai'];
      const lokasiVal = (row['Lokasi'] || row['Block'] || row['lokasi'] || '').toString().trim();
      const statusLokasiVal = (row['Status Lokasi'] || row['status_lokasi'] || '').toString().trim().toUpperCase();
      const tglTanamVal = row['Tgl Tanam'] || row['Tanggal Tanam'] || row['tgl_tanam'];
      const noPlotVal = parseInt(row['No Plot'] || row['No. Plot'] || row['no_plot'] || 1);
      const noSampleVal = parseInt(row['No Sample'] || row['No. Sample'] || row['no_sample']);
      const phTanahVal = parseFloat(row['pH Tanah'] || row['ph_tanah'] || row['pH']);

      // Fallback if Tgl Sampling is not provided
      const actualTglSamplingVal = tglSamplingVal || tglKirimVal;

      // Validations
      if (!pgVal || !tglKirimVal || !tglSelesaiVal || !actualTglSamplingVal || !lokasiVal || !statusLokasiVal || isNaN(noPlotVal) || isNaN(noSampleVal) || isNaN(phTanahVal)) {
        skippedCount++;
        errors.push(`Baris ${index + 2}: Kolom utama (PG/Tanggal/Lokasi/Plot/pH) kosong atau format salah.`);
        continue;
      }

      // Check access permission for PG
      if (user.role !== 'admin' && !user.pg_akses.includes(pgVal)) {
        skippedCount++;
        errors.push(`Baris ${index + 2}: Anda tidak memiliki akses untuk menginput data ke PG ${pgVal}.`);
        continue;
      }

      // Handle Dates
      const parseDate = (d) => {
        if (!d) return null;
        if (typeof d === 'number') {
          return new Date(Math.round((d - 25569) * 86400 * 1000)).toISOString().split('T')[0];
        }
        if (typeof d === 'string') {
          const cleaned = d.trim();
          // Support DD/MM/YYYY and YYYY-MM-DD
          const parts = cleaned.split(/[-/]/);
          if (parts.length === 3) {
            let day, month, year;
            if (parts[0].length === 4) {
              year = parseInt(parts[0], 10);
              month = parseInt(parts[1], 10);
              day = parseInt(parts[2], 10);
            } else if (parts[2].length === 4) {
              day = parseInt(parts[0], 10);
              month = parseInt(parts[1], 10);
              year = parseInt(parts[2], 10);
            }
            if (year && month && day) {
              const date = new Date(year, month - 1, day);
              if (!isNaN(date.getTime())) {
                const yyyy = date.getFullYear();
                const mm = String(date.getMonth() + 1).padStart(2, '0');
                const dd = String(date.getDate()).padStart(2, '0');
                return `${yyyy}-${mm}-${dd}`;
              }
            }
          }
          const parsed = new Date(cleaned);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
        }
        return null;
      };

      const tanggal_kirim = parseDate(tglKirimVal);
      const tanggal_selesai = parseDate(tglSelesaiVal);
      const tanggal_sampling = parseDate(actualTglSamplingVal);
      const tanggal_tanam_manual = parseDate(tglTanamVal);

      if (!tanggal_kirim || !tanggal_selesai || !tanggal_sampling) {
        skippedCount++;
        errors.push(`Baris ${index + 2}: Tanggal tidak valid.`);
        continue;
      }

      const week_sampling = getWeekNumber(tanggal_sampling);
      const bulan_sampling = getMonthFromDate(tanggal_sampling);
      const tahun_sampling = getYearFromDate(tanggal_sampling);
      const block_weekly = `${lokasiVal} - ${statusLokasiVal}`;

      // Lookup population info from Block
      const lookup = await Block.findOne({
        where: { block_code: lokasiVal.toUpperCase(), pg: pgVal }
      });

      let wk_tanam = null;
      let tahun_tanam = null;
      let tanggal_tanam = tanggal_tanam_manual || null;
      let umur_saat_sampling = null;

      if (lookup) {
        wk_tanam = lookup.wk_tanam;
        tahun_tanam = lookup.tahun_tanam;
        if (!tanggal_tanam) {
          tanggal_tanam = lookup.tanggal_tanam;
        }
      }

      if (tanggal_tanam) {
        umur_saat_sampling = getAgeInMonths(tanggal_sampling, tanggal_tanam);
      }

      await PHData.create({
        user_id: user.id,
        kode_percobaan: row['Kode Percobaan'] || row['kode_percobaan'] || '-',
        pengirim_sampel: row['Pengirim Sampel'] || row['pengirim_sampel'] || user.nama,
        pg: pgVal,
        tanggal_kirim,
        tanggal_selesai,
        tanggal_sampling,
        week_sampling,
        bulan_sampling,
        tahun_sampling,
        lokasi: lokasiVal.toUpperCase(),
        status_lokasi: statusLokasiVal,
        block_weekly,
        wk_tanam,
        tahun_tanam,
        tanggal_tanam,
        umur_saat_sampling,
        no_plot: noPlotVal,
        no_sample: noSampleVal,
        ph_tanah: phTanahVal
      });

      importedCount++;
    }

    // Log import
    await ActivityLog.create({
      user_id: user.id,
      aksi: 'import',
      tabel_target: 'ph_data',
      detail: { file_name: req.file.originalname, baris_diimport: importedCount, baris_dilewati: skippedCount }
    });

    return res.json({
      message: 'Proses import selesai.',
      imported: importedCount,
      skipped: skippedCount,
      errors: errors.slice(0, 10)
    });

  } catch (error) {
    console.error('Import Excel Error:', error);
    return res.status(500).json({ message: 'Gagal mengimpor file Excel.' });
  }
}

/**
 * Export Excel File
 */
async function exportExcel(req, res) {
  const { pg, tahun, minggu_mulai, minggu_selesai, format } = req.query;
  const user = req.user;

  // Build filters
  const whereClause = {};

  if (user.role !== 'admin') {
    const allowedPGs = user.pg_akses || [];
    if (pg && allowedPGs.includes(pg)) {
      whereClause.pg = pg;
    } else {
      whereClause.pg = { [Op.in]: allowedPGs };
    }
  } else if (pg) {
    whereClause.pg = pg;
  }

  if (tahun) {
    whereClause.tahun_sampling = parseInt(tahun);
  }

  if (minggu_mulai && minggu_selesai) {
    whereClause.week_sampling = {
      [Op.between]: [parseInt(minggu_mulai), parseInt(minggu_selesai)]
    };
  } else if (minggu_mulai) {
    whereClause.week_sampling = { [Op.gte]: parseInt(minggu_mulai) };
  } else if (minggu_selesai) {
    whereClause.week_sampling = { [Op.lte]: parseInt(minggu_selesai) };
  }

  try {
    const records = await PHData.findAll({
      where: whereClause,
      order: [['pg', 'ASC'], ['tanggal_kirim', 'ASC'], ['lokasi', 'ASC'], ['no_plot', 'ASC'], ['no_sample', 'ASC']]
    });

    // CSV format
    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=ph_data_export.csv');
      
      let csvContent = '\uFEFF'; // Add BOM for excel indonesian compatibility
      csvContent += 'Kode Percobaan,Pengirim Sampel,PG,Tgl Sampling,Tgl Kirim,Tgl Selesai,Week,Bulan,Tahun,Lokasi,Status Lokasi,Block Weekly,Wk Tanam,Tahun Tanam,Tgl Tanam,Umur (bln),No Plot,No Sample,pH Tanah\n';
      
      records.forEach(r => {
        csvContent += `"${r.kode_percobaan}","${r.pengirim_sampel}","${r.pg}","${r.tanggal_sampling || ''}","${r.tanggal_kirim}","${r.tanggal_selesai}",${r.week_sampling},${r.bulan_sampling},${r.tahun_sampling},"${r.lokasi}","${r.status_lokasi}","${r.block_weekly}",${r.wk_tanam || ''},${r.tahun_tanam || ''},"${r.tanggal_tanam || ''}",${r.umur_saat_sampling || ''},${r.no_plot || 1},${r.no_sample},${r.ph_tanah}\n`;
      });
      
      // Log export
      await ActivityLog.create({
        user_id: user.id,
        aksi: 'export',
        tabel_target: 'ph_data',
        detail: { format: 'csv', total_baris: records.length }
      });

      return res.send(csvContent);
    }

    // Excel format
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('pH');

    // Enable Grid Lines
    worksheet.views = [{ showGridLines: true }];

    // Style headers
    const headerRow = worksheet.addRow([
      'Kode Percobaan',
      'Pengirim Sampel',
      'PG',
      'Tgl Sampling',
      'Tgl Kirim',
      'Tgl Selesai',
      'Week',
      'Bulan',
      'Tahun',
      'Lokasi',
      'Status Lokasi',
      'Block Weekly',
      'Wk Tanam',
      'Tahun Tanam',
      'Tgl Tanam',
      'Umur (bln)',
      'No Plot',
      'No Sample',
      'pH Tanah'
    ]);

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF10B981' } // Beautiful Emerald Green Accent
      };
      cell.font = {
        name: 'Segoe UI',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Populate data
    records.forEach(r => {
      const row = worksheet.addRow([
        r.kode_percobaan,
        r.pengirim_sampel,
        r.pg,
        r.tanggal_sampling || '',
        r.tanggal_kirim,
        r.tanggal_selesai,
        r.week_sampling,
        r.bulan_sampling,
        r.tahun_sampling,
        r.lokasi,
        r.status_lokasi,
        r.block_weekly,
        r.wk_tanam,
        r.tahun_tanam,
        r.tanggal_tanam,
        r.umur_saat_sampling,
        r.no_plot || 1,
        r.no_sample,
        parseFloat(r.ph_tanah)
      ]);

      // Add thin borders
      row.eachCell((cell, colNumber) => {
        cell.font = { name: 'Segoe UI', size: 10 };
        cell.border = {
          top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
          right: { style: 'thin', color: { argb: 'FFE5E7EB' } }
        };
        // Alignments
        if ([3, 6, 7, 8, 10, 12, 13, 14, 15, 16, 17, 18].includes(colNumber)) {
          cell.alignment = { horizontal: 'center' };
        }
      });
    });

    // Auto fit column widths
    worksheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const value = cell.value ? cell.value.toString() : '';
        if (value.length > maxLen) {
          maxLen = value.length;
        }
      });
      column.width = Math.max(maxLen + 4, 12);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=ph_data_export.xlsx');

    // Log export
    await ActivityLog.create({
      user_id: user.id,
      aksi: 'export',
      tabel_target: 'ph_data',
      detail: { format: 'xlsx', total_baris: records.length }
    });

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Export Excel Error:', error);
    return res.status(500).json({ message: 'Gagal mengekspor data Excel.' });
  }
}

/**
 * Download Excel Import Template
 */
async function downloadTemplate(req, res) {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Template Import pH');

    // Enable Grid Lines
    worksheet.views = [{ showGridLines: true }];

    // Headers
    const headers = [
      'Kode Percobaan',
      'Pengirim Sampel',
      'PG',
      'Tgl Sampling',
      'Tgl Kirim',
      'Tgl Selesai',
      'Lokasi',
      'Status Lokasi',
      'Tgl Tanam',
      'No Plot',
      'No Sample',
      'pH Tanah'
    ];

    const headerRow = worksheet.addRow(headers);

    headerRow.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF3B82F6' } // Blue color for template headers
      };
      cell.font = {
        name: 'Segoe UI',
        bold: true,
        color: { argb: 'FFFFFFFF' },
        size: 11
      };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Add sample row
    const sampleRow = worksheet.addRow([
      'EXP-001',
      'Ahmad Officer PG3',
      'PG3',
      '2026-06-08',
      '2026-06-08',
      '2026-06-09',
      '554E2A',
      'PSFC',
      '2025-10-15',
      1,
      1,
      6.2
    ]);

    sampleRow.eachCell((cell) => {
      cell.font = { name: 'Segoe UI', size: 10, italic: true };
      cell.font.color = { argb: 'FF9CA3AF' }; // Gray text for example
    });

    // Auto fit column widths
    worksheet.columns.forEach((column) => {
      let maxLen = 0;
      column.eachCell({ includeEmpty: true }, (cell) => {
        const value = cell.value ? cell.value.toString() : '';
        if (value.length > maxLen) {
          maxLen = value.length;
        }
      });
      column.width = Math.max(maxLen + 4, 15);
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=template_import_ph.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Download Template Error:', error);
    return res.status(500).json({ message: 'Gagal mengunduh template Excel.' });
  }
}

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  lookupBlock,
  importExcel,
  exportExcel,
  downloadTemplate
};
