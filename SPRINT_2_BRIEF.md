# Sprint 2 — Claude Code Brief

**Project:** UoH Placement Management System
**Sprint goal:** A Student can register → sign the PGAB declaration → complete their profile → upload a resume → discover eligible jobs → apply. A Recruiter can register (already done), post a job. A TPO can approve the job. End-to-end "first application" flow works.
**Scope:** SRS v2.0 features F2 (FR-2.1 to FR-2.10), F3 (FR-3.1 to FR-3.6), F4 (FR-4.1 to FR-4.6).
**Prerequisites:** Sprint 1 cleanup brief applied (verified by user)
**Estimated work:** 10-15 hours.

---

## How to use this brief

Work task-by-task, top to bottom. Each task builds on the previous. After each task:
1. Run the `Verify:` commands
2. Confirm the change works as described
3. Move on only when green

**Do not batch tasks.** The coupling between features (declaration gate in apply flow, status transitions, Firebase Storage rules) means a bug in Task 3 will cascade through Task 6. Catch problems early.

**If something fails for reasons not obvious within 10 minutes, stop and report back.** Don't fabricate workarounds.

---

## Overview

| # | Task | Layer | Files touched |
|---|------|-------|---------------|
| 0 | Preparation & new dependencies | Both | `package.json`, `.env.example` |
| 1 | Resend email provider | Backend | `services/emailService.js` (replace) |
| 2 | Firebase Storage setup | Backend | `config/firebase.js`, `storage.rules` |
| 3 | Declaration controller (full) | Backend | `controllers/declarationController.js`, routes |
| 4 | Student profile completion | Backend | `controllers/profileController.js`, validators |
| 5 | Resume upload service | Backend | `services/resumeService.js`, routes |
| 6 | Company profile management | Backend | `controllers/companyController.js` (extend) |
| 7 | Job lifecycle (post + approve) | Backend | `controllers/jobController.js`, routes |
| 8 | Application processing + apply | Backend | `controllers/applicationController.js` |
| 9 | Reference data API hardening | Backend | Extend `referenceRoutes.js` |
| 10 | API service layer frontend | Frontend | `services/api.js` (extend) |
| 11 | Shared UI components | Frontend | 3 new primitives in `components/ui/` |
| 12 | StudentDashboard shell | Frontend | New layout + navbar |
| 13 | DeclarationModal | Frontend | `components/declaration/DeclarationModal.jsx` |
| 14 | StudentProfilePage | Frontend | `pages/student/ProfilePage.jsx` |
| 15 | Resume upload UI | Frontend | Embedded in ProfilePage |
| 16 | BrowseJobsPage | Frontend | `pages/student/BrowseJobsPage.jsx` |
| 17 | JobDetailPage + apply flow | Frontend | `pages/student/JobDetailPage.jsx` |
| 18 | MyApplicationsPage | Frontend | `pages/student/MyApplicationsPage.jsx` |
| 19 | Recruiter: Post Job form | Frontend | `pages/recruiter/PostJobPage.jsx` |
| 20 | Recruiter: My Jobs list | Frontend | `pages/recruiter/MyJobsPage.jsx` |
| 21 | TPO: Pending Jobs review | Frontend | `pages/tpo/PendingJobsPage.jsx` |
| 22 | TPO: Pending Companies review | Frontend | `pages/tpo/PendingCompaniesPage.jsx` |
| 23 | Router + ProtectedRoute updates | Frontend | `App.jsx` |
| 24 | Tests for each new backend feature | Backend | `tests/*` |

---

## Task 0 — Preparation

**Goal:** install dependencies and configure environment.

### Backend dependencies

```bash
cd src/backend
npm install resend multer @google-cloud/storage react-markdown  # react-markdown is installed at frontend, NOT backend - skip it here
npm install resend multer
```

Wait - correction:
```bash
cd src/backend
npm install resend multer
```

### Frontend dependencies

```bash
cd src/frontend
npm install react-markdown remark-gfm react-dropzone
```

### Environment variables

Add to `src/backend/.env.example`:
```
# Resend email provider
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=PMS <placements@uohyd.ac.in>

# Firebase Storage bucket (same project as Firestore)
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

User must create a free Resend account at resend.com, verify a domain (or use the sandbox `onboarding@resend.dev` for dev), and put the API key in `.env`. For dev testing without domain verification, Resend provides a test mode that only delivers to the registered account email — acceptable for Sprint 2.

### Enable Firebase Storage

User must go to Firebase Console → Storage → Get Started → pick region. Once enabled, the `FIREBASE_STORAGE_BUCKET` env var becomes `<project-id>.appspot.com`.

**Verify:**
```bash
cd src/backend
node -e "require('dotenv').config(); console.log('Resend key present:', !!process.env.RESEND_API_KEY); console.log('Storage bucket:', process.env.FIREBASE_STORAGE_BUCKET);"
# Both should print truthy values
```

If env vars are missing, stop and ask the user to configure them before proceeding.

---

## Task 1 — Replace email service stub with Resend

**Goal:** real email delivery for registration, OTP, approvals, notifications.

**File:** `src/backend/src/services/emailService.js` (replace entire contents)

```javascript
/**
 * Email delivery via Resend.
 *
 * In development without RESEND_API_KEY, falls back to console logging
 * (useful for local dev where you don't want to exhaust the free tier).
 *
 * Templates live in ./emailTemplates/ — kept simple HTML, no engine.
 */

const { Resend } = require('resend');

const API_KEY = process.env.RESEND_API_KEY;
const FROM    = process.env.RESEND_FROM_EMAIL || 'PMS <onboarding@resend.dev>';

let resend = null;
if (API_KEY) {
  resend = new Resend(API_KEY);
}

