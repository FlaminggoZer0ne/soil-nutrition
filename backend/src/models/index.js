const { Op } = require('sequelize');
const sequelize = require('../config/database');

const User = require('./User');
const PHData = require('./PHData');
const WeeklyPopulasi = require('./WeeklyPopulasi');
const ActivityLog = require('./ActivityLog');
const PG = require('./PG');
const Block = require('./Block');
const LocationStatus = require('./LocationStatus');

// Associations
ActivityLog.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(ActivityLog, { foreignKey: 'user_id', as: 'logs' });

PHData.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(PHData, { foreignKey: 'user_id', as: 'ph_data' });

module.exports = {
  sequelize,
  Op,
  User,
  PHData,
  WeeklyPopulasi,
  ActivityLog,
  PG,
  Block,
  LocationStatus
};
