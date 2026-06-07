const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PHData = sequelize.define('PHData', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  kode_percobaan: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: '-'
  },
  pengirim_sampel: {
    type: DataTypes.STRING,
    allowNull: false
  },
  pg: {
    type: DataTypes.STRING, // 'PG1', 'PG3', 'PG4'
    allowNull: false
  },
  tanggal_kirim: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  tanggal_selesai: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  week_sampling: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  bulan_sampling: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  tahun_sampling: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  lokasi: {
    type: DataTypes.STRING, // Kode Block
    allowNull: false
  },
  status_lokasi: {
    type: DataTypes.STRING, // PSFC, PSSC, PSSR, PS3R, PS4R
    allowNull: false
  },
  block_weekly: {
    type: DataTypes.STRING, // lokasi + suffix/status
    allowNull: false
  },
  wk_tanam: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tahun_tanam: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tanggal_tanam: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  umur_saat_sampling: {
    type: DataTypes.INTEGER, // Dalam bulan
    allowNull: true
  },
  tanggal_sampling: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  no_plot: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1
  },
  no_sample: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  ph_tanah: {
    type: DataTypes.DECIMAL(4, 2),
    allowNull: false
  }
}, {
  tableName: 'ph_data',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PHData;
