const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ShipmentItem = sequelize.define('ShipmentItem', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  shipment_id: { type: DataTypes.INTEGER, allowNull: false },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  no_of_ctns: { type: DataTypes.INTEGER, allowNull: true },
  total_qty: { type: DataTypes.INTEGER, allowNull: true },
  total_cbm: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
  total_weight: { type: DataTypes.DECIMAL(10, 2), allowNull: true }
}, { tableName: 'shipment_items' });

module.exports = ShipmentItem;
