/**
 * Interview Schedule Controller
 * ──────────────────────────────────────────────────────────────────────────────
 * POST   /api/jobs/:jobId/interview-request              — company requests interviews
 * GET    /api/jobs/:jobId/interview-schedule             — get schedule for a job
 * PATCH  /api/interview-schedules/:id/forward            — TPO forwards to faculty
 * PATCH  /api/interview-schedules/:id/faculty-confirm    — faculty confirms availability
 * PATCH  /api/interview-schedules/:id/schedule           — TPO finalises + generates slots
 * PATCH  /api/interview-schedules/:id/common-link        — company sets/updates common link
 * PATCH  /api/interview-schedules/:id/cancel             — TPO/Admin cancels
 * PATCH  /api/interview-schedules/:id/complete           — TPO/Admin marks completed
 * GET    /api/interview-schedules                        — list (role-scoped)
 * GET    /api/interview-schedules/:id                    — single schedule
 * GET    /api/interview-schedules/:id/slots              — list slots (role-scoped)
 * PATCH  /api/interview-slots/:slotId/link               — company updates per-slot link
 * POST   /api/interview-slots/:slotId/book               — student books a slot
 * DELETE /api/interview-slots/:slotId/book               — student cancels booking
 * GET    /api/my-interviews                              — student: their assigned slot
 */

const { db } = require('../config/firebase');
const {
  COLLECTIONS, ROLES, APPLICATION_STATUS,
  INTERVIEW_STATUS, INTERVIEW_MODE, ALLOCATION_MODE, LINK_TYPE, SLOT_STATUS, AUDIT_ACTION,
} = require('../config/constants');
const { log: auditLog } = require('../services/auditLogger');
const email = require('../services/emailService');

/* ──────────── helpers ──────────── */

function writeNotification(recipientId, { type, title, body, interviewScheduleId, jobId }) {
  return db.collection(COLLECTIONS.NOTIFICATIONS).add({
    recipientId,
    type,
    title,
    body:                body || '',
    interviewScheduleId: interviewScheduleId || null,
    jobId:               jobId || null,
    read:                false,
    createdAt:           new Date().toISOString(),
  });
}

async function notifyTPOs(notif) {
  const snap = await db.collection(COLLECTIONS.USERS).where('role', '==', ROLES.TPO).get();
  await Promise.all(snap.docs.map((d) => writeNotification(d.id, notif)));
  return snap.docs.map((d) => d.data().email).filter(Boolean);
}

async function notifyFacultyOfSchools(schoolIds, notif) {
  const emails = [];
  for (let i = 0; i < schoolIds.length; i += 30) {
    const chunk = schoolIds.slice(i, i + 30);
    const facSnap = await db.collection(COLLECTIONS.FACULTY_PROFILES)
      .where('schoolId', 'in', chunk).get();
    const ids = facSnap.docs.map((d) => d.id);
    if (!ids.length) continue;

    await Promise.all(ids.map((fid) => writeNotification(fid, notif)));

    const userChunks = [];
    for (let j = 0; j < ids.length; j += 30) userChunks.push(ids.slice(j, j + 30));
    for (const uc of userChunks) {
      const uSnap = await db.collection(COLLECTIONS.USERS).where('__name__', 'in', uc).get();
      uSnap.docs.forEach((d) => {
        if (d.data().email) emails.push({ email: d.data().email, name: d.data().fullName });
      });
    }
  }
  return emails;
}

async function notifyStudents(studentIds, notif) {
  for (let i = 0; i < studentIds.length; i += 30) {
    const chunk = studentIds.slice(i, i + 30);
    await Promise.all(chunk.map((uid) => writeNotification(uid, notif)));
  }
}

/**
 * Generate time slots within a window.
 * Returns array of { startTime, endTime } strings (HH:MM).
 */
function generateTimeSlots(startTime, endTime, durationMins, breakMins) {
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let cur = sh * 60 + sm;
  const endTotal = eh * 60 + em;
  const slots = [];

  while (cur + durationMins <= endTotal) {
    const s = `${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`;
    const e = `${String(Math.floor((cur + durationMins) / 60)).padStart(2, '0')}:${String((cur + durationMins) % 60).padStart(2, '0')}`;
    slots.push({ startTime: s, endTime: e });
    cur += durationMins + breakMins;
  }
  return slots;
}

/* ──────────── POST /api/jobs/:jobId/interview-request ──────────── */

