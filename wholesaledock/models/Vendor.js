const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Vendor = sequelize.define('Vendor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  contact_no: { type: DataTypes.STRING(50), allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true }
}, { tableName: 'vendors' });

module.exports = Vendor;
