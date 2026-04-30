import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { examAPI, jobAPI } from '../services/api';
import { Badge, Button, PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft, HiOutlinePlus, HiOutlineTrash,
  HiOutlineCalendar, HiOutlineGlobeAlt, HiOutlineOfficeBuilding,
  HiOutlineClock, HiOutlineCheckCircle, HiOutlineExternalLink,
} from 'react-icons/hi';

const STATUS_META = {
  REQUESTED:            { label: 'Submitted — Awaiting TPO',    variant: 'warning' },
  FORWARDED_TO_FACULTY: { label: 'Sent to Faculty',             variant: 'warning' },
  FACULTY_CONFIRMED:    { label: 'Faculty Confirmed — Awaiting TPO Finalisation', variant: 'maroon' },
  FINALIZED:            { label: 'Finalised',                   variant: 'success' },
  CANCELLED:            { label: 'Cancelled',                   variant: 'danger'  },
};

const STEPS = ['Submitted', 'Sent to Faculty', 'Faculty Confirmed', 'Finalised'];
const STATUS_STEP = {
  REQUESTED:            0,
  FORWARDED_TO_FACULTY: 1,
  FACULTY_CONFIRMED:    2,
  FINALIZED:            3,
};

function fmtSlot(slot) {
  if (!slot) return '—';
  try {
    const d = new Date(`${slot.date}T${slot.startTime}:00+05:30`);
    return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
      + ' at ' + slot.startTime + ' IST';
  } catch {
    return `${slot.date} ${slot.startTime}`;
  }
}

function isWithinCutoff(slot) {
  if (!slot) return false;
  try {
    const examDt = new Date(`${slot.date}T${slot.startTime}:00+05:30`);
    return Date.now() >= examDt.getTime() - 60 * 60 * 1000;
  } catch {
    return false;
  }
}

