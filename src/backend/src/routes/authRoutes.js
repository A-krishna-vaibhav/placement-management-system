/**
 * Auth Routes
 * ───────────
 * POST /api/register        — T-09
 * POST /api/login           — T-10
 * GET  /api/verify-email    — T-12
 * POST /api/forgot-password — T-13
 * POST /api/reset-password  — T-13
 * GET  /api/me              — Authenticated user profile
 */

const express = require('express');
const router = express.Router();

const {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
} = require('../controllers/authController');

const { authenticate } = require('../middleware/auth');
const {
  registerValidation,
  forgotPasswordValidation,
} = require('../middleware/validators');

// Public routes
router.post('/register', registerValidation, register);
router.post('/login', login);
router.post('/forgot-password', forgotPasswordValidation, forgotPassword);
router.post('/reset-password', resetPassword);

// Protected routes (require valid Firebase ID token)
router.get('/verify-email', verifyEmail);
router.get('/me', authenticate, getProfile);

module.exports = router;
