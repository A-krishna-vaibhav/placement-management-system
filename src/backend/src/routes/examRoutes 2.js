const express  = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  requestExamSchedule,
  getJobExamSchedule,
  forwardToFaculty,
  facultyConfirm,
  finalizeSchedule,
  updateExamLink,
  assignVenue,
  cancelSchedule,
  listExamSchedules,
  getExamSchedule,
  listMyExams,
} = require('../controllers/examController');

const router = express.Router();

/* ── Company ── */
router.post('/jobs/:jobId/exam-schedule',
  authenticate, authorize(ROLES.COMPANY), requestExamSchedule);

router.patch('/exam-schedules/:id/exam-link',
  authenticate, authorize(ROLES.COMPANY), updateExamLink);

/* ── TPO / Admin ── */
router.patch('/exam-schedules/:id/forward',
  authenticate, authorize(ROLES.TPO, ROLES.ADMIN), forwardToFaculty);

router.patch('/exam-schedules/:id/finalize',
  authenticate, authorize(ROLES.TPO, ROLES.ADMIN), finalizeSchedule);

router.patch('/exam-schedules/:id/assign-venue',
  authenticate, authorize(ROLES.TPO, ROLES.ADMIN), assignVenue);

router.patch('/exam-schedules/:id/cancel',
  authenticate, authorize(ROLES.TPO, ROLES.ADMIN), cancelSchedule);

/* ── Faculty ── */
router.patch('/exam-schedules/:id/faculty-confirm',
  authenticate, authorize(ROLES.FACULTY), facultyConfirm);

/* ── Shared read (access scoped per role inside controller) ── */
router.get('/jobs/:jobId/exam-schedule',
  authenticate, getJobExamSchedule);

router.get('/exam-schedules',
  authenticate, listExamSchedules);

router.get('/exam-schedules/:id',
  authenticate, getExamSchedule);

/* ── Student ── */
router.get('/my-exams',
  authenticate, authorize(ROLES.STUDENT), listMyExams);

module.exports = router;
