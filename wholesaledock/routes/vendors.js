const express = require('express');
const router = express.Router();
const vc = require('../controllers/vendorController');
const { authenticate, requireAdminOrAgent } = require('../middleware/auth');

router.get('/', authenticate, requireAdminOrAgent, vc.index);
router.get('/api/list', authenticate, requireAdminOrAgent, vc.apiList);
router.get('/create', authenticate, requireAdminOrAgent, vc.getCreate);
router.post('/create', authenticate, requireAdminOrAgent, vc.postCreate);
router.get('/:id', authenticate, requireAdminOrAgent, vc.show);
router.get('/:id/edit', authenticate, requireAdminOrAgent, vc.getEdit);
router.post('/:id/edit', authenticate, requireAdminOrAgent, vc.postEdit);

module.exports = router;