const requestInterview = async (req, res) => {
  try {
    const uid   = req.user.uid;
    const jobId = req.params.jobId;
    const {
      mode, interviewDate, windowStart, windowEnd,
      duration, breakBetweenSlots, allocationMode, linkType, notes,
    } = req.body;

    if (!mode || !Object.values(INTERVIEW_MODE).includes(mode)) {
      return res.status(400).json({ success: false, message: 'mode must be ONLINE or OFFLINE.' });
    }
    if (!interviewDate || !/^\d{4}-\d{2}-\d{2}$/.test(interviewDate)) {
      return res.status(400).json({ success: false, message: 'interviewDate must be YYYY-MM-DD.' });
    }
    if (!windowStart || !windowEnd || !/^\d{2}:\d{2}$/.test(windowStart) || !/^\d{2}:\d{2}$/.test(windowEnd)) {
      return res.status(400).json({ success: false, message: 'windowStart and windowEnd must be HH:MM.' });
    }
    if (windowStart >= windowEnd) {
      return res.status(400).json({ success: false, message: 'windowEnd must be after windowStart.' });
    }
    if (!duration || typeof duration !== 'number' || duration < 15 || duration > 240) {
      return res.status(400).json({ success: false, message: 'duration must be between 15 and 240 minutes.' });
    }
    const breakMins = typeof breakBetweenSlots === 'number' ? breakBetweenSlots : 5;
    if (breakMins < 0 || breakMins > 30) {
      return res.status(400).json({ success: false, message: 'breakBetweenSlots must be 0–30 minutes.' });
    }
    if (!allocationMode || !Object.values(ALLOCATION_MODE).includes(allocationMode)) {
      return res.status(400).json({ success: false, message: 'allocationMode must be AUTO or STUDENT_CHOICE.' });
    }
    if (mode === INTERVIEW_MODE.ONLINE) {
      if (!linkType || !Object.values(LINK_TYPE).includes(linkType)) {
        return res.status(400).json({ success: false, message: 'linkType must be COMMON or PER_SLOT for ONLINE interviews.' });
      }
    }

    const interviewDt = new Date(`${interviewDate}T${windowStart}:00+05:30`);
    if (isNaN(interviewDt.getTime())) {
      return res.status(400).json({ success: false, message: 'Invalid interviewDate or windowStart.' });
    }
    if (interviewDt < new Date(Date.now() + 24 * 60 * 60 * 1000)) {
      return res.status(400).json({ success: false, message: 'Interview date must be at least 24 hours in the future.' });
    }

    const jobDoc = await db.collection(COLLECTIONS.JOBS).doc(jobId).get();
    if (!jobDoc.exists || jobDoc.data().companyId !== uid) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }
    const job = jobDoc.data();

    // Block duplicate active schedule
    const existSnap = await db.collection(COLLECTIONS.INTERVIEW_SCHEDULES)
      .where('jobId', '==', jobId).where('companyId', '==', uid).get();
    const active = existSnap.docs.find((d) =>
      ![INTERVIEW_STATUS.CANCELLED, INTERVIEW_STATUS.COMPLETED].includes(d.data().status)
    );
    if (active) {
      return res.status(409).json({
        success: false,
        message: 'An active interview schedule already exists for this job.',
        data: { id: active.id },
      });
    }

    // Eligible students = INTERVIEW_SCHEDULED status for this job
    const appsSnap = await db.collection(COLLECTIONS.APPLICATIONS)
      .where('jobId', '==', jobId)
      .where('status', '==', APPLICATION_STATUS.INTERVIEW_SCHEDULED)
      .get();
    if (appsSnap.empty) {
      return res.status(400).json({
        success: false,
        message: 'No students with INTERVIEW_SCHEDULED status found. Update application statuses before scheduling interviews.',
      });
    }

    const eligibleStudentIds = [...new Set(appsSnap.docs.map((d) => d.data().studentId))];

    // Derive involved schools
    const schoolSet = new Set();
    for (let i = 0; i < eligibleStudentIds.length; i += 30) {
      const chunk = eligibleStudentIds.slice(i, i + 30);
      const pSnap = await db.collection(COLLECTIONS.STUDENT_PROFILES)
        .where('__name__', 'in', chunk).get();
      pSnap.docs.forEach((d) => { if (d.data().schoolId) schoolSet.add(d.data().schoolId); });
    }

    // Compute expected slot count
    const slotTimes = generateTimeSlots(windowStart, windowEnd, duration, breakMins);
    if (slotTimes.length === 0) {
      return res.status(400).json({ success: false, message: 'Window is too short to fit even one slot with the given duration.' });
    }

    const now = new Date().toISOString();
    const scheduleData = {
      jobId,
      jobTitle:            job.title,
      companyId:           uid,
      companyName:         job.companyName,
      mode,
      interviewDate,
      windowStart,
      windowEnd,
      duration,
      breakBetweenSlots:   breakMins,
      allocationMode,
      linkType:            mode === INTERVIEW_MODE.ONLINE ? linkType : null,
      commonLink:          null,
      venue:               null,
      venueInstructions:   null,
      involvedSchoolIds:   [...schoolSet],
      eligibleStudentIds,
      eligibleCount:       eligibleStudentIds.length,
      totalSlots:          slotTimes.length,
      bookedSlots:         0,
      facultyConfirmations: {},
      companyNotes:        notes || null,
      tpoNote:             null,
      status:              INTERVIEW_STATUS.REQUESTED,
      statusHistory:       [{ status: INTERVIEW_STATUS.REQUESTED, changedAt: now, changedBy: uid }],
      requestedAt:         now,
      forwardedAt:         null,
      scheduledAt:         null,
      completedAt:         null,
      cancelledAt:         null,
      cancelledBy:         null,
      cancellationReason:  null,
      updatedAt:           now,
    };

    const ref = await db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).add(scheduleData);

    const tpoEmails = await notifyTPOs({
      type:                AUDIT_ACTION.INTERVIEW_REQUESTED,
      title:               'Interview Schedule Requested',
      body:                `${job.companyName} requested interviews for "${job.title}". ${eligibleStudentIds.length} students eligible.`,
      interviewScheduleId: ref.id,
      jobId,
    });
    email.sendInterviewRequestedEmail(tpoEmails, job.companyName, job.title)
      .catch((e) => console.error('sendInterviewRequestedEmail error:', e));

    await auditLog({
      actorUserId:    uid,
      actorRole:      ROLES.COMPANY,
      actionType:     AUDIT_ACTION.INTERVIEW_REQUESTED,
      targetType:     'INTERVIEW_SCHEDULE',
      targetId:       ref.id,
      payloadSummary: `Job: ${jobId}, Mode: ${mode}, Date: ${interviewDate}, Students: ${eligibleStudentIds.length}`,
      ipAddress:      req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Interview schedule request submitted. TPO will coordinate with faculty.',
      data:    { id: ref.id, ...scheduleData },
    });
  } catch (err) {
    console.error('requestInterview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to request interview schedule.' });
  }
};

/* ──────────── GET /api/jobs/:jobId/interview-schedule ──────────── */

