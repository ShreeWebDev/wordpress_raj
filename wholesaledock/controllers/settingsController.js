const { User } = require('../models');

exports.index = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: ['id','name','contact_no','role','is_active'], order: [['name','ASC']] });
    const error = req.query.error ? decodeURIComponent(req.query.error) : null;
    const success = req.query.success ? decodeURIComponent(req.query.success) : null;
    res.render('settings/index', { title: 'Settings', users: users.map(u => u.toJSON()), user: req.user, error, success });
  } catch (err) {
    const error = req.query.error ? decodeURIComponent(req.query.error) : 'Failed to load users.';
    res.render('settings/index', { title: 'Settings', users: [], user: req.user, error, success: null });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, contact_no, password, role } = req.body;
    if (!name || !contact_no || !password || !role) {
      const users = await User.findAll({ attributes: ['id','name','contact_no','role','is_active'] });
      return res.render('settings/index', { title: 'Settings', users: users.map(u => u.toJSON()), user: req.user, error: 'All fields are required.', success: null });
    }
    const exists = await User.findOne({ where: { contact_no } });
    if (exists) {
      const users = await User.findAll({ attributes: ['id','name','contact_no','role','is_active'] });
      return res.render('settings/index', { title: 'Settings', users: users.map(u => u.toJSON()), user: req.user, error: 'Contact number already in use.', success: null });
    }
    await User.create({ name, contact_no, password, role, is_active: true });
    res.redirect('/settings?success=User+created+successfully');
  } catch (err) {
    res.redirect('/settings?error=Failed+to+create+user');
  }
};

exports.updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const { name, contact_no, password, role, is_active } = req.body;
    const updates = { name, contact_no, role, is_active: is_active === 'true' || is_active === true };
    if (password) updates.password = password;
    await user.update(updates);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    if (req.params.id == req.user.id) return res.status(400).json({ success: false, message: 'Cannot delete your own account.' });
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    await user.update({ is_active: false });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
