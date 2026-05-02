const { Vendor, Product, ProductVendor } = require('../models');
const { Op } = require('sequelize');

exports.index = async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search) where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { contact_no: { [Op.like]: `%${search}%` } }
    ];
    const vendors = await Vendor.findAll({ where, order: [['name', 'ASC']] });
    res.render('vendors/index', { title: 'Vendors', vendors: vendors.map(v => v.toJSON()), search: search || '', user: req.user });
  } catch (err) {
    res.render('vendors/index', { title: 'Vendors', vendors: [], search: '', user: req.user });
  }
};

exports.show = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id, {
      include: [{ model: ProductVendor, as: 'productVendors', include: [{ model: Product, as: 'product' }] }]
    });
    if (!vendor) return res.redirect('/vendors');
    res.render('vendors/show', { title: vendor.name, vendor: vendor.toJSON(), user: req.user });
  } catch (err) {
    res.redirect('/vendors');
  }
};

exports.getCreate = (req, res) => {
  res.render('vendors/create', { title: 'Add Vendor', error: null, user: req.user });
};

exports.postCreate = async (req, res) => {
  try {
    const { name, contact_no, address } = req.body;
    if (!name) return res.render('vendors/create', { title: 'Add Vendor', error: 'Name is required.', user: req.user });
    const vendor = await Vendor.create({ name: name.trim(), contact_no: contact_no || null, address: address || null });
    res.redirect(`/vendors/${vendor.id}`);
  } catch (err) {
    res.render('vendors/create', { title: 'Add Vendor', error: 'Failed to create vendor.', user: req.user });
  }
};

exports.getEdit = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.redirect('/vendors');
    res.render('vendors/edit', { title: 'Edit Vendor', vendor: vendor.toJSON(), error: null, user: req.user });
  } catch (err) {
    res.redirect('/vendors');
  }
};

exports.postEdit = async (req, res) => {
  try {
    const vendor = await Vendor.findByPk(req.params.id);
    if (!vendor) return res.redirect('/vendors');
    const { name, contact_no, address } = req.body;
    await vendor.update({ name: name.trim(), contact_no: contact_no || null, address: address || null });
    res.redirect(`/vendors/${vendor.id}`);
  } catch (err) {
    const vendor = await Vendor.findByPk(req.params.id);
    res.render('vendors/edit', { title: 'Edit Vendor', vendor: vendor?.toJSON() || {}, error: 'Update failed.', user: req.user });
  }
};

exports.apiList = async (req, res) => {
  try {
    const { search } = req.query;
    const where = {};
    if (search) where.name = { [Op.like]: `%${search}%` };
    const vendors = await Vendor.findAll({ where, attributes: ['id','name','contact_no'], limit: 20 });
    res.json(vendors);
  } catch (err) {
    res.json([]);
  }
};
