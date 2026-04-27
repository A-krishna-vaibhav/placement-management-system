import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { Badge, PageHeader, Button } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineOfficeBuilding, HiOutlineCheck, HiOutlineX,
  HiOutlineRefresh, HiOutlineMail, HiOutlineCalendar,
} from 'react-icons/hi';

const TPOCompaniesPage = () => {
  const { getToken } = useAuth();
  const [companies, setCompanies]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [acting, setActing]             = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res   = await adminAPI.listPendingCompanies(token);
      setCompanies(res.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleApprove = async (companyId) => {
    setActing(companyId);
    try {
      const token = await getToken();
      await adminAPI.approveCompany(token, companyId);
      toast.success('Company approved.');
      fetchCompanies();
    } catch (e) {
      toast.error(e.message || 'Failed to approve.');
    } finally {
      setActing(null);
    }
  };

  const handleRejectConfirm = async () => {
    const companyId = rejectTarget;
    setRejectTarget(null);
    setActing(companyId);
    try {
      const token = await getToken();
      await adminAPI.rejectCompany(token, companyId, rejectReason);
      toast.success('Company rejected.');
      setRejectReason('');
      fetchCompanies();
    } catch (e) {
      toast.error(e.message || 'Failed to reject.');
    } finally {
      setActing(null);
    }
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="Pending Companies"
        subtitle="Review and approve company registrations"
        actions={
          <button onClick={fetchCompanies} className="btn-secondary gap-2 text-sm">
            <HiOutlineRefresh className="w-4 h-4" /> Refresh
          </button>
        }
      />

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : companies.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <HiOutlineOfficeBuilding className="w-10 h-10 text-ink-300 mx-auto" />
          <p className="text-ink-500 font-medium">No pending approvals</p>
          <p className="text-xs text-ink-400">All company registrations have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map((c) => (
            <div key={c.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-12 h-12 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-violet-200">
                    <HiOutlineOfficeBuilding className="w-6 h-6 text-violet-600" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-ink-800">{c.companyName}</p>
                    <div className="flex flex-wrap gap-3 text-xs text-ink-500">
                      {c.hrEmail && (
                        <span className="flex items-center gap-1">
                          <HiOutlineMail className="w-3.5 h-3.5" />{c.hrEmail}
                        </span>
                      )}
                      {c.createdAt && (
                        <span className="flex items-center gap-1">
                          <HiOutlineCalendar className="w-3.5 h-3.5" />
                          {new Date(c.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                      {c.website && (
                        <a href={c.website} target="_blank" rel="noreferrer" className="text-maroon-600 hover:underline truncate max-w-[200px]">
                          {c.website}
                        </a>
                      )}
                    </div>
                    {c.description && (
                      <p className="text-xs text-ink-400 line-clamp-2 max-w-lg mt-1">{c.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Badge variant="warning">Pending</Badge>
                  <Button size="sm" onClick={() => handleApprove(c.id)} loading={acting === c.id} disabled={!!acting}>
                    <HiOutlineCheck className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => { setRejectTarget(c.id); setRejectReason(''); }} disabled={!!acting}>
                    <HiOutlineX className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-semibold text-ink-800">Reject Company</h2>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-1">Reason (optional)</label>
              <textarea
                className="w-full border border-ink-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-maroon-500"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a reason for rejection…"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setRejectTarget(null)}>Cancel</Button>
              <Button variant="danger" onClick={handleRejectConfirm}>Confirm Reject</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TPOCompaniesPage;
