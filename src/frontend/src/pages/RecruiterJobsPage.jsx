import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI } from '../services/api';
import { Badge, PageHeader, Button } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlinePlusCircle, HiOutlineBriefcase, HiOutlineX,
  HiOutlineLocationMarker, HiOutlineCurrencyRupee, HiOutlineUserGroup,
  HiOutlineAcademicCap, HiOutlineClipboardCheck,
} from 'react-icons/hi';

const STATUS_VARIANT = {
  PENDING_APPROVAL: 'warning',
  OPEN:             'success',
  CLOSED:           'neutral',
  REJECTED:         'danger',
  WITHDRAWN:        'neutral',
};

const STATUS_LABEL = {
  PENDING_APPROVAL: 'Pending Approval',
  OPEN:             'Open',
  CLOSED:           'Closed',
  REJECTED:         'Rejected',
  WITHDRAWN:        'Withdrawn',
};

/* ─── New Job Form ─── */
const NewJobForm = ({ onCreated, onCancel }) => {
  const { getToken } = useAuth();
  const [form, setForm] = useState({
    title: '', description: '', location: '', jobType: '',
    stipend: '', ctc: '', openings: '',
    minCgpa: '', maxBacklogs: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.description.trim()) {
      toast.error('Title and description are required.');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim(),
        location:    form.location  || undefined,
        jobType:     form.jobType   || undefined,
        stipend:     form.stipend   || undefined,
        ctc:         form.ctc       || undefined,
        openings:    form.openings  ? Number(form.openings) : undefined,
        eligibility: {
          ...(form.minCgpa     ? { minCgpa:    Number(form.minCgpa) }     : {}),
          ...(form.maxBacklogs ? { maxBacklogs: Number(form.maxBacklogs) } : {}),
        },
      };
      const res = await jobAPI.create(token, payload);
      toast.success('Job posted. Awaiting TPO approval.');
      onCreated(res.data);
    } catch (e) {
      toast.error(e.message || 'Failed to post job.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card overflow-hidden">
      {/* Form header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-ink-100 bg-maroon-deep">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
            <HiOutlineBriefcase className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-white text-sm">Post a New Job</h2>
            <p className="text-white/50 text-xs">Submitted listings require TPO approval before going live</p>
          </div>
        </div>
        <button type="button" onClick={onCancel} className="text-white/60 hover:text-white transition-colors">
          <HiOutlineX className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">

        {/* Basic info */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Basic Information</p>
          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">
              Job Title <span className="text-red-500">*</span>
            </label>
            <input
              className="w-full border border-ink-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Software Engineer Intern"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-700 mb-1.5">
              Job Description <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full border border-ink-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 focus:border-transparent resize-none"
              rows={5}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="Describe the role, responsibilities, and requirements…"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                <span className="flex items-center gap-1.5"><HiOutlineLocationMarker className="w-4 h-4 text-ink-400" /> Location</span>
              </label>
              <input
                className="w-full border border-ink-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="Hyderabad / Remote / Hybrid"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Job Type</label>
              <select
                className="w-full border border-ink-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 bg-white"
                value={form.jobType}
                onChange={(e) => set('jobType', e.target.value)}
              >
                <option value="">Select type…</option>
                <option value="INTERNSHIP">Internship</option>
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
              </select>
            </div>
          </div>
        </div>

        <div className="border-t border-ink-100" />

        {/* Compensation */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest">Compensation & Openings</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                <span className="flex items-center gap-1.5"><HiOutlineCurrencyRupee className="w-4 h-4 text-ink-400" /> Stipend</span>
              </label>
              <input
                className="w-full border border-ink-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                value={form.stipend}
                onChange={(e) => set('stipend', e.target.value)}
                placeholder="₹20,000/month"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">CTC (Annual)</label>
              <input
                className="w-full border border-ink-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                value={form.ctc}
                onChange={(e) => set('ctc', e.target.value)}
                placeholder="₹6 LPA"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">
                <span className="flex items-center gap-1.5"><HiOutlineUserGroup className="w-4 h-4 text-ink-400" /> Openings</span>
              </label>
              <input
                className="w-full border border-ink-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                type="number" min="1"
                value={form.openings}
                onChange={(e) => set('openings', e.target.value)}
                placeholder="5"
              />
            </div>
          </div>
        </div>

        <div className="border-t border-ink-100" />

        {/* Eligibility */}
        <div className="space-y-4">
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><HiOutlineAcademicCap className="w-4 h-4" /> Eligibility Criteria <span className="font-normal normal-case">(optional)</span></span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Minimum CGPA</label>
              <input
                className="w-full border border-ink-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                type="number" step="0.01" min="0" max="10"
                value={form.minCgpa}
                onChange={(e) => set('minCgpa', e.target.value)}
                placeholder="e.g. 6.5"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1.5">Max Active Backlogs</label>
              <input
                className="w-full border border-ink-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500"
                type="number" min="0"
                value={form.maxBacklogs}
                onChange={(e) => set('maxBacklogs', e.target.value)}
                placeholder="e.g. 0"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2 border-t border-ink-100">
          <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button type="submit" loading={saving}>
            <HiOutlineClipboardCheck className="w-4 h-4 mr-1.5" /> Submit for Approval
          </Button>
        </div>
      </form>
    </div>
  );
};

/* ─── Main Page ─── */
const RecruiterJobsPage = () => {
  const { getToken } = useAuth();
  const [jobs, setJobs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [withdrawing, setWithdrawing] = useState(null);

  const fetchJobs = async () => {
    try {
      const token = await getToken();
      const res   = await jobAPI.list(token);
      setJobs(res.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleCreated = (newJob) => {
    setJobs((prev) => [newJob, ...prev]);
    setShowForm(false);
  };

  const handleWithdraw = async (jobId) => {
    if (!confirm('Withdraw this job posting?')) return;
    setWithdrawing(jobId);
    try {
      const token = await getToken();
      await jobAPI.withdraw(token, jobId);
      toast.success('Job withdrawn.');
      fetchJobs();
    } catch (e) {
      toast.error(e.message || 'Failed to withdraw.');
    } finally {
      setWithdrawing(null);
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
      <div className="flex items-center justify-between">
        <PageHeader title="Job Postings" subtitle="Manage your company's listings" />
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <HiOutlinePlusCircle className="w-4 h-4 mr-1.5" /> Post Job
          </Button>
        )}
      </div>

      {showForm && <NewJobForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />}

      {jobs.length === 0 && !showForm ? (
        <div className="card p-12 text-center space-y-4">
          <div className="w-16 h-16 bg-maroon-50 rounded-2xl flex items-center justify-center mx-auto">
            <HiOutlineBriefcase className="w-8 h-8 text-maroon-400" />
          </div>
          <div>
            <p className="font-medium text-ink-700">No job postings yet</p>
            <p className="text-sm text-ink-400 mt-1">Post a job to start receiving applications from students.</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <HiOutlinePlusCircle className="w-4 h-4 mr-1.5" /> Post your first job
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="card p-5 hover:shadow-lifted transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-ink-800">{job.title}</h3>
                    <Badge variant={STATUS_VARIANT[job.status] || 'neutral'}>
                      {STATUS_LABEL[job.status] || job.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-ink-500 mt-1 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-ink-400">
                    {job.location && <span>📍 {job.location}</span>}
                    {job.jobType && <span>💼 {job.jobType.replace('_', '-')}</span>}
                    {job.ctc && <span>💰 {job.ctc}</span>}
                    {job.stipend && <span>💵 {job.stipend}</span>}
                    {job.openings && <span>👥 {job.openings} opening{job.openings > 1 ? 's' : ''}</span>}
                    <span>🗓 {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {['OPEN', 'CLOSED'].includes(job.status) && (
                    <Link to={`/company/jobs/${job.id}/applicants`} className="btn-secondary text-xs px-3 py-1.5">
                      Applicants
                    </Link>
                  )}
                  {['PENDING_APPROVAL', 'OPEN'].includes(job.status) && (
                    <Button size="sm" variant="ghost" onClick={() => handleWithdraw(job.id)} loading={withdrawing === job.id}>
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecruiterJobsPage;
