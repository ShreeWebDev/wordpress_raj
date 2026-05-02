const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Shipment = sequelize.define('Shipment', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  container_no: { type: DataTypes.STRING(100), allowNull: false },
  etd: { type: DataTypes.DATEONLY, allowNull: true },
  eta: { type: DataTypes.DATEONLY, allowNull: true },
  agent_id: { type: DataTypes.INTEGER, allowNull: true },
  transfer_rate: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
  cbm_rate: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
  status: { type: DataTypes.ENUM('loaded', 'closed'), defaultValue: 'loaded' }
}, { tableName: 'shipments' });

module.exports = Shipment;
