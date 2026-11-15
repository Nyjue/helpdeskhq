// Creates the demo accounts. Public registration only makes requesters, so
// this is how technician and manager accounts come to exist.
//
//   npm run setup        creates the database tables and demo accounts
//
// Also called automatically on server start (unless SEED_DEMO_USERS=false).

const bcrypt = require('bcryptjs');
const config = require('./config');
const sequelize = require('./db');
const { User } = require('./models');

const DEMO_USERS = [
  { name: 'Taylor Technician', email: 'tech@helpdeskhq.dev', role: 'technician' },
  { name: 'Morgan Manager', email: 'manager@helpdeskhq.dev', role: 'manager' },
  { name: 'Riley Requester', email: 'requester@helpdeskhq.dev', role: 'requester' },
];

async function seedDemoUsers() {
  const passwordHash = await bcrypt.hash(config.demoPassword, config.bcryptRounds);
  for (const demo of DEMO_USERS) {
    await User.findOrCreate({
      where: { email: demo.email },
      defaults: { ...demo, passwordHash },
    });
  }
}

module.exports = { seedDemoUsers, DEMO_USERS };

if (require.main === module) {
  sequelize
    .sync()
    .then(seedDemoUsers)
    .then(() => {
      console.log('Database ready. Demo accounts created.');
      return sequelize.close();
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
