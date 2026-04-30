const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { getCompanyProfile, updateCompanyProfile } = require('../controllers/companyController');

const router = express.Router();

router.get('/profile',   authenticate, authorize(ROLES.COMPANY), getCompanyProfile);
router.patch('/profile', authenticate, authorize(ROLES.COMPANY), updateCompanyProfile);

module.exports = router;
