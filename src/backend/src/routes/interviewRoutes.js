const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  requestInterview,
  getJobInterviewSchedule,
  forwardInterviewToFaculty,
  facultyConfirmInterview,
  scheduleInterview,
  updateCommonLink,
  cancelInterview,
  completeInterview,
  listInterviewSchedules,
  getInterviewSchedule,
  listSlots,
  updateSlotLink,
  bookSlot,
  cancelSlotBooking,
  listMyInterviews,
} = require('../controllers/interviewController');

const router = express.Router();

/* ── Company ── */
router.post('/jobs/:jobId/interview-request',
  authenticate, authorize(ROLES.COMPANY), requestInterview);

router.patch('/interview-schedules/:id/common-link',
  authenticate, authorize(ROLES.COMPANY), updateCommonLink);

router.patch('/interview-slots/:slotId/link',
  authenticate, authorize(ROLES.COMPANY), updateSlotLink);

/* ── TPO / Admin ── */
router.patch('/interview-schedules/:id/forward',
  authenticate, authorize(ROLES.TPO, ROLES.ADMIN), forwardInterviewToFaculty);

router.patch('/interview-schedules/:id/schedule',
  authenticate, authorize(ROLES.TPO, ROLES.ADMIN), scheduleInterview);

router.patch('/interview-schedules/:id/cancel',
  authenticate, authorize(ROLES.TPO, ROLES.ADMIN), cancelInterview);

router.patch('/interview-schedules/:id/complete',
  authenticate, authorize(ROLES.TPO, ROLES.ADMIN), completeInterview);

/* ── Faculty ── */
router.patch('/interview-schedules/:id/faculty-confirm',
  authenticate, authorize(ROLES.FACULTY), facultyConfirmInterview);

/* ── Student ── */
router.post('/interview-slots/:slotId/book',
  authenticate, authorize(ROLES.STUDENT), bookSlot);

router.delete('/interview-slots/:slotId/book',
  authenticate, authorize(ROLES.STUDENT), cancelSlotBooking);

router.get('/my-interviews',
  authenticate, authorize(ROLES.STUDENT), listMyInterviews);

/* ── Shared reads (role-scoped inside controller) ── */
router.get('/jobs/:jobId/interview-schedule',
  authenticate, getJobInterviewSchedule);

router.get('/interview-schedules',
  authenticate, listInterviewSchedules);

router.get('/interview-schedules/:id',
  authenticate, getInterviewSchedule);

router.get('/interview-schedules/:id/slots',
  authenticate, listSlots);

module.exports = router;
