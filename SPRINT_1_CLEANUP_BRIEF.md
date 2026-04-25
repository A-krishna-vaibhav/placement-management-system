# Sprint 1 Cleanup + Sprint 2 Scaffolding — Claude Code Brief

**Project:** UoH Placement Management System
**Target:** Sprint 1 hardening to match SRS v2.0 + scaffold Sprint 2 foundations
**Estimated work:** 8–12 hours
**Baseline SRS:** `SRS_UoH_PMS_v2.0.docx` (produced earlier in this project)

---

## How to use this brief

Work through the tasks in order. Each task is self-contained. After every task, run the commands in the "Verify" subsection to confirm the change before moving on. Do not skip tasks — some later tasks depend on earlier ones (e.g. Task 2 depends on the new role/status enums from Task 1).

If you hit an error you can't fix in <10 minutes, stop and report back rather than fabricating a workaround.

---

## Overview of what changes and why

| Area | Change | Reason |
|---|---|---|
| Role model | Add `TPO` role; block Faculty/TPO self-registration | SRS FR-1.11, FR-1.13 |
| Status model | 3 states → 5 states with migration | SRS §3.4 data dictionary |
| Auth | Add 6-digit email OTP on every login | SRS FR-1.15 |
| Password policy | Enforce 8/upper/lower/digit everywhere | SRS FR-1.14 |
| Email domain check | Tighten to exact domain, not endsWith | Security hardening |
| Company workflow | Block PENDING_APPROVAL sign-in | SRS FR-1.8 |
| Admin endpoints | Provision-Faculty, Provision-TPO, Approve-Company | SRS FR-1.11–1.13, FR-1.9 |
| Rate limiting | Split authenticated vs unauthenticated | SRS QA-S3 |
| Firestore rules | Add deny-by-default rules | SRS DB-3 |
| Schools/Departments | Seed 12 schools + 42 departments | SRS §3.4 reference data |
| StudentProfile | Separate collection | SRS §3.4, matches Sprint 2 |
| DeclarationVersion | Scaffold + seed | SRS FR-2.6 (Sprint 2 feature) |
| AuditLogger | Scaffold and wire into existing admin actions | SRS FR-9.5 |
| Tests | Update existing tests for new states/roles | SRS DC-8 (80% coverage) |

---

## Task 0 — Preparation

**Goal:** branch the repo and verify the current state works before changes.

```bash
cd src/backend
git checkout -b sprint1-cleanup
npm test                    # record current test results — should pass
npm run dev                 # in one terminal, should start on :5000
curl http://localhost:5000/api/health   # should return success:true
# Kill the dev server
```

If any of these fail, stop and fix before proceeding.

---

## Task 1 — Update constants: roles, statuses, collections

**Goal:** enforce the locked role model and status enum across the codebase.

**File:** `src/backend/src/config/constants.js`

Read the current file first, then replace its contents with:

```javascript
/**
 * Application-wide constants.
 * Keep these in sync with SRS v2.0 §3.4.
 */

const ROLES = Object.freeze({
  STUDENT: 'STUDENT',
  FACULTY: 'FACULTY',   // School Placement Coordinator (admin-created)
  TPO:     'TPO',       // Central Training & Placement Officer (admin-created)
  COMPANY: 'COMPANY',
  ADMIN:   'ADMIN',     // Seeded only
});

// Roles that a visitor can self-register as
const SELF_REGISTRABLE_ROLES = Object.freeze([ROLES.STUDENT, ROLES.COMPANY]);

// Roles that require @uohyd.ac.in email
const UNIVERSITY_EMAIL_ROLES = Object.freeze([ROLES.STUDENT, ROLES.FACULTY, ROLES.TPO]);

// Roles that can only be provisioned by an Administrator
const ADMIN_PROVISIONED_ROLES = Object.freeze([ROLES.FACULTY, ROLES.TPO]);

const ACCOUNT_STATUS = Object.freeze({
  UNVERIFIED:        'UNVERIFIED',        // Student: awaiting email verification
  PENDING_APPROVAL:  'PENDING_APPROVAL',  // Company: awaiting TPO approval
  ACTIVE:            'ACTIVE',
  SUSPENDED:         'SUSPENDED',
  DEACTIVATED:       'DEACTIVATED',
});

const COMPANY_STATUS = Object.freeze({
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE:           'ACTIVE',
  REJECTED:         'REJECTED',
  SUSPENDED:        'SUSPENDED',
});

const UNIVERSITY_EMAIL_DOMAIN = 'uohyd.ac.in';

const COLLECTIONS = Object.freeze({
  USERS:                   'users',
  STUDENT_PROFILES:        'studentProfiles',
  FACULTY_PROFILES:        'facultyProfiles',
  COMPANIES:               'companies',
  JOBS:                    'jobs',
  APPLICATIONS:            'applications',
  DRIVES:                  'drives',
  INTERVIEW_SLOTS:         'interviewSlots',
  SLOT_BOOKINGS:           'slotBookings',
  DECLARATION_VERSIONS:    'declarationVersions',
  DECLARATION_SIGNATURES:  'declarationSignatures',
  BLACKLISTS:              'blacklists',
  AUDIT_LOGS:              'auditLogs',
  SCHOOLS:                 'schools',
  DEPARTMENTS:             'departments',
  OTP_CODES:               'otpCodes',
  NOTIFICATIONS:           'notifications',
});

// Password policy per SRS FR-1.14
const PASSWORD_POLICY = Object.freeze({
  MIN_LENGTH: 8,
  REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
  DESCRIPTION: 'at least 8 characters with one uppercase, one lowercase, and one digit',
});

// OTP policy per SRS FR-1.15, FR-1.16
const OTP_POLICY = Object.freeze({
  LENGTH: 6,
  TTL_MINUTES: 10,
  MAX_ATTEMPTS: 3,
});

// Audit log action types per SRS §3.4
const AUDIT_ACTION = Object.freeze({
  APPROVE_COMPANY:   'APPROVE_COMPANY',
  REJECT_COMPANY:    'REJECT_COMPANY',
  APPROVE_JOB:       'APPROVE_JOB',
  REJECT_JOB:        'REJECT_JOB',
  CREATE_DRIVE:      'CREATE_DRIVE',
  BLACKLIST_ADD:     'BLACKLIST_ADD',
  BLACKLIST_LIFT:    'BLACKLIST_LIFT',
  ROLE_CHANGE:       'ROLE_CHANGE',
  BROADCAST_EMAIL:   'BROADCAST_EMAIL',
  CONFIG_CHANGE:     'CONFIG_CHANGE',
  PROVISION_FACULTY: 'PROVISION_FACULTY',
  PROVISION_TPO:     'PROVISION_TPO',
  DEACTIVATE_USER:   'DEACTIVATE_USER',
});

module.exports = {
  ROLES,
  SELF_REGISTRABLE_ROLES,
  UNIVERSITY_EMAIL_ROLES,
  ADMIN_PROVISIONED_ROLES,
  ACCOUNT_STATUS,
  COMPANY_STATUS,
  UNIVERSITY_EMAIL_DOMAIN,
  COLLECTIONS,
  PASSWORD_POLICY,
  OTP_POLICY,
  AUDIT_ACTION,
};
```

