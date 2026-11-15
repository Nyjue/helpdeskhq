const express = require('express');
const authService = require('../services/authService');
const { authenticate } = require('../middleware/auth');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// POST /api/auth/register  { name, email, password }
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  })
);

// POST /api/auth/login  { email, password }
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  })
);

// GET /api/auth/me  -> the logged-in user (used to restore a session on page load)
router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user.toPublic() });
});

module.exports = router;
