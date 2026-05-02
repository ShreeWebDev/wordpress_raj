require('dotenv').config();
const { sequelize, User } = require('../models');

async function seed() {
  try {
    await sequelize.sync({ alter: true });

    const existing = await User.findOne({ where: { contact_no: 'ad9min' } });
    if (!existing) {
      await User.create({
        name: 'Administrator',
        contact_no: 'ad9min',
        password: 'Sameerl42$',
        role: 'admin',
        is_active: true
      });
      console.log('Admin user created: ad9min');
    } else {
      console.log('Admin user already exists.');
    }

    console.log('Seed completed.');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();
