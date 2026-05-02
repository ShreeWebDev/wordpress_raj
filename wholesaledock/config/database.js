require('dotenv').config();
const { Sequelize } = require('sequelize');

const logging = process.env.NODE_ENV === 'development' ? console.log : false;
const define = { timestamps: true, underscored: false };

const dialect = (process.env.DB_DIALECT || '').toLowerCase();
const usePostgres = dialect === 'postgres' || !!process.env.DATABASE_URL;

const baseOptions = {
  logging,
  pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  define
};

const sequelize = usePostgres
  ? new Sequelize(process.env.DATABASE_URL, {
    ...baseOptions,
    dialect: 'postgres',
    dialectOptions: process.env.DB_SSL === 'false' ? {} : { ssl: { require: true, rejectUnauthorized: false } }
  })
  : new Sequelize(
    process.env.DB_NAME || 'wholesaledock',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      ...baseOptions,
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      dialect: 'mysql'
    }
  );

module.exports = sequelize;
