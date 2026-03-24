/**
 * Auth Controller
 * ───────────────
 * Handles: Registration (POST /api/register)
 *          Login info    (POST /api/login)
 *          Forgot pwd    (POST /api/forgot-password)
 *          User profile  (GET  /api/me)
 *
 * NOTE: Firebase Auth on the CLIENT side handles the actual
 * sign-in / sign-up / email-verification / password-reset flows.
 * This backend validates, stores the Firestore profile, and
 * verifies tokens.
 */

const { auth, db } = require('../config/firebase');
const { ROLES, ACCOUNT_STATUS, UNIVERSITY_ROLES, UNIVERSITY_EMAIL_DOMAIN, COLLECTIONS } = require('../config/constants');
const { handleValidationErrors } = require('../utils/validationHelper');


/* ────────────── POST /api/register ────────────── */

const register = async (req, res) => {
  try {
    // Validation
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { name, email, password, department, role } = req.body;

    // Extra server-side check: university email for Student/Faculty
    if (UNIVERSITY_ROLES.includes(role)) {
      const domain = email.split('@')[1];
      if (domain !== UNIVERSITY_EMAIL_DOMAIN) {
        return res.status(400).json({
          success: false,
          message: `Students and staff must register with their university email (@${UNIVERSITY_EMAIL_DOMAIN}).`,
        });
      }
    }

    // Self-registration as Admin is NOT allowed
    if (role === ROLES.ADMIN) {
      return res.status(403).json({
        success: false,
        message: 'Self-registration as Admin is not permitted.',
      });
    }

    // Create user in Firebase Auth
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

    // Set custom claims for RBAC
    await auth.setCustomUserClaims(userRecord.uid, { role });

    // Create Firestore profile  (T-06 schema)
    const userProfile = {
      uid: userRecord.uid,
      name,
      email,
      role,
      department,
      status: ACCOUNT_STATUS.INACTIVE, // until email is verified
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set(userProfile);

    // Generate email verification link (Firebase sends the email)
    const verificationLink = await auth.generateEmailVerificationLink(email);

    return res.status(201).json({
      success: true,
      message: 'Registration successful. Please check your email to verify your account.',
      data: {
        uid: userRecord.uid,
        name,
        email,
        role,
        department,
        status: ACCOUNT_STATUS.INACTIVE,
        verificationLink, // Useful for dev/test; hide in production
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Registration failed. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

/* ────────────── POST /api/login ────────────── */
/**
 * The actual sign-in happens on the client with Firebase Client SDK.
 * This endpoint receives the ID token, verifies it, checks Firestore
 * profile status, and returns user data.
 */
const login = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided.',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    // Fetch profile
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found. Please register first.',
      });
    }

    const userData = userDoc.data();

    // Check email verification status
    if (!decodedToken.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before logging in.',
      });
    }

    // If just verified, activate account
    if (userData.status === ACCOUNT_STATUS.INACTIVE && decodedToken.email_verified) {
      await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).update({
        status: ACCOUNT_STATUS.ACTIVE,
        isVerified: true,
        updatedAt: new Date().toISOString(),
      });
      userData.status = ACCOUNT_STATUS.ACTIVE;
      userData.isVerified = true;
    }

    // Check if deactivated
    if (userData.status === ACCOUNT_STATUS.DEACTIVATED) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact the administrator.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      data: {
        uid: decodedToken.uid,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        department: userData.department,
        status: userData.status,
        isVerified: userData.isVerified,
      },
    });
  } catch (error) {
    console.error('Login error:', error);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.',
    });
  }
};

/* ────────────── GET /api/verify-email?token= ────────────── */
/**
 * Firebase handles verification via its own action URLs.
 * This endpoint is called AFTER the user clicks the Firebase link.
 * The frontend calls this to sync Firestore status.
 */
const verifyEmail = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided.' });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    if (!decodedToken.email_verified) {
      return res.status(400).json({
        success: false,
        message: 'Email is not yet verified.',
      });
    }

    // Activate in Firestore
    await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).update({
      status: ACCOUNT_STATUS.ACTIVE,
      isVerified: true,
      updatedAt: new Date().toISOString(),
    });

    return res.status(200).json({
      success: true,
      message: 'Email verified and account activated.',
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({
      success: false,
      message: 'Email verification sync failed.',
    });
  }
};

/* ────────────── POST /api/forgot-password ────────────── */

const forgotPassword = async (req, res) => {
  try {
    const validationError = handleValidationErrors(req, res);
    if (validationError) return;

    const { email } = req.body;

    // Generate password reset link (Firebase sends the email)
    const resetLink = await auth.generatePasswordResetLink(email);

    return res.status(200).json({
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
      data: {
        resetLink, // Useful for dev/test; hide in production
      },
    });
  } catch (error) {
    console.error('Forgot password error:', error);

    // Don't reveal if the email exists or not (security)
    return res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  }
};

/* ────────────── POST /api/reset-password ────────────── */
/**
 * Firebase handles the actual reset via its action URLs.
 * This endpoint exists for completeness — the frontend uses
 * Firebase Client SDK's confirmPasswordReset().
 */
const resetPassword = async (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Password reset is handled by Firebase Client SDK. Use confirmPasswordReset() on the frontend.',
  });
};

/* ────────────── GET /api/me ────────────── */

const getProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch profile.',
    });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getProfile,
};
