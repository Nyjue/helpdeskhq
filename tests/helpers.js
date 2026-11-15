const bcrypt = require('bcryptjs');
const { User } = require('../server/models');
const { signToken } = require('../server/services/authService');

// Creates a user directly in the database (the only way to get a technician
// or manager, since public registration only makes requesters).
async function createUser({ name = 'Test User', email, role = 'requester', password = 'password123' }) {
  const passwordHash = await bcrypt.hash(password, 4);
  const user = await User.create({ name, email, role, passwordHash });
  return { user, token: signToken(user), password };
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

const validTicket = (overrides = {}) => ({
  title: 'Laptop will not turn on',
  description: 'The laptop shows a black screen after I press the power button.',
  category: 'Hardware',
  priority: 'High',
  ...overrides,
});

module.exports = { createUser, auth, validTicket };
