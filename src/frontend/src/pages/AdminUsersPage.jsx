/**
 * Admin User Management Page
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { adminAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  HiOutlineUsers, HiOutlineSearch, HiOutlineRefresh,
  HiOutlineCheck, HiOutlineBan, HiOutlineTrash, HiOutlineFilter,
  HiOutlineUserAdd,
} from 'react-icons/hi';

const ROLES    = ['Student', 'Faculty', 'Company', 'Admin'];
const STATUSES = ['Active', 'Inactive', 'Deactivated'];

const roleBadgeClass = (role) => {
  switch (role) {
    case 'Admin':   return 'bg-rose-50   text-rose-700   ring-1 ring-rose-200';
    case 'Faculty': return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200';
    case 'Company': return 'bg-violet-50 text-violet-700  ring-1 ring-violet-200';
    default:        return 'bg-primary-50 text-primary-700 ring-1 ring-primary-200';
  }
};

const AdminUsersPage = () => {
  const { getToken } = useAuth();

  const [users, setUsers]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterRole, setFilterRole]     = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch]       = useState('');
  const [totalUsers, setTotalUsers] = useState(0);

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
      toast.success(`User ${newStatus.toLowerCase()}.`);
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

  // Client-side search filter
  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.department?.toLowerCase().includes(q)
    );
  });

  const pendingCount = users.filter((u) => u.status === 'Inactive').length;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Page Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center ring-1 ring-rose-200">
            <HiOutlineUsers className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-surface-900">User Management</h1>
            <p className="text-sm text-surface-500">{totalUsers} total users registered</p>
          </div>
        </div>
        <button onClick={fetchUsers} className="btn-secondary gap-2 text-sm">
          <HiOutlineRefresh className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Pending alert */}
      {pendingCount > 0 && (
        <div className="alert-warning">
          <HiOutlineUserAdd className="w-5 h-5 flex-shrink-0" />
          <span>
            <strong>{pendingCount} user{pendingCount > 1 ? 's' : ''}</strong> pending approval — set their status to <em>Active</em> to grant access.
          </span>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, department…"
              className="input-field pl-9 text-sm py-2"
            />
          </div>

          {/* Role filter */}
          <div className="flex items-center gap-2">
            <HiOutlineFilter className="w-4 h-4 text-surface-400 flex-shrink-0" />
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}
              className="input-field text-sm py-2 w-36">
              <option value="">All Roles</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          {/* Status filter */}
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="input-field text-sm py-2 w-40">
            <option value="">All Statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          {(filterRole || filterStatus || search) && (
            <button onClick={() => { setFilterRole(''); setFilterStatus(''); setSearch(''); }}
              className="btn-ghost text-sm px-3 py-2 text-surface-400 hover:text-red-500">
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <svg className="animate-spin h-8 w-8 text-primary-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            <p className="text-sm text-surface-400">Loading users…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <HiOutlineSearch className="w-10 h-10 text-surface-200" />
            <p className="text-surface-400 text-sm">No users match your filters.</p>
          </div>
        ) : (
          <table className="min-w-full">
            <thead>
              <tr>
                <th className="th">User</th>
                <th className="th">Department</th>
                <th className="th">Role</th>
                <th className="th">Status</th>
                <th className="th">Registered</th>
                <th className="th text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.uid} className="tr">
                  {/* User */}
                  <td className="td">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary-600 text-xs font-bold">
                          {(user.name?.[0] || '?').toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-surface-800 text-sm">{user.name}</p>
                        <p className="text-xs text-surface-400">{user.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Department */}
                  <td className="td text-surface-500">{user.department}</td>

                  {/* Role */}
                  <td className="td">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.uid, e.target.value)}
                      className={`badge ${roleBadgeClass(user.role)} cursor-pointer border-0 bg-transparent font-semibold text-xs py-1 px-2.5 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-300`}
                    >
                      {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>

                  {/* Status */}
                  <td className="td">
                    <span className={
                      user.status === 'Active'      ? 'badge-active' :
                      user.status === 'Inactive'    ? 'badge-inactive' :
                                                      'badge-deactivated'
                    }>
                      {user.status === 'Active'   && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 inline-block" />}
                      {user.status === 'Inactive' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1 inline-block" />}
                      {user.status}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="td text-surface-400">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>

                  {/* Actions */}
                  <td className="td">
                    <div className="flex justify-end items-center gap-1.5">
                      {user.status !== 'Active' && (
                        <button
                          onClick={() => handleStatusChange(user.uid, 'Active')}
                          className="btn btn-sm bg-emerald-50 text-emerald-700 hover:bg-emerald-100 ring-1 ring-emerald-200"
                          title="Activate"
                        >
                          <HiOutlineCheck className="w-3.5 h-3.5" />
                          Activate
                        </button>
                      )}
                      {user.status !== 'Deactivated' && (
                        <button
                          onClick={() => handleStatusChange(user.uid, 'Deactivated')}
                          className="btn btn-sm bg-amber-50 text-amber-700 hover:bg-amber-100 ring-1 ring-amber-200"
                          title="Deactivate"
                        >
                          <HiOutlineBan className="w-3.5 h-3.5" />
                          Deactivate
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(user.uid, user.name)}
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

        {/* Footer row */}
        {!loading && filtered.length > 0 && (
          <div className="px-5 py-3 bg-surface-50 border-t border-surface-200 flex items-center justify-between">
            <p className="text-xs text-surface-400">
              Showing <strong className="text-surface-600">{filtered.length}</strong> of <strong className="text-surface-600">{totalUsers}</strong> users
            </p>
            {search && (
              <p className="text-xs text-primary-500 font-medium">Filtered by: "{search}"</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