const getJobInterviewSchedule = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { uid, role } = req.user;

    let query = db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).where('jobId', '==', jobId);
    if (role === ROLES.COMPANY) query = query.where('companyId', '==', uid);

    const snap = await query.get();
    const active = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .find((d) => ![INTERVIEW_STATUS.CANCELLED, INTERVIEW_STATUS.COMPLETED].includes(d.status));

    if (!active) {
      return res.status(404).json({ success: false, message: 'No active interview schedule found for this job.' });
    }
    return res.status(200).json({ success: true, data: active });
  } catch (err) {
    console.error('getJobInterviewSchedule error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch interview schedule.' });
  }
};

/* ──────────── PATCH /api/interview-schedules/:id/forward ──────────── */

const forwardInterviewToFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const schedRef = db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).doc(id);
    const schedDoc = await schedRef.get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Interview schedule not found.' });

    const sched = schedDoc.data();
    if (sched.status !== INTERVIEW_STATUS.REQUESTED) {
      return res.status(400).json({ success: false, message: `Cannot forward from status: ${sched.status}` });
    }

    const now = new Date().toISOString();
    await schedRef.update({
      status:      INTERVIEW_STATUS.FORWARDED_TO_FACULTY,
      forwardedAt: now,
      updatedAt:   now,
      statusHistory: [...(sched.statusHistory || []), {
        status: INTERVIEW_STATUS.FORWARDED_TO_FACULTY, changedAt: now, changedBy: req.user.uid,
      }],
    });

    const facultyRecipients = await notifyFacultyOfSchools(sched.involvedSchoolIds || [], {
      type:                AUDIT_ACTION.INTERVIEW_FORWARDED,
      title:               'Interview Availability Confirmation Needed',
      body:                `TPO forwarded an interview request for "${sched.jobTitle}" by ${sched.companyName}. Date: ${sched.interviewDate}, Window: ${sched.windowStart}–${sched.windowEnd}. Please confirm availability.`,
      interviewScheduleId: id,
      jobId:               sched.jobId,
    });

    facultyRecipients.forEach(({ email: fe, name: fn }) => {
      email.sendInterviewForwardedEmail(fe, fn, sched.companyName, sched.jobTitle, sched.interviewDate, sched.windowStart, sched.windowEnd)
        .catch((e) => console.error('sendInterviewForwardedEmail error:', e));
    });

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.INTERVIEW_FORWARDED,
      targetType:     'INTERVIEW_SCHEDULE',
      targetId:       id,
      payloadSummary: `Schools: ${(sched.involvedSchoolIds || []).join(', ')}`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: 'Interview request forwarded to faculty for confirmation.' });
  } catch (err) {
    console.error('forwardInterviewToFaculty error:', err);
    return res.status(500).json({ success: false, message: 'Failed to forward interview request.' });
  }
};

/* ──────────── PATCH /api/interview-schedules/:id/faculty-confirm ──────────── */

const facultyConfirmInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    const profDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(req.user.uid).get();
    if (!profDoc.exists) return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
    const { schoolId } = profDoc.data();

    const schedRef = db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).doc(id);
    const schedDoc = await schedRef.get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Interview schedule not found.' });

    const sched = schedDoc.data();

    if (!sched.involvedSchoolIds?.includes(schoolId)) {
      return res.status(403).json({ success: false, message: 'Your school is not involved in this interview.' });
    }
    if (sched.status !== INTERVIEW_STATUS.FORWARDED_TO_FACULTY) {
      return res.status(400).json({ success: false, message: `Cannot confirm from status: ${sched.status}` });
    }

    const now = new Date().toISOString();
    const facultyConfirmations = {
      ...(sched.facultyConfirmations || {}),
      [schoolId]: {
        facultyId:   req.user.uid,
        facultyName: req.user.fullName,
        note:        note || null,
        confirmedAt: now,
      },
    };

    await schedRef.update({
      status: INTERVIEW_STATUS.FACULTY_CONFIRMED,
      facultyConfirmations,
      updatedAt: now,
      statusHistory: [...(sched.statusHistory || []), {
        status:    INTERVIEW_STATUS.FACULTY_CONFIRMED,
        changedAt: now,
        changedBy: req.user.uid,
        note:      `School ${schoolId} confirmed`,
      }],
    });

    const tpoEmails = await notifyTPOs({
      type:                AUDIT_ACTION.INTERVIEW_FACULTY_CONFIRMED,
      title:               'Faculty Confirmed Interview Availability',
      body:                `${req.user.fullName} confirmed availability for "${sched.jobTitle}" interviews on ${sched.interviewDate}. Ready to schedule.`,
      interviewScheduleId: id,
      jobId:               sched.jobId,
    });
    email.sendInterviewFacultyConfirmedEmail(tpoEmails, req.user.fullName, sched.companyName, sched.jobTitle, sched.interviewDate)
      .catch((e) => console.error('sendInterviewFacultyConfirmedEmail error:', e));

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      ROLES.FACULTY,
      actionType:     AUDIT_ACTION.INTERVIEW_FACULTY_CONFIRMED,
      targetType:     'INTERVIEW_SCHEDULE',
      targetId:       id,
      payloadSummary: `School: ${schoolId}`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: 'Availability confirmed. TPO will now schedule the interviews.' });
  } catch (err) {
    console.error('facultyConfirmInterview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to confirm interview availability.' });
  }
};

/* ──────────── PATCH /api/interview-schedules/:id/schedule ──────────── */

const scheduleInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { venue, venueInstructions, tpoNote } = req.body;

    const schedRef = db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).doc(id);
    const schedDoc = await schedRef.get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Interview schedule not found.' });

    const sched = schedDoc.data();
    if (sched.status !== INTERVIEW_STATUS.FACULTY_CONFIRMED) {
      return res.status(400).json({ success: false, message: `Cannot schedule from status: ${sched.status}` });
    }
    if (sched.mode === INTERVIEW_MODE.OFFLINE && !venue) {
      return res.status(400).json({ success: false, message: 'venue is required for OFFLINE interviews.' });
    }

    // Generate time slots
    const slotTimes = generateTimeSlots(sched.windowStart, sched.windowEnd, sched.duration, sched.breakBetweenSlots);
    if (slotTimes.length === 0) {
      return res.status(400).json({ success: false, message: 'Cannot generate any slots with the current window/duration settings.' });
    }

    // Shuffle eligible students for auto-assignment to avoid bias
    const students = [...sched.eligibleStudentIds];

    // Fetch student profiles for names/emails
    const studentProfiles = {};
    for (let i = 0; i < students.length; i += 30) {
      const chunk = students.slice(i, i + 30);
      const pSnap = await db.collection(COLLECTIONS.STUDENT_PROFILES).where('__name__', 'in', chunk).get();
      pSnap.docs.forEach((d) => { studentProfiles[d.id] = d.data(); });
    }
    const studentUsers = {};
    for (let i = 0; i < students.length; i += 30) {
      const chunk = students.slice(i, i + 30);
      const uSnap = await db.collection(COLLECTIONS.USERS).where('__name__', 'in', chunk).get();
      uSnap.docs.forEach((d) => { studentUsers[d.id] = d.data(); });
    }

    // Create slot documents in batch (Firestore batch max 500)
    const now = new Date().toISOString();
    const isAuto = sched.allocationMode === ALLOCATION_MODE.AUTO;
    const slotDocs = [];

    for (let i = 0; i < slotTimes.length; i++) {
      const { startTime, endTime } = slotTimes[i];
      const assignedStudentId = isAuto && i < students.length ? students[i] : null;
      const prof = assignedStudentId ? studentProfiles[assignedStudentId] : null;
      const usr  = assignedStudentId ? studentUsers[assignedStudentId]    : null;

      slotDocs.push({
        interviewScheduleId: id,
        jobId:               sched.jobId,
        companyId:           sched.companyId,
        slotIndex:           i,
        date:                sched.interviewDate,
        startTime,
        endTime,
        duration:            sched.duration,
        link:                null,
        assignedStudentId,
        assignedStudentName:  usr?.fullName  || null,
        assignedStudentEmail: usr?.email     || null,
        schoolId:             prof?.schoolId || null,
        status:              assignedStudentId ? SLOT_STATUS.BOOKED : SLOT_STATUS.AVAILABLE,
        bookedAt:            assignedStudentId ? now : null,
        createdAt:           now,
      });
    }

    // Write slots in batches of 499
    const batchSize = 499;
    for (let i = 0; i < slotDocs.length; i += batchSize) {
      const batch = db.batch();
      slotDocs.slice(i, i + batchSize).forEach((slot) => {
        const ref = db.collection(COLLECTIONS.INTERVIEW_SLOTS).doc();
        batch.set(ref, slot);
      });
      await batch.commit();
    }

    const bookedSlots = slotDocs.filter((s) => s.status === SLOT_STATUS.BOOKED).length;

    const schedUpdate = {
      status:       INTERVIEW_STATUS.SCHEDULED,
      totalSlots:   slotTimes.length,
      bookedSlots,
      tpoNote:      tpoNote || null,
      scheduledAt:  now,
      updatedAt:    now,
      statusHistory: [...(sched.statusHistory || []), {
        status: INTERVIEW_STATUS.SCHEDULED, changedAt: now, changedBy: req.user.uid,
      }],
    };
    if (sched.mode === INTERVIEW_MODE.OFFLINE && venue) {
      schedUpdate.venue = venue;
      schedUpdate.venueInstructions = venueInstructions || null;
    }
    await schedRef.update(schedUpdate);

    const modeExtra = sched.mode === INTERVIEW_MODE.OFFLINE
      ? ` Venue: ${venue}`
      : ' Meeting link will be shared soon.';
    const schedNotif = {
      type:                AUDIT_ACTION.INTERVIEW_SCHEDULED,
      interviewScheduleId: id,
      jobId:               sched.jobId,
    };

    // Notify company
    await writeNotification(sched.companyId, {
      ...schedNotif,
      title: 'Interview Schedule Created',
      body:  `${slotTimes.length} interview slots generated for "${sched.jobTitle}" on ${sched.interviewDate}.${modeExtra}`,
    });

    // Notify eligible students (all of them)
    await notifyStudents(sched.eligibleStudentIds, {
      ...schedNotif,
      title: `Interview Scheduled — ${sched.jobTitle}`,
      body:  `Interviews for "${sched.jobTitle}" by ${sched.companyName} are scheduled for ${sched.interviewDate}.${modeExtra}`,
    });

    // Notify faculty
    await notifyFacultyOfSchools(sched.involvedSchoolIds || [], {
      ...schedNotif,
      title: `Interview Scheduled — ${sched.jobTitle}`,
      body:  `TPO scheduled interviews for "${sched.jobTitle}" on ${sched.interviewDate}. ${slotTimes.length} slots created.`,
    });

    // Best-effort email to company
    const companyDoc = await db.collection(COLLECTIONS.USERS).doc(sched.companyId).get();
    if (companyDoc.exists) {
      const cu = companyDoc.data();
      email.sendInterviewScheduledEmail(cu.email, cu.fullName || sched.companyName, sched.jobTitle, sched.companyName, sched.interviewDate, sched.windowStart, sched.windowEnd, sched.mode, venue || null)
        .catch((e) => console.error('sendInterviewScheduledEmail error:', e));
    }

    // Email auto-assigned students
    if (isAuto) {
      for (const slot of slotDocs.filter((s) => s.assignedStudentId)) {
        const userEmail = slot.assignedStudentEmail;
        if (!userEmail) continue;
        email.sendInterviewSlotAssignedEmail(userEmail, slot.assignedStudentName || 'Student', sched.jobTitle, sched.companyName, slot.date, slot.startTime, slot.endTime, sched.mode, venue || null)
          .catch((e) => console.error('sendInterviewSlotAssignedEmail error:', e));
      }
    }

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.INTERVIEW_SCHEDULED,
      targetType:     'INTERVIEW_SCHEDULE',
      targetId:       id,
      payloadSummary: `Slots: ${slotTimes.length}, Mode: ${sched.mode}, Allocation: ${sched.allocationMode}`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({
      success: true,
      message: `${slotTimes.length} interview slots generated. All parties notified.`,
    });
  } catch (err) {
    console.error('scheduleInterview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to schedule interviews.' });
  }
};

