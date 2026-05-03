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
  // fullName: trim, 2-100 chars, no digits-only, no script injection chars
  body('fullName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Full name must be between 2 and 100 characters.')
    .matches(/^[A-Za-z\s\.\-']+$/)
    .withMessage('Full name may only contain letters, spaces, hyphens, apostrophes, or periods.')
    .custom((val) => {
      if (/^\s*$/.test(val)) throw new Error('Full name cannot be blank or whitespace only.');
      return true;
    }),

  body('email')
    .isEmail().withMessage('Invalid email address format.')
    .normalizeEmail()
    .custom((email, { req }) => {
      // Student must use exactly @uohyd.ac.in (not subdomains like foo.uohyd.ac.in)
      if (req.body.role === ROLES.STUDENT) {
        const domain = email.split('@')[1];
        if (domain !== UNIVERSITY_EMAIL_DOMAIN) {
          throw new Error(`Students must register with a @${UNIVERSITY_EMAIL_DOMAIN} email address.`);
        }
      }
      return true;
    }),

  // Password: min 6 chars, at least one letter and one digit for basic strength
  body('password')
    .matches(PASSWORD_POLICY.REGEX)
    .withMessage(`Password must be ${PASSWORD_POLICY.DESCRIPTION}.`)
    .custom((val) => {
      if (/^\s+$/.test(val)) throw new Error('Password cannot be whitespace only.');
      return true;
    }),

  body('role')
    .isIn(SELF_REGISTRABLE_ROLES)
    .withMessage('Only Students and Companies can self-register.'),

  // Student-specific required fields
  body('schoolId')
    .if(body('role').equals(ROLES.STUDENT))
    .trim()
    .notEmpty()
    .withMessage('School is required for student registration.')
    .isLength({ max: 100 })
    .withMessage('School ID is too long.'),

  body('departmentId')
    .if(body('role').equals(ROLES.STUDENT))
    .trim()
    .notEmpty()
    .withMessage('Department is required for student registration.')
    .isLength({ max: 100 })
    .withMessage('Department ID is too long.'),

  // Company-specific fields
  body('companyName')
    .if(body('role').equals(ROLES.COMPANY))
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Company name must be between 2 and 150 characters.'),

  body('website')
    .optional({ checkFalsy: true })
    .if(body('role').equals(ROLES.COMPANY))
    .trim()
    .isURL({ require_protocol: true, protocols: ['http', 'https'] })
    .withMessage('Company website must be a valid URL starting with http:// or https://.'),
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
