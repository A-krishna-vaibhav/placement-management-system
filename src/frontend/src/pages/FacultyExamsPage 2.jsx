import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { examAPI } from '../services/api';
import { Badge, Button, PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar, HiOutlineGlobeAlt, HiOutlineOfficeBuilding,
  HiOutlineClock, HiOutlineCheckCircle, HiOutlineX, HiOutlineUsers,
} from 'react-icons/hi';

function fmtSlot(slot) {
  if (!slot) return '—';
  try {
    return new Date(`${slot.date}T${slot.startTime}:00+05:30`)
      .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      + ' at ' + slot.startTime + ' IST';
  } catch { return `${slot.date} ${slot.startTime}`; }
}

/* ─── Confirm modal ─── */
const ConfirmModal = ({ schedule, onConfirm, onClose }) => {
  const [slot, setSlot] = useState(null);
  const [note, setNote] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-ink-800">Confirm Exam Date</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 p-1">
            <HiOutlineX className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-cream-50 rounded-xl px-4 py-3 text-sm">
          <p className="font-medium text-ink-800">{schedule.jobTitle}</p>
          <p className="text-ink-500">{schedule.companyName} · {schedule.mode}</p>
        </div>

        <div>
          <label className="label mb-2">Select a Date</label>
          <div className="space-y-2">
            {(schedule.proposedSlots || []).map((s, i) => {
              const isSel = slot?.date === s.date && slot?.startTime === s.startTime;
              return (
                <label key={i} className={`flex items-center gap-3 cursor-pointer px-3 py-2.5 rounded-xl border-2 transition-colors
                  ${isSel ? 'border-maroon-500 bg-maroon-50' : 'border-ink-200 hover:border-maroon-300'}`}>
                  <input
                    type="radio"
                    name="slot"
                    checked={isSel}
                    onChange={() => setSlot(s)}
                    className="accent-maroon-600"
                  />
                  <span className="text-sm text-ink-700">{fmtSlot(s)}</span>
                </label>
              );
            })}
          </div>
        </div>

        <div>
          <label className="label">Note to TPO (optional)</label>
          <textarea
            className="input resize-none mt-1"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Any constraints or comments…"
          />
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => onConfirm({ confirmedSlot: slot, note })}
            disabled={!slot}
          >
            Confirm Date
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Pending card ─── */
const PendingCard = ({ schedule, onAction }) => {
  const { getToken }      = useAuth();
  const [modal, setModal] = useState(false);
  const [acting, setAct]  = useState(false);

  const doConfirm = async ({ confirmedSlot, note }) => {
    setModal(false);
    setAct(true);
    try {
      const token = await getToken();
      await examAPI.facultyConfirm(token, schedule.id, { confirmedSlot, note });
      toast.success('Date confirmed. TPO has been notified.');
      onAction();
    } catch (e) {
      toast.error(e.message || 'Failed to confirm date.');
    } finally {
      setAct(false);
    }
  };

  return (
    <>
      <div className="card p-5 space-y-4 border-l-4 border-l-amber-400">
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
              {schedule.shortlistedCount} student{schedule.shortlistedCount !== 1 ? 's' : ''} from your school
            </div>
          </div>
          <Badge variant="warning">Needs Your Confirmation</Badge>
        </div>

        <div>
          <p className="text-xs font-semibold text-ink-400 uppercase tracking-wide mb-2">Proposed Slots</p>
          <ul className="space-y-1.5">
            {(schedule.proposedSlots || []).map((sl, i) => (
              <li key={i} className="text-sm flex items-center gap-2 text-ink-600 bg-cream-50 px-3 py-1.5 rounded-lg">
                <HiOutlineClock className="w-4 h-4 text-ink-400 flex-shrink-0" />
                {fmtSlot(sl)}
              </li>
            ))}
          </ul>
        </div>

        {schedule.companyNotes && (
          <p className="text-xs text-ink-500 bg-cream-50 rounded-lg px-3 py-2">
            <strong>Company Notes:</strong> {schedule.companyNotes}
          </p>
        )}

        <div className="pt-1 border-t border-ink-100">
          <Button size="sm" onClick={() => setModal(true)} loading={acting}>
            <HiOutlineCheckCircle className="w-4 h-4 mr-1" /> Confirm a Date
          </Button>
        </div>
      </div>

      {modal && (
        <ConfirmModal schedule={schedule} onConfirm={doConfirm} onClose={() => setModal(false)} />
      )}
    </>
  );
};

