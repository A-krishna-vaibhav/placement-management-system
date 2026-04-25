import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const PENDING_TOKEN_KEY = 'pms_pending_token';
const PENDING_EMAIL_KEY = 'pms_pending_email';
const OTP_PENDING_KEY   = 'pms_otp_pending';

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser]   = useState(null);
  const [userProfile, setUserProfile]   = useState(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState(null);
  const [pendingEmail, setPendingEmail] = useState(
    () => sessionStorage.getItem(PENDING_EMAIL_KEY) || ''
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      // Don't fetch profile while OTP is still pending (mid-login flow)
      if (user && !sessionStorage.getItem(OTP_PENDING_KEY)) {
        try {
          const token = await user.getIdToken();
          const response = await authAPI.getProfile(token);
          setUserProfile(response.data);
        } catch {
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  /* ─── Register ─── */
  const register = async (payload) => {
    setError(null);
    try {
      return await authAPI.register(payload);
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  /* ─── Login Step 1 — Firebase auth + OTP issuance (or direct for exempt roles) ─── */
  const startLogin = async (email, password) => {
    setError(null);
    try {
      const cred  = await signInWithEmailAndPassword(auth, email, password);
      const token = await cred.user.getIdToken();

      const response = await authAPI.login(token);

      if (response.data?.otpRequired === false) {
        // OTP-exempt role (ADMIN / TPO / FACULTY) — session is complete
        sessionStorage.removeItem(PENDING_TOKEN_KEY);
        sessionStorage.removeItem(PENDING_EMAIL_KEY);
        sessionStorage.removeItem(OTP_PENDING_KEY);
        setPendingEmail('');
        setUserProfile(response.data);
      } else {
        // OTP required — store pending state for the verify-otp page
        sessionStorage.setItem(PENDING_TOKEN_KEY, token);
        sessionStorage.setItem(PENDING_EMAIL_KEY, email);
        sessionStorage.setItem(OTP_PENDING_KEY, '1');
        setPendingEmail(email);
      }

      return response;
    } catch (err) {
      sessionStorage.removeItem(PENDING_TOKEN_KEY);
      sessionStorage.removeItem(PENDING_EMAIL_KEY);
      sessionStorage.removeItem(OTP_PENDING_KEY);
      setError(err.message || 'Sign-in failed');
      // Preserve the Firebase error code so LoginPage can show a specific message
      const richErr = new Error(err.message || 'Sign-in failed');
      richErr.code = err.code;
      throw richErr;
    }
  };

  /* ─── Login Step 2 — OTP verification ─── */
  const completeLogin = async (otp) => {
    setError(null);
    const token = sessionStorage.getItem(PENDING_TOKEN_KEY);
    if (!token) {
      const err = new Error('Session expired. Please sign in again.');
      setError(err.message);
      throw err;
    }
    try {
      const response = await authAPI.verifyLoginOTP(token, otp);
      sessionStorage.removeItem(PENDING_TOKEN_KEY);
      sessionStorage.removeItem(PENDING_EMAIL_KEY);
      sessionStorage.removeItem(OTP_PENDING_KEY);
      setPendingEmail('');
      setUserProfile(response.data);
      return response;
    } catch (err) {
      setError(err.message || 'OTP verification failed');
      throw err;
    }
  };

  /* ─── Resend OTP (re-calls /login with stored token) ─── */
  const startLoginResend = async () => {
    setError(null);
    const token = sessionStorage.getItem(PENDING_TOKEN_KEY);
    if (!token) {
      const err = new Error('Session expired. Please sign in again.');
      setError(err.message);
      throw err;
    }
    try {
      return await authAPI.login(token);
    } catch (err) {
      setError(err.message || 'Could not resend code');
      throw err;
    }
  };

  /* ─── Google sign-in (Google is already 2FA — no OTP step) ─── */
  const loginWithGoogle = async () => {
    setError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const token  = await result.user.getIdToken();
      try {
        const response = await authAPI.login(token);
        setUserProfile(response.data);
        return response;
      } catch (err) {
        if (err.status === 404) {
          await signOut(auth);
          throw new Error('No account found. Please register first, then sign in with Google.');
        }
        throw err;
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
      throw err;
    }
  };

  /* ─── Forgot password ─── */
  const forgotPassword = async (email) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
      throw err;
    }
  };

  /* ─── Logout ─── */
  const logout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem(PENDING_TOKEN_KEY);
      sessionStorage.removeItem(PENDING_EMAIL_KEY);
      sessionStorage.removeItem(OTP_PENDING_KEY);
      setPendingEmail('');
      setUserProfile(null);
      setCurrentUser(null);
    } catch (err) {
      setError(err.message || 'Logout failed');
      throw err;
    }
  };

  const getToken = async () => {
    if (currentUser) return await currentUser.getIdToken();
    return null;
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    pendingEmail,
    register,
    startLogin,
    completeLogin,
    startLoginResend,
    loginWithGoogle,
    forgotPassword,
    logout,
    getToken,
    setError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
