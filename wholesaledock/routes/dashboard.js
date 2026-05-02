const express = require('express');
const router = express.Router();
const { getDashboard, getNotifications, getUnreadCount } = require('../controllers/dashboardController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, getDashboard);
router.get('/notifications', authenticate, getNotifications);
router.get('/notifications/count', authenticate, getUnreadCount);

module.exports = router;
