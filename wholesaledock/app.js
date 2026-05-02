require('dotenv').config();
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const methodOverride = require('method-override');

const { sequelize, User } = require('./models');
const { errorHandler, notFound } = require('./middleware/error');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static(path.join(__dirname, 'public')));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(methodOverride('_method'));

// Logging
if (process.env.NODE_ENV !== 'production') app.use(morgan('dev'));

// Session store
const sessionStore = new SequelizeStore({ db: sequelize, checkExpirationInterval: 15 * 60 * 1000, expiration: 7 * 24 * 60 * 60 * 1000 });
app.use(session({
  secret: process.env.SESSION_SECRET || 'wholesaledock-secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  }
}));

// Routes
app.get('/', (req, res) => res.redirect('/dashboard'));
app.use('/auth', require('./routes/auth'));
app.use('/dashboard', require('./routes/dashboard'));
app.use('/products', require('./routes/products'));
app.use('/vendors', require('./routes/vendors'));
app.use('/orders', require('./routes/orders'));
app.use('/settings', require('./routes/settings'));

// 404 & Error handling
app.use(notFound);
app.use(errorHandler);

// Start server
async function start() {
  try {
    await sequelize.authenticate();
    console.log('Database connected.');
    await sequelize.sync({ alter: process.env.NODE_ENV !== 'production' });

    // Ensure admin user exists
    const adminExists = await User.findOne({ where: { contact_no: 'ad9min' } });
    if (!adminExists) {
      const bcrypt = require('bcryptjs');
      await User.create({
        name: 'Administrator',
        contact_no: 'ad9min',
        password: 'Sameerl42$',
        role: 'admin',
        is_active: true
      });
      console.log('Default admin user created.');
    }

    sessionStore.sync();
    app.listen(PORT, () => console.log(`Wholesaledock running on port ${PORT}`));
  } catch (err) {
    console.error('Startup error:', err);
    process.exit(1);
  }
}

start();
