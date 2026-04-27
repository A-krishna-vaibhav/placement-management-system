const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  createAnnouncement,
  listAnnouncements,
  deleteAnnouncement,
} = require('../controllers/announcementController');

router.post('/',    authenticate, authorize(ROLES.FACULTY), createAnnouncement);
router.get('/',     authenticate, listAnnouncements);
router.delete('/:id', authenticate, authorize(ROLES.FACULTY), deleteAnnouncement);

module.exports = router;