async function sendEmail({ to, subject, html, text }) {
  // Dev fallback: no API key means console log
  if (!resend) {
    console.log('\n=============== EMAIL (dev, no Resend key) ===============');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text:\n${text || html}`);
    console.log('==========================================================\n');
    return { ok: true, devLogged: true };
  }

  try {
    const result = await resend.emails.send({
      from:    FROM,
      to:      Array.isArray(to) ? to : [to],
      subject,
      html:    html || `<p>${text}</p>`,
      text,
    });
    return { ok: true, id: result.data?.id };
  } catch (err) {
    console.error('Resend error:', err);
    // In test environments, fail soft so business logic doesn't 500 on mail problems
    if (process.env.NODE_ENV === 'test') return { ok: false, error: err.message };
    throw err;
  }
}

/* ========== Templates ========== */

function wrapTemplate(body, preheader = '') {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>UoH PMS</title></head>
<body style="margin:0;padding:0;background:#FAF7F2;font-family:system-ui,-apple-system,sans-serif;color:#2E2924;">
  <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2;padding:32px 12px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#FFFFFF;border-radius:8px;border:1px solid #EEEAE3;overflow:hidden;">
        <tr><td style="background:#8B2838;padding:24px 32px;color:#FFFFFF;">
          <h1 style="margin:0;font-family:Georgia,serif;font-size:22px;font-weight:600;">University of Hyderabad</h1>
          <p style="margin:4px 0 0;font-size:12px;opacity:0.85;letter-spacing:0.1em;text-transform:uppercase;">Placement Management System</p>
        </td></tr>
        <tr><td style="padding:32px;">${body}</td></tr>
        <tr><td style="background:#FAF7F2;padding:16px 32px;font-size:12px;color:#655B4D;border-top:1px solid #EEEAE3;">
          Sent by the Placement Guidance and Advisory Bureau (PGAB).<br>
          If you did not expect this email, please ignore it.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

async function sendOTPEmail(email, code) {
  return sendEmail({
    to: email,
    subject: 'Your UoH PMS sign-in code',
    html: wrapTemplate(`
      <p>Your one-time sign-in code is:</p>
      <p style="font-family:ui-monospace,monospace;font-size:32px;font-weight:600;color:#8B2838;letter-spacing:4px;margin:24px 0;">${code}</p>
      <p style="color:#655B4D;font-size:14px;">This code expires in 10 minutes and can be used once.</p>
    `, 'Your UoH PMS sign-in code'),
    text: `Your UoH PMS sign-in code is: ${code}\n\nThis code expires in 10 minutes.`,
  });
}

async function sendEmailVerification(email, verifyLink) {
  return sendEmail({
    to: email,
    subject: 'Verify your UoH PMS email',
    html: wrapTemplate(`
      <p>Welcome to the UoH Placement Management System.</p>
      <p>Please verify your email address to activate your account:</p>
      <p style="margin:24px 0;">
        <a href="${verifyLink}" style="background:#8B2838;color:#FFFFFF;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;">Verify email</a>
      </p>
      <p style="font-size:13px;color:#655B4D;">Or paste this link into your browser:<br>${verifyLink}</p>
    `),
  });
}

async function sendCompanyApprovedEmail(email, companyName) {
  return sendEmail({
    to: email,
    subject: 'Your UoH PMS company registration is approved',
    html: wrapTemplate(`
      <p>Good news — your registration for <strong>${escapeHtml(companyName)}</strong> has been approved by the TPO.</p>
      <p>You can now sign in and start posting opportunities.</p>
      <p style="margin:24px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/login" style="background:#8B2838;color:#FFFFFF;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;">Sign in</a>
      </p>
    `),
  });
}

async function sendCompanyRejectedEmail(email, companyName, reason) {
  return sendEmail({
    to: email,
    subject: 'Update on your UoH PMS registration',
    html: wrapTemplate(`
      <p>Your registration for <strong>${escapeHtml(companyName)}</strong> was not approved at this time.</p>
      ${reason ? `<p><em>Reason:</em> ${escapeHtml(reason)}</p>` : ''}
      <p>For queries, please write to the TPO's office at placementuoh@gmail.com.</p>
    `),
  });
}

async function sendJobApprovedEmail(email, jobTitle, companyName) {
  return sendEmail({
    to: email,
    subject: `Your job posting "${jobTitle}" is live`,
    html: wrapTemplate(`
      <p>The job posting <strong>${escapeHtml(jobTitle)}</strong> for <strong>${escapeHtml(companyName)}</strong> has been approved by the TPO and is now visible to eligible students.</p>
      <p style="margin:24px 0;">
        <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/recruiter/jobs" style="background:#8B2838;color:#FFFFFF;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:500;">View your jobs</a>
      </p>
    `),
  });
}

async function sendJobRejectedEmail(email, jobTitle, reason) {
  return sendEmail({
    to: email,
    subject: `Feedback on your job posting "${jobTitle}"`,
    html: wrapTemplate(`
      <p>The job posting <strong>${escapeHtml(jobTitle)}</strong> was not approved in its current form.</p>
      ${reason ? `<p><em>Reason:</em> ${escapeHtml(reason)}</p>` : ''}
      <p>You may revise and resubmit.</p>
    `),
  });
}

async function sendApplicationConfirmationEmail(studentEmail, jobTitle, companyName) {
  return sendEmail({
    to: studentEmail,
    subject: `Application received — ${jobTitle}`,
    html: wrapTemplate(`
      <p>Your application for <strong>${escapeHtml(jobTitle)}</strong> at <strong>${escapeHtml(companyName)}</strong> has been submitted.</p>
      <p>You can track the status of this application on your dashboard.</p>
    `),
  });
}

async function sendApplicationStatusEmail(studentEmail, jobTitle, newStatus) {
  const friendly = ({
    SHORTLISTED:          'shortlisted',
    INTERVIEW_SCHEDULED:  'scheduled for interview',
    INTERVIEWED:          'marked as interviewed',
    SELECTED:             'selected',
    REJECTED:             'not selected at this stage',
    WAITLISTED:           'waitlisted',
  })[newStatus] || newStatus.toLowerCase();

  return sendEmail({
    to: studentEmail,
    subject: `Application update — ${jobTitle}`,
    html: wrapTemplate(`
      <p>Your application for <strong>${escapeHtml(jobTitle)}</strong> has been <strong>${friendly}</strong>.</p>
      <p>Sign in to view details.</p>
    `),
  });
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendEmailVerification,
  sendCompanyApprovedEmail,
  sendCompanyRejectedEmail,
  sendJobApprovedEmail,
  sendJobRejectedEmail,
  sendApplicationConfirmationEmail,
  sendApplicationStatusEmail,
};
```

**Verify:**
```bash
cd src/backend
node -e "require('./src/services/emailService').sendOTPEmail('test@example.com', '123456').then(r => console.log(r))"
# Without RESEND_API_KEY: prints dev email to console, returns {ok:true, devLogged:true}
# With RESEND_API_KEY set: actually sends email, returns {ok:true, id:'...'}
```

---

## Task 2 — Firebase Storage setup

**Goal:** prepare Firebase Storage for resume uploads, configure rules.

**File:** `src/backend/src/config/firebase.js` (extend existing — add storage export)

After the existing `const auth = admin.auth();` line, add:

```javascript
const bucket = admin.storage().bucket(process.env.FIREBASE_STORAGE_BUCKET);
```

Update the module exports:
```javascript
module.exports = { admin, db, auth, bucket };
```

Update the `initializeApp` call to include the storage bucket:

```javascript
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}
```

**File (new):** `storage.rules` at the project root (next to `firestore.rules`)

```
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Deny by default. Admin SDK (server) bypasses these rules.
    // Client SDK is not used for writes in this project.

    // Resumes: read-own, no client writes
    match /resumes/{userId}/{fileName} {
      allow read:  if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }

    // Everything else: deny
    match /{allPaths=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy:
```bash
firebase deploy --only storage:rules
```

**Verify:**
```bash
cd src/backend
node -e "require('dotenv').config(); const {bucket} = require('./src/config/firebase'); console.log('Bucket:', bucket.name);"
# Should print the bucket name matching FIREBASE_STORAGE_BUCKET
```

---

## Task 3 — Declaration controller + routes

**Goal:** Implement FR-2.6 through FR-2.10. Students can view the current PGAB declaration, sign it, and download a signed record.

**File (new):** `src/backend/src/controllers/declarationController.js`

```javascript
const crypto = require('crypto');
const { db } = require('../config/firebase');
const { COLLECTIONS, ROLES } = require('../config/constants');
const { handleValidationErrors } = require('../utils/validationHelper');

/* GET /api/declarations/current
 * Public (any authenticated user can read the current version) */
async function getCurrent(_req, res) {
  try {
    const snap = await db.collection(COLLECTIONS.DECLARATION_VERSIONS)
      .orderBy('version', 'desc').limit(1).get();
    if (snap.empty) {
      return res.status(404).json({ success: false, message: 'No declaration version configured.' });
    }
    const doc = snap.docs[0];
    return res.json({ success: true, data: { versionId: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('getCurrent declaration error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load declaration.' });
  }
}

/* GET /api/declarations/signatures/mine
 * Returns whether the authenticated Student has signed the current version */
async function getMineStatus(req, res) {
  try {
    if (req.user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Only students sign declarations.' });
    }

    // Find current version
    const versionSnap = await db.collection(COLLECTIONS.DECLARATION_VERSIONS)
      .orderBy('version', 'desc').limit(1).get();
    if (versionSnap.empty) {
      return res.json({ success: true, data: { signed: false, reason: 'no-version' } });
    }
    const currentVersionId = versionSnap.docs[0].id;
    const currentVersionNum = versionSnap.docs[0].data().version;

    // Look up signature
    const sigSnap = await db.collection(COLLECTIONS.DECLARATION_SIGNATURES)
      .where('studentId', '==', req.user.uid)
      .where('versionId', '==', currentVersionId)
      .limit(1).get();

    if (sigSnap.empty) {
      return res.json({ success: true, data: { signed: false, currentVersionId, currentVersion: currentVersionNum } });
    }

    const sig = sigSnap.docs[0].data();
    return res.json({
      success: true,
      data: {
        signed: true,
        signatureId:    sigSnap.docs[0].id,
        currentVersionId,
        currentVersion: currentVersionNum,
        signedAt:       sig.signedAt,
      },
    });
  } catch (err) {
    console.error('getMineStatus error:', err);
    return res.status(500).json({ success: false, message: 'Failed to check declaration status.' });
  }
}

/* POST /api/declarations/sign
 * Body: { versionId, typedName }
 * Records the Student's e-signature for the given version. */
async function sign(req, res) {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    if (req.user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Only students sign declarations.' });
    }

    const { versionId, typedName } = req.body;

    // Read version document
    const versionRef = db.collection(COLLECTIONS.DECLARATION_VERSIONS).doc(versionId);
    const versionDoc = await versionRef.get();
    if (!versionDoc.exists) {
      return res.status(404).json({ success: false, message: 'Declaration version not found.' });
    }

    // Verify it's the current version (don't let clients sign an old version)
    const latestSnap = await db.collection(COLLECTIONS.DECLARATION_VERSIONS)
      .orderBy('version', 'desc').limit(1).get();
    if (latestSnap.docs[0].id !== versionId) {
      return res.status(409).json({ success: false, message: 'Please sign the current version of the declaration.' });
    }

    // Duplicate signature check
    const existing = await db.collection(COLLECTIONS.DECLARATION_SIGNATURES)
      .where('studentId', '==', req.user.uid)
      .where('versionId', '==', versionId)
      .limit(1).get();
    if (!existing.empty) {
      return res.status(409).json({ success: false, message: 'You have already signed this version.' });
    }

    // Verify typed name matches the account name (case-insensitive)
    const accountName = req.user.fullName || req.user.name || '';
    if (typedName.trim().toLowerCase() !== accountName.trim().toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'The typed name must exactly match the name on your account.',
      });
    }

    const now = new Date().toISOString();
    const versionData = versionDoc.data();
    const textHash = crypto.createHash('sha256').update(versionData.text || '').digest('hex');

    const signatureDoc = {
      studentId:         req.user.uid,
      versionId,
      versionNumber:     versionData.version,
      signedAt:          now,
      ipAddress:         req.ip || req.headers['x-forwarded-for'] || null,
      typedName:         typedName.trim(),
      textSnapshotHash:  textHash,
    };

    const ref = await db.collection(COLLECTIONS.DECLARATION_SIGNATURES).add(signatureDoc);

    return res.status(201).json({
      success: true,
      message: 'Declaration signed.',
      data: { signatureId: ref.id, ...signatureDoc },
    });
  } catch (err) {
    console.error('sign declaration error:', err);
    return res.status(500).json({ success: false, message: 'Failed to record signature.' });
  }
}

/* GET /api/declarations/signatures/:signatureId/text
 * Returns the full text that was signed, for display/download. */
async function getSignedText(req, res) {
  try {
    const { signatureId } = req.params;
    const sigDoc = await db.collection(COLLECTIONS.DECLARATION_SIGNATURES).doc(signatureId).get();
    if (!sigDoc.exists) return res.status(404).json({ success: false, message: 'Signature not found.' });

    const sig = sigDoc.data();
    // Students can only view their own signature; TPO/Admin can view any.
    const isOwner = sig.studentId === req.user.uid;
    const isPriv  = [ROLES.TPO, ROLES.ADMIN].includes(req.user.role);
    if (!isOwner && !isPriv) {
      return res.status(403).json({ success: false, message: 'Not authorised to view this signature.' });
    }

    // Pull the version text
    const versionDoc = await db.collection(COLLECTIONS.DECLARATION_VERSIONS).doc(sig.versionId).get();
    if (!versionDoc.exists) return res.status(404).json({ success: false, message: 'Original version missing.' });

    return res.json({
      success: true,
      data: {
        signatureId,
        signedAt:   sig.signedAt,
        typedName:  sig.typedName,
        version:    sig.versionNumber,
        text:       versionDoc.data().text,
      },
    });
  } catch (err) {
    console.error('getSignedText error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load signed declaration.' });
  }
}

module.exports = { getCurrent, getMineStatus, sign, getSignedText };
```

**File (new):** `src/backend/src/routes/declarationRoutes.js`

```javascript
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const { authenticate } = require('../middleware/auth');
const {
  getCurrent, getMineStatus, sign, getSignedText,
} = require('../controllers/declarationController');

const signValidation = [
  body('versionId').isString().notEmpty(),
  body('typedName').isString().trim().isLength({ min: 2, max: 100 }),
];

router.get('/current',                  authenticate, getCurrent);
router.get('/signatures/mine',          authenticate, getMineStatus);
router.post('/sign',                    authenticate, signValidation, sign);
router.get('/signatures/:signatureId/text', authenticate, getSignedText);

module.exports = router;
```

**File:** `src/backend/src/app.js`

Mount the new router. Add near other `app.use('/api/...')` lines:
```javascript
const declarationRoutes = require('./routes/declarationRoutes');
app.use('/api/declarations', declarationRoutes);
```

**Verify:**
```bash
# Start backend
npm run dev

# In another terminal, with a student's ID token (from login):
curl -H "Authorization: Bearer <STUDENT_TOKEN>" http://localhost:5000/api/declarations/current
# Expect: {success:true, data:{versionId:'v1-2024-26', version:1, text:'University of Hyderabad — ...'}}

curl -H "Authorization: Bearer <STUDENT_TOKEN>" http://localhost:5000/api/declarations/signatures/mine
# Expect: {success:true, data:{signed:false, currentVersionId:'v1-2024-26', currentVersion:1}}

curl -X POST -H "Authorization: Bearer <STUDENT_TOKEN>" -H "Content-Type: application/json" \
  -d '{"versionId":"v1-2024-26","typedName":"<actual student name>"}' \
  http://localhost:5000/api/declarations/sign
# Expect: 201 {success:true, data:{signatureId:'...', ...}}

