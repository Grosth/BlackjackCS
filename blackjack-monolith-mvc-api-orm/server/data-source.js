require('dotenv').config();
require('reflect-metadata');
const path = require('path');
const { DataSource } = require('typeorm');

const isMssql = process.env.DB_TYPE === 'mssql';

const common = {
  entities: [path.join(__dirname, 'entity', '*.{js,ts}')],
  synchronize: true, // for demo; use migrations in prod
  logging: false,
};

let options;
if (isMssql) {
  options = {
    type: 'mssql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '1433', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE || 'blackjack',
    options: {
      encrypt: process.env.DB_ENCRYPT !== 'false',
      trustServerCertificate: false,
    },
    extra: {
      // tedious options
      enableArithAbort: true,
    },
    ...common,
  };
} else {
  options = {
    type: 'sqlite',
    database: path.join(__dirname, 'data', 'app.db'),
    ...common,
  };
}

const AppDataSource = new DataSource(options);
module.exports = { AppDataSource };