/* ──────────── PATCH /api/interview-schedules/:id/common-link ──────────── */

const updateCommonLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { commonLink } = req.body;

    if (!commonLink || typeof commonLink !== 'string' || !commonLink.startsWith('http')) {
      return res.status(400).json({ success: false, message: 'A valid URL starting with http is required.' });
    }

    const schedRef = db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).doc(id);
    const schedDoc = await schedRef.get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Interview schedule not found.' });

    const sched = schedDoc.data();
    if (sched.companyId !== req.user.uid) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (sched.mode !== INTERVIEW_MODE.ONLINE) return res.status(400).json({ success: false, message: 'Common link only applies to ONLINE interviews.' });
    if (sched.linkType !== LINK_TYPE.COMMON) return res.status(400).json({ success: false, message: 'This schedule uses PER_SLOT links. Update individual slots instead.' });
    if (![INTERVIEW_STATUS.SCHEDULED, INTERVIEW_STATUS.LIVE].includes(sched.status)) {
      return res.status(400).json({ success: false, message: 'Interview must be SCHEDULED or LIVE to update the link.' });
    }

    // 1-hour cutoff from first slot start
    const firstSlotDt = new Date(`${sched.interviewDate}T${sched.windowStart}:00+05:30`);
    if (Date.now() >= firstSlotDt.getTime() - 60 * 60 * 1000) {
      return res.status(400).json({ success: false, message: 'Cannot update the link within 1 hour of the first interview slot.' });
    }

    const now = new Date().toISOString();
    await schedRef.update({ commonLink, updatedAt: now });

    const linkNotif = {
      type:                AUDIT_ACTION.INTERVIEW_LINK_UPDATED,
      title:               `Interview Link Updated — ${sched.jobTitle}`,
      body:                `The meeting link for "${sched.jobTitle}" interviews has been updated.`,
      interviewScheduleId: id,
      jobId:               sched.jobId,
    };
    await notifyStudents(sched.eligibleStudentIds, linkNotif);
    await notifyFacultyOfSchools(sched.involvedSchoolIds || [], linkNotif);
    await notifyTPOs(linkNotif);

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      ROLES.COMPANY,
      actionType:     AUDIT_ACTION.INTERVIEW_LINK_UPDATED,
      targetType:     'INTERVIEW_SCHEDULE',
      targetId:       id,
      payloadSummary: 'Common link updated',
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: 'Meeting link updated. All parties notified.' });
  } catch (err) {
    console.error('updateCommonLink error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update common link.' });
  }
};

/* ──────────── PATCH /api/interview-schedules/:id/cancel ──────────── */

const cancelInterview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Cancellation reason is required.' });

    const schedRef = db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).doc(id);
    const schedDoc = await schedRef.get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Interview schedule not found.' });

    const sched = schedDoc.data();
    if (sched.status === INTERVIEW_STATUS.CANCELLED) {
      return res.status(400).json({ success: false, message: 'Already cancelled.' });
    }

    const now = new Date().toISOString();
    await schedRef.update({
      status:             INTERVIEW_STATUS.CANCELLED,
      cancelledAt:        now,
      cancelledBy:        req.user.uid,
      cancellationReason: reason,
      updatedAt:          now,
      statusHistory:      [...(sched.statusHistory || []), {
        status: INTERVIEW_STATUS.CANCELLED, changedAt: now, changedBy: req.user.uid, note: reason,
      }],
    });

    // Cancel all open slots
    const slotsSnap = await db.collection(COLLECTIONS.INTERVIEW_SLOTS)
      .where('interviewScheduleId', '==', id).get();
    const slotBatch = db.batch();
    slotsSnap.docs.forEach((d) => {
      if ([SLOT_STATUS.AVAILABLE, SLOT_STATUS.BOOKED].includes(d.data().status)) {
        slotBatch.update(d.ref, { status: SLOT_STATUS.CANCELLED, updatedAt: now });
      }
    });
    if (!slotsSnap.empty) await slotBatch.commit();

    const cancelNotif = {
      type:                AUDIT_ACTION.INTERVIEW_CANCELLED,
      title:               `Interviews Cancelled — ${sched.jobTitle}`,
      body:                `Interviews for "${sched.jobTitle}" by ${sched.companyName} have been cancelled. Reason: ${reason}`,
      interviewScheduleId: id,
      jobId:               sched.jobId,
    };
    await writeNotification(sched.companyId, cancelNotif);
    await notifyStudents(sched.eligibleStudentIds, cancelNotif);
    await notifyFacultyOfSchools(sched.involvedSchoolIds || [], cancelNotif);

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.INTERVIEW_CANCELLED,
      targetType:     'INTERVIEW_SCHEDULE',
      targetId:       id,
      payloadSummary: `Reason: ${reason}`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: 'Interview schedule cancelled and all parties notified.' });
  } catch (err) {
    console.error('cancelInterview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel interview schedule.' });
  }
};

/* ──────────── PATCH /api/interview-schedules/:id/complete ──────────── */

