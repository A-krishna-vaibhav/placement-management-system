/**
 * Application Controller
 * ──────────────────────
 * POST  /api/jobs/:id/apply                            — student applies (FR-4.1, DB-5)
 * GET   /api/applications                              — student's own applications
 * GET   /api/jobs/:id/applications                     — recruiter/TPO/faculty view
 * PATCH /api/jobs/:jobId/applications/:appId/status   — update application status
 * PATCH /api/applications/:id/withdraw                 — student withdraws
 */

const fs   = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { db, storage } = require('../config/firebase');
const { COLLECTIONS, ROLES, JOB_STATUS, APPLICATION_STATUS } = require('../config/constants');

// Local fallback directory — used when Firebase Storage bucket is not yet created
const UPLOADS_DIR = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
const {
  sendApplicationConfirmationEmail,
  sendApplicationStatusEmail,
} = require('../services/emailService');

/* ──────────── helpers ──────────── */

function checkEligibility(profile, eligibility) {
  if (!eligibility || Object.keys(eligibility).length === 0) return { eligible: true };

  if (eligibility.minCgpa != null && (profile.cgpa == null || profile.cgpa < eligibility.minCgpa)) {
    return { eligible: false, reason: `Minimum CGPA required: ${eligibility.minCgpa}` };
  }
  if (eligibility.maxBacklogs != null && profile.backlogs > eligibility.maxBacklogs) {
    return { eligible: false, reason: `Maximum backlogs allowed: ${eligibility.maxBacklogs}` };
  }
  if (
    eligibility.allowedBranches?.length &&
    profile.departmentId &&
    !eligibility.allowedBranches.includes(profile.departmentId)
  ) {
    return { eligible: false, reason: 'Your branch is not eligible for this job.' };
  }
  if (
    eligibility.allowedProgrammes?.length &&
    profile.programme &&
    !eligibility.allowedProgrammes.includes(profile.programme)
  ) {
    return { eligible: false, reason: 'Your programme is not eligible for this job.' };
  }
  return { eligible: true };
}

/* ──────────── POST /api/jobs/:id/apply ──────────── */

const applyToJob = async (req, res) => {
  try {
    const uid = req.user.uid;
    const jobId = req.params.id;

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'A PDF resume is required to apply.' });
    }

    // Try Firebase Storage first; fall back to local filesystem if bucket not configured/available.
    let storagePath = null;
    let localPath   = null;

    if (storage) {
      try {
        storagePath = `applications/${jobId}/${uid}/${uuidv4()}.pdf`;
        const file = storage.bucket().file(storagePath);
        await file.save(req.file.buffer, { metadata: { contentType: 'application/pdf' } });
      } catch (storageErr) {
        console.warn('Firebase Storage unavailable, falling back to local storage:', storageErr.message);
        storagePath = null;
      }
    }

    if (!storagePath) {
      const filename = `${uuidv4()}.pdf`;
      const dir = path.join(UPLOADS_DIR, jobId, uid);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, filename), req.file.buffer);
      localPath = path.join(jobId, uid, filename);
    }

    const result = await db.runTransaction(async (txn) => {
      const jobRef     = db.collection(COLLECTIONS.JOBS).doc(jobId);
      const profileRef = db.collection(COLLECTIONS.STUDENT_PROFILES).doc(uid);
      const [jobDoc, profileDoc] = await Promise.all([txn.get(jobRef), txn.get(profileRef)]);

      if (!jobDoc.exists) return { error: 'Job not found.', status: 404 };
      const job = jobDoc.data();
      if (job.status !== JOB_STATUS.OPEN) return { error: 'This job is not open for applications.', status: 400 };

      if (!profileDoc.exists) return { error: 'Student profile not found.', status: 404 };
      const profile = profileDoc.data();

      const declSnap = await db
        .collection(COLLECTIONS.DECLARATION_SIGNATURES)
        .where('userId', '==', uid).limit(1).get();
      if (declSnap.empty) {
        return { error: 'You must sign the PGAB Self-Declaration before applying.', status: 403, code: 'DECLARATION_REQUIRED' };
      }

      const { eligible, reason } = checkEligibility(profile, job.eligibility);
      if (!eligible) return { error: reason, status: 403, code: 'NOT_ELIGIBLE' };

      const dupSnap = await db
        .collection(COLLECTIONS.APPLICATIONS)
        .where('studentId', '==', uid).where('jobId', '==', jobId).get();
      const activeApp = dupSnap.docs.find((d) => {
        const s = d.data().status;
        return s !== APPLICATION_STATUS.WITHDRAWN_STUDENT && s !== APPLICATION_STATUS.WITHDRAWN_SYSTEM;
      });
      if (activeApp) {
        return { error: 'You have already applied for this job.', status: 409, code: 'ALREADY_APPLIED' };
      }

      const now = new Date().toISOString();
      const appRef = db.collection(COLLECTIONS.APPLICATIONS).doc();
      const appData = {
        jobId,
        jobTitle:       job.title,
        companyId:      job.companyId,
        companyName:    job.companyName,
        studentId:      uid,
        studentEmail:   req.user.email,
        studentName:    req.user.fullName,
        resumeStoragePath: storagePath,
        resumeLocalPath:   localPath,
        resumeFileName:    req.file.originalname,
        resumeSize:        req.file.size,
        status:         APPLICATION_STATUS.APPLIED,
        statusHistory:  [{ status: APPLICATION_STATUS.APPLIED, changedAt: now, changedBy: uid }],
        appliedAt:      now,
        updatedAt:      now,
      };

      txn.set(appRef, appData);
      return { ok: true, appId: appRef.id, appData };
    });

    if (result.error) {
      if (storagePath && storage) storage.bucket().file(storagePath).delete().catch(() => {});
      if (localPath) fs.unlink(path.join(UPLOADS_DIR, localPath), () => {});
      return res.status(result.status).json({ success: false, message: result.error, code: result.code });
    }

    sendApplicationConfirmationEmail(
      result.appData.studentEmail,
      result.appData.studentName,
      result.appData.jobTitle,
      result.appData.companyName,
    ).catch((e) => console.error('Application confirmation email error:', e));

    return res.status(201).json({
      success: true,
      message: 'Application submitted successfully.',
      data:    { id: result.appId, ...result.appData },
    });
  } catch (error) {
    console.error('Apply to job error:', error);
    return res.status(500).json({ success: false, message: 'Failed to submit application.' });
  }
};

