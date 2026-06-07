const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActivityLog = sequelize.define('ActivityLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  aksi: {
    type: DataTypes.STRING, // 'create', 'update', 'delete', 'export', 'import', 'login'
    allowNull: false
  },
  tabel_target: {
    type: DataTypes.STRING,
    allowNull: true
  },
  data_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  detail: {
    type: DataTypes.TEXT, // Stored as stringified JSON
    allowNull: true,
    get() {
      const rawValue = this.getDataValue('detail');
      try {
        return rawValue ? JSON.parse(rawValue) : {};
      } catch (e) {
        return {};
      }
    },
    set(value) {
      this.setDataValue('detail', JSON.stringify(value || {}));
    }
  }
}, {
  tableName: 'activity_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

module.exports = ActivityLog;
