import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineMail } from 'react-icons/hi';
import { Button, Alert, Logo } from '../components/ui';

const OTP_LENGTH = 6;

const VerifyOTPPage = () => {
  const { completeLogin, startLoginResend, pendingEmail } = useAuth();
  const navigate = useNavigate();

  const [digits, setDigits]         = useState(Array(OTP_LENGTH).fill(''));
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending]   = useState(false);
  const [error, setError]           = useState('');
  const [attemptsLeft, setAttemptsLeft] = useState(null);

  const inputRefs = useRef([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const focusNext = (idx) => {
    if (idx < OTP_LENGTH - 1) inputRefs.current[idx + 1]?.focus();
  };
  const focusPrev = (idx) => {
    if (idx > 0) inputRefs.current[idx - 1]?.focus();
  };

  const handleChange = (idx, raw) => {
    const char = raw.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[idx] = char;
    setDigits(next);
    setError('');
    if (char) focusNext(idx);
  };

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace') {
      if (digits[idx]) {
        const next = [...digits]; next[idx] = ''; setDigits(next);
      } else {
        focusPrev(idx);
      }
    } else if (e.key === 'ArrowLeft') {
      focusPrev(idx);
    } else if (e.key === 'ArrowRight') {
      focusNext(idx);
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!text) return;
    const next = Array(OTP_LENGTH).fill('');
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    setError('');
    const lastFilled = Math.min(text.length, OTP_LENGTH - 1);
    inputRefs.current[lastFilled]?.focus();
  };

  const handleSubmit = useCallback(async (e) => {
    e?.preventDefault();
    const otp = digits.join('');
    if (otp.length < OTP_LENGTH) {
      setError('Please enter all 6 digits.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      const response = await completeLogin(otp);
      toast.success(`Welcome, ${response.data?.fullName || 'back'}!`);
      const roleHome = {
        STUDENT: '/dashboard',
        COMPANY: '/dashboard',
        TPO:     '/dashboard',
        FACULTY: '/dashboard',
        ADMIN:   '/dashboard',
      }[response.data?.role] || '/dashboard';
      navigate(roleHome, { replace: true });
    } catch (err) {
      const msg = err?.data?.message || err?.message || 'Invalid code. Please try again.';
      const remaining = err?.data?.attemptsRemaining;
      setError(remaining !== undefined ? `${msg} (${remaining} attempt${remaining !== 1 ? 's' : ''} left)` : msg);
      if (remaining !== undefined) setAttemptsLeft(remaining);
      if (remaining === 0) {
        toast.error('Too many failed attempts. Please sign in again.');
        navigate('/login', { replace: true });
      }
      setDigits(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setSubmitting(false);
    }
  }, [digits, completeLogin, navigate]);

  useEffect(() => {
    if (digits.every((d) => d !== '') && !submitting) {
      handleSubmit();
    }
  }, [digits]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleResend = async () => {
    if (!pendingEmail) { navigate('/login', { replace: true }); return; }
    setResending(true);
    setError('');
    try {
      await startLoginResend();
      toast.success('New code sent. Check your inbox.');
      setDigits(Array(OTP_LENGTH).fill(''));
      setAttemptsLeft(null);
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } catch (err) {
      toast.error(err?.message || 'Could not resend code.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-maroon-deep relative overflow-hidden">
      {/* Decorative halo */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold-500/10 rounded-full blur-3xl -translate-y-1/3 translate-x-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-maroon-800/50 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4 pointer-events-none" />

      <div className="w-full max-w-sm mx-auto px-6 py-10 relative">
        <div className="mb-8 flex justify-center">
          <Logo variant="full" size="md" theme="light" />
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl px-8 py-10 backdrop-blur-sm">
          <div className="flex justify-center mb-5">
            <div className="w-14 h-14 bg-gold-400/20 rounded-full flex items-center justify-center">
              <HiOutlineMail className="w-7 h-7 text-gold-300" />
            </div>
          </div>

          <h1 className="font-display text-2xl font-semibold text-white text-center">Verify your identity</h1>
          <p className="mt-2 text-sm text-white/60 text-center">
            We sent a 6-digit code to{' '}
            {pendingEmail
              ? <span className="text-gold-300 font-medium">{pendingEmail}</span>
              : 'your email address'
            }.
          </p>

          {error && <Alert variant="danger" className="mt-5">{error}</Alert>}

          <form onSubmit={handleSubmit} className="mt-7" noValidate>
            <div className="flex justify-center gap-2" onPaste={handlePaste}>
              {digits.map((d, idx) => (
                <input
                  key={idx}
                  ref={(el) => (inputRefs.current[idx] = el)}
                  type="text" inputMode="numeric" maxLength={1}
                  value={d}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-11 h-14 text-center text-xl font-bold bg-white/10 border border-white/20 rounded-lg text-white focus:border-gold-400 focus:outline-none focus:bg-white/15 transition-all caret-transparent"
                  aria-label={`OTP digit ${idx + 1}`}
                />
              ))}
            </div>

            <Button
              type="submit" variant="primary" size="lg" fullWidth loading={submitting}
              className="!bg-white !text-maroon-700 hover:!bg-cream-100 mt-7"
            >
              Verify
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-white/50">
              Didn&rsquo;t receive a code?{' '}
              <button
                type="button" onClick={handleResend} disabled={resending}
                className="text-gold-300 font-medium hover:text-gold-200 disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend'}
              </button>
            </p>
            <Link to="/login" className="mt-3 inline-block text-xs text-white/40 hover:text-white/70">
              ← Back to sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyOTPPage;
