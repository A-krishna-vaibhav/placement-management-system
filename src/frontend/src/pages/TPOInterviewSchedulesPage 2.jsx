import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { interviewAPI } from '../services/api';
import { Badge, PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar, HiOutlineClock, HiOutlineUsers,
  HiOutlineOfficeBuilding, HiOutlineX, HiOutlineCheck,
} from 'react-icons/hi';

/* ─── Status helpers ─── */
const STATUS_LABEL = {
  REQUESTED:            'Pending Forward',
  FORWARDED_TO_FACULTY: 'Awaiting Faculty',
  FACULTY_CONFIRMED:    'Ready to Schedule',
  SCHEDULED:            'Scheduled',
  LIVE:                 'Live',
  COMPLETED:            'Completed',
  CANCELLED:            'Cancelled',
};
const STATUS_VARIANT = {
  REQUESTED:            'warning',
  FORWARDED_TO_FACULTY: 'warning',
  FACULTY_CONFIRMED:    'maroon',
  SCHEDULED:            'success',
  LIVE:                 'success',
  COMPLETED:            'neutral',
  CANCELLED:            'danger',
};

const FILTER_TABS = ['ALL', 'REQUESTED', 'FORWARDED_TO_FACULTY', 'FACULTY_CONFIRMED', 'SCHEDULED', 'COMPLETED', 'CANCELLED'];

