const { Order, OrderDetail, Product, Vendor, ProductVendor, User, Shipment, ShipmentItem, Notification } = require('../models');
const { Op } = require('sequelize');
const { createNotification, notifyAdmins } = require('../utils/notifications');
const { exportShipmentToExcel } = require('../utils/excelExport');
const path = require('path');
const fs = require('fs');

const getOrderBaseInclude = () => [
  { model: Product, as: 'product', attributes: ['id','name','sku','image_path'] },
  { model: User, as: 'agent', attributes: ['id','name'] },
  { model: User, as: 'creator', attributes: ['id','name'] },
  {
    model: OrderDetail, as: 'detail',
    include: [{ model: Vendor, as: 'vendor', attributes: ['id','name','contact_no'] }]
  }
];

exports.index = async (req, res) => {
  try {
    const user = req.user;
    const agentFilter = user.role === 'agent' ? { agent_id: user.id } : {};
    const agents = user.role === 'admin' ? await User.findAll({ where: { role: { [Op.in]: ['agent','admin'] }, is_active: true }, attributes: ['id','name'] }) : [];

    // Fetch all tabs
    const [rfqOrders, toOrderOrders, orderedOrders, recdChinaOrders, loadedShipments, closedShipments] = await Promise.all([
      user.role !== 'agent' ? Order.findAll({ where: { status: 'rfq' }, include: getOrderBaseInclude(), order: [['createdAt','DESC']] }) : Promise.resolve([]),
      Order.findAll({ where: { status: 'to_order', ...agentFilter }, include: getOrderBaseInclude(), order: [['createdAt','DESC']] }),
      Order.findAll({ where: { status: 'ordered', ...agentFilter }, include: getOrderBaseInclude(), order: [['createdAt','DESC']] }),
      Order.findAll({ where: { status: 'recd_china', ...agentFilter }, include: getOrderBaseInclude(), order: [['createdAt','DESC']] }),
      Shipment.findAll({
        where: { status: 'loaded', ...(user.role === 'agent' ? { agent_id: user.id } : {}) },
        include: [
          { model: User, as: 'agent', attributes: ['id','name'] },
          { model: ShipmentItem, as: 'items', include: [{ model: Order, as: 'order', include: [{ model: Product, as: 'product', attributes: ['id','name','sku','image_path'] }, { model: OrderDetail, as: 'detail' }] }] }
        ],
        order: [['createdAt','DESC']]
      }),
      Shipment.findAll({
        where: { status: 'closed', ...(user.role === 'agent' ? { agent_id: user.id } : {}) },
        include: [
          { model: User, as: 'agent', attributes: ['id','name'] },
          { model: ShipmentItem, as: 'items', include: [{ model: Order, as: 'order', include: [{ model: Product, as: 'product', attributes: ['id','name','sku','image_path'] }, { model: OrderDetail, as: 'detail' }] }] }
        ],
        order: [['createdAt','DESC']]
      })
    ]);

    const vendors = await Vendor.findAll({ attributes: ['id','name','contact_no'], order: [['name','ASC']] });

    res.render('orders/index', {
      title: 'Orders',
      rfqOrders: rfqOrders.map(o => o.toJSON()),
      toOrderOrders: toOrderOrders.map(o => o.toJSON()),
      orderedOrders: orderedOrders.map(o => o.toJSON()),
      recdChinaOrders: recdChinaOrders.map(o => o.toJSON()),
      loadedShipments: loadedShipments.map(s => s.toJSON()),
      closedShipments: closedShipments.map(s => s.toJSON()),
      agents,
      vendors: vendors.map(v => v.toJSON()),
      user,
      activeTab: req.query.tab || (user.role === 'agent' ? '2' : '1')
    });
  } catch (err) {
    console.error(err);
    res.render('orders/index', { title: 'Orders', rfqOrders: [], toOrderOrders: [], orderedOrders: [], recdChinaOrders: [], loadedShipments: [], closedShipments: [], agents: [], vendors: [], user: req.user, activeTab: '1' });
  }
};

