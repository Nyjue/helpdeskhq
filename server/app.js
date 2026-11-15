// Builds the Express app without starting a server, so tests can import it
// and call it directly with Supertest.
//
// Architecture (three tiers, each separated from the others):
//   routes/      HTTP layer: parse the request, call a service, send JSON
//   services/    business rules: validation, permissions, ordering
//   models/      data layer: Sequelize models and relationships
// Cross-cutting concerns (login check, role check, error format) are middleware.

const fs = require('fs');
const path = require('path');
const express = require('express');
const authRoutes = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const { errorHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();
  app.use(express.json({ limit: '100kb' }));

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'helpdeskhq' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/tickets', ticketRoutes);

  // Unknown API paths return JSON, not the React page.
  app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Not found.' });
  });

  // In production the React build is served by this same server,
  // so the whole app deploys as one service on one URL.
  const clientDist = path.join(__dirname, '..', 'client', 'dist');
  if (fs.existsSync(path.join(clientDist, 'index.html'))) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      return res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}

module.exports = { createApp };