# Second call should fail with 409
```

---

## Task 4 — Student profile completion

**Goal:** Implement FR-2.1 through FR-2.5.

**File:** `src/backend/src/controllers/profileController.js`

Read the existing file first. Add these handlers (merge with existing exports):

```javascript
const { db } = require('../config/firebase');
const {
  COLLECTIONS, ROLES, ACCOUNT_STATUS,
} = require('../config/constants');
const { handleValidationErrors } = require('../utils/validationHelper');

/* GET /api/profile/me
 * Returns the user document + role-specific profile */
async function getMyProfile(req, res) {
  try {
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.user.uid).get();
    if (!userDoc.exists) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const userData = userDoc.data();
    let roleProfile = null;

    if (userData.role === ROLES.STUDENT) {
      const profDoc = await db.collection(COLLECTIONS.STUDENT_PROFILES).doc(req.user.uid).get();
      if (profDoc.exists) {
        roleProfile = profDoc.data();

        // Resolve school/department names for display
        if (roleProfile.schoolId) {
          const sDoc = await db.collection(COLLECTIONS.SCHOOLS).doc(roleProfile.schoolId).get();
          roleProfile.schoolName = sDoc.exists ? sDoc.data().name : null;
        }
        if (roleProfile.departmentId) {
          const dDoc = await db.collection(COLLECTIONS.DEPARTMENTS).doc(roleProfile.departmentId).get();
          roleProfile.departmentName = dDoc.exists ? dDoc.data().name : null;
        }
      }
    } else if (userData.role === ROLES.FACULTY) {
      const profDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(req.user.uid).get();
      if (profDoc.exists) roleProfile = profDoc.data();
    } else if (userData.role === ROLES.COMPANY) {
      const compDoc = await db.collection(COLLECTIONS.COMPANIES).doc(req.user.uid).get();
      if (compDoc.exists) roleProfile = compDoc.data();
    }

    return res.json({
      success: true,
      data: {
        user: {
          uid:      userData.uid,
          email:    userData.email,
          fullName: userData.fullName,
          role:     userData.role,
          status:   userData.status,
        },
        profile: roleProfile,
      },
    });
  } catch (err) {
    console.error('getMyProfile error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load profile.' });
  }
}

/* PATCH /api/profile/student
 * Update the Student's profile. Audit-logs CGPA/backlog/school/dept changes. */
async function updateStudentProfile(req, res) {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    if (req.user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Only students can edit a student profile.' });
    }

    const profileRef = db.collection(COLLECTIONS.STUDENT_PROFILES).doc(req.user.uid);
    const profileDoc = await profileRef.get();
    if (!profileDoc.exists) {
      return res.status(404).json({ success: false, message: 'Profile record missing.' });
    }
    const oldData = profileDoc.data();

    const allowed = [
      'rollNumber', 'schoolId', 'departmentId', 'programme',
      'joiningYear', 'graduationYear', 'cgpa', 'backlogs',
      'skills', 'phoneNumber',
    ];
    const updates = {};
    for (const k of allowed) {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    }

    // Referential integrity: check schoolId and departmentId exist if provided
    if (updates.schoolId) {
      const sDoc = await db.collection(COLLECTIONS.SCHOOLS).doc(updates.schoolId).get();
      if (!sDoc.exists) return res.status(400).json({ success: false, message: 'Invalid schoolId.' });
    }
    if (updates.departmentId) {
      const dDoc = await db.collection(COLLECTIONS.DEPARTMENTS).doc(updates.departmentId).get();
      if (!dDoc.exists) return res.status(400).json({ success: false, message: 'Invalid departmentId.' });
      // If schoolId also provided, verify department belongs to that school
      const effectiveSchool = updates.schoolId || oldData.schoolId;
      if (dDoc.data().schoolId !== effectiveSchool) {
        return res.status(400).json({ success: false, message: 'Department does not belong to the selected School.' });
      }
    }

    // Mark profileComplete true if all mandatory fields will be present after this write
    const merged = { ...oldData, ...updates };
    const mandatory = ['schoolId', 'departmentId', 'programme', 'graduationYear', 'cgpa', 'phoneNumber', 'rollNumber'];
    const nowComplete = mandatory.every((k) => {
      const v = merged[k];
      return v !== null && v !== undefined && v !== '';
    });
    updates.profileComplete = nowComplete;
    updates.updatedAt = new Date().toISOString();

    // Build profile-change history for auditable fields
    const audited = ['cgpa', 'schoolId', 'departmentId', 'backlogs'];
    const changeEntries = [];
    for (const k of audited) {
      if (updates[k] !== undefined && updates[k] !== oldData[k]) {
        changeEntries.push({ field: k, from: oldData[k] ?? null, to: updates[k], at: updates.updatedAt });
      }
    }
    if (changeEntries.length > 0) {
      updates.changeHistory = [
        ...(oldData.changeHistory || []),
        ...changeEntries,
      ].slice(-50); // keep last 50 entries
    }

    await profileRef.update(updates);

    const refreshed = await profileRef.get();
    return res.json({ success: true, message: 'Profile updated.', data: refreshed.data() });
  } catch (err) {
    console.error('updateStudentProfile error:', err);
    return res.status(500).json({ success: false, message: 'Profile update failed.' });
  }
}

module.exports = { getMyProfile, updateStudentProfile };
```

**File:** `src/backend/src/middleware/validators.js` (extend)

Add these validators:

```javascript
const { body } = require('express-validator');

const updateStudentProfileValidation = [
  body('rollNumber').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('schoolId').optional().isString().trim().notEmpty(),
  body('departmentId').optional().isString().trim().notEmpty(),
  body('programme').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('joiningYear').optional().isInt({ min: 2000, max: 2100 }),
  body('graduationYear').optional().isInt({ min: 2000, max: 2100 }),
  body('cgpa').optional().isFloat({ min: 0, max: 10 }),
  body('backlogs').optional().isInt({ min: 0, max: 50 }),
  body('skills').optional().isArray().custom((arr) => {
    if (!arr.every((s) => typeof s === 'string' && s.length > 0 && s.length <= 40)) {
      throw new Error('Each skill must be a 1–40 char string.');
    }
    return true;
  }),
  body('phoneNumber').optional().isString().trim()
    .matches(/^\+?[\d\s-]{8,20}$/).withMessage('Phone number format invalid.'),
];

// Add to exports
module.exports = {
  // ... existing exports ...
  updateStudentProfileValidation,
};
```

**File (new):** `src/backend/src/routes/profileRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getMyProfile, updateStudentProfile } = require('../controllers/profileController');
const { updateStudentProfileValidation } = require('../middleware/validators');

router.get('/me',      authenticate, getMyProfile);
router.patch('/student', authenticate, updateStudentProfileValidation, updateStudentProfile);

module.exports = router;
```

**File:** `src/backend/src/app.js`

Mount:
```javascript
const profileRoutes = require('./routes/profileRoutes');
app.use('/api/profile', profileRoutes);
```

**Verify:**
```bash
# With a Student token:
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/profile/me
# Expect: user + empty-ish studentProfile

curl -X PATCH -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d '{"rollNumber":"23MCMB01","programme":"MCA","graduationYear":2027,"cgpa":8.5,"phoneNumber":"+919876543210"}' \
  http://localhost:5000/api/profile/student
# Expect: {success:true, data:{...cgpa:8.5, profileComplete:true (if school/dept also set)}}
```

---

## Task 5 — Resume upload service

**Goal:** Implement FR-2.3. Students can upload up to 3 resume versions.

**File (new):** `src/backend/src/services/resumeService.js`

```javascript
const { bucket, db } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');
const crypto = require('crypto');

const MAX_SIZE = 5 * 1024 * 1024;   // 5 MB — SRS PR-8
const MAX_VERSIONS = 3;              // SRS PR-9

/* Upload a PDF buffer to Storage, returns a ResumeRef */
async function uploadResume(userId, buffer, originalName) {
  if (buffer.length > MAX_SIZE) {
    const err = new Error('Resume file exceeds 5 MB limit.');
    err.code = 'FILE_TOO_LARGE';
    throw err;
  }

  // Detect PDF by magic bytes (first 5 bytes: %PDF-)
  if (!buffer.slice(0, 5).toString().startsWith('%PDF-')) {
    const err = new Error('Only PDF files are accepted.');
    err.code = 'INVALID_FORMAT';
    throw err;
  }

  const versionId   = crypto.randomBytes(12).toString('hex');
  const storagePath = `resumes/${userId}/${versionId}.pdf`;
  const file        = bucket.file(storagePath);

  await file.save(buffer, {
    metadata: {
      contentType:  'application/pdf',
      metadata:     { originalName, uploadedAt: new Date().toISOString() },
    },
    resumable: false,
  });

  return {
    versionId,
    storagePath,
    originalName,
    uploadedAt: new Date().toISOString(),
    sizeBytes:  buffer.length,
  };
}

/* Manage the list on StudentProfile — keep at most MAX_VERSIONS, mark latest as default */
async function addResumeToProfile(userId, resumeRef) {
  const ref = db.collection(COLLECTIONS.STUDENT_PROFILES).doc(userId);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) throw new Error('Student profile not found.');

    const data = doc.data();
    let resumes = Array.isArray(data.resumes) ? [...data.resumes] : [];

    // Mark all existing as non-default, then add new one as default
    resumes = resumes.map((r) => ({ ...r, isDefault: false }));
    resumes.unshift({ ...resumeRef, isDefault: true });

    // Enforce cap — delete oldest from Storage as well
    const toDelete = resumes.slice(MAX_VERSIONS);
    resumes = resumes.slice(0, MAX_VERSIONS);

    for (const rr of toDelete) {
      try {
        await bucket.file(rr.storagePath).delete();
      } catch (e) {
        console.warn('Failed to delete old resume blob:', rr.storagePath, e.message);
      }
    }

    tx.update(ref, { resumes, updatedAt: new Date().toISOString() });
    return resumes;
  });
}

/* Return a time-limited signed URL so the browser can download */
async function getDownloadUrl(storagePath, ttlMinutes = 10) {
  const [url] = await bucket.file(storagePath).getSignedUrl({
    action:  'read',
    expires: Date.now() + ttlMinutes * 60 * 1000,
  });
  return url;
}

/* Switch which uploaded version is the default for applications */
async function setDefaultVersion(userId, versionId) {
  const ref = db.collection(COLLECTIONS.STUDENT_PROFILES).doc(userId);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) throw new Error('Student profile not found.');
    const resumes = Array.isArray(doc.data().resumes) ? doc.data().resumes : [];
    if (!resumes.some((r) => r.versionId === versionId)) {
      throw new Error('Version not found.');
    }
    const updated = resumes.map((r) => ({ ...r, isDefault: r.versionId === versionId }));
    tx.update(ref, { resumes: updated, updatedAt: new Date().toISOString() });
    return updated;
  });
}

