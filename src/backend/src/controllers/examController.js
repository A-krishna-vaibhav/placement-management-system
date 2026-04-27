/**
 * Exam Schedule Controller
 * ─────────────────────────────────────────────────────────────────────────────
 * POST  /api/jobs/:jobId/exam-schedule              — company requests schedule
 * GET   /api/jobs/:jobId/exam-schedule              — get schedule for a job
 * PATCH /api/exam-schedules/:id/forward             — TPO forwards to faculty
 * PATCH /api/exam-schedules/:id/faculty-confirm     — faculty confirms a slot
 * PATCH /api/exam-schedules/:id/finalize            — TPO finalises + venue (OFFLINE)
 * PATCH /api/exam-schedules/:id/exam-link           — company sets/updates link (ONLINE)
 * PATCH /api/exam-schedules/:id/assign-venue        — TPO updates venue post-finalise
 * PATCH /api/exam-schedules/:id/cancel              — TPO cancels
 * GET   /api/exam-schedules                         — list (scoped by role)
 * GET   /api/exam-schedules/:id                     — single schedule
 * GET   /api/my-exams                               — student: their finalized exams
 */

const { db } = require('../config/firebase');
const {
  COLLECTIONS, ROLES, APPLICATION_STATUS,
  EXAM_STATUS, EXAM_MODE, AUDIT_ACTION,
} = require('../config/constants');
const { log: auditLog } = require('../services/auditLogger');
const email = require('../services/emailService');

/* ──────────── internal helpers ──────────── */

