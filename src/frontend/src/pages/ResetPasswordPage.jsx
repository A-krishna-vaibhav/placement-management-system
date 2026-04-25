import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { auth } from '../config/firebase';
import toast from 'react-hot-toast';
import {
  HiOutlineKey, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff,
  HiOutlineCheckCircle, HiOutlineExclamationCircle, HiOutlineArrowLeft,
} from 'react-icons/hi';
import { Button, Logo } from '../components/ui';

const ResetPasswordPage = () => {
  const [searchParams]  = useSearchParams();
  const oobCode         = searchParams.get('oobCode');

  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [submitting, setSubmitting]         = useState(false);
  const [success, setSuccess]               = useState(false);
  const [error, setError]                   = useState('');
  const [validCode, setValidCode]           = useState(null);

  useEffect(() => {
    if (!oobCode) { setError('Invalid or missing reset link.'); setValidCode(false); return; }
    verifyPasswordResetCode(auth, oobCode)
      .then(() => setValidCode(true))
      .catch(() => { setValidCode(false); setError('This reset link is invalid or has expired.'); });
  }, [oobCode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
      toast.error('Password needs 8+ chars with uppercase, lowercase and a number.');
      return;
    }
    if (password !== confirmPassword) { toast.error('Passwords do not match.'); return; }
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
    <div className="min-h-screen flex bg-cream-100">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-maroon-deep flex-col justify-between p-12">
        <Logo variant="full" size="md" theme="light" />
        <div>
          <div className="w-12 h-1 bg-gold-400 mb-6 rounded-full" />
          <h2 className="font-display text-4xl font-semibold text-white leading-tight">
            Set your<br />
            <span className="text-gold-300 italic">new password</span>
          </h2>
          <ul className="mt-6 space-y-3 text-white/70 text-sm">
            {['At least 8 characters', 'Mix uppercase, lowercase & number', 'Never reuse old passwords'].map((tip) => (
              <li key={tip} className="flex items-center gap-2">
                <HiOutlineCheckCircle className="w-4 h-4 text-gold-300 flex-shrink-0" />
                {tip}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-white/30 text-xs">© 2026 University of Hyderabad</p>
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 bg-cream-100">
        <div className="w-full max-w-md mx-auto">
          <div className="lg:hidden mb-8">
            <Logo variant="full" size="sm" />
          </div>

          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-maroon-600 mb-8 transition-colors">
            <HiOutlineArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>

          {validCode === null && (
            <div className="flex flex-col items-center justify-center gap-4 py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-maroon-600" />
              <p className="text-sm text-ink-500">Verifying your reset link…</p>
            </div>
          )}

          {validCode === false && (
            <div className="card p-8 text-center space-y-5">
              <div className="w-16 h-16 bg-danger-bg rounded-full flex items-center justify-center mx-auto">
                <HiOutlineExclamationCircle className="w-9 h-9 text-danger" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-ink-800 mb-2">Link Invalid</h1>
                <p className="text-ink-500 text-sm">{error}</p>
              </div>
              <Button variant="primary" size="md" as={Link} to="/forgot-password">
                Request a new link
              </Button>
            </div>
          )}

          {success && (
            <div className="card p-8 text-center space-y-5">
              <div className="w-16 h-16 bg-success-bg rounded-full flex items-center justify-center mx-auto">
                <HiOutlineCheckCircle className="w-9 h-9 text-success" />
              </div>
              <div>
                <h1 className="font-display text-xl font-semibold text-ink-800 mb-2">Password Reset!</h1>
                <p className="text-ink-500 text-sm">Your password has been updated. Sign in with your new credentials.</p>
              </div>
              <Button variant="primary" size="md" as={Link} to="/login">Sign in now</Button>
            </div>
          )}

          {validCode && !success && (
            <>
              <div className="mb-8">
                <div className="uoh-bar mb-4" />
                <div className="w-12 h-12 bg-maroon-50 rounded-2xl flex items-center justify-center mb-4">
                  <HiOutlineKey className="w-6 h-6 text-maroon-600" />
                </div>
                <h1 className="font-display text-2xl font-semibold text-ink-800 mb-1">New Password</h1>
                <p className="text-ink-500 text-sm">Enter and confirm your new password below.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div>
                  <label htmlFor="password" className="form-label">New Password</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                    <input
                      id="password" type={showPassword ? 'text' : 'password'}
                      value={password} onChange={(e) => setPassword(e.target.value)}
                      className="input-field pl-10 pr-10" placeholder="Min 8 characters" required
                    />
                    <button type="button" onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700" tabIndex={-1}>
                      {showPassword ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                  <div className="relative">
                    <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                    <input
                      id="confirmPassword" type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      className="input-field pl-10 pr-10" placeholder="Re-enter new password" required
                    />
                    <button type="button" onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700" tabIndex={-1}>
                      {showConfirm ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {password.length > 0 && (
                  <p className={`text-xs font-medium ${/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password) ? 'text-success' : 'text-warning'}`}>
                    {/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password) ? '✓ Password meets requirements' : 'Needs uppercase, lowercase, number, 8+ chars'}
                  </p>
                )}

                <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
                  Reset Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
