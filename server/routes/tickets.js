const express = require('express');
const ticketService = require('../services/ticketService');
const { authenticate, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Every ticket route requires a logged-in user.
router.use(authenticate);

// POST /api/tickets  { title, description, category, priority }
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const ticket = await ticketService.createTicket(req.user, req.body);
    res.status(201).json({ ticket });
  })
);

// GET /api/tickets/mine  -> the logged-in user's own tickets, newest first
router.get(
  '/mine',
  asyncHandler(async (req, res) => {
    const tickets = await ticketService.listMyTickets(req.user);
    res.json({ tickets });
  })
);

// GET /api/tickets/queue  -> unresolved tickets for staff, most urgent first
// Declared before '/:id' so "queue" is not mistaken for a ticket id.
router.get(
  '/queue',
  requireRole('technician', 'manager'),
  asyncHandler(async (req, res) => {
    const tickets = await ticketService.getQueue();
    res.json({ tickets });
  })
);

// GET /api/tickets/:id  -> one ticket (owner or staff only)
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const ticket = await ticketService.getTicketForUser(req.user, req.params.id);
    res.json({ ticket });
  })
);

module.exports = router;
