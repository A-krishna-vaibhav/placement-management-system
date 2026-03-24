/**
 * Validation Helper
 * ─────────────────
 * Processes express-validator results and returns
 * a 400 response if there are errors.
 */

const { validationResult } = require('express-validator');

const handleValidationErrors = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed.',
      errors: errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
      })),
    });
  }
  return null; // no errors
};

module.exports = { handleValidationErrors };
