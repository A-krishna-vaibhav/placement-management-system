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
  listPendingCompanies,
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

// Company listing — Admin or TPO
router.get('/companies/pending',
  authenticate, authorize(ROLES.ADMIN, ROLES.TPO),
  listPendingCompanies);

// Company approval — Admin or TPO
router.patch('/companies/:companyId/approve',
  authenticate, authorize(ROLES.ADMIN, ROLES.TPO),
  approveCompany);

router.patch('/companies/:companyId/reject',
  authenticate, authorize(ROLES.ADMIN, ROLES.TPO),
  rejectCompany);

module.exports = router;