/* ─── Schedule Modal ─── */
const ScheduleModal = ({ schedule, getToken, onDone, onClose }) => {
  const [venue, setVenue]         = useState('');
  const [venueInst, setVenueInst] = useState('');
  const [tpoNote, setTpoNote]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (schedule.mode === 'OFFLINE' && !venue) { toast.error('Venue is required for OFFLINE interviews.'); return; }
    setSubmitting(true);
    try {
      const token = await getToken();
      await interviewAPI.schedule(token, schedule.id, {
        venue: venue || undefined,
        venueInstructions: venueInst || undefined,
        tpoNote: tpoNote || undefined,
      });
      toast.success('Interview slots generated and all parties notified.');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to schedule interviews.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h3 className="font-semibold text-ink-800">Finalise & Generate Slots</h3>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-ink-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="bg-cream-50 border border-ink-100 rounded-xl p-3 text-sm text-ink-600 space-y-1">
            <p><strong>{schedule.jobTitle}</strong> — {schedule.companyName}</p>
            <p>{schedule.interviewDate} · {schedule.windowStart}–{schedule.windowEnd} · {schedule.duration} min slots</p>
            <p>{schedule.eligibleCount} eligible students · {schedule.totalSlots} slots to generate</p>
          </div>

          {schedule.mode === 'OFFLINE' && (
            <>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Venue <span className="text-red-500">*</span></label>
                <input type="text" value={venue} onChange={(e) => setVenue(e.target.value)}
                  placeholder="Room 101, Admin Block" className="input w-full" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-600 mb-1">Venue Instructions</label>
                <textarea value={venueInst} onChange={(e) => setVenueInst(e.target.value)}
                  rows={2} placeholder="Bring ID card, arrive 10 min early…" className="input w-full resize-none" />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">TPO Note (optional)</label>
            <textarea value={tpoNote} onChange={(e) => setTpoNote(e.target.value)}
              rows={2} placeholder="Additional notes for company / students…" className="input w-full resize-none" />
          </div>

          <div className="text-xs text-ink-500 bg-blue-50 border border-blue-100 rounded-xl p-3">
            {schedule.allocationMode === 'AUTO'
              ? '⚡ Students will be auto-assigned to slots sequentially.'
              : '🙋 Slots will be open for students to pick (first-come, first-served).'}
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-ink-200 text-ink-600 text-sm font-medium hover:bg-ink-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 btn-primary text-sm disabled:opacity-50">
              {submitting ? 'Generating…' : 'Generate Slots'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Cancel Modal ─── */
const CancelModal = ({ schedule, getToken, onDone, onClose }) => {
  const [reason, setReason]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) { toast.error('Please provide a reason.'); return; }
    setSubmitting(true);
    try {
      const token = await getToken();
      await interviewAPI.cancel(token, schedule.id, reason);
      toast.success('Interview schedule cancelled.');
      onDone();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h3 className="font-semibold text-ink-800">Cancel Interview Schedule</h3>
          <button onClick={onClose}><HiOutlineX className="w-5 h-5 text-ink-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <p className="text-sm text-ink-600">
            Cancel interviews for <strong>{schedule.jobTitle}</strong>? All parties will be notified.
          </p>
          <div>
            <label className="block text-xs font-medium text-ink-600 mb-1">Reason <span className="text-red-500">*</span></label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)}
              rows={3} className="input w-full resize-none" placeholder="Reason for cancellation…" required />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-ink-200 text-ink-600 text-sm font-medium hover:bg-ink-50">
              Back
            </button>
            <button type="submit" disabled={submitting}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl py-2.5 disabled:opacity-50">
              {submitting ? 'Cancelling…' : 'Confirm Cancel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ─── Schedule card ─── */
const ScheduleCard = ({ schedule, onForward, onSchedule, onCancel, onComplete }) => {
  const borderColor = {
    REQUESTED:            'border-l-amber-400',
    FORWARDED_TO_FACULTY: 'border-l-blue-400',
    FACULTY_CONFIRMED:    'border-l-maroon-500',
    SCHEDULED:            'border-l-green-500',
    LIVE:                 'border-l-green-600',
    COMPLETED:            'border-l-ink-300',
    CANCELLED:            'border-l-red-300',
  }[schedule.status] || 'border-l-ink-200';

  const confirmations = Object.values(schedule.facultyConfirmations || {});

  return (
    <div className={`card p-5 border-l-4 ${borderColor} space-y-3`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold text-ink-800 truncate">{schedule.jobTitle}</p>
          <p className="text-xs text-ink-500 truncate">{schedule.companyName}</p>
        </div>
        <Badge variant={STATUS_VARIANT[schedule.status] || 'neutral'}>
          {STATUS_LABEL[schedule.status] || schedule.status}
        </Badge>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <span className="flex items-center gap-1 text-ink-600">
          <HiOutlineCalendar className="w-3.5 h-3.5" /> {schedule.interviewDate}
        </span>
        <span className="flex items-center gap-1 text-ink-600">
          <HiOutlineClock className="w-3.5 h-3.5" /> {schedule.windowStart}–{schedule.windowEnd}
        </span>
        <span className="flex items-center gap-1 text-ink-600">
          <HiOutlineUsers className="w-3.5 h-3.5" /> {schedule.eligibleCount} students
        </span>
        <span className="flex items-center gap-1 text-ink-600">
          <HiOutlineClock className="w-3.5 h-3.5" /> {schedule.duration} min · {schedule.totalSlots} slots
        </span>
      </div>

      {/* Mode / alloc */}
      <div className="flex flex-wrap gap-1.5">
        <span className="bg-ink-100 text-ink-600 text-[10px] px-2 py-0.5 rounded-full">{schedule.mode}</span>
        <span className="bg-ink-100 text-ink-600 text-[10px] px-2 py-0.5 rounded-full">{schedule.allocationMode?.replace('_', ' ')}</span>
        {schedule.linkType && <span className="bg-ink-100 text-ink-600 text-[10px] px-2 py-0.5 rounded-full">{schedule.linkType} link</span>}
      </div>

      {/* Faculty confirmations */}
      {confirmations.length > 0 && (
        <div className="bg-cream-50 border border-ink-100 rounded-xl p-2.5 space-y-1">
          <p className="text-[10px] font-semibold text-ink-500 uppercase">Faculty Confirmed</p>
          {confirmations.map((c, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-ink-600">
              <HiOutlineCheck className="w-3 h-3 text-green-600" />
              {c.facultyName} {c.note && <span className="text-ink-400">— {c.note}</span>}
            </div>
          ))}
        </div>
      )}

      {/* TPO note / venue */}
      {schedule.tpoNote && (
        <p className="text-xs text-ink-500 italic">Note: {schedule.tpoNote}</p>
      )}
      {schedule.venue && (
        <p className="text-xs text-ink-600 flex items-center gap-1">
          <HiOutlineOfficeBuilding className="w-3.5 h-3.5" /> {schedule.venue}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-1">
        {schedule.status === 'REQUESTED' && (
          <button onClick={() => onForward(schedule)}
            className="text-xs bg-maroon-600 hover:bg-maroon-700 text-white rounded-lg px-3 py-1.5 font-medium">
            Forward to Faculty
          </button>
        )}
        {schedule.status === 'FACULTY_CONFIRMED' && (
          <button onClick={() => onSchedule(schedule)}
            className="text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg px-3 py-1.5 font-medium">
            Generate Slots
          </button>
        )}
        {schedule.status === 'SCHEDULED' && (
          <button onClick={() => onComplete(schedule)}
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5 font-medium">
            Mark Completed
          </button>
        )}
        {!['CANCELLED', 'COMPLETED'].includes(schedule.status) && (
          <button onClick={() => onCancel(schedule)}
            className="text-xs border border-red-200 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5 font-medium">
            Cancel
          </button>
        )}
      </div>
    </div>
  );
};

/* ─── Main Page ─── */
const TPOInterviewSchedulesPage = () => {
  const { getToken } = useAuth();
  const [schedules, setSchedules]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [filter, setFilter]           = useState('ALL');
  const [scheduleModal, setScheduleModal] = useState(null);
  const [cancelModal, setCancelModal]     = useState(null);

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

  const handleForward = async (sched) => {
    try {
      const token = await getToken();
      await interviewAPI.forward(token, sched.id);
      toast.success('Forwarded to faculty.');
      fetchAll();
    } catch (err) {
      toast.error(err.message || 'Failed to forward.');
    }
  };

  const handleComplete = async (sched) => {
    if (!window.confirm(`Mark interviews for "${sched.jobTitle}" as completed?`)) return;
    try {
      const token = await getToken();
      await interviewAPI.complete(token, sched.id);
      toast.success('Marked as completed.');
      fetchAll();
    } catch (err) {
      toast.error(err.message || 'Failed to complete.');
    }
  };

  const filtered = filter === 'ALL' ? schedules : schedules.filter((s) => s.status === filter);

  const summary = {
    pending:   schedules.filter((s) => s.status === 'REQUESTED').length,
    readySched: schedules.filter((s) => s.status === 'FACULTY_CONFIRMED').length,
    scheduled: schedules.filter((s) => s.status === 'SCHEDULED').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <PageHeader title="Interview Scheduling" subtitle="Coordinate company interview requests" />

      {/* Summary chips */}
      <div className="flex flex-wrap gap-3">
        {summary.pending > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700 font-medium">
            {summary.pending} awaiting forward
          </div>
        )}
        {summary.readySched > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-700 font-medium">
            {summary.readySched} ready to schedule
          </div>
        )}
        {summary.scheduled > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-2 text-sm text-blue-700 font-medium">
            {summary.scheduled} scheduled
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {FILTER_TABS.map((tab) => (
          <button key={tab} onClick={() => setFilter(tab)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
              filter === tab
                ? 'bg-maroon-600 text-white'
                : 'bg-white border border-ink-200 text-ink-600 hover:border-maroon-300'
            }`}>
            {tab === 'ALL' ? 'All' : STATUS_LABEL[tab] || tab.replace(/_/g, ' ')}
            {tab !== 'ALL' && (
              <span className="ml-1.5 opacity-70">
                ({schedules.filter((s) => s.status === tab).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineCalendar className="w-10 h-10 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">No interview schedules found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((sched) => (
            <ScheduleCard
              key={sched.id}
              schedule={sched}
              onForward={handleForward}
              onSchedule={(s) => setScheduleModal(s)}
              onCancel={(s) => setCancelModal(s)}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}

      {scheduleModal && (
        <ScheduleModal
          schedule={scheduleModal}
          getToken={getToken}
          onDone={fetchAll}
          onClose={() => setScheduleModal(null)}
        />
      )}
      {cancelModal && (
        <CancelModal
          schedule={cancelModal}
          getToken={getToken}
          onDone={fetchAll}
          onClose={() => setCancelModal(null)}
        />
      )}
    </div>
  );
};

export default TPOInterviewSchedulesPage;
