import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineArrowLeft, HiOutlineCheckCircle } from 'react-icons/hi';
import { Button, Logo } from '../components/ui';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail]           = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent]             = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email address.'); return; }
    setSubmitting(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setSent(true); // don't reveal account existence
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
            Reset your<br />
            <span className="text-gold-300 italic">password</span>
          </h2>
          <p className="mt-5 text-white/70 text-base max-w-xs leading-relaxed">
            Enter the email linked to your account and we&rsquo;ll send you a secure reset link.
          </p>
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

          {sent ? (
            <div className="card p-8 text-center space-y-5 animate-slide-up">
              <div className="w-16 h-16 bg-success-bg rounded-2xl flex items-center justify-center mx-auto">
                <HiOutlineCheckCircle className="w-9 h-9 text-success" />
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold text-ink-800">Check your inbox</h2>
                <p className="text-ink-500 text-sm mt-1.5">
                  If <strong className="text-ink-700">{email}</strong> has an account, a reset link has been sent.
                </p>
              </div>
              <Button variant="primary" size="md" as={Link} to="/login">
                Back to Sign In
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <div className="uoh-bar mb-4" />
                <h1 className="font-display text-2xl font-semibold text-ink-800">Forgot your password?</h1>
                <p className="text-sm text-ink-500 mt-1.5">No worries — we&rsquo;ll email you a reset link.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up" noValidate>
                <div>
                  <label htmlFor="email" className="form-label">Email address</label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                    <input
                      id="email" type="email" value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10"
                      placeholder="you@uohyd.ac.in"
                      autoComplete="email"
                    />
                  </div>
                </div>
                <Button type="submit" variant="primary" size="lg" fullWidth loading={submitting}>
                  Send Reset Link
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
