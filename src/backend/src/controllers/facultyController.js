/**
 * Faculty Controller
 * ──────────────────
 * GET /api/faculty/students                          — students in faculty's school
 * GET /api/faculty/students/:studentId/applications — that student's applications
 */

const { db } = require('../config/firebase');
const { COLLECTIONS, ROLES, JOB_STATUS } = require('../config/constants');

const getMyStudents = async (req, res) => {
  try {
    const profileDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(req.user.uid).get();
    if (!profileDoc.exists) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }
    const { schoolId } = profileDoc.data();
    if (!schoolId) {
      return res.json({ success: true, data: [] });
    }

    const studentsSnap = await db.collection(COLLECTIONS.STUDENT_PROFILES)
      .where('schoolId', '==', schoolId).get();

    const studentIds = studentsSnap.docs.map((d) => d.id);
    if (studentIds.length === 0) return res.json({ success: true, data: [] });

    // Fetch user docs to get names/emails — chunk to respect Firestore 'in' limit
    const userResults = [];
    for (let i = 0; i < studentIds.length; i += 30) {
      const chunk = studentIds.slice(i, i + 30);
      const usersSnap = await db.collection(COLLECTIONS.USERS)
        .where('__name__', 'in', chunk).get();
      usersSnap.docs.forEach((d) => userResults.push({ uid: d.id, ...d.data() }));
    }

    // Fetch signature status
    const sigSnap = await db.collection(COLLECTIONS.DECLARATION_SIGNATURES)
      .where('userId', 'in', studentIds.slice(0, 30)).get();
    const signedIds = new Set(sigSnap.docs.map((d) => d.data().userId));

    const profileMap = {};
    studentsSnap.docs.forEach((d) => { profileMap[d.id] = d.data(); });

    const data = userResults.map((u) => ({
      uid:             u.uid,
      fullName:        u.fullName,
      email:           u.email,
      rollNumber:      profileMap[u.uid]?.rollNumber || null,
      programme:       profileMap[u.uid]?.programme || null,
      profileComplete: profileMap[u.uid]?.profileComplete || false,
      cgpa:            profileMap[u.uid]?.cgpa ?? null,
      hasSigned:       signedIds.has(u.uid),
    }));

    return res.json({ success: true, data });
  } catch (error) {
    console.error('getMyStudents error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch students.' });
  }
};

const getStudentApplications = async (req, res) => {
  try {
    const { studentId } = req.params;

    // Verify student belongs to faculty's school
    const [facProfileDoc, stuProfileDoc] = await Promise.all([
      db.collection(COLLECTIONS.FACULTY_PROFILES).doc(req.user.uid).get(),
      db.collection(COLLECTIONS.STUDENT_PROFILES).doc(studentId).get(),
    ]);

    if (!facProfileDoc.exists) {
      return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
    }
    if (!stuProfileDoc.exists) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }
    if (stuProfileDoc.data().schoolId !== facProfileDoc.data().schoolId) {
      return res.status(403).json({ success: false, message: 'Student is not in your school.' });
    }

    const snap = await db.collection(COLLECTIONS.APPLICATIONS)
      .where('studentId', '==', studentId)
      .get();

    const apps = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.appliedAt > a.appliedAt ? 1 : -1));
    return res.json({ success: true, data: apps });
  } catch (error) {
    console.error('getStudentApplications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
};

/* ──────────── GET /api/faculty/jobs ──────────── */

const getMyJobs = async (req, res) => {
  try {
    const profileDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(req.user.uid).get();
    if (!profileDoc.exists) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    }
    const { schoolId } = profileDoc.data();

    const snap = await db.collection(COLLECTIONS.JOBS)
      .where('status', '==', JOB_STATUS.OPEN).get();

    // Show all jobs assigned to this school regardless of faculty approval state
    // so faculty can review pending ones and see approved/rejected history
    const jobs = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((j) => j.assignedSchools?.includes(schoolId))
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      // Attach this school's approval state for easy consumption by the frontend
      .map((j) => ({ ...j, mySchoolApproval: j.schoolApprovals?.[schoolId] || null }));

    return res.json({ success: true, data: jobs, meta: { schoolId } });
  } catch (error) {
    console.error('getMyJobs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch jobs.' });
  }
};

module.exports = { getMyStudents, getStudentApplications, getMyJobs };