// Create RFQ
exports.createRfq = async (req, res) => {
  try {
    const { product_id, qty } = req.body;
    if (!product_id || !qty) return res.status(400).json({ success: false, message: 'Product and quantity required.' });

    const product = await Product.findByPk(product_id);
    if (!product) return res.status(404).json({ success: false, message: 'Product not found.' });

    const order = await Order.create({ product_id, qty: parseInt(qty), status: 'rfq', created_by: req.user.id, agent_id: null });
    await OrderDetail.create({ order_id: order.id });
    await notifyAdmins(`New RFQ for ${product.name} (Qty: ${qty})`, '/orders?tab=1');

    res.json({ success: true, message: 'RFQ created successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Confirm RFQ → to_order
exports.confirmRfq = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only.' });
    const { agent_id, qty } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order || order.status !== 'rfq') return res.status(404).json({ success: false, message: 'RFQ not found.' });
    if (!agent_id) return res.status(400).json({ success: false, message: 'Agent is required.' });

    await order.update({ status: 'to_order', agent_id, qty: qty || order.qty });
    await createNotification(agent_id, `RFQ confirmed. Order #${order.id} assigned to you.`, '/orders?tab=2');

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Cancel RFQ
exports.cancelRfq = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only.' });
    const order = await Order.findByPk(req.params.id);
    if (!order || order.status !== 'rfq') return res.status(404).json({ success: false, message: 'RFQ not found.' });
    await OrderDetail.destroy({ where: { order_id: order.id } });
    await order.destroy();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update order detail (vendor, rates, dims, etc.)
exports.updateDetail = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderDetail, as: 'detail' }] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    // Access control
    if (req.user.role === 'agent' && order.agent_id !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied.' });

    const { vendor_id, product_link, rate_rmb, ctn_qty, ctn_l, ctn_b, ctn_h, ctn_weight, qty } = req.body;
    const updates = {};
    if (vendor_id !== undefined) updates.vendor_id = vendor_id || null;
    if (product_link !== undefined) updates.product_link = product_link;
    if (rate_rmb !== undefined) updates.rate_rmb = rate_rmb || null;
    if (ctn_qty !== undefined) updates.ctn_qty = ctn_qty || null;
    if (ctn_l !== undefined) updates.ctn_l = ctn_l || null;
    if (ctn_b !== undefined) updates.ctn_b = ctn_b || null;
    if (ctn_h !== undefined) updates.ctn_h = ctn_h || null;
    if (ctn_weight !== undefined) updates.ctn_weight = ctn_weight || null;

    if (updates.ctn_l && updates.ctn_b && updates.ctn_h) {
      updates.ctn_cbm = parseFloat(((updates.ctn_l / 100) * (updates.ctn_b / 100) * (updates.ctn_h / 100)).toFixed(4));
    }

    if (order.detail) await order.detail.update(updates);
    else await OrderDetail.create({ order_id: order.id, ...updates });

    if (qty) await order.update({ qty });

    // Sync back to product_vendors if vendor is set
    if (vendor_id && (rate_rmb || ctn_l || ctn_b || ctn_h || ctn_qty || ctn_weight || product_link)) {
      const pv = await ProductVendor.findOne({ where: { product_id: order.product_id, vendor_id } });
      if (pv) {
        const pvUpdates = {};
        if (product_link) pvUpdates.product_link = product_link;
        if (rate_rmb) pvUpdates.rate_rmb = rate_rmb;
        if (ctn_l) pvUpdates.ctn_l = ctn_l;
        if (ctn_b) pvUpdates.ctn_b = ctn_b;
        if (ctn_h) pvUpdates.ctn_h = ctn_h;
        if (ctn_qty) pvUpdates.ctn_qty = ctn_qty;
        if (ctn_weight) pvUpdates.ctn_weight = ctn_weight;
        await pv.update(pvUpdates);
      }
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Move order to next status
exports.advanceStatus = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, {
      include: [{ model: OrderDetail, as: 'detail' }, { model: Product, as: 'product' }]
    });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (req.user.role === 'agent' && order.agent_id !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied.' });

    const transitions = { to_order: 'ordered', ordered: 'recd_china' };
    const next = transitions[order.status];

    if (!next) return res.status(400).json({ success: false, message: 'Invalid status transition.' });

    // Validate vendor for to_order → ordered
    if (order.status === 'to_order' && !order.detail?.vendor_id) {
      return res.status(400).json({ success: false, message: 'Please select a vendor before marking as Ordered.' });
    }

    await order.update({ status: next });

    const statusLabels = { ordered: 'To Receive', recd_china: 'Received in China W/H' };
    const tabNums = { ordered: '3', recd_china: '4' };

    await notifyAdmins(`Order #${order.id} (${order.product?.name}) moved to ${statusLabels[next]}`, `/orders?tab=${tabNums[next]}`);
    if (order.agent_id && order.agent_id !== req.user.id) {
      await createNotification(order.agent_id, `Order #${order.id} (${order.product?.name}) moved to ${statusLabels[next]}`, `/orders?tab=${tabNums[next]}`);
    }

    res.json({ success: true, newStatus: next });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Add comment
exports.addComment = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderDetail, as: 'detail' }] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    if (req.user.role === 'agent' && order.agent_id !== req.user.id) return res.status(403).json({ success: false, message: 'Access denied.' });

    const { message } = req.body;
    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message required.' });

    const detail = order.detail || await OrderDetail.create({ order_id: order.id });
    const comments = detail.comments || [];
    const newComment = { id: Date.now(), user_id: req.user.id, user_name: req.user.name, role: req.user.role, message: message.trim(), timestamp: new Date().toISOString() };
    comments.push(newComment);
    await detail.update({ comments });

    // Notify the other party
    if (req.user.role === 'admin' && order.agent_id) {
      await createNotification(order.agent_id, `New comment on Order #${order.id}`, `/orders?tab=2`);
    } else if (req.user.role === 'agent') {
      await notifyAdmins(`New comment on Order #${order.id}`, `/orders?tab=2`);
    }

    res.json({ success: true, comment: newComment });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Upload attachment
exports.uploadAttachment = async (req, res) => {
  try {
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderDetail, as: 'detail' }] });
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });

    if (!req.files || req.files.length === 0) return res.status(400).json({ success: false, message: 'No files uploaded.' });

    const detail = order.detail || await OrderDetail.create({ order_id: order.id });
    const attachments = detail.attachments || [];
    const newFiles = req.files.map(f => ({
      id: Date.now() + Math.random(),
      filename: f.originalname,
      path: `/uploads/${f.filename}`,
      uploaded_by: req.user.id,
      uploaded_at: new Date().toISOString()
    }));
    attachments.push(...newFiles);
    await detail.update({ attachments });

    res.json({ success: true, attachments: newFiles });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Load orders into shipment
