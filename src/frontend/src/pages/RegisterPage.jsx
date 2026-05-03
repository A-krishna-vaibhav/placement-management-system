import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import {
  HiOutlineEye, HiOutlineEyeOff,
  HiOutlineMail, HiOutlineLockClosed, HiOutlineUser, HiOutlineOfficeBuilding, HiOutlineGlobe,
} from 'react-icons/hi';
import { Button, Alert, Logo } from '../components/ui';
import { referenceAPI } from '../services/api';
import { validateRegisterForm } from '../utils/profileValidation';

const UNIVERSITY_DOMAIN = import.meta.env.VITE_UNIVERSITY_EMAIL_DOMAIN || 'uohyd.ac.in';

const ROLES = [
  { value: 'STUDENT', label: 'Student' },
  { value: 'COMPANY', label: 'Company / Recruiter' },
];

const Field = ({ id, label, children, error, hint }) => (
  <div>
    <label htmlFor={id} className="block text-sm font-medium text-ink-700 mb-1.5">
      {label}
      {hint && <span className="text-xs text-ink-400 font-normal ml-1.5">{hint}</span>}
    </label>
    {children}
    {error && <p className="text-red-600 text-xs mt-1.5">⚠ {error}</p>}
  </div>
);

const inputCls = (err) =>
  `w-full pl-10 pr-3 py-2.5 text-sm bg-white border rounded-md text-ink-800 placeholder-ink-300 focus:outline-none transition-colors ${
    err
      ? 'border-red-400 focus:border-red-500'
      : 'border-ink-200 focus:border-maroon-500'
  }`;