function writeNotification(recipientId, { type, title, body, examScheduleId, jobId }) {
  return db.collection(COLLECTIONS.NOTIFICATIONS).add({
    recipientId,
    type,
    title,
    body: body || '',
    examScheduleId: examScheduleId || null,
    jobId:          jobId          || null,
    read:           false,
    createdAt:      new Date().toISOString(),
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
    const facSnap = await db
      .collection(COLLECTIONS.FACULTY_PROFILES)
      .where('schoolId', 'in', chunk)
      .get();
    const ids = facSnap.docs.map((d) => d.id);
    if (!ids.length) continue;

    await Promise.all(ids.map((fid) => writeNotification(fid, notif)));

    // collect emails for optional email send
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

/* ──────────── POST /api/jobs/:jobId/exam-schedule ──────────── */

const requestExamSchedule = async (req, res) => {
  try {
    const uid    = req.user.uid;
    const jobId  = req.params.jobId;
    const { mode, proposedSlots, notes } = req.body;

    if (!mode || !Object.values(EXAM_MODE).includes(mode)) {
      return res.status(400).json({ success: false, message: 'mode must be ONLINE or OFFLINE.' });
    }
    if (!Array.isArray(proposedSlots) || proposedSlots.length < 1 || proposedSlots.length > 5) {
      return res.status(400).json({ success: false, message: 'Provide 1 to 5 proposed time slots.' });
    }

    const minDt = new Date(Date.now() + 48 * 60 * 60 * 1000);
    for (const slot of proposedSlots) {
      if (!slot.date || !slot.startTime) {
        return res.status(400).json({ success: false, message: 'Each slot needs date (YYYY-MM-DD) and startTime (HH:MM).' });
      }
      const dt = new Date(`${slot.date}T${slot.startTime}:00+05:30`);
      if (isNaN(dt.getTime())) {
        return res.status(400).json({ success: false, message: `Invalid slot: ${slot.date} ${slot.startTime}` });
      }
      if (dt < minDt) {
        return res.status(400).json({ success: false, message: 'All slots must be at least 48 hours in the future.' });
      }
    }

    const jobDoc = await db.collection(COLLECTIONS.JOBS).doc(jobId).get();
    if (!jobDoc.exists || jobDoc.data().companyId !== uid) {
      return res.status(404).json({ success: false, message: 'Job not found.' });
    }
    const job = jobDoc.data();

    // Block duplicate active schedule
    const existSnap = await db.collection(COLLECTIONS.EXAM_SCHEDULES)
      .where('jobId', '==', jobId).where('companyId', '==', uid).get();
    const active = existSnap.docs.find((d) => d.data().status !== EXAM_STATUS.CANCELLED);
    if (active) {
      return res.status(409).json({
        success: false,
        message: 'An active exam schedule already exists for this job.',
        data: { id: active.id },
      });
    }

    // Must have shortlisted students
    const appsSnap = await db.collection(COLLECTIONS.APPLICATIONS)
      .where('jobId', '==', jobId)
      .where('status', '==', APPLICATION_STATUS.SHORTLISTED)
      .get();
    if (appsSnap.empty) {
      return res.status(400).json({ success: false, message: 'No shortlisted students found. Shortlist students before scheduling an exam.' });
    }

    const shortlistedStudentIds = [...new Set(appsSnap.docs.map((d) => d.data().studentId))];

    // Derive involved schools from student profiles
    const schoolSet = new Set();
    for (let i = 0; i < shortlistedStudentIds.length; i += 30) {
      const chunk = shortlistedStudentIds.slice(i, i + 30);
      const pSnap = await db.collection(COLLECTIONS.STUDENT_PROFILES)
        .where('__name__', 'in', chunk).get();
      pSnap.docs.forEach((d) => { if (d.data().schoolId) schoolSet.add(d.data().schoolId); });
    }

    const now = new Date().toISOString();
    const scheduleData = {
      jobId,
      jobTitle:            job.title,
      companyId:           uid,
      companyName:         job.companyName,
      mode,
      proposedSlots,
      confirmedSlot:       null,
      examLink:            null,
      examLinkUpdatedAt:   null,
      venue:               null,
      venueInstructions:   null,
      venueAssignedBy:     null,
      venueAssignedAt:     null,
      shortlistedStudentIds,
      shortlistedCount:    shortlistedStudentIds.length,
      involvedSchoolIds:   [...schoolSet],
      facultyConfirmations: {},
      companyNotes:        notes || null,
      tpoNote:             null,
      status:              EXAM_STATUS.REQUESTED,
      statusHistory:       [{ status: EXAM_STATUS.REQUESTED, changedAt: now, changedBy: uid }],
      requestedAt:         now,
      forwardedAt:         null,
      finalizedAt:         null,
      cancelledAt:         null,
      cancelledBy:         null,
      cancellationReason:  null,
      updatedAt:           now,
    };

    const ref = await db.collection(COLLECTIONS.EXAM_SCHEDULES).add(scheduleData);

    const tpoEmails = await notifyTPOs({
      type:           AUDIT_ACTION.EXAM_REQUESTED,
      title:          'Exam Schedule Requested',
      body:           `${job.companyName} requested an exam for "${job.title}". ${shortlistedStudentIds.length} students shortlisted.`,
      examScheduleId: ref.id,
      jobId,
    });
    email.sendExamRequestedEmail(tpoEmails, job.companyName, job.title)
      .catch((e) => console.error('sendExamRequestedEmail error:', e));

    await auditLog({
      actorUserId:    uid,
      actorRole:      ROLES.COMPANY,
      actionType:     AUDIT_ACTION.EXAM_REQUESTED,
      targetType:     'EXAM_SCHEDULE',
      targetId:       ref.id,
      payloadSummary: `Job: ${jobId}, Mode: ${mode}, Slots: ${proposedSlots.length}, Students: ${shortlistedStudentIds.length}`,
      ipAddress:      req.ip,
    });

    return res.status(201).json({
      success: true,
      message: 'Exam schedule request submitted. TPO will coordinate with faculty.',
      data:    { id: ref.id, ...scheduleData },
    });
  } catch (err) {
    console.error('requestExamSchedule error:', err);
    return res.status(500).json({ success: false, message: 'Failed to request exam schedule.' });
  }
};

/* ──────────── GET /api/jobs/:jobId/exam-schedule ──────────── */

const getJobExamSchedule = async (req, res) => {
  try {
    const { jobId } = req.params;
    const { uid, role } = req.user;

    let query = db.collection(COLLECTIONS.EXAM_SCHEDULES).where('jobId', '==', jobId);
    if (role === ROLES.COMPANY) query = query.where('companyId', '==', uid);

    const snap = await query.get();
    const active = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .find((d) => d.status !== EXAM_STATUS.CANCELLED);

    if (!active) {
      return res.status(404).json({ success: false, message: 'No active exam schedule found for this job.' });
    }
    return res.status(200).json({ success: true, data: active });
  } catch (err) {
    console.error('getJobExamSchedule error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch exam schedule.' });
  }
};

/* ──────────── PATCH /api/exam-schedules/:id/forward ──────────── */

const forwardToFaculty = async (req, res) => {
  try {
    const { id } = req.params;
    const schedRef = db.collection(COLLECTIONS.EXAM_SCHEDULES).doc(id);
    const schedDoc = await schedRef.get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Exam schedule not found.' });

    const sched = schedDoc.data();
    if (sched.status !== EXAM_STATUS.REQUESTED) {
      return res.status(400).json({ success: false, message: `Cannot forward from status: ${sched.status}` });
    }

    const now = new Date().toISOString();
    await schedRef.update({
      status:        EXAM_STATUS.FORWARDED_TO_FACULTY,
      forwardedAt:   now,
      updatedAt:     now,
      statusHistory: [...(sched.statusHistory || []), {
        status: EXAM_STATUS.FORWARDED_TO_FACULTY, changedAt: now, changedBy: req.user.uid,
      }],
    });

    const facultyRecipients = await notifyFacultyOfSchools(sched.involvedSchoolIds || [], {
      type:           AUDIT_ACTION.EXAM_FORWARDED,
      title:          'Exam Date Confirmation Needed',
      body:           `TPO forwarded an exam request for "${sched.jobTitle}" by ${sched.companyName}. Please confirm a suitable date.`,
      examScheduleId: id,
      jobId:          sched.jobId,
    });

    facultyRecipients.forEach(({ email: fe, name: fn }) => {
      email.sendExamForwardedEmail(fe, fn, sched.companyName, sched.jobTitle, sched.proposedSlots)
        .catch((e) => console.error('sendExamForwardedEmail error:', e));
    });

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.EXAM_FORWARDED,
      targetType:     'EXAM_SCHEDULE',
      targetId:       id,
      payloadSummary: `Schools: ${(sched.involvedSchoolIds || []).join(', ')}`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: 'Exam request forwarded to faculty for date confirmation.' });
  } catch (err) {
    console.error('forwardToFaculty error:', err);
    return res.status(500).json({ success: false, message: 'Failed to forward exam request.' });
  }
};

