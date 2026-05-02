const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING(255), allowNull: false },
  sku: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  image_path: { type: DataTypes.STRING(500), allowNull: true },
  box_label_image_path: { type: DataTypes.STRING(500), allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { tableName: 'products' });

module.exports = Product;