/* Delete a version (both Storage blob and profile entry) */
async function deleteVersion(userId, versionId) {
  const ref = db.collection(COLLECTIONS.STUDENT_PROFILES).doc(userId);
  return db.runTransaction(async (tx) => {
    const doc = await tx.get(ref);
    if (!doc.exists) throw new Error('Student profile not found.');
    const resumes = Array.isArray(doc.data().resumes) ? doc.data().resumes : [];
    const target = resumes.find((r) => r.versionId === versionId);
    if (!target) throw new Error('Version not found.');

    try { await bucket.file(target.storagePath).delete(); }
    catch (e) { console.warn('Storage delete warn:', e.message); }

    let remaining = resumes.filter((r) => r.versionId !== versionId);
    // If we removed the default, promote the most recent remaining
    if (target.isDefault && remaining.length > 0) {
      remaining = remaining.map((r, i) => ({ ...r, isDefault: i === 0 }));
    }
    tx.update(ref, { resumes: remaining, updatedAt: new Date().toISOString() });
    return remaining;
  });
}

module.exports = {
  uploadResume, addResumeToProfile, getDownloadUrl,
  setDefaultVersion, deleteVersion,
  MAX_SIZE, MAX_VERSIONS,
};
```

**File (new):** `src/backend/src/controllers/resumeController.js`

```javascript
const multer = require('multer');
const { ROLES } = require('../config/constants');
const resumeService = require('../services/resumeService');

const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: resumeService.MAX_SIZE },
});

/* POST /api/resumes (multipart) */
async function handleUpload(req, res) {
  try {
    if (req.user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Only students upload resumes.' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file provided.' });
    }

    const resumeRef = await resumeService.uploadResume(
      req.user.uid, req.file.buffer, req.file.originalname
    );
    const resumes = await resumeService.addResumeToProfile(req.user.uid, resumeRef);

    return res.status(201).json({ success: true, data: { resumes } });
  } catch (err) {
    console.error('Resume upload error:', err);
    const status = err.code === 'FILE_TOO_LARGE' ? 413
                : err.code === 'INVALID_FORMAT'  ? 415 : 500;
    return res.status(status).json({ success: false, message: err.message || 'Upload failed.' });
  }
}

/* GET /api/resumes/:versionId/url */
async function handleGetUrl(req, res) {
  try {
    const { versionId } = req.params;
    const { db } = require('../config/firebase');
    const { COLLECTIONS, ROLES } = require('../config/constants');

    const profileDoc = await db.collection(COLLECTIONS.STUDENT_PROFILES).doc(req.user.uid).get();
    let resumes = profileDoc.exists ? (profileDoc.data().resumes || []) : [];

    // If privileged user (TPO/Admin/Company-via-application), pull from arbitrary student — separate endpoint will be added later.
    // For now, a student reads their own.
    if (req.user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Only students can fetch their own resumes here.' });
    }

    const target = resumes.find((r) => r.versionId === versionId);
    if (!target) return res.status(404).json({ success: false, message: 'Resume not found.' });

    const url = await resumeService.getDownloadUrl(target.storagePath);
    return res.json({ success: true, data: { url, expiresInMinutes: 10 } });
  } catch (err) {
    console.error('Resume URL error:', err);
    return res.status(500).json({ success: false, message: 'Failed to get URL.' });
  }
}

/* PATCH /api/resumes/:versionId/default */
async function handleSetDefault(req, res) {
  try {
    if (req.user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Only students manage their resumes.' });
    }
    const resumes = await resumeService.setDefaultVersion(req.user.uid, req.params.versionId);
    return res.json({ success: true, data: { resumes } });
  } catch (err) {
    console.error('Set default error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
}

/* DELETE /api/resumes/:versionId */
async function handleDelete(req, res) {
  try {
    if (req.user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Only students manage their resumes.' });
    }
    const resumes = await resumeService.deleteVersion(req.user.uid, req.params.versionId);
    return res.json({ success: true, data: { resumes } });
  } catch (err) {
    console.error('Delete resume error:', err);
    return res.status(400).json({ success: false, message: err.message });
  }
}

module.exports = { upload, handleUpload, handleGetUrl, handleSetDefault, handleDelete };
```

**File (new):** `src/backend/src/routes/resumeRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const {
  upload, handleUpload, handleGetUrl, handleSetDefault, handleDelete,
} = require('../controllers/resumeController');

router.post('/',                authenticate, upload.single('resume'), handleUpload);
router.get('/:versionId/url',   authenticate, handleGetUrl);
router.patch('/:versionId/default', authenticate, handleSetDefault);
router.delete('/:versionId',    authenticate, handleDelete);

module.exports = router;
```

**File:** `src/backend/src/app.js`

Mount:
```javascript
const resumeRoutes = require('./routes/resumeRoutes');
app.use('/api/resumes', resumeRoutes);
```

**Verify:**
```bash
# Upload a small test PDF
curl -X POST -H "Authorization: Bearer <STUDENT_TOKEN>" \
  -F "resume=@/path/to/test.pdf" http://localhost:5000/api/resumes
# Expect: {success:true, data:{resumes:[{versionId:..., isDefault:true}]}}

# Get URL
curl -H "Authorization: Bearer <TOKEN>" http://localhost:5000/api/resumes/<versionId>/url
# Expect: {success:true, data:{url:'https://storage.googleapis.com/...', expiresInMinutes:10}}
# The URL should be openable in a browser
```

---

## Task 6 — Company profile management

**Goal:** Approved Company users can update their own company details (name, website, description, HR contact). Pending companies cannot edit (must await approval decision).

**File (new):** `src/backend/src/controllers/companyController.js`

```javascript
const { db } = require('../config/firebase');
const { COLLECTIONS, ROLES, COMPANY_STATUS } = require('../config/constants');
const { handleValidationErrors } = require('../utils/validationHelper');

/* GET /api/companies/me */
async function getMyCompany(req, res) {
  try {
    if (req.user.role !== ROLES.COMPANY) {
      return res.status(403).json({ success: false, message: 'Not a company account.' });
    }
    const doc = await db.collection(COLLECTIONS.COMPANIES).doc(req.user.uid).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Company record missing.' });
    return res.json({ success: true, data: doc.data() });
  } catch (err) {
    console.error('getMyCompany error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load company.' });
  }
}

/* PATCH /api/companies/me */
async function updateMyCompany(req, res) {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    if (req.user.role !== ROLES.COMPANY) {
      return res.status(403).json({ success: false, message: 'Not a company account.' });
    }

    const ref = db.collection(COLLECTIONS.COMPANIES).doc(req.user.uid);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Company not found.' });

    const current = doc.data();
    if (current.status !== COMPANY_STATUS.ACTIVE) {
      return res.status(403).json({
        success: false,
        message: 'You can only edit company details after approval.',
      });
    }

    const allowed = ['companyName', 'website', 'description', 'industry', 'hrContact'];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    updates.updatedAt = new Date().toISOString();

    await ref.update(updates);
    const refreshed = await ref.get();
    return res.json({ success: true, data: refreshed.data() });
  } catch (err) {
    console.error('updateMyCompany error:', err);
    return res.status(500).json({ success: false, message: 'Update failed.' });
  }
}

/* GET /api/companies/pending   (TPO/Admin only) */
async function listPending(_req, res) {
  try {
    const snap = await db.collection(COLLECTIONS.COMPANIES)
      .where('status', '==', COMPANY_STATUS.PENDING_APPROVAL)
      .orderBy('createdAt', 'asc').get();
    return res.json({
      success: true,
      data: snap.docs.map((d) => ({ ...d.data(), companyId: d.id })),
    });
  } catch (err) {
    console.error('listPending error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list pending companies.' });
  }
}

module.exports = { getMyCompany, updateMyCompany, listPending };
```

**File (new):** `src/backend/src/routes/companyRoutes.js`

```javascript
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { getMyCompany, updateMyCompany, listPending } = require('../controllers/companyController');

const updateCompanyValidation = [
  body('companyName').optional().isString().trim().isLength({ min: 2, max: 120 }),
  body('website').optional().isURL().withMessage('Invalid URL.'),
  body('description').optional().isString().isLength({ max: 2000 }),
  body('industry').optional().isString().isLength({ max: 60 }),
  body('hrContact').optional().isObject(),
];

router.get('/me',           authenticate, authorize(ROLES.COMPANY), getMyCompany);
router.patch('/me',         authenticate, authorize(ROLES.COMPANY), updateCompanyValidation, updateMyCompany);
router.get('/pending',      authenticate, authorize(ROLES.TPO, ROLES.ADMIN), listPending);

module.exports = router;
```

**File:** `src/backend/src/app.js`

Mount:
```javascript
const companyRoutes = require('./routes/companyRoutes');
app.use('/api/companies', companyRoutes);
```

**Also:** the `approveCompany` and `rejectCompany` handlers in `adminController.js` (from Sprint 1 Task 8) should now send real emails instead of their previous stubs. Update them to require and call `emailService.sendCompanyApprovedEmail` / `sendCompanyRejectedEmail`:

Find in `adminController.js`:
```javascript
await auditLogger.log({ ... });
return res.status(200).json({ success: true, message: 'Company approved.' });
```

Change to:
```javascript
await auditLogger.log({ ... });

// Send approval email
try {
  const emailService = require('../services/emailService');
  const updatedCompany = await companyRef.get();
  await emailService.sendCompanyApprovedEmail(
    updatedCompany.data().hrContact.email,
    updatedCompany.data().companyName,
  );
} catch (e) { console.warn('Approval email failed:', e.message); }

return res.status(200).json({ success: true, message: 'Company approved.' });
```

Same pattern for rejection (call `sendCompanyRejectedEmail` with reason).

**Verify:**
```bash
# TPO: list pending
curl -H "Authorization: Bearer <TPO_TOKEN>" http://localhost:5000/api/companies/pending

# TPO: approve one
curl -X PATCH -H "Authorization: Bearer <TPO_TOKEN>" \
  http://localhost:5000/api/admin/companies/<companyId>/approve
# Expect: 200 + console log (or Resend delivery) of approval email

# Company: update profile (must be approved first)
curl -X PATCH -H "Authorization: Bearer <COMPANY_TOKEN>" -H "Content-Type: application/json" \
  -d '{"description":"Leading fintech recruiter","industry":"Finance"}' \
  http://localhost:5000/api/companies/me
```

---

## Task 7 — Job lifecycle (post + approve)

**Goal:** Implement FR-3.1 through FR-3.6. Recruiters post jobs with eligibility rules; TPO approves/rejects; students browse only approved jobs.

**File (new):** `src/backend/src/controllers/jobController.js`

```javascript
const { db } = require('../config/firebase');
const {
  COLLECTIONS, ROLES, COMPANY_STATUS, AUDIT_ACTION,
} = require('../config/constants');
const { handleValidationErrors } = require('../utils/validationHelper');
const auditLogger = require('../services/auditLogger');
const emailService = require('../services/emailService');

const JOB_STATUS = {
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  OPEN:             'OPEN',
  CLOSED:           'CLOSED',
  REJECTED:         'REJECTED',
  WITHDRAWN:        'WITHDRAWN',
};

