/**
 * Announcement Controller
 * ────────────────────────
 * POST   /api/announcements      — Faculty creates announcement (school auto-scoped)
 * GET    /api/announcements      — List announcements (role-filtered)
 * DELETE /api/announcements/:id  — Faculty deletes own announcement
 *
 * Visibility rules:
 *   FACULTY/STUDENT  → only their school's announcements
 *   TPO/ADMIN        → all announcements
 *   COMPANY          → announcements for schools where their OPEN jobs are assigned
 *                      (empty assignedSchools on a job = all schools → company sees all)
 */

const { db } = require('../config/firebase');
const { COLLECTIONS, ROLES, JOB_STATUS } = require('../config/constants');

/* ──────────── POST /api/announcements ──────────── */

const createAnnouncement = async (req, res) => {
  try {
    const { uid, fullName: authorName } = req.user;
    const { title, content } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: 'title and content are required.' });
    }

    const profileDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(uid).get();
    if (!profileDoc.exists) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }
    const { schoolId } = profileDoc.data();

    const now = new Date().toISOString();
    const docRef = await db.collection(COLLECTIONS.ANNOUNCEMENTS).add({
      title:      title.trim(),
      content:    content.trim(),
      schoolId,
      createdBy:  uid,
      authorName: authorName || 'Faculty',
      createdAt:  now,
    });

    return res.status(201).json({
      success: true,
      data: { id: docRef.id, title: title.trim(), content: content.trim(), schoolId, createdBy: uid, authorName, createdAt: now },
    });
  } catch (error) {
    console.error('createAnnouncement error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create announcement.' });
  }
};

/* ──────────── GET /api/announcements ──────────── */

const listAnnouncements = async (req, res) => {
  try {
    const { uid, role } = req.user;
    let announcements = [];

    const sortByDate = (arr) =>
      arr.sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1));

    if (role === ROLES.TPO || role === ROLES.ADMIN) {
      const snap = await db.collection(COLLECTIONS.ANNOUNCEMENTS).get();
      announcements = sortByDate(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

    } else if (role === ROLES.FACULTY) {
      const profileDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(uid).get();
      if (!profileDoc.exists) return res.json({ success: true, data: [] });
      const { schoolId } = profileDoc.data();

      const snap = await db.collection(COLLECTIONS.ANNOUNCEMENTS)
        .where('schoolId', '==', schoolId).get();
      announcements = sortByDate(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

    } else if (role === ROLES.STUDENT) {
      const profileDoc = await db.collection(COLLECTIONS.STUDENT_PROFILES).doc(uid).get();
      if (!profileDoc.exists) return res.json({ success: true, data: [] });
      const { schoolId } = profileDoc.data();
      if (!schoolId) return res.json({ success: true, data: [] });

      const snap = await db.collection(COLLECTIONS.ANNOUNCEMENTS)
        .where('schoolId', '==', schoolId).get();
      announcements = sortByDate(snap.docs.map((d) => ({ id: d.id, ...d.data() })));

    } else if (role === ROLES.COMPANY) {
      const jobsSnap = await db.collection(COLLECTIONS.JOBS)
        .where('companyId', '==', uid)
        .where('status', '==', JOB_STATUS.OPEN).get();
      const jobs = jobsSnap.docs.map((d) => d.data());

      const hasAllSchoolsJob = jobs.some((j) => !j.assignedSchools?.length);

      if (hasAllSchoolsJob) {
        const snap = await db.collection(COLLECTIONS.ANNOUNCEMENTS).get();
        announcements = sortByDate(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } else {
        const schoolIds = [...new Set(jobs.flatMap((j) => j.assignedSchools || []))];
        if (schoolIds.length === 0) return res.json({ success: true, data: [] });

        const allDocs = [];
        for (let i = 0; i < schoolIds.length; i += 10) {
          const chunk = schoolIds.slice(i, i + 10);
          const snap = await db.collection(COLLECTIONS.ANNOUNCEMENTS)
            .where('schoolId', 'in', chunk).get();
          snap.docs.forEach((d) => allDocs.push({ id: d.id, ...d.data() }));
        }
        announcements = sortByDate(allDocs);
      }
    }

    return res.json({ success: true, data: announcements });
  } catch (error) {
    console.error('listAnnouncements error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch announcements.' });
  }
};

/* ──────────── DELETE /api/announcements/:id ──────────── */

const deleteAnnouncement = async (req, res) => {
  try {
    const { uid } = req.user;
    const { id } = req.params;

    const docRef = db.collection(COLLECTIONS.ANNOUNCEMENTS).doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Announcement not found.' });
    }
    if (doc.data().createdBy !== uid) {
      return res.status(403).json({ success: false, message: 'You can only delete your own announcements.' });
    }

    await docRef.delete();
    return res.json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    console.error('deleteAnnouncement error:', error);
    return res.status(500).json({ success: false, message: 'Failed to delete announcement.' });
  }
};

module.exports = { createAnnouncement, listAnnouncements, deleteAnnouncement };