/* ──────────── PATCH /api/exam-schedules/:id/faculty-confirm ──────────── */

const facultyConfirm = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmedSlot, note } = req.body;

    if (!confirmedSlot?.date || !confirmedSlot?.startTime) {
      return res.status(400).json({ success: false, message: 'confirmedSlot with date and startTime is required.' });
    }

    const profDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(req.user.uid).get();
    if (!profDoc.exists) return res.status(403).json({ success: false, message: 'Faculty profile not found.' });
    const { schoolId } = profDoc.data();

    const schedRef = db.collection(COLLECTIONS.EXAM_SCHEDULES).doc(id);
    const schedDoc = await schedRef.get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Exam schedule not found.' });

    const sched = schedDoc.data();

    if (!sched.involvedSchoolIds?.includes(schoolId)) {
      return res.status(403).json({ success: false, message: 'Your school is not involved in this exam.' });
    }
    if (sched.status !== EXAM_STATUS.FORWARDED_TO_FACULTY) {
      return res.status(400).json({ success: false, message: `Cannot confirm from status: ${sched.status}` });
    }

    const slotMatch = (sched.proposedSlots || []).find(
      (s) => s.date === confirmedSlot.date && s.startTime === confirmedSlot.startTime,
    );
    if (!slotMatch) {
      return res.status(400).json({ success: false, message: 'Confirmed slot must match one of the proposed slots.' });
    }

    const now = new Date().toISOString();
    const facultyConfirmations = {
      ...(sched.facultyConfirmations || {}),
      [schoolId]: {
        facultyId:    req.user.uid,
        facultyName:  req.user.fullName,
        confirmedSlot,
        note:         note || null,
        confirmedAt:  now,
      },
    };

    await schedRef.update({
      status: EXAM_STATUS.FACULTY_CONFIRMED,
      facultyConfirmations,
      updatedAt: now,
      statusHistory: [...(sched.statusHistory || []), {
        status:    EXAM_STATUS.FACULTY_CONFIRMED,
        changedAt: now,
        changedBy: req.user.uid,
        note:      `School ${schoolId}: ${confirmedSlot.date} ${confirmedSlot.startTime}`,
      }],
    });

    const tpoEmails = await notifyTPOs({
      type:           AUDIT_ACTION.EXAM_FACULTY_CONFIRMED,
      title:          'Faculty Confirmed Exam Date',
      body:           `${req.user.fullName} confirmed ${confirmedSlot.date} at ${confirmedSlot.startTime} for "${sched.jobTitle}". Ready to finalise.`,
      examScheduleId: id,
      jobId:          sched.jobId,
    });
    email.sendFacultyConfirmedEmail(tpoEmails, req.user.fullName, sched.companyName, sched.jobTitle, confirmedSlot)
      .catch((e) => console.error('sendFacultyConfirmedEmail error:', e));

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      ROLES.FACULTY,
      actionType:     AUDIT_ACTION.EXAM_FACULTY_CONFIRMED,
      targetType:     'EXAM_SCHEDULE',
      targetId:       id,
      payloadSummary: `School: ${schoolId}, Slot: ${confirmedSlot.date} ${confirmedSlot.startTime}`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: 'Date confirmed. TPO will now finalise the schedule.' });
  } catch (err) {
    console.error('facultyConfirm error:', err);
    return res.status(500).json({ success: false, message: 'Failed to confirm exam date.' });
  }
};

