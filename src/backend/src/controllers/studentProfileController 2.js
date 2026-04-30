/**
 * Student Profile Controller
 * ──────────────────────────
 * GET   /api/profile          — get own student profile
 * PATCH /api/profile          — update student profile (with change history for sensitive fields)
 */

const { db } = require('../config/firebase');
const { COLLECTIONS, ROLES } = require('../config/constants');

const SENSITIVE_FIELDS = ['cgpa', 'backlogs', 'schoolId', 'departmentId'];

/* ──────────── GET /api/profile ──────────── */

const getProfile = async (req, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.STUDENT_PROFILES).doc(req.user.uid).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }
    return res.status(200).json({ success: true, data: { id: doc.id, ...doc.data() } });
  } catch (error) {
    console.error('Get student profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

/* ──────────── PATCH /api/profile ──────────── */

const updateProfile = async (req, res) => {
  try {
    const uid = req.user.uid;
    const ref = db.collection(COLLECTIONS.STUDENT_PROFILES).doc(uid);
    const doc = await ref.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const current = doc.data();
    const allowed = [
      'rollNumber', 'programme', 'joiningYear', 'graduationYear',
      'cgpa', 'backlogs', 'skills', 'phoneNumber',
      'schoolId', 'departmentId',
    ];

    const updates = {};
    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields to update.' });
    }

    // Record change history for sensitive fields (FR-2.4)
    const changeHistory = current.changeHistory || [];
    const now = new Date().toISOString();

    for (const field of SENSITIVE_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(updates, field) && updates[field] !== current[field]) {
        changeHistory.push({
          field,
          oldValue: current[field] ?? null,
          newValue: updates[field],
          changedAt: now,
          changedBy: uid,
        });
      }
    }

    // Determine if profile is now complete
    const merged = { ...current, ...updates };
    const profileComplete = Boolean(
      merged.rollNumber &&
      merged.programme &&
      merged.joiningYear &&
      merged.graduationYear &&
      merged.cgpa != null &&
      merged.phoneNumber &&
      merged.schoolId &&
      merged.departmentId
    );

    await ref.update({
      ...updates,
      changeHistory,
      profileComplete,
      updatedAt: now,
    });

    // Also update fullName in users collection if provided
    if (req.body.fullName) {
      await db.collection(COLLECTIONS.USERS).doc(uid).update({
        fullName:  req.body.fullName,
        updatedAt: now,
      });
    }

    const updated = await ref.get();
    return res.status(200).json({ success: true, message: 'Profile updated.', data: updated.data() });
  } catch (error) {
    console.error('Update student profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

module.exports = { getProfile, updateProfile };
