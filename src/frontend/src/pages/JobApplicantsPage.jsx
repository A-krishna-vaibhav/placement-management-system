import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI } from '../services/api';
import { Badge, PageHeader, Button } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft, HiOutlineUser, HiOutlineDocumentText,
} from 'react-icons/hi';

const APPLICATION_STATUSES = [
  'APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED',
  'SELECTED', 'REJECTED', 'WAITLISTED',
];

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

const JobApplicantsPage = () => {
  const { id } = useParams();
  const { getToken } = useAuth();
  const [job, setJob]       = useState(null);
  const [apps, setApps]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

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
      toast.success(`Status updated to ${newStatus.replace('_', ' ')}.`);
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
      <Link to="/company/jobs" className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-maroon-600 transition-colors">
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to my jobs
      </Link>

      <PageHeader
        title={job ? `Applicants — ${job.title}` : 'Applicants'}
        subtitle={`${apps.length} application${apps.length !== 1 ? 's' : ''} received`}
      />

      {apps.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineUser className="w-10 h-10 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No applications yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="card p-5">
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
                  {app.resumeUrl && (
                    <a
                      href={app.resumeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs text-maroon-600 hover:underline"
                    >
                      <HiOutlineDocumentText className="w-4 h-4" /> Resume
                    </a>
                  )}
                  <Badge variant={STATUS_VARIANT[app.status] || 'neutral'}>
                    {app.status?.replace('_', ' ')}
                  </Badge>
                  {/* Status update — only if not withdrawn */}
                  {!['WITHDRAWN_STUDENT', 'WITHDRAWN_SYSTEM'].includes(app.status) && (
                    <select
                      value={app.status}
                      disabled={updating === app.id}
                      onChange={(e) => handleStatusChange(app.id, e.target.value)}
                      className="text-xs border border-ink-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-maroon-500 disabled:opacity-50"
                    >
                      {APPLICATION_STATUSES.map((s) => (
                        <option key={s} value={s}>{s.replace('_', ' ')}</option>
                      ))}
                    </select>
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

export default JobApplicantsPage;
