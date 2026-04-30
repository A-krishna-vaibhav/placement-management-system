import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI } from '../services/api';
import { Badge, PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft, HiOutlineUser, HiOutlineDocumentText,
  HiOutlineAcademicCap, HiOutlineX, HiOutlineDownload, HiOutlineEye,
  HiOutlineCalendar,
} from 'react-icons/hi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

/* ─── Recruitment pipeline stages shown in the dropdown ─── */
const PIPELINE_STAGES = [
  {
    label: 'Stage 1 — Shortlisting',
    options: [
      { value: 'APPLIED',          label: 'Applied (initial)' },
      { value: 'SHORTLISTED',      label: 'Shortlisted' },
      { value: 'NOT_SHORTLISTED',  label: 'NOT Shortlisted' },
    ],
  },
  {
    label: 'Stage 2 — Interview Selection',
    options: [
      { value: 'INTERVIEW_SCHEDULED',    label: 'Selected for Interview (Exam basis)' },
      { value: 'NOT_SELECTED_INTERVIEW', label: 'NOT Selected for Interview' },
    ],
  },
  {
    label: 'Stage 3 — Final Decision',
    options: [
      { value: 'SELECTED', label: 'Selected' },
      { value: 'REJECTED', label: 'Rejected' },
    ],
  },
];

const STATUS_LABEL = {
  APPLIED:                'Applied',
  SHORTLISTED:            'Shortlisted',
  NOT_SHORTLISTED:        'Not Shortlisted',
  INTERVIEW_SCHEDULED:    'Selected for Interview',
  NOT_SELECTED_INTERVIEW: 'Not Selected for Interview',
  SELECTED:               'Selected',
  REJECTED:               'Rejected',
  WITHDRAWN_STUDENT:      'Withdrawn',
  WITHDRAWN_SYSTEM:       'Withdrawn (System)',
};

const STATUS_VARIANT = {
  APPLIED:                'neutral',
  SHORTLISTED:            'maroon',
  NOT_SHORTLISTED:        'danger',
  INTERVIEW_SCHEDULED:    'warning',
  NOT_SELECTED_INTERVIEW: 'danger',
  SELECTED:               'success',
  REJECTED:               'danger',
  WITHDRAWN_STUDENT:      'neutral',
  WITHDRAWN_SYSTEM:       'neutral',
};

