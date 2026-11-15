// Service layer: business rules for accounts. Route handlers stay thin and
// call these functions, which makes the rules easy to unit test on their own.

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const { User } = require('../models');
const { HttpError } = require('../errors');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Pure function: returns { errors, value } and never touches the database.
function validateRegistration(input = {}) {
  const errors = {};
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';

  if (!name) errors.name = 'Name is required.';
  else if (name.length > 100) errors.name = 'Name must be 100 characters or fewer.';

  if (!email) errors.email = 'Email is required.';
  else if (!EMAIL_PATTERN.test(email)) errors.email = 'Enter a valid email address.';

  if (!password) errors.password = 'Password is required.';
  else if (password.length < 8) errors.password = 'Password must be at least 8 characters.';

  return { errors, value: { name, email, password } };
}

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

async function register(input) {
  const { errors, value } = validateRegistration(input);
  if (Object.keys(errors).length > 0) {
    throw new HttpError(400, 'Please fix the highlighted fields.', errors);
  }

  const existing = await User.findOne({ where: { email: value.email } });
  if (existing) {
    throw new HttpError(409, 'An account with that email already exists.', {
      email: 'An account with that email already exists.',
    });
  }

  const passwordHash = await bcrypt.hash(value.password, config.bcryptRounds);
  // Security: public registration can only ever create a requester.
  // Technician and manager accounts are created by an admin (see seed.js).
  const user = await User.create({
    name: value.name,
    email: value.email,
    passwordHash,
    role: 'requester',
  });

  return { token: signToken(user), user: user.toPublic() };
}

async function login(input = {}) {
  const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : '';
  const password = typeof input.password === 'string' ? input.password : '';

  const user = email ? await User.findOne({ where: { email } }) : null;
  const ok = user ? await bcrypt.compare(password, user.passwordHash) : false;

  // Same message for "no such email" and "wrong password" so the response does
  // not reveal which emails have accounts.
  if (!ok) throw new HttpError(401, 'Invalid email or password.');

  return { token: signToken(user), user: user.toPublic() };
}

module.exports = { validateRegistration, register, login, signToken };
