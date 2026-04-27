/**
 * Job Controller
 * ──────────────
 * POST  /api/jobs                      — company posts a job (FR-3.1)
 * GET   /api/jobs                      — list jobs (filtered by role)
 * GET   /api/jobs/:id                  — get single job
 * PATCH /api/jobs/:id/approve          — TPO approves (FR-3.3)
 * PATCH /api/jobs/:id/reject           — TPO rejects  (FR-3.4)
 * PATCH /api/jobs/:id/close            — TPO closes   (FR-3.5)
 * PATCH /api/jobs/:id/withdraw         — company withdraws
 * PATCH /api/jobs/:id/assign           — TPO assigns job to schools
 * GET   /api/jobs/:id/suggested-schools — suggest schools based on job content
 */

const { db } = require('../config/firebase');
const {
  COLLECTIONS, ROLES, JOB_STATUS, SCHOOL_APPROVAL_STATUS, AUDIT_ACTION, JOB_ASSIGNMENT_RULES,
} = require('../config/constants');
const { log: auditLog } = require('../services/auditLogger');
const { sendJobApprovalEmail, sendJobRejectionEmail } = require('../services/emailService');

/* ──────────── POST /api/jobs ──────────── */

const createJob = async (req, res) => {
  try {
    const uid = req.user.uid;
    const {
      title, description, location, jobType,
      stipend, ctc, openings,
      eligibility,
    } = req.body;

    if (!title || !description) {
      return res.status(400).json({ success: false, message: 'title and description are required.' });
    }

    const companyDoc = await db.collection(COLLECTIONS.COMPANIES).doc(uid).get();
    if (!companyDoc.exists) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }
    const company = companyDoc.data();

    const now = new Date().toISOString();
    const jobData = {
      companyId:       uid,
      companyName:     company.companyName,
      title,
      description,
      location:        location || null,
      jobType:         jobType || null,
      stipend:         stipend || null,
      ctc:             ctc || null,
      openings:        openings ? Number(openings) : null,
      eligibility:     eligibility || {},
      status:          JOB_STATUS.PENDING_APPROVAL,
      // assignedSchools is populated by TPO after approval.
      // Empty array = visible to all eligible students once OPEN.
      assignedSchools: [],
      approvedAt:      null,
      approvedBy:      null,
      rejectedAt:      null,
      rejectedBy:      null,
      rejectionReason: null,
      closedAt:        null,
      createdAt:       now,
      updatedAt:       now,
    };

    const ref = await db.collection(COLLECTIONS.JOBS).add(jobData);

    return res.status(201).json({
      success: true,
      message: 'Job posted. Awaiting TPO approval.',
      data:    { id: ref.id, ...jobData },
    });
  } catch (error) {
    console.error('Create job error:', error);
    return res.status(500).json({ success: false, message: 'Failed to create job.' });
  }
};

/* ──────────── GET /api/jobs ──────────── */

const listJobs = async (req, res) => {
  try {
    const { role, uid } = req.user;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    let query = db.collection(COLLECTIONS.JOBS);

    if (role === ROLES.COMPANY) {
      query = query.where('companyId', '==', uid);
    } else if (role === ROLES.STUDENT) {
      query = query.where('status', '==', JOB_STATUS.OPEN);
    } else if (role === ROLES.TPO || role === ROLES.ADMIN || role === ROLES.FACULTY) {
      const statusFilter = req.query.status;
      if (statusFilter) query = query.where('status', '==', statusFilter);
    }

    // No orderBy — avoids composite index requirement; sort in JS instead
    const snap = await query.get();
    let jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

    // Students see a job only when their school's faculty has explicitly approved it.
    if (role === ROLES.STUDENT) {
      const profileDoc = await db.collection(COLLECTIONS.STUDENT_PROFILES).doc(uid).get();
      const studentSchoolId = profileDoc.exists ? profileDoc.data().schoolId : null;

      jobs = jobs.filter(
        (j) => studentSchoolId &&
               j.schoolApprovals?.[studentSchoolId]?.status === SCHOOL_APPROVAL_STATUS.FACULTY_APPROVED
      );
    }

    jobs = jobs
      .sort((a, b) => (b.createdAt > a.createdAt ? 1 : -1))
      .slice(0, limit);

    return res.status(200).json({ success: true, data: jobs, meta: { hasMore: false, nextCursor: null } });
  } catch (error) {
    console.error('List jobs error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch jobs.' });
  }
};

