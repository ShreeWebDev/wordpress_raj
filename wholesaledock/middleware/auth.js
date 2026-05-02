const jwt = require('jsonwebtoken');
const { User } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const token = req.cookies?.token || req.session?.token;
    if (!token) return res.redirect('/auth/login');

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: ['id', 'name', 'contact_no', 'role', 'is_active']
    });

    if (!user || !user.is_active) {
      res.clearCookie('token');
      req.session.destroy();
      return res.redirect('/auth/login');
    }

    req.user = user;
    res.locals.user = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    return res.redirect('/auth/login');
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.redirect('/auth/login');
  if (!roles.includes(req.user.role)) {
    return res.status(403).render('error', { title: 'Access Denied', message: 'You do not have permission to access this page.', user: req.user });
  }
  next();
};

const requireAdmin = requireRole('admin');
const requireAdminOrAgent = requireRole('admin', 'agent');

module.exports = { authenticate, requireRole, requireAdmin, requireAdminOrAgent };
