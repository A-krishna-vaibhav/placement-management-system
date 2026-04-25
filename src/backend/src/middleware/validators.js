/**
 * Validation Middleware
 * ────────────────────
 * express-validator rule sets for each endpoint.
 */

const { body, query, param } = require('express-validator');
const {
  ROLES,
  SELF_REGISTRABLE_ROLES,
  PASSWORD_POLICY,
  UNIVERSITY_EMAIL_DOMAIN,
  ACCOUNT_STATUS,
} = require('../config/constants');

/* ──────────────── Registration ──────────────── */

const registerValidation = [
  body('fullName').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 chars.'),

  body('email')
    .isEmail().withMessage('Invalid email format.')
    .normalizeEmail()
    .custom((email, { req }) => {
      // Student must use exactly @uohyd.ac.in (not subdomains)
      if (req.body.role === ROLES.STUDENT) {
        const domain = email.split('@')[1];
        if (domain !== UNIVERSITY_EMAIL_DOMAIN) {
          throw new Error(`Students must register with a @${UNIVERSITY_EMAIL_DOMAIN} email.`);
        }
      }
      return true;
    }),

  body('password')
    .matches(PASSWORD_POLICY.REGEX)
    .withMessage(`Password must be ${PASSWORD_POLICY.DESCRIPTION}.`),

  body('role')
    .isIn(SELF_REGISTRABLE_ROLES)
    .withMessage('Only Students and Companies can self-register.'),

  // Student-specific fields
  body('schoolId').if(body('role').equals(ROLES.STUDENT))
    .notEmpty().withMessage('School is required for students.'),

  body('departmentId').if(body('role').equals(ROLES.STUDENT))
    .notEmpty().withMessage('Department is required for students.'),
];

/* ──────────────── Forgot Password ──────────────── */

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Invalid email format.').normalizeEmail(),
];

/* ──────────────── OTP verification ──────────────── */

const otpValidation = [
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits.'),
];

/* ──────────────── Admin: update role ──────────────── */

const updateRoleValidation = [
  param('id').notEmpty().withMessage('User ID is required.'),
  body('role')
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}.`),
];

/* ──────────────── Admin: update status ──────────────── */

const updateStatusValidation = [
  param('id').notEmpty().withMessage('User ID is required.'),
  body('status')
    .isIn(Object.values(ACCOUNT_STATUS))
    .withMessage(`Status must be one of: ${Object.values(ACCOUNT_STATUS).join(', ')}.`),
];

/* ──────────────── Admin: list users query ──────────────── */

const listUsersValidation = [
  query('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role filter must be one of: ${Object.values(ROLES).join(', ')}.`),
  query('status')
    .optional()
    .isIn(Object.values(ACCOUNT_STATUS))
    .withMessage(`Status filter must be one of: ${Object.values(ACCOUNT_STATUS).join(', ')}.`),
];

module.exports = {
  registerValidation,
  forgotPasswordValidation,
  otpValidation,
  updateRoleValidation,
  updateStatusValidation,
  listUsersValidation,
};