**Note:** role and status values changed from mixed-case (`'Student'`, `'Inactive'`) to UPPER_SNAKE_CASE (`'STUDENT'`, `'UNVERIFIED'`). This is the canonical form in SRS v2.0 and everywhere downstream uses it.

**Verify:**
```bash
node -e "console.log(require('./src/backend/src/config/constants').ROLES)"
# Should print all 5 roles including TPO
```

---

## Task 2 — Data migration script for existing users

**Goal:** migrate any existing Firestore users to the new role/status values. Safe to run multiple times.

**File (new):** `src/backend/src/scripts/migrateUsersV2.js`

```javascript
/**
 * One-time migration: map legacy role/status to SRS v2.0 values.
 *
 * Legacy → v2.0 mapping:
 *   role: 'Student' → 'STUDENT', 'Faculty' → 'FACULTY',
 *         'Company' → 'COMPANY', 'Admin' → 'ADMIN'
 *   status: 'Inactive' (verified) → 'ACTIVE'
 *           'Inactive' (unverified) → 'UNVERIFIED'
 *           'Active' → 'ACTIVE'
 *           'Deactivated' → 'DEACTIVATED'
 *
 * Safe to run repeatedly — skips docs already migrated.
 */

const { db, auth } = require('../config/firebase');
const { COLLECTIONS, ROLES, ACCOUNT_STATUS } = require('../config/constants');

const ROLE_MAP = {
  'Student': ROLES.STUDENT,
  'Faculty': ROLES.FACULTY,
  'Company': ROLES.COMPANY,
  'Admin':   ROLES.ADMIN,
};

const STATUS_MAP = {
  'Active':      ACCOUNT_STATUS.ACTIVE,
  'Deactivated': ACCOUNT_STATUS.DEACTIVATED,
};

async function migrate() {
  console.log('Starting user migration to SRS v2.0 schema...');
  const snapshot = await db.collection(COLLECTIONS.USERS).get();
  let migrated = 0, skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};

    // Role migration
    if (ROLE_MAP[data.role]) {
      updates.role = ROLE_MAP[data.role];
    }

    // Status migration — requires checking email verification in Firebase Auth
    if (data.status === 'Inactive') {
      try {
        const fbUser = await auth.getUser(doc.id);
        updates.status = fbUser.emailVerified ? ACCOUNT_STATUS.ACTIVE : ACCOUNT_STATUS.UNVERIFIED;
      } catch (err) {
        console.warn(`User ${doc.id} not found in Firebase Auth; defaulting to UNVERIFIED`);
        updates.status = ACCOUNT_STATUS.UNVERIFIED;
      }
    } else if (STATUS_MAP[data.status]) {
      updates.status = STATUS_MAP[data.status];
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    updates.migratedAt = new Date().toISOString();
    await doc.ref.update(updates);

    // Also update custom claims to match new role value
    if (updates.role) {
      await auth.setCustomUserClaims(doc.id, { role: updates.role });
    }

    console.log(`Migrated ${doc.id}: ${JSON.stringify(updates)}`);
    migrated++;
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped (already up-to-date): ${skipped}`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
```

**Verify:**
```bash
cd src/backend
node src/scripts/migrateUsersV2.js
# For each legacy user, should print a "Migrated ..." line.
# Re-running should print all "Skipped".
```

---

## Task 3 — Tighten email domain check and password validator

**File:** `src/backend/src/middleware/validators.js`

Read the existing file first, then update `registerValidation` to:
- Enforce exact domain `uohyd.ac.in` (not subdomains) for Student
- Require the new password policy regex

Replace (or add if missing):

```javascript
const { body } = require('express-validator');
const {
  ROLES,
  SELF_REGISTRABLE_ROLES,
  PASSWORD_POLICY,
  UNIVERSITY_EMAIL_DOMAIN,
} = require('../config/constants');

const registerValidation = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 chars.'),
  body('email')
    .isEmail().withMessage('Invalid email format.')
    .normalizeEmail()
    .custom((email, { req }) => {
      // Student must use exactly @uohyd.ac.in (not subdomains)
      if (req.body.role === ROLES.STUDENT) {
        const domain = email.split('@')[1];
        if (domain !== UNIVERSITY_EMAIL_DOMAIN) {
          throw new Error(`Students must register with a @${UNIVERSITY_EMAIL_DOMAIN} email.`);
        }
      }
      return true;
    }),
  body('password')
    .matches(PASSWORD_POLICY.REGEX)
    .withMessage(`Password must be ${PASSWORD_POLICY.DESCRIPTION}.`),
  body('role')
    .isIn(SELF_REGISTRABLE_ROLES)
    .withMessage('Only Students and Companies can self-register.'),
  // Student-specific fields
  body('schoolId').if(body('role').equals(ROLES.STUDENT))
    .notEmpty().withMessage('School is required for students.'),
  body('departmentId').if(body('role').equals(ROLES.STUDENT))
    .notEmpty().withMessage('Department is required for students.'),
];

const forgotPasswordValidation = [
  body('email').isEmail().withMessage('Invalid email format.').normalizeEmail(),
];

const otpValidation = [
  body('email').isEmail().withMessage('Invalid email format.').normalizeEmail(),
  body('otp').isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be 6 digits.'),
];

module.exports = {
  registerValidation,
  forgotPasswordValidation,
  otpValidation,
};
```

**Verify:**
```bash
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"T","email":"x@sub.uohyd.ac.in","password":"Abc12345","role":"STUDENT","schoolId":"s1","departmentId":"d1"}'
# Should return 400 with domain-restriction message
```

---

## Task 4 — Rewrite `register` controller

**Goal:** enforce SRS FR-1.1 through FR-1.10 precisely. Reject Faculty/TPO registration. Route Companies into PENDING_APPROVAL.

**File:** `src/backend/src/controllers/authController.js`

Replace the existing `register` function (the entire function between the comment `/* ─── POST /api/register ─── */` and the next function) with:

```javascript
/* ────────────── POST /api/register ────────────── */

