import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { applicationAPI } from '../services/api';
import { Badge, PageHeader, Button } from '../components/ui';
import toast from 'react-hot-toast';
import { HiOutlineClipboardList, HiOutlineOfficeBuilding } from 'react-icons/hi';

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

const STATUS_LABEL = {
  APPLIED:             'Applied',
  SHORTLISTED:         'Shortlisted',
  INTERVIEW_SCHEDULED: 'Interview Scheduled',
  INTERVIEWED:         'Interviewed',
  SELECTED:            'Selected',
  REJECTED:            'Rejected',
  WAITLISTED:          'Waitlisted',
  WITHDRAWN_STUDENT:   'Withdrawn',
  WITHDRAWN_SYSTEM:    'Withdrawn (System)',
};

const NON_WITHDRAWABLE = ['SELECTED', 'WITHDRAWN_STUDENT', 'WITHDRAWN_SYSTEM'];

const ApplicationsPage = () => {
  const { getToken } = useAuth();
  const [apps, setApps]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [withdrawing, setWithdrawing] = useState(null);

  const fetchApps = async () => {
    try {
      const token = await getToken();
      const res   = await applicationAPI.listMine(token);
      setApps(res.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load applications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApps(); }, []);

  const handleWithdraw = async (appId) => {
    if (!confirm('Withdraw this application?')) return;
    setWithdrawing(appId);
    try {
      const token = await getToken();
      await applicationAPI.withdraw(token, appId);
      toast.success('Application withdrawn.');
      fetchApps();
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
      <PageHeader title="My Applications" subtitle="Track the status of your job applications" />

      {apps.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <HiOutlineClipboardList className="w-10 h-10 text-ink-300 mx-auto" />
          <p className="text-ink-500">You haven&apos;t applied to any jobs yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="card p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 bg-maroon-50 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-maroon-200">
                    <HiOutlineOfficeBuilding className="w-5 h-5 text-maroon-600" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-ink-800 text-sm truncate">{app.jobTitle}</h3>
                    <p className="text-xs text-ink-500 truncate">{app.companyName}</p>
                    <p className="text-xs text-ink-400 mt-0.5">Applied {new Date(app.appliedAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant={STATUS_VARIANT[app.status] || 'neutral'}>
                    {STATUS_LABEL[app.status] || app.status}
                  </Badge>
                  {!NON_WITHDRAWABLE.includes(app.status) && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleWithdraw(app.id)}
                      loading={withdrawing === app.id}
                    >
                      Withdraw
                    </Button>
                  )}
                </div>
              </div>

              {/* Status timeline */}
              {app.statusHistory?.length > 1 && (
                <div className="mt-4 pl-4 border-l-2 border-ink-100 space-y-2">
                  {app.statusHistory.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs text-ink-500">
                      <span className="w-2 h-2 rounded-full bg-ink-300 flex-shrink-0" />
                      <span>{STATUS_LABEL[h.status] || h.status}</span>
                      <span className="text-ink-300">—</span>
                      <span>{new Date(h.changedAt).toLocaleDateString()}</span>
                      {h.note && <span className="text-ink-400 italic">· {h.note}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationsPage;