/* ──────────── GET /api/applications ──────────── */

const listMyApplications = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 50, 100);
    const cursor = req.query.cursor;

    const snap = await db.collection(COLLECTIONS.APPLICATIONS)
      .where('studentId', '==', req.user.uid)
      .get();

    const all = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.appliedAt > a.appliedAt ? 1 : -1));
    const docs = all.slice(0, limit);
    const hasMore = all.length > limit;
    const apps = docs;
    const nextCursor = hasMore ? docs[docs.length - 1].appliedAt : null;

    return res.status(200).json({ success: true, data: apps, meta: { hasMore, nextCursor } });
  } catch (error) {
    console.error('List applications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
};

/* ──────────── GET /api/jobs/:id/applications ──────────── */

const listApplicationsForJob = async (req, res) => {
  try {
    const jobId = req.params.id;

    // Company can only see applications for their own jobs
    if (req.user.role === ROLES.COMPANY) {
      const jobDoc = await db.collection(COLLECTIONS.JOBS).doc(jobId).get();
      if (!jobDoc.exists || jobDoc.data().companyId !== req.user.uid) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const snap = await db
      .collection(COLLECTIONS.APPLICATIONS)
      .where('jobId', '==', jobId)
      .get();

    const apps = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.appliedAt > a.appliedAt ? 1 : -1));

    // Enrich each application with student academic profile
    const studentIds = [...new Set(apps.map((a) => a.studentId))];
    const profileMap = {};
    for (let i = 0; i < studentIds.length; i += 30) {
      const chunk = studentIds.slice(i, i + 30);
      const pSnap = await db.collection(COLLECTIONS.STUDENT_PROFILES)
        .where('__name__', 'in', chunk).get();
      pSnap.docs.forEach((d) => {
        const { cgpa, backlogs, skills, programme, departmentId, schoolId, rollNumber, phoneNumber } = d.data();
        profileMap[d.id] = { cgpa, backlogs, skills, programme, departmentId, schoolId, rollNumber, phoneNumber };
      });
    }

    const enriched = apps.map((a) => ({ ...a, studentProfile: profileMap[a.studentId] || null }));
    return res.status(200).json({ success: true, data: enriched });
  } catch (error) {
    console.error('List job applications error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
};

/* ──────────── PATCH /api/jobs/:jobId/applications/:appId/status ──────────── */

const updateApplicationStatus = async (req, res) => {
  try {
    const { appId } = req.params;
    const { status, note } = req.body;

    const validStatuses = Object.values(APPLICATION_STATUS).filter(
      (s) => ![APPLICATION_STATUS.WITHDRAWN_STUDENT, APPLICATION_STATUS.WITHDRAWN_SYSTEM].includes(s)
    );
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const appRef = db.collection(COLLECTIONS.APPLICATIONS).doc(appId);
    const appDoc = await appRef.get();
    if (!appDoc.exists) return res.status(404).json({ success: false, message: 'Application not found.' });

    const app = appDoc.data();

    // Company can only update their own job's applications
    if (req.user.role === ROLES.COMPANY && app.companyId !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const now = new Date().toISOString();
    const statusHistory = [...(app.statusHistory || []), {
      status,
      note:      note || null,
      changedAt: now,
      changedBy: req.user.uid,
    }];

    await appRef.update({ status, statusHistory, updatedAt: now });

    // Best-effort status notification email
    const emailStatuses = [
      APPLICATION_STATUS.SHORTLISTED,
      APPLICATION_STATUS.NOT_SHORTLISTED,
      APPLICATION_STATUS.INTERVIEW_SCHEDULED,
      APPLICATION_STATUS.NOT_SELECTED_INTERVIEW,
      APPLICATION_STATUS.SELECTED,
      APPLICATION_STATUS.REJECTED,
    ];
    if (emailStatuses.includes(status)) {
      sendApplicationStatusEmail(
        app.studentEmail,
        app.studentName,
        app.jobTitle,
        app.companyName,
        status,
      ).catch((e) => console.error('Status update email error:', e));
    }

    return res.status(200).json({ success: true, message: 'Application status updated.', data: { status } });
  } catch (error) {
    console.error('Update application status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to update application status.' });
  }
};

/* ──────────── PATCH /api/applications/:id/withdraw ──────────── */

const withdrawApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const appRef = db.collection(COLLECTIONS.APPLICATIONS).doc(id);
    const appDoc = await appRef.get();

    if (!appDoc.exists) return res.status(404).json({ success: false, message: 'Application not found.' });
    const app = appDoc.data();

    if (app.studentId !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'You can only withdraw your own applications.' });
    }

    const nonWithdrawable = [
      APPLICATION_STATUS.SELECTED,
      APPLICATION_STATUS.WITHDRAWN_STUDENT,
      APPLICATION_STATUS.WITHDRAWN_SYSTEM,
    ];
    if (nonWithdrawable.includes(app.status)) {
      return res.status(400).json({ success: false, message: `Cannot withdraw an application with status: ${app.status}.` });
    }

    const now = new Date().toISOString();
    const statusHistory = [...(app.statusHistory || []), {
      status:    APPLICATION_STATUS.WITHDRAWN_STUDENT,
      changedAt: now,
      changedBy: req.user.uid,
    }];

    await appRef.update({
      status:        APPLICATION_STATUS.WITHDRAWN_STUDENT,
      statusHistory,
      updatedAt:     now,
    });

    return res.status(200).json({ success: true, message: 'Application withdrawn.' });
  } catch (error) {
    console.error('Withdraw application error:', error);
    return res.status(500).json({ success: false, message: 'Failed to withdraw application.' });
  }
};

