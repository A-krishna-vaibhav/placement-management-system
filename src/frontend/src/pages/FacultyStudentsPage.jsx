import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PageHeader, Badge } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineAcademicCap, HiOutlineSearch, HiOutlineCheckCircle, HiOutlineX,
} from 'react-icons/hi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

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

const FacultyStudentsPage = () => {
  const { getToken } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [expanded, setExpanded] = useState(null);
  const [apps, setApps]         = useState({});
  const [loadingApps, setLoadingApps] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${API_URL}/faculty/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setStudents(data.data || []);
      } catch (e) {
        toast.error(e.message || 'Failed to load students.');
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  const loadApps = async (studentId) => {
    if (apps[studentId]) { setExpanded(expanded === studentId ? null : studentId); return; }
    setLoadingApps(studentId);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/faculty/students/${studentId}/applications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setApps((prev) => ({ ...prev, [studentId]: data.data || [] }));
      setExpanded(studentId);
    } catch (e) {
      toast.error(e.message || 'Failed to load applications.');
    } finally {
      setLoadingApps(null);
    }
  };

  const filtered = students.filter(
    (s) =>
      s.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.rollNumber?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader title="Department Students" subtitle="View placement progress of students in your school" />

      {/* Search */}
      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          type="text"
          placeholder="Search by name, email or roll number…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-ink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 bg-white"
        />
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3 text-sm">
        <div className="bg-white border border-ink-200 rounded-xl px-4 py-2">
          <span className="font-semibold text-ink-800">{students.length}</span>
          <span className="text-ink-500 ml-1">Total students</span>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2">
          <span className="font-semibold text-green-700">{students.filter((s) => s.profileComplete).length}</span>
          <span className="text-green-600 ml-1">Profiles complete</span>
        </div>
        <div className="bg-maroon-50 border border-maroon-200 rounded-xl px-4 py-2">
          <span className="font-semibold text-maroon-700">{students.filter((s) => s.hasSigned).length}</span>
          <span className="text-maroon-600 ml-1">Declaration signed</span>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineAcademicCap className="w-10 h-10 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No students found{search ? ' matching your search' : ''}.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div key={s.uid} className="card overflow-hidden">
              <button
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-cream-50 transition-colors"
                onClick={() => loadApps(s.uid)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 bg-maroon-50 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-maroon-200">
                    <span className="text-maroon-700 text-sm font-bold">{(s.fullName?.[0] || '?').toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink-800 text-sm truncate">{s.fullName}</p>
                    <p className="text-xs text-ink-500 truncate">{s.email} {s.rollNumber ? `· ${s.rollNumber}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {s.hasSigned && <HiOutlineCheckCircle className="w-4 h-4 text-green-500" title="Declaration signed" />}
                  {s.profileComplete && <Badge variant="success">Profile ✓</Badge>}
                  {!s.profileComplete && <Badge variant="neutral">Incomplete</Badge>}
                  {loadingApps === s.uid
                    ? <div className="w-4 h-4 border-2 border-maroon-500 border-t-transparent rounded-full animate-spin" />
                    : <HiOutlineX className={`w-4 h-4 text-ink-300 transition-transform ${expanded === s.uid ? 'rotate-45' : 'rotate-0'}`} />
                  }
                </div>
              </button>

              {expanded === s.uid && (
                <div className="border-t border-ink-100 px-5 pb-5 pt-3 bg-cream-50">
                  <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-3">Applications</p>
                  {(apps[s.uid] || []).length === 0 ? (
                    <p className="text-sm text-ink-400">No applications yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {(apps[s.uid] || []).map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-sm">
                          <div>
                            <span className="font-medium text-ink-700">{a.jobTitle}</span>
                            <span className="text-ink-400 ml-2 text-xs">{a.companyName}</span>
                          </div>
                          <Badge variant={STATUS_VARIANT[a.status] || 'neutral'}>
                            {a.status?.replace('_', ' ')}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FacultyStudentsPage;
