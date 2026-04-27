const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { getProfile, updateProfile } = require('../controllers/studentProfileController');

const router = express.Router();

router.get('/',    authenticate, authorize(ROLES.STUDENT), getProfile);
router.patch('/',  authenticate, authorize(ROLES.STUDENT), updateProfile);

module.exports = router;
