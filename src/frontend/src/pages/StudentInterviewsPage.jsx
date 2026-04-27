import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { interviewAPI } from '../services/api';
import { Badge, PageHeader } from '../components/ui';
import toast from 'react-hot-toast';
import {
  HiOutlineCalendar, HiOutlineClock, HiOutlineLink,
  HiOutlineOfficeBuilding, HiOutlineVideoCamera, HiOutlineExternalLink,
} from 'react-icons/hi';

/* ─── Join button logic ─── */
function getJoinState(date, startTime, endTime) {
  if (!date || !startTime || !endTime) return 'upcoming';
  const start = new Date(`${date}T${startTime}:00+05:30`);
  const end   = new Date(`${date}T${endTime}:00+05:30`);
  const now   = Date.now();
  if (now > end.getTime()) return 'past';
  if (now >= start.getTime() - 5 * 60 * 1000) return 'active'; // 5 min before start
  return 'upcoming';
}

function formatCountdown(date, startTime) {
  if (!date || !startTime) return '';
  const start = new Date(`${date}T${startTime}:00+05:30`);
  const diff  = start.getTime() - Date.now();
  if (diff <= 0) return 'Now';

  const totalMins = Math.floor(diff / 60000);
  const days  = Math.floor(totalMins / 1440);
  const hrs   = Math.floor((totalMins % 1440) / 60);
  const mins  = totalMins % 60;

  if (days > 0)  return `${days}d ${hrs}h`;
  if (hrs > 0)   return `${hrs}h ${mins}m`;
  return `${mins}m`;
}

/* ─── Countdown hook (re-renders every 30s) ─── */
function useNow() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30000);
    return () => clearInterval(id);
  }, []);
}

