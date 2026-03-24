/**
 * Reset Password Page — T-17
 * ──────────────────────────
 * Accessed via Firebase reset link.
 * Uses Firebase Client SDK's confirmPasswordReset().
 */

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../config/firebase';
import toast from 'react-hot-toast';
import {
  HiOutlineKey,
  HiOutlineLockClosed,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiArrowLeft,
} from 'react-icons/hi';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get('oobCode');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [validCode, setValidCode] = useState(null);

  useEffect(() => {
    if (!oobCode) {
      setError('Invalid or missing reset link.');
      setValidCode(false);
      return;
    }
    verifyPasswordResetCode(auth, oobCode)
      .then(() => setValidCode(true))
      .catch(() => {
        setValidCode(false);
        setError('This reset link is invalid or has expired.');
      });
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      toast.error(err.message || 'Failed to reset password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <HiOutlineKey className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">PMS</span>
        </div>
        <div className="space-y-6">
          <div className="w-16 h-1 bg-white/40 rounded-full" />
          <h2 className="text-4xl font-bold leading-tight">
            Set your<br />new password
          </h2>
          <p className="text-primary-100 text-lg leading-relaxed">
            Choose a strong, unique password to keep your account secure.
          </p>
          <ul className="space-y-3 text-primary-100 text-sm">
            {['At least 8 characters', 'Mix letters, numbers & symbols', 'Never reuse old passwords'].map((tip) => (
              <li key={tip} className="flex items-center gap-2">
                <HiOutlineCheckCircle className="w-4 h-4 text-accent-300 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-primary-200 text-sm">Placement Management System · UoH</p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-col justify-center px-8 py-12 sm:px-12 lg:px-16 bg-white">
        <div className="w-full max-w-md mx-auto">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-primary-600 mb-8 transition-colors"
          >
            <HiArrowLeft className="w-4 h-4" />
            Back to login
          </Link>

          {/* Verifying code */}
          {validCode === null && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
              <p className="text-sm text-gray-500">Verifying your reset link...</p>
            </div>
          )}

          {/* Invalid link */}
          {validCode === false && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <HiOutlineExclamationCircle className="w-9 h-9 text-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Link Invalid</h1>
                <p className="text-gray-500 text-sm">{error}</p>
              </div>
              <Link to="/forgot-password" className="btn-primary inline-block">
                Request a new link
              </Link>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <HiOutlineCheckCircle className="w-9 h-9 text-green-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
                <p className="text-gray-500 text-sm">
                  Your password has been updated. Sign in with your new credentials.
                </p>
              </div>
              <Link to="/login" className="btn-primary inline-block">
                Sign in now
              </Link>
            </div>
          )}

          {/* Form */}
          {validCode && !success && (
            <>
              <div className="mb-8">
                <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center mb-4">
                  <HiOutlineLockClosed className="w-6 h-6 text-primary-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-1">New Password</h1>
                <p className="text-gray-500 text-sm">Enter and confirm your new password below.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="password" className="form-label">New Password</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="Min 8 characters"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      id="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field pl-10 pr-10"
                      placeholder="Re-enter new password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                    >
                      {showConfirm ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {password.length > 0 && (
                  <p className={`text-xs font-medium ${password.length >= 8 ? 'text-green-600' : 'text-amber-600'}`}>
                    {password.length >= 8 ? '✓ Strong enough' : `${8 - password.length} more character(s) needed`}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
