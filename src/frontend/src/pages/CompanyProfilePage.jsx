import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { companyAPI } from '../services/api';
import { Button, PageHeader, Badge, Alert } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineOfficeBuilding, HiOutlinePencil, HiOutlineGlobe,
  HiOutlinePhone, HiOutlineMail, HiOutlineCheck,
} from 'react-icons/hi';

const COMPANY_STATUS_VARIANT = {
  PENDING_APPROVAL: 'warning',
  ACTIVE:           'success',
  REJECTED:         'danger',
  SUSPENDED:        'neutral',
};

const CompanyProfilePage = () => {
  const { getToken } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm]       = useState({});
  const [error, setError]     = useState('');

  const fetchProfile = async () => {
    try {
      const token = await getToken();
      const res   = await companyAPI.getProfile(token);
      setProfile(res.data);
      setForm({
        companyName: res.data.companyName || '',
        website:     res.data.website     || '',
        description: res.data.description || '',
        hrName:      res.data.hrContact?.name  || '',
        hrPhone:     res.data.hrContact?.phone || '',
      });
    } catch (e) {
      toast.error(e.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProfile(); }, []);

  const handleSave = async () => {
    if (!form.companyName.trim()) { setError('Company name is required.'); return; }
    setError('');
    setSaving(true);
    try {
      const token = await getToken();
      const res   = await companyAPI.updateProfile(token, {
        companyName: form.companyName.trim(),
        website:     form.website.trim()     || undefined,
        description: form.description.trim() || undefined,
        hrContact:   {
          name:  form.hrName.trim()  || undefined,
          phone: form.hrPhone.trim() || undefined,
        },
      });
      setProfile(res.data);
      setEditing(false);
      toast.success('Company profile updated.');
    } catch (e) {
      setError(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center justify-between">
        <PageHeader title="Company Profile" subtitle="Manage your company details visible to the TPO and students" />
        {!editing ? (
          <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
            <HiOutlinePencil className="w-4 h-4 mr-1" /> Edit
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setError(''); }}>Cancel</Button>
            <Button size="sm" onClick={handleSave} loading={saving}>
              <HiOutlineCheck className="w-4 h-4 mr-1" /> Save
            </Button>
          </div>
        )}
      </div>

      {/* Status banner */}
      {profile?.status && profile.status !== 'ACTIVE' && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <p className="text-sm text-amber-800">
            Account status: <Badge variant={COMPANY_STATUS_VARIANT[profile.status] || 'neutral'}>{profile.status?.replace('_', ' ')}</Badge>
            {profile.status === 'PENDING_APPROVAL' && ' — awaiting TPO approval before you can post jobs.'}
            {profile.status === 'REJECTED' && ' — contact the TPO for more information.'}
          </p>
        </div>
      )}

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Main info card */}
      <div className="card p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-violet-50 rounded-2xl flex items-center justify-center ring-2 ring-violet-200 flex-shrink-0">
            <HiOutlineOfficeBuilding className="w-8 h-8 text-violet-600" />
          </div>
          <div>
            {editing ? (
              <input
                className="text-xl font-semibold text-ink-800 border-b-2 border-maroon-400 focus:outline-none bg-transparent w-full"
                value={form.companyName}
                onChange={(e) => set('companyName', e.target.value)}
                placeholder="Company name"
              />
            ) : (
              <h2 className="text-xl font-semibold text-ink-800">{profile?.companyName}</h2>
            )}
            <Badge variant={COMPANY_STATUS_VARIANT[profile?.status] || 'neutral'} className="mt-1">
              {profile?.status?.replace('_', ' ')}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Website */}
          <div>
            <label className="block text-xs font-medium text-ink-400 uppercase tracking-wide mb-1.5">Website</label>
            {editing ? (
              <input
                className="input"
                value={form.website}
                onChange={(e) => set('website', e.target.value)}
                placeholder="https://yourcompany.com"
              />
            ) : (
              <div className="flex items-center gap-2 text-sm text-ink-700">
                <HiOutlineGlobe className="w-4 h-4 text-ink-400 flex-shrink-0" />
                {profile?.website
                  ? <a href={profile.website} target="_blank" rel="noreferrer" className="text-maroon-600 hover:underline">{profile.website}</a>
                  : <span className="text-ink-400">—</span>}
              </div>
            )}
          </div>

          {/* HR Name */}
          <div>
            <label className="block text-xs font-medium text-ink-400 uppercase tracking-wide mb-1.5">HR Contact Name</label>
            {editing ? (
              <input
                className="input"
                value={form.hrName}
                onChange={(e) => set('hrName', e.target.value)}
                placeholder="HR representative name"
              />
            ) : (
              <p className="text-sm text-ink-700">{profile?.hrContact?.name || '—'}</p>
            )}
          </div>

          {/* HR Email (read-only — from registration) */}
          <div>
            <label className="block text-xs font-medium text-ink-400 uppercase tracking-wide mb-1.5">HR Email</label>
            <div className="flex items-center gap-2 text-sm text-ink-700">
              <HiOutlineMail className="w-4 h-4 text-ink-400 flex-shrink-0" />
              <span className="font-mono">{profile?.hrContact?.email || '—'}</span>
            </div>
          </div>

          {/* HR Phone */}
          <div>
            <label className="block text-xs font-medium text-ink-400 uppercase tracking-wide mb-1.5">HR Phone</label>
            {editing ? (
              <input
                className="input"
                value={form.hrPhone}
                onChange={(e) => set('hrPhone', e.target.value)}
                placeholder="+91 98765 43210"
              />
            ) : (
              <div className="flex items-center gap-2 text-sm text-ink-700">
                <HiOutlinePhone className="w-4 h-4 text-ink-400 flex-shrink-0" />
                <span>{profile?.hrContact?.phone || '—'}</span>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-ink-400 uppercase tracking-wide mb-1.5">About the Company</label>
          {editing ? (
            <textarea
              className="input resize-none"
              rows={4}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Brief description of your company, industry, culture…"
            />
          ) : (
            <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">
              {profile?.description || <span className="text-ink-400">No description provided.</span>}
            </p>
          )}
        </div>

        <p className="text-xs text-ink-400">
          Registered {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
          {profile?.approvedAt ? ` · Approved ${new Date(profile.approvedAt).toLocaleDateString()}` : ''}
        </p>
      </div>
    </div>
  );
};

export default CompanyProfilePage;
