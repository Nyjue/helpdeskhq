// Middleware chain pattern: every protected route runs
//   authenticate  ->  requireRole(...)  ->  route handler
// so login and permission checks live in exactly one place.

const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { HttpError } = require('../errors');

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) {
      throw new HttpError(401, 'Please log in to continue.');
    }

    let payload;
    try {
      payload = jwt.verify(token, config.jwtSecret);
    } catch (err) {
      throw new HttpError(401, 'Your session has expired. Please log in again.');
    }

    // Load the user fresh so a changed role or deleted account takes effect immediately.
    const user = await User.findByPk(payload.sub);
    if (!user) throw new HttpError(401, 'Please log in to continue.');

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new HttpError(403, 'You do not have permission to do that.'));
    }
    return next();
  };
}

module.exports = { authenticate, requireRole };
