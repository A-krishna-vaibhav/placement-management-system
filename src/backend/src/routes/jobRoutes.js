const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  createJob, listJobs, getJob,
  approveJob, rejectJob, closeJob, withdrawJob,
} = require('../controllers/jobController');
const { applyToJob, listApplicationsForJob, updateApplicationStatus } = require('../controllers/applicationController');

const router = express.Router();

router.post('/',                     authenticate, authorize(ROLES.COMPANY), createJob);
router.get('/',                      authenticate, listJobs);
router.get('/:id',                   authenticate, getJob);
router.patch('/:id/approve',         authenticate, authorize(ROLES.TPO, ROLES.ADMIN), approveJob);
router.patch('/:id/reject',          authenticate, authorize(ROLES.TPO, ROLES.ADMIN), rejectJob);
router.patch('/:id/close',           authenticate, authorize(ROLES.TPO, ROLES.ADMIN), closeJob);
router.patch('/:id/withdraw',        authenticate, authorize(ROLES.COMPANY), withdrawJob);

// Applications sub-resource
router.post('/:id/apply',          authenticate, authorize(ROLES.STUDENT), applyToJob);
router.get('/:id/applications',      authenticate, authorize(ROLES.COMPANY, ROLES.TPO, ROLES.ADMIN, ROLES.FACULTY), listApplicationsForJob);
router.patch('/:jobId/applications/:appId/status', authenticate, authorize(ROLES.COMPANY, ROLES.TPO, ROLES.ADMIN), updateApplicationStatus);

module.exports = router;
