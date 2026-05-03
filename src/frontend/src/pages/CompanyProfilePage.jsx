import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { companyAPI } from '../services/api';
import { Button, Badge, Alert } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineOfficeBuilding,
  HiOutlinePencil,
  HiOutlineGlobe,
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineExternalLink,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineCalendar,
} from 'react-icons/hi';

/* ── Status config ─────────────────────────────────────────────── */
const COMPANY_STATUS_VARIANT = {
  PENDING_APPROVAL: 'warning',
  ACTIVE:           'success',
  REJECTED:         'danger',
  SUSPENDED:        'neutral',
};

const STATUS_BANNER = {
  PENDING_APPROVAL: {
    bg:   'bg-amber-50 border-amber-200',
    icon: <HiOutlineClock className="w-4 h-4 text-amber-600 flex-shrink-0" />,
    text: 'Your account is pending TPO approval. You will be notified once approved.',
    textCls: 'text-amber-800',
  },
  REJECTED: {
    bg:   'bg-red-50 border-red-200',
    icon: <HiOutlineX className="w-4 h-4 text-red-600 flex-shrink-0" />,
    text: 'Your application was rejected. Please contact the TPO office for more information.',
    textCls: 'text-red-800',
  },
  SUSPENDED: {
    bg:   'bg-ink-50 border-ink-200',
    icon: <HiOutlineX className="w-4 h-4 text-ink-500 flex-shrink-0" />,
    text: 'Your account has been suspended. Contact support for assistance.',
    textCls: 'text-ink-700',
  },
};

/* ── Reusable read-only field ───────────────────────────────────── */
function InfoField({ label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest">{label}</p>
      <div className="text-sm text-ink-800 font-medium">{children}</div>
    </div>
  );
}

/* ── Reusable edit field ────────────────────────────────────────── */
function EditField({ label, error, children }) {
  return (
    <div className="space-y-1.5">
      <label className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-600 flex items-center gap-1">⚠ {error}</p>}
    </div>
  );
}

const inputCls = (hasErr = false) =>
  `w-full px-3 py-2.5 text-sm rounded-lg border bg-white text-ink-800 placeholder-ink-300
   focus:outline-none focus:ring-2 transition-all duration-150
   ${hasErr
     ? 'border-red-400 focus:ring-red-300'
     : 'border-ink-200 focus:border-maroon-400 focus:ring-maroon-200'}`;

/* ── Divider ────────────────────────────────────────────────────── */
function SectionDivider({ label }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-ink-100" />
      <span className="text-[10px] font-semibold text-ink-400 uppercase tracking-widest flex-shrink-0">
        {label}
      </span>
      <div className="h-px flex-1 bg-ink-100" />
    </div>
  );
}

/* ── Format date ────────────────────────────────────────────────── */
const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : null;