/* POST /api/jobs — Recruiter creates */
async function createJob(req, res) {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    if (req.user.role !== ROLES.COMPANY) {
      return res.status(403).json({ success: false, message: 'Only recruiters post jobs.' });
    }

    // Verify the company is ACTIVE
    const companyDoc = await db.collection(COLLECTIONS.COMPANIES).doc(req.user.uid).get();
    if (!companyDoc.exists || companyDoc.data().status !== COMPANY_STATUS.ACTIVE) {
      return res.status(403).json({ success: false, message: 'Your company must be approved before posting jobs.' });
    }

    const {
      title, description, location, employmentType, ctcPerAnnum, deadline,
      eligibility,
    } = req.body;

    // Validate eligibility references
    const { schools = [], departments = [] } = eligibility || {};
    if (schools.length > 0) {
      for (const sid of schools) {
        const s = await db.collection(COLLECTIONS.SCHOOLS).doc(sid).get();
        if (!s.exists) return res.status(400).json({ success: false, message: `Invalid schoolId: ${sid}` });
      }
    }
    if (departments.length > 0) {
      for (const did of departments) {
        const d = await db.collection(COLLECTIONS.DEPARTMENTS).doc(did).get();
        if (!d.exists) return res.status(400).json({ success: false, message: `Invalid departmentId: ${did}` });
      }
    }

    const now = new Date().toISOString();
    const jobDoc = {
      companyId:    req.user.uid,
      companyName:  companyDoc.data().companyName,
      title,
      description,
      location,
      employmentType,
      ctcPerAnnum:  Number(ctcPerAnnum),
      deadline,
      eligibility: {
        schools:         eligibility?.schools || [],
        departments:     eligibility?.departments || [],
        programmes:      eligibility?.programmes || [],
        graduationYears: eligibility?.graduationYears || [],
        minCgpa:         eligibility?.minCgpa ?? 0,
        maxBacklogs:     eligibility?.maxBacklogs ?? 99,
      },
      status:       JOB_STATUS.PENDING_APPROVAL,
      postedAt:     now,
      approvedAt:   null,
      createdAt:    now,
      updatedAt:    now,
    };

    const ref = await db.collection(COLLECTIONS.JOBS).add(jobDoc);
    return res.status(201).json({ success: true, data: { jobId: ref.id, ...jobDoc } });
  } catch (err) {
    console.error('createJob error:', err);
    return res.status(500).json({ success: false, message: 'Failed to create job.' });
  }
}

/* GET /api/jobs/mine — Recruiter's own jobs */
async function listMyJobs(req, res) {
  try {
    if (req.user.role !== ROLES.COMPANY) {
      return res.status(403).json({ success: false, message: 'Not a recruiter.' });
    }
    const snap = await db.collection(COLLECTIONS.JOBS)
      .where('companyId', '==', req.user.uid)
      .orderBy('createdAt', 'desc').get();
    return res.json({
      success: true,
      data: snap.docs.map((d) => ({ jobId: d.id, ...d.data() })),
    });
  } catch (err) {
    console.error('listMyJobs error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list jobs.' });
  }
}

/* GET /api/jobs/pending — TPO */
async function listPending(_req, res) {
  try {
    const snap = await db.collection(COLLECTIONS.JOBS)
      .where('status', '==', JOB_STATUS.PENDING_APPROVAL)
      .orderBy('postedAt', 'asc').get();
    return res.json({
      success: true,
      data: snap.docs.map((d) => ({ jobId: d.id, ...d.data() })),
    });
  } catch (err) {
    console.error('listPending error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list pending jobs.' });
  }
}

/* PATCH /api/jobs/:jobId/approve — TPO */
async function approveJob(req, res) {
  try {
    const { jobId } = req.params;
    const jobRef = db.collection(COLLECTIONS.JOBS).doc(jobId);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (jobDoc.data().status !== JOB_STATUS.PENDING_APPROVAL) {
      return res.status(409).json({ success: false, message: 'Job is not in pending state.' });
    }

    const now = new Date().toISOString();
    await jobRef.update({
      status:     JOB_STATUS.OPEN,
      approvedAt: now,
      approvedBy: req.user.uid,
      updatedAt:  now,
    });

    await auditLogger.log({
      actorUserId: req.user.uid, actorRole: req.user.role,
      actionType:  AUDIT_ACTION.APPROVE_JOB,
      targetType:  'job', targetId: jobId,
      payloadSummary: `Approved: ${jobDoc.data().title}`,
      ipAddress:   req.ip,
    });

    // Notify recruiter
    try {
      const companyDoc = await db.collection(COLLECTIONS.COMPANIES).doc(jobDoc.data().companyId).get();
      if (companyDoc.exists) {
        await emailService.sendJobApprovedEmail(
          companyDoc.data().hrContact.email,
          jobDoc.data().title,
          companyDoc.data().companyName,
        );
      }
    } catch (e) { console.warn('Job approval email failed:', e.message); }

    return res.json({ success: true, message: 'Job approved.' });
  } catch (err) {
    console.error('approveJob error:', err);
    return res.status(500).json({ success: false, message: 'Approval failed.' });
  }
}

/* PATCH /api/jobs/:jobId/reject — TPO */
async function rejectJob(req, res) {
  try {
    const { jobId } = req.params;
    const { reason } = req.body;
    const jobRef = db.collection(COLLECTIONS.JOBS).doc(jobId);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) return res.status(404).json({ success: false, message: 'Job not found.' });

    const now = new Date().toISOString();
    await jobRef.update({
      status:          JOB_STATUS.REJECTED,
      rejectionReason: reason || null,
      updatedAt:       now,
    });

    await auditLogger.log({
      actorUserId: req.user.uid, actorRole: req.user.role,
      actionType:  AUDIT_ACTION.REJECT_JOB,
      targetType:  'job', targetId: jobId,
      payloadSummary: reason || 'Rejected.',
      ipAddress:   req.ip,
    });

    try {
      const companyDoc = await db.collection(COLLECTIONS.COMPANIES).doc(jobDoc.data().companyId).get();
      if (companyDoc.exists) {
        await emailService.sendJobRejectedEmail(
          companyDoc.data().hrContact.email,
          jobDoc.data().title,
          reason,
        );
      }
    } catch (e) { console.warn('Job rejection email failed:', e.message); }

    return res.json({ success: true, message: 'Job rejected.' });
  } catch (err) {
    console.error('rejectJob error:', err);
    return res.status(500).json({ success: false, message: 'Rejection failed.' });
  }
}

/* PATCH /api/jobs/:jobId/withdraw — Recruiter withdraws own job */
async function withdrawJob(req, res) {
  try {
    const { jobId } = req.params;
    const jobRef = db.collection(COLLECTIONS.JOBS).doc(jobId);
    const jobDoc = await jobRef.get();
    if (!jobDoc.exists) return res.status(404).json({ success: false, message: 'Job not found.' });
    if (jobDoc.data().companyId !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'You can only withdraw your own jobs.' });
    }

    await jobRef.update({
      status:    JOB_STATUS.WITHDRAWN,
      updatedAt: new Date().toISOString(),
    });
    return res.json({ success: true, message: 'Job withdrawn.' });
  } catch (err) {
    console.error('withdrawJob error:', err);
    return res.status(500).json({ success: false, message: 'Withdrawal failed.' });
  }
}

/* GET /api/jobs/eligible — Student's eligible jobs (FR-4.1) */
async function listEligible(req, res) {
  try {
    if (req.user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Only students browse jobs.' });
    }

    const profDoc = await db.collection(COLLECTIONS.STUDENT_PROFILES).doc(req.user.uid).get();
    if (!profDoc.exists || !profDoc.data().profileComplete) {
      return res.status(400).json({
        success: false,
        message: 'Complete your profile before browsing eligible jobs.',
        code:    'PROFILE_INCOMPLETE',
      });
    }
    const profile = profDoc.data();

    // Check active blacklist
    const blSnap = await db.collection(COLLECTIONS.BLACKLISTS)
      .where('studentId', '==', req.user.uid)
      .where('status',    '==', 'ACTIVE').get();
    const onBlacklist = !blSnap.empty;

    const jobSnap = await db.collection(COLLECTIONS.JOBS)
      .where('status', '==', JOB_STATUS.OPEN).get();
    const now = new Date();

    const eligible = [];
    for (const d of jobSnap.docs) {
      const job = d.data();
      const elig = job.eligibility || {};

      if (new Date(job.deadline) < now) continue;
      if (elig.schools && elig.schools.length > 0 && !elig.schools.includes(profile.schoolId)) continue;
      if (elig.departments && elig.departments.length > 0 && !elig.departments.includes(profile.departmentId)) continue;
      if (elig.programmes && elig.programmes.length > 0 && !elig.programmes.includes(profile.programme)) continue;
      if (elig.graduationYears && elig.graduationYears.length > 0 && !elig.graduationYears.includes(profile.graduationYear)) continue;
      if (elig.minCgpa !== undefined && profile.cgpa < elig.minCgpa) continue;
      if (elig.maxBacklogs !== undefined && profile.backlogs > elig.maxBacklogs) continue;
      if (onBlacklist) continue;

      eligible.push({ jobId: d.id, ...job });
    }

    eligible.sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));
    return res.json({ success: true, data: eligible, meta: { onBlacklist } });
  } catch (err) {
    console.error('listEligible error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load eligible jobs.' });
  }
}

/* GET /api/jobs/:jobId — anyone authenticated can see a specific job (eligibility still enforces apply) */
async function getJob(req, res) {
  try {
    const { jobId } = req.params;
    const doc = await db.collection(COLLECTIONS.JOBS).doc(jobId).get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Job not found.' });
    return res.json({ success: true, data: { jobId: doc.id, ...doc.data() } });
  } catch (err) {
    console.error('getJob error:', err);
    return res.status(500).json({ success: false, message: 'Failed to load job.' });
  }
}

module.exports = {
  createJob, listMyJobs, listPending, approveJob, rejectJob,
  withdrawJob, listEligible, getJob,
};
```

**File:** `src/backend/src/middleware/validators.js` (extend)

```javascript
const createJobValidation = [
  body('title').isString().trim().isLength({ min: 3, max: 120 }),
  body('description').isString().isLength({ min: 20, max: 10000 }),
  body('location').isString().trim().isLength({ min: 1, max: 120 }),
  body('employmentType').isIn(['FULL_TIME', 'INTERNSHIP', 'PPO']),
  body('ctcPerAnnum').isFloat({ min: 0 }),
  body('deadline').isISO8601().withMessage('Deadline must be ISO 8601.'),
  body('eligibility').isObject(),
  body('eligibility.minCgpa').optional().isFloat({ min: 0, max: 10 }),
  body('eligibility.maxBacklogs').optional().isInt({ min: 0, max: 50 }),
  body('eligibility.schools').optional().isArray(),
  body('eligibility.departments').optional().isArray(),
  body('eligibility.programmes').optional().isArray(),
  body('eligibility.graduationYears').optional().isArray(),
];