/* ─── Interview Card ─── */
const InterviewCard = ({ item, isPast }) => {
  useNow();

  const joinState = getJoinState(item.date, item.startTime, item.endTime);
  const countdown = formatCountdown(item.date, item.startTime);
  const link      = item.link;
  const isOnline  = item.mode === 'ONLINE';

  return (
    <div className={`card p-5 space-y-4 transition-opacity ${isPast ? 'opacity-60' : ''}`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <p className="font-semibold text-ink-800 truncate">{item.jobTitle}</p>
          <p className="text-xs text-ink-500 truncate">{item.companyName}</p>
        </div>
        {isPast ? (
          <Badge variant="neutral">Completed</Badge>
        ) : joinState === 'active' ? (
          <Badge variant="success">Live Now</Badge>
        ) : (
          <Badge variant="warning">Upcoming</Badge>
        )}
      </div>

      {/* Slot details */}
      <div className="bg-cream-50 border border-ink-100 rounded-xl p-3 grid grid-cols-2 gap-3 text-xs">
        <div>
          <p className="text-ink-500 mb-0.5">Date</p>
          <p className="font-semibold text-ink-800 flex items-center gap-1">
            <HiOutlineCalendar className="w-3.5 h-3.5" /> {item.date}
          </p>
        </div>
        <div>
          <p className="text-ink-500 mb-0.5">Your Slot</p>
          <p className="font-semibold text-ink-800 flex items-center gap-1">
            <HiOutlineClock className="w-3.5 h-3.5" /> {item.startTime} – {item.endTime}
          </p>
        </div>
        <div>
          <p className="text-ink-500 mb-0.5">Mode</p>
          <p className="font-semibold text-ink-800">{item.mode}</p>
        </div>
        <div>
          <p className="text-ink-500 mb-0.5">Duration</p>
          <p className="font-semibold text-ink-800">{item.duration} min</p>
        </div>
      </div>

      {/* Online interview section */}
      {isOnline && (
        <div className="space-y-2">
          {link ? (
            <>
              {/* Join button — only active 5 min before slot, deactivated after end */}
              {!isPast && (
                joinState === 'active' ? (
                  <a href={link} target="_blank" rel="noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-xl py-3 transition-colors animate-pulse">
                    <HiOutlineVideoCamera className="w-5 h-5" />
                    Join Interview Now
                  </a>
                ) : (
                  <div className="flex items-center justify-between bg-ink-50 border border-ink-200 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-xs text-ink-500">Join opens 5 min before your slot</p>
                      <p className="text-sm font-semibold text-ink-800">
                        Starts in: <span className={countdown === 'Now' ? 'text-green-600' : 'text-maroon-600'}>{countdown}</span>
                      </p>
                    </div>
                    <button disabled
                      className="flex items-center gap-1.5 text-sm font-semibold bg-ink-200 text-ink-500 rounded-xl px-4 py-2 cursor-not-allowed opacity-60">
                      <HiOutlineVideoCamera className="w-4 h-4" />
                      Join
                    </button>
                  </div>
                )
              )}
              {/* Always show link as reference */}
              <a href={link} target="_blank" rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-maroon-600 hover:text-maroon-800">
                <HiOutlineExternalLink className="w-3.5 h-3.5" /> {link.length > 50 ? link.slice(0, 50) + '…' : link}
              </a>
            </>
          ) : (
            <div className="flex items-center gap-2 text-xs text-ink-500 bg-ink-50 rounded-xl px-3 py-2.5">
              <HiOutlineLink className="w-4 h-4" />
              Meeting link will be shared by the company before the interview.
            </div>
          )}
        </div>
      )}

      {/* Offline interview section */}
      {!isOnline && (
        <div className="space-y-2">
          {item.venue ? (
            <div className="bg-cream-50 border border-ink-100 rounded-xl p-3">
              <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide flex items-center gap-1 mb-1">
                <HiOutlineOfficeBuilding className="w-3.5 h-3.5" /> Venue
              </p>
              <p className="text-sm font-semibold text-ink-800">{item.venue}</p>
              {item.venueInstructions && (
                <p className="text-xs text-ink-500 mt-1">{item.venueInstructions}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-ink-500 bg-ink-50 rounded-xl px-3 py-2.5">
              <HiOutlineOfficeBuilding className="w-4 h-4" />
              Venue details will be shared soon.
            </div>
          )}
        </div>
      )}

      {/* Countdown badge (not past, not active) */}
      {!isPast && joinState === 'upcoming' && (
        <div className="text-center">
          <span className="text-xs text-ink-500">
            Time until your slot: <strong className="text-maroon-600">{countdown}</strong>
          </span>
        </div>
      )}
    </div>
  );
};

/* ─── Slot picker for STUDENT_CHOICE ─── */
const SlotPicker = ({ scheduleId, getToken, onBooked }) => {
  const [slots, setSlots]         = useState([]);
  const [loading, setLoading]     = useState(true);
  const [booking, setBooking]     = useState(null);
  const [myBooking, setMyBooking] = useState(null);

  const fetchSlots = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await interviewAPI.listSlots(token, scheduleId);
      const all = res.data || [];
      setMyBooking(all.find((s) => s.status === 'BOOKED' && s.assignedStudentId) || null);
      setSlots(all);
    } catch (err) {
      toast.error(err.message || 'Failed to load slots.');
    } finally {
      setLoading(false);
    }
  }, [scheduleId, getToken]);

  useEffect(() => { fetchSlots(); }, [fetchSlots]);

  const handleBook = async (slotId) => {
    setBooking(slotId);
    try {
      const token = await getToken();
      await interviewAPI.bookSlot(token, slotId);
      toast.success('Slot booked successfully!');
      await fetchSlots();
      onBooked();
    } catch (err) {
      toast.error(err.message || 'Failed to book slot.');
    } finally {
      setBooking(null);
    }
  };

  const handleCancel = async (slotId) => {
    setBooking(slotId);
    try {
      const token = await getToken();
      await interviewAPI.cancelSlot(token, slotId);
      toast.success('Booking cancelled.');
      await fetchSlots();
      onBooked();
    } catch (err) {
      toast.error(err.message || 'Failed to cancel booking.');
    } finally {
      setBooking(null);
    }
  };

  if (loading) return <div className="text-xs text-ink-400 py-2">Loading slots…</div>;

  const available = slots.filter((s) => s.status === 'AVAILABLE');

  return (
    <div className="card p-5 space-y-3">
      <p className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Pick Your Interview Slot</p>
      {myBooking ? (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-green-800">Booked: {myBooking.startTime} – {myBooking.endTime}</p>
            <p className="text-xs text-green-600 mt-0.5">You can cancel up to 2 hours before your slot.</p>
          </div>
          <button onClick={() => handleCancel(myBooking.id)} disabled={booking === myBooking.id}
            className="text-xs text-red-600 border border-red-200 rounded-lg px-3 py-1.5 hover:bg-red-50 disabled:opacity-50">
            {booking === myBooking.id ? '…' : 'Cancel'}
          </button>
        </div>
      ) : available.length === 0 ? (
        <p className="text-sm text-ink-500">No available slots remaining.</p>
      ) : (
        <div className="space-y-2">
          {available.map((slot) => (
            <div key={slot.id} className="flex items-center justify-between border border-ink-100 rounded-xl px-3 py-2.5">
              <span className="text-sm font-medium text-ink-800 flex items-center gap-1.5">
                <HiOutlineClock className="w-4 h-4 text-ink-400" />
                {slot.startTime} – {slot.endTime}
              </span>
              <button onClick={() => handleBook(slot.id)} disabled={!!booking}
                className="text-xs bg-maroon-600 hover:bg-maroon-700 text-white rounded-lg px-3 py-1.5 disabled:opacity-50">
                {booking === slot.id ? '…' : 'Book'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ─── Main Page ─── */
const StudentInterviewsPage = () => {
  const { getToken } = useAuth();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [openSchedules, setOpenSchedules] = useState([]);

  const fetchAll = async () => {
    try {
      const token = await getToken();
      const [myRes] = await Promise.all([interviewAPI.myInterviews(token)]);
      setInterviews(myRes.data || []);

      // Fetch SCHEDULED schedules where student is eligible but has no slot yet
      // (STUDENT_CHOICE mode, no booking)
      // We detect this by querying schedules — simplified: check for schedules in listSlots
      // For simplicity, we'll call list and filter SCHEDULED ones where we're eligible
      try {
        const schedRes = await fetch(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5001/api'}/interview-schedules`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (schedRes.ok) {
          const schedData = await schedRes.json();
          const open = (schedData.data || []).filter(
            (s) => s.status === 'SCHEDULED' && s.allocationMode === 'STUDENT_CHOICE'
          );
          setOpenSchedules(open);
        }
      } catch { /* best-effort */ }
    } catch (err) {
      toast.error(err.message || 'Failed to load interviews.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const now = Date.now();
  const upcoming = interviews.filter((i) => {
    const end = new Date(`${i.date}T${i.endTime}:00+05:30`);
    return end.getTime() > now;
  });
  const past = interviews.filter((i) => {
    const end = new Date(`${i.date}T${i.endTime}:00+05:30`);
    return end.getTime() <= now;
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
        title="My Interviews"
        subtitle={`${upcoming.length} upcoming · ${past.length} past`}
      />

      {/* Slot pickers for open STUDENT_CHOICE schedules */}
      {openSchedules.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-ink-700">Open for Booking</p>
          {openSchedules.map((s) => (
            <div key={s.id} className="space-y-2">
              <p className="text-xs text-ink-500 px-1">{s.jobTitle} — {s.companyName} · {s.interviewDate}</p>
              <SlotPicker scheduleId={s.id} getToken={getToken} onBooked={fetchAll} />
            </div>
          ))}
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-ink-700">Upcoming</p>
          {upcoming.map((item) => (
            <InterviewCard key={item.slotId} item={item} isPast={false} />
          ))}
        </div>
      )}

      {/* Past */}
      {past.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-ink-400">Past</p>
          {past.map((item) => (
            <InterviewCard key={item.slotId} item={item} isPast={true} />
          ))}
        </div>
      )}

      {interviews.length === 0 && openSchedules.length === 0 && (
        <div className="card p-12 text-center">
          <HiOutlineCalendar className="w-10 h-10 text-ink-300 mx-auto mb-3" />
          <p className="text-ink-500 font-medium">No interviews scheduled yet.</p>
          <p className="text-xs text-ink-400 mt-1">Check back after you have been selected for an interview.</p>
        </div>
      )}
    </div>
  );
};

export default StudentInterviewsPage;