/* ──────────── PATCH /api/exam-schedules/:id/finalize ──────────── */

const finalizeSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { confirmedSlot, venue, venueInstructions, tpoNote } = req.body;

    if (!confirmedSlot?.date || !confirmedSlot?.startTime) {
      return res.status(400).json({ success: false, message: 'confirmedSlot with date and startTime is required.' });
    }

    const schedRef = db.collection(COLLECTIONS.EXAM_SCHEDULES).doc(id);
    const schedDoc = await schedRef.get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Exam schedule not found.' });

    const sched = schedDoc.data();
    if (sched.status !== EXAM_STATUS.FACULTY_CONFIRMED) {
      return res.status(400).json({ success: false, message: `Cannot finalise from status: ${sched.status}` });
    }

    const slotMatch = (sched.proposedSlots || []).find(
      (s) => s.date === confirmedSlot.date && s.startTime === confirmedSlot.startTime,
    );
    if (!slotMatch) {
      return res.status(400).json({ success: false, message: 'Confirmed slot must match one of the proposed slots.' });
    }
    if (sched.mode === EXAM_MODE.OFFLINE && !venue) {
      return res.status(400).json({ success: false, message: 'Venue is required for OFFLINE exams.' });
    }

    const now = new Date().toISOString();
    const update = {
      status:        EXAM_STATUS.FINALIZED,
      confirmedSlot,
      tpoNote:       tpoNote || null,
      finalizedAt:   now,
      updatedAt:     now,
      statusHistory: [...(sched.statusHistory || []), {
        status: EXAM_STATUS.FINALIZED, changedAt: now, changedBy: req.user.uid,
      }],
    };
    if (sched.mode === EXAM_MODE.OFFLINE && venue) {
      update.venue              = venue;
      update.venueInstructions  = venueInstructions || null;
      update.venueAssignedBy    = req.user.uid;
      update.venueAssignedAt    = now;
    }
    await schedRef.update(update);

    const modeExtra = sched.mode === EXAM_MODE.OFFLINE
      ? ` Venue: ${venue}`
      : ' Exam link will be shared by the company.';
    const finalNotif = {
      type:           AUDIT_ACTION.EXAM_FINALIZED,
      examScheduleId: id,
      jobId:          sched.jobId,
    };

    // Notify company
    await writeNotification(sched.companyId, {
      ...finalNotif,
      title: 'Exam Schedule Finalised',
      body:  `Your exam for "${sched.jobTitle}" is set for ${confirmedSlot.date} at ${confirmedSlot.startTime} IST.${modeExtra}`,
    });

    // Notify students
    await notifyStudents(sched.shortlistedStudentIds || [], {
      ...finalNotif,
      title: `Exam Scheduled — ${sched.jobTitle}`,
      body:  `Your exam for "${sched.jobTitle}" by ${sched.companyName} is on ${confirmedSlot.date} at ${confirmedSlot.startTime} IST.${modeExtra}`,
    });

    // Notify faculty
    await notifyFacultyOfSchools(sched.involvedSchoolIds || [], {
      ...finalNotif,
      title: `Exam Finalised — ${sched.jobTitle}`,
      body:  `TPO finalised the exam: ${confirmedSlot.date} at ${confirmedSlot.startTime} IST.${modeExtra}`,
    });

    // Best-effort email to company
    const companyUserDoc = await db.collection(COLLECTIONS.USERS).doc(sched.companyId).get();
    if (companyUserDoc.exists) {
      const cu = companyUserDoc.data();
      email.sendExamFinalizedEmail(cu.email, cu.fullName || sched.companyName, sched.jobTitle, sched.companyName, confirmedSlot, sched.mode, venue || null)
        .catch((e) => console.error('sendExamFinalizedEmail error:', e));
    }

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.EXAM_FINALIZED,
      targetType:     'EXAM_SCHEDULE',
      targetId:       id,
      payloadSummary: `Slot: ${confirmedSlot.date} ${confirmedSlot.startTime}, Mode: ${sched.mode}${venue ? `, Venue: ${venue}` : ''}`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: 'Exam schedule finalised and all parties notified.' });
  } catch (err) {
    console.error('finalizeSchedule error:', err);
    return res.status(500).json({ success: false, message: 'Failed to finalise exam schedule.' });
  }
};

