import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { examAPI } from '../services/api';
import { Badge, PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar, HiOutlineGlobeAlt, HiOutlineOfficeBuilding,
  HiOutlineClock,
} from 'react-icons/hi';

function fmtSlot(slot) {
  if (!slot) return '—';
  try {
    return new Date(`${slot.date}T${slot.startTime}:00+05:30`)
      .toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      + ' at ' + slot.startTime + ' IST';
  } catch { return `${slot.date} ${slot.startTime}`; }
}

function getCountdown(slot) {
  if (!slot?.date || !slot?.startTime) return null;
  try {
    const examDt = new Date(`${slot.date}T${slot.startTime}:00+05:30`);
    const diff   = examDt - Date.now();
    if (diff <= 0) return { label: 'Exam has started / passed', urgent: false, past: true };
    const days  = Math.floor(diff / (86400 * 1000));
    const hours = Math.floor((diff % (86400 * 1000)) / (3600 * 1000));
    const mins  = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
    const urgent = diff < 24 * 3600 * 1000;
    let label;
    if (days > 0)   label = `${days}d ${hours}h remaining`;
    else if (hours > 0) label = `${hours}h ${mins}m remaining`;
    else            label = `${mins}m remaining`;
    return { label, urgent, past: false };
  } catch { return null; }
}

/* ─── Countdown badge (live update every minute) ─── */
const Countdown = ({ slot }) => {
  const [cd, setCd] = useState(() => getCountdown(slot));

  useEffect(() => {
    const iv = setInterval(() => setCd(getCountdown(slot)), 60 * 1000);
    return () => clearInterval(iv);
  }, [slot]);

  if (!cd) return null;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full
      ${cd.past    ? 'bg-ink-100 text-ink-500'    : ''}
      ${cd.urgent && !cd.past ? 'bg-red-100 text-red-700 animate-pulse' : ''}
      ${!cd.urgent && !cd.past ? 'bg-blue-50 text-blue-700' : ''}`}>
      <HiOutlineClock className="w-3.5 h-3.5" />
      {cd.label}
    </span>
  );
};

/* ─── Single exam card ─── */
const ExamCard = ({ exam }) => {
  const isOnline  = exam.mode === 'ONLINE';
  const hasLink   = !!exam.examLink;
  const hasVenue  = !!exam.venue;
  const cd        = getCountdown(exam.confirmedSlot);

  return (
    <div className={`card p-5 space-y-4 ${cd && !cd.past && cd.urgent ? 'border-l-4 border-l-red-400' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-ink-800 truncate">{exam.jobTitle}</h3>
            <Badge variant={isOnline ? 'maroon' : 'neutral'}>
              {isOnline
                ? <><HiOutlineGlobeAlt className="inline w-3 h-3 mr-0.5" />Online</>
                : <><HiOutlineOfficeBuilding className="inline w-3 h-3 mr-0.5" />Offline</>}
            </Badge>
          </div>
          <p className="text-sm text-ink-500 mt-0.5">{exam.companyName}</p>
        </div>
        <Countdown slot={exam.confirmedSlot} />
      </div>

      {/* Date/time */}
      <div className="bg-cream-50 border border-ink-100 rounded-xl px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-medium text-ink-800">
          <HiOutlineCalendar className="w-4 h-4 text-maroon-600 flex-shrink-0" />
          {fmtSlot(exam.confirmedSlot)}
        </p>
      </div>

      {/* Online: exam link */}
      {isOnline && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Exam Link</p>
          {hasLink ? (
            <a
              href={exam.examLink}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-maroon-600 hover:text-maroon-800 underline font-medium break-all"
            >
              <HiOutlineGlobeAlt className="w-4 h-4 flex-shrink-0" />
              {exam.examLink}
            </a>
          ) : (
            <p className="text-sm text-ink-400 italic">Link not yet provided — check back closer to the exam date.</p>
          )}
        </div>
      )}

      {/* Offline: venue */}
      {!isOnline && (
        <div className="space-y-1">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Venue</p>
          {hasVenue ? (
            <div>
              <p className="text-sm font-medium text-ink-700 flex items-center gap-1.5">
                <HiOutlineOfficeBuilding className="w-4 h-4 text-ink-400 flex-shrink-0" />
                {exam.venue}
              </p>
              {exam.venueInstructions && (
                <p className="text-xs text-ink-500 mt-1 pl-5">{exam.venueInstructions}</p>
              )}
            </div>
          ) : (
            <p className="text-sm text-ink-400 italic">Venue will be announced by TPO.</p>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main page ─── */
const StudentExamsPage = () => {
  const { getToken }  = useAuth();
  const [exams, setExams]   = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = useCallback(async () => {
    try {
      const token = await getToken();
      const res   = await examAPI.myExams(token);
      setExams(res.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load your exams.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchExams(); }, [fetchExams]);

  const upcoming = exams.filter((e) => {
    if (!e.confirmedSlot?.date || !e.confirmedSlot?.startTime) return true;
    return new Date(`${e.confirmedSlot.date}T${e.confirmedSlot.startTime}:00+05:30`) >= Date.now();
  });
  const past = exams.filter((e) => {
    if (!e.confirmedSlot?.date || !e.confirmedSlot?.startTime) return false;
    return new Date(`${e.confirmedSlot.date}T${e.confirmedSlot.startTime}:00+05:30`) < Date.now();
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader
        title="My Exams"
        subtitle={exams.length === 0
          ? 'No exams scheduled yet'
          : `${upcoming.length} upcoming · ${past.length} past`}
      />

      {exams.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineCalendar className="w-10 h-10 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No exams scheduled for you yet.</p>
          <p className="text-xs text-ink-400 mt-1">Exams appear here once the company and TPO finalise a date after you are shortlisted.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-ink-500 uppercase tracking-wide">Upcoming</h2>
              {upcoming.map((ex) => <ExamCard key={ex.id} exam={ex} />)}
            </section>
          )}
          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-ink-500 uppercase tracking-wide">Past</h2>
              {past.map((ex) => (
                <div key={ex.id} className="opacity-60">
                  <ExamCard exam={ex} />
                </div>
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default StudentExamsPage;
