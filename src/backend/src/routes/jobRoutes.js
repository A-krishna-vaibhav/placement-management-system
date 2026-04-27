const express = require('express');
const multer  = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are allowed.'));
  },
});
const {
  createJob, listJobs, getJob,
  approveJob, rejectJob, closeJob, withdrawJob,
  assignJobToSchools, facultyApproveJob, facultyRejectJob, getSuggestedSchools,
} = require('../controllers/jobController');
const {
  applyToJob, listApplicationsForJob, updateApplicationStatus, getApplicationResume,
} = require('../controllers/applicationController');

const router = express.Router();

router.post('/',                     authenticate, authorize(ROLES.COMPANY), createJob);
router.get('/',                      authenticate, listJobs);
router.get('/:id',                   authenticate, getJob);
router.patch('/:id/approve',         authenticate, authorize(ROLES.TPO, ROLES.ADMIN), approveJob);
router.patch('/:id/reject',          authenticate, authorize(ROLES.TPO, ROLES.ADMIN), rejectJob);
router.patch('/:id/close',           authenticate, authorize(ROLES.TPO, ROLES.ADMIN), closeJob);
router.patch('/:id/withdraw',        authenticate, authorize(ROLES.COMPANY), withdrawJob);
router.patch('/:id/assign',          authenticate, authorize(ROLES.TPO, ROLES.ADMIN), assignJobToSchools);
router.get('/:id/suggested-schools',  authenticate, authorize(ROLES.TPO, ROLES.ADMIN), getSuggestedSchools);
router.patch('/:id/faculty-approve',  authenticate, authorize(ROLES.FACULTY), facultyApproveJob);
router.patch('/:id/faculty-reject',   authenticate, authorize(ROLES.FACULTY), facultyRejectJob);

// Applications sub-resource
router.post('/:id/apply',          authenticate, authorize(ROLES.STUDENT), upload.single('resume'), applyToJob);
router.get('/:id/applications',      authenticate, authorize(ROLES.COMPANY, ROLES.TPO, ROLES.ADMIN, ROLES.FACULTY), listApplicationsForJob);
router.patch('/:jobId/applications/:appId/status', authenticate, authorize(ROLES.COMPANY, ROLES.TPO, ROLES.ADMIN), updateApplicationStatus);
router.get('/:jobId/applications/:appId/resume',   authenticate, authorize(ROLES.COMPANY, ROLES.TPO, ROLES.ADMIN), getApplicationResume);

module.exports = router;
