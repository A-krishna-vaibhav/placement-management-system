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
 */

const { db } = require('../config/firebase');
const { COLLECTIONS, ROLES, JOB_STATUS, AUDIT_ACTION } = require('../config/constants');
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

    // Load company doc
    const companyDoc = await db.collection(COLLECTIONS.COMPANIES).doc(uid).get();
    if (!companyDoc.exists) {
      return res.status(404).json({ success: false, message: 'Company profile not found.' });
    }
    const company = companyDoc.data();

    const now = new Date().toISOString();
    const jobData = {
      companyId:    uid,
      companyName:  company.companyName,
      title,
      description,
      location:     location || null,
      jobType:      jobType || null,       // INTERNSHIP | FULL_TIME | PART_TIME
      stipend:      stipend || null,
      ctc:          ctc || null,
      openings:     openings ? Number(openings) : null,
      eligibility:  eligibility || {},     // { minCgpa, allowedBranches, maxBacklogs, ... }
      status:       JOB_STATUS.PENDING_APPROVAL,
      approvedAt:   null,
      approvedBy:   null,
      rejectedAt:   null,
      rejectedBy:   null,
      rejectionReason: null,
      closedAt:     null,
      createdAt:    now,
      updatedAt:    now,
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
    const limit  = Math.min(parseInt(req.query.limit) || 50, 100);
    const cursor = req.query.cursor; // last doc createdAt for pagination

    let query = db.collection(COLLECTIONS.JOBS);

    if (role === ROLES.COMPANY) {
      query = query.where('companyId', '==', uid);
    } else if (role === ROLES.STUDENT) {
      query = query.where('status', '==', JOB_STATUS.OPEN);
    } else if (role === ROLES.TPO || role === ROLES.ADMIN || role === ROLES.FACULTY) {
      const statusFilter = req.query.status;
      if (statusFilter) query = query.where('status', '==', statusFilter);
    }

    query = query.orderBy('createdAt', 'desc').limit(limit + 1);
    if (cursor) query = query.startAfter(cursor);

    const snap = await query.get();
    const docs = snap.docs.slice(0, limit);
    const hasMore = snap.docs.length > limit;
    const jobs = docs.map((d) => ({ id: d.id, ...d.data() }));
    const nextCursor = hasMore ? docs[docs.length - 1].data().createdAt : null;

    return res.status(200).json({ success: true, data: jobs, meta: { hasMore, nextCursor } });
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

    // Students can only view OPEN jobs
    if (req.user.role === ROLES.STUDENT && job.status !== JOB_STATUS.OPEN) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }
    // Companies can only view their own jobs
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

    // Notify company — best effort
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

module.exports = { createJob, listJobs, getJob, approveJob, rejectJob, closeJob, withdrawJob };
