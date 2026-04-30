const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { listMyApplications, withdrawApplication } = require('../controllers/applicationController');

const router = express.Router();

router.get('/',          authenticate, authorize(ROLES.STUDENT), listMyApplications);
router.patch('/:id/withdraw', authenticate, authorize(ROLES.STUDENT), withdrawApplication);

module.exports = router;