/* ──────────── PATCH /api/exam-schedules/:id/exam-link ──────────── */

const updateExamLink = async (req, res) => {
  try {
    const { id } = req.params;
    const { examLink } = req.body;

    if (!examLink || typeof examLink !== 'string' || !examLink.startsWith('http')) {
      return res.status(400).json({ success: false, message: 'A valid exam link URL (starting with http) is required.' });
    }

    const schedRef = db.collection(COLLECTIONS.EXAM_SCHEDULES).doc(id);
    const schedDoc = await schedRef.get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Exam schedule not found.' });

    const sched = schedDoc.data();
    if (sched.companyId !== req.user.uid) return res.status(403).json({ success: false, message: 'Access denied.' });
    if (sched.mode !== EXAM_MODE.ONLINE) return res.status(400).json({ success: false, message: 'Exam link is only applicable to ONLINE exams.' });
    if (sched.status !== EXAM_STATUS.FINALIZED) return res.status(400).json({ success: false, message: 'Exam must be FINALIZED before setting the link.' });

    // 1-hour cutoff
    const { confirmedSlot } = sched;
    if (confirmedSlot) {
      const examDt = new Date(`${confirmedSlot.date}T${confirmedSlot.startTime}:00+05:30`);
      if (Date.now() >= examDt.getTime() - 60 * 60 * 1000) {
        return res.status(400).json({ success: false, message: 'Cannot update the exam link within 1 hour of the exam.' });
      }
    }

    const now = new Date().toISOString();
    await schedRef.update({ examLink, examLinkUpdatedAt: now, updatedAt: now });

    const linkNotif = {
      type:           AUDIT_ACTION.EXAM_LINK_UPDATED,
      title:          `Exam Link Updated — ${sched.jobTitle}`,
      body:           `The exam link for "${sched.jobTitle}" by ${sched.companyName} has been updated.`,
      examScheduleId: id,
      jobId:          sched.jobId,
    };
    await notifyTPOs(linkNotif);
    await notifyStudents(sched.shortlistedStudentIds || [], linkNotif);
    await notifyFacultyOfSchools(sched.involvedSchoolIds || [], linkNotif);

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      ROLES.COMPANY,
      actionType:     AUDIT_ACTION.EXAM_LINK_UPDATED,
      targetType:     'EXAM_SCHEDULE',
      targetId:       id,
      payloadSummary: 'Link updated',
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: 'Exam link updated. All parties notified.' });
  } catch (err) {
    console.error('updateExamLink error:', err);
    return res.status(500).json({ success: false, message: 'Failed to update exam link.' });
  }
};

