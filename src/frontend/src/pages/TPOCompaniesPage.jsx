import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import { Badge, PageHeader, Button } from '../components/ui';
import toast from 'react-hot-toast';
import { HiOutlineOfficeBuilding, HiOutlineCheck, HiOutlineX } from 'react-icons/hi';

const TPOCompaniesPage = () => {
  const { getToken } = useAuth();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [acting, setActing]       = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res   = await adminAPI.listUsers(token, { role: 'COMPANY', status: 'PENDING_APPROVAL' });
      setCompanies(res.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load companies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCompanies(); }, []);

  const handleApprove = async (userId) => {
    setActing(userId);
    try {
      const token = await getToken();
      await adminAPI.approveCompany(token, userId);
      toast.success('Company approved.');
      fetchCompanies();
    } catch (e) {
      toast.error(e.message || 'Failed to approve.');
    } finally {
      setActing(null);
    }
  };

  const handleRejectConfirm = async () => {
    const userId = rejectTarget;
    setRejectTarget(null);
    setActing(userId);
    try {
      const token = await getToken();
      await adminAPI.rejectCompany(token, userId, rejectReason);
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
      <PageHeader title="Pending Companies" subtitle="Approve or reject company registrations" />

      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : companies.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineOfficeBuilding className="w-10 h-10 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No pending company approvals.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map((c) => (
            <div key={c.uid} className="card p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-violet-200">
                  <HiOutlineOfficeBuilding className="w-5 h-5 text-violet-600" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink-800 truncate">{c.fullName}</p>
                  <p className="text-xs text-ink-500 truncate">{c.email}</p>
                  <p className="text-xs text-ink-400 mt-0.5">Registered {new Date(c.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Badge variant="warning">Pending</Badge>
                <Button size="sm" onClick={() => handleApprove(c.uid)} loading={acting === c.uid}>
                  <HiOutlineCheck className="w-4 h-4 mr-1" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => { setRejectTarget(c.uid); setRejectReason(''); }}
                  disabled={!!acting}
                >
                  <HiOutlineX className="w-4 h-4 mr-1" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
            <h2 className="font-semibold text-ink-800">Reject Company</h2>
            <div>
              <label className="label">Reason (optional)</label>
              <textarea
                className="input resize-none"
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Provide a reason…"
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
