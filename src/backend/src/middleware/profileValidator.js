/**
 * Profile Update Validator
 * ─────────────────────────
 * express-validator rules for PATCH /api/profile.
 * Isolated module — does not touch any existing controller or route logic.
 *
 * Rules enforced (all fields optional on a PATCH):
 *
 *  rollNumber     — non-empty string, 2–20 chars, alphanumeric + hyphens only
 *  programme      — non-empty string, 2–120 chars
 *  joiningYear    — integer, 1980–currentYear
 *  graduationYear — integer, joiningYear–(currentYear+8), must be ≥ joiningYear
 *  cgpa           — decimal, 0.0–10.0, max 2 decimal places
 *  backlogs       — integer, 0–30
 *  phoneNumber    — exactly 10 digits (no country code, no spaces, no letters)
 *  skills         — array of strings OR comma-separated string; each skill 1–60 chars;
 *                   max 30 skills total; duplicate skill names rejected
 *  schoolId       — non-empty string
 *  departmentId   — non-empty string
 */

const { body }            = require('express-validator');
const { handleValidationErrors } = require('../utils/validationHelper');

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR     = 1980;
const MAX_GRAD_LAG = 8; // a PhD can span many years

/* ── helpers ── */
const isPresent = (val) => val !== undefined && val !== null && val !== '';

/**
 * Coerce CGPA: accept string like "8.5" → 8.5, reject "abc".
 */
const parseCgpa = (val) => {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(val);
  return Number.isNaN(n) ? null : n;
};

/* ─── Validation rule array ─────────────────────────────────────── */
const profileUpdateValidation = [

  /* ── rollNumber ── */
  body('rollNumber')
    .optional()
    .if((val) => isPresent(val))
    .trim()
    .isLength({ min: 2, max: 20 })
    .withMessage('Roll number must be between 2 and 20 characters.')
    .matches(/^[A-Za-z0-9\-\/]+$/)
    .withMessage('Roll number may only contain letters, digits, hyphens, or slashes.'),

  /* ── programme ── */
  body('programme')
    .optional()
    .if((val) => isPresent(val))
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage('Programme name must be between 2 and 120 characters.')
    .matches(/^[A-Za-z0-9\s\.\-\(\)\/]+$/)
    .withMessage('Programme name contains invalid characters.'),

  /* ── joiningYear ── */
  body('joiningYear')
    .optional()
    .if((val) => isPresent(val))
    .toInt()
    .isInt({ min: MIN_YEAR, max: CURRENT_YEAR })
    .withMessage(`Joining year must be between ${MIN_YEAR} and ${CURRENT_YEAR}.`),

  /* ── graduationYear ── */
  body('graduationYear')
    .optional()
    .if((val) => isPresent(val))
    .toInt()
    .isInt({ min: MIN_YEAR, max: CURRENT_YEAR + MAX_GRAD_LAG })
    .withMessage(`Graduation year must be between ${MIN_YEAR} and ${CURRENT_YEAR + MAX_GRAD_LAG}.`)
    .custom((gradYear, { req }) => {
      const joinYear = req.body.joiningYear
        ? parseInt(req.body.joiningYear, 10)
        : null;
      if (joinYear !== null && !Number.isNaN(joinYear) && gradYear < joinYear) {
        throw new Error('Graduation year cannot be before joining year.');
      }
      return true;
    }),

  /* ── cgpa ── */
  body('cgpa')
    .optional()
    .custom((val) => {
      if (val === null || val === undefined || val === '') return true; // allow clearing
      const n = parseCgpa(val);
      if (n === null) throw new Error('CGPA must be a number.');
      if (n < 0)   throw new Error('CGPA cannot be negative.');
      if (n > 10)  throw new Error('CGPA cannot exceed 10.0.');
      // Max 2 decimal places
      if (!/^\d+(\.\d{1,2})?$/.test(String(val).trim())) {
        throw new Error('CGPA may have at most 2 decimal places (e.g. 8.75).');
      }
      return true;
    }),

  /* ── backlogs ── */
  body('backlogs')
    .optional()
    .if((val) => isPresent(val))
    .toInt()
    .isInt({ min: 0, max: 30 })
    .withMessage('Backlogs must be a whole number between 0 and 30.'),

  /* ── phoneNumber ── */
  body('phoneNumber')
    .optional()
    .if((val) => isPresent(val))
    .trim()
    .custom((val) => {
      // Strip any accidental leading + or spaces before checking
      const stripped = val.replace(/\s/g, '');
      if (!/^\d{10}$/.test(stripped)) {
        throw new Error('Phone number must be exactly 10 digits with no letters, spaces, or country code.');
      }
      // Reject obviously invalid numbers: all same digit (e.g. 0000000000)
      if (/^(\d)\1{9}$/.test(stripped)) {
        throw new Error('Phone number is not valid (all identical digits).');
      }
      return true;
    }),

  /* ── skills ── */
  body('skills')
    .optional()
    .custom((val) => {
      // Accept array or comma-separated string
      let arr;
      if (Array.isArray(val)) {
        arr = val;
      } else if (typeof val === 'string') {
        arr = val.split(',').map((s) => s.trim()).filter(Boolean);
      } else if (val === null || val === undefined || val === '') {
        return true; // allow clearing
      } else {
        throw new Error('Skills must be an array or a comma-separated string.');
      }

      if (arr.length > 30) {
        throw new Error('You may list at most 30 skills.');
      }

      for (const skill of arr) {
        if (skill.length < 1 || skill.length > 60) {
          throw new Error(`Each skill must be between 1 and 60 characters (got: "${skill.substring(0, 20)}").`);
        }
        if (/[<>"'`;]/.test(skill)) {
          throw new Error(`Skill "${skill.substring(0, 20)}" contains invalid characters.`);
        }
      }

      // Reject duplicates (case-insensitive)
      const lower = arr.map((s) => s.toLowerCase());
      const unique = new Set(lower);
      if (unique.size !== lower.length) {
        throw new Error('Duplicate skills detected. Each skill must be listed only once.');
      }

      return true;
    }),

  /* ── schoolId ── */
  body('schoolId')
    .optional()
    .if((val) => isPresent(val))
    .trim()
    .notEmpty()
    .withMessage('School ID cannot be empty.')
    .isLength({ max: 100 })
    .withMessage('School ID is too long.'),

  /* ── departmentId ── */
  body('departmentId')
    .optional()
    .if((val) => isPresent(val))
    .trim()
    .notEmpty()
    .withMessage('Department ID cannot be empty.')
    .isLength({ max: 100 })
    .withMessage('Department ID is too long.'),
];

/**
 * Express middleware: run profileUpdateValidation rules,
 * then call handleValidationErrors. If errors, respond 400.
 * Otherwise call next().
 */
const validateProfileUpdate = [
  ...profileUpdateValidation,
  (req, res, next) => {
    const failed = handleValidationErrors(req, res);
    if (failed) return; // 400 already sent
    next();
  },
];

module.exports = { validateProfileUpdate };
