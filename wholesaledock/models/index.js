const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Vendor = require('./Vendor');
const ProductVendor = require('./ProductVendor');
const Order = require('./Order');
const OrderDetail = require('./OrderDetail');
const Shipment = require('./Shipment');
const ShipmentItem = require('./ShipmentItem');
const Notification = require('./Notification');

// Product <-> Vendor (many-to-many through ProductVendor)
Product.hasMany(ProductVendor, { foreignKey: 'product_id', as: 'productVendors' });
ProductVendor.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Vendor.hasMany(ProductVendor, { foreignKey: 'vendor_id', as: 'productVendors' });
ProductVendor.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });
Product.belongsToMany(Vendor, { through: ProductVendor, foreignKey: 'product_id', otherKey: 'vendor_id', as: 'vendors' });
Vendor.belongsToMany(Product, { through: ProductVendor, foreignKey: 'vendor_id', otherKey: 'product_id', as: 'products' });

// Order associations
Order.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Order.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' });
Order.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Order.hasOne(OrderDetail, { foreignKey: 'order_id', as: 'detail' });
Product.hasMany(Order, { foreignKey: 'product_id', as: 'orders' });

// OrderDetail associations
OrderDetail.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });
OrderDetail.belongsTo(Vendor, { foreignKey: 'vendor_id', as: 'vendor' });

// Shipment associations
Shipment.belongsTo(User, { foreignKey: 'agent_id', as: 'agent' });
Shipment.hasMany(ShipmentItem, { foreignKey: 'shipment_id', as: 'items' });
ShipmentItem.belongsTo(Shipment, { foreignKey: 'shipment_id', as: 'shipment' });
ShipmentItem.belongsTo(Order, { foreignKey: 'order_id', as: 'order' });

// Notifications
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });

module.exports = {
  sequelize, User, Product, Vendor, ProductVendor,
  Order, OrderDetail, Shipment, ShipmentItem, Notification
};
