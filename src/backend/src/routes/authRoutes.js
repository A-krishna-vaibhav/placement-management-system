/**
 * Auth Routes
 * ───────────
 * POST /api/register          — register new user
 * POST /api/login             — step 1: verify password, issue OTP
 * POST /api/verify-login-otp  — step 2: verify OTP, return session
 * POST /api/forgot-password   — send password reset email
 * POST /api/reset-password    — placeholder (Firebase Client SDK handles actual reset)
 * GET  /api/verify-email      — sync email-verification status
 * GET  /api/me                — authenticated user profile
 */

const express = require('express');
const router = express.Router();

const {
  register,
  login,
  verifyLoginOTP,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
} = require('../controllers/authController');

const { authenticate } = require('../middleware/auth');
const {
  registerValidation,
  forgotPasswordValidation,
  otpValidation,
} = require('../middleware/validators');

// Public routes
router.post('/register',          registerValidation,          register);
router.post('/login',                                          login);
router.post('/verify-login-otp',  otpValidation,              verifyLoginOTP);
router.post('/forgot-password',   forgotPasswordValidation,   forgotPassword);
router.post('/reset-password',                                 resetPassword);

// Protected routes
router.get('/verify-email', verifyEmail);
router.get('/me', authenticate, getProfile);

module.exports = router;
