const jwt = require('jsonwebtoken');
const { User } = require('../models');

exports.getLogin = (req, res) => {
  if (req.cookies?.token) return res.redirect('/dashboard');
  res.render('auth/login', { title: 'Login', error: null });
};

exports.postLogin = async (req, res) => {
  try {
    const { contact_no, password } = req.body;

    if (!contact_no || !password) {
      return res.render('auth/login', { title: 'Login', error: 'Please enter your credentials.' });
    }

    const user = await User.findOne({ where: { contact_no } });
    if (!user || !user.is_active) {
      return res.render('auth/login', { title: 'Login', error: 'Invalid credentials.' });
    }

    const valid = await user.validatePassword(password);
    if (!valid) {
      return res.render('auth/login', { title: 'Login', error: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store token in httpOnly cookie AND session
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    req.session.token = token;
    req.session.userId = user.id;

    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    res.render('auth/login', { title: 'Login', error: 'An error occurred. Please try again.' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  req.session.destroy(() => {
    res.redirect('/auth/login');
  });
};

exports.getProfile = async (req, res) => {
  res.render('auth/profile', { title: 'Edit Profile', user: req.user, error: null, success: null });
};

exports.postProfile = async (req, res) => {
  try {
    const { name, current_password, new_password } = req.body;
    const user = await User.findByPk(req.user.id);

    if (!user) return res.redirect('/auth/login');

    const updates = {};
    if (name && name.trim()) updates.name = name.trim();

    if (new_password) {
      if (!current_password) {
        return res.render('auth/profile', { title: 'Edit Profile', user: req.user, error: 'Current password required.', success: null });
      }
      const valid = await user.validatePassword(current_password);
      if (!valid) {
        return res.render('auth/profile', { title: 'Edit Profile', user: req.user, error: 'Current password incorrect.', success: null });
      }
      updates.password = new_password;
    }

    await user.update(updates);
    res.render('auth/profile', { title: 'Edit Profile', user: req.user, error: null, success: 'Profile updated successfully.' });
  } catch (err) {
    console.error(err);
    res.render('auth/profile', { title: 'Edit Profile', user: req.user, error: 'Update failed.', success: null });
  }
};
