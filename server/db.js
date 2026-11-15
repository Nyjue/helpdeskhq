// Data layer entry point. All database access goes through this Sequelize
// instance, so moving from SQLite to PostgreSQL later only changes this file.

const fs = require('fs');
const path = require('path');
const { Sequelize } = require('sequelize');
const config = require('./config');

if (config.dbStorage !== ':memory:') {
  fs.mkdirSync(path.dirname(config.dbStorage), { recursive: true });
}

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: config.dbStorage,
  logging: false,
});

module.exports = sequelize;
