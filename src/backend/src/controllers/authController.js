/**
 * Auth Controller
 * ───────────────
 * POST /api/register           — FR-1.1 through FR-1.10
 * POST /api/login              — Step 1: verify password, issue OTP (FR-1.15)
 * POST /api/verify-login-otp   — Step 2: verify OTP, return session (FR-1.16)
 * GET  /api/verify-email       — Sync email-verification status
 * POST /api/forgot-password    — Password reset request
 * POST /api/reset-password     — Placeholder (handled by Firebase Client SDK)
 * GET  /api/me                 — Authenticated user profile
 */

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

/* ──────────────────── POST /api/register ──────────────────── */

const register = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const {
      fullName: name, email, password, role,
      schoolId, departmentId,
      companyName, website, hrName, hrPhone, description,
    } = req.body;

    // FR-1.11, FR-1.13, FR-1.20: Faculty, TPO, Admin cannot self-register.
    if (!SELF_REGISTRABLE_ROLES.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `Self-registration as ${role} is not permitted. ${
          role === ROLES.FACULTY || role === ROLES.TPO
            ? 'Contact the Administrator for provisioning.'
            : ''
        }`,
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
        schoolId:        schoolId || null,
        departmentId:    departmentId || null,
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
        companyId:            userRecord.uid,
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

    // Email verification link for the Student
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

/* ──────────────────── POST /api/login (Step 1: issue OTP) ──────────────────── */
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

    // ADMIN, TPO, FACULTY skip OTP — sign in directly
    const OTP_EXEMPT_ROLES = [ROLES.ADMIN, ROLES.TPO, ROLES.FACULTY];
    if (OTP_EXEMPT_ROLES.includes(userData.role)) {
      await userRef.update({
        lastLoginAt: new Date().toISOString(),
        updatedAt:   new Date().toISOString(),
      });
      return res.status(200).json({
        success: true,
        message: 'Sign-in successful.',
        data:    {
          uid:         decodedToken.uid,
          email:       userData.email,
          fullName:    userData.fullName,
          role:        userData.role,
          status:      userData.status,
          otpRequired: false,
        },
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
        uid:         decodedToken.uid,
        otpRequired: true,
        ttlMinutes:  OTP_POLICY.TTL_MINUTES,
        devOtp:      process.env.NODE_ENV !== 'production' ? code : undefined,
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

/* ──────────────────── POST /api/verify-login-otp (Step 2) ──────────────────── */

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
    const result = await verifyOTP(decodedToken.uid, String(otp));

    if (!result.ok) {
      const map = {
        'no-otp':            { status: 400, msg: 'No active OTP. Please sign in again.' },
        'expired':           { status: 400, msg: 'OTP expired. Please sign in again.' },
        'too-many-attempts': { status: 429, msg: 'Too many incorrect attempts. Please sign in again.' },
        'wrong-code':        { status: 401, msg: `Incorrect OTP. ${result.attemptsRemaining} attempt(s) remaining.` },
      };
      const { status, msg } = map[result.reason] || { status: 400, msg: 'OTP verification failed.' };
      return res.status(status).json({
        success: false,
        message: msg,
        code:    result.reason ? result.reason.toUpperCase().replace(/-/g, '_') : 'OTP_ERROR',
        attemptsRemaining: result.attemptsRemaining,
      });
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

/* ──────────────────── GET /api/verify-email ──────────────────── */

const verifyEmail = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    if (!decodedToken.email_verified) {
      return res.status(400).json({ success: false, message: 'Email is not yet verified.' });
    }

    await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).update({
      status:    ACCOUNT_STATUS.ACTIVE,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({ success: true, message: 'Email verified and account activated.' });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ success: false, message: 'Email verification sync failed.' });
  }
};

/* ──────────────────── POST /api/forgot-password ──────────────────── */

const forgotPassword = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { email } = req.body;
    const resetLink = await auth.generatePasswordResetLink(email);

    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
      data: {
        resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
      },
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    // Don't reveal if the email exists or not (security best practice)
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  }
};

/* ──────────────────── POST /api/reset-password ──────────────────── */

const resetPassword = async (_req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Password reset is handled by Firebase Client SDK. Use confirmPasswordReset() on the frontend.',
  });
};

/* ──────────────────── GET /api/me ──────────────────── */

const getProfile = async (req, res) => {
  try {
    return res.status(200).json({ success: true, data: req.user });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch profile.' });
  }
};

module.exports = {
  register,
  login,
  verifyLoginOTP,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
};
