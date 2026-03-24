/**
 * Login Page
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiOutlineEye, HiOutlineEyeOff, HiOutlineMail, HiOutlineLockClosed } from 'react-icons/hi';
import { FcGoogle } from 'react-icons/fc';
import BgImage from '../assets/Gemini_Generated_Image_lkoyazlkoyazlkoy.png';

const LoginPage = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const infoMessage = location.state?.message;

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) { toast.error('Please enter email and password.'); return; }
    setSubmitting(true);
    try {
      const response = await login(email.trim().toLowerCase(), password);
      toast.success(`Welcome back, ${response.data.name}!`);
      navigateToDashboard(response.data.role);
    } catch (err) {
      toast.error(err?.message || 'Login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setSubmitting(true);
    try {
      const response = await loginWithGoogle();
      toast.success(`Welcome, ${response.data.name}!`);
      navigateToDashboard(response.data.role);
    } catch (err) {
      toast.error(err?.message || 'Google sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const navigateToDashboard = (role) => {
    const from = location.state?.from?.pathname;
    if (from) return navigate(from, { replace: true });
    navigate(role === 'Admin' ? '/admin/users' : '/dashboard', { replace: true });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left: white panel with UoH logo */}
      <div className="hidden lg:flex lg:w-1/2 bg-white flex-col justify-center items-center p-8 relative overflow-hidden min-h-screen">
        <div className="flex flex-col justify-center items-center w-full">
          {/* Heading */}
          <h2 className="text-gray-900 text-4xl font-serif font-extrabold text-center leading-tight mb-6">
            Your career journey<br />starts here.
          </h2>

          {/* Logo - Centered and Bigger */}
          <img 
            src={BgImage}
            alt="University of Hyderabad Logo"
            className="w-full max-w-sm h-auto object-contain drop-shadow-lg my-8"
          />

          {/* Description */}
          <p className="text-gray-600 text-center text-sm leading-relaxed max-w-md mb-8">
            University of Hyderabad's Placement Management System connects students,
            faculty, and companies - all in one place.
          </p>
          
          {/* Statistics */}
          <div className="flex gap-12 pt-4">
            {[['Students', '2,400+'], ['Companies', '180+'], ['Offers', '940+']].map(([label, val]) => (
              <div key={label} className="text-center">
                <p className="text-gray-900 text-2xl font-bold">{val}</p>
                <p className="text-gray-500 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form panel with blue gradient */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-9 h-9 bg-white/30 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <span className="text-white font-black text-lg">P</span>
            </div>
            <span className="text-white font-bold text-lg tracking-tight">PMS · UoH</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">Sign in to your account</h1>
            <p className="mt-1.5 text-sm text-white/70">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-100 font-semibold hover:underline">
                Create one
              </Link>
            </p>
          </div>

          {/* Info banner */}
          {infoMessage && (
            <div className="alert-success mb-6">
              <span>{infoMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5" noValidate>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5">Email address</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  id="email" type="email" autoComplete="email"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all duration-200"
                  placeholder="you@uohyd.ac.in"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-sm font-medium text-white">Password</label>
                <Link to="/forgot-password" className="text-xs text-blue-100 font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
                <input
                  id="password" type={showPwd ? 'text' : 'password'} autoComplete="current-password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-white/20 border border-white/30 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition-all duration-200"
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/50 hover:text-white">
                  {showPwd ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={submitting} className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none bg-white text-blue-600 px-5 py-3 text-base w-full mt-1 hover:bg-blue-50 focus-visible:ring-white">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>

            {/* Divider */}
            <div className="relative flex items-center my-4">
              <div className="flex-1 border-t border-white/20"></div>
              <span className="mx-3 text-xs text-white/50 font-medium whitespace-nowrap">or continue with</span>
              <div className="flex-1 border-t border-white/20"></div>
            </div>

            <button type="button" onClick={handleGoogle} disabled={submitting} className="inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] select-none bg-white/20 text-white border border-white/30 px-5 py-2.5 text-sm w-full hover:bg-white/30 focus-visible:ring-white">
              <FcGoogle className="w-5 h-5" />
              Sign in with Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
