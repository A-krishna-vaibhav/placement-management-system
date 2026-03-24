/**
 * Dashboard Page
 */

import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import {
  HiOutlineAcademicCap, HiOutlineOfficeBuilding, HiOutlineUserGroup,
  HiOutlineShieldCheck, HiOutlineBriefcase, HiOutlineChartBar,
  HiOutlineCalendar, HiOutlineClipboardList, HiOutlineArrowRight,
} from 'react-icons/hi';

const roleConfig = {
  Student: {
    icon: HiOutlineAcademicCap,
    gradient: 'from-blue-500 to-cyan-400',
    bg: 'bg-blue-50',
    text: 'text-blue-600',
    ring: 'ring-blue-200',
    tagline: 'Your placement journey starts here',
    stats: [
      { label: 'Eligible Drives', value: '—', icon: HiOutlineBriefcase },
      { label: 'Applications', value: '—', icon: HiOutlineClipboardList },
      { label: 'Interviews', value: '—', icon: HiOutlineCalendar },
    ],
    message: 'Browse eligible job listings, track your applications, and manage interview schedules — all from your dashboard.',
  },
  Faculty: {
    icon: HiOutlineUserGroup,
    gradient: 'from-emerald-500 to-teal-400',
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    ring: 'ring-emerald-200',
    tagline: 'Placement cell management hub',
    stats: [
      { label: 'Students Placed', value: '—', icon: HiOutlineAcademicCap },
      { label: 'Active Drives', value: '—', icon: HiOutlineBriefcase },
      { label: 'Reports', value: '—', icon: HiOutlineChartBar },
    ],
    message: 'View department placement stats, endorse students, and coordinate with company recruiters.',
  },
  Company: {
    icon: HiOutlineOfficeBuilding,
    gradient: 'from-violet-500 to-purple-400',
    bg: 'bg-violet-50',
    text: 'text-violet-600',
    ring: 'ring-violet-200',
    tagline: 'Recruiter portal',
    stats: [
      { label: 'Active JDs', value: '—', icon: HiOutlineClipboardList },
      { label: 'Applicants', value: '—', icon: HiOutlineAcademicCap },
      { label: 'Offers Made', value: '—', icon: HiOutlineBriefcase },
    ],
    message: 'Post job descriptions, shortlist applicants, and manage your interview pipeline.',
  },
  Admin: {
    icon: HiOutlineShieldCheck,
    gradient: 'from-rose-500 to-pink-400',
    bg: 'bg-rose-50',
    text: 'text-rose-600',
    ring: 'ring-rose-200',
    tagline: 'System administration',
    stats: [
      { label: 'Total Users', value: '—', icon: HiOutlineUserGroup },
      { label: 'Active Drives', value: '—', icon: HiOutlineBriefcase },
      { label: 'Placements', value: '—', icon: HiOutlineChartBar },
    ],
    message: 'Manage users, approve registrations, assign roles, and oversee the entire placement system.',
  },
};

const profileFields = [
  { key: 'name',       label: 'Full Name' },
  { key: 'email',      label: 'Email' },
  { key: 'role',       label: 'Role' },
  { key: 'department', label: 'Department' },
];

const DashboardPage = () => {
  const { userProfile } = useAuth();
  const config = roleConfig[userProfile?.role] || roleConfig.Student;
  const Icon   = config.icon;

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Hero Welcome Card */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-6 text-white shadow-card-lg`}>
        <div className="absolute inset-0 bg-hero-pattern opacity-20" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">{config.tagline}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">
              Hello, {userProfile?.name?.split(' ')[0] || 'User'} 👋
            </h1>
            <p className="text-white/75 text-sm mt-1.5">{userProfile?.department}</p>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>

        {/* Mini stats */}
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {config.stats.map((s) => {
            const SI = s.icon;
            return (
              <div key={s.label} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
                <SI className="w-4 h-4 mx-auto mb-1 text-white/80" />
                <p className="text-white font-bold text-lg">{s.value}</p>
                <p className="text-white/65 text-xs">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="card lg:col-span-1 space-y-4">
          <h2 className="text-base font-semibold text-surface-800 flex items-center gap-2">
            <span className={`w-6 h-6 ${config.bg} ${config.text} rounded-lg flex items-center justify-center ring-1 ${config.ring}`}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            Your Profile
          </h2>

          <div className="space-y-3">
            {profileFields.map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-surface-100 last:border-0">
                <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">{label}</span>
                {key === 'role' ? (
                  <span className="badge-role">{userProfile?.[key] || '—'}</span>
                ) : key === 'email' ? (
                  <span className="text-sm text-surface-600 font-mono truncate max-w-[160px]" title={userProfile?.[key]}>
                    {userProfile?.[key] || '—'}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-surface-700">{userProfile?.[key] || '—'}</span>
                )}
              </div>
            ))}
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-medium text-surface-400 uppercase tracking-wide">Status</span>
              <span className={
                userProfile?.status === 'Active'      ? 'badge-active' :
                userProfile?.status === 'Inactive'    ? 'badge-inactive' :
                                                        'badge-deactivated'
              }>{userProfile?.status || '—'}</span>
            </div>
          </div>
        </div>

        {/* Info + quick actions */}
        <div className="space-y-4 lg:col-span-2">
          {/* Coming soon card */}
          <div className="card">
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ${config.ring}`}>
                <HiOutlineBriefcase className={`w-5 h-5 ${config.text}`} />
              </div>
              <div>
                <h3 className="font-semibold text-surface-800 text-sm">What's coming in your dashboard</h3>
                <p className="text-surface-500 text-sm mt-1 leading-relaxed">{config.message}</p>
                <p className="text-xs text-surface-400 mt-3 bg-surface-50 px-3 py-1.5 rounded-lg inline-block">
                  🚧 Full features available in Sprint 2 (Profiles & Job Postings)
                </p>
              </div>
            </div>
          </div>

          {/* Admin quick action */}
          {userProfile?.role === 'Admin' && (
            <Link to="/admin/users" className="card card-hover flex items-center justify-between gap-4 group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center ring-1 ring-rose-200">
                  <HiOutlineShieldCheck className="w-5 h-5 text-rose-600" />
                </div>
                <div>
                  <p className="font-semibold text-surface-800 text-sm">Manage Users</p>
                  <p className="text-xs text-surface-400">Approve registrations, update roles & status</p>
                </div>
              </div>
              <HiOutlineArrowRight className="w-5 h-5 text-surface-300 group-hover:text-primary-500 transition-colors flex-shrink-0" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