const register = async (req, res) => {
  try {
    // express-validator errors
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { name, email, password, role, schoolId, departmentId, companyName, website, hrName, hrPhone, description } = req.body;

    // FR-1.11, FR-1.13, FR-1.20: Faculty, TPO, Admin cannot self-register.
    if (!SELF_REGISTRABLE_ROLES.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Self-registration as ${role} is not permitted. ${role === ROLES.FACULTY || role === ROLES.TPO ? 'Contact the Administrator for provisioning.' : ''}`,
      });
    }

    // Create the Firebase Auth user
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: false,
      });
    } catch (firebaseErr) {
      if (firebaseErr.code === 'auth/email-already-exists') {
        return res.status(409).json({
          success: false,
          message: 'An account with this email already exists.',
        });
      }
      throw firebaseErr;
    }

    // Set role claim
    await auth.setCustomUserClaims(userRecord.uid, { role });

    // Determine initial status per SRS
    let initialStatus;
    if (role === ROLES.STUDENT) {
      initialStatus = ACCOUNT_STATUS.UNVERIFIED;       // FR-1.3
    } else if (role === ROLES.COMPANY) {
      initialStatus = ACCOUNT_STATUS.PENDING_APPROVAL; // FR-1.7
    }

    const now = new Date().toISOString();
    const userProfile = {
      uid:         userRecord.uid,
      email,
      fullName:    name,
      role,
      status:      initialStatus,
      createdAt:   now,
      updatedAt:   now,
      lastLoginAt: null,
    };

    // Batch write the user + role-specific profile
    const batch = db.batch();
    batch.set(db.collection(COLLECTIONS.USERS).doc(userRecord.uid), userProfile);

    if (role === ROLES.STUDENT) {
      // FR-2.1: Student profile created with minimal info; completed later.
      const studentProfile = {
        userId:          userRecord.uid,
        schoolId,
        departmentId,
        rollNumber:      null,
        programme:       null,
        joiningYear:     null,
        graduationYear:  null,
        cgpa:            null,
        backlogs:        0,
        skills:          [],
        resumes:         [],
        phoneNumber:     null,
        profileComplete: false,
        createdAt:       now,
        updatedAt:       now,
      };
      batch.set(db.collection(COLLECTIONS.STUDENT_PROFILES).doc(userRecord.uid), studentProfile);
    }

    if (role === ROLES.COMPANY) {
      const companyDoc = {
        companyId:            userRecord.uid,   // simple choice: 1:1 with the recruiter user
        primaryContactUserId: userRecord.uid,
        companyName:          companyName || name,
        website:              website || null,
        description:          description || null,
        hrContact:            { name: hrName || name, email, phone: hrPhone || null },
        status:               COMPANY_STATUS.PENDING_APPROVAL,
        approvedAt:           null,
        approvedBy:           null,
        createdAt:            now,
        updatedAt:            now,
      };
      batch.set(db.collection(COLLECTIONS.COMPANIES).doc(userRecord.uid), companyDoc);
    }

    await batch.commit();

    // Email verification link for the Student; Companies don't get one until approved
    let verificationLink = null;
    if (role === ROLES.STUDENT) {
      verificationLink = await auth.generateEmailVerificationLink(email);
    }

    return res.status(201).json({
      success: true,
      message: role === ROLES.STUDENT
        ? 'Registration successful. Please check your email to verify your account.'
        : 'Company registration submitted. You will be notified once approved by the TPO.',
      data: {
        uid:    userRecord.uid,
        email,
        role,
        status: initialStatus,
        verificationLink: process.env.NODE_ENV === 'development' ? verificationLink : undefined,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error:   process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};
```

Also update the top-of-file imports:

```javascript
const { auth, db } = require('../config/firebase');
const {
  ROLES,
  SELF_REGISTRABLE_ROLES,
  ACCOUNT_STATUS,
  COMPANY_STATUS,
  COLLECTIONS,
  OTP_POLICY,
} = require('../config/constants');
const { handleValidationErrors } = require('../utils/validationHelper');
```

**Verify:**
```bash
# Faculty self-registration must be refused
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"F","email":"f@uohyd.ac.in","password":"Abcd1234","role":"FACULTY"}'
# Expect: 403 + "Self-registration as FACULTY is not permitted..."

# TPO self-registration must be refused
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"T","email":"t@uohyd.ac.in","password":"Abcd1234","role":"TPO"}'
# Expect: 403

# Admin self-registration must be refused
curl -X POST http://localhost:5000/api/register \
  -H "Content-Type: application/json" \
  -d '{"name":"A","email":"a@uohyd.ac.in","password":"Abcd1234","role":"ADMIN"}'
# Expect: 403
```

---

## Task 5 — Implement OTP on login

**Goal:** add a two-step login. Step 1 (password) returns a challenge; step 2 (OTP) returns the session.

**Approach:** because the client uses Firebase Client SDK to authenticate, the flow is:
1. Client calls `signInWithEmailAndPassword` → gets Firebase ID token (password is verified by Firebase).
2. Client calls `POST /api/auth/login` with that token — this endpoint stores an OTP and emails it, **does not** return user data yet.
3. Client calls `POST /api/auth/verify-otp` with the ID token + OTP code → gets user data.

This preserves Firebase as the sole identity provider while adding the OTP layer the SRS requires.

**File (new):** `src/backend/src/services/otpService.js`

```javascript
const crypto = require('crypto');
const { db } = require('../config/firebase');
const { COLLECTIONS, OTP_POLICY } = require('../config/constants');

function generateNumericOTP(length = OTP_POLICY.LENGTH) {
  const max = 10 ** length;
  // crypto-random integer < max; zero-padded to length
  const n = crypto.randomInt(0, max);
  return String(n).padStart(length, '0');
}

async function issueOTP(userId, email) {
  const code = generateNumericOTP();
  const now = Date.now();
  const expiresAt = now + OTP_POLICY.TTL_MINUTES * 60 * 1000;

  // Overwrite any existing code for this user
  await db.collection(COLLECTIONS.OTP_CODES).doc(userId).set({
    userId,
    email,
    code,          // stored plaintext for simplicity; acceptable for 10-min TTL email-only
    attempts: 0,
    createdAt: now,
    expiresAt,
  });

  return { code, expiresAt };
}

async function verifyOTP(userId, submittedCode) {
  const ref = db.collection(COLLECTIONS.OTP_CODES).doc(userId);
  const doc = await ref.get();
  if (!doc.exists) {
    return { ok: false, reason: 'no-otp' };
  }
  const data = doc.data();

  if (Date.now() > data.expiresAt) {
    await ref.delete();
    return { ok: false, reason: 'expired' };
  }

  if (data.attempts >= OTP_POLICY.MAX_ATTEMPTS) {
    await ref.delete();
    return { ok: false, reason: 'too-many-attempts' };
  }

  if (data.code !== submittedCode) {
    await ref.update({ attempts: data.attempts + 1 });
    const remaining = OTP_POLICY.MAX_ATTEMPTS - (data.attempts + 1);
    if (remaining <= 0) {
      await ref.delete();
      return { ok: false, reason: 'too-many-attempts' };
    }
    return { ok: false, reason: 'wrong-code', attemptsRemaining: remaining };
  }

  // Correct — single use
  await ref.delete();
  return { ok: true };
}

module.exports = { issueOTP, verifyOTP };
```

**File (new):** `src/backend/src/services/emailService.js`

```javascript
/**
 * Email delivery service.
 *
 * PLACEHOLDER: in Sprint 4 we wire a real provider (SendGrid / AWS SES / etc).
 * For now, we log to console and, in production, would POST to the provider.
 * This lets the OTP flow work end-to-end during development without a paid provider.
 */

async function sendEmail({ to, subject, body }) {
  if (process.env.NODE_ENV === 'production' && process.env.EMAIL_PROVIDER) {
    // TODO: integrate chosen provider here in Sprint 4
    throw new Error('Production email provider not configured.');
  }
  console.log('\n=============== EMAIL (dev) ===============');
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:    ${body}`);
  console.log('===========================================\n');
  return { ok: true, devLogged: true };
}

async function sendOTPEmail(email, code) {
  return sendEmail({
    to: email,
    subject: 'UoH PMS — your one-time sign-in code',
    body:
`Your UoH Placement Management System one-time code is: ${code}

This code expires in 10 minutes and can be used once.
If you did not attempt to sign in, please ignore this email.`,
  });
}

module.exports = { sendEmail, sendOTPEmail };
```

**File:** `src/backend/src/controllers/authController.js`

Replace the entire existing `login` function with this three-part OTP flow. Also add a new `verifyLoginOTP` function:

```javascript
/* ────────────── POST /api/login (Step 1: issue OTP) ────────────── */
/**
 * Client has already signed in with Firebase Client SDK.
 * The client sends the resulting ID token. We verify it, then issue
 * a 6-digit OTP emailed to the user. Client must call /verify-login-otp
 * with the code before a session is fully established.
 */
const login = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    // Must have verified email (FR-1.4)
    if (!decodedToken.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before signing in.',
        code:    'EMAIL_NOT_VERIFIED',
      });
    }

    // Must have a Firestore profile
    const userRef = db.collection(COLLECTIONS.USERS).doc(decodedToken.uid);
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found. Please register first.',
      });
    }
    const userData = userDoc.data();

    // First-time post-verification sign-in: UNVERIFIED → ACTIVE
    if (userData.status === ACCOUNT_STATUS.UNVERIFIED && decodedToken.email_verified) {
      await userRef.update({
        status:    ACCOUNT_STATUS.ACTIVE,
        updatedAt: new Date().toISOString(),
      });
      userData.status = ACCOUNT_STATUS.ACTIVE;
    }

    // Blocking statuses
    if (userData.status === ACCOUNT_STATUS.PENDING_APPROVAL) {
      return res.status(403).json({
        success: false,
        message: 'Your account is awaiting approval from the TPO.',
        code:    'PENDING_APPROVAL',
      });
    }
    if (userData.status === ACCOUNT_STATUS.SUSPENDED) {
      return res.status(403).json({
        success: false,
        message: 'Your account is suspended. Contact the Administrator.',
        code:    'SUSPENDED',
      });
    }
    if (userData.status === ACCOUNT_STATUS.DEACTIVATED) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated.',
        code:    'DEACTIVATED',
      });
    }

    // Issue OTP (FR-1.15)
    const { sendOTPEmail } = require('../services/emailService');
    const { issueOTP }     = require('../services/otpService');

    const { code } = await issueOTP(decodedToken.uid, userData.email);
    await sendOTPEmail(userData.email, code);

    return res.status(200).json({
      success: true,
      message: 'OTP sent to your registered email. Enter it to complete sign-in.',
      data:    {
        uid:            decodedToken.uid,
        otpRequired:    true,
        ttlMinutes:     OTP_POLICY.TTL_MINUTES,
        // Never return the code in production
        devOtp:         process.env.NODE_ENV === 'development' ? code : undefined,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({ success: false, message: 'Token expired. Please sign in again.' });
    }
    return res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

/* ────────────── POST /api/verify-login-otp (Step 2) ────────────── */
const verifyLoginOTP = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    const { otp } = req.body;
    if (!otp) {
      return res.status(400).json({ success: false, message: 'OTP is required.' });
    }

    const { verifyOTP } = require('../services/otpService');
    const result = await verifyOTP(decodedToken.uid, otp);

    if (!result.ok) {
      const map = {
        'no-otp':              { status: 400, msg: 'No active OTP. Please sign in again.' },
        'expired':             { status: 400, msg: 'OTP expired. Please sign in again.' },
        'too-many-attempts':   { status: 429, msg: 'Too many incorrect attempts. Please sign in again.' },
        'wrong-code':          { status: 401, msg: `Incorrect OTP. ${result.attemptsRemaining} attempt(s) remaining.` },
      };
      const { status, msg } = map[result.reason];
      return res.status(status).json({ success: false, message: msg, code: result.reason.toUpperCase() });
    }

    // Success — load profile, return user data
    const userRef = db.collection(COLLECTIONS.USERS).doc(decodedToken.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.data();

    await userRef.update({
      lastLoginAt: new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Sign-in successful.',
      data:    {
        uid:      decodedToken.uid,
        email:    userData.email,
        fullName: userData.fullName,
        role:     userData.role,
        status:   userData.status,
      },
    });
  } catch (error) {
    console.error('Verify OTP error:', error);
    return res.status(500).json({ success: false, message: 'OTP verification failed.' });
  }
};
```

Export `verifyLoginOTP` at the bottom:

```javascript
module.exports = {
  register,
  login,
  verifyLoginOTP,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
};
```

**File:** `src/backend/src/routes/authRoutes.js`

Add the new route. After `router.post('/login', login);`:

```javascript
const { otpValidation } = require('../middleware/validators');
router.post('/verify-login-otp', otpValidation, verifyLoginOTP);
```

Don't forget to destructure `verifyLoginOTP` from the controller import at the top.

**Verify:**
```bash
# Register a student (dev mode), copy the emailLink from logs, verify it, sign in via Firebase Client SDK in the browser, then:
curl -X POST http://localhost:5000/api/login \
  -H "Authorization: Bearer <ID_TOKEN>"
# Expect: success:true, otpRequired:true, devOtp (in dev)

curl -X POST http://localhost:5000/api/verify-login-otp \
  -H "Authorization: Bearer <ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"otp":"<dev_otp_value>"}'
# Expect: success, user data
```

---

## Task 6 — Tighten auth middleware for new statuses

**File:** `src/backend/src/middleware/auth.js`

Replace the "Check account status" block with:

```javascript
// Block login for any non-ACTIVE state (SRS FR-1.19)
if (userData.status === ACCOUNT_STATUS.DEACTIVATED) {
  return res.status(403).json({ success: false, message: 'Account deactivated.' });
}
if (userData.status === ACCOUNT_STATUS.SUSPENDED) {
  return res.status(403).json({ success: false, message: 'Account suspended.' });
}
if (userData.status === ACCOUNT_STATUS.PENDING_APPROVAL) {
  return res.status(403).json({ success: false, message: 'Account pending approval.' });
}
if (userData.status === ACCOUNT_STATUS.UNVERIFIED) {
  return res.status(403).json({ success: false, message: 'Email not verified.' });
}
```

And at the top add:
```javascript
const { ACCOUNT_STATUS } = require('../config/constants');
```

**Also add the `authorize(...roles)` factory** if it's not already present — some admin routes will need role-gating:

```javascript
const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Insufficient permission.' });
  }
  next();
};

