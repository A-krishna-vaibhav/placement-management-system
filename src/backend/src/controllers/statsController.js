/**
 * Stats Controller
 * ────────────────
 * GET /api/stats — returns role-scoped counts for dashboard widgets
 */

const { db } = require('../config/firebase');
const { COLLECTIONS, ROLES, JOB_STATUS, APPLICATION_STATUS, ACCOUNT_STATUS, COMPANY_STATUS } = require('../config/constants');

const getStats = async (req, res) => {
  try {
    const { uid, role } = req.user;

    if (role === ROLES.STUDENT) {
      const [openJobsSnap, appsSnap] = await Promise.all([
        db.collection(COLLECTIONS.JOBS).where('status', '==', JOB_STATUS.OPEN).get(),
        db.collection(COLLECTIONS.APPLICATIONS).where('studentId', '==', uid).get(),
      ]);
      const apps = appsSnap.docs.map((d) => d.data());
      const interviews = apps.filter((a) =>
        [APPLICATION_STATUS.INTERVIEW_SCHEDULED, APPLICATION_STATUS.INTERVIEWED].includes(a.status)
      ).length;
      return res.json({
        success: true,
        data: {
          openJobs:     openJobsSnap.size,
          applications: apps.length,
          interviews,
        },
      });
    }

    if (role === ROLES.COMPANY) {
      const jobsSnap = await db.collection(COLLECTIONS.JOBS).where('companyId', '==', uid).get();
      const jobs = jobsSnap.docs.map((d) => d.data());
      const activeJDs  = jobs.filter((j) => j.status === JOB_STATUS.OPEN).length;
      const allJobIds  = jobsSnap.docs.map((d) => d.id);
      let applicants = 0;
      let offersMade = 0;
      if (allJobIds.length > 0) {
        const appsSnap = await db.collection(COLLECTIONS.APPLICATIONS)
          .where('companyId', '==', uid).get();
        applicants = appsSnap.size;
        offersMade = appsSnap.docs.filter((d) => d.data().status === APPLICATION_STATUS.SELECTED).length;
      }
      return res.json({ success: true, data: { activeJDs, applicants, offersMade } });
    }

    if (role === ROLES.TPO || role === ROLES.ADMIN) {
      const [usersSnap, jobsSnap, companiesSnap, appsSnap] = await Promise.all([
        db.collection(COLLECTIONS.USERS).where('status', '==', ACCOUNT_STATUS.ACTIVE).get(),
        db.collection(COLLECTIONS.JOBS).where('status', '==', JOB_STATUS.OPEN).get(),
        db.collection(COLLECTIONS.COMPANIES).where('status', '==', COMPANY_STATUS.ACTIVE).get(),
        db.collection(COLLECTIONS.APPLICATIONS).where('status', '==', APPLICATION_STATUS.SELECTED).get(),
      ]);
      return res.json({
        success: true,
        data: {
          totalUsers:    usersSnap.size,
          activeJobs:    jobsSnap.size,
          companies:     companiesSnap.size,
          totalPlaced:   appsSnap.size,
        },
      });
    }

    if (role === ROLES.FACULTY) {
      // Faculty sees their school's students and placement stats
      const profileDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(uid).get();
      const schoolId = profileDoc.exists ? profileDoc.data().schoolId : null;

      if (!schoolId) {
        return res.json({ success: true, data: { students: 0, placed: 0, activeJobs: 0 } });
      }

      const [studentsSnap, jobsSnap] = await Promise.all([
        db.collection(COLLECTIONS.STUDENT_PROFILES).where('schoolId', '==', schoolId).get(),
        db.collection(COLLECTIONS.JOBS).where('status', '==', JOB_STATUS.OPEN).get(),
      ]);

      const studentIds = studentsSnap.docs.map((d) => d.id);
      let placed = 0;
      if (studentIds.length > 0) {
        // Firestore 'in' supports up to 30 items; chunk if needed
        const chunks = [];
        for (let i = 0; i < studentIds.length; i += 30) chunks.push(studentIds.slice(i, i + 30));
        const placedCounts = await Promise.all(
          chunks.map((chunk) =>
            db.collection(COLLECTIONS.APPLICATIONS)
              .where('studentId', 'in', chunk)
              .where('status', '==', APPLICATION_STATUS.SELECTED)
              .get()
              .then((s) => s.size)
          )
        );
        placed = placedCounts.reduce((a, b) => a + b, 0);
      }

      return res.json({
        success: true,
        data: { students: studentsSnap.size, placed, activeJobs: jobsSnap.size },
      });
    }

    return res.json({ success: true, data: {} });
  } catch (error) {
    console.error('Stats error:', error);
    return res.status(500).json({ success: false, message: 'Failed to load stats.' });
  }
};

module.exports = { getStats };
