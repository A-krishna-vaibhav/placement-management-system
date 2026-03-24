/**
 * Sidebar — persistent left-nav for authenticated pages
 */

import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineHome,
  HiOutlineUsers,
  HiOutlineX,
  HiOutlineAcademicCap,
} from 'react-icons/hi';

const allLinks = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: HiOutlineHome,
    roles: ['Student', 'Faculty', 'Company', 'Admin'],
  },
  {
    to: '/admin/users',
    label: 'Manage Users',
    icon: HiOutlineUsers,
    roles: ['Admin'],
  },
];

const Sidebar = ({ open, onClose }) => {
  const { userProfile } = useAuth();
  const location = useLocation();

  const visibleLinks = allLinks.filter(
    (l) => !l.roles || l.roles.includes(userProfile?.role)
  );

  return (
    <aside
      className={`
        sidebar transform
        ${open ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}
    >
      {/* Brand */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-white/5 flex-shrink-0">
        <Link to="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center shadow-glow">
            <HiOutlineAcademicCap className="w-5 h-5 text-white" />
          </div>
          <div className="leading-tight">
            <p className="text-white font-bold text-sm">PMS</p>
            <p className="text-surface-400 text-xs">University of Hyderabad</p>
          </div>
        </Link>
        <button
          onClick={onClose}
          className="md:hidden text-surface-400 hover:text-white transition-colors"
        >
          <HiOutlineX className="w-5 h-5" />
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-surface-500 uppercase tracking-widest">
          Navigation
        </p>
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const active = location.pathname === link.to ||
                         location.pathname.startsWith(link.to + '/');
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={`sidebar-link ${active ? 'active' : ''}`}
            >
              <Icon className="w-4.5 h-4.5 flex-shrink-0" style={{ width: 18, height: 18 }} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User chip at bottom */}
      {userProfile && (
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-primary-300 text-sm font-bold">
                {(userProfile.name?.[0] || '?').toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{userProfile.name}</p>
              <p className="text-surface-400 text-xs truncate">{userProfile.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