/* ════════════════════════════════════════════════════════════════ */
const CompanyProfilePage = () => {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState({});
  const [errors,  setErrors]  = useState({});

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const res   = await companyAPI.getProfile(token);
      setProfile(res.data);
      setForm({
        companyName: res.data.companyName        || '',
        website:     res.data.website            || '',
        description: res.data.description        || '',
        hrName:      res.data.hrContact?.name    || '',
        hrPhone:     res.data.hrContact?.phone   || '',
      });
    } catch (e) {
      toast.error(e.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const validate = () => {
    const errs = {};
    if (!form.companyName.trim())
      errs.companyName = 'Company name is required.';
    else if (form.companyName.trim().length > 150)
      errs.companyName = 'Company name cannot exceed 150 characters.';

    if (form.website.trim()) {
      try { new URL(form.website.trim()); }
      catch { errs.website = 'Enter a valid URL (e.g. https://company.com).'; }
    }

    if (form.hrPhone.trim() && !/^\+?[\d\s\-]{7,15}$/.test(form.hrPhone.trim()))
      errs.hrPhone = 'Enter a valid phone number.';

    return errs;
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSaving(true);
    try {
      const token = await getToken();
      const res   = await companyAPI.updateProfile(token, {
        companyName: form.companyName.trim(),
        website:     form.website.trim()     || undefined,
        description: form.description.trim() || undefined,
        hrContact: {
          name:  form.hrName.trim()  || undefined,
          phone: form.hrPhone.trim() || undefined,
        },
      });
      setProfile(res.data);
      setEditing(false);
      toast.success('Company profile updated.');
    } catch (e) {
      setErrors({ global: e.message || 'Failed to save.' });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    // Reset form to current saved profile
    setForm({
      companyName: profile?.companyName        || '',
      website:     profile?.website            || '',
      description: profile?.description        || '',
      hrName:      profile?.hrContact?.name    || '',
      hrPhone:     profile?.hrContact?.phone   || '',
    });
    setErrors({});
    setEditing(false);
  };

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: '' }));
  };

  /* ── Initials avatar ──────────────────────────────────────────── */
  const initials = (name = '') =>
    name.trim().split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?';

  /* ── Loading skeleton ─────────────────────────────────────────── */
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-64 bg-ink-100 rounded-xl" />
        <div className="h-64 bg-ink-100 rounded-2xl" />
        <div className="h-40 bg-ink-100 rounded-2xl" />
      </div>
    );
  }

  const bannerCfg = STATUS_BANNER[profile?.status];
  const isActive  = profile?.status === 'ACTIVE';

  return (
    <div className="space-y-6 animate-slide-up max-w-4xl">

      {/* ══ PAGE HEADER ══════════════════════════════════════════ */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-semibold text-ink-800 leading-tight">
            Company Profile
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Information visible to the TPO and eligible students.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 pt-0.5">
          {!editing ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(true)}
              icon={<HiOutlinePencil className="w-4 h-4" />}
            >
              Edit profile
            </Button>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancel}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                loading={saving}
                icon={!saving ? <HiOutlineCheck className="w-4 h-4" /> : null}
              >
                Save changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ══ STATUS BANNER (non-ACTIVE only) ══════════════════════ */}
      {bannerCfg && (
        <div className={`flex items-start gap-3 px-4 py-3.5 border rounded-xl text-sm ${bannerCfg.bg}`}>
          {bannerCfg.icon}
          <p className={bannerCfg.textCls}>{bannerCfg.text}</p>
        </div>
      )}

      {/* Global save error */}
      {errors.global && <Alert variant="danger">{errors.global}</Alert>}

      {/* ══ IDENTITY CARD ════════════════════════════════════════ */}
      <div className="bg-white border border-ink-100 rounded-2xl shadow-card overflow-hidden">

        {/* Top bar — maroon accent */}
        <div className="h-1.5 bg-maroon-deep" />

        <div className="p-6 sm:p-8">
          <div className="flex items-center gap-5">

            {/* Avatar / Logo placeholder */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-maroon-700 to-maroon-900 flex items-center justify-center shadow-lifted">
                <span className="text-xl font-bold text-white font-display">
                  {initials(editing ? form.companyName : profile?.companyName)}
                </span>
              </div>
              {isActive && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-success rounded-full border-2 border-white flex items-center justify-center">
                  <HiOutlineShieldCheck className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </div>

            {/* Company name + status */}
            <div className="min-w-0 flex-1">
              {editing ? (
                <div>
                  <input
                    value={form.companyName}
                    onChange={set('companyName')}
                    placeholder="Company name"
                    className={`text-xl font-semibold bg-transparent border-b-2 focus:outline-none w-full transition-colors pb-0.5
                      ${errors.companyName ? 'border-red-400 text-red-700' : 'border-maroon-400 text-ink-800'}`}
                  />
                  {errors.companyName && (
                    <p className="text-xs text-red-600 mt-1">⚠ {errors.companyName}</p>
                  )}
                </div>
              ) : (
                <h2 className="text-xl font-semibold text-ink-800 truncate">
                  {profile?.companyName}
                </h2>
              )}
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <Badge variant={COMPANY_STATUS_VARIANT[profile?.status] || 'neutral'} status={profile?.status}>
                  {profile?.status?.replace(/_/g, ' ')}
                </Badge>
                {profile?.createdAt && (
                  <span className="flex items-center gap-1 text-xs text-ink-400">
                    <HiOutlineCalendar className="w-3.5 h-3.5" />
                    Registered {fmtDate(profile.createdAt)}
                  </span>
                )}
                {profile?.approvedAt && (
                  <span className="text-xs text-ink-400">· Approved {fmtDate(profile.approvedAt)}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══ CONTACT DETAILS ══════════════════════════════════════ */}
      <div className="bg-white border border-ink-100 rounded-2xl shadow-card p-6 sm:p-8 space-y-6">

        <SectionDivider label="Contact Details" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">

          {/* Website */}
          {editing ? (
            <EditField label="Website" error={errors.website}>
              <div className="relative">
                <HiOutlineGlobe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                <input
                  value={form.website}
                  onChange={set('website')}
                  placeholder="https://yourcompany.com"
                  className={`${inputCls(!!errors.website)} pl-9`}
                  type="url"
                />
              </div>
            </EditField>
          ) : (
            <InfoField label="Website">
              {profile?.website ? (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-maroon-600 hover:text-maroon-500 hover:underline underline-offset-4 transition-colors"
                >
                  <HiOutlineGlobe className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{profile.website.replace(/^https?:\/\//, '')}</span>
                  <HiOutlineExternalLink className="w-3 h-3 opacity-50 flex-shrink-0" />
                </a>
              ) : (
                <span className="text-ink-400">Not provided</span>
              )}
            </InfoField>
          )}

          {/* HR Contact Name */}
          {editing ? (
            <EditField label="HR Contact Name">
              <input
                value={form.hrName}
                onChange={set('hrName')}
                placeholder="HR representative name"
                className={inputCls()}
              />
            </EditField>
          ) : (
            <InfoField label="HR Contact Name">
              {profile?.hrContact?.name || <span className="text-ink-400">—</span>}
            </InfoField>
          )}

          {/* HR Email — always read-only */}
          <InfoField label="HR Email">
            {profile?.hrContact?.email ? (
              <div className="flex items-center gap-1.5">
                <HiOutlineMail className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                <a
                  href={`mailto:${profile.hrContact.email}`}
                  className="font-mono text-ink-700 hover:text-maroon-600 transition-colors"
                >
                  {profile.hrContact.email}
                </a>
              </div>
            ) : (
              <span className="text-ink-400">—</span>
            )}
          </InfoField>

          {/* HR Phone */}
          {editing ? (
            <EditField label="HR Phone" error={errors.hrPhone}>
              <div className="relative">
                <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400 pointer-events-none" />
                <input
                  value={form.hrPhone}
                  onChange={set('hrPhone')}
                  placeholder="+91 98765 43210"
                  className={`${inputCls(!!errors.hrPhone)} pl-9`}
                  type="tel"
                />
              </div>
            </EditField>
          ) : (
            <InfoField label="HR Phone">
              {profile?.hrContact?.phone ? (
                <div className="flex items-center gap-1.5">
                  <HiOutlinePhone className="w-3.5 h-3.5 text-ink-400 flex-shrink-0" />
                  <span>{profile.hrContact.phone}</span>
                </div>
              ) : (
                <span className="text-ink-400">Not provided</span>
              )}
            </InfoField>
          )}
        </div>
      </div>

      {/* ══ ABOUT SECTION ════════════════════════════════════════ */}
      <div className="bg-white border border-ink-100 rounded-2xl shadow-card p-6 sm:p-8 space-y-5">

        <SectionDivider label="About the Company" />

        {editing ? (
          <div className="space-y-1.5">
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={5}
              placeholder="Describe your company — industry, culture, what you look for in candidates…"
              className={`${inputCls()} resize-none leading-relaxed`}
            />
            <p className="text-xs text-ink-400 text-right">
              {form.description.length}/1000 characters
            </p>
          </div>
        ) : (
          profile?.description ? (
            <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">
              {profile.description}
            </p>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <HiOutlineOfficeBuilding className="w-8 h-8 text-ink-200" />
              <p className="text-sm text-ink-400 max-w-xs">
                No company description yet.{' '}
                {!editing && (
                  <button
                    onClick={() => setEditing(true)}
                    className="text-maroon-600 hover:text-maroon-500 underline underline-offset-4"
                  >
                    Add one now
                  </button>
                )}
              </p>
            </div>
          )
        )}
      </div>

      {/* ══ EDIT MODE FOOTER ═════════════════════════════════════ */}
      {editing && (
        <div className="flex items-center justify-between gap-4 px-6 py-4 bg-white border border-ink-100 rounded-2xl shadow-card">
          <p className="text-xs text-ink-400">
            Changes are visible to the TPO and students after saving.
          </p>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={handleCancel} disabled={saving}>
              Discard
            </Button>
            <Button size="sm" onClick={handleSave} loading={saving}
              icon={!saving ? <HiOutlineCheck className="w-4 h-4" /> : null}>
              Save changes
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyProfilePage;
