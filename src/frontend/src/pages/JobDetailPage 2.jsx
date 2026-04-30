import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI, applicationAPI, declarationAPI, studentProfileAPI } from '../services/api';
import { Badge, Button, PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineOfficeBuilding, HiOutlineLocationMarker, HiOutlineBriefcase,
  HiOutlineCurrencyRupee, HiOutlineUsers, HiOutlineCalendar,
  HiOutlineCheckCircle, HiOutlineShieldCheck, HiOutlineExclamation,
  HiOutlineArrowLeft, HiOutlineUpload, HiOutlineDocumentText,
} from 'react-icons/hi';

const STATUS_VARIANT = {
  APPLIED:             'neutral',
  SHORTLISTED:         'maroon',
  INTERVIEW_SCHEDULED: 'warning',
  INTERVIEWED:         'warning',
  SELECTED:            'success',
  REJECTED:            'danger',
  WAITLISTED:          'neutral',
  WITHDRAWN_STUDENT:   'neutral',
  WITHDRAWN_SYSTEM:    'neutral',
};

const JobDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getToken, userProfile } = useAuth();

  const [job, setJob]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [applying, setApplying]     = useState(false);
  const [existingApp, setExistingApp] = useState(null);
  const [hasSigned, setHasSigned]   = useState(false);
  const [profileComplete, setProfileComplete] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [readinessLoaded, setReadinessLoaded] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const jobRes = await jobAPI.get(token, id);
        setJob(jobRes.data);

        if (userProfile?.role === 'STUDENT') {
          const [appsRes, declRes, profileRes] = await Promise.all([
            applicationAPI.listMine(token),
            declarationAPI.getMySigned(token),
            studentProfileAPI.get(token),
          ]);
          const found = (appsRes.data || []).find((a) => a.jobId === id);
          setExistingApp(found || null);
          setHasSigned((declRes.data || []).length > 0);
          const p = profileRes.data || {};
          setProfileComplete(!!p.profileComplete);
          setReadinessLoaded(true);
        }
      } catch (e) {
        toast.error(e.message || 'Failed to load job.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id, getToken, userProfile]);

  const handleApply = async () => {
    if (!hasSigned) {
      toast.error('Please sign the PGAB Self-Declaration first (go to My Profile).');
      return;
    }
    if (!profileComplete) {
      toast.error('Please complete your profile before applying.');
      return;
    }
    if (!selectedFile) {
      toast.error('Please attach your resume PDF before applying.');
      return;
    }
    setApplying(true);
    try {
      const token = await getToken();
      const res = await applicationAPI.apply(token, id, selectedFile);
      setExistingApp(res.data);
      toast.success('Application submitted successfully!');
      navigate('/applications');
    } catch (e) {
      if (e.data?.code === 'DECLARATION_REQUIRED') {
        toast.error('Please sign the PGAB Self-Declaration first.');
      } else if (e.data?.code === 'NOT_ELIGIBLE') {
        toast.error(e.message || 'You are not eligible for this job.');
      } else if (e.data?.code === 'ALREADY_APPLIED') {
        toast.error('You have already applied for this job.');
      } else {
        toast.error(e.message || 'Failed to apply.');
      }
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="card p-12 text-center">
        <p className="text-ink-500">Job not found.</p>
        <Link to="/jobs" className="mt-4 text-maroon-600 hover:underline text-sm">← Back to jobs</Link>
      </div>
    );
  }

  const isStudent = userProfile?.role === 'STUDENT';

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Back link */}
      <Link
        to={isStudent ? '/jobs' : '/company/jobs'}
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-maroon-600 transition-colors"
      >
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to jobs
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left — full job info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Header */}
          <div className="card p-6 space-y-3">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-maroon-50 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-maroon-200">
                <HiOutlineOfficeBuilding className="w-6 h-6 text-maroon-600" />
              </div>
              <div className="min-w-0">
                <h1 className="font-display text-2xl font-semibold text-ink-800">{job.title}</h1>
                <p className="text-ink-500 mt-0.5">{job.companyName}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-ink-500">
              {job.location && (
                <span className="flex items-center gap-1.5">
                  <HiOutlineLocationMarker className="w-4 h-4" /> {job.location}
                </span>
              )}
              {job.jobType && (
                <span className="flex items-center gap-1.5">
                  <HiOutlineBriefcase className="w-4 h-4" /> {job.jobType.replace('_', ' ')}
                </span>
              )}
              {job.openings && (
                <span className="flex items-center gap-1.5">
                  <HiOutlineUsers className="w-4 h-4" /> {job.openings} opening{job.openings !== 1 ? 's' : ''}
                </span>
              )}
              {(job.ctc || job.stipend) && (
                <span className="flex items-center gap-1.5">
                  <HiOutlineCurrencyRupee className="w-4 h-4" />
                  {job.ctc || job.stipend}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <HiOutlineCalendar className="w-4 h-4" />
                Posted {new Date(job.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Description — rendered as Markdown */}
          <div className="card p-6">
            <h2 className="font-semibold text-ink-800 mb-4">Job Description</h2>
            <div className="prose prose-sm max-w-none text-ink-700
              prose-headings:text-ink-800 prose-headings:font-semibold
              prose-a:text-maroon-600 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-ink-800 prose-code:text-maroon-700 prose-code:bg-cream-100 prose-code:px-1 prose-code:rounded
              prose-table:text-sm prose-th:bg-cream-100 prose-th:text-left prose-th:px-3 prose-th:py-2
              prose-td:px-3 prose-td:py-2 prose-td:border prose-td:border-ink-100">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{job.description}</ReactMarkdown>
            </div>
          </div>

          {/* Eligibility */}
          {job.eligibility && Object.keys(job.eligibility).length > 0 && (
            <div className="card p-6">
              <h2 className="font-semibold text-ink-800 mb-4">Eligibility Criteria</h2>
              <div className="space-y-2 text-sm text-ink-700">
                {job.eligibility.minCgpa != null && (
                  <div className="flex items-center gap-2">
                    <HiOutlineCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Minimum CGPA: <strong>{job.eligibility.minCgpa}</strong>
                  </div>
                )}
                {job.eligibility.maxBacklogs != null && (
                  <div className="flex items-center gap-2">
                    <HiOutlineCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                    Maximum backlogs: <strong>{job.eligibility.maxBacklogs}</strong>
                  </div>
                )}
                {job.eligibility.allowedBranches?.length > 0 && (
                  <div className="flex items-start gap-2">
                    <HiOutlineCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Eligible branches: <strong>{job.eligibility.allowedBranches.join(', ')}</strong></span>
                  </div>
                )}
                {job.eligibility.allowedProgrammes?.length > 0 && (
                  <div className="flex items-start gap-2">
                    <HiOutlineCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>Eligible programmes: <strong>{job.eligibility.allowedProgrammes.join(', ')}</strong></span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right — Apply card (sticky) */}
        <div className="lg:col-span-1">
          <div className="card p-6 space-y-4 lg:sticky lg:top-6">
            {!isStudent ? (
              <div>
                <p className="text-sm font-medium text-ink-600">Status</p>
                <Badge variant={{ OPEN: 'success', PENDING_APPROVAL: 'warning', CLOSED: 'neutral', REJECTED: 'danger', WITHDRAWN: 'neutral' }[job.status] || 'neutral'}>
                  {job.status?.replace('_', ' ')}
                </Badge>
              </div>
            ) : existingApp ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-700">
                  <HiOutlineCheckCircle className="w-5 h-5" />
                  <p className="font-semibold text-sm">Application Submitted</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-ink-500">Status:</p>
                  <Badge variant={STATUS_VARIANT[existingApp.status] || 'neutral'}>
                    {existingApp.status?.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-ink-400">
                  Applied {new Date(existingApp.appliedAt).toLocaleDateString()}
                </p>
                <Link to="/applications" className="block">
                  <Button variant="ghost" className="w-full">View My Applications</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="font-semibold text-ink-800">Apply for this position</h3>

                {readinessLoaded && (
                  <div className="space-y-2">
                    {[
                      { ok: hasSigned,      label: 'PGAB Declaration signed', link: '/profile' },
                      { ok: profileComplete, label: 'Profile complete',        link: '/profile' },
                    ].map(({ ok, label, link }) => (
                      <div key={label} className="flex items-center gap-2 text-sm">
                        {ok ? (
                          <HiOutlineCheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <HiOutlineExclamation className="w-4 h-4 text-amber-500 flex-shrink-0" />
                        )}
                        <span className={ok ? 'text-ink-600' : 'text-amber-700'}>
                          {ok ? label : <Link to={link} className="underline">{label}</Link>}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Resume picker */}
                <div>
                  <p className="text-xs font-medium text-ink-500 uppercase tracking-wide mb-1.5">
                    Resume for this application <span className="text-red-500">*</span>
                  </p>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="application/pdf"
                    className="hidden"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  {selectedFile ? (
                    <div className="flex items-center gap-2 p-2.5 bg-cream-50 border border-ink-200 rounded-xl">
                      <HiOutlineDocumentText className="w-4 h-4 text-maroon-600 flex-shrink-0" />
                      <p className="text-xs text-ink-700 truncate flex-1">{selectedFile.name}</p>
                      <button
                        onClick={() => { setSelectedFile(null); if (fileRef.current) fileRef.current.value = ''; }}
                        className="text-ink-400 hover:text-red-500 flex-shrink-0"
                      >
                        <HiOutlineExclamation className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 border-2 border-dashed border-ink-200 rounded-xl text-sm text-ink-500 hover:border-maroon-400 hover:text-maroon-600 transition-colors"
                    >
                      <HiOutlineUpload className="w-4 h-4" /> Choose PDF resume
                    </button>
                  )}
                </div>

                <Button
                  className="w-full"
                  onClick={handleApply}
                  loading={applying}
                  disabled={readinessLoaded && (!hasSigned || !profileComplete || !selectedFile)}
                >
                  Submit Application
                </Button>

                {readinessLoaded && (!hasSigned || !profileComplete) && (
                  <p className="text-xs text-amber-600 text-center">
                    Complete all requirements above before applying.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobDetailPage;
