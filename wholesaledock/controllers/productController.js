const { Product, Vendor, ProductVendor, Order } = require('../models');
const { Op, fn, col, literal } = require('sequelize');
const { generateBoxLabel } = require('../utils/labelGenerator');
const path = require('path');
const fs = require('fs');

exports.index = async (req, res) => {
  try {
    const { search, show_inactive } = req.query;
    const where = {};
    if (!show_inactive) where.is_active = true;
    if (search) where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { sku: { [Op.like]: `%${search}%` } }
    ];

    const products = await Product.findAll({
      where,
      include: [
        { model: ProductVendor, as: 'productVendors', attributes: ['rate_rmb'] },
        { model: Order, as: 'orders', where: { status: { [Op.in]: ['to_order','ordered','recd_china','loaded'] } }, required: false, attributes: ['status'], limit: 1, order: [['createdAt', 'DESC']] }
      ],
      order: [['name', 'ASC']]
    });

    // Add computed fields
    const enriched = products.map(p => {
      const data = p.toJSON();
      const prices = data.productVendors.map(pv => parseFloat(pv.rate_rmb)).filter(r => r > 0);
      data.lowest_price = prices.length ? Math.min(...prices) : null;
      data.current_status = data.orders?.[0]?.status || null;
      return data;
    });

    res.render('products/index', {
      title: 'Products',
      products: enriched,
      search: search || '',
      show_inactive: !!show_inactive,
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.render('products/index', { title: 'Products', products: [], search: '', show_inactive: false, user: req.user });
  }
};

exports.show = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [
        {
          model: ProductVendor,
          as: 'productVendors',
          include: [{ model: Vendor, as: 'vendor' }]
        }
      ]
    });
    if (!product) return res.redirect('/products');

    res.render('products/show', {
      title: product.name,
      product: product.toJSON(),
      user: req.user
    });
  } catch (err) {
    console.error(err);
    res.redirect('/products');
  }
};

exports.getCreate = (req, res) => {
  res.render('products/create', { title: 'Add Product', error: null, user: req.user });
};

exports.postCreate = async (req, res) => {
  try {
    const { name, sku } = req.body;
    if (!name || !sku) {
      return res.render('products/create', { title: 'Add Product', error: 'Name and SKU are required.', user: req.user });
    }

    const exists = await Product.findOne({ where: { sku } });
    if (exists) {
      return res.render('products/create', { title: 'Add Product', error: 'SKU already exists.', user: req.user });
    }

    const data = { name: name.trim(), sku: sku.trim().toUpperCase() };
    if (req.file) data.image_path = `/uploads/${req.file.filename}`;

    const product = await Product.create(data);
    res.redirect(`/products/${product.id}`);
  } catch (err) {
    console.error(err);
    res.render('products/create', { title: 'Add Product', error: 'Failed to create product.', user: req.user });
  }
};

exports.getEdit = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.redirect('/products');
    res.render('products/edit', { title: 'Edit Product', product: product.toJSON(), error: null, user: req.user });
  } catch (err) {
    res.redirect('/products');
  }
};

exports.postEdit = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);
    if (!product) return res.redirect('/products');

    const { name, sku, is_active } = req.body;
    const updates = { name: name.trim(), sku: sku.trim().toUpperCase(), is_active: is_active === 'on' || is_active === '1' || is_active === 'true' };

    if (req.file) {
      // Delete old image
      if (product.image_path) {
        const oldPath = path.join(__dirname, '..', 'uploads', path.basename(product.image_path));
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      updates.image_path = `/uploads/${req.file.filename}`;
    }

    await product.update(updates);
    res.redirect(`/products/${product.id}`);
  } catch (err) {
    console.error(err);
    const product = await Product.findByPk(req.params.id);
    res.render('products/edit', { title: 'Edit Product', product: product?.toJSON() || {}, error: 'Failed to update product.', user: req.user });
  }
};

exports.downloadLabel = async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id, {
      include: [{ model: ProductVendor, as: 'productVendors', attributes: ['ctn_qty'], limit: 1 }]
    });
    if (!product) return res.status(404).send('Product not found');

    const ctnQty = product.productVendors?.[0]?.ctn_qty || 'N/A';
    const labelPath = await generateBoxLabel(product.sku, product.name, ctnQty);

    // Update product with label path
    await product.update({ box_label_image_path: labelPath });

    const fullPath = path.join(__dirname, '..', labelPath);
    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Content-Disposition', `attachment; filename="${product.sku}_label.svg"`);
    res.sendFile(fullPath);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to generate label');
  }
};

// Vendor management on product
exports.addVendorToProduct = async (req, res) => {
  try {
    const { product_id } = req.params;
    const { vendor_id, new_vendor_name, new_vendor_contact, new_vendor_address, product_link, rate_rmb, ctn_l, ctn_b, ctn_h, ctn_qty, ctn_weight } = req.body;

    let finalVendorId = vendor_id;

    if (!vendor_id && new_vendor_name) {
      const vendor = await Vendor.create({
        name: new_vendor_name.trim(),
        contact_no: new_vendor_contact || null,
        address: new_vendor_address || null
      });
      finalVendorId = vendor.id;
    }

    if (!finalVendorId) return res.status(400).json({ success: false, message: 'Vendor is required' });

    const existing = await ProductVendor.findOne({ where: { product_id, vendor_id: finalVendorId } });
    if (existing) {
      await existing.update({ product_link, rate_rmb, ctn_l, ctn_b, ctn_h, ctn_qty, ctn_weight });
    } else {
      await ProductVendor.create({ product_id, vendor_id: finalVendorId, product_link, rate_rmb, ctn_l, ctn_b, ctn_h, ctn_qty, ctn_weight });
    }

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.removeVendorFromProduct = async (req, res) => {
  try {
    await ProductVendor.destroy({ where: { id: req.params.pvId } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.apiList = async (req, res) => {
  try {
    const { search } = req.query;
    const where = { is_active: true };
    if (search) where[Op.or] = [{ name: { [Op.like]: `%${search}%` } }, { sku: { [Op.like]: `%${search}%` } }];
    const products = await Product.findAll({ where, attributes: ['id','name','sku','image_path'], limit: 20 });
    res.json(products);
  } catch (err) {
    res.json([]);
  }
};
