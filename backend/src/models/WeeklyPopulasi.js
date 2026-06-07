const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeeklyPopulasi = sequelize.define('WeeklyPopulasi', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  pg: {
    type: DataTypes.STRING,
    allowNull: false
  },
  block: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false
  },
  luas: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true
  },
  populasi: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  clone: {
    type: DataTypes.STRING,
    allowNull: true
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
  week_data: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  tahun_data: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: 'weekly_populasi',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = WeeklyPopulasi;
