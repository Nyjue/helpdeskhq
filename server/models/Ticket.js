const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const { CATEGORIES, PRIORITIES, STATUSES } = require('../constants');

const Ticket = sequelize.define('Ticket', {
  title: { type: DataTypes.STRING(120), allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isIn: [CATEGORIES] },
  },
  priority: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Medium',
    validate: { isIn: [PRIORITIES] },
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Open',
    validate: { isIn: [STATUSES] },
  },
});

module.exports = Ticket;