/* ──────────── PATCH /api/exam-schedules/:id/assign-venue ──────────── */

const assignVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const { venue, venueInstructions } = req.body;
    if (!venue) return res.status(400).json({ success: false, message: 'venue is required.' });

    const schedRef = db.collection(COLLECTIONS.EXAM_SCHEDULES).doc(id);
    const schedDoc = await schedRef.get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Exam schedule not found.' });

    const sched = schedDoc.data();
    if (sched.mode !== EXAM_MODE.OFFLINE) return res.status(400).json({ success: false, message: 'Venue can only be assigned to OFFLINE exams.' });
    if (sched.status !== EXAM_STATUS.FINALIZED) return res.status(400).json({ success: false, message: 'Exam must be FINALIZED before assigning a venue.' });

    const now = new Date().toISOString();
    await schedRef.update({
      venue,
      venueInstructions: venueInstructions || null,
      venueAssignedBy:   req.user.uid,
      venueAssignedAt:   now,
      updatedAt:         now,
    });

    const venueNotif = {
      type:           AUDIT_ACTION.EXAM_VENUE_ASSIGNED,
      title:          `Exam Venue Assigned — ${sched.jobTitle}`,
      body:           `Venue for "${sched.jobTitle}" exam: ${venue}${venueInstructions ? `. Instructions: ${venueInstructions}` : ''}`,
      examScheduleId: id,
      jobId:          sched.jobId,
    };
    await writeNotification(sched.companyId, venueNotif);
    await notifyStudents(sched.shortlistedStudentIds || [], venueNotif);
    await notifyFacultyOfSchools(sched.involvedSchoolIds || [], venueNotif);

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.EXAM_VENUE_ASSIGNED,
      targetType:     'EXAM_SCHEDULE',
      targetId:       id,
      payloadSummary: `Venue: ${venue}`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: 'Venue assigned and all parties notified.' });
  } catch (err) {
    console.error('assignVenue error:', err);
    return res.status(500).json({ success: false, message: 'Failed to assign venue.' });
  }
};

/* ──────────── PATCH /api/exam-schedules/:id/cancel ──────────── */

const cancelSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ success: false, message: 'Cancellation reason is required.' });

    const schedRef = db.collection(COLLECTIONS.EXAM_SCHEDULES).doc(id);
    const schedDoc = await schedRef.get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Exam schedule not found.' });

    const sched = schedDoc.data();
    if (sched.status === EXAM_STATUS.CANCELLED) {
      return res.status(400).json({ success: false, message: 'Already cancelled.' });
    }

    const now = new Date().toISOString();
    await schedRef.update({
      status:             EXAM_STATUS.CANCELLED,
      cancelledAt:        now,
      cancelledBy:        req.user.uid,
      cancellationReason: reason,
      updatedAt:          now,
      statusHistory:      [...(sched.statusHistory || []), {
        status: EXAM_STATUS.CANCELLED, changedAt: now, changedBy: req.user.uid, note: reason,
      }],
    });

    const cancelNotif = {
      type:           AUDIT_ACTION.EXAM_CANCELLED,
      title:          `Exam Cancelled — ${sched.jobTitle}`,
      body:           `The exam for "${sched.jobTitle}" by ${sched.companyName} has been cancelled. Reason: ${reason}`,
      examScheduleId: id,
      jobId:          sched.jobId,
    };
    await writeNotification(sched.companyId, cancelNotif);
    await notifyStudents(sched.shortlistedStudentIds || [], cancelNotif);
    await notifyFacultyOfSchools(sched.involvedSchoolIds || [], cancelNotif);

    await auditLog({
      actorUserId:    req.user.uid,
      actorRole:      req.user.role,
      actionType:     AUDIT_ACTION.EXAM_CANCELLED,
      targetType:     'EXAM_SCHEDULE',
      targetId:       id,
      payloadSummary: `Reason: ${reason}`,
      ipAddress:      req.ip,
    });

    return res.status(200).json({ success: true, message: 'Exam schedule cancelled.' });
  } catch (err) {
    console.error('cancelSchedule error:', err);
    return res.status(500).json({ success: false, message: 'Failed to cancel exam schedule.' });
  }
};

/* ──────────── GET /api/exam-schedules ──────────── */

const listExamSchedules = async (req, res) => {
  try {
    const { uid, role } = req.user;
    let snap;

    if (role === ROLES.COMPANY) {
      snap = await db.collection(COLLECTIONS.EXAM_SCHEDULES).where('companyId', '==', uid).get();
    } else if (role === ROLES.TPO || role === ROLES.ADMIN) {
      snap = await db.collection(COLLECTIONS.EXAM_SCHEDULES).get();
    } else if (role === ROLES.FACULTY) {
      const profDoc = await db.collection(COLLECTIONS.FACULTY_PROFILES).doc(uid).get();
      if (!profDoc.exists) return res.json({ success: true, data: [] });
      const { schoolId } = profDoc.data();
      snap = await db.collection(COLLECTIONS.EXAM_SCHEDULES)
        .where('involvedSchoolIds', 'array-contains', schoolId).get();
    } else {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const data = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .sort((a, b) => (b.requestedAt > a.requestedAt ? 1 : -1));

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('listExamSchedules error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch exam schedules.' });
  }
};

/* ──────────── GET /api/exam-schedules/:id ──────────── */

const getExamSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { uid, role } = req.user;

    const schedDoc = await db.collection(COLLECTIONS.EXAM_SCHEDULES).doc(id).get();
    if (!schedDoc.exists) return res.status(404).json({ success: false, message: 'Exam schedule not found.' });
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
    console.error('getExamSchedule error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch exam schedule.' });
  }
};

/* ──────────── GET /api/my-exams (Student) ──────────── */

const listMyExams = async (req, res) => {
  try {
    const uid = req.user.uid;
    // array-contains on a single field uses an auto-created index — no composite index needed
    const snap = await db.collection(COLLECTIONS.EXAM_SCHEDULES)
      .where('shortlistedStudentIds', 'array-contains', uid)
      .get();

    const data = snap.docs
      .map((d) => {
        const s = d.data();
        return {
          id:                d.id,
          jobTitle:          s.jobTitle,
          companyName:       s.companyName,
          mode:              s.mode,
          confirmedSlot:     s.confirmedSlot,
          examLink:          s.examLink,
          venue:             s.venue,
          venueInstructions: s.venueInstructions,
          finalizedAt:       s.finalizedAt,
          status:            s.status,
        };
      })
      .filter((s) => s.status === EXAM_STATUS.FINALIZED)
      .sort((a, b) => {
        const da = a.confirmedSlot?.date || '';
        const db_ = b.confirmedSlot?.date || '';
        return da < db_ ? -1 : 1;
      });

    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error('listMyExams error:', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch your exams.' });
  }
};

module.exports = {
  requestExamSchedule,
  getJobExamSchedule,
  forwardToFaculty,
  facultyConfirm,
  finalizeSchedule,
  updateExamLink,
  assignVenue,
  cancelSchedule,
  listExamSchedules,
  getExamSchedule,
  listMyExams,
};
