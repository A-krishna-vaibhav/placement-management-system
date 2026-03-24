/**
 * Navbar — slim top bar (mobile hamburger + user menu)
 */

import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  HiOutlineLogout,
  HiOutlineMenu,
  HiOutlineBell,
} from 'react-icons/hi';
import toast from 'react-hot-toast';

const Navbar = ({ onMenuClick }) => {
  const { currentUser, userProfile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Signed out. See you soon!');
      navigate('/login');
    } catch {
      toast.error('Failed to sign out.');
    }
  };

  if (!currentUser) return null;

  const initials = (userProfile?.name || currentUser.email || '?')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <header className="sticky top-0 z-10 h-16 bg-white/80 backdrop-blur-sm border-b border-surface-200 flex items-center px-4 sm:px-6 lg:px-8 gap-4">
      {/* Hamburger (mobile) */}
      <button
        onClick={onMenuClick}
        className="md:hidden btn-ghost p-2 -ml-2"
        aria-label="Open menu"
      >
        <HiOutlineMenu className="w-5 h-5" />
      </button>

      {/* Page title area — spacer */}
      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Bell (placeholder) */}
        <button className="btn-ghost p-2 relative" aria-label="Notifications">
          <HiOutlineBell className="w-5 h-5 text-surface-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-500 rounded-full ring-2 ring-white" />
        </button>

        {/* Avatar + name */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-surface-200">
          <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center shadow-sm">
            <span className="text-white text-xs font-bold">{initials}</span>
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-sm font-semibold text-surface-800 max-w-[120px] truncate">
              {userProfile?.name || currentUser.email}
            </p>
            <p className="text-xs text-surface-400">{userProfile?.role || 'User'}</p>
          </div>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="btn-ghost p-2 text-surface-400 hover:text-red-500"
          aria-label="Sign out"
          title="Sign out"
        >
          <HiOutlineLogout className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default Navbar;
