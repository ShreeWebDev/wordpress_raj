const express = require('express');
const router = express.Router();
const pc = require('../controllers/productController');
const { authenticate, requireAdminOrAgent } = require('../middleware/auth');
const { uploadImage, upload } = require('../middleware/upload');

router.get('/', authenticate, pc.index);
router.get('/api/list', authenticate, pc.apiList);
router.get('/create', authenticate, requireAdminOrAgent, pc.getCreate);
router.post('/create', authenticate, requireAdminOrAgent, uploadImage.single('image'), pc.postCreate);
router.get('/:id', authenticate, pc.show);
router.get('/:id/edit', authenticate, requireAdminOrAgent, pc.getEdit);
router.post('/:id/edit', authenticate, requireAdminOrAgent, uploadImage.single('image'), pc.postEdit);
router.get('/:id/label', authenticate, pc.downloadLabel);
router.post('/:product_id/vendors', authenticate, requireAdminOrAgent, pc.addVendorToProduct);
router.delete('/vendors/:pvId', authenticate, requireAdminOrAgent, pc.removeVendorFromProduct);

module.exports = router;
