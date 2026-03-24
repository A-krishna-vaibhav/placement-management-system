/**
 * Admin Routes
 * ────────────
 * GET    /api/admin/users             — T-19
 * PATCH  /api/admin/users/:id/role    — T-20
 * PATCH  /api/admin/users/:id/status  — T-21
 * DELETE /api/admin/users/:id         — Delete user
 *
 * All routes require authentication + Admin role.
 */

const express = require('express');
const router = express.Router();

const {
  listUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
} = require('../controllers/adminController');

const { authenticate } = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const {
  listUsersValidation,
  updateRoleValidation,
  updateStatusValidation,
} = require('../middleware/validators');

// All admin routes are protected
router.use(authenticate);
router.use(authorize('Admin'));

router.get('/users', listUsersValidation, listUsers);
router.patch('/users/:id/role', updateRoleValidation, updateUserRole);
router.patch('/users/:id/status', updateStatusValidation, updateUserStatus);
router.delete('/users/:id', deleteUser);

module.exports = router;
