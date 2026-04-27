import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { interviewAPI } from '../services/api';
import { Badge, PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineArrowLeft, HiOutlineCalendar, HiOutlineClock,
  HiOutlineLink, HiOutlineOfficeBuilding, HiOutlineCheckCircle,
  HiOutlineExternalLink, HiOutlineRefresh,
} from 'react-icons/hi';

/* ─── Status helpers ─── */
const STATUS_STEPS = ['REQUESTED', 'FORWARDED_TO_FACULTY', 'FACULTY_CONFIRMED', 'SCHEDULED'];

const STATUS_LABEL = {
  REQUESTED:            'Submitted',
  FORWARDED_TO_FACULTY: 'Sent to Faculty',
  FACULTY_CONFIRMED:    'Faculty Confirmed',
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

/* ─── Step progress bar ─── */
const StepBar = ({ status }) => {
  const steps = ['Submitted', 'Sent to Faculty', 'Faculty Confirmed', 'Scheduled'];
  const idx   = STATUS_STEPS.indexOf(status);
  const live  = ['LIVE', 'COMPLETED'].includes(status) ? 3 : idx;

  return (
    <div className="flex items-center gap-0 w-full">
      {steps.map((label, i) => (
        <div key={label} className="flex items-center flex-1 min-w-0">
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
              i <= live
                ? 'bg-maroon-600 border-maroon-600 text-white'
                : 'bg-white border-ink-200 text-ink-400'
            }`}>
              {i <= live ? <HiOutlineCheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className="text-[10px] text-ink-500 mt-1 text-center leading-tight hidden sm:block">{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-1 ${i < live ? 'bg-maroon-600' : 'bg-ink-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
};

/* ─── Today + 1 day as min date ─── */
const minDate = () => {
  const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
  return d.toISOString().split('T')[0];
};

/* ─── Request Form ─── */
const RequestForm = ({ jobId, getToken, onCreated }) => {
  const [mode, setMode]           = useState('ONLINE');
  const [date, setDate]           = useState('');
  const [winStart, setWinStart]   = useState('09:00');
  const [winEnd, setWinEnd]       = useState('17:00');
  const [duration, setDuration]   = useState(30);
  const [breakMins, setBreakMins] = useState(5);
  const [allocMode, setAllocMode] = useState('AUTO');
  const [linkType, setLinkType]   = useState('COMMON');
  const [notes, setNotes]         = useState('');
  const [submitting, setSubmitting] = useState(false);

  const expectedSlots = (() => {
    if (!winStart || !winEnd || !duration) return 0;
    const [sh, sm] = winStart.split(':').map(Number);
    const [eh, em] = winEnd.split(':').map(Number);
    let cur = sh * 60 + sm;
    const end = eh * 60 + em;
    let count = 0;
    while (cur + duration <= end) { count++; cur += duration + breakMins; }
    return count;
  })();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!date) { toast.error('Please select an interview date.'); return; }
    if (winStart >= winEnd) { toast.error('Window end must be after window start.'); return; }
    if (expectedSlots === 0) { toast.error('Window too short — cannot fit any slots.'); return; }
    setSubmitting(true);
    try {
      const token = await getToken();
      const res = await interviewAPI.request(token, jobId, {
        mode, interviewDate: date, windowStart: winStart, windowEnd: winEnd,
        duration, breakBetweenSlots: breakMins, allocationMode: allocMode,
        linkType: mode === 'ONLINE' ? linkType : undefined, notes,
      });
      toast.success('Interview request submitted!');
      onCreated(res.data);
    } catch (err) {
      toast.error(err.message || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-6">
      <h2 className="text-base font-semibold text-ink-800">Request Interview Schedule</h2>

      {/* Mode */}
      <div>
        <label className="block text-xs font-medium text-ink-600 mb-2">Interview Mode</label>
        <div className="flex gap-3">
          {['ONLINE', 'OFFLINE'].map((m) => (
            <button key={m} type="button"
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                mode === m
                  ? 'bg-maroon-600 border-maroon-600 text-white'
                  : 'bg-white border-ink-200 text-ink-500 hover:border-maroon-300'
              }`}>
              {m === 'ONLINE' ? '🌐 Online' : '🏢 Offline'}
            </button>
          ))}
        </div>
      </div>

      {/* Date + Window */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">Interview Date</label>
          <input type="date" value={date} min={minDate()} onChange={(e) => setDate(e.target.value)}
            className="input w-full" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">Window Start</label>
          <input type="time" value={winStart} onChange={(e) => setWinStart(e.target.value)}
            className="input w-full" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">Window End</label>
          <input type="time" value={winEnd} onChange={(e) => setWinEnd(e.target.value)}
            className="input w-full" required />
        </div>
      </div>

      {/* Duration + Break */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">Duration per slot (mins)</label>
          <input type="number" value={duration} min={15} max={240} step={5}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="input w-full" required />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-1">Break between slots (mins)</label>
          <input type="number" value={breakMins} min={0} max={30} step={5}
            onChange={(e) => setBreakMins(Number(e.target.value))}
            className="input w-full" />
        </div>
      </div>

      {/* Slot preview */}
      {expectedSlots > 0 && (
        <div className="bg-cream-50 border border-ink-100 rounded-xl p-3 text-sm text-ink-600">
          <HiOutlineClock className="w-4 h-4 inline mr-1.5 text-maroon-600" />
          {expectedSlots} interview slot{expectedSlots !== 1 ? 's' : ''} will be generated
        </div>
      )}

      {/* Allocation */}
      <div>
        <label className="block text-xs font-medium text-ink-600 mb-2">Slot Allocation</label>
        <div className="flex gap-3">
          {[
            { val: 'AUTO',           label: '⚡ Auto-assign students' },
            { val: 'STUDENT_CHOICE', label: '🙋 Students pick slots' },
          ].map(({ val, label }) => (
            <button key={val} type="button"
              onClick={() => setAllocMode(val)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                allocMode === val
                  ? 'bg-maroon-600 border-maroon-600 text-white'
                  : 'bg-white border-ink-200 text-ink-500 hover:border-maroon-300'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Link type (ONLINE only) */}
      {mode === 'ONLINE' && (
        <div>
          <label className="block text-xs font-medium text-ink-600 mb-2">Meeting Link Type</label>
          <div className="flex gap-3">
            {[
              { val: 'COMMON',   label: '🔗 One link for all' },
              { val: 'PER_SLOT', label: '🔐 Unique per slot' },
            ].map(({ val, label }) => (
              <button key={val} type="button"
                onClick={() => setLinkType(val)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                  linkType === val
                    ? 'bg-maroon-600 border-maroon-600 text-white'
                    : 'bg-white border-ink-200 text-ink-500 hover:border-maroon-300'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-ink-600 mb-1">Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          rows={2} placeholder="Any additional instructions for the TPO..."
          className="input w-full resize-none" />
      </div>

      <button type="submit" disabled={submitting}
        className="btn-primary w-full disabled:opacity-50">
        {submitting ? 'Submitting…' : 'Submit Interview Request'}
      </button>
    </form>
  );
};

/* ─── Schedule view (after request created) ─── */
const ScheduleView = ({ schedule, getToken, onRefresh }) => {
  const [commonLink, setCommonLink]     = useState(schedule.commonLink || '');
  const [updatingLink, setUpdatingLink] = useState(false);
  const [slots, setSlots]               = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const firstSlotDt = schedule.interviewDate && schedule.windowStart
    ? new Date(`${schedule.interviewDate}T${schedule.windowStart}:00+05:30`)
    : null;
  const linkCutoffPassed = firstSlotDt
    ? Date.now() >= firstSlotDt.getTime() - 60 * 60 * 1000
    : false;

  useEffect(() => {
    if (['SCHEDULED', 'LIVE', 'COMPLETED'].includes(schedule.status)) {
      setLoadingSlots(true);
      getToken().then((token) =>
        interviewAPI.listSlots(token, schedule.id)
          .then((r) => setSlots(r.data || []))
          .catch(() => {})
          .finally(() => setLoadingSlots(false))
      );
    }
  }, [schedule.id, schedule.status]);

  const handleUpdateLink = async () => {
    if (!commonLink.startsWith('http')) { toast.error('Enter a valid URL.'); return; }
    setUpdatingLink(true);
    try {
      const token = await getToken();
      await interviewAPI.updateCommonLink(token, schedule.id, commonLink);
      toast.success('Meeting link updated!');
      onRefresh();
    } catch (err) {
      toast.error(err.message || 'Failed to update link.');
    } finally {
      setUpdatingLink(false);
    }
  };

  const handleSlotLink = async (slotId, link) => {
    if (!link.startsWith('http')) { toast.error('Enter a valid URL.'); return; }
    try {
      const token = await getToken();
      await interviewAPI.updateSlotLink(token, slotId, link);
      toast.success('Slot link updated!');
      const r = await interviewAPI.listSlots(token, schedule.id);
      setSlots(r.data || []);
    } catch (err) {
      toast.error(err.message || 'Failed to update slot link.');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header card */}
      <div className="card p-6 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-ink-500 uppercase tracking-wide font-semibold mb-1">Interview Schedule</p>
            <p className="font-semibold text-ink-800">{schedule.jobTitle}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={STATUS_VARIANT[schedule.status] || 'neutral'}>
              {STATUS_LABEL[schedule.status] || schedule.status}
            </Badge>
            <button onClick={onRefresh} className="text-ink-400 hover:text-maroon-600 transition-colors p-1">
              <HiOutlineRefresh className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!['CANCELLED', 'COMPLETED'].includes(schedule.status) && (
          <StepBar status={schedule.status} />
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-cream-50 rounded-xl p-3 border border-ink-100">
            <p className="text-ink-500 mb-0.5">Date</p>
            <p className="font-semibold text-ink-800">{schedule.interviewDate}</p>
          </div>
          <div className="bg-cream-50 rounded-xl p-3 border border-ink-100">
            <p className="text-ink-500 mb-0.5">Window</p>
            <p className="font-semibold text-ink-800">{schedule.windowStart}–{schedule.windowEnd}</p>
          </div>
          <div className="bg-cream-50 rounded-xl p-3 border border-ink-100">
            <p className="text-ink-500 mb-0.5">Duration</p>
            <p className="font-semibold text-ink-800">{schedule.duration} min / slot</p>
          </div>
          <div className="bg-cream-50 rounded-xl p-3 border border-ink-100">
            <p className="text-ink-500 mb-0.5">Students</p>
            <p className="font-semibold text-ink-800">{schedule.eligibleCount} eligible</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-ink-500">
          <span className="bg-ink-100 rounded-lg px-2 py-1">{schedule.mode}</span>
          <span className="bg-ink-100 rounded-lg px-2 py-1">{schedule.allocationMode?.replace('_', ' ')}</span>
          {schedule.linkType && <span className="bg-ink-100 rounded-lg px-2 py-1">{schedule.linkType?.replace('_', ' ')} link</span>}
          <span className="bg-ink-100 rounded-lg px-2 py-1">{schedule.totalSlots} slots</span>
        </div>
      </div>

      {/* Faculty confirmations */}
      {Object.keys(schedule.facultyConfirmations || {}).length > 0 && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">Faculty Confirmations</p>
          <div className="space-y-2">
            {Object.entries(schedule.facultyConfirmations).map(([schoolId, conf]) => (
              <div key={schoolId} className="flex items-center justify-between bg-cream-50 border border-ink-100 rounded-xl px-3 py-2">
                <div>
                  <p className="text-xs font-semibold text-ink-700">{conf.facultyName}</p>
                  <p className="text-xs text-ink-400">{schoolId}</p>
                </div>
                <Badge variant="success">Confirmed</Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* COMMON link management */}
      {schedule.mode === 'ONLINE' && schedule.linkType === 'COMMON' &&
        ['SCHEDULED', 'LIVE'].includes(schedule.status) && (
        <div className="card p-5 space-y-3">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide flex items-center gap-1.5">
            <HiOutlineLink className="w-3.5 h-3.5" /> Meeting Link (Common)
          </p>
          {linkCutoffPassed ? (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              Link update window closed (within 1 hour of first slot).
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                type="url"
                value={commonLink}
                onChange={(e) => setCommonLink(e.target.value)}
                placeholder="https://meet.google.com/…"
                className="input flex-1 text-sm"
              />
              <button onClick={handleUpdateLink} disabled={updatingLink}
                className="btn-primary text-sm px-4 disabled:opacity-50">
                {updatingLink ? '…' : 'Save'}
              </button>
            </div>
          )}
          {schedule.commonLink && (
            <a href={schedule.commonLink} target="_blank" rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-maroon-600 hover:text-maroon-800">
              <HiOutlineExternalLink className="w-3.5 h-3.5" /> Open link
            </a>
          )}
        </div>
      )}

      {/* Offline venue */}
      {schedule.mode === 'OFFLINE' && schedule.venue && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <HiOutlineOfficeBuilding className="w-3.5 h-3.5" /> Venue
          </p>
          <p className="text-sm font-semibold text-ink-800">{schedule.venue}</p>
          {schedule.venueInstructions && (
            <p className="text-xs text-ink-500 mt-1">{schedule.venueInstructions}</p>
          )}
        </div>
      )}

      {/* Slots list (SCHEDULED / LIVE / COMPLETED) */}
      {['SCHEDULED', 'LIVE', 'COMPLETED'].includes(schedule.status) && (
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide mb-3">
            Interview Slots ({slots.length})
          </p>
          {loadingSlots ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-2">
              {slots.map((slot) => (
                <SlotRow
                  key={slot.id}
                  slot={slot}
                  isPERSlot={schedule.linkType === 'PER_SLOT' && schedule.mode === 'ONLINE'}
                  linkCutoffPassed={Date.now() >= new Date(`${slot.date}T${slot.startTime}:00+05:30`).getTime() - 60 * 60 * 1000}
                  onUpdateLink={handleSlotLink}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Slot row for company view ─── */
const SlotRow = ({ slot, isPERSlot, linkCutoffPassed, onUpdateLink }) => {
  const [link, setLink] = useState(slot.link || '');
  const [editing, setEditing] = useState(false);

  const statusColor = {
    AVAILABLE: 'bg-ink-100 text-ink-500',
    BOOKED:    'bg-green-100 text-green-700',
    COMPLETED: 'bg-blue-100 text-blue-700',
    CANCELLED: 'bg-red-100 text-red-600',
  }[slot.status] || 'bg-ink-100 text-ink-500';

  return (
    <div className="border border-ink-100 rounded-xl p-3 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <HiOutlineClock className="w-4 h-4 text-ink-400" />
          <span className="text-sm font-semibold text-ink-800">{slot.startTime} – {slot.endTime}</span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor}`}>
            {slot.status}
          </span>
        </div>
        {slot.assignedStudentName && (
          <span className="text-xs text-ink-600">{slot.assignedStudentName}</span>
        )}
      </div>

      {isPERSlot && slot.status === 'BOOKED' && !linkCutoffPassed && (
        <div className="flex gap-2">
          {editing ? (
            <>
              <input type="url" value={link} onChange={(e) => setLink(e.target.value)}
                placeholder="https://meet.google.com/…" className="input text-xs flex-1" />
              <button onClick={() => { onUpdateLink(slot.id, link); setEditing(false); }}
                className="text-xs bg-maroon-600 text-white rounded-lg px-3 py-1.5">Save</button>
              <button onClick={() => setEditing(false)} className="text-xs text-ink-500 px-2">✕</button>
            </>
          ) : (
            <button onClick={() => setEditing(true)}
              className="text-xs text-maroon-600 border border-maroon-200 rounded-lg px-2.5 py-1 hover:bg-maroon-50 flex items-center gap-1">
              <HiOutlineLink className="w-3.5 h-3.5" />
              {slot.link ? 'Update Link' : 'Add Link'}
            </button>
          )}
          {slot.link && !editing && (
            <a href={slot.link} target="_blank" rel="noreferrer"
              className="text-xs text-ink-400 hover:text-maroon-600 flex items-center gap-1">
              <HiOutlineExternalLink className="w-3.5 h-3.5" /> Open
            </a>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ─── */
const InterviewRequestPage = () => {
  const { id: jobId } = useParams();
  const { getToken }  = useAuth();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading]   = useState(true);

  const fetchSchedule = async () => {
    try {
      const token = await getToken();
      const res = await interviewAPI.getByJob(token, jobId);
      setSchedule(res.data);
    } catch (err) {
      if (err.status !== 404) toast.error(err.message || 'Failed to load schedule.');
      setSchedule(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSchedule(); }, [jobId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-maroon-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-slide-up">
      <Link to={`/company/jobs/${jobId}/applicants`}
        className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-maroon-600 transition-colors">
        <HiOutlineArrowLeft className="w-4 h-4" /> Back to applicants
      </Link>

      <PageHeader
        title="Interview Scheduling"
        subtitle={schedule ? `Status: ${STATUS_LABEL[schedule.status]}` : 'No active schedule — create one below'}
      />

      {schedule ? (
        <ScheduleView
          schedule={schedule}
          getToken={getToken}
          onRefresh={fetchSchedule}
        />
      ) : (
        <RequestForm jobId={jobId} getToken={getToken} onCreated={(s) => setSchedule(s)} />
      )}
    </div>
  );
};

export default InterviewRequestPage;