const completeInterview = async (req, res) => {
  try {
    const { id } = req.params;

    const schedRef = db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).doc(id);
    const schedDoc = await schedRef.get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Interview schedule not found.' });

    const sched = schedDoc.data();
    if (![INTERVIEW_STATUS.SCHEDULED, INTERVIEW_STATUS.LIVE].includes(sched.status)) {
      return res.status(400).json({ success: false, message: `Cannot complete from status: ${sched.status}` });
    }

    const now = new Date().toISOString();
    await schedRef.update({
      status:       INTERVIEW_STATUS.COMPLETED,
      completedAt:  now,
      updatedAt:    now,
      statusHistory: [...(sched.statusHistory || []), {
        status: INTERVIEW_STATUS.COMPLETED, changedAt: now, changedBy: req.user.uid,
      }],
    });

    // Mark booked slots as COMPLETED
    const slotsSnap = await db.collection(COLLECTIONS.INTERVIEW_SLOTS)
      .where('interviewScheduleId', '==', id).get();
    const slotBatch = db.batch();
    slotsSnap.docs.forEach((d) => {
      if (d.data().status === SLOT_STATUS.BOOKED) {
        slotBatch.update(d.ref, { status: SLOT_STATUS.COMPLETED, updatedAt: now });
      }
    });
    if (!slotsSnap.empty) await slotBatch.commit();

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.INTERVIEW_COMPLETED,
      targetType:     'INTERVIEW_SCHEDULE',
      targetId:       id,
      payloadSummary: `Job: ${sched.jobId}`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: 'Interview schedule marked as completed.' });
  } catch (err) {
    console.error('completeInterview error:', err);
    return res.status(500).json({ success: false, message: 'Failed to complete interview schedule.' });
  }
};

/* ──────────── GET /api/interview-schedules ──────────── */

const listInterviewSchedules = async (req, res) => {
  try {
    const { uid, role } = req.user;
    let snap;

    if (role === ROLES.COMPANY) {
      snap = await db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).where('companyId', '==', uid).get();
    } else if (role === ROLES.TPO || role === ROLES.ADMIN) {
      snap = await db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).get();
    } else if (role === ROLES.FACULTY) {
      const profDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(uid).get();
      if (!profDoc.exists) return res.json({ success: true, data: [] });
      const { schoolId } = profDoc.data();
      snap = await db.collection(COLLECTIONS.INTERVIEW_SCHEDULES)
        .where('involvedSchoolIds', 'array-contains', schoolId).get();
    } else {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const data = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.requestedAt > a.requestedAt ? 1 : -1));

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('listInterviewSchedules error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch interview schedules.' });
  }
};

/* ──────────── GET /api/interview-schedules/:id ──────────── */

const getInterviewSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid, role } = req.user;

    const schedDoc = await db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).doc(id).get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Interview schedule not found.' });
    const sched = { id: schedDoc.id, ...schedDoc.data() };

    if (role === ROLES.COMPANY && sched.companyId !== uid) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (role === ROLES.FACULTY) {
      const profDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(uid).get();
      const { schoolId } = profDoc.data() || {};
      if (!sched.involvedSchoolIds?.includes(schoolId)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
    }

    return res.status(200).json({ success: true, data: sched });
  } catch (err) {
    console.error('getInterviewSchedule error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch interview schedule.' });
  }
};

/* ──────────── GET /api/interview-schedules/:id/slots ──────────── */

const listSlots = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid, role } = req.user;

    const schedDoc = await db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).doc(id).get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Interview schedule not found.' });
    const sched = schedDoc.data();

    // Access check
    if (role === ROLES.COMPANY && sched.companyId !== uid) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (role === ROLES.STUDENT && !sched.eligibleStudentIds?.includes(uid)) {
      return res.status(403).json({ success: false, message: 'You are not eligible for this interview.' });
    }

    const snap = await db.collection(COLLECTIONS.INTERVIEW_SLOTS)
      .where('interviewScheduleId', '==', id).get();

    let slots = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => a.slotIndex - b.slotIndex);

    // Faculty: only see their school's students' slots
    if (role === ROLES.FACULTY) {
      const profDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(uid).get();
      const { schoolId } = profDoc.data() || {};
      if (!sched.involvedSchoolIds?.includes(schoolId)) {
        return res.status(403).json({ success: false, message: 'Access denied.' });
      }
      slots = slots.filter((s) => s.schoolId === schoolId || s.status === SLOT_STATUS.AVAILABLE);
    }

    // Student: only their own slot (if assigned) + available slots (for STUDENT_CHOICE)
    if (role === ROLES.STUDENT) {
      if (sched.allocationMode === ALLOCATION_MODE.STUDENT_CHOICE) {
        // Show available slots + their booked slot
        slots = slots.filter((s) => s.status === SLOT_STATUS.AVAILABLE || s.assignedStudentId === uid);
      } else {
        // AUTO: show only their assigned slot
        slots = slots.filter((s) => s.assignedStudentId === uid);
      }
    }

    return res.status(200).json({ success: true, data: slots });
  } catch (err) {
    console.error('listSlots error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch slots.' });
  }
};

/* ──────────── PATCH /api/interview-slots/:slotId/link ──────────── */

