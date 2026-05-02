const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

router.get('/login', authController.getLogin);
router.post('/login', authController.postLogin);
router.get('/logout', authController.logout);
router.get('/profile', authenticate, authController.getProfile);
router.post('/profile', authenticate, authController.postProfile);

module.exports = router;
