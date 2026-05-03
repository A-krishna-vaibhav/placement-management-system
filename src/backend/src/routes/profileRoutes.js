const express = require('express');
const multer  = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { getProfile, updateProfile } = require('../controllers/studentProfileController');
const { uploadResume, deleteResume } = require('../controllers/resumeController');
const { validateProfileUpdate } = require('../middleware/profileValidator');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') return cb(null, true);
    cb(new Error('Only PDF files are allowed.'));
  },
});

const router = express.Router();

router.get('/',    authenticate, authorize(ROLES.STUDENT), getProfile);
router.patch('/',  authenticate, authorize(ROLES.STUDENT), validateProfileUpdate, updateProfile);

router.post('/resume',          authenticate, authorize(ROLES.STUDENT), upload.single('resume'), uploadResume);
router.delete('/resume/:versionId', authenticate, authorize(ROLES.STUDENT), deleteResume);

module.exports = router;
