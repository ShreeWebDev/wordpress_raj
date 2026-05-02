const { Notification, User } = require('../models');

const createNotification = async (userId, message, link = null) => {
  try {
    await Notification.create({ user_id: userId, message, link });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

const notifyAdmins = async (message, link = null) => {
  try {
    const admins = await User.findAll({ where: { role: 'admin', is_active: true }, attributes: ['id'] });
    for (const admin of admins) {
      await createNotification(admin.id, message, link);
    }
  } catch (err) {
    console.error('Notify admins error:', err.message);
  }
};

module.exports = { createNotification, notifyAdmins };