/* ─── PDF Preview Modal ─── */
const ResumeModal = ({ app, jobId, onClose, getToken }) => {
  const [url, setUrl]         = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    let objectUrl;
    (async () => {
      try {
        const token = await getToken();
        const response = await fetch(`${API_URL}/jobs/${jobId}/applications/${app.id}/resume`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.message || 'Failed to load resume.');
        }
        const blob = await response.blob();
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      } catch (e) {
        setError(e.message || 'Failed to load resume.');
      } finally {
        setLoading(false);
      }
    })();
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [app.id, jobId, getToken]);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100 flex-shrink-0">
          <div className="min-w-0">
            <h3 className="font-semibold text-ink-800 truncate">Resume — {app.studentName}</h3>
            <p className="text-xs text-ink-400 truncate">{app.resumeFileName || 'resume.pdf'}</p>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0 ml-4">
            {url && (
              <a
                href={url}
                download={app.resumeFileName || 'resume.pdf'}
                className="flex items-center gap-1.5 text-xs font-medium text-maroon-600 hover:text-maroon-800 border border-maroon-200 rounded-lg px-3 py-1.5 hover:bg-maroon-50 transition-colors"
              >
                <HiOutlineDownload className="w-4 h-4" /> Download
              </a>
            )}
            <button onClick={onClose} className="text-ink-400 hover:text-ink-700 transition-colors p-1">
              <HiOutlineX className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-hidden p-4" style={{ minHeight: '60vh' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
              <HiOutlineDocumentText className="w-10 h-10 text-ink-300" />
              <p className="text-sm text-ink-500">{error}</p>
            </div>
          ) : (
            <iframe
              src={url}
              title={`Resume — ${app.studentName}`}
              className="w-full rounded-lg border border-ink-100"
              style={{ height: '100%', minHeight: '60vh' }}
            />
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
const JobApplicantsPage = () => {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [job, setJob]               = useState(null);
  const [apps, setApps]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [updating, setUpdating]     = useState(null);
  const [previewApp, setPreviewApp] = useState(null);

  const fetchAll = async () => {
    try {
      const token = await getToken();
      const [jobRes, appsRes] = await Promise.all([
        jobAPI.get(token, id),
        jobAPI.listApplications(token, id),
      ]);
      setJob(jobRes.data);
      setApps(appsRes.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load applicants.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);

  const handleStatusChange = async (appId, newStatus) => {
    setUpdating(appId);
    try {
      const token = await getToken();
      await jobAPI.updateApplicationStatus(token, id, appId, newStatus);
      setApps((prev) =>
        prev.map((a) => a.id === appId ? { ...a, status: newStatus } : a)
      );
      toast.success(`Status updated to "${STATUS_LABEL[newStatus] || newStatus}".`);
    } catch (e) {
      toast.error(e.message || 'Failed to update status.');
    } finally {
      setUpdating(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <Link
        to="/company/jobs"
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-maroon-600 transition-colors"
      >
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to my jobs
      </Link>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title={job ? `Applicants — ${job.title}` : 'Applicants'}
          subtitle={`${apps.length} application${apps.length !== 1 ? 's' : ''} received`}
        />
        <div className="flex items-center gap-2 flex-shrink-0 mt-1 flex-wrap">
          {apps.some((a) => a.status === 'SHORTLISTED') && (
            <Link
              to={`/company/jobs/${id}/exam-schedule`}
              className="flex items-center gap-1.5 text-sm font-medium text-maroon-600 hover:text-maroon-800 border border-maroon-200 rounded-xl px-4 py-2 hover:bg-maroon-50 transition-colors"
            >
              <HiOutlineCalendar className="w-4 h-4" />
              Schedule Exam
            </Link>
          )}
          {apps.some((a) => a.status === 'INTERVIEW_SCHEDULED') && (
            <Link
              to={`/company/jobs/${id}/interview-schedule`}
              className="flex items-center gap-1.5 text-sm font-medium text-maroon-600 hover:text-maroon-800 border border-maroon-200 rounded-xl px-4 py-2 hover:bg-maroon-50 transition-colors"
            >
              <HiOutlineCalendar className="w-4 h-4" />
              Schedule Interview
            </Link>
          )}
        </div>
      </div>

      {apps.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineUser className="w-10 h-10 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No applications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => {
            const sp = app.studentProfile;
            // Include resumeLocalPath (local filesystem fallback) alongside cloud storage paths
            const hasResume = !!(app.resumeStoragePath || app.resumeLocalPath || app.resumeUrl);
            const isWithdrawn = ['WITHDRAWN_STUDENT', 'WITHDRAWN_SYSTEM'].includes(app.status);

            return (
              <div key={app.id} className="card p-5 space-y-4">
                {/* Header row */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-ink-200">
                      <HiOutlineUser className="w-5 h-5 text-ink-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-ink-800 truncate">{app.studentName}</p>
                      <p className="text-xs text-ink-500 truncate">{app.studentEmail}</p>
                      <p className="text-xs text-ink-400 mt-0.5">
                        Applied {new Date(app.appliedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap flex-shrink-0">
                    {/* Resume button */}
                    {hasResume ? (
                      <button
                        onClick={() => setPreviewApp(app)}
                        className="flex items-center gap-1.5 text-xs font-medium text-maroon-600 hover:text-maroon-800 border border-maroon-200 rounded-lg px-2.5 py-1.5 hover:bg-maroon-50 transition-colors"
                      >
                        <HiOutlineEye className="w-4 h-4" />
                        View Resume
                      </button>
                    ) : (
                      <span className="text-xs text-ink-400 italic">No resume</span>
                    )}

                    <Badge variant={STATUS_VARIANT[app.status] || 'neutral'}>
                      {STATUS_LABEL[app.status] || app.status?.replace(/_/g, ' ')}
                    </Badge>

                    {/* Pipeline dropdown — hidden for withdrawn applications */}
                    {!isWithdrawn && (
                      <select
                        value={app.status}
                        disabled={updating === app.id}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className="text-xs border border-ink-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-maroon-500 disabled:opacity-50 max-w-[220px]"
                      >
                        {PIPELINE_STAGES.map((stage) => (
                          <optgroup key={stage.label} label={stage.label}>
                            {stage.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                {/* Academic profile */}
                {sp && (
                  <div className="bg-cream-50 border border-ink-100 rounded-xl p-3 space-y-2">
                    <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide flex items-center gap-1">
                      <HiOutlineAcademicCap className="w-3.5 h-3.5" /> Academic Details
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1 text-xs">
                      {sp.rollNumber   && <span className="text-ink-500">Roll: <strong className="text-ink-800">{sp.rollNumber}</strong></span>}
                      {sp.programme    && <span className="text-ink-500">Programme: <strong className="text-ink-800">{sp.programme}</strong></span>}
                      {sp.cgpa != null && <span className="text-ink-500">CGPA: <strong className="text-ink-800">{sp.cgpa}</strong></span>}
                      {sp.backlogs != null && <span className="text-ink-500">Backlogs: <strong className="text-ink-800">{sp.backlogs}</strong></span>}
                    </div>
                    {sp.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {sp.skills.map((s) => (
                          <span key={s} className="bg-white border border-ink-200 text-ink-600 text-[10px] px-2 py-0.5 rounded-full">{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewApp && (
        <ResumeModal
          app={previewApp}
          jobId={id}
          getToken={getToken}
          onClose={() => setPreviewApp(null)}
        />
      )}
    </div>
  );
};

export default JobApplicantsPage;
