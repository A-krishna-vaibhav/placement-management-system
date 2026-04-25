import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineHome, HiOutlineUsers, HiOutlineX,
  HiOutlineUser, HiOutlineBriefcase, HiOutlineClipboardList,
  HiOutlineOfficeBuilding, HiOutlineDocumentText,
} from 'react-icons/hi';
import { Logo } from './ui';

const allLinks = [
  {
    to: '/dashboard',
    label: 'Dashboard',
    icon: HiOutlineHome,
    roles: ['STUDENT', 'FACULTY', 'TPO', 'COMPANY', 'ADMIN'],
  },
  // Student
  {
    to: '/profile',
    label: 'My Profile',
    icon: HiOutlineUser,
    roles: ['STUDENT'],
  },
  {
    to: '/jobs',
    label: 'Job Listings',
    icon: HiOutlineBriefcase,
    roles: ['STUDENT'],
  },
  {
    to: '/applications',
    label: 'My Applications',
    icon: HiOutlineClipboardList,
    roles: ['STUDENT'],
  },
  // Company
  {
    to: '/company/jobs',
    label: 'My Job Posts',
    icon: HiOutlineDocumentText,
    roles: ['COMPANY'],
  },
  {
    to: '/company/profile',
    label: 'Company Profile',
    icon: HiOutlineOfficeBuilding,
    roles: ['COMPANY'],
  },
  // Faculty
  {
    to: '/faculty/students',
    label: 'Department Students',
    icon: HiOutlineBriefcase,
    roles: ['FACULTY'],
  },
  // TPO + Admin
  {
    to: '/tpo/jobs',
    label: 'Manage Jobs',
    icon: HiOutlineBriefcase,
    roles: ['TPO', 'ADMIN'],
  },
  {
    to: '/tpo/companies',
    label: 'Pending Companies',
    icon: HiOutlineOfficeBuilding,
    roles: ['TPO', 'ADMIN'],
  },
  // Admin
  {
    to: '/admin/users',
    label: 'Manage Users',
    icon: HiOutlineUsers,
    roles: ['ADMIN'],
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
      className={`sidebar transform ${open ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
    >
      {/* Brand */}
      <div className="flex items-center justify-between h-16 px-5 border-b border-white/5 flex-shrink-0">
        <Link to="/dashboard" onClick={onClose}>
          <Logo variant="full" size="sm" theme="light" />
        </Link>
        <button
          onClick={onClose}
          className="md:hidden text-ink-400 hover:text-white transition-colors"
        >
          <HiOutlineX className="w-5 h-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 mb-2 text-xs font-semibold text-ink-500 uppercase tracking-widest">
          Navigation
        </p>
        {visibleLinks.map((link) => {
          const Icon = link.icon;
          const active = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={onClose}
              className={`sidebar-link ${active ? 'active' : ''}`}
            >
              <Icon style={{ width: 18, height: 18 }} className="flex-shrink-0" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* User chip */}
      {userProfile && (
        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-maroon-600/30 flex items-center justify-center flex-shrink-0">
              <span className="text-gold-300 text-sm font-bold">
                {(userProfile.fullName?.[0] || '?').toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-white text-xs font-semibold truncate">{userProfile.fullName}</p>
              <p className="text-ink-400 text-xs truncate">{userProfile.role}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
