import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineSearch, HiOutlineRefresh,
  HiOutlineCheck, HiOutlineBan, HiOutlineTrash, HiOutlineFilter,
  HiOutlineUserAdd,
} from 'react-icons/hi';
import { PageHeader, Badge } from '../components/ui';

const ROLES    = ['STUDENT', 'FACULTY', 'TPO', 'COMPANY', 'ADMIN'];
const STATUSES = ['ACTIVE', 'UNVERIFIED', 'PENDING_APPROVAL', 'SUSPENDED', 'DEACTIVATED'];

const STATUS_LABELS = {
  ACTIVE: 'Active', UNVERIFIED: 'Unverified',
  PENDING_APPROVAL: 'Pending Approval', SUSPENDED: 'Suspended', DEACTIVATED: 'Deactivated',
};

const statusBadgeVariant = (status) => {
  switch (status) {
    case 'ACTIVE':           return 'success';
    case 'UNVERIFIED':       return 'warning';
    case 'PENDING_APPROVAL': return 'warning';
    case 'SUSPENDED':        return 'danger';
    case 'DEACTIVATED':      return 'neutral';
    default:                 return 'neutral';
  }
};

const AdminUsersPage = () => {
  const { getToken } = useAuth();

  const [users, setUsers]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [filterRole, setFilterRole]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch]             = useState('');
  const [totalUsers, setTotalUsers]     = useState(0);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const token  = await getToken();
      const params = {};
      if (filterRole)   params.role   = filterRole;
      if (filterStatus) params.status = filterStatus;
      const response = await adminAPI.listUsers(token, params);
      setUsers(response.data.users);
      setTotalUsers(response.data.total);
    } catch (err) {
      toast.error(err.message || 'Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [getToken, filterRole, filterStatus]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      const token = await getToken();
      await adminAPI.updateUserRole(token, userId, newRole);
      toast.success(`Role updated to ${newRole}.`);
      setUsers((prev) => prev.map((u) => (u.uid === userId ? { ...u, role: newRole } : u)));
    } catch (err) {
      toast.error(err.message || 'Failed to update role.');
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const token = await getToken();
      await adminAPI.updateUserStatus(token, userId, newStatus);
      toast.success(`User ${STATUS_LABELS[newStatus] || newStatus}.`);
      setUsers((prev) => prev.map((u) => (u.uid === userId ? { ...u, status: newStatus } : u)));
    } catch (err) {
      toast.error(err.message || 'Failed to update status.');
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`Permanently delete "${userName}"? This cannot be undone.`)) return;
    try {
      const token = await getToken();
      await adminAPI.deleteUser(token, userId);
      toast.success(`"${userName}" deleted.`);
      setUsers((prev) => prev.filter((u) => u.uid !== userId));
      setTotalUsers((prev) => prev - 1);
    } catch (err) {
      toast.error(err.message || 'Failed to delete user.');
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.fullName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  const pendingCount = users.filter((u) => u.status === 'PENDING_APPROVAL').length;

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="User Management"
        subtitle={`${totalUsers} total users registered`}
        actions={
          <button onClick={fetchUsers} className="btn-secondary gap-2 text-sm">
            <HiOutlineRefresh className="w-4 h-4" />
            Refresh
          </button>
        }
      />

      {pendingCount > 0 && (
        <div className="alert-warning">
          <HiOutlineUserAdd className="w-5 h-5 flex-shrink-0" />
          <span>
            <strong>{pendingCount} company account{pendingCount > 1 ? 's' : ''}</strong> pending approval.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or email…"
              className="input-field pl-9 text-sm py-2"
            />
          </div>

          <div className="flex items-center gap-2">
            <HiOutlineFilter className="w-4 h-4 text-ink-400 flex-shrink-0" />
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
              className="input-field text-sm py-2 w-36">
              <option value="">All Roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field text-sm py-2 w-48">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>

          {(filterRole || filterStatus || search) && (
            <button onClick={() => { setFilterRole(''); setFilterStatus(''); setSearch(''); }}
              className="btn-ghost text-sm px-3 py-2 text-ink-400 hover:text-danger">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-maroon-600" />
            <p className="text-sm text-ink-400">Loading users…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <HiOutlineSearch className="w-10 h-10 text-ink-200" />
            <p className="text-ink-400 text-sm">No users match your filters.</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="th">User</th>
                <th className="th">Role</th>
                <th className="th">Status</th>
                <th className="th">Registered</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.uid} className="tr">
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-maroon-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-maroon-700 text-xs font-bold">
                          {(user.fullName?.[0] || '?').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-ink-800 text-sm">{user.fullName}</p>
                        <p className="text-xs text-ink-400">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  <td className="td">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                      className="text-xs font-medium cursor-pointer border-0 bg-transparent focus:outline-none focus:ring-1 focus:ring-maroon-300 rounded"
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>

                  <td className="td">
                    <Badge variant={statusBadgeVariant(user.status)}>
                      {STATUS_LABELS[user.status] || user.status}
                    </Badge>
                  </td>

                  <td className="td text-ink-400">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>

                  <td className="td">
                    <div className="flex justify-end items-center gap-1.5">
                      {user.status !== 'ACTIVE' && (
                        <button
                          onClick={() => handleStatusChange(user.uid, 'ACTIVE')}
                          className="btn btn-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200"
                          title="Activate"
                        >
                          <HiOutlineCheck className="w-3.5 h-3.5" />
                          Activate
                        </button>
                      )}
                      {user.status !== 'DEACTIVATED' && (
                        <button
                          onClick={() => handleStatusChange(user.uid, 'DEACTIVATED')}
                          className="btn btn-sm bg-ink-50 text-ink-600 hover:bg-ink-100 ring-1 ring-ink-200"
                          title="Deactivate"
                        >
                          <HiOutlineBan className="w-3.5 h-3.5" />
                          Deactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.uid, user.fullName)}
                        className="btn btn-sm bg-red-50 text-red-600 hover:bg-red-100 ring-1 ring-red-200"
                        title="Delete permanently"
                      >
                        <HiOutlineTrash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 bg-cream-100 border-t border-ink-100 flex items-center justify-between">
            <p className="text-xs text-ink-400">
              Showing <strong className="text-ink-600">{filtered.length}</strong> of <strong className="text-ink-600">{totalUsers}</strong> users
            </p>
            {search && (
              <p className="text-xs text-maroon-600 font-medium">Filtered by: &ldquo;{search}&rdquo;</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