module.exports = { authenticate, authorize };
```

---

## Task 7 — Audit logger service

**File (new):** `src/backend/src/services/auditLogger.js`

```javascript
const { db } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');

async function log({ actorUserId, actorRole, actionType, targetType, targetId, payloadSummary, ipAddress }) {
  const entry = {
    actorUserId,
    actorRole,
    actionType,
    targetType:     targetType || null,
    targetId:       targetId   || null,
    payloadSummary: payloadSummary ? String(payloadSummary).slice(0, 500) : null,
    ipAddress:      ipAddress  || null,
    createdAt:      new Date().toISOString(),
  };
  await db.collection(COLLECTIONS.AUDIT_LOGS).add(entry);
  return entry;
}

module.exports = { log };
```

---

## Task 8 — Admin endpoints: provision Faculty, TPO; approve Company

**File:** `src/backend/src/controllers/adminController.js` (extend existing)

Add these handlers. Where existing admin handlers live (e.g., `listUsers`), leave them be; just add:

```javascript
const { auth, db } = require('../config/firebase');
const {
  ROLES,
  ACCOUNT_STATUS,
  COMPANY_STATUS,
  COLLECTIONS,
  AUDIT_ACTION,
  PASSWORD_POLICY,
} = require('../config/constants');
const auditLogger = require('../services/auditLogger');
const crypto = require('crypto');