/* ──────────── GET /api/jobs/:jobId/applications/:appId/resume ──────────── */
/*
 * Streams the resume PDF directly from Firebase Storage through the backend.
 * No signed URLs — avoids the Service Account Token Creator IAM requirement.
 * Access rule: COMPANY must own the job; TPO/ADMIN unrestricted.
 */
const getApplicationResume = async (req, res) => {
  try {
    const { jobId, appId } = req.params;

    // COMPANY: validate job ownership
    if (req.user.role === ROLES.COMPANY) {
      const jobDoc = await db.collection(COLLECTIONS.JOBS).doc(jobId).get();
      if (!jobDoc.exists || jobDoc.data().companyId !== req.user.uid) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    const appDoc = await db.collection(COLLECTIONS.APPLICATIONS).doc(appId).get();
    if (!appDoc.exists) {
      return res.status(404).json({ success: false, message: 'Application not found.' });
    }
    const app = appDoc.data();

    if (app.jobId !== jobId) {
      return res.status(403).json({ success: false, message: 'Application does not belong to this job.' });
    }

    const { resumeStoragePath, resumeLocalPath, resumeUrl, resumeFileName } = app;
    const fileName = resumeFileName || 'resume.pdf';

    const sendPdf = () => {
      res.set('Content-Type', 'application/pdf');
      res.set('Content-Disposition', `inline; filename="${fileName}"`);
      res.set('Cache-Control', 'private, no-store');
    };

    // Firebase Storage (primary)
    if (resumeStoragePath && storage) {
      try {
        const file = storage.bucket().file(resumeStoragePath);
        const [exists] = await file.exists();
        if (exists) {
          sendPdf();
          file.createReadStream()
            .on('error', (err) => {
              console.error('Storage stream error:', err.message);
              if (!res.headersSent) res.status(500).json({ success: false, message: 'Failed to stream resume.' });
            })
            .pipe(res);
          return;
        }
      } catch (e) {
        console.warn('Firebase Storage read failed, trying local fallback:', e.message);
      }
    }

    // Local filesystem fallback
    if (resumeLocalPath) {
      const fullPath = path.join(UPLOADS_DIR, resumeLocalPath);
      if (fs.existsSync(fullPath)) {
        sendPdf();
        return res.sendFile(fullPath);
      }
    }

    // Legacy public URL
    if (resumeUrl) return res.redirect(resumeUrl);

    return res.status(404).json({ success: false, message: 'No resume attached to this application.' });
  } catch (error) {
    console.error('getApplicationResume error:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve resume.' });
  }
};

module.exports = {
  applyToJob,
  listMyApplications,
  listApplicationsForJob,
  updateApplicationStatus,
  withdrawApplication,
  getApplicationResume,
};