module.exports = {
  // ... existing ...
  createJobValidation,
};
```

**File (new):** `src/backend/src/routes/jobRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const { createJobValidation } = require('../middleware/validators');
const {
  createJob, listMyJobs, listPending, approveJob, rejectJob,
  withdrawJob, listEligible, getJob,
} = require('../controllers/jobController');

router.post('/',                 authenticate, authorize(ROLES.COMPANY), createJobValidation, createJob);
router.get('/mine',              authenticate, authorize(ROLES.COMPANY), listMyJobs);
router.get('/pending',           authenticate, authorize(ROLES.TPO, ROLES.ADMIN), listPending);
router.get('/eligible',          authenticate, authorize(ROLES.STUDENT), listEligible);
router.get('/:jobId',            authenticate, getJob);
router.patch('/:jobId/approve',  authenticate, authorize(ROLES.TPO, ROLES.ADMIN), approveJob);
router.patch('/:jobId/reject',   authenticate, authorize(ROLES.TPO, ROLES.ADMIN), rejectJob);
router.patch('/:jobId/withdraw', authenticate, authorize(ROLES.COMPANY), withdrawJob);

module.exports = router;
```

**File:** `src/backend/src/app.js`
```javascript
const jobRoutes = require('./routes/jobRoutes');
app.use('/api/jobs', jobRoutes);
```

**Verify:** end-to-end job lifecycle via curl — recruiter posts → TPO approves → student browses eligible.

---

## Task 8 — Application processing

**Goal:** Implement FR-4.1 through FR-4.6. Students apply to jobs with declaration gate; recruiters update status.

**File (new):** `src/backend/src/controllers/applicationController.js`

```javascript
const { db } = require('../config/firebase');
const { COLLECTIONS, ROLES } = require('../config/constants');
const emailService = require('../services/emailService');

const APPLICATION_STATUS = {
  APPLIED:               'APPLIED',
  SHORTLISTED:           'SHORTLISTED',
  INTERVIEW_SCHEDULED:   'INTERVIEW_SCHEDULED',
  INTERVIEWED:           'INTERVIEWED',
  SELECTED:              'SELECTED',
  REJECTED:              'REJECTED',
  WAITLISTED:            'WAITLISTED',
  WITHDRAWN_STUDENT:     'WITHDRAWN_STUDENT',
  WITHDRAWN_SYSTEM:      'WITHDRAWN_SYSTEM',
};

const ALLOWED_STATUS_TRANSITIONS = {
  APPLIED:              ['SHORTLISTED', 'REJECTED', 'WAITLISTED', 'WITHDRAWN_STUDENT'],
  SHORTLISTED:          ['INTERVIEW_SCHEDULED', 'REJECTED', 'WITHDRAWN_STUDENT'],
  INTERVIEW_SCHEDULED:  ['INTERVIEWED', 'WITHDRAWN_STUDENT'],
  INTERVIEWED:          ['SELECTED', 'REJECTED', 'WAITLISTED'],
  WAITLISTED:           ['SELECTED', 'REJECTED'],
};

/* POST /api/applications  { jobId } */
async function apply(req, res) {
  try {
    if (req.user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Only students apply.' });
    }
    const { jobId } = req.body;
    if (!jobId) return res.status(400).json({ success: false, message: 'jobId required.' });

    // Declaration gate (FR-2.10)
    const versionSnap = await db.collection(COLLECTIONS.DECLARATION_VERSIONS)
      .orderBy('version', 'desc').limit(1).get();
    if (versionSnap.empty) {
      return res.status(500).json({ success: false, message: 'No declaration configured.' });
    }
    const currentVersionId = versionSnap.docs[0].id;

    const sigSnap = await db.collection(COLLECTIONS.DECLARATION_SIGNATURES)
      .where('studentId', '==', req.user.uid)
      .where('versionId', '==', currentVersionId).limit(1).get();
    if (sigSnap.empty) {
      return res.status(409).json({
        success: false,
        message: 'Please sign the current PGAB declaration before applying.',
        code:    'DECLARATION_REQUIRED',
      });
    }

    // Run the whole "read, validate, write" in a transaction
    const result = await db.runTransaction(async (tx) => {
      const jobRef = db.collection(COLLECTIONS.JOBS).doc(jobId);
      const profRef = db.collection(COLLECTIONS.STUDENT_PROFILES).doc(req.user.uid);

      const [jobDoc, profDoc] = await Promise.all([tx.get(jobRef), tx.get(profRef)]);
      if (!jobDoc.exists)  throw httpErr(404, 'Job not found.');
      if (!profDoc.exists) throw httpErr(404, 'Student profile not found.');

      const job = jobDoc.data();
      const profile = profDoc.data();

      if (job.status !== 'OPEN')           throw httpErr(409, 'Job is no longer open for applications.');
      if (new Date(job.deadline) < new Date()) throw httpErr(409, 'Deadline has passed.');
      if (!profile.profileComplete)        throw httpErr(400, 'Complete your profile first.');

      // Re-verify eligibility
      const elig = job.eligibility || {};
      if (elig.schools?.length > 0 && !elig.schools.includes(profile.schoolId))
        throw httpErr(403, 'Not eligible: School does not match.');
      if (elig.departments?.length > 0 && !elig.departments.includes(profile.departmentId))
        throw httpErr(403, 'Not eligible: Department does not match.');
      if (elig.programmes?.length > 0 && !elig.programmes.includes(profile.programme))
        throw httpErr(403, 'Not eligible: Programme does not match.');
      if (elig.graduationYears?.length > 0 && !elig.graduationYears.includes(profile.graduationYear))
        throw httpErr(403, 'Not eligible: Graduation year does not match.');
      if (elig.minCgpa !== undefined && profile.cgpa < elig.minCgpa)
        throw httpErr(403, `Not eligible: Minimum CGPA is ${elig.minCgpa}.`);
      if (elig.maxBacklogs !== undefined && profile.backlogs > elig.maxBacklogs)
        throw httpErr(403, `Not eligible: Max backlogs allowed is ${elig.maxBacklogs}.`);

      // Active blacklist check
      const blSnap = await db.collection(COLLECTIONS.BLACKLISTS)
        .where('studentId', '==', req.user.uid)
        .where('status', '==', 'ACTIVE').get();
      if (!blSnap.empty) throw httpErr(403, 'You are currently blacklisted and cannot apply.');

      // Duplicate check
      const dupSnap = await db.collection(COLLECTIONS.APPLICATIONS)
        .where('studentId', '==', req.user.uid)
        .where('jobId', '==', jobId).limit(1).get();
      if (!dupSnap.empty) throw httpErr(409, 'You have already applied to this job.');

      // Default resume version
      const resumes = profile.resumes || [];
      const defaultResume = resumes.find((r) => r.isDefault);
      if (!defaultResume) throw httpErr(400, 'Upload a resume before applying.');

      // Create the application
      const now = new Date().toISOString();
      const appRef = db.collection(COLLECTIONS.APPLICATIONS).doc();
      const appDoc = {
        jobId,
        studentId:        req.user.uid,
        studentName:      profile.rollNumber || '',        // denormalised for admin lists
        studentSchoolId:  profile.schoolId,
        studentDeptId:    profile.departmentId,
        resumeVersionId:  defaultResume.versionId,
        resumeStoragePath: defaultResume.storagePath,
        status:           APPLICATION_STATUS.APPLIED,
        statusHistory:    [{ status: APPLICATION_STATUS.APPLIED, changedAt: now, changedBy: req.user.uid }],
        appliedAt:        now,
        createdAt:        now,
        updatedAt:        now,
        facultyEndorsement: null,
        companyId:        job.companyId,
        jobTitle:         job.title,
        companyName:      job.companyName,
      };
      tx.set(appRef, appDoc);
      return { applicationId: appRef.id, ...appDoc };
    });

    // Post-transaction: fire-and-forget email
    try {
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(req.user.uid).get();
      if (userDoc.exists) {
        await emailService.sendApplicationConfirmationEmail(
          userDoc.data().email, result.jobTitle, result.companyName,
        );
      }
    } catch (e) { console.warn('Confirmation email failed:', e.message); }

    return res.status(201).json({ success: true, data: result });
  } catch (err) {
    if (err.http) return res.status(err.http).json({ success: false, message: err.message });
    console.error('apply error:', err);
    return res.status(500).json({ success: false, message: 'Application failed.' });
  }
}

/* GET /api/applications/mine  — Student's own applications */
async function listMyApplications(req, res) {
  try {
    if (req.user.role !== ROLES.STUDENT) {
      return res.status(403).json({ success: false, message: 'Students only.' });
    }
    const snap = await db.collection(COLLECTIONS.APPLICATIONS)
      .where('studentId', '==', req.user.uid)
      .orderBy('appliedAt', 'desc').get();
    return res.json({
      success: true,
      data: snap.docs.map((d) => ({ applicationId: d.id, ...d.data() })),
    });
  } catch (err) {
    console.error('listMyApplications error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list applications.' });
  }
}

/* GET /api/applications/job/:jobId — Recruiter sees applicants to their own job */
async function listApplicantsForJob(req, res) {
  try {
    const { jobId } = req.params;
    const jobDoc = await db.collection(COLLECTIONS.JOBS).doc(jobId).get();
    if (!jobDoc.exists) return res.status(404).json({ success: false, message: 'Job not found.' });

    const isOwner = jobDoc.data().companyId === req.user.uid;
    const isPriv  = [ROLES.TPO, ROLES.ADMIN].includes(req.user.role);
    if (!isOwner && !isPriv) {
      return res.status(403).json({ success: false, message: 'Not authorised to view these applicants.' });
    }

    const snap = await db.collection(COLLECTIONS.APPLICATIONS)
      .where('jobId', '==', jobId)
      .orderBy('appliedAt', 'asc').get();
    return res.json({
      success: true,
      data: snap.docs.map((d) => ({ applicationId: d.id, ...d.data() })),
    });
  } catch (err) {
    console.error('listApplicantsForJob error:', err);
    return res.status(500).json({ success: false, message: 'Failed to list applicants.' });
  }
}

