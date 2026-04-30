/**
 * Company Controller
 * ──────────────────
 * GET   /api/company/profile   — get own company profile
 * PATCH /api/company/profile   — update own company profile
 */

const { db } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');

const getCompanyProfile = async (req, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.COMPANIES).doc(req.user.uid).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }
    return res.status(200).json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Get company profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch company profile.' });
  }
};

const updateCompanyProfile = async (req, res) => {
  try {
    const ref = db.collection(COLLECTIONS.COMPANIES).doc(req.user.uid);
    const doc = await ref.get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }

    const allowed = ['companyName', 'website', 'description', 'hrContact'];
    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    updates.updatedAt = new Date().toISOString();
    await ref.update(updates);

    const updated = await ref.get();
    return res.status(200).json({ success: true, message: 'Company profile updated.', data: updated.data() });
  } catch (error) {
    console.error('Update company profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update company profile.' });
  }
};

module.exports = { getCompanyProfile, updateCompanyProfile };
