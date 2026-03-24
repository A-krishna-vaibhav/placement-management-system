/**
 * Verify Email Page
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerification } from 'firebase/auth';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineMailOpen, HiOutlineRefresh, HiOutlineLogout } from 'react-icons/hi';

const VerifyEmailPage = () => {
  const { currentUser, logout } = useAuth();
  const navigate  = useNavigate();
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!currentUser) return;
    setResending(true);
    try {
      await sendEmailVerification(currentUser);
      toast.success('Verification email sent! Check your inbox.');
    } catch {
      toast.error('Failed to resend. Try again later.');
    } finally {
      setResending(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-sm animate-slide-up">
        <div className="card text-center space-y-5">
          {/* Icon */}
          <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto ring-1 ring-amber-200">
            <HiOutlineMailOpen className="w-8 h-8 text-amber-500" />
          </div>

          <div>
            <h1 className="text-xl font-bold text-surface-900">Verify your email</h1>
            <p className="text-surface-500 text-sm mt-2 leading-relaxed">
              We sent a verification link to{' '}
              <strong className="text-surface-700">{currentUser?.email}</strong>.
              Click the link in the email to activate your account.
            </p>
          </div>

          <div className="bg-surface-50 rounded-xl p-3 text-xs text-surface-500 text-left space-y-1.5">
            <p>✓ Check your spam / junk folder</p>
            <p>✓ Verification links expire after 1 hour</p>
            <p>✓ Contact admin if you keep having trouble</p>
          </div>

          <div className="flex flex-col gap-2.5">
            <button onClick={handleResend} disabled={resending} className="btn-primary gap-2">
              <HiOutlineRefresh className={`w-4 h-4 ${resending ? 'animate-spin' : ''}`} />
              {resending ? 'Sending…' : 'Resend Verification Email'}
            </button>
            <button onClick={handleLogout} className="btn-ghost gap-2 text-surface-500">
              <HiOutlineLogout className="w-4 h-4" />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;
