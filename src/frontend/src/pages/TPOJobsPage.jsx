import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI } from '../services/api';
import { Badge, PageHeader, Button } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineBriefcase, HiOutlineCheck, HiOutlineX, HiOutlineLockClosed,
} from 'react-icons/hi';

const STATUS_VARIANT = {
  PENDING_APPROVAL: 'warning',
  OPEN:             'success',
  CLOSED:           'neutral',
  REJECTED:         'danger',
  WITHDRAWN:        'neutral',
};

/* ─── Reject Modal ─── */
const RejectModal = ({ job, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="font-semibold text-ink-800">Reject Job Posting</h2>
        <p className="text-sm text-ink-600">Rejecting: <strong>{job.title}</strong> by {job.companyName}</p>
        <div>
          <label className="label">Reason (optional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Provide feedback to the company…"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button variant="danger" onClick={() => onConfirm(reason)}>Confirm Reject</Button>
        </div>
      </div>
    </div>
  );
};

const TPOJobsPage = () => {
  const { getToken } = useAuth();
  const [filter, setFilter]       = useState('PENDING_APPROVAL');
  const [jobs, setJobs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const fetchJobs = async (status = filter) => {
    setLoading(true);
    try {
      const token = await getToken();
      const res   = await jobAPI.list(token, { status });
      setJobs(res.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchJobs(filter); }, [filter]);

  const handleApprove = async (jobId) => {
    setActing(jobId);
    try {
      const token = await getToken();
      await jobAPI.approve(token, jobId);
      toast.success('Job approved and now live.');
      fetchJobs(filter);
    } catch (e) {
      toast.error(e.message || 'Failed to approve.');
    } finally {
      setActing(null);
    }
  };

  const handleReject = async (job) => setRejectTarget(job);

  const confirmReject = async (reason) => {
    const job = rejectTarget;
    setRejectTarget(null);
    setActing(job.id);
    try {
      const token = await getToken();
      await jobAPI.reject(token, job.id, reason);
      toast.success('Job rejected.');
      fetchJobs(filter);
    } catch (e) {
      toast.error(e.message || 'Failed to reject.');
    } finally {
      setActing(null);
    }
  };

  const handleClose = async (jobId) => {
    if (!confirm('Close this job posting?')) return;
    setActing(jobId);
    try {
      const token = await getToken();
      await jobAPI.close(token, jobId);
      toast.success('Job closed.');
      fetchJobs(filter);
    } catch (e) {
      toast.error(e.message || 'Failed to close job.');
    } finally {
      setActing(null);
    }
  };

  const FILTERS = ['PENDING_APPROVAL', 'OPEN', 'CLOSED', 'REJECTED', 'WITHDRAWN'];

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader title="Job Management" subtitle="Review and manage company job postings" />

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === s
                ? 'bg-maroon-600 text-white'
                : 'bg-white border border-ink-200 text-ink-600 hover:bg-cream-50'
            }`}
          >
            {s.replace('_', ' ')}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineBriefcase className="w-10 h-10 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No jobs with status: {filter.replace('_', ' ')}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="card p-5 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink-800">{job.title}</h3>
                  <p className="text-sm text-ink-500">{job.companyName}</p>
                  <p className="text-sm text-ink-600 mt-1 line-clamp-2">{job.description}</p>
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-ink-400">
                    {job.location && <span>📍 {job.location}</span>}
                    {job.jobType && <span>{job.jobType}</span>}
                    {job.openings && <span>Openings: {job.openings}</span>}
                    {job.ctc && <span>CTC: {job.ctc}</span>}
                    {job.stipend && <span>Stipend: {job.stipend}</span>}
                  </div>
                  {job.eligibility && Object.keys(job.eligibility).length > 0 && (
                    <div className="text-xs text-ink-400 bg-cream-50 rounded-lg px-3 py-1.5 mt-2 inline-block">
                      {job.eligibility.minCgpa != null && <span className="mr-3">Min CGPA: {job.eligibility.minCgpa}</span>}
                      {job.eligibility.maxBacklogs != null && <span>Max backlogs: {job.eligibility.maxBacklogs}</span>}
                    </div>
                  )}
                </div>
                <Badge variant={STATUS_VARIANT[job.status] || 'neutral'} className="flex-shrink-0">
                  {job.status?.replace('_', ' ')}
                </Badge>
              </div>

              <div className="flex gap-2 flex-wrap">
                {job.status === 'PENDING_APPROVAL' && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(job.id)}
                      loading={acting === job.id}
                    >
                      <HiOutlineCheck className="w-4 h-4 mr-1" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleReject(job)}
                      disabled={!!acting}
                    >
                      <HiOutlineX className="w-4 h-4 mr-1" /> Reject
                    </Button>
                  </>
                )}
                {job.status === 'OPEN' && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleClose(job.id)}
                    loading={acting === job.id}
                  >
                    <HiOutlineLockClosed className="w-4 h-4 mr-1" /> Close
                  </Button>
                )}
                {job.rejectionReason && (
                  <p className="text-xs text-red-600 self-center">Reason: {job.rejectionReason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          job={rejectTarget}
          onConfirm={confirmReject}
          onCancel={() => setRejectTarget(null)}
        />
      )}
    </div>
  );
};

export default TPOJobsPage;