const updateSlotLink = async (req, res) => {
  try {
    const { slotId } = req.params;
    const { link } = req.body;

    if (!link || typeof link !== 'string' || !link.startsWith('http')) {
      return res.status(400).json({ success: false, message: 'A valid URL starting with http is required.' });
    }

    const slotRef = db.collection(COLLECTIONS.INTERVIEW_SLOTS).doc(slotId);
    const slotDoc = await slotRef.get();
    if (!slotDoc.exists) return res.status(404).json({ success: false, message: 'Slot not found.' });

    const slot = slotDoc.data();
    if (slot.companyId !== req.user.uid) return res.status(403).json({ success: false, message: 'Access denied.' });

    const schedDoc = await db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).doc(slot.interviewScheduleId).get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Schedule not found.' });
    const sched = schedDoc.data();

    if (sched.mode !== INTERVIEW_MODE.ONLINE) {
      return res.status(400).json({ success: false, message: 'Slot links only apply to ONLINE interviews.' });
    }
    if (sched.linkType !== LINK_TYPE.PER_SLOT) {
      return res.status(400).json({ success: false, message: 'This schedule uses a COMMON link. Update the schedule link instead.' });
    }
    if (![INTERVIEW_STATUS.SCHEDULED, INTERVIEW_STATUS.LIVE].includes(sched.status)) {
      return res.status(400).json({ success: false, message: 'Interview must be SCHEDULED or LIVE to update slot links.' });
    }

    // 1-hour cutoff from this slot's start
    const slotDt = new Date(`${slot.date}T${slot.startTime}:00+05:30`);
    if (Date.now() >= slotDt.getTime() - 60 * 60 * 1000) {
      return res.status(400).json({ success: false, message: 'Cannot update slot link within 1 hour of the interview time.' });
    }

    const now = new Date().toISOString();
    await slotRef.update({ link, updatedAt: now });

    // Notify assigned student
    if (slot.assignedStudentId) {
      await writeNotification(slot.assignedStudentId, {
        type:                AUDIT_ACTION.INTERVIEW_LINK_UPDATED,
        title:               `Interview Link Updated — ${sched.jobTitle}`,
        body:                `Your interview link for "${sched.jobTitle}" (${slot.startTime} IST) has been updated.`,
        interviewScheduleId: slot.interviewScheduleId,
        jobId:               slot.jobId,
      });
      if (slot.assignedStudentEmail) {
        email.sendInterviewLinkUpdatedEmail(slot.assignedStudentEmail, slot.assignedStudentName || 'Student', sched.jobTitle, slot.startTime, link)
          .catch((e) => console.error('sendInterviewLinkUpdatedEmail error:', e));
      }
    }

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      ROLES.COMPANY,
      actionType:     AUDIT_ACTION.INTERVIEW_LINK_UPDATED,
      targetType:     'INTERVIEW_SLOT',
      targetId:       slotId,
      payloadSummary: `Slot index: ${slot.slotIndex}, Time: ${slot.startTime}`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: 'Slot link updated.' });
  } catch (err) {
    console.error('updateSlotLink error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update slot link.' });
  }
};

/* ──────────── POST /api/interview-slots/:slotId/book ──────────── */

const bookSlot = async (req, res) => {
  try {
    const { slotId } = req.params;
    const uid = req.user.uid;

    const slotRef = db.collection(COLLECTIONS.INTERVIEW_SLOTS).doc(slotId);
    const slotDoc = await slotRef.get();
    if (!slotDoc.exists) return res.status(404).json({ success: false, message: 'Slot not found.' });

    const slot = slotDoc.data();
    const schedDoc = await db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).doc(slot.interviewScheduleId).get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Schedule not found.' });
    const sched = schedDoc.data();

    if (!sched.eligibleStudentIds?.includes(uid)) {
      return res.status(403).json({ success: false, message: 'You are not eligible for this interview.' });
    }
    if (sched.allocationMode !== ALLOCATION_MODE.STUDENT_CHOICE) {
      return res.status(400).json({ success: false, message: 'This schedule uses auto-assignment. Slot picking is not available.' });
    }
    if (sched.status !== INTERVIEW_STATUS.SCHEDULED) {
      return res.status(400).json({ success: false, message: 'Slot booking is only open for SCHEDULED interviews.' });
    }
    if (slot.status !== SLOT_STATUS.AVAILABLE) {
      return res.status(409).json({ success: false, message: 'This slot is no longer available.' });
    }

    // Check student doesn't already have a slot in this schedule
    const existingSnap = await db.collection(COLLECTIONS.INTERVIEW_SLOTS)
      .where('interviewScheduleId', '==', slot.interviewScheduleId)
      .where('assignedStudentId', '==', uid).get();
    if (!existingSnap.empty) {
      return res.status(409).json({ success: false, message: 'You have already booked a slot for this interview.' });
    }

    // Fetch student profile for name/email/school
    const profDoc = await db.collection(COLLECTIONS.STUDENT_PROFILES).doc(uid).get();
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(uid).get();
    const prof = profDoc.data() || {};
    const usr  = userDoc.data() || {};

    const now = new Date().toISOString();
    await slotRef.update({
      assignedStudentId:    uid,
      assignedStudentName:  usr.fullName  || null,
      assignedStudentEmail: usr.email     || null,
      schoolId:             prof.schoolId || null,
      status:               SLOT_STATUS.BOOKED,
      bookedAt:             now,
      updatedAt:            now,
    });

    // Increment bookedSlots on schedule
    await db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).doc(slot.interviewScheduleId).update({
      bookedSlots: (sched.bookedSlots || 0) + 1,
      updatedAt:   now,
    });

    // Log booking
    await db.collection(COLLECTIONS.SLOT_BOOKINGS).add({
      slotId,
      interviewScheduleId: slot.interviewScheduleId,
      jobId:               slot.jobId,
      studentId:           uid,
      studentName:         usr.fullName  || null,
      schoolId:            prof.schoolId || null,
      action:              'BOOKED',
      createdAt:           now,
    });

    // Notify company
    await writeNotification(sched.companyId, {
      type:                AUDIT_ACTION.INTERVIEW_SLOT_BOOKED,
      title:               `Slot Booked — ${sched.jobTitle}`,
      body:                `${usr.fullName || 'A student'} booked a slot at ${slot.startTime} for "${sched.jobTitle}".`,
      interviewScheduleId: slot.interviewScheduleId,
      jobId:               slot.jobId,
    });

    // Email student
    email.sendInterviewSlotAssignedEmail(usr.email, usr.fullName || 'Student', sched.jobTitle, sched.companyName, slot.date, slot.startTime, slot.endTime, sched.mode, sched.commonLink || sched.venue || null)
      .catch((e) => console.error('sendInterviewSlotAssignedEmail error:', e));

    await auditLog({
      actorUserId:    uid,
      actorRole:      ROLES.STUDENT,
      actionType:     AUDIT_ACTION.INTERVIEW_SLOT_BOOKED,
      targetType:     'INTERVIEW_SLOT',
      targetId:       slotId,
      payloadSummary: `Slot: ${slot.startTime}`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: `Interview slot at ${slot.startTime} booked successfully.` });
  } catch (err) {
    console.error('bookSlot error:', err);
    return res.status(500).json({ success: false, message: 'Failed to book slot.' });
  }
};