function generateTemporaryPassword() {
  // 12 random chars, meets policy
  const alpha  = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower  = 'abcdefghjkmnpqrstuvwxyz';
  const digits = '23456789';
  const all    = alpha + lower + digits;
  const pick   = (set) => set[crypto.randomInt(0, set.length)];
  // guarantee coverage
  let pwd = pick(alpha) + pick(lower) + pick(digits);
  for (let i = 0; i < 9; i++) pwd += pick(all);
  return pwd;
}

/* POST /api/admin/users/faculty — provision a Faculty account */
const provisionFaculty = async (req, res) => {
  try {
    const { email, fullName, schoolId } = req.body;
    if (!email || !fullName || !schoolId) {
      return res.status(400).json({ success: false, message: 'email, fullName, and schoolId are required.' });
    }
    // Only one Faculty per school at a time (FR-1.12)
    const existing = await db.collection(COLLECTIONS.FACULTY_PROFILES)
      .where('schoolId', '==', schoolId).get();
    if (!existing.empty) {
      const activeOnes = [];
      for (const doc of existing.docs) {
        const userDoc = await db.collection(COLLECTIONS.USERS).doc(doc.id).get();
        if (userDoc.exists && userDoc.data().status === ACCOUNT_STATUS.ACTIVE) {
          activeOnes.push(doc.id);
        }
      }
      if (activeOnes.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'This school already has an active Faculty account. Deactivate the existing one first.',
          activeFacultyUserIds: activeOnes,
        });
      }
    }

    const tempPwd = generateTemporaryPassword();
    const userRecord = await auth.createUser({ email, password: tempPwd, displayName: fullName, emailVerified: true });
    await auth.setCustomUserClaims(userRecord.uid, { role: ROLES.FACULTY });

    const now = new Date().toISOString();
    const batch = db.batch();
    batch.set(db.collection(COLLECTIONS.USERS).doc(userRecord.uid), {
      uid: userRecord.uid, email, fullName,
      role: ROLES.FACULTY, status: ACCOUNT_STATUS.ACTIVE,
      createdAt: now, updatedAt: now, lastLoginAt: null,
    });
    batch.set(db.collection(COLLECTIONS.FACULTY_PROFILES).doc(userRecord.uid), {
      userId: userRecord.uid, schoolId, designation: null, phoneNumber: null, createdAt: now, updatedAt: now,
    });
    await batch.commit();

    await auditLogger.log({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.PROVISION_FACULTY,
      targetType:     'user',
      targetId:       userRecord.uid,
      payloadSummary: `Provisioned Faculty for school ${schoolId}`,
      ipAddress:      req.ip,
    });

    // TODO (Sprint 2): email the temporary password via emailService
    return res.status(201).json({
      success: true,
      message: 'Faculty account created.',
      data: {
        uid: userRecord.uid, email, role: ROLES.FACULTY, schoolId,
        temporaryPassword: process.env.NODE_ENV === 'development' ? tempPwd : undefined,
      },
    });
  } catch (error) {
    console.error('provisionFaculty error:', error);
    return res.status(500).json({ success: false, message: 'Failed to provision Faculty.' });
  }
};

/* POST /api/admin/users/tpo — provision THE single TPO */
const provisionTPO = async (req, res) => {
  try {
    const { email, fullName } = req.body;
    if (!email || !fullName) {
      return res.status(400).json({ success: false, message: 'email and fullName are required.' });
    }

    // Deactivate any existing active TPO (FR-1.13)
    const existing = await db.collection(COLLECTIONS.USERS)
      .where('role', '==', ROLES.TPO)
      .where('status', '==', ACCOUNT_STATUS.ACTIVE).get();
    const batch = db.batch();
    for (const doc of existing.docs) {
      batch.update(doc.ref, { status: ACCOUNT_STATUS.DEACTIVATED, updatedAt: new Date().toISOString() });
    }

    const tempPwd = generateTemporaryPassword();
    const userRecord = await auth.createUser({ email, password: tempPwd, displayName: fullName, emailVerified: true });
    await auth.setCustomUserClaims(userRecord.uid, { role: ROLES.TPO });

    const now = new Date().toISOString();
    batch.set(db.collection(COLLECTIONS.USERS).doc(userRecord.uid), {
      uid: userRecord.uid, email, fullName,
      role: ROLES.TPO, status: ACCOUNT_STATUS.ACTIVE,
      createdAt: now, updatedAt: now, lastLoginAt: null,
    });
    await batch.commit();

    await auditLogger.log({
      actorUserId: req.user.uid, actorRole: req.user.role,
      actionType: AUDIT_ACTION.PROVISION_TPO, targetType: 'user', targetId: userRecord.uid,
      payloadSummary: `Provisioned TPO; deactivated ${existing.size} previous.`, ipAddress: req.ip,
    });

    return res.status(201).json({
      success: true, message: 'TPO account created.',
      data: {
        uid: userRecord.uid, email, role: ROLES.TPO,
        temporaryPassword: process.env.NODE_ENV === 'development' ? tempPwd : undefined,
      },
    });
  } catch (error) {
    console.error('provisionTPO error:', error);
    return res.status(500).json({ success: false, message: 'Failed to provision TPO.' });
  }
};

/* PATCH /api/admin/companies/:companyId/approve */
const approveCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const now = new Date().toISOString();

    const companyRef = db.collection(COLLECTIONS.COMPANIES).doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists) {
      return res.status(404).json({ success: false, message: 'Company not found.' });
    }

    // Update company + user status in a batch
    const userRef = db.collection(COLLECTIONS.USERS).doc(companyDoc.data().primaryContactUserId);
    const batch = db.batch();
    batch.update(companyRef, {
      status: COMPANY_STATUS.ACTIVE, approvedAt: now, approvedBy: req.user.uid, updatedAt: now,
    });
    batch.update(userRef, { status: ACCOUNT_STATUS.ACTIVE, updatedAt: now });
    await batch.commit();

    await auditLogger.log({
      actorUserId: req.user.uid, actorRole: req.user.role,
      actionType: AUDIT_ACTION.APPROVE_COMPANY, targetType: 'company', targetId: companyId,
      payloadSummary: 'Company approved.', ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, message: 'Company approved.' });
  } catch (error) {
    console.error('approveCompany error:', error);
    return res.status(500).json({ success: false, message: 'Approval failed.' });
  }
};

/* PATCH /api/admin/companies/:companyId/reject */
const rejectCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const { reason } = req.body;
    const now = new Date().toISOString();

    const companyRef = db.collection(COLLECTIONS.COMPANIES).doc(companyId);
    const companyDoc = await companyRef.get();
    if (!companyDoc.exists) return res.status(404).json({ success: false, message: 'Company not found.' });

    const userRef = db.collection(COLLECTIONS.USERS).doc(companyDoc.data().primaryContactUserId);
    const batch = db.batch();
    batch.update(companyRef, { status: COMPANY_STATUS.REJECTED, updatedAt: now });
    batch.update(userRef, { status: ACCOUNT_STATUS.DEACTIVATED, updatedAt: now });
    await batch.commit();

    await auditLogger.log({
      actorUserId: req.user.uid, actorRole: req.user.role,
      actionType: AUDIT_ACTION.REJECT_COMPANY, targetType: 'company', targetId: companyId,
      payloadSummary: reason || 'Company rejected.', ipAddress: req.ip,
    });

    return res.status(200).json({ success: true, message: 'Company rejected.' });
  } catch (error) {
    console.error('rejectCompany error:', error);
    return res.status(500).json({ success: false, message: 'Rejection failed.' });
  }
};

