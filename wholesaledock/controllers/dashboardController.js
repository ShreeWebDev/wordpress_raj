const { Order, Product, Shipment, Notification, User } = require('../models');
const { Op } = require('sequelize');

exports.getDashboard = async (req, res) => {
  try {
    const user = req.user;
    const agentFilter = user.role === 'agent' ? { agent_id: user.id } : {};

    const [rfqCount, toOrderCount, orderedCount, recdChinaCount, loadedCount, totalSKUs, unreadNotifs] = await Promise.all([
      user.role !== 'agent' ? Order.count({ where: { status: 'rfq', ...agentFilter } }) : Promise.resolve(0),
      Order.count({ where: { status: 'to_order', ...agentFilter } }),
      Order.count({ where: { status: 'ordered', ...agentFilter } }),
      Order.count({ where: { status: 'recd_china', ...agentFilter } }),
      Shipment.count({ where: { status: 'loaded', ...(user.role === 'agent' ? { agent_id: user.id } : {}) } }),
      Product.count({ where: { is_active: true } }),
      Notification.count({ where: { user_id: user.id, is_read: false } })
    ]);

    res.render('dashboard', {
      title: 'Dashboard',
      rfqCount,
      toOrderCount,
      orderedCount,
      recdChinaCount,
      loadedCount,
      totalSKUs,
      unreadNotifs,
      user
    });
  } catch (err) {
    console.error(err);
    res.render('dashboard', { title: 'Dashboard', rfqCount: 0, toOrderCount: 0, orderedCount: 0, recdChinaCount: 0, loadedCount: 0, totalSKUs: 0, unreadNotifs: 0, user: req.user });
  }
};

exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.findAll({
      where: { user_id: req.user.id },
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    await Notification.update({ is_read: true }, { where: { user_id: req.user.id, is_read: false } });
    res.json({ success: true, notifications });
  } catch (err) {
    res.json({ success: false, notifications: [] });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const count = await Notification.count({ where: { user_id: req.user.id, is_read: false } });
    res.json({ count });
  } catch (err) {
    res.json({ count: 0 });
  }
};
