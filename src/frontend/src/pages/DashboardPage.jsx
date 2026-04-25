import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { statsAPI } from '../services/api';
import {
  HiOutlineAcademicCap, HiOutlineOfficeBuilding, HiOutlineUserGroup,
  HiOutlineShieldCheck, HiOutlineBriefcase, HiOutlineChartBar,
  HiOutlineCalendar, HiOutlineClipboardList, HiOutlineArrowRight,
} from 'react-icons/hi';
import { Badge } from '../components/ui';

const roleConfig = {
  STUDENT: {
    icon: HiOutlineAcademicCap,
    gradient: 'from-maroon-600 to-maroon-500',
    bg: 'bg-maroon-50', text: 'text-maroon-700', ring: 'ring-maroon-200',
    tagline: 'Your placement journey starts here',
    statsKeys: [
      { key: 'openJobs',     label: 'Open Jobs',     icon: HiOutlineBriefcase },
      { key: 'applications', label: 'Applications',  icon: HiOutlineClipboardList },
      { key: 'interviews',   label: 'Interviews',    icon: HiOutlineCalendar },
    ],
    message: 'Browse eligible job listings, track your applications, and manage interview schedules — all from your dashboard.',
  },
  FACULTY: {
    icon: HiOutlineUserGroup,
    gradient: 'from-emerald-600 to-teal-500',
    bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200',
    tagline: 'Placement cell management hub',
    statsKeys: [
      { key: 'students',  label: 'Dept Students', icon: HiOutlineAcademicCap },
      { key: 'placed',    label: 'Students Placed', icon: HiOutlineChartBar },
      { key: 'activeJobs', label: 'Active Jobs',   icon: HiOutlineBriefcase },
    ],
    message: 'View department placement stats and coordinate with company recruiters.',
  },
  TPO: {
    icon: HiOutlineUserGroup,
    gradient: 'from-gold-600 to-gold-500',
    bg: 'bg-gold-50', text: 'text-gold-700', ring: 'ring-gold-200',
    tagline: 'Training & Placement Office',
    statsKeys: [
      { key: 'totalPlaced', label: 'Total Placed',  icon: HiOutlineAcademicCap },
      { key: 'activeJobs',  label: 'Active Jobs',   icon: HiOutlineBriefcase },
      { key: 'companies',   label: 'Companies',     icon: HiOutlineOfficeBuilding },
    ],
    message: 'Manage the full placement cycle — approve companies, coordinate drives, and publish reports.',
  },
  COMPANY: {
    icon: HiOutlineOfficeBuilding,
    gradient: 'from-violet-600 to-purple-500',
    bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200',
    tagline: 'Recruiter portal',
    statsKeys: [
      { key: 'activeJDs',  label: 'Active JDs',   icon: HiOutlineClipboardList },
      { key: 'applicants', label: 'Applicants',   icon: HiOutlineAcademicCap },
      { key: 'offersMade', label: 'Offers Made',  icon: HiOutlineBriefcase },
    ],
    message: 'Post job descriptions, shortlist applicants, and manage your interview pipeline.',
  },
  ADMIN: {
    icon: HiOutlineShieldCheck,
    gradient: 'from-maroon-800 to-maroon-600',
    bg: 'bg-maroon-50', text: 'text-maroon-700', ring: 'ring-maroon-200',
    tagline: 'System administration',
    statsKeys: [
      { key: 'totalUsers',  label: 'Active Users', icon: HiOutlineUserGroup },
      { key: 'activeJobs',  label: 'Active Jobs',  icon: HiOutlineBriefcase },
      { key: 'totalPlaced', label: 'Total Placed', icon: HiOutlineChartBar },
    ],
    message: 'Manage users, approve registrations, assign roles, and oversee the entire placement system.',
  },
};

const profileFields = [
  { key: 'fullName', label: 'Full Name' },
  { key: 'email',    label: 'Email' },
  { key: 'role',     label: 'Role' },
];

const statusVariant = (s) => {
  switch (s) {
    case 'ACTIVE':           return 'success';
    case 'UNVERIFIED':       return 'warning';
    case 'PENDING_APPROVAL': return 'warning';
    case 'SUSPENDED':        return 'danger';
    case 'DEACTIVATED':      return 'neutral';
    default:                 return 'neutral';
  }
};

