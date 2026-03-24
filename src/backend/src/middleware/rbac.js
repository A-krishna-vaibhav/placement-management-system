/**
 * Role-Based Access Control (RBAC) Middleware
 * ────────────────────────────────────────────
 * Factory function that returns middleware restricting
 * access to the specified roles.
 *
 * Usage:  router.get('/admin-only', authenticate, authorize('Admin'), handler)
 */

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role(s): ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
      });
    }

    next();
  };
};

module.exports = { authorize };
