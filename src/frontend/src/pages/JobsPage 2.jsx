import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { jobAPI, applicationAPI, declarationAPI } from '../services/api';
import { Badge, PageHeader, Button } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineBriefcase, HiOutlineLocationMarker, HiOutlineSearch,
  HiOutlineOfficeBuilding, HiOutlineShieldCheck, HiOutlineExclamation,
} from 'react-icons/hi';

const JOB_TYPE_LABELS = { INTERNSHIP: 'Internship', FULL_TIME: 'Full-Time', PART_TIME: 'Part-Time' };

const JobCard = ({ job, applied, onApply, applying }) => (
  <div className="card p-5 space-y-3 hover:shadow-lifted transition-shadow">
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-maroon-50 rounded-xl flex items-center justify-center flex-shrink-0 ring-1 ring-maroon-200">
          <HiOutlineOfficeBuilding className="w-5 h-5 text-maroon-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-ink-800 text-sm truncate">{job.title}</h3>
          <p className="text-xs text-ink-500 truncate">{job.companyName}</p>
        </div>
      </div>
      {job.jobType && (
        <Badge variant="maroon" className="flex-shrink-0">{JOB_TYPE_LABELS[job.jobType] || job.jobType}</Badge>
      )}
    </div>

    {job.location && (
      <p className="text-xs text-ink-400 flex items-center gap-1">
        <HiOutlineLocationMarker className="w-3.5 h-3.5" /> {job.location}
      </p>
    )}

    <p className="text-sm text-ink-600 line-clamp-2">{job.description}</p>

    <div className="flex flex-wrap gap-3 text-xs text-ink-500">
      {job.ctc && <span>CTC: {job.ctc}</span>}
      {job.stipend && <span>Stipend: {job.stipend}</span>}
      {job.openings && <span>Openings: {job.openings}</span>}
    </div>

    {job.eligibility && Object.keys(job.eligibility).length > 0 && (
      <div className="text-xs text-ink-400 bg-cream-50 rounded-lg px-3 py-2 space-y-0.5">
        {job.eligibility.minCgpa != null && <p>Min CGPA: {job.eligibility.minCgpa}</p>}
        {job.eligibility.maxBacklogs != null && <p>Max backlogs: {job.eligibility.maxBacklogs}</p>}
        {job.eligibility.allowedBranches?.length > 0 && (
          <p>Branches: {job.eligibility.allowedBranches.join(', ')}</p>
        )}
      </div>
    )}

    <div className="flex items-center justify-between pt-1 gap-2">
      <p className="text-xs text-ink-400">{new Date(job.createdAt).toLocaleDateString()}</p>
      <div className="flex items-center gap-2">
        <Link to={`/jobs/${job.id}`} className="text-xs text-maroon-600 hover:underline">Details</Link>
        {applied ? (
          <Badge variant="success">Applied</Badge>
        ) : (
          <Button
            size="sm"
            onClick={() => onApply(job.id)}
            loading={applying === job.id}
            disabled={!!applying}
          >
            Apply
          </Button>
        )}
      </div>
    </div>
  </div>
);

const JobsPage = () => {
  const { getToken } = useAuth();
  const [jobs, setJobs]           = useState([]);
  const [appliedIds, setAppliedIds] = useState(new Set());
  const [hasSigned, setHasSigned]   = useState(false);
  const [loading, setLoading]       = useState(true);
  const [applying, setApplying]     = useState(null);
  const [search, setSearch]         = useState('');

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        const [jobsRes, appsRes, declRes] = await Promise.all([
          jobAPI.list(token),
          applicationAPI.listMine(token),
          declarationAPI.getMySigned(token).catch(() => ({ data: [] })),
        ]);
        setJobs(jobsRes.data || []);
        setAppliedIds(new Set((appsRes.data || []).map((a) => a.jobId)));
        setHasSigned(Array.isArray(declRes.data) && declRes.data.length > 0);
      } catch (e) {
        toast.error(e.message || 'Failed to load jobs.');
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  const handleApply = async (jobId) => {
    if (!hasSigned) {
      toast.error('Please sign the PGAB Self-Declaration first (go to My Profile).');
      return;
    }
    setApplying(jobId);
    try {
      const token = await getToken();
      await applicationAPI.apply(token, jobId, {});
      setAppliedIds((prev) => new Set([...prev, jobId]));
      toast.success('Application submitted!');
    } catch (e) {
      toast.error(e.message || 'Failed to apply.');
    } finally {
      setApplying(null);
    }
  };

  const filtered = jobs.filter(
    (j) =>
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.companyName.toLowerCase().includes(search.toLowerCase())
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
      <PageHeader title="Job Listings" subtitle="Browse and apply for eligible positions" />

      {!hasSigned && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <HiOutlineExclamation className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            Sign the PGAB Self-Declaration on your{' '}
            <Link to="/profile" className="underline font-medium">profile page</Link>{' '}
            before you can apply.
          </p>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
        <input
          type="text"
          placeholder="Search by title or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-ink-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-maroon-500 bg-white"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center space-y-3">
          <HiOutlineBriefcase className="w-10 h-10 text-ink-300 mx-auto" />
          <p className="text-ink-500">No jobs found{search ? ' matching your search' : ''}.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              applied={appliedIds.has(job.id)}
              onApply={handleApply}
              applying={applying}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobsPage;