exports.loadOrders = async (req, res) => {
  try {
    if (req.user.role === 'sales') return res.status(403).json({ success: false, message: 'Access denied.' });
    const { order_ids, container_no, etd, eta, items_data } = req.body;
    if (!order_ids || !order_ids.length || !container_no) return res.status(400).json({ success: false, message: 'Container number and orders required.' });

    const orders = await Order.findAll({ where: { id: order_ids, status: 'recd_china' } });
    if (!orders.length) return res.status(404).json({ success: false, message: 'No valid orders found.' });

    // Determine agent (use first order's agent)
    const agentId = orders[0].agent_id;

    const shipment = await Shipment.create({ container_no, etd: etd || null, eta: eta || null, agent_id: agentId, status: 'loaded' });

    for (const order of orders) {
      const itemData = items_data?.find(i => i.order_id == order.id) || {};
      await ShipmentItem.create({
        shipment_id: shipment.id,
        order_id: order.id,
        no_of_ctns: itemData.no_of_ctns || null,
        total_qty: itemData.total_qty || order.qty,
        total_cbm: itemData.total_cbm || null,
        total_weight: itemData.total_weight || null
      });
      await order.update({ status: 'loaded' });
    }

    await notifyAdmins(`Shipment ${container_no} created with ${orders.length} SKUs`, '/orders?tab=5');
    if (agentId) await createNotification(agentId, `Your orders loaded into container ${container_no}`, '/orders?tab=5');

    res.json({ success: true, shipment_id: shipment.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// Update shipment rates
exports.updateShipmentRates = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only.' });
    const { transfer_rate, cbm_rate } = req.body;
    const shipment = await Shipment.findByPk(req.params.id);
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });
    await shipment.update({ transfer_rate: transfer_rate || null, cbm_rate: cbm_rate || null });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Close shipment
exports.closeShipment = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only.' });
    const shipment = await Shipment.findByPk(req.params.id, { include: [{ model: ShipmentItem, as: 'items' }] });
    if (!shipment || shipment.status !== 'loaded') return res.status(404).json({ success: false, message: 'Shipment not found.' });

    await shipment.update({ status: 'closed' });
    for (const item of shipment.items) {
      await Order.update({ status: 'closed' }, { where: { id: item.order_id } });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Export shipment
exports.exportShipment = async (req, res) => {
  try {
    const shipment = await Shipment.findByPk(req.params.id, {
      include: [
        { model: User, as: 'agent', attributes: ['id','name'] },
        { model: ShipmentItem, as: 'items', include: [{ model: Order, as: 'order', include: [{ model: Product, as: 'product' }, { model: OrderDetail, as: 'detail' }] }] }
      ]
    });
    if (!shipment) return res.status(404).json({ success: false, message: 'Shipment not found.' });
    await exportShipmentToExcel(shipment.toJSON(), shipment.items.map(i => i.toJSON()), req.user.role, res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Get shipment detail (JSON for popup)
exports.getShipmentDetail = async (req, res) => {
  try {
    const shipment = await Shipment.findByPk(req.params.id, {
      include: [
        { model: User, as: 'agent', attributes: ['id','name'] },
        { model: ShipmentItem, as: 'items', include: [{ model: Order, as: 'order', include: [{ model: Product, as: 'product', attributes: ['id','name','sku','image_path'] }, { model: OrderDetail, as: 'detail' }] }] }
      ]
    });
    if (!shipment) return res.status(404).json({ success: false });
    res.json({ success: true, shipment: shipment.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