/* PATCH /api/applications/:id/status  { status } — Recruiter updates */
async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status: newStatus, reason } = req.body;

    if (!ALLOWED_STATUS_TRANSITIONS[newStatus] && !Object.values(APPLICATION_STATUS).includes(newStatus)) {
      return res.status(400).json({ success: false, message: `Invalid status: ${newStatus}` });
    }

    const appRef = db.collection(COLLECTIONS.APPLICATIONS).doc(id);
    const appDoc = await appRef.get();
    if (!appDoc.exists) return res.status(404).json({ success: false, message: 'Application not found.' });

    const app = appDoc.data();

    // Authz: only the job's company, TPO, or Admin can change status
    const isOwner = app.companyId === req.user.uid;
    const isPriv  = [ROLES.TPO, ROLES.ADMIN].includes(req.user.role);
    if (!isOwner && !isPriv) {
      return res.status(403).json({ success: false, message: 'Not authorised.' });
    }

    // Transition check (Recruiters can move only along allowed paths; Admin/TPO can force)
    if (isOwner && !isPriv) {
      const allowed = ALLOWED_STATUS_TRANSITIONS[app.status] || [];
      if (!allowed.includes(newStatus)) {
        return res.status(409).json({
          success: false,
          message: `Cannot transition from ${app.status} to ${newStatus}.`,
        });
      }
    }

    const now = new Date().toISOString();
    await appRef.update({
      status:        newStatus,
      statusHistory: [...app.statusHistory, { status: newStatus, changedAt: now, changedBy: req.user.uid, reason: reason || null }],
      updatedAt:     now,
    });

    // Notify student
    try {
      const userDoc = await db.collection(COLLECTIONS.USERS).doc(app.studentId).get();
      if (userDoc.exists) {
        await emailService.sendApplicationStatusEmail(userDoc.data().email, app.jobTitle, newStatus);
      }
    } catch (e) { console.warn('Status email failed:', e.message); }

    return res.json({ success: true, message: 'Status updated.' });
  } catch (err) {
    console.error('updateStatus error:', err);
    return res.status(500).json({ success: false, message: 'Status update failed.' });
  }
}

/* PATCH /api/applications/:id/withdraw — Student withdraws */
async function withdrawMine(req, res) {
  try {
    const { id } = req.params;
    const ref = db.collection(COLLECTIONS.APPLICATIONS).doc(id);
    const doc = await ref.get();
    if (!doc.exists) return res.status(404).json({ success: false, message: 'Application not found.' });
    const app = doc.data();

    if (app.studentId !== req.user.uid) {
      return res.status(403).json({ success: false, message: 'Not your application.' });
    }
    if (app.status === 'SELECTED') {
      return res.status(409).json({ success: false, message: 'Cannot withdraw after selection.' });
    }
    if (app.status.startsWith('WITHDRAWN')) {
      return res.status(409).json({ success: false, message: 'Already withdrawn.' });
    }

    const now = new Date().toISOString();
    await ref.update({
      status:        APPLICATION_STATUS.WITHDRAWN_STUDENT,
      statusHistory: [...app.statusHistory, { status: APPLICATION_STATUS.WITHDRAWN_STUDENT, changedAt: now, changedBy: req.user.uid }],
      updatedAt:     now,
    });
    return res.json({ success: true, message: 'Application withdrawn.' });
  } catch (err) {
    console.error('withdrawMine error:', err);
    return res.status(500).json({ success: false, message: 'Withdrawal failed.' });
  }
}

function httpErr(http, message) { const e = new Error(message); e.http = http; return e; }

module.exports = { apply, listMyApplications, listApplicantsForJob, updateStatus, withdrawMine };
```

**File (new):** `src/backend/src/routes/applicationRoutes.js`

```javascript
const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  apply, listMyApplications, listApplicantsForJob, updateStatus, withdrawMine,
} = require('../controllers/applicationController');

router.post('/',                   authenticate, authorize(ROLES.STUDENT), apply);
router.get('/mine',                authenticate, authorize(ROLES.STUDENT), listMyApplications);
router.get('/job/:jobId',          authenticate, listApplicantsForJob);
router.patch('/:id/status',        authenticate, updateStatus);
router.patch('/:id/withdraw',      authenticate, authorize(ROLES.STUDENT), withdrawMine);

module.exports = router;
```

**File:** `src/backend/src/app.js`
```javascript
const applicationRoutes = require('./routes/applicationRoutes');
app.use('/api/applications', applicationRoutes);
```

**Verify:** full flow — student applies without signing declaration (should 409), signs declaration, applies (should 201), duplicate application (should 409), recruiter fetches applicants, updates status (student should receive email).

---

## Task 9 — Frontend API service extensions

**File:** `src/frontend/src/services/api.js`

Add these to the exports (append to existing `authAPI`, `adminAPI`):

```javascript
export const profileAPI = {
  getMine: (token) => apiRequest('/profile/me', { token }),
  updateStudent: (token, data) =>
    apiRequest('/profile/student', { method: 'PATCH', token, body: data }),
};

export const declarationAPI = {
  getCurrent: (token) => apiRequest('/declarations/current', { token }),
  getMineStatus: (token) => apiRequest('/declarations/signatures/mine', { token }),
  sign: (token, versionId, typedName) =>
    apiRequest('/declarations/sign', {
      method: 'POST', token,
      body: { versionId, typedName },
    }),
};

export const resumeAPI = {
  upload: async (token, file) => {
    const form = new FormData();
    form.append('resume', file);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const res = await fetch(`${API_URL}/resumes`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    const data = await res.json();
    if (!res.ok) { const e = new Error(data.message); e.data = data; throw e; }
    return data;
  },
  getUrl: (token, versionId) => apiRequest(`/resumes/${versionId}/url`, { token }),
  setDefault: (token, versionId) => apiRequest(`/resumes/${versionId}/default`, { method: 'PATCH', token }),
  remove: (token, versionId) => apiRequest(`/resumes/${versionId}`, { method: 'DELETE', token }),
};

export const companyAPI = {
  getMine: (token) => apiRequest('/companies/me', { token }),
  updateMine: (token, data) => apiRequest('/companies/me', { method: 'PATCH', token, body: data }),
  listPending: (token) => apiRequest('/companies/pending', { token }),
};

export const jobAPI = {
  create: (token, data) => apiRequest('/jobs', { method: 'POST', token, body: data }),
  listMine: (token) => apiRequest('/jobs/mine', { token }),
  listPending: (token) => apiRequest('/jobs/pending', { token }),
  listEligible: (token) => apiRequest('/jobs/eligible', { token }),
  getById: (token, jobId) => apiRequest(`/jobs/${jobId}`, { token }),
  approve: (token, jobId) => apiRequest(`/jobs/${jobId}/approve`, { method: 'PATCH', token }),
  reject: (token, jobId, reason) => apiRequest(`/jobs/${jobId}/reject`, { method: 'PATCH', token, body: { reason } }),
  withdraw: (token, jobId) => apiRequest(`/jobs/${jobId}/withdraw`, { method: 'PATCH', token }),
};

export const applicationAPI = {
  apply: (token, jobId) => apiRequest('/applications', { method: 'POST', token, body: { jobId } }),
  listMine: (token) => apiRequest('/applications/mine', { token }),
  listForJob: (token, jobId) => apiRequest(`/applications/job/${jobId}`, { token }),
  updateStatus: (token, id, status, reason) =>
    apiRequest(`/applications/${id}/status`, { method: 'PATCH', token, body: { status, reason } }),
  withdraw: (token, id) => apiRequest(`/applications/${id}/withdraw`, { method: 'PATCH', token }),
};
```

---

## Task 10 — Shared UI primitives (additions)

**File (new):** `src/frontend/src/components/ui/Modal.jsx`

```jsx
import { motion, AnimatePresence } from 'motion/react';
import { HiOutlineX } from 'react-icons/hi';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  const widths = { sm: 'max-w-md', md: 'max-w-xl', lg: 'max-w-3xl', xl: 'max-w-5xl' };
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/50 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`card w-full ${widths[size]} max-h-[90vh] overflow-hidden flex flex-col`}
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-header flex items-center justify-between">
              <h2 className="font-display text-xl font-semibold text-ink-800">{title}</h2>
              <button onClick={onClose} className="p-1 hover:bg-cream-200 rounded-md">
                <HiOutlineX className="w-5 h-5 text-ink-500" />
              </button>
            </div>
            <div className="card-body flex-1 overflow-y-auto">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

**File (new):** `src/frontend/src/components/ui/EmptyState.jsx`

```jsx
export default function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="text-center py-16 px-6">
      {Icon && <Icon className="w-12 h-12 text-ink-300 mx-auto mb-4" />}
      <h3 className="font-display text-xl font-semibold text-ink-800 mb-2">{title}</h3>
      {body && <p className="text-ink-500 max-w-md mx-auto">{body}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
```

**File (new):** `src/frontend/src/components/ui/Tag.jsx`

```jsx
export default function Tag({ children, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-maroon-50 text-maroon-700 text-xs font-medium rounded-md border border-maroon-100">
      {children}
      {onRemove && (
        <button onClick={onRemove} className="ml-1 hover:text-maroon-900">×</button>
      )}
    </span>
  );
}
```

Update the barrel at `src/frontend/src/components/ui/index.js`:
```javascript
export { default as Modal }      from './Modal';
export { default as EmptyState } from './EmptyState';
export { default as Tag }        from './Tag';
```

---

## Tasks 11–22: Frontend pages

These are lengthy React files. **Claude Code should implement each page carefully**, one at a time, using the patterns already established in `LoginPage.jsx` (the design-system primitives). I'll describe each page specifically rather than dump thousands of lines.

### Task 11 — StudentDashboard layout

**File (new):** `src/frontend/src/layouts/DashboardLayout.jsx`

A shell layout with: UoH-branded top nav (sticky), sidebar or horizontal tab nav, main content area. Uses the same maroon-dark header with `Logo` variant="light".

**Nav items by role:**
- **Student:** Dashboard (home) · Profile · Browse Jobs · My Applications · Sign out
- **Recruiter:** Dashboard · My Jobs · Post Job · Company Profile · Sign out
- **TPO:** Dashboard · Pending Companies · Pending Jobs · Analytics · Sign out
- **Admin:** Dashboard · Users · Audit Log · Sign out

Pulls `role` from `AuthContext`. Signed-in email + role badge shown in top-right. Uses `<NavLink>` from react-router-dom for active state.

### Task 12 — DeclarationModal

**File:** `src/frontend/src/components/declaration/DeclarationModal.jsx`

Modal component. On mount, fetches `declarationAPI.getCurrent()`. Shows scrollable text area with the declaration. Below: checkbox "I have read and agree...", text input for full name (labelled "Type your full name as it appears on your account"), submit button.

Submit calls `declarationAPI.sign(token, versionId, typedName)`. On 400 (name mismatch), surface the error. On success, close modal and call `onSigned` callback.

Consumer:
```jsx
<DeclarationModal
  open={showDecl}
  onClose={() => setShowDecl(false)}
  onSigned={() => { toast.success('Declaration signed.'); refreshStatus(); }}
/>
```

### Task 13 — StudentProfilePage

**File (new):** `src/frontend/src/pages/student/ProfilePage.jsx`

Three sections in a column layout:

1. **Account Info (read-only)** — name, email, role, status badge
2. **Academic Details (editable form)** — School select, Department select (cascading), Programme, Joining year, Graduation year, CGPA, Backlogs, Phone. Uses `profileAPI.updateStudent()`. Shows inline validation errors. School/department dropdowns populated from `/api/reference/schools` and filtered-by-school.
3. **Skills (tag editor)** — input + "Add" button. Shows Tags with × to remove. Max 20 skills.
4. **Resumes** — list of up to 3 resume cards. Each card shows file name, upload date, "Download" button (calls `resumeAPI.getUrl` and opens URL), "Set default" radio, "Delete" button. File-drop area at the top using `react-dropzone`: "Drag a PDF here or click to choose. Max 5 MB."