const quickLinks = {
  STUDENT: [
    { to: '/jobs',         label: 'Browse Jobs',        desc: 'Find eligible positions' },
    { to: '/applications', label: 'My Applications',    desc: 'Track application status' },
    { to: '/profile',      label: 'Complete Profile',   desc: 'Required before applying' },
  ],
  COMPANY: [
    { to: '/company/jobs', label: 'My Job Posts',       desc: 'Manage your postings' },
    { to: '/company/profile', label: 'Company Profile', desc: 'Update company details' },
  ],
  TPO: [
    { to: '/tpo/jobs',      label: 'Manage Jobs',       desc: 'Approve or reject postings' },
    { to: '/tpo/companies', label: 'Pending Companies', desc: 'Approve new recruiters' },
  ],
  ADMIN: [
    { to: '/admin/users',   label: 'Manage Users',      desc: 'Roles, status, provisioning' },
    { to: '/tpo/jobs',      label: 'Manage Jobs',       desc: 'Approve or reject postings' },
    { to: '/tpo/companies', label: 'Pending Companies', desc: 'Approve new recruiters' },
  ],
  FACULTY: [
    { to: '/faculty/students', label: 'Department Students', desc: 'View placement progress' },
  ],
};

const DashboardPage = () => {
  const { userProfile, getToken } = useAuth();
  const [stats, setStats]   = useState({});
  const [loading, setLoading] = useState(true);

  const config = roleConfig[userProfile?.role] || roleConfig.STUDENT;
  const Icon   = config.icon;

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await statsAPI.get(token);
        setStats(res.data || {});
      } catch {
        // silently fall back to dashes
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  return (
    <div className="space-y-6 animate-slide-up">
      {/* Hero Welcome Card */}
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${config.gradient} p-6 text-white shadow-lifted`}>
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-white/70 text-sm font-medium mb-1">{config.tagline}</p>
            <h1 className="font-display text-2xl sm:text-3xl font-semibold leading-tight">
              Hello, {userProfile?.fullName?.split(' ')[0] || 'User'}
            </h1>
          </div>
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0 backdrop-blur-sm">
            <Icon className="w-7 h-7 text-white" />
          </div>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-3">
          {config.statsKeys.map((s) => {
            const SI = s.icon;
            const val = loading ? '…' : (stats[s.key] ?? '—');
            return (
              <div key={s.key} className="bg-white/15 backdrop-blur-sm rounded-xl p-3 text-center">
                <SI className="w-4 h-4 mx-auto mb-1 text-white/80" />
                <p className="text-white font-bold text-lg">{val}</p>
                <p className="text-white/65 text-xs">{s.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile card */}
        <div className="card p-6 lg:col-span-1 space-y-4">
          <h2 className="text-base font-semibold text-ink-800 flex items-center gap-2">
            <span className={`w-6 h-6 ${config.bg} ${config.text} rounded-lg flex items-center justify-center ring-1 ${config.ring}`}>
              <Icon className="w-3.5 h-3.5" />
            </span>
            Your Profile
          </h2>

          <div className="space-y-3">
            {profileFields.map(({ key, label }) => (
              <div key={key} className="flex justify-between items-center py-2 border-b border-ink-100 last:border-0">
                <span className="text-xs font-medium text-ink-400 uppercase tracking-wide">{label}</span>
                {key === 'role' ? (
                  <Badge variant="maroon">{userProfile?.[key] || '—'}</Badge>
                ) : key === 'email' ? (
                  <span className="text-sm text-ink-600 font-mono truncate max-w-[160px]" title={userProfile?.[key]}>
                    {userProfile?.[key] || '—'}
                  </span>
                ) : (
                  <span className="text-sm font-medium text-ink-700">{userProfile?.[key] || '—'}</span>
                )}
              </div>
            ))}
            <div className="flex justify-between items-center pt-1">
              <span className="text-xs font-medium text-ink-400 uppercase tracking-wide">Status</span>
              <Badge variant={statusVariant(userProfile?.status)}>
                {userProfile?.status?.replace('_', ' ') || '—'}
              </Badge>
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-3 lg:col-span-2">
          {(quickLinks[userProfile?.role] || []).map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="card p-5 flex items-center justify-between gap-4 group hover:shadow-lifted transition-shadow cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center ring-1 ${config.ring}`}>
                  <HiOutlineArrowRight className={`w-5 h-5 ${config.text}`} />
                </div>
                <div>
                  <p className="font-semibold text-ink-800 text-sm">{link.label}</p>
                  <p className="text-xs text-ink-400">{link.desc}</p>
                </div>
              </div>
              <HiOutlineArrowRight className="w-5 h-5 text-ink-300 group-hover:text-maroon-600 transition-colors flex-shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
