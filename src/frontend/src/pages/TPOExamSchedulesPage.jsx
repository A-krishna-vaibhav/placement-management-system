import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { examAPI } from '../services/api';
import { Badge, Button, PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar, HiOutlineGlobeAlt, HiOutlineOfficeBuilding,
  HiOutlineClock, HiOutlineCheckCircle, HiOutlineX, HiOutlineUsers,
  HiOutlineFilter, HiOutlineRefresh,
} from 'react-icons/hi';

const STATUS_META = {
  REQUESTED:            { label: 'Awaiting Forward',     variant: 'warning' },
  FORWARDED_TO_FACULTY: { label: 'Sent to Faculty',      variant: 'maroon'  },
  FACULTY_CONFIRMED:    { label: 'Faculty Confirmed',    variant: 'success' },
  FINALIZED:            { label: 'Finalised',            variant: 'success' },
  CANCELLED:            { label: 'Cancelled',            variant: 'neutral' },
};

function fmtSlot(slot) {
  if (!slot) return '—';
  try {
    return new Date(`${slot.date}T${slot.startTime}:00+05:30`)
      .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      + ' at ' + slot.startTime + ' IST';
  } catch { return `${slot.date} ${slot.startTime}`; }
}

/* ─── Finalise Modal ─── */
const FinaliseModal = ({ schedule, onConfirm, onClose }) => {
  const [slot,  setSlot]  = useState(schedule.proposedSlots?.[0] || null);
  const [venue, setVenue] = useState('');
  const [venueInstructions, setVenueInstructions] = useState('');
  const [tpoNote, setTpoNote] = useState('');
  const isOffline = schedule.mode === 'OFFLINE';

  const selectedSlot = schedule.proposedSlots?.find(
    (s) => s.date === slot?.date && s.startTime === slot?.startTime,
  ) || null;

  const valid = selectedSlot && (!isOffline || venue.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-800">Finalise Exam Schedule</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-cream-50 rounded-xl px-4 py-3 text-sm">
          <p className="font-medium text-ink-800">{schedule.jobTitle}</p>
          <p className="text-ink-500">{schedule.companyName} · {schedule.mode}</p>
        </div>

        {/* Faculty confirmations summary */}
        {Object.keys(schedule.facultyConfirmations || {}).length > 0 && (
          <div>
            <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-2">Faculty Confirmations</p>
            <ul className="space-y-1.5">
              {Object.entries(schedule.facultyConfirmations).map(([sid, fc]) => (
                <li key={sid} className="text-xs bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
                  <span className="font-medium text-ink-700">{fc.facultyName}</span>
                  <span className="text-ink-400 mx-1">→</span>
                  <span className="text-emerald-700">{fmtSlot(fc.confirmedSlot)}</span>
                  {fc.note && <span className="text-ink-400 ml-1">"{fc.note}"</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Slot picker */}
        <div>
          <label className="label mb-2">Confirm Final Slot</label>
          <div className="space-y-2">
            {(schedule.proposedSlots || []).map((s, i) => {
              const isSelected = slot?.date === s.date && slot?.startTime === s.startTime;
              const isFacultyPicked = Object.values(schedule.facultyConfirmations || {}).some(
                (fc) => fc.confirmedSlot?.date === s.date && fc.confirmedSlot?.startTime === s.startTime,
              );
              return (
                <label key={i} className={`flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl border-2 transition-colors
                  ${isSelected ? 'border-maroon-500 bg-maroon-50' : 'border-ink-200 hover:border-maroon-300'}`}>
                  <input
                    type="radio"
                    name="slot"
                    checked={isSelected}
                    onChange={() => setSlot(s)}
                    className="accent-maroon-600"
                  />
                  <span className="text-sm text-ink-700 flex-1">{fmtSlot(s)}</span>
                  {isFacultyPicked && (
                    <span className="text-xs text-emerald-600 font-medium flex items-center gap-0.5">
                      <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Faculty pick
                    </span>
                  )}
                </label>
              );
            })}
          </div>
        </div>

        {/* Venue (OFFLINE only) */}
        {isOffline && (
          <div className="space-y-3">
            <div>
              <label className="label">Venue <span className="text-red-500">*</span></label>
              <input
                type="text"
                className="input mt-1"
                placeholder="e.g. CR-101, Academic Block, UoH"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
              />
            </div>
            <div>
              <label className="label">Venue Instructions (optional)</label>
              <textarea
                className="input resize-none mt-1"
                rows={2}
                placeholder="Bring ID card, arrive 15 min early…"
                value={venueInstructions}
                onChange={(e) => setVenueInstructions(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* TPO note */}
        <div>
          <label className="label">Note to all parties (optional)</label>
          <textarea
            className="input resize-none mt-1"
            rows={2}
            placeholder="Any additional instructions…"
            value={tpoNote}
            onChange={(e) => setTpoNote(e.target.value)}
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onConfirm({ confirmedSlot: slot, venue, venueInstructions, tpoNote })}
            disabled={!valid}
          >
            Finalise & Notify All
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Cancel Modal ─── */
const CancelModal = ({ schedule, onConfirm, onClose }) => {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-800">Cancel Exam Schedule</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1"><HiOutlineX className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-ink-600">
          Cancelling: <strong>{schedule.jobTitle}</strong> — {schedule.companyName}
        </p>
        <div>
          <label className="label">Reason <span className="text-red-500">*</span></label>
          <textarea
            className="input resize-none mt-1"
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for cancellation…"
          />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Back</Button>
          <Button variant="danger" onClick={() => onConfirm(reason)} disabled={!reason.trim()}>
            Confirm Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Venue modal (post-finalize update) ─── */
const VenueModal = ({ schedule, onConfirm, onClose }) => {
  const [venue, setVenue]   = useState(schedule.venue || '');
  const [instructions, setInstructions] = useState(schedule.venueInstructions || '');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-800">Update Venue</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1"><HiOutlineX className="w-5 h-5" /></button>
        </div>
        <div>
          <label className="label">Venue <span className="text-red-500">*</span></label>
          <input type="text" className="input mt-1" value={venue} onChange={(e) => setVenue(e.target.value)} />
        </div>
        <div>
          <label className="label">Instructions (optional)</label>
          <textarea className="input resize-none mt-1" rows={2} value={instructions} onChange={(e) => setInstructions(e.target.value)} />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onConfirm({ venue, venueInstructions: instructions })} disabled={!venue.trim()}>
            Update Venue
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Schedule card ─── */
const ScheduleCard = ({ schedule, onAction }) => {
  const { getToken }      = useAuth();
  const [acting, setAct]  = useState(false);
  const [modal, setModal] = useState(null); // 'finalise' | 'cancel' | 'venue'
  const meta              = STATUS_META[schedule.status] || STATUS_META.REQUESTED;

  const doForward = async () => {
    setAct(true);
    try {
      const token = await getToken();
      await examAPI.forward(token, schedule.id);
      toast.success('Request forwarded to faculty.');
      onAction();
    } catch (e) { toast.error(e.message || 'Failed to forward.'); }
    finally { setAct(false); }
  };

  const doFinalise = async (body) => {
    setModal(null);
    setAct(true);
    try {
      const token = await getToken();
      await examAPI.finalize(token, schedule.id, body);
      toast.success('Exam schedule finalised. All parties notified.');
      onAction();
    } catch (e) { toast.error(e.message || 'Failed to finalise.'); }
    finally { setAct(false); }
  };

  const doCancel = async (reason) => {
    setModal(null);
    setAct(true);
    try {
      const token = await getToken();
      await examAPI.cancel(token, schedule.id, reason);
      toast.success('Exam schedule cancelled.');
      onAction();
    } catch (e) { toast.error(e.message || 'Failed to cancel.'); }
    finally { setAct(false); }
  };

  const doVenue = async (body) => {
    setModal(null);
    setAct(true);
    try {
      const token = await getToken();
      await examAPI.assignVenue(token, schedule.id, body);
      toast.success('Venue updated. All parties notified.');
      onAction();
    } catch (e) { toast.error(e.message || 'Failed to update venue.'); }
    finally { setAct(false); }
  };

  const borderClass = schedule.status === 'REQUESTED' ? 'border-l-4 border-l-amber-400' :
    schedule.status === 'FACULTY_CONFIRMED' ? 'border-l-4 border-l-emerald-400' : '';

  return (
    <>
      <div className={`card p-5 space-y-4 ${borderClass}`}>
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-ink-800">{schedule.jobTitle}</h3>
              <Badge variant={schedule.mode === 'ONLINE' ? 'maroon' : 'neutral'}>
                {schedule.mode === 'ONLINE'
                  ? <><HiOutlineGlobeAlt className="inline w-3 h-3 mr-0.5" />Online</>
                  : <><HiOutlineOfficeBuilding className="inline w-3 h-3 mr-0.5" />Offline</>}
              </Badge>
            </div>
            <p className="text-sm text-ink-500 mt-0.5">{schedule.companyName}</p>
            <div className="flex items-center gap-1 mt-1 text-xs text-ink-400">
              <HiOutlineUsers className="w-3.5 h-3.5" />
              {schedule.shortlistedCount} shortlisted ·
              Requested {new Date(schedule.requestedAt).toLocaleDateString()}
            </div>
          </div>
          <Badge variant={meta.variant}>{meta.label}</Badge>
        </div>

        {/* Proposed slots */}
        <div>
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-1.5">Proposed Slots</p>
          <ul className="space-y-1">
            {(schedule.proposedSlots || []).map((sl, i) => {
              const isPicked = Object.values(schedule.facultyConfirmations || {}).some(
                (fc) => fc.confirmedSlot?.date === sl.date && fc.confirmedSlot?.startTime === sl.startTime,
              );
              return (
                <li key={i} className={`text-xs flex items-center gap-1.5 px-2 py-1 rounded-lg
                  ${isPicked ? 'bg-emerald-50 text-emerald-700 font-medium' : 'text-ink-600'}`}>
                  <HiOutlineClock className="w-3.5 h-3.5 flex-shrink-0" />
                  {fmtSlot(sl)}
                  {isPicked && <HiOutlineCheckCircle className="w-3.5 h-3.5 ml-auto" />}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Confirmed detail (finalized) */}
        {schedule.status === 'FINALIZED' && schedule.confirmedSlot && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5 text-sm">
            <p className="font-semibold text-emerald-700 flex items-center gap-1">
              <HiOutlineCalendar className="w-4 h-4" /> {fmtSlot(schedule.confirmedSlot)}
            </p>
            {schedule.mode === 'OFFLINE' && schedule.venue && (
              <p className="text-ink-600 mt-1"><HiOutlineOfficeBuilding className="inline w-3.5 h-3.5 mr-0.5" />{schedule.venue}</p>
            )}
            {schedule.mode === 'ONLINE' && schedule.examLink && (
              <p className="text-ink-600 mt-1 truncate">
                <HiOutlineGlobeAlt className="inline w-3.5 h-3.5 mr-0.5" />
                <a href={schedule.examLink} target="_blank" rel="noreferrer" className="text-maroon-600 underline">{schedule.examLink}</a>
              </p>
            )}
          </div>
        )}

        {/* Actions */}
        {schedule.status !== 'CANCELLED' && schedule.status !== 'FINALIZED' && (
          <div className="flex gap-2 pt-1 border-t border-ink-100 flex-wrap">
            {schedule.status === 'REQUESTED' && (
              <Button size="sm" onClick={doForward} loading={acting}>
                Forward to Faculty
              </Button>
            )}
            {schedule.status === 'FACULTY_CONFIRMED' && (
              <Button size="sm" onClick={() => setModal('finalise')} disabled={acting}>
                <HiOutlineCheckCircle className="w-4 h-4 mr-1" /> Finalise Schedule
              </Button>
            )}
            <Button size="sm" variant="ghost" onClick={() => setModal('cancel')} disabled={acting}>
              <HiOutlineX className="w-4 h-4 mr-1" /> Cancel
            </Button>
          </div>
        )}

        {/* Venue update after finalise (offline) */}
        {schedule.status === 'FINALIZED' && schedule.mode === 'OFFLINE' && (
          <div className="pt-1 border-t border-ink-100">
            <Button size="sm" variant="ghost" onClick={() => setModal('venue')} disabled={acting}>
              <HiOutlineOfficeBuilding className="w-4 h-4 mr-1" />
              {schedule.venue ? 'Update Venue' : 'Assign Venue'}
            </Button>
          </div>
        )}
      </div>

      {modal === 'finalise' && (
        <FinaliseModal schedule={schedule} onConfirm={doFinalise} onClose={() => setModal(null)} />
      )}
      {modal === 'cancel' && (
        <CancelModal schedule={schedule} onConfirm={doCancel} onClose={() => setModal(null)} />
      )}
      {modal === 'venue' && (
        <VenueModal schedule={schedule} onConfirm={doVenue} onClose={() => setModal(null)} />
      )}
    </>
  );
};

/* ─── Main page ─── */
const TPOExamSchedulesPage = () => {
  const { getToken }      = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('ALL');

  const FILTERS = ['ALL', 'REQUESTED', 'FORWARDED_TO_FACULTY', 'FACULTY_CONFIRMED', 'FINALIZED', 'CANCELLED'];

  const fetchAll = useCallback(async () => {
    try {
      const token = await getToken();
      const res   = await examAPI.list(token);
      setSchedules(res.data || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load exam schedules.');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = filter === 'ALL'
    ? schedules
    : schedules.filter((s) => s.status === filter);

  const counts = FILTERS.slice(1).reduce((acc, f) => {
    acc[f] = schedules.filter((s) => s.status === f).length;
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <PageHeader
          title="Exam Scheduling"
          subtitle={`${schedules.length} request${schedules.length !== 1 ? 's' : ''} total`}
        />
        <button onClick={fetchAll} className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-maroon-600 mt-1">
          <HiOutlineRefresh className="w-4 h-4" /> Refresh
        </button>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 flex-wrap text-xs">
        {counts.REQUESTED > 0 && (
          <span className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-3 py-1.5 font-medium">
            {counts.REQUESTED} awaiting forward
          </span>
        )}
        {counts.FACULTY_CONFIRMED > 0 && (
          <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-3 py-1.5 font-medium">
            {counts.FACULTY_CONFIRMED} ready to finalise
          </span>
        )}
        {counts.FINALIZED > 0 && (
          <span className="bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-3 py-1.5 font-medium">
            {counts.FINALIZED} finalised
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap items-center">
        <HiOutlineFilter className="w-4 h-4 text-ink-400 flex-shrink-0" />
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors
              ${filter === f ? 'bg-maroon-600 text-white' : 'bg-ink-100 text-ink-600 hover:bg-ink-200'}`}
          >
            {f === 'ALL' ? 'All' : STATUS_META[f]?.label || f}
            {f !== 'ALL' && counts[f] > 0 && ` (${counts[f]})`}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-12 text-center">
          <HiOutlineCalendar className="w-10 h-10 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500">
            {filter === 'ALL' ? 'No exam scheduling requests yet.' : `No ${STATUS_META[filter]?.label?.toLowerCase()} requests.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => (
            <ScheduleCard key={s.id} schedule={s} onAction={fetchAll} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TPOExamSchedulesPage;