Hero banner at the top: if `profileComplete === false`, show warning Alert: "Complete your profile to start applying to jobs."
Separately, if declaration not signed, show info Alert with button: "Sign the PGAB declaration" → opens `<DeclarationModal>`.

### Task 14 — BrowseJobsPage

**File (new):** `src/frontend/src/pages/student/BrowseJobsPage.jsx`

On mount: check profile completeness and declaration status. If either missing, show a locked-state `EmptyState` with CTAs to complete.

If both green: call `jobAPI.listEligible(token)`. Render as a grid of cards, each showing:
- Company name (small gold uppercase)
- Job title (display serif, bold)
- Location + employment type pills
- CTC (formatted: ₹12.5 LPA)
- Brief description excerpt (first 200 chars)
- Deadline (relative: "Deadline in 5 days")
- "View details" button → navigates to `/student/jobs/:jobId`

Filters at top: search by title, filter by employment type, sort by deadline/CTC. Use local state — don't hit the API on every filter change.

Empty state when no eligible jobs.

### Task 15 — JobDetailPage

**File (new):** `src/frontend/src/pages/student/JobDetailPage.jsx`

Two-column layout. Left column (wide): full job info — title, description rendered with `react-markdown` (+ `remark-gfm` for tables), eligibility rules, CTC, location, deadline, posted-on date. Right column (narrow, sticky): Apply card with a big "Apply to this job" button.

On Apply click: verify declaration signed (via cached AuthContext state) + profile complete + resume uploaded, else show errors. If all green, call `applicationAPI.apply(token, jobId)`. On 409 with `DECLARATION_REQUIRED` error code, open `<DeclarationModal>`. On success, show toast + change button to "Applied ✓" + navigate to `/student/applications`.

If student already applied (check `applicationAPI.listMine` — cache in context), show "Already Applied" with status badge.

### Task 16 — MyApplicationsPage

**File (new):** `src/frontend/src/pages/student/MyApplicationsPage.jsx`

Calls `applicationAPI.listMine(token)`. Renders as a table with columns: Job title / Company / Applied on / Status badge / Actions.

Actions: "View job" (link), "Withdraw" (only if status allows — hide on SELECTED/WITHDRAWN). Withdraw opens a confirmation modal ("This cannot be undone") then calls `applicationAPI.withdraw`.

Use `<Badge status={status} />` — it already maps to semantic colours automatically.

### Task 17 — PostJobPage (Recruiter)

**File (new):** `src/frontend/src/pages/recruiter/PostJobPage.jsx`

Multi-section form wizard:

1. **Basics:** Title, Employment type select, Location
2. **Description:** Markdown textarea with live preview (split pane). Character count (20-10,000).
3. **Compensation:** CTC per annum (numeric input with ₹ prefix), Application deadline (date input, min = today)
4. **Eligibility:** Multi-select for Schools (from `/api/reference/schools`), cascading Departments multi-select, Programmes multi-select (free text add), Graduation years chip selector, Min CGPA slider (0-10, step 0.1), Max backlogs numeric (0-10)

Submit → `jobAPI.create(token, data)` → on success, navigate to `/recruiter/jobs` with toast "Job submitted for TPO approval".

**Important:** Markdown preview uses `react-markdown` with `remark-gfm`. Render inside a container with `className="prose prose-sm max-w-none"` — requires `@tailwindcss/typography` plugin. **Check if the plugin is installed**, if not, install and add to `tailwind.config.js` plugins.

```bash
cd src/frontend
npm install -D @tailwindcss/typography
```

And in `tailwind.config.js`:
```javascript
plugins: [require('@tailwindcss/typography')],
```

### Task 18 — MyJobsPage (Recruiter)

Table: Title / Status badge / Posted / Deadline / Applicants count / Actions. Actions: "View applicants" (only when status=OPEN or CLOSED), "Withdraw" (only when status=OPEN or PENDING_APPROVAL).

Clicking applicants count navigates to `/recruiter/jobs/:jobId/applicants` showing full list with status update dropdown on each row.

### Task 19 — PendingCompaniesPage (TPO)

**File (new):** `src/frontend/src/pages/tpo/PendingCompaniesPage.jsx`

Calls `companyAPI.listPending(token)`. For each pending company: card with name, website, description, HR contact, registration date. Two buttons: Approve (calls `/api/admin/companies/:id/approve` — note this uses the existing Sprint 1 admin endpoint), Reject (opens modal for reason, then calls reject endpoint).

After action, remove from list + toast confirmation.

### Task 20 — PendingJobsPage (TPO)

Same pattern as PendingCompanies but for jobs. Each card shows the full job description (truncated with "read more") + eligibility summary. Approve/Reject buttons.

### Task 21 — Router updates

**File:** `src/frontend/src/App.jsx`

Add all the new routes under a `ProtectedRoute` that checks authentication + role:

```jsx
{/* Student */}
<Route element={<ProtectedRoute allowedRoles={['STUDENT']} />}>
  <Route path="/student" element={<DashboardLayout />}>
    <Route index         element={<StudentHomePage />} />
    <Route path="profile"     element={<ProfilePage />} />
    <Route path="jobs"        element={<BrowseJobsPage />} />
    <Route path="jobs/:jobId" element={<JobDetailPage />} />
    <Route path="applications" element={<MyApplicationsPage />} />
  </Route>
</Route>

{/* Recruiter */}
<Route element={<ProtectedRoute allowedRoles={['COMPANY']} />}>
  <Route path="/recruiter" element={<DashboardLayout />}>
    <Route index        element={<RecruiterHomePage />} />
    <Route path="jobs"      element={<MyJobsPage />} />
    <Route path="jobs/new"  element={<PostJobPage />} />
    <Route path="jobs/:jobId/applicants" element={<JobApplicantsPage />} />
    <Route path="company"   element={<CompanyProfilePage />} />
  </Route>
</Route>

{/* TPO */}
<Route element={<ProtectedRoute allowedRoles={['TPO', 'ADMIN']} />}>
  <Route path="/tpo" element={<DashboardLayout />}>
    <Route index        element={<TPOHomePage />} />
    <Route path="companies/pending" element={<PendingCompaniesPage />} />
    <Route path="jobs/pending"      element={<PendingJobsPage />} />
  </Route>
</Route>
```

Update `ProtectedRoute` to support `allowedRoles` array:

```jsx
export default function ProtectedRoute({ allowedRoles }) {
  const { userProfile, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!userProfile) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
```

After login, redirect by role:
```javascript
// In VerifyOTPPage after successful OTP:
const roleHome = {
  STUDENT: '/student',
  COMPANY: '/recruiter',
  TPO:     '/tpo',
  ADMIN:   '/tpo',  // admin uses TPO console in Sprint 2; own console in Sprint 4
}[response.data.role] || '/';
navigate(roleHome, { replace: true });
```

---

## Task 22 — Tests

For each backend feature, write 2-5 Jest tests in `src/backend/tests/`. Follow the existing mock pattern in `tests/setup.js`.

**Files to create:**
- `tests/declaration.test.js` — 4 tests: getCurrent returns latest, getMineStatus detects unsigned, sign happy path, sign rejects wrong name
- `tests/profile.test.js` — 3 tests: updateStudentProfile rejects invalid CGPA, marks profileComplete when all fields present, audits CGPA change
- `tests/resume.test.js` — 3 tests: rejects non-PDF, enforces size limit, marks latest as default
- `tests/jobs.test.js` — 5 tests: createJob sets PENDING, non-approved company can't post, listEligible filters correctly, approveJob transitions state, rejectJob prevents re-approval
- `tests/applications.test.js` — 5 tests: apply blocked without declaration, apply blocked if CGPA below min, apply blocked if duplicate, updateStatus rejects invalid transitions, withdrawMine prevents after SELECTED

**Do not write exhaustive tests — target 2-5 per feature focused on the critical correctness paths.** Claude Code should follow the exact style of existing tests in the codebase.

Run:
```bash
cd src/backend
npm test -- --coverage
```

Target: 70%+ line coverage on controllers and services. If coverage is lower, add 1-2 more tests per under-covered file.

---

## Final smoke test (end-to-end manual)

Do this sequence in the browser after all tasks complete:

1. Register as student `s1@uohyd.ac.in` — verify email link in console/inbox — click → ACTIVE
2. Sign in → receive OTP email → enter OTP → land at `/student`
3. Navigate to Profile — empty state with banners ("complete profile", "sign declaration")
4. Click "Sign declaration" — read modal, type name, submit — banner disappears
5. Fill out profile form — save — `profileComplete` indicator turns green
6. Upload a test PDF resume — see it in resume list with default indicator
7. Register a company `c1@acme.com` — see "pending approval" message
8. Seed a TPO account via `node src/scripts/seedAdmin.js` with ADMIN role (already in Sprint 1) — provision TPO via admin endpoint
9. Log in as TPO — see pending company at `/tpo/companies/pending` — approve
10. Company email arrives — company can now sign in
11. Company posts a job — sees "pending approval" status
12. TPO approves the job
13. Back as Student — Browse Jobs — see the approved job
14. Click job — read details — click Apply — application created
15. Check `/student/applications` — see APPLIED
16. Back as Company — see applicant list with the student's name, resume link, status dropdown
17. Company moves to SHORTLISTED — student gets email, status updates in real time on /student/applications

Each of these should work without errors.

---

## What to tell the reviewer

> "Sprint 2 delivers the core student-to-application workflow end-to-end. A Student registers, verifies their email, signs the PGAB self-declaration electronically (with signature versioning, IP capture, and a SHA-256 hash of the text at signing time — all auditable per SRS §3.4), completes their academic profile, uploads a resume (PDF, 5 MB cap, up to 3 versions kept in Firebase Storage), browses jobs filtered by eligibility rules, and applies in one click.
>
> A Recruiter, after company approval by the TPO, posts a job with per-eligibility rules. The TPO reviews and approves or rejects. Every privileged action — company approval, job approval, status changes — writes to an append-only audit log. Real email delivery via Resend handles registration, approvals, rejections, and application-status notifications. The application creation runs inside a Firestore transaction that re-validates eligibility and checks the declaration gate, so race conditions between a profile edit and an application submission can't produce an inconsistent state.
>
> Frontend is organised by role: separate dashboard routes for Student, Recruiter, and TPO, each using the shared design system components built earlier. Every data entity in SRS §3.4 that was defined for this sprint now has a corresponding Firestore collection and a CRUD surface. The remaining features — Scheduling, Analytics, Blacklist UI, Audit Log viewer — are scheduled for Sprints 3 and 4."

---

*End of Sprint 2 brief. ~2,800 lines. Expected Claude Code execution: 10-15 hours across 1-2 sessions.*
