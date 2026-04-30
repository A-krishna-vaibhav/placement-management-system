const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { getMyStudents, getStudentApplications, getMyJobs } = require('../controllers/facultyController');

router.get('/students',                          authenticate, authorize(ROLES.FACULTY, ROLES.TPO, ROLES.ADMIN), getMyStudents);
router.get('/students/:studentId/applications',  authenticate, authorize(ROLES.FACULTY, ROLES.TPO, ROLES.ADMIN), getStudentApplications);
router.get('/jobs',                              authenticate, authorize(ROLES.FACULTY), getMyJobs);

module.exports = router;
