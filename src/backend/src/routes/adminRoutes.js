/**
 * Admin Routes
 * ────────────
 * GET    /api/admin/users                       — list users (filterable)
 * PATCH  /api/admin/users/:id/role              — update user role
 * PATCH  /api/admin/users/:id/status            — update user status
 * DELETE /api/admin/users/:id                   — delete user
 * POST   /api/admin/users/faculty               — provision Faculty (Admin only)
 * POST   /api/admin/users/tpo                   — provision TPO (Admin only)
 * PATCH  /api/admin/companies/:companyId/approve — approve company (Admin or TPO)
 * PATCH  /api/admin/companies/:companyId/reject  — reject company (Admin or TPO)
 */

const express = require('express');
const router = express.Router();

const {
  listUsers,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  provisionFaculty,
  provisionTPO,
  approveCompany,
  rejectCompany,
} = require('../controllers/adminController');

const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  listUsersValidation,
  updateRoleValidation,
  updateStatusValidation,
} = require('../middleware/validators');

// User management — Admin only
router.get('/users',
  authenticate, authorize(ROLES.ADMIN),
  listUsersValidation, listUsers);

router.patch('/users/:id/role',
  authenticate, authorize(ROLES.ADMIN),
  updateRoleValidation, updateUserRole);

router.patch('/users/:id/status',
  authenticate, authorize(ROLES.ADMIN),
  updateStatusValidation, updateUserStatus);

router.delete('/users/:id',
  authenticate, authorize(ROLES.ADMIN),
  deleteUser);

// Provisioning — Admin only
router.post('/users/faculty',
  authenticate, authorize(ROLES.ADMIN),
  provisionFaculty);

router.post('/users/tpo',
  authenticate, authorize(ROLES.ADMIN),
  provisionTPO);

// Company approval — Admin or TPO
router.patch('/companies/:companyId/approve',
  authenticate, authorize(ROLES.ADMIN, ROLES.TPO),
  approveCompany);

router.patch('/companies/:companyId/reject',
  authenticate, authorize(ROLES.ADMIN, ROLES.TPO),
  rejectCompany);

module.exports = router;