const RegisterPage = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    fullName: '', email: '', password: '', confirmPassword: '',
    role: 'STUDENT',
    schoolId: '', departmentId: '',
    companyName: '', website: '',
  });
  const [errors, setErrors]       = useState({});
  const [showPwd, setShowPwd]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const [schools, setSchools]         = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingSchools, setLoadingSchools]   = useState(false);
  const [loadingDepts, setLoadingDepts]       = useState(false);

  useEffect(() => {
    setLoadingSchools(true);
    referenceAPI.getSchools()
      .then((res) => setSchools(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingSchools(false));
  }, []);

  useEffect(() => {
    if (form.role !== 'STUDENT' || !form.schoolId) {
      setDepartments([]);
      return;
    }
    setLoadingDepts(true);
    referenceAPI.getDepartments(form.schoolId)
      .then((res) => setDepartments(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingDepts(false));
  }, [form.schoolId, form.role]);

  const set = (field) => (e) => {
    const val = e.target ? e.target.value : e;
    setForm((p) => ({ ...p, [field]: val }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: '' }));
    if (field === 'schoolId') setForm((p) => ({ ...p, schoolId: val, departmentId: '' }));
  };

  const validate = () => {
    const { valid, errors: errs } = validateRegisterForm(form);
    setErrors(errs);
    return valid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGlobalError('');
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role,
        ...(form.role === 'STUDENT' && { schoolId: form.schoolId, departmentId: form.departmentId }),
        ...(form.role === 'COMPANY' && { companyName: form.companyName.trim(), website: form.website.trim() }),
      };
      await register(payload);

      if (form.role === 'STUDENT') {
        toast.success('Account created! Check your email to verify.');
        navigate('/login', { state: { message: 'Registration successful! Check your email to verify your account.' } });
      } else {
        toast.success('Application submitted! Wait for admin approval.');
        navigate('/login', { state: { message: 'Application submitted. You will be notified once approved.' } });
      }
    } catch (err) {
      if (err?.data?.errors) {
        const fieldErrors = {};
        err.data.errors.forEach((e) => { if (e.field) fieldErrors[e.field] = e.message; });
        setErrors((p) => ({ ...p, ...fieldErrors }));
      }
      setGlobalError(err?.data?.message || err?.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const isStudent = form.role === 'STUDENT';
  const isCompany = form.role === 'COMPANY';

  return (
    <div className="min-h-screen flex bg-cream-100">

      {/* ── Left panel — maroon branding ── */}
      <div className="hidden lg:flex lg:w-2/5 bg-maroon-deep flex-col justify-between p-12 xl:p-16 relative overflow-hidden">
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />

        <Logo variant="full" size="md" theme="light" />

        <div className="relative">
          <div className="w-12 h-1 bg-gold-400 mb-6 rounded-full" />
          <h2 className="font-display text-4xl xl:text-5xl font-semibold text-white leading-[1.1]">
            Start your<br />
            <span className="text-gold-300 italic">placement journey</span><br />
            here.
          </h2>
          <p className="mt-6 text-base text-white/70 leading-relaxed max-w-xs">
            Students and companies register through this portal to participate in
            the University of Hyderabad's official placement programme.
          </p>
        </div>

        <div className="relative">
          <p className="font-display text-lg text-white/80 italic">ज्ञानं परमं बलम्</p>
          <p className="text-xs text-white/40 mt-1">&ldquo;Knowledge is the supreme strength.&rdquo;</p>
          <p className="mt-6 text-xs text-white/30">© 2026 University of Hyderabad</p>
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-14 bg-cream-100">
        <div className="w-full max-w-lg mx-auto">

          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Logo variant="full" size="sm" />
          </div>

          <div className="mb-7">
            <h1 className="font-display text-3xl font-semibold text-ink-800">Create your account</h1>
            <p className="mt-1.5 text-sm text-ink-500">
              Already registered?{' '}
              <Link to="/login" className="text-maroon-600 font-semibold hover:text-maroon-500 underline-offset-4 hover:underline">
                Sign in
              </Link>
            </p>
          </div>

          {globalError && <Alert variant="danger" className="mb-6">{globalError}</Alert>}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {/* Role selector */}
            <div>
              <p className="block text-sm font-medium text-ink-700 mb-2">I am registering as</p>
              <div className="grid grid-cols-2 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value} type="button"
                    onClick={() => setForm((p) => ({ ...p, role: r.value, schoolId: '', departmentId: '' }))}
                    className={`py-2.5 rounded-md border text-sm font-medium transition-all duration-150 ${
                      form.role === r.value
                        ? 'bg-maroon-700 text-white border-maroon-700 shadow-sm'
                        : 'bg-white text-ink-600 border-ink-200 hover:border-maroon-400 hover:text-maroon-600'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <Field id="fullName" label="Full Name" error={errors.fullName}>
              <div className="relative">
                <HiOutlineUser className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                <input
                  id="fullName" name="fullName" type="text" autoComplete="name"
                  value={form.fullName} onChange={set('fullName')}
                  placeholder="Your full name"
                  className={inputCls(errors.fullName)}
                />
              </div>
            </Field>

            {/* Email */}
            <Field
              id="email" label="Email Address"
              hint={isStudent ? `(@${UNIVERSITY_DOMAIN} required)` : undefined}
              error={errors.email}
            >
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                <input
                  id="email" name="email" type="email" autoComplete="email"
                  value={form.email} onChange={set('email')}
                  placeholder={isStudent ? `yourname@${UNIVERSITY_DOMAIN}` : 'recruiter@company.com'}
                  className={inputCls(errors.email)}
                />
              </div>
            </Field>

            {/* Student: school + department */}
            {isStudent && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="schoolId" label="School" error={errors.schoolId}>
                  <div className="relative">
                    <HiOutlineOfficeBuilding className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                    <select
                      id="schoolId" value={form.schoolId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setForm((p) => ({ ...p, schoolId: val, departmentId: '' }));
                        if (errors.schoolId) setErrors((p) => ({ ...p, schoolId: '' }));
                      }}
                      className={`${inputCls(errors.schoolId)} appearance-none`}
                      disabled={loadingSchools}
                    >
                      <option value="">{loadingSchools ? 'Loading…' : 'Select school'}</option>
                      {schools.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </Field>

                <Field id="departmentId" label="Department" error={errors.departmentId}>
                  <div className="relative">
                    <HiOutlineOfficeBuilding className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                    <select
                      id="departmentId" value={form.departmentId}
                      onChange={set('departmentId')}
                      className={`${inputCls(errors.departmentId)} appearance-none`}
                      disabled={!form.schoolId || loadingDepts}
                    >
                      <option value="">{loadingDepts ? 'Loading…' : 'Select dept.'}</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </Field>
              </div>
            )}

            {/* Company: company name + website */}
            {isCompany && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="companyName" label="Company Name" error={errors.companyName}>
                  <div className="relative">
                    <HiOutlineOfficeBuilding className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                    <input
                      id="companyName" type="text"
                      value={form.companyName} onChange={set('companyName')}
                      placeholder="Acme Corp"
                      className={inputCls(errors.companyName)}
                    />
                  </div>
                </Field>

                <Field id="website" label="Website" error={errors.website} hint="(optional)">
                  <div className="relative">
                    <HiOutlineGlobe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                    <input
                      id="website" type="url"
                      value={form.website} onChange={set('website')}
                      placeholder="https://acmecorp.com"
                      className={inputCls(errors.website)}
                    />
                  </div>
                </Field>
              </div>
            )}

            {/* Password + Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field id="password" label="Password" error={errors.password}
                hint="min 6 characters">
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                  <input
                    id="password" type={showPwd ? 'text' : 'password'} autoComplete="new-password"
                    value={form.password} onChange={set('password')}
                    placeholder="Min 8 characters"
                    className={`${inputCls(errors.password)} pr-10`}
                  />
                  <button
                    type="button" onClick={() => setShowPwd((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-700"
                    aria-label={showPwd ? 'Hide password' : 'Show password'}
                  >
                    {showPwd ? <HiOutlineEyeOff className="w-4 h-4" /> : <HiOutlineEye className="w-4 h-4" />}
                  </button>
                </div>
              </Field>

              <Field id="confirmPassword" label="Confirm Password" error={errors.confirmPassword}>
                <div className="relative">
                  <HiOutlineLockClosed className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                  <input
                    id="confirmPassword" type="password" autoComplete="new-password"
                    value={form.confirmPassword} onChange={set('confirmPassword')}
                    placeholder="Re-enter password"
                    className={inputCls(errors.confirmPassword)}
                  />
                </div>
              </Field>
            </div>

            <Button
              type="submit" variant="primary" size="lg" fullWidth loading={submitting}
              className="mt-2"
            >
              {isCompany ? 'Submit Application' : 'Create Account'}
            </Button>

            {isCompany && (
              <p className="text-xs text-ink-400 text-center">
                Company accounts require admin approval before you can sign in.
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
