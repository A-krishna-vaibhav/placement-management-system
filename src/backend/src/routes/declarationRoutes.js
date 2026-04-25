const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  getCurrentDeclaration,
  signDeclaration,
  getMySignatures,
  seedDeclaration,
} = require('../controllers/declarationController');

const router = express.Router();

router.get('/current',    authenticate, getCurrentDeclaration);
router.post('/sign',      authenticate, authorize(ROLES.STUDENT), signDeclaration);
router.get('/my',         authenticate, authorize(ROLES.STUDENT), getMySignatures);
router.post('/seed',      authenticate, authorize(ROLES.ADMIN), seedDeclaration);

module.exports = router;