/* ──────────── GET /api/jobs/:id ──────────── */

const getJob = async (req, res) => {
  try {
    const doc = await db.collection(COLLECTIONS.JOBS).doc(req.params.id).get();
    if (!doc.exists) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }
    const job = { id: doc.id, ...doc.data() };

    if (req.user.role === ROLES.STUDENT) {
      if (job.status !== JOB_STATUS.OPEN) {
        return res.status(404).json({ success: false, message: 'Job not found.' });
      }
      const profileDoc = await db.collection(COLLECTIONS.STUDENT_PROFILES).doc(req.user.uid).get();
      const studentSchoolId = profileDoc.exists ? profileDoc.data().schoolId : null;
      if (!studentSchoolId ||
          job.schoolApprovals?.[studentSchoolId]?.status !== SCHOOL_APPROVAL_STATUS.FACULTY_APPROVED) {
        return res.status(404).json({ success: false, message: 'Job not found.' });
      }
    }
    if (req.user.role === ROLES.COMPANY && job.companyId !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    return res.status(200).json({ success: true, data: job });
  } catch (error) {
    console.error('Get job error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch job.' });
  }
};

/* ──────────── PATCH /api/jobs/:id/approve ──────────── */

const approveJob = async (req, res) => {
  try {
    const jobRef = db.collection(COLLECTIONS.JOBS).doc(req.params.id);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) return res.status(404).json({ success: false, message: 'Job not found.' });
    const job = jobDoc.data();

    if (job.status !== JOB_STATUS.PENDING_APPROVAL) {
      return res.status(400).json({ success: false, message: `Job is already ${job.status}.` });
    }

    const now = new Date().toISOString();
    await jobRef.update({
      status:     JOB_STATUS.OPEN,
      approvedAt: now,
      approvedBy: req.user.uid,
      updatedAt:  now,
    });

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.APPROVE_JOB,
      targetType:     'job',
      targetId:       req.params.id,
      payloadSummary: `Approved job: ${job.title}`,
      ipAddress:      req.ip,
    });

    const companyUserDoc = await db.collection(COLLECTIONS.USERS).doc(job.companyId).get();
    if (companyUserDoc.exists) {
      sendJobApprovalEmail(companyUserDoc.data().email, job.companyName, job.title).catch((e) =>
        console.error('Approval email error:', e)
      );
    }

    return res.status(200).json({ success: true, message: 'Job approved and now open to students.' });
  } catch (error) {
    console.error('Approve job error:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve job.' });
  }
};

/* ──────────── PATCH /api/jobs/:id/reject ──────────── */

const rejectJob = async (req, res) => {
  try {
    const { reason } = req.body;
    const jobRef = db.collection(COLLECTIONS.JOBS).doc(req.params.id);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) return res.status(404).json({ success: false, message: 'Job not found.' });
    const job = jobDoc.data();

    if (job.status !== JOB_STATUS.PENDING_APPROVAL) {
      return res.status(400).json({ success: false, message: `Job is already ${job.status}.` });
    }

    const now = new Date().toISOString();
    await jobRef.update({
      status:          JOB_STATUS.REJECTED,
      rejectedAt:      now,
      rejectedBy:      req.user.uid,
      rejectionReason: reason || null,
      updatedAt:       now,
    });

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.REJECT_JOB,
      targetType:     'job',
      targetId:       req.params.id,
      payloadSummary: `Rejected job: ${job.title}. Reason: ${reason}`,
      ipAddress:      req.ip,
    });

    const companyUserDoc = await db.collection(COLLECTIONS.USERS).doc(job.companyId).get();
    if (companyUserDoc.exists) {
      sendJobRejectionEmail(companyUserDoc.data().email, job.companyName, job.title, reason).catch((e) =>
        console.error('Rejection email error:', e)
      );
    }

    return res.status(200).json({ success: true, message: 'Job rejected.' });
  } catch (error) {
    console.error('Reject job error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject job.' });
  }
};

