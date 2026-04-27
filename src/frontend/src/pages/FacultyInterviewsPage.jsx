import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { interviewAPI } from '../services/api';
import { Badge, PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar, HiOutlineClock, HiOutlineUsers,
  HiOutlineOfficeBuilding, HiOutlineX, HiOutlineCheck,
} from 'react-icons/hi';

const STATUS_LABEL = {
  REQUESTED:            'Pending Forward',
  FORWARDED_TO_FACULTY: 'Needs Confirmation',
  FACULTY_CONFIRMED:    'Confirmed',
  SCHEDULED:            'Scheduled',
  LIVE:                 'Live',
  COMPLETED:            'Completed',
  CANCELLED:            'Cancelled',
};
const STATUS_VARIANT = {
  REQUESTED:            'neutral',
  FORWARDED_TO_FACULTY: 'warning',
  FACULTY_CONFIRMED:    'maroon',
  SCHEDULED:            'success',
  LIVE:                 'success',
  COMPLETED:            'neutral',
  CANCELLED:            'danger',
};

/* ─── Confirm Modal ─── */
const ConfirmModal = ({ schedule, getToken, onDone, onClose }) => {
  const [note, setNote]           = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      const token = await getToken();
      await interviewAPI.facultyConfirm(token, schedule.id, { note });
      toast.success('Availability confirmed. TPO will schedule slots.');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to confirm.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h3 className="font-semibold text-ink-800">Confirm Availability</h3>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-ink-400" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="bg-cream-50 border border-ink-100 rounded-xl p-3 text-sm space-y-1">
            <p className="font-semibold text-ink-800">{schedule.jobTitle}</p>
            <p className="text-ink-500">{schedule.companyName}</p>
            <div className="flex items-center gap-3 text-ink-600 pt-1">
              <span className="flex items-center gap-1">
                <HiOutlineCalendar className="w-3.5 h-3.5" /> {schedule.interviewDate}
              </span>
              <span className="flex items-center gap-1">
                <HiOutlineClock className="w-3.5 h-3.5" /> {schedule.windowStart} – {schedule.windowEnd}
              </span>
            </div>
            <p className="text-xs text-ink-500">
              {schedule.duration} min per slot · {schedule.eligibleCount} eligible students
            </p>
          </div>

          <p className="text-sm text-ink-600">
            Confirm that you and your school&apos;s students are available on <strong>{schedule.interviewDate}</strong> from <strong>{schedule.windowStart}</strong> to <strong>{schedule.windowEnd}</strong>.
          </p>

          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Optional Note</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)}
              rows={2} placeholder="Any notes for the TPO…" className="input w-full resize-none" />
          </div>

          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-ink-200 text-ink-600 text-sm font-medium hover:bg-ink-50">
              Back
            </button>
            <button onClick={handleConfirm} disabled={submitting}
              className="flex-1 btn-primary text-sm disabled:opacity-50">
              {submitting ? 'Confirming…' : 'Confirm Availability'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─── Pending Card ─── */
const PendingCard = ({ schedule, onConfirm }) => (
  <div className="card p-5 border-l-4 border-l-amber-400 space-y-3">
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <p className="font-semibold text-ink-800 truncate">{schedule.jobTitle}</p>
        <p className="text-xs text-ink-500 truncate">{schedule.companyName}</p>
      </div>
      <Badge variant="warning">Needs Confirmation</Badge>
    </div>

    <div className="flex flex-wrap gap-3 text-xs text-ink-600">
      <span className="flex items-center gap-1">
        <HiOutlineCalendar className="w-3.5 h-3.5" /> {schedule.interviewDate}
      </span>
      <span className="flex items-center gap-1">
        <HiOutlineClock className="w-3.5 h-3.5" /> {schedule.windowStart} – {schedule.windowEnd}
      </span>
      <span className="flex items-center gap-1">
        <HiOutlineUsers className="w-3.5 h-3.5" /> {schedule.eligibleCount} students
      </span>
      <span>{schedule.duration} min · {schedule.totalSlots} slots</span>
    </div>

    <div className="flex gap-2">
      <span className="bg-ink-100 text-ink-600 text-[10px] px-2 py-0.5 rounded-full">{schedule.mode}</span>
      <span className="bg-ink-100 text-ink-600 text-[10px] px-2 py-0.5 rounded-full">
        {schedule.allocationMode?.replace('_', ' ')}
      </span>
    </div>

    {schedule.companyNotes && (
      <p className="text-xs text-ink-500 italic">Company note: {schedule.companyNotes}</p>
    )}

    <button onClick={() => onConfirm(schedule)}
      className="flex items-center gap-1.5 text-sm font-medium bg-maroon-600 hover:bg-maroon-700 text-white rounded-xl px-4 py-2 transition-colors">
      <HiOutlineCheck className="w-4 h-4" /> Confirm Availability
    </button>
  </div>
);

/* ─── Finalised Card ─── */
const FinalisedCard = ({ schedule }) => (
  <div className={`card p-5 border-l-4 ${
    schedule.status === 'SCHEDULED' ? 'border-l-green-500' :
    schedule.status === 'COMPLETED' ? 'border-l-ink-300' :
    schedule.status === 'CANCELLED' ? 'border-l-red-300' : 'border-l-ink-200'
  } space-y-3`}>
    <div className="flex items-start justify-between gap-3 flex-wrap">
      <div className="min-w-0">
        <p className="font-semibold text-ink-800 truncate">{schedule.jobTitle}</p>
        <p className="text-xs text-ink-500 truncate">{schedule.companyName}</p>
      </div>
      <Badge variant={STATUS_VARIANT[schedule.status] || 'neutral'}>
        {STATUS_LABEL[schedule.status] || schedule.status}
      </Badge>
    </div>

    <div className="flex flex-wrap gap-3 text-xs text-ink-600">
      <span className="flex items-center gap-1">
        <HiOutlineCalendar className="w-3.5 h-3.5" /> {schedule.interviewDate}
      </span>
      <span className="flex items-center gap-1">
        <HiOutlineClock className="w-3.5 h-3.5" /> {schedule.windowStart} – {schedule.windowEnd}
      </span>
      <span className="flex items-center gap-1">
        <HiOutlineUsers className="w-3.5 h-3.5" /> {schedule.eligibleCount} eligible
      </span>
      {schedule.bookedSlots != null && (
        <span>{schedule.bookedSlots}/{schedule.totalSlots} booked</span>
      )}
    </div>

    {schedule.venue && (
      <div className="bg-cream-50 border border-ink-100 rounded-xl p-2.5 text-xs">
        <p className="flex items-center gap-1 font-semibold text-ink-700">
          <HiOutlineOfficeBuilding className="w-3.5 h-3.5" /> {schedule.venue}
        </p>
        {schedule.venueInstructions && (
          <p className="text-ink-500 mt-0.5">{schedule.venueInstructions}</p>
        )}
      </div>
    )}

    {schedule.commonLink && (
      <a href={schedule.commonLink} target="_blank" rel="noreferrer"
        className="text-xs text-maroon-600 hover:text-maroon-800 underline">
        Open meeting link
      </a>
    )}

    {schedule.tpoNote && (
      <p className="text-xs text-ink-500 italic">TPO note: {schedule.tpoNote}</p>
    )}
  </div>
);

/* ─── Main Page ─── */
const FacultyInterviewsPage = () => {
  const { getToken } = useAuth();
  const [schedules, setSchedules]       = useState([]);
  const [loading, setLoading]           = useState(true);
  const [tab, setTab]                   = useState('pending');
  const [confirmModal, setConfirmModal] = useState(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await interviewAPI.list(token);
      setSchedules(res.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to load schedules.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const pending   = schedules.filter((s) => s.status === 'FORWARDED_TO_FACULTY');
  const finalised = schedules.filter((s) => !['FORWARDED_TO_FACULTY', 'REQUESTED'].includes(s.status));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader title="Interview Coordination" subtitle="Confirm availability and track your school's interviews" />

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'pending',    label: `Pending Confirmation (${pending.length})` },
          { key: 'all',        label: `All Schedules (${finalised.length})` },
        ].map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`text-sm px-4 py-2 rounded-xl font-medium transition-all ${
              tab === key
                ? 'bg-maroon-600 text-white'
                : 'bg-white border border-ink-200 text-ink-600 hover:border-maroon-300'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'pending' && (
        pending.length === 0 ? (
          <div className="card p-12 text-center">
            <HiOutlineCheck className="w-10 h-10 text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500">No pending confirmations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pending.map((s) => (
              <PendingCard key={s.id} schedule={s} onConfirm={(sc) => setConfirmModal(sc)} />
            ))}
          </div>
        )
      )}

      {tab === 'all' && (
        finalised.length === 0 ? (
          <div className="card p-12 text-center">
            <HiOutlineCalendar className="w-10 h-10 text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500">No interview schedules yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {finalised.map((s) => <FinalisedCard key={s.id} schedule={s} />)}
          </div>
        )
      )}

      {confirmModal && (
        <ConfirmModal
          schedule={confirmModal}
          getToken={getToken}
          onDone={fetchAll}
          onClose={() => setConfirmModal(null)}
        />
      )}
    </div>
  );
};

export default FacultyInterviewsPage;
