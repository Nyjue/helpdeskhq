// Central configuration. Everything that changes between laptop, test run,
// and production comes from environment variables so no secrets live in code.

const path = require('path');

const isProd = process.env.NODE_ENV === 'production';
const isTest = process.env.NODE_ENV === 'test';

let jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  if (isProd) {
    // Refuse to boot with a guessable secret on a public server.
    throw new Error('JWT_SECRET must be set when NODE_ENV=production');
  }
  jwtSecret = isTest ? 'test-secret' : 'dev-only-secret-change-me';
}

module.exports = {
  isProd,
  isTest,
  port: Number(process.env.PORT) || 3000,
  jwtSecret,
  jwtExpiresIn: '8h',
  // bcrypt cost: low in tests so the suite stays fast, standard otherwise.
  bcryptRounds: isTest ? 4 : 10,
  dbStorage:
    process.env.DB_STORAGE || path.join(__dirname, '..', 'data', 'helpdeskhq.sqlite'),
  // Demo technician/manager/requester accounts so the app is usable right after deploy.
  seedDemoUsers: process.env.SEED_DEMO_USERS !== 'false',
  demoPassword: process.env.DEMO_PASSWORD || 'HelpDesk123!',
};
