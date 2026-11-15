const config = require('./config');
const sequelize = require('./db');
const { createApp } = require('./app');
const { seedDemoUsers } = require('./seed');

async function start() {
  // Creates tables if they do not exist yet. Versioned migrations are planned for Sprint 3.
  await sequelize.sync();
  if (config.seedDemoUsers) await seedDemoUsers();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`HelpDeskHQ running on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start HelpDeskHQ:', err);
  process.exit(1);
});