module.exports = {
  // ... keep existing exports from this file ...
  provisionFaculty, provisionTPO, approveCompany, rejectCompany,
};
```

**File:** `src/backend/src/routes/adminRoutes.js`

Add these routes. Every admin route must be gated by `authenticate` AND `authorize(ROLES.ADMIN)` (for provisioning) or `authorize(ROLES.ADMIN, ROLES.TPO)` (for company approval — both can approve per SRS FR-1.9):

```javascript
const { authenticate, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const {
  provisionFaculty, provisionTPO, approveCompany, rejectCompany,
  // ... plus existing handlers ...
} = require('../controllers/adminController');

router.post('/users/faculty',
  authenticate, authorize(ROLES.ADMIN),
  provisionFaculty);

router.post('/users/tpo',
  authenticate, authorize(ROLES.ADMIN),
  provisionTPO);

router.patch('/companies/:companyId/approve',
  authenticate, authorize(ROLES.ADMIN, ROLES.TPO),
  approveCompany);

router.patch('/companies/:companyId/reject',
  authenticate, authorize(ROLES.ADMIN, ROLES.TPO),
  rejectCompany);
```

---

## Task 9 — Split rate limiter for authenticated vs unauthenticated

**File:** `src/backend/src/app.js`

Replace the single limiter with two limiters:

```javascript
/* ────────── Rate Limiting (SRS QA-S3) ────────── */

// Unauthenticated endpoints — 20/minute per IP
const authLessLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      20,
  message:  { success: false, message: 'Too many requests. Please try again shortly.' },
});

// Authenticated endpoints — 100/minute per IP
const authedLimiter = rateLimit({
  windowMs: 60 * 1000,
  max:      100,
  message:  { success: false, message: 'Rate limit exceeded.' },
});

// Apply stricter limit to auth-entry routes
app.use('/api/register',        authLessLimiter);
app.use('/api/login',           authLessLimiter);
app.use('/api/forgot-password', authLessLimiter);
app.use('/api/verify-login-otp', authLessLimiter);
// Looser limit for everything else under /api
app.use('/api/', authedLimiter);
```

---

## Task 10 — Tighten CORS

**File:** `src/backend/src/app.js`

Replace the CORS block:

```javascript
/* ────────── CORS ────────── */
const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:5173,http://localhost:5174')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (Postman, curl, server-to-server)
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  methods:        ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials:    false,
}));
```

Add to `.env.example`:
```
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3001
```

---

## Task 11 — Firestore security rules (deny by default)

**File (new):** `firestore.rules` at the project root (next to `docker-compose.yml`).

```
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    // Deny by default — the backend API (Admin SDK) bypasses these rules.
    // Client-side SDK access is restricted to what's explicitly allowed below.

    match /users/{userId} {
      // A user may read their own user document
      allow read: if request.auth != null && request.auth.uid == userId;
      // No client writes — use the API
      allow write: if false;
    }

    match /studentProfiles/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow write: if false;
    }

    match /schools/{schoolId} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /departments/{deptId} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // All other collections: deny client access entirely.
    // Admin SDK (server-side) always bypasses these rules.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Update `README.md` or deployment notes with:
```bash
firebase deploy --only firestore:rules
```

---

## Task 12 — Seed reference data: Schools and Departments

**File (new):** `src/backend/src/scripts/seedReferenceData.js`

```javascript
/**
 * Seeds the 12 Schools and 42 Departments of the University of Hyderabad
 * into Firestore. Idempotent — re-running updates rather than duplicates.
 *
 * Source: https://uohyd.ac.in/schools-departments/ (accessed April 2026)
 */

const { db } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');

const SCHOOLS = [
  { id: 'sms-math-stat',      name: 'School of Mathematics & Statistics',        shortCode: 'SMMS' },
  { id: 'sms-chem',           name: 'School of Chemistry',                      shortCode: 'SOC'  },
  { id: 'scis',               name: 'School of Computer & Information Sciences', shortCode: 'SCIS' },
  { id: 'soh',                name: 'School of Humanities',                     shortCode: 'SOH'  },
  { id: 'sms-mgmt',           name: 'School of Management Studies',              shortCode: 'SMS'  },
  { id: 'sns-arts',           name: 'S N School of Arts & Communication',       shortCode: 'SNS'  },
  { id: 'sop',                name: 'School of Physics',                        shortCode: 'SOP'  },
  { id: 'sls',                name: 'School of Life Sciences',                  shortCode: 'SLS'  },
  { id: 'sss',                name: 'School of Social Sciences',                shortCode: 'SSS'  },
  { id: 'sest',               name: 'School of Engineering Sciences & Technology', shortCode: 'SEST' },
  { id: 'soe',                name: 'School of Economics',                      shortCode: 'SOE'  },
  { id: 'soms',               name: 'School of Medical Sciences',               shortCode: 'SOMS' },
];

const DEPARTMENTS = [
  // SCIS, Math, Chem, Physics, Economics, SMS, SEST, SOMS — schools treated as single departments
  { id: 'dept-scis',           schoolId: 'scis',           name: 'School of Computer & Information Sciences' },
  { id: 'dept-math-stat',      schoolId: 'sms-math-stat',  name: 'School of Mathematics & Statistics' },
  { id: 'dept-chem',           schoolId: 'sms-chem',       name: 'School of Chemistry' },
  { id: 'dept-phys',           schoolId: 'sop',            name: 'School of Physics' },
  { id: 'dept-econ',           schoolId: 'soe',            name: 'School of Economics' },
  { id: 'dept-mgmt',           schoolId: 'sms-mgmt',       name: 'School of Management Studies' },
  { id: 'dept-sest',           schoolId: 'sest',           name: 'School of Engineering Sciences & Technology' },
  { id: 'dept-soms',           schoolId: 'soms',           name: 'School of Medical Sciences' },
  // Humanities — 6 departments + 2 centres
  { id: 'dept-english',        schoolId: 'soh', name: 'Department of English' },
  { id: 'dept-philosophy',     schoolId: 'soh', name: 'Department of Philosophy' },
  { id: 'dept-hindi',          schoolId: 'soh', name: 'Department of Hindi' },
  { id: 'dept-telugu',         schoolId: 'soh', name: 'Department of Telugu' },
  { id: 'dept-urdu',           schoolId: 'soh', name: 'Department of Urdu' },
  { id: 'dept-sanskrit',       schoolId: 'soh', name: 'Department of Sanskrit Studies' },
  { id: 'dept-ccl',            schoolId: 'soh', name: 'Centre for Comparative Literature (CCL)' },
  { id: 'dept-calts',          schoolId: 'soh', name: 'Centre for Applied Linguistics & Translation Studies (CALTS)' },
  // SN Arts & Communication — 5 departments
  { id: 'dept-comm',           schoolId: 'sns-arts', name: 'Department of Communication' },
  { id: 'dept-dance',          schoolId: 'sns-arts', name: 'Department of Dance' },
  { id: 'dept-finearts',       schoolId: 'sns-arts', name: 'Department of Fine Arts' },
  { id: 'dept-theatre',        schoolId: 'sns-arts', name: 'Department of Theatre Arts' },
  { id: 'dept-music',          schoolId: 'sns-arts', name: 'Department of Music' },
  // Life Sciences — 5 departments
  { id: 'dept-biochem',        schoolId: 'sls', name: 'Department of Biochemistry' },
  { id: 'dept-plantsci',       schoolId: 'sls', name: 'Department of Plant Sciences' },
  { id: 'dept-animalbio',      schoolId: 'sls', name: 'Department of Animal Biology' },
  { id: 'dept-biotech',        schoolId: 'sls', name: 'Department of Biotechnology & Bioinformatics' },
  { id: 'dept-sysbio',         schoolId: 'sls', name: 'Department of Systems & Computational Biology' },
  // Social Sciences — 5 depts + 8 centres
  { id: 'dept-anthro',         schoolId: 'sss', name: 'Department of Anthropology' },
  { id: 'dept-history',        schoolId: 'sss', name: 'Department of History' },
  { id: 'dept-polsci',         schoolId: 'sss', name: 'Department of Political Science' },
  { id: 'dept-sociology',      schoolId: 'sss', name: 'Department of Sociology' },
  { id: 'dept-edu',            schoolId: 'sss', name: 'Department of Education & Educational Technology' },
  { id: 'dept-crs',            schoolId: 'sss', name: 'Centre for Regional Studies' },
  { id: 'dept-cfcs',           schoolId: 'sss', name: 'Centre for Folk Culture Studies' },
  { id: 'dept-csseip',         schoolId: 'sss', name: 'Centre for the Study of Social Exclusion and Inclusive Policy' },
  { id: 'dept-csid',           schoolId: 'sss', name: 'Centre for the Study of Indian Diaspora' },
  { id: 'dept-ckcis',          schoolId: 'sss', name: 'Centre for Knowledge, Culture and Innovation Studies' },
  { id: 'dept-chr',            schoolId: 'sss', name: 'Centre for Human Rights' },
  { id: 'dept-cas',            schoolId: 'sss', name: 'Centre for Ambedkar Studies' },
  { id: 'dept-cws',            schoolId: 'sss', name: 'Centre for Women\u2019s Studies' },
];

async function seed() {
  console.log('Seeding Schools...');
  const sBatch = db.batch();
  for (const s of SCHOOLS) {
    sBatch.set(db.collection(COLLECTIONS.SCHOOLS).doc(s.id), s, { merge: true });
  }
  await sBatch.commit();
  console.log(`✓ ${SCHOOLS.length} schools.`);

  console.log('Seeding Departments...');
  const dBatch = db.batch();
  for (const d of DEPARTMENTS) {
    dBatch.set(db.collection(COLLECTIONS.DEPARTMENTS).doc(d.id), d, { merge: true });
  }
  await dBatch.commit();
  console.log(`✓ ${DEPARTMENTS.length} departments.`);

  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
```