/* ──────────── PATCH /api/jobs/:id/close ──────────── */

const closeJob = async (req, res) => {
  try {
    const jobRef = db.collection(COLLECTIONS.JOBS).doc(req.params.id);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) return res.status(404).json({ success: false, message: 'Job not found.' });
    const job = jobDoc.data();

    if (job.status !== JOB_STATUS.OPEN) {
      return res.status(400).json({ success: false, message: 'Only open jobs can be closed.' });
    }

    const now = new Date().toISOString();
    await jobRef.update({ status: JOB_STATUS.CLOSED, closedAt: now, updatedAt: now });

    return res.status(200).json({ success: true, message: 'Job closed.' });
  } catch (error) {
    console.error('Close job error:', error);
    return res.status(500).json({ success: false, message: 'Failed to close job.' });
  }
};

/* ──────────── PATCH /api/jobs/:id/withdraw ──────────── */

const withdrawJob = async (req, res) => {
  try {
    const jobRef = db.collection(COLLECTIONS.JOBS).doc(req.params.id);
    const jobDoc = await jobRef.get();

    if (!jobDoc.exists) return res.status(404).json({ success: false, message: 'Job not found.' });
    const job = jobDoc.data();

    if (job.companyId !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'You can only withdraw your own jobs.' });
    }
    if (![JOB_STATUS.PENDING_APPROVAL, JOB_STATUS.OPEN].includes(job.status)) {
      return res.status(400).json({ success: false, message: `Cannot withdraw a job with status: ${job.status}.` });
    }

    const now = new Date().toISOString();
    await jobRef.update({ status: JOB_STATUS.WITHDRAWN, updatedAt: now });

    return res.status(200).json({ success: true, message: 'Job withdrawn.' });
  } catch (error) {
    console.error('Withdraw job error:', error);
    return res.status(500).json({ success: false, message: 'Failed to withdraw job.' });
  }
};

/* ──────────── PATCH /api/jobs/:id/assign ──────────── */

const assignJobToSchools = async (req, res) => {
  try {
    const { schoolIds } = req.body;

    if (!Array.isArray(schoolIds)) {
      return res.status(400).json({ success: false, message: 'schoolIds must be an array of school ID strings.' });
    }

    const jobRef = db.collection(COLLECTIONS.JOBS).doc(req.params.id);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }
    const job = jobDoc.data();

    const now = new Date().toISOString();

    // Preserve existing per-school faculty approvals; new schools start as PENDING_FACULTY
    const currentApprovals = job.schoolApprovals || {};
    const schoolApprovals = {};
    for (const sid of schoolIds) {
      schoolApprovals[sid] = currentApprovals[sid] || {
        status:          SCHOOL_APPROVAL_STATUS.PENDING_FACULTY,
        approvedBy:      null,
        approvedAt:      null,
        rejectionReason: null,
      };
    }

    await jobRef.update({ assignedSchools: schoolIds, schoolApprovals, updatedAt: now });

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.ASSIGN_JD,
      targetType:     'job',
      targetId:       req.params.id,
      payloadSummary: `Assigned "${job.title}" to schools: [${schoolIds.join(', ')}]`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({
      success: true,
      message: schoolIds.length
        ? `Job assigned to ${schoolIds.length} school(s). Faculty approval pending.`
        : 'Job assignment cleared.',
      data: { assignedSchools: schoolIds, schoolApprovals },
    });
  } catch (error) {
    console.error('Assign job error:', error);
    return res.status(500).json({ success: false, message: 'Failed to assign job.' });
  }
};

/* ──────────── PATCH /api/jobs/:id/faculty-approve ──────────── */

