/**
 * Authentication Middleware
 * ────────────────────────
 * Verifies the Firebase ID token from the Authorization header.
 * Attaches the decoded user info to `req.user`.
 */

const { auth, db } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');

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

    // Fetch user profile from Firestore
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(decodedToken.uid).get();

    if (!userDoc.exists) {
      return res.status(401).json({
        success: false,
        message: 'User profile not found. Please complete registration.',
      });
    }

    const userData = userDoc.data();

    // Check email verification
    if (!decodedToken.email_verified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before accessing this resource.',
      });
    }

    // Check account status
    if (userData.status === 'Deactivated') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact the administrator.',
      });
    }

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      role: userData.role,
      status: userData.status,
      name: userData.name,
      department: userData.department,
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

module.exports = { authenticate };
