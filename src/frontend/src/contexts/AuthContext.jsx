/**
 * Auth Context
 * ────────────
 * Provides authentication state and methods to the entire app.
 * Handles Firebase Auth state changes and Firestore profile sync.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendEmailVerification,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user && user.emailVerified) {
        try {
          const token = await user.getIdToken();
          const response = await authAPI.login(token);
          setUserProfile(response.data);
        } catch (err) {
          console.error('Failed to fetch profile:', err);
          setUserProfile(null);
        }
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Register with email & password
  const register = async ({ name, email, password, department, role }) => {
    try {
      setError(null);

      // 1. Call backend to create user in Firebase Auth + Firestore
      const response = await authAPI.register({
        name,
        email,
        password,
        department,
        role,
      });

      // 2. Sign in on the client side to get the user object
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      // 3. Send verification email
      await sendEmailVerification(userCredential.user);

      // 4. Sign out until verified
      await signOut(auth);

      return response;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  // Login with email & password
  const login = async (email, password) => {
    try {
      setError(null);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        await signOut(auth);
        throw new Error('Please verify your email before logging in.');
      }

      // Get token and sync with backend
      const token = await user.getIdToken();
      const response = await authAPI.login(token);
      setUserProfile(response.data);

      return response;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  // Login with Google
  const loginWithGoogle = async () => {
    try {
      setError(null);

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Get token and sync with backend
      const token = await user.getIdToken();

      try {
        const response = await authAPI.login(token);
        setUserProfile(response.data);
        return response;
      } catch (err) {
        // If user profile not found, they need to complete registration
        if (err.status === 404) {
          // Sign out and redirect to registration
          await signOut(auth);
          throw new Error(
            'No account found. Please register first, then sign in with Google.'
          );
        }
        throw err;
      }
    } catch (err) {
      setError(err.message || 'Google sign-in failed');
      throw err;
    }
  };

  // Forgot password
  const forgotPassword = async (email) => {
    try {
      setError(null);
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
      throw err;
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      setUserProfile(null);
      setCurrentUser(null);
    } catch (err) {
      setError(err.message || 'Logout failed');
      throw err;
    }
  };

  // Get current ID token
  const getToken = async () => {
    if (currentUser) {
      return await currentUser.getIdToken();
    }
    return null;
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    register,
    login,
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