/* ──────────── DELETE /api/interview-slots/:slotId/book ──────────── */

const cancelSlotBooking = async (req, res) => {
  try {
    const { slotId } = req.params;
    const uid = req.user.uid;

    const slotRef = db.collection(COLLECTIONS.INTERVIEW_SLOTS).doc(slotId);
    const slotDoc = await slotRef.get();
    if (!slotDoc.exists) return res.status(404).json({ success: false, message: 'Slot not found.' });

    const slot = slotDoc.data();
    if (slot.assignedStudentId !== uid) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own booking.' });
    }
    if (slot.status !== SLOT_STATUS.BOOKED) {
      return res.status(400).json({ success: false, message: 'Slot is not booked.' });
    }

    // 2-hour cancellation cutoff
    const slotDt = new Date(`${slot.date}T${slot.startTime}:00+05:30`);
    if (Date.now() >= slotDt.getTime() - 2 * 60 * 60 * 1000) {
      return res.status(400).json({ success: false, message: 'Cannot cancel within 2 hours of the interview.' });
    }

    const schedDoc = await db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).doc(slot.interviewScheduleId).get();
    const sched = schedDoc.data() || {};

    const now = new Date().toISOString();
    await slotRef.update({
      assignedStudentId:    null,
      assignedStudentName:  null,
      assignedStudentEmail: null,
      schoolId:             null,
      status:               SLOT_STATUS.AVAILABLE,
      bookedAt:             null,
      updatedAt:            now,
    });

    await db.collection(COLLECTIONS.INTERVIEW_SCHEDULES).doc(slot.interviewScheduleId).update({
      bookedSlots: Math.max(0, (sched.bookedSlots || 1) - 1),
      updatedAt:   now,
    });

    await db.collection(COLLECTIONS.SLOT_BOOKINGS).add({
      slotId,
      interviewScheduleId: slot.interviewScheduleId,
      jobId:               slot.jobId,
      studentId:           uid,
      action:              'CANCELLED',
      createdAt:           now,
    });

    await auditLog({
      actorUserId:    uid,
      actorRole:      ROLES.STUDENT,
      actionType:     AUDIT_ACTION.INTERVIEW_SLOT_CANCELLED,
      targetType:     'INTERVIEW_SLOT',
      targetId:       slotId,
      payloadSummary: `Slot: ${slot.startTime}`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: 'Slot booking cancelled. Slot is now available again.' });
  } catch (err) {
    console.error('cancelSlotBooking error:', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel slot booking.' });
  }
};

/* ──────────── GET /api/my-interviews (Student) ──────────── */

const listMyInterviews = async (req, res) => {
  try {
    const uid = req.user.uid;

    // Find slots assigned to this student
    const slotsSnap = await db.collection(COLLECTIONS.INTERVIEW_SLOTS)
      .where('assignedStudentId', '==', uid).get();

    if (slotsSnap.empty) return res.status(200).json({ success: true, data: [] });

    // Collect unique schedule IDs
    const scheduleIds = [...new Set(slotsSnap.docs.map((d) => d.data().interviewScheduleId))];

    // Fetch schedules
    const schedules = {};
    for (let i = 0; i < scheduleIds.length; i += 30) {
      const chunk = scheduleIds.slice(i, i + 30);
      const schedSnap = await db.collection(COLLECTIONS.INTERVIEW_SCHEDULES)
        .where('__name__', 'in', chunk).get();
      schedSnap.docs.forEach((d) => { schedules[d.id] = { id: d.id, ...d.data() }; });
    }

    const data = slotsSnap.docs
      .map((d) => {
        const slot  = d.data();
        const sched = schedules[slot.interviewScheduleId];
        if (!sched) return null;
        return {
          slotId:              d.id,
          interviewScheduleId: slot.interviewScheduleId,
          jobId:               slot.jobId,
          jobTitle:            sched.jobTitle,
          companyName:         sched.companyName,
          mode:                sched.mode,
          date:                slot.date,
          startTime:           slot.startTime,
          endTime:             slot.endTime,
          duration:            slot.duration,
          link:                slot.link || sched.commonLink || null,
          venue:               sched.venue || null,
          venueInstructions:   sched.venueInstructions || null,
          slotStatus:          slot.status,
          scheduleStatus:      sched.status,
        };
      })
      .filter(Boolean)
      .filter((i) => ![INTERVIEW_STATUS.CANCELLED].includes(i.scheduleStatus))
      .sort((a, b) => {
        const da = `${a.date}T${a.startTime}`;
        const db_ = `${b.date}T${b.startTime}`;
        return da < db_ ? -1 : 1;
      });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('listMyInterviews error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch your interviews.' });
  }
};

module.exports = {
  requestInterview,
  getJobInterviewSchedule,
  forwardInterviewToFaculty,
  facultyConfirmInterview,
  scheduleInterview,
  updateCommonLink,
  cancelInterview,
  completeInterview,
  listInterviewSchedules,
  getInterviewSchedule,
  listSlots,
  updateSlotLink,
  bookSlot,
  cancelSlotBooking,
  listMyInterviews,
};
