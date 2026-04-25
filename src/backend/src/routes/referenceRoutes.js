/**
 * Reference Data Routes — public read-only
 * GET /api/reference/schools
 * GET /api/reference/departments?schoolId=...
 */

const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');

router.get('/schools', async (_req, res) => {
  try {
    const snap = await db.collection(COLLECTIONS.SCHOOLS).get();
    res.json({ success: true, data: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (error) {
    console.error('Schools fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schools.' });
  }
});

router.get('/departments', async (req, res) => {
  try {
    let q = db.collection(COLLECTIONS.DEPARTMENTS);
    if (req.query.schoolId) q = q.where('schoolId', '==', req.query.schoolId);
    const snap = await q.get();
    res.json({ success: true, data: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
  } catch (error) {
    console.error('Departments fetch error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch departments.' });
  }
});

module.exports = router;