/* ─── Finalised card (read-only for faculty) ─── */
const FinalisedCard = ({ schedule }) => {
  const meta = {
    FINALIZED:  { label: 'Finalised', variant: 'success' },
    CANCELLED:  { label: 'Cancelled', variant: 'neutral' },
    FACULTY_CONFIRMED: { label: 'Faculty Confirmed — Awaiting TPO', variant: 'maroon' },
    REQUESTED:         { label: 'Awaiting Forward', variant: 'warning' },
    FORWARDED_TO_FACULTY: { label: 'Pending Your Confirmation', variant: 'warning' },
  }[schedule.status] || { label: schedule.status, variant: 'neutral' };

  return (
    <div className="card p-5 space-y-3">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-ink-800">{schedule.jobTitle}</h3>
            <Badge variant={schedule.mode === 'ONLINE' ? 'maroon' : 'neutral'}>
              {schedule.mode}
            </Badge>
          </div>
          <p className="text-sm text-ink-500 mt-0.5">{schedule.companyName}</p>
        </div>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </div>

      {schedule.confirmedSlot && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2.5">
          <p className="text-sm font-semibold text-emerald-700 flex items-center gap-1">
            <HiOutlineCalendar className="w-4 h-4" />
            {fmtSlot(schedule.confirmedSlot)}
          </p>
          {schedule.mode === 'OFFLINE' && schedule.venue && (
            <p className="text-sm text-ink-600 mt-1 flex items-center gap-1">
              <HiOutlineOfficeBuilding className="w-3.5 h-3.5" /> {schedule.venue}
            </p>
          )}
          {schedule.mode === 'OFFLINE' && !schedule.venue && (
            <p className="text-xs text-ink-400 mt-1 italic">Venue to be assigned by TPO.</p>
          )}
          {schedule.mode === 'ONLINE' && (
            schedule.examLink ? (
              <p className="text-sm mt-1 flex items-center gap-1">
                <HiOutlineGlobeAlt className="w-3.5 h-3.5 text-maroon-600" />
                <a href={schedule.examLink} target="_blank" rel="noreferrer"
                  className="text-maroon-600 underline truncate">{schedule.examLink}</a>
              </p>
            ) : (
              <p className="text-xs text-ink-400 mt-1 italic">Exam link not yet provided by company.</p>
            )
          )}
        </div>
      )}

      {schedule.status === 'CANCELLED' && schedule.cancellationReason && (
        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">
          Cancelled: {schedule.cancellationReason}
        </p>
      )}
    </div>
  );
};

/* ─── Main page ─── */
const FacultyExamsPage = () => {
  const { getToken }      = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('pending');

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

  const pending  = schedules.filter((s) => s.status === 'FORWARDED_TO_FACULTY');
  const others   = schedules.filter((s) => s.status !== 'FORWARDED_TO_FACULTY');

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
        title="Exam Coordination"
        subtitle="Review proposed exam slots for your school and confirm suitable dates"
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-ink-100 rounded-xl p-1 w-fit">
        {[
          { key: 'pending', label: `Pending Confirmation${pending.length ? ` (${pending.length})` : ''}` },
          { key: 'all',     label: `All Schedules (${schedules.length})` },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${tab === key ? 'bg-white text-maroon-700 shadow-sm' : 'text-ink-500 hover:text-ink-700'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'pending' ? (
        pending.length === 0 ? (
          <div className="card p-12 text-center">
            <HiOutlineCheckCircle className="w-10 h-10 text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500">No pending confirmations. All caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pending.map((s) => (
              <PendingCard key={s.id} schedule={s} onAction={fetchAll} />
            ))}
          </div>
        )
      ) : (
        schedules.length === 0 ? (
          <div className="card p-12 text-center">
            <HiOutlineCalendar className="w-10 h-10 text-ink-300 mx-auto mb-3" />
            <p className="text-ink-500">No exam schedules for your school yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {[...pending, ...others].map((s) => (
              s.status === 'FORWARDED_TO_FACULTY'
                ? <PendingCard key={s.id} schedule={s} onAction={fetchAll} />
                : <FinalisedCard key={s.id} schedule={s} />
            ))}
          </div>
        )
      )}
    </div>
  );
};

export default FacultyExamsPage;
