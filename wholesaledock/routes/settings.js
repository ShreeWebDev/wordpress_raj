const express = require('express');
const router = express.Router();
const sc = require('../controllers/settingsController');
const { authenticate, requireAdmin } = require('../middleware/auth');

router.get('/', authenticate, requireAdmin, sc.index);
router.post('/users', authenticate, requireAdmin, sc.createUser);
router.put('/users/:id', authenticate, requireAdmin, sc.updateUser);
router.delete('/users/:id', authenticate, requireAdmin, sc.deleteUser);

module.exports = router;
