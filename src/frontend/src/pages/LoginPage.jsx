import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineEye, HiOutlineEyeOff,
  HiOutlineMail, HiOutlineLockClosed,
} from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import { Button, Alert, Logo } from '../components/ui';

const LoginPage = () => {
  const { startLogin, loginWithGoogle, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState('');
  const [showResetHint, setShowResetHint] = useState(false);
  const [resetSending, setResetSending]   = useState(false);

  const infoMessage = location.state?.message;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setShowResetHint(false);
    if (!email.trim() || !password) {
      setError('Please enter both email and password.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await startLogin(email.trim().toLowerCase(), password);
      if (response.data?.otpRequired === false) {
        toast.success(`Welcome, ${response.data.fullName || 'back'}!`);
        navigate('/dashboard', { replace: true });
      } else {
        toast.success('Code sent. Check your inbox.');
        navigate('/verify-otp', { replace: true });
      }
    } catch (err) {
      const code = err?.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password') {
        setError('Incorrect password. If you signed up with Google and never set a password, use the button below to set one.');
        setShowResetHint(true);
      } else if (code === 'auth/user-not-found') {
        setError('No account found with this email. Please register first.');
      } else if (code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please wait a few minutes or reset your password.');
        setShowResetHint(true);
      } else {
        setError(err?.message || 'Sign-in failed. Please check your credentials.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendReset = async () => {
    if (!email.trim()) {
      toast.error('Enter your email address above first.');
      return;
    }
    setResetSending(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      toast.success('Reset link sent — check your inbox (and spam folder).');
      setShowResetHint(false);
      setError('');
    } catch (err) {
      toast.error(err?.message || 'Could not send reset email. Try the "Forgot password?" link.');
    } finally {
      setResetSending(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      const response = await loginWithGoogle();
      toast.success(`Welcome, ${response.data.fullName || response.data.name || 'back'}!`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(err?.message || 'Google sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-cream-100">

      {/* ── Left panel — branding ── */}
      <div className="hidden lg:flex lg:w-3/5 bg-paper-texture flex-col justify-between p-12 xl:p-16">
        <Logo variant="full" size="md" />

        <div className="max-w-xl">
          <div className="uoh-bar mb-6"></div>
          <h2 className="font-display text-5xl xl:text-6xl font-semibold text-ink-800 leading-[1.05] text-balance">
            The bridge between<br />
            <span className="text-maroon-600 italic">your degree</span> and<br />
            your first offer.
          </h2>
          <p className="mt-8 text-lg text-ink-500 max-w-md leading-relaxed">
            The University of Hyderabad Placement Management System connects students,
            faculty coordinators, the TPO, and recruiters in one institutional workflow.
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-3 gap-6 max-w-lg">
            {[['Students', '5,000+'], ['Recruiters', '300+'], ['Schools', '12']].map(([label, val]) => (
              <div key={label}>
                <p className="font-display text-3xl font-semibold text-maroon-600">{val}</p>
                <p className="text-xs uppercase tracking-wider text-ink-400 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-ink-100">
            <p className="font-display text-lg text-ink-700 italic">सा विद्या या विमुक्तये</p>
            <p className="text-xs text-ink-400 mt-1">&ldquo;That which liberates is knowledge.&rdquo;</p>
          </div>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 bg-maroon-deep relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

        <div className="w-full max-w-md mx-auto relative">
          <div className="lg:hidden mb-8">
            <Logo variant="full" size="sm" theme="light" />
          </div>

          <div className="mb-8">
            <h1 className="font-display text-3xl font-semibold text-white">Sign in</h1>
            <p className="mt-1.5 text-sm text-white/70">
              Don&rsquo;t have an account?{' '}
              <Link to="/register" className="text-gold-300 font-semibold hover:text-gold-200 underline-offset-4 hover:underline">
                Register here
              </Link>
            </p>
          </div>

          {infoMessage && (
            <div className="mb-6 flex items-start gap-3 px-4 py-3 rounded-md bg-white/10 border border-white/20 text-white text-sm">
              {infoMessage}
            </div>
          )}

          {error && (
            <div className="mb-6 space-y-3">
              <Alert variant="danger">{error}</Alert>
              {showResetHint && (
                <button
                  type="button"
                  onClick={handleSendReset}
                  disabled={resetSending}
                  className="w-full py-2 text-sm font-medium rounded-md bg-gold-500/20 border border-gold-400/40 text-gold-300 hover:bg-gold-500/30 transition-colors disabled:opacity-50"
                >
                  {resetSending ? 'Sending…' : 'Send me a password reset link'}
                </button>
              )}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5">
                Email address
              </label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                <input
                  id="email" type="email" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@uohyd.ac.in"
                  className="w-full pl-10 pr-3 py-2.5 text-sm bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:border-gold-400 focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-white">Password</label>
                <Link to="/forgot-password" className="text-xs text-gold-300 font-medium hover:text-gold-200">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50 pointer-events-none" />
                <input
                  id="password" type={showPwd ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 text-sm bg-white/10 border border-white/20 rounded-md text-white placeholder-white/40 focus:border-gold-400 focus:outline-none transition-colors"
                />
                <button
                  type="button" onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white"
                  aria-label={showPwd ? 'Hide password' : 'Show password'}
                >
                  {showPwd ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit" variant="primary" size="lg" fullWidth loading={submitting}
              className="!bg-white !text-maroon-700 hover:!bg-cream-100 mt-2"
            >
              Continue
            </Button>

            <div className="divider-uoh !text-white/40 before:!bg-white/20 after:!bg-white/20">
              <span>or</span>
            </div>

            <Button
              type="button" variant="secondary" size="md" fullWidth
              onClick={handleGoogle} disabled={submitting}
              icon={<FcGoogle className="w-5 h-5" />}
              className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
            >
              Continue with Google
            </Button>
          </form>

          <p className="mt-10 text-xs text-white/40 text-center">
            © 2026 University of Hyderabad · Placement Guidance and Advisory Bureau
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
