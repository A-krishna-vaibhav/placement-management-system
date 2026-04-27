import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { studentProfileAPI, declarationAPI, referenceAPI } from '../services/api';
import { Button, Card, Badge, PageHeader, Alert } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineUser, HiOutlinePencil, HiOutlineX, HiOutlineCheck,
  HiOutlineShieldCheck, HiOutlineExclamation,
} from 'react-icons/hi';

/* ─── Self-Declaration Modal ─── */
const SelfDeclarationModal = ({ onClose, onSigned }) => {
  const { getToken, currentUser } = useAuth();
  const [declaration, setDeclaration] = useState(null);
  const [eSignature, setESignature]   = useState('');
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [scrolled, setScrolled]       = useState(false);
  const textRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res   = await declarationAPI.getCurrent(token);
        setDeclaration(res.data);
      } catch (e) {
        setError(e.message || 'Failed to load declaration.');
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  const handleScroll = () => {
    const el = textRef.current;
    if (el && el.scrollHeight - el.scrollTop - el.clientHeight < 10) setScrolled(true);
  };

  const handleSign = async () => {
    if (!eSignature.trim()) return setError('Please enter your full name as your e-signature.');
    if (!scrolled) return setError('Please read the full declaration before signing.');
    setError('');
    setSubmitting(true);
    try {
      const token = await getToken();
      await declarationAPI.sign(token, {
        declarationVersionId: declaration.id,
        eSignature: eSignature.trim(),
      });
      toast.success('Declaration signed successfully.');
      onSigned();
    } catch (e) {
      setError(e.message || 'Failed to sign declaration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-ink-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-maroon-50 rounded-xl flex items-center justify-center ring-1 ring-maroon-200">
              <HiOutlineShieldCheck className="w-5 h-5 text-maroon-700" />
            </div>
            <div>
              <h2 className="font-semibold text-ink-800">PGAB Self-Declaration</h2>
              {declaration && <p className="text-xs text-ink-400">Version {declaration.version}</p>}
            </div>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition-colors">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 gap-4">
          {loading ? (
            <p className="text-center text-ink-400 py-8">Loading declaration…</p>
          ) : error && !declaration ? (
            <Alert variant="error">{error}</Alert>
          ) : (
            <>
              <div
                ref={textRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto bg-cream-50 border border-ink-200 rounded-xl p-4 text-sm text-ink-700 leading-relaxed whitespace-pre-wrap"
                style={{ maxHeight: '320px' }}
              >
                {declaration?.text}
              </div>

              {!scrolled && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <HiOutlineExclamation className="w-4 h-4 flex-shrink-0" />
                  Please scroll to the bottom to read the full declaration.
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-ink-700 mb-1">
                  E-Signature (type your full name)
                </label>
                <input
                  type="text"
                  value={eSignature}
                  onChange={(e) => setESignature(e.target.value)}
                  placeholder="Your full name"
                  className="w-full border border-ink-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                />
              </div>

              {error && <Alert variant="error">{error}</Alert>}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-ink-100 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button onClick={handleSign} loading={submitting} disabled={loading || !declaration}>
            <HiOutlineCheck className="w-4 h-4 mr-1" /> Sign Declaration
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
const StudentProfilePage = () => {
  const { getToken, currentUser } = useAuth();
  const [profile, setProfile]           = useState(null);
  const [hasSigned, setHasSigned]       = useState(false);
  const [showDecl, setShowDecl]         = useState(false);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [editing, setEditing]           = useState(false);
  const [schools, setSchools]           = useState([]);
  const [departments, setDepartments]   = useState([]);
  const [form, setForm]                 = useState({});

  const fetchAll = async () => {
    try {
      const token = await getToken();
      const [profileRes, sigRes, schoolsRes] = await Promise.all([
        studentProfileAPI.get(token),
        declarationAPI.getMySigned(token).catch(() => ({ data: [] })),
        referenceAPI.getSchools(),
      ]);
      const p = profileRes.data;
      const allSchools = schoolsRes.data || [];
      setSchools(allSchools);
      setProfile(p);
      setForm({
        rollNumber:     p.rollNumber || '',
        programme:      p.programme || '',
        joiningYear:    p.joiningYear || '',
        graduationYear: p.graduationYear || '',
        cgpa:           p.cgpa ?? '',
        backlogs:       p.backlogs ?? 0,
        skills:         (p.skills || []).join(', '),
        phoneNumber:    p.phoneNumber || '',
        schoolId:       p.schoolId || '',
        departmentId:   p.departmentId || '',
      });
      setHasSigned(Array.isArray(sigRes.data) && sigRes.data.length > 0);

      // Pre-load departments if school already set
      if (p.schoolId) {
        referenceAPI.getDepartments(p.schoolId)
          .then((r) => setDepartments(r.data || []))
          .catch(() => {});
      }
    } catch (e) {
      toast.error(e.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  useEffect(() => {
    if (form.schoolId) {
      referenceAPI.getDepartments(form.schoolId)
        .then((r) => setDepartments(r.data || []))
        .catch(() => setDepartments([]));
    }
  }, [form.schoolId]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      const payload = {
        ...form,
        cgpa:     form.cgpa !== '' ? Number(form.cgpa) : null,
        backlogs: Number(form.backlogs),
        skills:   form.skills.split(',').map((s) => s.trim()).filter(Boolean),
      };
      await studentProfileAPI.update(token, payload);
      setEditing(false);
      toast.success('Profile updated.');
      await fetchAll();
    } catch (e) {
      toast.error(e.message || 'Failed to save.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="My Profile"
        subtitle="Manage your student profile and documents"
      />

      {/* Declaration Banner */}
      {!hasSigned && (
        <div className="flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-center gap-3">
            <HiOutlineExclamation className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <p className="text-sm text-amber-800 font-medium">
              Sign the PGAB Self-Declaration to unlock job applications.
            </p>
          </div>
          <Button size="sm" onClick={() => setShowDecl(true)}>
            Sign Now
          </Button>
        </div>
      )}

      {hasSigned && (
        <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
          <HiOutlineShieldCheck className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-800 font-medium">PGAB Self-Declaration signed.</p>
        </div>
      )}

      {/* Profile Form */}
      <div className="card p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-800 flex items-center gap-2">
            <HiOutlineUser className="w-4 h-4 text-maroon-600" /> Academic Details
          </h2>
          {!editing ? (
            <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
              <HiOutlinePencil className="w-4 h-4 mr-1" /> Edit
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSave} loading={saving}>Save</Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { key: 'rollNumber',     label: 'Roll Number' },
            { key: 'programme',      label: 'Programme' },
            { key: 'joiningYear',    label: 'Joining Year' },
            { key: 'graduationYear', label: 'Graduation Year' },
            { key: 'cgpa',           label: 'CGPA' },
            { key: 'backlogs',       label: 'Active Backlogs' },
            { key: 'phoneNumber',    label: 'Phone Number' },
          ].map(({ key, label }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">{label}</label>
              {editing ? (
                <input
                  type={['cgpa', 'backlogs', 'joiningYear', 'graduationYear'].includes(key) ? 'number' : 'text'}
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  className="w-full border border-ink-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                />
              ) : (
                <p className="text-sm text-ink-700 font-medium">{profile?.[key] ?? '—'}</p>
              )}
            </div>
          ))}

          {/* School */}
          <div>
            <label className="block text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">School</label>
            {editing ? (
              <select
                value={form.schoolId}
                onChange={(e) => setForm((f) => ({ ...f, schoolId: e.target.value, departmentId: '' }))}
                className="w-full border border-ink-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
              >
                <option value="">Select school…</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            ) : (
              <p className="text-sm text-ink-700 font-medium">
                {schools.find((s) => s.id === profile?.schoolId)?.name || profile?.schoolId || '—'}
              </p>
            )}
          </div>

          {/* Programme */}
          <div>
            <label className="block text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">Programme</label>
            {editing ? (
              <select
                value={form.departmentId}
                onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                className="w-full border border-ink-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
              >
                <option value="">Select programme…</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            ) : (
              <p className="text-sm text-ink-700 font-medium">
                {departments.find((d) => d.id === profile?.departmentId)?.name || profile?.departmentId || '—'}
              </p>
            )}
          </div>
        </div>

        {/* Skills */}
        <div>
          <label className="block text-xs font-medium text-ink-400 uppercase tracking-wide mb-1">Skills (comma-separated)</label>
          {editing ? (
            <input
              type="text"
              value={form.skills}
              onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))}
              className="w-full border border-ink-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
              placeholder="e.g. Python, React, SQL"
            />
          ) : (
            <div className="flex flex-wrap gap-2 mt-1">
              {(profile?.skills || []).length === 0
                ? <p className="text-sm text-ink-400">—</p>
                : profile.skills.map((s) => <Badge key={s} variant="neutral">{s}</Badge>)
              }
            </div>
          )}
        </div>
      </div>

      {showDecl && (
        <SelfDeclarationModal
          onClose={() => setShowDecl(false)}
          onSigned={() => { setHasSigned(true); setShowDecl(false); }}
        />
      )}
    </div>
  );
};

export default StudentProfilePage;
