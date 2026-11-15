const { DataTypes } = require('sequelize');
const sequelize = require('../db');
const { ROLES } = require('../constants');

const User = sequelize.define('User', {
  name: { type: DataTypes.STRING(100), allowNull: false },
  email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  role: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'requester',
    validate: { isIn: [ROLES] },
  },
});

// Never send the password hash to the browser.
User.prototype.toPublic = function toPublic() {
  return { id: this.id, name: this.name, email: this.email, role: this.role };
};

module.exports = User;
