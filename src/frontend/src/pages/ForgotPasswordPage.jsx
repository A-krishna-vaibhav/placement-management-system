/**
 * Forgot Password Page
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineMail, HiOutlineArrowLeft, HiOutlineCheckCircle } from 'react-icons/hi';
import uohLogo from '../assets/Gemini_Generated_Image_lkoyazlkoyazlkoy.png';

const ForgotPasswordPage = () => {
  const { forgotPassword } = useAuth();
  const [email, setEmail]         = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent]           = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Please enter your email address.'); return; }
    setSubmitting(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      setSent(true); // security: don't reveal existence
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-auth-gradient bg-hero-pattern flex-col justify-between p-12">
        <div />
        
        {/* UoH Logo + Content */}
        <div className="flex flex-col items-center justify-center text-center space-y-6">
          <img
            src={uohLogo}
            alt="University of Hyderabad"
            className="max-w-xs h-auto object-contain filter brightness-110 drop-shadow-lg"
          />
          <div>
            <h2 className="text-white text-3xl font-extrabold mb-2">Reset your password</h2>
            <p className="text-white/70 text-sm max-w-xs mx-auto">
              Enter the email linked to your account and we'll send you a secure reset link.
            </p>
          </div>
        </div>

        <p className="text-white/40 text-xs text-center">© 2026 University of Hyderabad</p>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 bg-surface-50">
        <div className="w-full max-w-md mx-auto">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-surface-500 hover:text-primary-600 mb-8 transition-colors">
            <HiOutlineArrowLeft className="w-4 h-4" /> Back to sign in
          </Link>

          {sent ? (
            <div className="card text-center space-y-5 animate-slide-up">
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto">
                <HiOutlineCheckCircle className="w-9 h-9 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-surface-900">Check your inbox</h2>
                <p className="text-surface-500 text-sm mt-1.5">
                  If <strong className="text-surface-700">{email}</strong> has an account, a reset link has been sent.
                </p>
              </div>
              <Link to="/login" className="btn-primary inline-flex">Back to Sign In</Link>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-surface-900">Forgot your password?</h1>
                <p className="text-sm text-surface-500 mt-1.5">No worries — we'll email you a reset link.</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-5 animate-slide-up" noValidate>
                <div>
                  <label htmlFor="email" className="form-label">Email address</label>
                  <div className="relative">
                    <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                    <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      className="input-field pl-10" placeholder="you@uohyd.ac.in" autoComplete="email" />
                  </div>
                </div>
                <button type="submit" disabled={submitting} className="btn-primary w-full py-3">
                  {submitting ? 'Sending…' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
