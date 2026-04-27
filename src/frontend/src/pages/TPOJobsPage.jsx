import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI, referenceAPI } from '../services/api';
import { Badge, PageHeader, Button } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineBriefcase, HiOutlineCheck, HiOutlineX, HiOutlineLockClosed,
  HiOutlineAcademicCap, HiOutlineSparkles,
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

const SCHOOL_APPROVAL_BADGE = {
  PENDING_FACULTY:  { label: 'Pending Faculty', cls: 'bg-amber-100 text-amber-700' },
  FACULTY_APPROVED: { label: 'Faculty Approved', cls: 'bg-emerald-100 text-emerald-700' },
  FACULTY_REJECTED: { label: 'Faculty Rejected', cls: 'bg-red-100 text-red-700' },
};

/* ─── Assign Schools Modal ─── */
const AssignSchoolsModal = ({ job, schools, onConfirm, onCancel, getToken }) => {
  const [selected, setSelected]   = useState(new Set(job.assignedSchools || []));
  const [suggested, setSuggested] = useState([]);
  const [loadingSug, setLoadingSug] = useState(true);
  const [saving, setSaving]        = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res   = await jobAPI.suggestedSchools(token, job.id);
        setSuggested(res.data?.suggestedSchoolIds || []);
      } catch {
        // suggestions are best-effort
      } finally {
        setLoadingSug(false);
      }
    })();
  }, [job.id, getToken]);

  const toggle = (schoolId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(schoolId) ? next.delete(schoolId) : next.add(schoolId);
      return next;
    });
  };

  const applySuggestions = () => setSelected(new Set(suggested));
  const clearAll         = () => setSelected(new Set());
  const selectAll        = () => setSelected(new Set(schools.map((s) => s.id)));

  const handleSave = async () => {
    setSaving(true);
    try {
      await onConfirm([...selected]);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5 max-h-[90vh] flex flex-col">
        <div>
          <h2 className="font-semibold text-ink-800">Assign Schools to Job</h2>
          <p className="text-sm text-ink-500 mt-1">
            <strong>{job.title}</strong> · {job.companyName}
          </p>
          <p className="text-xs text-ink-400 mt-1">
            Assigned school faculty must approve before their students can see and apply.
          </p>
        </div>

        {/* Suggestion banner */}
        {!loadingSug && suggested.length > 0 && (
          <div className="bg-gold-50 border border-gold-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <HiOutlineSparkles className="w-4 h-4 text-gold-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gold-700">AI Suggestion</p>
              <p className="text-xs text-gold-600 mt-0.5">
                Based on job keywords: {schools.filter((s) => suggested.includes(s.id)).map((s) => s.shortCode).join(', ')}
              </p>
            </div>
            <button
              onClick={applySuggestions}
              className="text-xs font-semibold text-gold-700 hover:text-gold-900 whitespace-nowrap"
            >
              Apply
            </button>
          </div>
        )}

        {/* Action strip */}
        <div className="flex gap-2 flex-wrap">
          <button onClick={selectAll} className="text-xs text-maroon-600 hover:underline">Select all</button>
          <span className="text-ink-300">·</span>
          <button onClick={clearAll}  className="text-xs text-ink-500 hover:underline">Clear all</button>
          <span className="text-ink-400 text-xs ml-auto">{selected.size} selected</span>
        </div>

        {/* School checkboxes */}
        <div className="overflow-y-auto flex-1 space-y-2 pr-1">
          {schools.map((school) => {
            const isSuggested  = suggested.includes(school.id);
            const isChecked    = selected.has(school.id);
            const approvalData = job.schoolApprovals?.[school.id];
            const approvalMeta = approvalData ? SCHOOL_APPROVAL_BADGE[approvalData.status] : null;
            return (
              <label
                key={school.id}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  isChecked
                    ? 'bg-maroon-50 border-maroon-300'
                    : 'bg-white border-ink-200 hover:bg-cream-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => toggle(school.id)}
                  className="w-4 h-4 accent-maroon-600 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-800 truncate">{school.name}</p>
                  <p className="text-xs text-ink-400">{school.shortCode}</p>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {approvalMeta && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${approvalMeta.cls}`}>
                      {approvalMeta.label}
                    </span>
                  )}
                  {isSuggested && (
                    <span className="text-xs bg-gold-100 text-gold-700 px-2 py-0.5 rounded-full">
                      Suggested
                    </span>
                  )}
                </div>
              </label>
            );
          })}
        </div>

        <div className="flex justify-end gap-3 pt-2 border-t border-ink-100">
          <Button variant="ghost" onClick={onCancel} disabled={saving}>Cancel</Button>
          <Button onClick={handleSave} loading={saving}>
            <HiOutlineAcademicCap className="w-4 h-4 mr-1" />
            Save Assignment
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
const TPOJobsPage = () => {
  const { getToken } = useAuth();
  const [filter, setFilter]             = useState('PENDING_APPROVAL');
  const [jobs, setJobs]                 = useState([]);
  const [schools, setSchools]           = useState([]);
  const [loading, setLoading]           = useState(true);
  const [acting, setActing]             = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [assignTarget, setAssignTarget] = useState(null);

  const fetchJobs = useCallback(async (status = filter) => {
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
  }, [filter, getToken]);

  useEffect(() => { fetchJobs(filter); }, [filter]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load schools once for the assign modal
  useEffect(() => {
    referenceAPI.getSchools()
      .then((res) => setSchools(res.data || []))
      .catch(() => {});
  }, []);

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

  const handleReject      = (job) => setRejectTarget(job);
  const handleAssign      = (job) => setAssignTarget(job);

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

  const confirmAssign = async (schoolIds) => {
    const job = assignTarget;
    setAssignTarget(null);
    try {
      const token = await getToken();
      await jobAPI.assign(token, job.id, schoolIds);
      toast.success(
        schoolIds.length
          ? `Assigned to ${schoolIds.length} school(s).`
          : 'Assignment cleared — visible to all schools.'
      );
      fetchJobs(filter);
    } catch (e) {
      toast.error(e.message || 'Failed to assign.');
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
      <PageHeader title="Job Management" subtitle="Review, approve, and assign job postings to schools" />

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
                    {job.location  && <span>📍 {job.location}</span>}
                    {job.jobType   && <span>{job.jobType}</span>}
                    {job.openings  && <span>Openings: {job.openings}</span>}
                    {job.ctc       && <span>CTC: {job.ctc}</span>}
                    {job.stipend   && <span>Stipend: {job.stipend}</span>}
                  </div>
                  {job.eligibility && Object.keys(job.eligibility).length > 0 && (
                    <div className="text-xs text-ink-400 bg-cream-50 rounded-lg px-3 py-1.5 mt-2 inline-block">
                      {job.eligibility.minCgpa    != null && <span className="mr-3">Min CGPA: {job.eligibility.minCgpa}</span>}
                      {job.eligibility.maxBacklogs != null && <span>Max backlogs: {job.eligibility.maxBacklogs}</span>}
                    </div>
                  )}

                  {/* School assignment chip with approval breakdown */}
                  {job.status === 'OPEN' && (
                    <div className="mt-2 flex items-center gap-2 flex-wrap">
                      <HiOutlineAcademicCap className="w-3.5 h-3.5 text-ink-400" />
                      {job.assignedSchools?.length > 0 ? (
                        <>
                          <span className="text-xs text-maroon-700 bg-maroon-50 border border-maroon-200 px-2 py-0.5 rounded-full">
                            {job.assignedSchools.length} school{job.assignedSchools.length > 1 ? 's' : ''} assigned
                          </span>
                          {(() => {
                            const approvals = Object.values(job.schoolApprovals || {});
                            const pendingN  = approvals.filter((a) => a.status === 'PENDING_FACULTY').length;
                            const approvedN = approvals.filter((a) => a.status === 'FACULTY_APPROVED').length;
                            return (
                              <>
                                {pendingN  > 0 && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">{pendingN} pending</span>}
                                {approvedN > 0 && <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{approvedN} approved</span>}
                              </>
                            );
                          })()}
                        </>
                      ) : (
                        <span className="text-xs text-ink-400 bg-ink-50 border border-ink-200 px-2 py-0.5 rounded-full">
                          Not yet assigned to any school
                        </span>
                      )}
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
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleClose(job.id)}
                      loading={acting === job.id}
                    >
                      <HiOutlineLockClosed className="w-4 h-4 mr-1" /> Close
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleAssign(job)}
                      disabled={!!acting}
                    >
                      <HiOutlineAcademicCap className="w-4 h-4 mr-1" /> Assign Schools
                    </Button>
                  </>
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

      {assignTarget && (
        <AssignSchoolsModal
          job={assignTarget}
          schools={schools}
          getToken={getToken}
          onConfirm={confirmAssign}
          onCancel={() => setAssignTarget(null)}
        />
      )}
    </div>
  );
};

export default TPOJobsPage;
