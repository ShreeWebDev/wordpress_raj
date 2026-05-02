const express = require('express');
const router = express.Router();
const oc = require('../controllers/orderController');
const { authenticate, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');

router.get('/', authenticate, oc.index);
router.post('/rfq', authenticate, oc.createRfq);
router.post('/:id/confirm-rfq', authenticate, requireRole('admin'), oc.confirmRfq);
router.delete('/:id/cancel-rfq', authenticate, requireRole('admin'), oc.cancelRfq);
router.put('/:id/detail', authenticate, oc.updateDetail);
router.post('/:id/advance', authenticate, oc.advanceStatus);
router.post('/:id/comment', authenticate, oc.addComment);
router.post('/:id/attachments', authenticate, upload.array('files', 10), oc.uploadAttachment);
router.post('/load', authenticate, oc.loadOrders);
router.put('/shipments/:id/rates', authenticate, requireRole('admin'), oc.updateShipmentRates);
router.post('/shipments/:id/close', authenticate, requireRole('admin'), oc.closeShipment);
router.get('/shipments/:id/export', authenticate, oc.exportShipment);
router.get('/shipments/:id/detail', authenticate, oc.getShipmentDetail);

module.exports = router;
