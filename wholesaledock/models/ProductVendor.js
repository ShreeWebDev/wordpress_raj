const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProductVendor = sequelize.define('ProductVendor', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  product_id: { type: DataTypes.INTEGER, allowNull: false },
  vendor_id: { type: DataTypes.INTEGER, allowNull: false },
  product_link: { type: DataTypes.STRING(1000), allowNull: true },
  rate_rmb: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  ctn_l: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  ctn_b: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  ctn_h: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  ctn_cbm: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
  ctn_qty: { type: DataTypes.INTEGER, allowNull: true },
  ctn_weight: { type: DataTypes.DECIMAL(10, 2), allowNull: true }
}, {
  tableName: 'product_vendors',
  hooks: {
    beforeSave: (pv) => {
      if (pv.ctn_l && pv.ctn_b && pv.ctn_h) {
        pv.ctn_cbm = parseFloat(((pv.ctn_l / 100) * (pv.ctn_b / 100) * (pv.ctn_h / 100)).toFixed(4));
      }
    }
  }
});

module.exports = ProductVendor;