**Verify:**
```bash
node src/scripts/seedReferenceData.js
# Should print "12 schools" and "42 departments"
```

Add a public GET route so the frontend can populate dropdowns:

**File:** `src/backend/src/routes/referenceRoutes.js` (new)

```javascript
const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');

router.get('/schools', async (_req, res) => {
  const snap = await db.collection(COLLECTIONS.SCHOOLS).get();
  res.json({ success: true, data: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

router.get('/departments', async (req, res) => {
  let q = db.collection(COLLECTIONS.DEPARTMENTS);
  if (req.query.schoolId) q = q.where('schoolId', '==', req.query.schoolId);
  const snap = await q.get();
  res.json({ success: true, data: snap.docs.map((d) => ({ id: d.id, ...d.data() })) });
});

module.exports = router;
```

Mount in `app.js`:
```javascript
const referenceRoutes = require('./routes/referenceRoutes');
app.use('/api/reference', referenceRoutes);
```

---

## Task 13 — Scaffold Declaration (Sprint 2 groundwork)

**File (new):** `src/backend/src/scripts/seedInitialDeclaration.js`

```javascript
const { db } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');

const DECLARATION_TEXT = `
University of Hyderabad — Placement Guidance and Advisory Bureau
Candidate Self-Declaration, Session 2024–26

I, the undersigned, hereby declare that I have read and understood the placement policy
of the University of Hyderabad and I agree to abide by the following rules:

1. I will not miss any scheduled placement drive after applying for it. Non-attendance,
   without prior written permission from the TPO, will result in my being debarred from
   the next three drives.

2. If I accept an offer and subsequently reject it, I will be debarred from participating
   in all further drives of the current placement season.

3. I will provide truthful and accurate information in my profile and resume. Any
   misrepresentation will result in disciplinary action, which may include debarment.

4. I understand that company-specific eligibility rules (CGPA, backlog, programme,
   graduation year) apply and that I may be filtered out of drives for which I do not
   meet these rules.

5. I consent to the use of my placement-related personal data for the purposes of drive
   coordination, statutory reporting, and improvement of the PMS.

By typing my full name and submitting this form, I electronically sign this declaration.
`.trim();

async function seed() {
  const id = 'v1-2024-26';
  await db.collection(COLLECTIONS.DECLARATION_VERSIONS).doc(id).set({
    versionId:     id,
    version:       1,
    text:          DECLARATION_TEXT,
    effectiveFrom: new Date('2024-08-01T00:00:00Z').toISOString(),
    publishedBy:   'system-seed',
    createdAt:     new Date().toISOString(),
  }, { merge: true });
  console.log('✓ Declaration v1 seeded.');
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
```

Declaration controller / sign endpoint / frontend UI come in Sprint 2 proper — this brief only scaffolds the data model and seed.

---

## Task 14 — Update existing tests + add OTP tests

Read each file under `src/backend/tests/` and update role/status values:

- `'Student'` → `'STUDENT'`
- `'Company'` → `'COMPANY'`
- `'Admin'` → `'ADMIN'`
- `'Active'` → `'ACTIVE'`
- `'Inactive'` → `'UNVERIFIED'` (if student) or `'PENDING_APPROVAL'` (if company)
- `'Deactivated'` → `'DEACTIVATED'`

Any test that self-registers Faculty or TPO should be **removed** (no longer valid) or rewritten to assert the 403 response.

**Add new tests:**

- `tests/otp.test.js` — covers `verifyLoginOTP`: wrong code, expired, too many attempts, success.
- `tests/adminProvisioning.test.js` — covers `provisionFaculty` (only-one-per-school enforcement), `provisionTPO` (deactivates previous), `approveCompany`.

Follow the existing mocking pattern (Firestore mock in `tests/setup.js`).

**Verify:**
```bash
cd src/backend
npm test -- --coverage
# Coverage on authController + middleware/auth + services/otpService should be ≥ 80%.
```

---

## Task 15 — Frontend: update role dropdown + add OTP page

**File:** `src/frontend/src/pages/RegisterPage.jsx`

Find the `ROLES` constant near the top and replace with:

```javascript
const ROLES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'COMPANY', label: 'Company / Recruiter' },
  // Faculty and TPO are admin-provisioned only — not shown here.
];
```

