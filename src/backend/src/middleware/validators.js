/**
 * Validation Middleware
 * ────────────────────
 * express-validator rule sets for each endpoint.
 */

const { body, query, param } = require('express-validator');
const { ROLES, UNIVERSITY_ROLES, UNIVERSITY_EMAIL_DOMAIN } = require('../config/constants');

/**
 * Helper: returns true if the role requires a university email domain.
 */
const requiresUniversityEmail = (role) => UNIVERSITY_ROLES.includes(role);

/* ──────────────── Registration ──────────────── */

const registerValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters.'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters.')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter.')
    .matches(/[0-9]/).withMessage('Password must contain at least one number.')
    .matches(/[^A-Za-z0-9]/).withMessage('Password must contain at least one special character.'),

  body('department')
    .trim()
    .notEmpty().withMessage('Department is required.'),

  body('role')
    .trim()
    .notEmpty().withMessage('Role is required.')
    .isIn(Object.values(ROLES).filter(r => r !== ROLES.ADMIN))
    .withMessage(`Role must be one of: ${Object.values(ROLES).filter(r => r !== ROLES.ADMIN).join(', ')}.`),

  // Custom: university email enforcement
  body('email').custom((email, { req }) => {
    const role = req.body.role;
    if (requiresUniversityEmail(role)) {
      const domain = email.split('@')[1];
      if (domain !== UNIVERSITY_EMAIL_DOMAIN) {
        throw new Error(
          `Students and staff must register with their university email (@${UNIVERSITY_EMAIL_DOMAIN}).`
        );
      }
    }
    return true;
  }),
];

/* ──────────────── Login (optional body validation) ──────────────── */

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required.'),
];

/* ──────────────── Admin: update role ──────────────── */

const updateRoleValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required.'),

  body('role')
    .trim()
    .notEmpty().withMessage('Role is required.')
    .isIn(Object.values(ROLES))
    .withMessage(`Role must be one of: ${Object.values(ROLES).join(', ')}.`),
];

/* ──────────────── Admin: update status ──────────────── */

const updateStatusValidation = [
  param('id')
    .notEmpty().withMessage('User ID is required.'),

  body('status')
    .trim()
    .notEmpty().withMessage('Status is required.')
    .isIn(['Active', 'Inactive', 'Deactivated'])
    .withMessage('Status must be one of: Active, Inactive, Deactivated.'),
];

/* ──────────────── Admin: list users query ──────────────── */

const listUsersValidation = [
  query('role')
    .optional()
    .isIn(Object.values(ROLES))
    .withMessage(`Role filter must be one of: ${Object.values(ROLES).join(', ')}.`),

  query('status')
    .optional()
    .isIn(['Active', 'Inactive', 'Deactivated'])
    .withMessage('Status filter must be one of: Active, Inactive, Deactivated.'),
];

/* ──────────────── Forgot Password ──────────────── */

const forgotPasswordValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required.')
    .isEmail().withMessage('Must be a valid email address.')
    .normalizeEmail(),
];

module.exports = {
  registerValidation,
  loginValidation,
  updateRoleValidation,
  updateStatusValidation,
  listUsersValidation,
  forgotPasswordValidation,
};