const facultyApproveJob = async (req, res) => {
  try {
    const profileDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(req.user.uid).get();
    if (!profileDoc.exists) return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    const { schoolId } = profileDoc.data();

    const jobRef = db.collection(COLLECTIONS.JOBS).doc(req.params.id);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) return res.status(404).json({ success: false, message: 'Job not found.' });
    const job = jobDoc.data();

    if (job.status !== JOB_STATUS.OPEN) {
      return res.status(400).json({ success: false, message: 'Job is not open.' });
    }
    if (!job.assignedSchools?.includes(schoolId)) {
      return res.status(403).json({ success: false, message: 'This job is not assigned to your school.' });
    }
    if (job.schoolApprovals?.[schoolId]?.status === SCHOOL_APPROVAL_STATUS.FACULTY_APPROVED) {
      return res.status(400).json({ success: false, message: 'Already approved for your school.' });
    }

    const now = new Date().toISOString();
    await jobRef.update({
      [`schoolApprovals.${schoolId}`]: {
        status:          SCHOOL_APPROVAL_STATUS.FACULTY_APPROVED,
        approvedBy:      req.user.uid,
        approvedAt:      now,
        rejectionReason: null,
      },
      updatedAt: now,
    });

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.FACULTY_APPROVE_JOB,
      targetType:     'job',
      targetId:       req.params.id,
      payloadSummary: `Faculty approved "${job.title}" for school: ${schoolId}`,
      ipAddress:      req.ip,
    });

    return res.json({ success: true, message: 'Job approved — students in your school can now apply.' });
  } catch (error) {
    console.error('facultyApproveJob error:', error);
    return res.status(500).json({ success: false, message: 'Failed to approve job.' });
  }
};

/* ──────────── PATCH /api/jobs/:id/faculty-reject ──────────── */

const facultyRejectJob = async (req, res) => {
  try {
    const { reason } = req.body;

    const profileDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(req.user.uid).get();
    if (!profileDoc.exists) return res.status(404).json({ success: false, message: 'Faculty profile not found.' });
    const { schoolId } = profileDoc.data();

    const jobRef = db.collection(COLLECTIONS.JOBS).doc(req.params.id);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) return res.status(404).json({ success: false, message: 'Job not found.' });
    const job = jobDoc.data();

    if (job.status !== JOB_STATUS.OPEN) {
      return res.status(400).json({ success: false, message: 'Job is not open.' });
    }
    if (!job.assignedSchools?.includes(schoolId)) {
      return res.status(403).json({ success: false, message: 'This job is not assigned to your school.' });
    }

    const now = new Date().toISOString();
    await jobRef.update({
      [`schoolApprovals.${schoolId}`]: {
        status:          SCHOOL_APPROVAL_STATUS.FACULTY_REJECTED,
        approvedBy:      null,
        approvedAt:      null,
        rejectionReason: reason || null,
      },
      updatedAt: now,
    });

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.FACULTY_REJECT_JOB,
      targetType:     'job',
      targetId:       req.params.id,
      payloadSummary: `Faculty rejected "${job.title}" for school: ${schoolId}. Reason: ${reason}`,
      ipAddress:      req.ip,
    });

    return res.json({ success: true, message: 'Job rejected for your school.' });
  } catch (error) {
    console.error('facultyRejectJob error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reject job.' });
  }
};

/* ──────────── GET /api/jobs/:id/suggested-schools ──────────── */

const getSuggestedSchools = async (req, res) => {
  try {
    const jobDoc = await db.collection(COLLECTIONS.JOBS).doc(req.params.id).get();
    if (!jobDoc.exists) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }

    const { title = '', description = '' } = jobDoc.data();
    const text = `${title} ${description}`.toLowerCase();

    const suggested = new Set();
    const matchedRules = [];

    for (const rule of JOB_ASSIGNMENT_RULES) {
      if (rule.keywords.some((kw) => text.includes(kw))) {
        rule.schoolIds.forEach((id) => suggested.add(id));
        matchedRules.push(rule.label);
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        suggestedSchoolIds: [...suggested],
        matchedRules,
      },
    });
  } catch (error) {
    console.error('Suggested schools error:', error);
    return res.status(500).json({ success: false, message: 'Failed to compute suggested schools.' });
  }
};

module.exports = {
  createJob,
  listJobs,
  getJob,
  approveJob,
  rejectJob,
  closeJob,
  withdrawJob,
  assignJobToSchools,
  facultyApproveJob,
  facultyRejectJob,
  getSuggestedSchools,
};