/* ─── Step progress bar ─── */
const StepBar = ({ status }) => {
  const current = STATUS_STEP[status] ?? -1;
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        const last    = i === STEPS.length - 1;
        return (
          <div key={label} className="flex items-center flex-1 min-w-0">
            <div className="flex flex-col items-center flex-shrink-0">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors
                ${done   ? 'bg-emerald-500 border-emerald-500 text-white'  : ''}
                ${active ? 'bg-maroon-600 border-maroon-600 text-white'    : ''}
                ${!done && !active ? 'bg-white border-ink-300 text-ink-400' : ''}`}>
                {done ? '✓' : i + 1}
              </div>
              <span className={`text-[10px] mt-1 text-center leading-tight max-w-[60px]
                ${active ? 'text-maroon-700 font-semibold' : done ? 'text-emerald-600' : 'text-ink-400'}`}>
                {label}
              </span>
            </div>
            {!last && (
              <div className={`h-0.5 flex-1 mx-1 mb-4 rounded transition-colors
                ${done ? 'bg-emerald-400' : 'bg-ink-200'}`} />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ─── Request form ─── */
const RequestForm = ({ jobId, onSuccess }) => {
  const { getToken } = useAuth();
  const [mode, setMode]     = useState('ONLINE');
  const [slots, setSlots]   = useState([{ date: '', startTime: '' }]);
  const [notes, setNotes]   = useState('');
  const [saving, setSaving] = useState(false);

  const addSlot    = () => setSlots((s) => [...s, { date: '', startTime: '' }]);
  const removeSlot = (i) => setSlots((s) => s.filter((_, idx) => idx !== i));
  const updateSlot = (i, field, val) =>
    setSlots((s) => s.map((sl, idx) => idx === i ? { ...sl, [field]: val } : sl));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const filled = slots.filter((s) => s.date && s.startTime);
    if (!filled.length) return toast.error('Add at least one complete time slot.');
    setSaving(true);
    try {
      const token = await getToken();
      const res   = await examAPI.request(token, jobId, { mode, proposedSlots: filled, notes });
      toast.success('Exam schedule request submitted!');
      onSuccess(res.data);
    } catch (e) {
      toast.error(e.message || 'Failed to submit request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-6">
      <h3 className="font-semibold text-ink-800">Request Exam Schedule</h3>

      {/* Mode */}
      <div>
        <label className="label mb-2">Exam Mode</label>
        <div className="flex gap-3">
          {['ONLINE', 'OFFLINE'].map((m) => (
            <button
              key={m} type="button"
              onClick={() => setMode(m)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-colors
                ${mode === m
                  ? 'border-maroon-600 bg-maroon-50 text-maroon-700'
                  : 'border-ink-200 text-ink-600 hover:border-maroon-300'}`}
            >
              {m === 'ONLINE' ? <HiOutlineGlobeAlt className="w-4 h-4" /> : <HiOutlineOfficeBuilding className="w-4 h-4" />}
              {m}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-400 mt-1.5">
          {mode === 'ONLINE'
            ? 'You will provide the exam link after TPO finalises the schedule.'
            : 'TPO will assign a venue after finalisation.'}
        </p>
      </div>

      {/* Proposed slots */}
      <div>
        <label className="label mb-2">Proposed Time Slots (1–5)</label>
        <div className="space-y-2">
          {slots.map((sl, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="date"
                value={sl.date}
                min={new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0]}
                onChange={(e) => updateSlot(i, 'date', e.target.value)}
                className="input flex-1"
                required={i === 0}
              />
              <input
                type="time"
                value={sl.startTime}
                onChange={(e) => updateSlot(i, 'startTime', e.target.value)}
                className="input w-32"
                required={i === 0}
              />
              {slots.length > 1 && (
                <button type="button" onClick={() => removeSlot(i)}
                  className="text-red-400 hover:text-red-600 p-1 flex-shrink-0">
                  <HiOutlineTrash className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {slots.length < 5 && (
          <button type="button" onClick={addSlot}
            className="mt-2 flex items-center gap-1 text-sm text-maroon-600 hover:text-maroon-800 font-medium">
            <HiOutlinePlus className="w-4 h-4" /> Add another slot
          </button>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="label">Notes for TPO (optional)</label>
        <textarea
          className="input resize-none mt-1"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special requirements or instructions…"
        />
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={saving}>Submit Request</Button>
      </div>
    </form>
  );
};

/* ─── Existing schedule view ─── */
const ScheduleView = ({ schedule, onRefresh }) => {
  const { getToken } = useAuth();
  const [link, setLink]   = useState(schedule.examLink || '');
  const [saving, setSaving] = useState(false);
  const meta     = STATUS_META[schedule.status] || STATUS_META.REQUESTED;
  const isOnline = schedule.mode === 'ONLINE';
  const cutoff   = isWithinCutoff(schedule.confirmedSlot);

  const handleUpdateLink = async () => {
    if (!link.startsWith('http')) return toast.error('Enter a valid URL starting with http.');
    setSaving(true);
    try {
      const token = await getToken();
      await examAPI.updateLink(token, schedule.id, link);
      toast.success('Exam link updated. All parties notified.');
      onRefresh();
    } catch (e) {
      toast.error(e.message || 'Failed to update link.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Status + stepper */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs text-ink-400 uppercase tracking-wide font-semibold mb-1">Current Status</p>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </div>
          <div className="text-right text-xs text-ink-400 space-y-0.5">
            <p>Mode: <strong className="text-ink-700">{schedule.mode}</strong></p>
            <p>{schedule.shortlistedCount} student{schedule.shortlistedCount !== 1 ? 's' : ''} shortlisted</p>
          </div>
        </div>
        {schedule.status !== 'CANCELLED' && (
          <StepBar status={schedule.status} />
        )}
      </div>

      {/* Proposed slots */}
      <div className="card p-5">
        <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3 flex items-center gap-1">
          <HiOutlineCalendar className="w-3.5 h-3.5" /> Proposed Slots
        </p>
        <ul className="space-y-1.5">
          {(schedule.proposedSlots || []).map((sl, i) => {
            const isConfirmed = schedule.confirmedSlot?.date === sl.date && schedule.confirmedSlot?.startTime === sl.startTime;
            return (
              <li key={i} className={`flex items-center gap-2 text-sm px-3 py-2 rounded-lg
                ${isConfirmed ? 'bg-emerald-50 border border-emerald-200' : 'bg-cream-50'}`}>
                <HiOutlineClock className={`w-4 h-4 flex-shrink-0 ${isConfirmed ? 'text-emerald-600' : 'text-ink-400'}`} />
                <span className={isConfirmed ? 'font-semibold text-emerald-700' : 'text-ink-700'}>
                  {fmtSlot(sl)}
                </span>
                {isConfirmed && (
                  <span className="ml-auto text-xs font-medium text-emerald-600 flex items-center gap-0.5">
                    <HiOutlineCheckCircle className="w-3.5 h-3.5" /> Confirmed
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Faculty confirmations */}
      {Object.keys(schedule.facultyConfirmations || {}).length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Faculty Confirmations</p>
          <ul className="space-y-2">
            {Object.entries(schedule.facultyConfirmations).map(([schoolId, fc]) => (
              <li key={schoolId} className="text-sm bg-cream-50 rounded-lg px-3 py-2">
                <span className="font-medium text-ink-700">{fc.facultyName}</span>
                <span className="text-ink-400 mx-1">·</span>
                <span className="text-ink-600">{fmtSlot(fc.confirmedSlot)}</span>
                {fc.note && <p className="text-xs text-ink-400 mt-0.5">"{fc.note}"</p>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* FINALIZED details */}
      {schedule.status === 'FINALIZED' && (
        <div className="card p-5 space-y-4 border-l-4 border-l-emerald-500">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Finalised Details</p>
          <p className="text-sm font-medium text-ink-800">
            <HiOutlineCalendar className="inline w-4 h-4 mr-1 text-maroon-600" />
            {fmtSlot(schedule.confirmedSlot)}
          </p>

          {isOnline ? (
            <div className="space-y-2">
              <p className="text-xs text-ink-400 font-medium">Exam Link</p>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://your-exam-platform.com/link"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  disabled={cutoff}
                  className="input flex-1 text-sm"
                />
                <Button
                  size="sm"
                  onClick={handleUpdateLink}
                  loading={saving}
                  disabled={cutoff || !link}
                >
                  <HiOutlineExternalLink className="w-4 h-4 mr-1" />
                  {schedule.examLink ? 'Update' : 'Set Link'}
                </Button>
              </div>
              {cutoff && (
                <p className="text-xs text-red-500">Link cannot be changed within 1 hour of the exam.</p>
              )}
              {!cutoff && schedule.examLink && (
                <p className="text-xs text-ink-400">Current link: <a href={schedule.examLink} target="_blank" rel="noreferrer" className="text-maroon-600 underline">{schedule.examLink}</a></p>
              )}
            </div>
          ) : (
            schedule.venue ? (
              <div className="bg-cream-50 rounded-lg px-3 py-2 text-sm">
                <p className="font-medium text-ink-700"><HiOutlineOfficeBuilding className="inline w-4 h-4 mr-1" />{schedule.venue}</p>
                {schedule.venueInstructions && <p className="text-ink-500 mt-1">{schedule.venueInstructions}</p>}
              </div>
            ) : (
              <p className="text-sm text-ink-400 italic">Venue will be assigned by TPO.</p>
            )
          )}

          {schedule.tpoNote && (
            <p className="text-xs text-ink-500 bg-cream-50 rounded-lg px-3 py-2">
              <strong>TPO Note:</strong> {schedule.tpoNote}
            </p>
          )}
        </div>
      )}

      {schedule.status === 'CANCELLED' && schedule.cancellationReason && (
        <div className="card p-4 border-l-4 border-l-red-400 bg-red-50">
          <p className="text-sm text-red-700"><strong>Cancellation reason:</strong> {schedule.cancellationReason}</p>
        </div>
      )}
    </div>
  );
};

/* ─── Main page ─── */
const ExamSchedulePage = () => {
  const { jobId }     = useParams();
  const { getToken }  = useAuth();
  const [job, setJob]           = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading]   = useState(true);

  const fetchAll = useCallback(async () => {
    try {
      const token = await getToken();
      const [jobRes] = await Promise.all([jobAPI.get(token, jobId)]);
      setJob(jobRes.data);
      try {
        const schedRes = await examAPI.getByJob(token, jobId);
        setSchedule(schedRes.data);
      } catch (e) {
        if (e.status !== 404) throw e;
        setSchedule(null);
      }
    } catch (e) {
      toast.error(e.message || 'Failed to load page.');
    } finally {
      setLoading(false);
    }
  }, [jobId, getToken]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <Link
        to={`/company/jobs/${jobId}/applicants`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-maroon-600 transition-colors"
      >
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to Applicants
      </Link>

      <PageHeader
        title={job ? `Exam Scheduling — ${job.title}` : 'Exam Scheduling'}
        subtitle={schedule
          ? `Status: ${STATUS_META[schedule.status]?.label || schedule.status}`
          : 'Submit proposed dates — TPO will coordinate with faculty'}
      />

      {schedule ? (
        <ScheduleView schedule={schedule} onRefresh={fetchAll} />
      ) : (
        <RequestForm jobId={jobId} onSuccess={(s) => setSchedule(s)} />
      )}
    </div>
  );
};

export default ExamSchedulePage;