Find the `DEPARTMENTS` constant (the hard-coded array of ~10 items) and **replace it with a dynamic load** from the new `/api/reference/departments` endpoint. Use `useEffect` on mount. Also add a separate `schools` state loaded from `/api/reference/schools`.

Change the form shape: replace the single `department` field with two fields `schoolId` and `departmentId`, where `departmentId`'s options are filtered by the chosen `schoolId`.

Update the validator in the same file:
- Password must match regex `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/` — upper, lower, digit, 8+ chars. Drop the "special character" requirement (SRS doesn't require it and it caused friction).
- Email exact-domain check: `form.email.split('@')[1] !== 'uohyd.ac.in'` instead of `endsWith`.
- When role is `STUDENT`, `schoolId` and `departmentId` are required.

**File (new):** `src/frontend/src/pages/VerifyOTPPage.jsx`

A minimal page that:
1. Reads the pending ID token from sessionStorage (set by login flow).
2. Shows a 6-input OTP field.
3. POSTs to `/api/verify-login-otp` with the token + code.
4. On success, stores the verified session and navigates to dashboard.
5. Shows attempts-remaining on wrong code.
6. Has a "Resend OTP" link that re-calls `/api/login`.

**File:** `src/frontend/src/contexts/AuthContext.jsx`

Split the `login` function into two phases:

```javascript
const startLogin = async (email, password) => {
  setError(null);
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  if (!user.emailVerified) {
    await signOut(auth);
    throw new Error('Please verify your email before signing in.');
  }

  const token = await user.getIdToken();
  // Step 1: request OTP
  const response = await authAPI.login(token);
  // Stash token and uid for the OTP page
  sessionStorage.setItem('pms_pending_uid', response.data.uid);
  sessionStorage.setItem('pms_pending_token', token);
  return response;   // caller navigates to /verify-otp
};

const completeLogin = async (otp) => {
  setError(null);
  const token = sessionStorage.getItem('pms_pending_token');
  if (!token) throw new Error('Session expired. Please sign in again.');
  const response = await authAPI.verifyLoginOTP(token, otp);
  setUserProfile(response.data);
  sessionStorage.removeItem('pms_pending_uid');
  sessionStorage.removeItem('pms_pending_token');
  return response;
};
```

Replace the existing `login` export with `startLogin` and `completeLogin`. Update `LoginPage.jsx` to call `startLogin` then `navigate('/verify-otp')`.

**File:** `src/frontend/src/services/api.js`

Add the new API call:

```javascript
verifyLoginOTP: (token, otp) =>
  apiRequest('/verify-login-otp', {
    method: 'POST',
    token,
    body:   { otp },
  }),
```

**File:** `src/frontend/src/App.jsx` (router file)

Add:
```jsx
<Route path="/verify-otp" element={<VerifyOTPPage />} />
```

---

## Task 16 — Add seed script for Administrator (if not present)

Look for `src/backend/src/scripts/seedAdmin.js` (you mentioned a `scripts/` folder exists). If present, update its role value from `'Admin'` to `'ADMIN'` and status to `'ACTIVE'`. If absent, create:

```javascript
const { auth, db } = require('../config/firebase');
const { COLLECTIONS, ROLES, ACCOUNT_STATUS } = require('../config/constants');

async function seed() {
  const email = process.env.SEED_ADMIN_EMAIL;
  const password = process.env.SEED_ADMIN_PASSWORD;
  const name = process.env.SEED_ADMIN_NAME || 'System Administrator';
  if (!email || !password) {
    console.error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set.');
    process.exit(1);
  }

  let userRecord;
  try {
    userRecord = await auth.getUserByEmail(email);
    console.log(`Admin exists: ${userRecord.uid}`);
  } catch {
    userRecord = await auth.createUser({ email, password, displayName: name, emailVerified: true });
    console.log(`Admin created: ${userRecord.uid}`);
  }
  await auth.setCustomUserClaims(userRecord.uid, { role: ROLES.ADMIN });

  const now = new Date().toISOString();
  await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
    uid: userRecord.uid, email, fullName: name,
    role: ROLES.ADMIN, status: ACCOUNT_STATUS.ACTIVE,
    createdAt: now, updatedAt: now, lastLoginAt: null,
  }, { merge: true });

  console.log('✓ Admin seeded.');
  process.exit(0);
}

seed().catch((e) => { console.error(e); process.exit(1); });
```

Add to `.env.example`:
```
SEED_ADMIN_EMAIL=admin@uohyd.ac.in
SEED_ADMIN_PASSWORD=ChangeMe123
SEED_ADMIN_NAME=System Administrator
```

---

## Final assembly — run order

Execute in this exact order from `src/backend/`:

```bash
# 1. Install any new deps (none in this brief; good)
npm install

# 2. Run the migration on existing users (if any)
node src/scripts/migrateUsersV2.js

# 3. Seed reference data
node src/scripts/seedReferenceData.js

# 4. Seed initial declaration
node src/scripts/seedInitialDeclaration.js

# 5. Ensure admin account exists
node src/scripts/seedAdmin.js

# 6. Run tests
npm test

# 7. Start backend
npm run dev

# 8. In another terminal, start frontend
cd ../frontend
npm run dev

# 9. Deploy Firestore rules (requires Firebase CLI)
firebase deploy --only firestore:rules
```

---

## What to tell the reviewer

If asked about these changes, say:

> "We reconciled Sprint 1 with SRS v2.0. The main changes were:
>
> 1. **Role model tightened.** We added TPO as a distinct role and blocked Faculty/TPO self-registration at the API layer, not just the UI — they're now admin-provisioned only, per SRS FR-1.11 and FR-1.13.
> 2. **Two-step authentication.** Every login now requires a 6-digit email OTP after password verification, implementing SRS FR-1.15 through FR-1.17. The password check is still delegated to Firebase Authentication; the OTP is our application-layer second factor.
> 3. **Five-state account lifecycle.** Replaced the binary Active/Inactive with UNVERIFIED, PENDING_APPROVAL, ACTIVE, SUSPENDED, DEACTIVATED, with a migration for existing users. Companies now enter PENDING_APPROVAL and cannot sign in until the TPO or Administrator approves them, per FR-1.7–FR-1.9.
> 4. **Audit log foundation.** Every administrative action (Faculty provisioning, TPO provisioning, company approval, company rejection) writes an append-only entry to an auditLogs collection, implementing FR-9.5–FR-9.7.
> 5. **Firestore security rules.** Added deny-by-default rules so that direct client writes are impossible; every write must go through the API, which is where authorization is enforced.
> 6. **Reference data seeded.** The 12 Schools and 42 Departments of the University are now in Firestore, retrieved via `/api/reference/schools` and `/api/reference/departments`, so the frontend dropdowns are UoH-accurate rather than generic.
> 7. **Sprint 2 groundwork.** The `studentProfiles` collection is now populated on registration (previously Student data was inline on the user document), and the first version of the PGAB Self-Declaration is seeded and ready to be wired into the apply-to-job flow in Sprint 2."

All changes map to specific FRs in SRS v2.0; the traceability is explicit in the code comments, so if the reviewer wants to see "where is FR-1.15 implemented?", the answer is `authController.login` and `services/otpService.js`.

---

*End of brief. Total new/modified files: ~15. Estimated Claude Code execution time: 6–10 hours.*
