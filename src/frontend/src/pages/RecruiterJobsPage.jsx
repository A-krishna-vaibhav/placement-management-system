import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI } from '../services/api';
import { Badge, PageHeader, Button } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlinePlusCircle, HiOutlineBriefcase, HiOutlineX, HiOutlineCheck,
} from 'react-icons/hi';

const STATUS_VARIANT = {
  PENDING_APPROVAL: 'warning',
  OPEN:             'success',
  CLOSED:           'neutral',
  REJECTED:         'danger',
  WITHDRAWN:        'neutral',
};

/* ─── New Job Form ─── */
const NewJobForm = ({ onCreated, onCancel }) => {
  const { getToken } = useAuth();
  const [form, setForm]       = useState({
    title: '', description: '', location: '', jobType: '',
    stipend: '', ctc: '', openings: '',
    minCgpa: '', maxBacklogs: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.description) {
      toast.error('Title and description are required.');
      return;
    }
    setSaving(true);
    try {
      const token = await getToken();
      const payload = {
        title:       form.title,
        description: form.description,
        location:    form.location || undefined,
        jobType:     form.jobType  || undefined,
        stipend:     form.stipend  || undefined,
        ctc:         form.ctc      || undefined,
        openings:    form.openings ? Number(form.openings) : undefined,
        eligibility: {
          ...(form.minCgpa    ? { minCgpa:    Number(form.minCgpa) }    : {}),
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
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink-800">Post a New Job</h2>
        <button type="button" onClick={onCancel} className="text-ink-400 hover:text-ink-700">
          <HiOutlineX className="w-5 h-5" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="label">Job Title *</label>
          <input className="input" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Software Engineer Intern" required />
        </div>

        <div className="sm:col-span-2">
          <label className="label">Description *</label>
          <textarea
            className="input resize-none"
            rows={4}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder="Job description, responsibilities, requirements…"
            required
          />
        </div>

        <div>
          <label className="label">Location</label>
          <input className="input" value={form.location} onChange={(e) => set('location', e.target.value)} placeholder="e.g. Hyderabad / Remote" />
        </div>

        <div>
          <label className="label">Job Type</label>
          <select className="input" value={form.jobType} onChange={(e) => set('jobType', e.target.value)}>
            <option value="">Select…</option>
            <option value="INTERNSHIP">Internship</option>
            <option value="FULL_TIME">Full-Time</option>
            <option value="PART_TIME">Part-Time</option>
          </select>
        </div>

        <div>
          <label className="label">Stipend / Salary</label>
          <input className="input" value={form.stipend} onChange={(e) => set('stipend', e.target.value)} placeholder="e.g. ₹20,000/month" />
        </div>

        <div>
          <label className="label">CTC (annual)</label>
          <input className="input" value={form.ctc} onChange={(e) => set('ctc', e.target.value)} placeholder="e.g. ₹6 LPA" />
        </div>

        <div>
          <label className="label">Openings</label>
          <input className="input" type="number" min="1" value={form.openings} onChange={(e) => set('openings', e.target.value)} placeholder="e.g. 5" />
        </div>

        <div>
          <label className="label">Min CGPA (eligibility)</label>
          <input className="input" type="number" step="0.01" min="0" max="10" value={form.minCgpa} onChange={(e) => set('minCgpa', e.target.value)} placeholder="e.g. 6.5" />
        </div>

        <div>
          <label className="label">Max Backlogs (eligibility)</label>
          <input className="input" type="number" min="0" value={form.maxBacklogs} onChange={(e) => set('maxBacklogs', e.target.value)} placeholder="e.g. 0" />
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button type="submit" loading={saving}>
          <HiOutlineCheck className="w-4 h-4 mr-1" /> Submit Job
        </Button>
      </div>
    </form>
  );
};

/* ─── Main Page ─── */
const RecruiterJobsPage = () => {
  const { getToken } = useAuth();
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
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
        <PageHeader title="Job Postings" subtitle="Manage your company's job listings" />
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <HiOutlinePlusCircle className="w-4 h-4 mr-1" /> Post Job
          </Button>
        )}
      </div>

      {showForm && <NewJobForm onCreated={handleCreated} onCancel={() => setShowForm(false)} />}

      {jobs.length === 0 && !showForm ? (
        <div className="card p-12 text-center space-y-3">
          <HiOutlineBriefcase className="w-10 h-10 text-ink-300 mx-auto" />
          <p className="text-ink-500">No job postings yet.</p>
          <Button onClick={() => setShowForm(true)}>Post your first job</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink-800">{job.title}</h3>
                  <p className="text-sm text-ink-500 mt-0.5 line-clamp-2">{job.description}</p>
                  <p className="text-xs text-ink-400 mt-1">{new Date(job.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={STATUS_VARIANT[job.status] || 'neutral'}>{job.status?.replace('_', ' ')}</Badge>
                  {['OPEN', 'CLOSED'].includes(job.status) && (
                    <Link to={`/company/jobs/${job.id}/applicants`} className="text-xs text-maroon-600 hover:underline">
                      Applicants
                    </Link>
                  )}
                  {['PENDING_APPROVAL', 'OPEN'].includes(job.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleWithdraw(job.id)}
                      loading={withdrawing === job.id}
                    >
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
