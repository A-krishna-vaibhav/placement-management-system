/**
 * Authentication Middleware
 * ────────────────────────
 * Verifies the Firebase ID token from the Authorization header.
 * Attaches the decoded user info to `req.user`.
 */

const { auth, db } = require('../config/firebase');
const { COLLECTIONS, ACCOUNT_STATUS } = require('../config/constants');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(idToken);

    const userDoc = await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: 'User profile not found. Please complete registration.',
      });
    }

    const userData = userDoc.data();

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

    req.user = {
      uid:      decodedToken.uid,
      email:    decodedToken.email,
      role:     userData.role,
      status:   userData.status,
      fullName: userData.fullName,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error.message);

    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        message: 'Token expired. Please log in again.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid or expired token.',
    });
  }
};

const authorize = (...allowedRoles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: `Insufficient permission. Required: ${allowedRoles.join(', ')}. Your role: ${req.user.role}.`,
    });
  }
  next();
};

module.exports = { authenticate, authorize };
