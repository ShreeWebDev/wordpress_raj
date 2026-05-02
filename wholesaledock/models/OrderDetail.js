const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OrderDetail = sequelize.define('OrderDetail', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id: { type: DataTypes.INTEGER, allowNull: false },
  vendor_id: { type: DataTypes.INTEGER, allowNull: true },
  product_link: { type: DataTypes.STRING(1000), allowNull: true },
  rate_rmb: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  ctn_qty: { type: DataTypes.INTEGER, allowNull: true },
  ctn_l: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  ctn_b: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  ctn_h: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  ctn_cbm: { type: DataTypes.DECIMAL(10, 4), allowNull: true },
  ctn_weight: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  comments: { type: DataTypes.JSON, defaultValue: [] },
  attachments: { type: DataTypes.JSON, defaultValue: [] }
}, {
  tableName: 'order_details',
  hooks: {
    beforeSave: (od) => {
      if (od.ctn_l && od.ctn_b && od.ctn_h) {
        od.ctn_cbm = parseFloat(((od.ctn_l / 100) * (od.ctn_b / 100) * (od.ctn_h / 100)).toFixed(4));
      }
    }
  }
});

module.exports = OrderDetail;
