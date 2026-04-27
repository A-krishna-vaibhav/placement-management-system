import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI, facultyAPI } from '../services/api';
import { PageHeader, Badge, Button } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineBriefcase, HiOutlineSearch, HiOutlineCheck,
  HiOutlineX, HiOutlineClock, HiOutlineExclamation,
} from 'react-icons/hi';

const APPROVAL_META = {
  PENDING_FACULTY:  { label: 'Pending Your Approval', variant: 'warning',  icon: HiOutlineClock },
  FACULTY_APPROVED: { label: 'Approved',               variant: 'success',  icon: HiOutlineCheck },
  FACULTY_REJECTED: { label: 'Rejected',               variant: 'danger',   icon: HiOutlineX },
};

const JOB_TYPE_VARIANT = {
  INTERNSHIP: 'warning',
  FULL_TIME:  'success',
  PART_TIME:  'neutral',
};

/* ─── Reject Modal ─── */
const RejectModal = ({ job, onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="font-semibold text-ink-800">Reject Job for Your School</h2>
        <p className="text-sm text-ink-600">
          Rejecting: <strong>{job.title}</strong> by {job.companyName}
        </p>
        <div>
          <label className="label">Reason (optional)</label>
          <textarea
            className="input resize-none"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for rejection…"
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

/* ─── Main Page ─── */
const FacultyJobsPage = () => {
  const { getToken } = useAuth();
  const [jobs, setJobs]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [search, setSearch]     = useState('');
  const [schoolId, setSchoolId] = useState('');

  const fetchJobs = useCallback(async () => {
    try {
      const token = await getToken();
      const res   = await facultyAPI.getMyJobs(token);
      setJobs(res.data || []);
      if (res.meta?.schoolId) setSchoolId(res.meta.schoolId);
    } catch (e) {
      toast.error(e.message || 'Failed to load jobs.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleApprove = async (job) => {
    setActing(job.id);
    try {
      const token = await getToken();
      await jobAPI.facultyApprove(token, job.id);
      toast.success('Job approved — students in your school can now apply.');
      fetchJobs();
    } catch (e) {
      toast.error(e.message || 'Failed to approve.');
    } finally {
      setActing(null);
    }
  };

  const confirmReject = async (reason) => {
    const job = rejectTarget;
    setRejectTarget(null);
    setActing(job.id);
    try {
      const token = await getToken();
      await jobAPI.facultyReject(token, job.id, reason);
      toast.success('Job rejected for your school.');
      fetchJobs();
    } catch (e) {
      toast.error(e.message || 'Failed to reject.');
    } finally {
      setActing(null);
    }
  };

  const filtered = jobs.filter((j) =>
    j.title?.toLowerCase().includes(search.toLowerCase()) ||
    j.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    j.description?.toLowerCase().includes(search.toLowerCase())
  );

  const pending  = jobs.filter((j) => j.mySchoolApproval?.status === 'PENDING_FACULTY').length;
  const approved = jobs.filter((j) => j.mySchoolApproval?.status === 'FACULTY_APPROVED').length;
  const rejected = jobs.filter((j) => j.mySchoolApproval?.status === 'FACULTY_REJECTED').length;

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
        title="School Job Listings"
        subtitle={`Jobs assigned to your school${schoolId ? ` (${schoolId})` : ''} — review and approve for students`}
      />

      {/* Summary chips */}
      <div className="flex gap-3 text-sm flex-wrap">
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2">
          <span className="font-semibold text-amber-700">{pending}</span>
          <span className="text-amber-600 ml-1">Pending your approval</span>
        </div>
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2">
          <span className="font-semibold text-emerald-700">{approved}</span>
          <span className="text-emerald-600 ml-1">Approved</span>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2">
          <span className="font-semibold text-red-700">{rejected}</span>
          <span className="text-red-600 ml-1">Rejected</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          type="text"
          placeholder="Search by title, company or description…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-ink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineBriefcase className="w-10 h-10 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">
            {search ? 'No jobs match your search.' : 'No jobs assigned to your school yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((job) => {
            const approval = job.mySchoolApproval;
            const status   = approval?.status || 'PENDING_FACULTY';
            const meta     = APPROVAL_META[status] || APPROVAL_META.PENDING_FACULTY;
            const Icon     = meta.icon;
            const isPending  = status === 'PENDING_FACULTY';
            const isRejected = status === 'FACULTY_REJECTED';

            return (
              <div
                key={job.id}
                className={`card p-5 space-y-3 ${isPending ? 'border-l-4 border-l-amber-400' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-ink-800">{job.title}</h3>
                      {job.jobType && (
                        <Badge variant={JOB_TYPE_VARIANT[job.jobType] || 'neutral'}>
                          {job.jobType.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-ink-500 mt-0.5">{job.companyName}</p>
                    <p className="text-sm text-ink-600 mt-2 line-clamp-3">{job.description}</p>

                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-ink-400">
                      {job.location && <span>📍 {job.location}</span>}
                      {job.openings && <span>Openings: {job.openings}</span>}
                      {job.ctc      && <span>CTC: {job.ctc}</span>}
                      {job.stipend  && <span>Stipend: {job.stipend}</span>}
                    </div>

                    {job.eligibility && Object.keys(job.eligibility).length > 0 && (
                      <div className="text-xs text-ink-500 bg-cream-50 rounded-lg px-3 py-1.5 mt-2 inline-flex gap-4">
                        {job.eligibility.minCgpa    != null && <span>Min CGPA: <strong>{job.eligibility.minCgpa}</strong></span>}
                        {job.eligibility.maxBacklogs != null && <span>Max backlogs: <strong>{job.eligibility.maxBacklogs}</strong></span>}
                        {job.eligibility.allowedBranches?.length > 0 && (
                          <span>Branches: <strong>{job.eligibility.allowedBranches.join(', ')}</strong></span>
                        )}
                      </div>
                    )}

                    {isRejected && approval?.rejectionReason && (
                      <p className="text-xs text-red-600 mt-2 flex items-center gap-1">
                        <HiOutlineExclamation className="w-3.5 h-3.5 flex-shrink-0" />
                        Rejection reason: {approval.rejectionReason}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <Badge variant={meta.variant}>
                      <Icon className="w-3 h-3 mr-1 inline" />
                      {meta.label}
                    </Badge>
                    <span className="text-xs text-ink-400">
                      {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : ''}
                    </span>
                  </div>
                </div>

                {/* Actions — only for pending or rejected (allow re-approval) */}
                {(isPending || isRejected) && (
                  <div className="flex gap-2 pt-1 border-t border-ink-100">
                    <Button
                      size="sm"
                      onClick={() => handleApprove(job)}
                      loading={acting === job.id}
                      disabled={!!acting && acting !== job.id}
                    >
                      <HiOutlineCheck className="w-4 h-4 mr-1" />
                      Approve for My School
                    </Button>
                    {isPending && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => setRejectTarget(job)}
                        disabled={!!acting}
                      >
                        <HiOutlineX className="w-4 h-4 mr-1" /> Reject
                      </Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
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

export default FacultyJobsPage;
