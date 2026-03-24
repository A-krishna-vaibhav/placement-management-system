/**
 * Registration Page
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { HiEye, HiEyeOff, HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineOfficeBuilding } from 'react-icons/hi';
import uohLogo from '../assets/Gemini_Generated_Image_lkoyazlkoyazlkoy.png';

const UNIVERSITY_DOMAIN = import.meta.env.VITE_UNIVERSITY_EMAIL_DOMAIN || 'uohyd.ac.in';

const ROLES = [
  { value: 'Student',  label: 'Student' },
  { value: 'Faculty',  label: 'Faculty (TPO)' },
  { value: 'Company',  label: 'Company / Recruiter' },
];

const DEPARTMENTS = [
  'Computer Science','Artificial Intelligence','Information Technology',
  'Electronics & Communication','Mathematics & Statistics','Physics',
  'Chemistry','Biotechnology','Management Studies','Other',
];

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name:'', email:'', password:'', confirmPassword:'', department:'', role:'' });
  const [errors, setErrors]     = useState({});
  const [showPwd, setShowPwd]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    if (errors[name]) setErrors((p) => ({ ...p, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!form.name.trim() || form.name.trim().length < 2) errs.name = 'Full name (min 2 chars) is required.';
    if (!form.email.trim()) { errs.email = 'Email is required.'; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { errs.email = 'Invalid email.'; }
    else if (form.role === 'Student' && !form.email.endsWith(`@${UNIVERSITY_DOMAIN}`)) {
      errs.email = `Students must use their university email (@${UNIVERSITY_DOMAIN}).`;
    }
    if (!form.password) { errs.password = 'Password is required.'; }
    else if (form.password.length < 8) { errs.password = 'Min 8 characters.'; }
    else if (!/[A-Z]/.test(form.password)) { errs.password = 'Need at least one uppercase letter.'; }
    else if (!/[0-9]/.test(form.password)) { errs.password = 'Need at least one number.'; }
    else if (!/[^A-Za-z0-9]/.test(form.password)) { errs.password = 'Need at least one special character.'; }
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!form.department) errs.department = 'Department is required.';
    if (!form.role) errs.role = 'Please select a role.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await register({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password, department: form.department, role: form.role });
      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/login', { state: { message: 'Registration successful! Check your email to verify your account.' } });
    } catch (err) {
      if (err?.data?.errors) {
        const fieldErrors = {};
        err.data.errors.forEach((e) => { if (e.field) fieldErrors[e.field] = e.message; });
        setErrors((p) => ({ ...p, ...fieldErrors }));
        toast.error(err?.data?.message || 'Registration failed. Please check the form.');
        return;
      }
      toast.success('Registration submitted! Please wait for admin approval.');
      navigate('/login', { state: { message: 'Registration submitted! Please wait for admin approval.' } });
    } finally {
      setSubmitting(false);
    }
  };

  const Field = ({ id, label, children, error, hint }) => (
    <div>
      <label htmlFor={id} className="form-label">{label}{hint && <span className="text-xs text-surface-400 font-normal ml-1.5">{hint}</span>}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1">⚠ {error}</p>}
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-auth-gradient bg-hero-pattern flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-lg">P</span>
          </div>
          <span className="text-white font-bold text-lg">PMS · UoH</span>
        </div>

        {/* UoH Logo Image */}
        <div className="flex justify-center items-center">
          <img
            src={uohLogo}
            alt="University of Hyderabad"
            className="max-w-xs h-auto object-contain filter brightness-110 drop-shadow-lg"
          />
        </div>

        <div>
          <h2 className="text-white text-3xl font-extrabold mb-3">Join the platform</h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Register as a student, faculty member, or company recruiter to access the University of Hyderabad Placement Portal.
          </p>
        </div>
        <p className="text-white/40 text-xs">© 2026 University of Hyderabad</p>
      </div>

      {/* Right form */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-14 bg-surface-50">
        <div className="w-full max-w-lg mx-auto">
          <div className="lg:hidden flex items-center gap-3 mb-7">
            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-black text-lg">P</span>
            </div>
            <span className="text-primary-600 font-bold text-lg">PMS · UoH</span>
          </div>

          <div className="mb-7">
            <h1 className="text-2xl font-bold text-surface-900">Create your account</h1>
            <p className="mt-1.5 text-sm text-surface-500">
              Already registered?{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:underline">Sign in</Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Role selector (first so email hint updates) */}
            <Field id="role" label="I am registering as" error={errors.role}>
              <div className="grid grid-cols-3 gap-2 mt-0.5">
                {ROLES.map((r) => (
                  <button key={r.value} type="button"
                    onClick={() => { setForm((p) => ({ ...p, role: r.value })); if (errors.role) setErrors((p) => ({ ...p, role: '' })); }}
                    className={`py-2.5 rounded-xl border text-sm font-medium transition-all duration-150
                      ${form.role === r.value
                        ? 'bg-primary-500 text-white border-primary-500 shadow-glow'
                        : 'bg-white text-surface-600 border-surface-200 hover:border-primary-300 hover:text-primary-600'
                      }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {errors.role && <p className="text-red-500 text-xs mt-1.5">⚠ {errors.role}</p>}
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <Field id="name" label="Full Name" error={errors.name}>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input id="name" name="name" type="text" value={form.name} onChange={handleChange}
                    className={`input-field pl-10 ${errors.name ? 'input-error' : ''}`}
                    placeholder="John Doe" />
                </div>
              </Field>

              {/* Department */}
              <Field id="department" label="Department" error={errors.department}>
                <div className="relative">
                  <HiOutlineOfficeBuilding className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <select id="department" name="department" value={form.department} onChange={handleChange}
                    className={`input-field pl-10 ${errors.department ? 'input-error' : ''}`}>
                    <option value="">Select dept.</option>
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </Field>
            </div>

            {/* Email */}
            <Field id="email" label="Email Address"
              hint={form.role === 'Student' ? `(@${UNIVERSITY_DOMAIN} required)` : undefined}
              error={errors.email}>
              <div className="relative">
                <HiOutlineMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input id="email" name="email" type="email" value={form.email} onChange={handleChange}
                  className={`input-field pl-10 ${errors.email ? 'input-error' : ''}`}
                  placeholder={form.role === 'Student' ? `yourname@${UNIVERSITY_DOMAIN}` : 'you@example.com'} />
              </div>
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Password */}
              <Field id="password" label="Password" error={errors.password}>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input id="password" name="password" type={showPwd ? 'text' : 'password'}
                    value={form.password} onChange={handleChange}
                    className={`input-field pl-10 pr-10 ${errors.password ? 'input-error' : ''}`}
                    placeholder="Min 8 chars" />
                  <button type="button" onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-700">
                    {showPwd ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              {/* Confirm Password */}
              <Field id="confirmPassword" label="Confirm Password" error={errors.confirmPassword}>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input id="confirmPassword" name="confirmPassword" type="password"
                    value={form.confirmPassword} onChange={handleChange}
                    className={`input-field pl-10 ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Re-enter password" />
                </div>
              </Field>
            </div>

            <button type="submit" disabled={submitting} className="btn-primary w-full py-3 text-base mt-2">
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Creating account…
                </span>
              ) : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
