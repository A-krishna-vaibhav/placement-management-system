const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_ADDRESS = process.env.EMAIL_FROM || 'PMS UoH <noreply@uohyd.ac.in>';

async function sendEmail({ to, subject, body }) {
  if (process.env.NODE_ENV === 'test') {
    return { ok: true, devLogged: true };
  }

  if (resend && process.env.RESEND_API_KEY) {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: Array.isArray(to) ? to : [to],
      subject,
      text: body,
    });
    if (error) throw new Error(`Resend error: ${error.message}`);
    return { ok: true, id: data?.id };
  }

  // Dev fallback
  console.log('\n=============== EMAIL (dev) ===============');
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:    ${body}`);
  console.log('===========================================\n');
  return { ok: true, devLogged: true };
}

async function sendOTPEmail(email, code) {
  return sendEmail({
    to: email,
    subject: 'UoH PMS — your one-time sign-in code',
    body: `Your UoH Placement Management System one-time code is: ${code}\n\nThis code expires in 10 minutes and can be used once.\nIf you did not attempt to sign in, please ignore this email.`,
  });
}

async function sendDeclarationEmail(email, fullName, version) {
  return sendEmail({
    to: email,
    subject: 'UoH PMS — PGAB Self-Declaration Signed',
    body: `Dear ${fullName},\n\nYou have successfully signed the PGAB Self-Declaration (version ${version}).\n\nThis acknowledgement is for your records. Please retain a copy for future reference.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendJobApprovalEmail(email, companyName, jobTitle) {
  return sendEmail({
    to: email,
    subject: 'UoH PMS — Job Posting Approved',
    body: `Dear ${companyName} Recruiter,\n\nYour job posting "${jobTitle}" has been approved by the TPO and is now visible to eligible students.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendJobRejectionEmail(email, companyName, jobTitle, reason) {
  return sendEmail({
    to: email,
    subject: 'UoH PMS — Job Posting Rejected',
    body: `Dear ${companyName} Recruiter,\n\nYour job posting "${jobTitle}" has been rejected by the TPO.\n\nReason: ${reason || 'No reason provided.'}\n\nPlease revise and resubmit if applicable.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendApplicationConfirmationEmail(email, studentName, jobTitle, companyName) {
  return sendEmail({
    to: email,
    subject: `UoH PMS — Application Received: ${jobTitle}`,
    body: `Dear ${studentName},\n\nYour application for the position "${jobTitle}" at ${companyName} has been successfully submitted.\n\nYou can track the status of your application on your dashboard at any time.\n\nBest of luck!\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendApplicationStatusEmail(email, studentName, jobTitle, companyName, newStatus) {
  const statusLabels = {
    SHORTLISTED:          'shortlisted for further consideration',
    INTERVIEW_SCHEDULED:  'scheduled for an interview',
    INTERVIEWED:          'marked as interviewed',
    SELECTED:             'selected for the position',
    REJECTED:             'not selected at this stage',
    WAITLISTED:           'placed on the waitlist',
  };
  const statusText = statusLabels[newStatus] || `updated to: ${newStatus}`;
  return sendEmail({
    to: email,
    subject: `UoH PMS — Application Update: ${jobTitle}`,
    body: `Dear ${studentName},\n\nYour application for "${jobTitle}" at ${companyName} has been ${statusText}.\n\nPlease log in to your dashboard to view further details.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendCompanyApprovedEmail(email, companyName) {
  return sendEmail({
    to: email,
    subject: 'UoH PMS — Registration Approved',
    body: `Dear ${companyName} Recruiter,\n\nYour company registration on the UoH Placement Management System has been approved by the TPO.\n\nYou may now log in and post job opportunities for eligible students.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendCompanyRejectedEmail(email, companyName, reason) {
  return sendEmail({
    to: email,
    subject: 'UoH PMS — Registration Decision',
    body: `Dear ${companyName} Recruiter,\n\nThank you for registering on the UoH Placement Management System. After review, your registration could not be approved at this time.\n\nReason: ${reason || 'No reason provided.'}\n\nFor further queries, please contact the TPO office.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

/* ──────────── Exam Scheduling Emails ──────────── */

async function sendExamRequestedEmail(tpoEmails, companyName, jobTitle) {
  if (!tpoEmails || !tpoEmails.length) return { ok: true };
  return sendEmail({
    to: tpoEmails,
    subject: `UoH PMS — Exam Scheduling Request: ${jobTitle}`,
    body: `${companyName} has submitted an exam scheduling request for the position "${jobTitle}".\n\nPlease log in to the Placement Management System to review the proposed slots and forward the request to the relevant faculty.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendExamForwardedEmail(facultyEmail, facultyName, companyName, jobTitle, proposedSlots) {
  const slotLines = (proposedSlots || [])
    .map((s, i) => `  ${i + 1}. ${s.date} at ${s.startTime} IST`)
    .join('\n');
  return sendEmail({
    to: facultyEmail,
    subject: `UoH PMS — Exam Date Confirmation Needed: ${jobTitle}`,
    body: `Dear ${facultyName},\n\nThe TPO has forwarded an exam scheduling request from ${companyName} for the position "${jobTitle}".\n\nProposed slots:\n${slotLines}\n\nPlease log in to the Placement Management System to confirm a suitable date for your school's students.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendFacultyConfirmedEmail(tpoEmails, facultyName, companyName, jobTitle, confirmedSlot) {
  if (!tpoEmails || !tpoEmails.length) return { ok: true };
  return sendEmail({
    to: tpoEmails,
    subject: `UoH PMS — Faculty Confirmed Exam Date: ${jobTitle}`,
    body: `Faculty member ${facultyName} has confirmed a date for the "${jobTitle}" exam by ${companyName}.\n\nConfirmed slot: ${confirmedSlot.date} at ${confirmedSlot.startTime} IST\n\nPlease log in to finalize the exam schedule and notify all parties.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendExamFinalizedEmail(recipientEmail, recipientName, jobTitle, companyName, confirmedSlot, mode, linkOrVenue) {
  const modeDetail = mode === 'ONLINE'
    ? `Exam Link: ${linkOrVenue || 'Will be shared soon by the company.'}`
    : `Venue: ${linkOrVenue || 'To be announced.'}`;
  return sendEmail({
    to: recipientEmail,
    subject: `UoH PMS — Exam Scheduled: ${jobTitle}`,
    body: `Dear ${recipientName},\n\nThe exam for "${jobTitle}" by ${companyName} has been finalized.\n\nDate: ${confirmedSlot.date}\nTime: ${confirmedSlot.startTime} IST\nMode: ${mode}\n${modeDetail}\n\nPlease log in to your dashboard for full details.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendExamLinkUpdatedEmail(recipientEmail, recipientName, jobTitle, examLink) {
  return sendEmail({
    to: recipientEmail,
    subject: `UoH PMS — Exam Link Updated: ${jobTitle}`,
    body: `Dear ${recipientName},\n\nThe exam link for "${jobTitle}" has been updated.\n\nExam Link: ${examLink}\n\nPlease log in to your dashboard for full exam details.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendExamVenueAssignedEmail(recipientEmail, recipientName, jobTitle, venue, venueInstructions) {
  return sendEmail({
    to: recipientEmail,
    subject: `UoH PMS — Exam Venue Assigned: ${jobTitle}`,
    body: `Dear ${recipientName},\n\nThe venue for the "${jobTitle}" exam has been assigned.\n\nVenue: ${venue}${venueInstructions ? `\nInstructions: ${venueInstructions}` : ''}\n\nPlease log in to your dashboard for full details.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendExamCancelledEmail(recipientEmail, recipientName, jobTitle, companyName, reason) {
  return sendEmail({
    to: recipientEmail,
    subject: `UoH PMS — Exam Cancelled: ${jobTitle}`,
    body: `Dear ${recipientName},\n\nThe exam scheduled for "${jobTitle}" by ${companyName} has been cancelled.\n\nReason: ${reason}\n\nFor further queries, please contact the TPO office.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

/* ──────────── Interview Scheduling Emails ──────────── */

async function sendInterviewRequestedEmail(tpoEmails, companyName, jobTitle) {
  if (!tpoEmails || !tpoEmails.length) return { ok: true };
  return sendEmail({
    to: tpoEmails,
    subject: `UoH PMS — Interview Scheduling Request: ${jobTitle}`,
    body: `${companyName} has submitted an interview scheduling request for the position "${jobTitle}".\n\nPlease log in to the Placement Management System to review the details and forward the request to the relevant faculty.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendInterviewForwardedEmail(facultyEmail, facultyName, companyName, jobTitle, date, windowStart, windowEnd) {
  return sendEmail({
    to: facultyEmail,
    subject: `UoH PMS — Interview Date Confirmation Needed: ${jobTitle}`,
    body: `Dear ${facultyName},\n\nThe TPO has forwarded an interview scheduling request from ${companyName} for the position "${jobTitle}".\n\nProposed window: ${date} from ${windowStart} to ${windowEnd} IST\n\nPlease log in to the Placement Management System to confirm availability.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendInterviewFacultyConfirmedEmail(tpoEmails, facultyName, companyName, jobTitle, date) {
  if (!tpoEmails || !tpoEmails.length) return { ok: true };
  return sendEmail({
    to: tpoEmails,
    subject: `UoH PMS — Faculty Confirmed Interview Date: ${jobTitle}`,
    body: `Faculty member ${facultyName} has confirmed the interview date for "${jobTitle}" by ${companyName}.\n\nConfirmed date: ${date}\n\nPlease log in to finalize the interview schedule and generate slots.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendInterviewScheduledEmail(recipientEmail, recipientName, jobTitle, companyName, date, windowStart, windowEnd, mode, linkOrVenue) {
  const modeDetail = mode === 'ONLINE'
    ? `Meeting Link: ${linkOrVenue || 'Will be shared soon.'}`
    : `Venue: ${linkOrVenue || 'To be announced.'}`;
  return sendEmail({
    to: recipientEmail,
    subject: `UoH PMS — Interview Scheduled: ${jobTitle}`,
    body: `Dear ${recipientName},\n\nInterviews for "${jobTitle}" by ${companyName} have been scheduled.\n\nDate: ${date}\nWindow: ${windowStart} – ${windowEnd} IST\nMode: ${mode}\n${modeDetail}\n\nPlease log in to your dashboard to view your specific interview slot.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendInterviewSlotAssignedEmail(recipientEmail, recipientName, jobTitle, companyName, date, startTime, endTime, mode, linkOrVenue) {
  const modeDetail = mode === 'ONLINE'
    ? `Meeting Link: ${linkOrVenue || 'Will be shared closer to the interview.'}`
    : `Venue: ${linkOrVenue || 'To be announced.'}`;
  return sendEmail({
    to: recipientEmail,
    subject: `UoH PMS — Your Interview Slot: ${jobTitle}`,
    body: `Dear ${recipientName},\n\nYour interview slot for "${jobTitle}" by ${companyName} has been assigned.\n\nDate: ${date}\nTime: ${startTime} – ${endTime} IST\nMode: ${mode}\n${modeDetail}\n\nPlease log in to your dashboard for full details and joining instructions.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendInterviewLinkUpdatedEmail(recipientEmail, recipientName, jobTitle, startTime, link) {
  return sendEmail({
    to: recipientEmail,
    subject: `UoH PMS — Interview Link Updated: ${jobTitle}`,
    body: `Dear ${recipientName},\n\nThe meeting link for your interview for "${jobTitle}" (${startTime} IST) has been updated.\n\nLink: ${link}\n\nPlease log in to your dashboard for full details.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

async function sendInterviewCancelledEmail(recipientEmail, recipientName, jobTitle, companyName, reason) {
  return sendEmail({
    to: recipientEmail,
    subject: `UoH PMS — Interview Cancelled: ${jobTitle}`,
    body: `Dear ${recipientName},\n\nThe interview scheduled for "${jobTitle}" by ${companyName} has been cancelled.\n\nReason: ${reason}\n\nFor further queries, please contact the TPO office.\n\nUniversity of Hyderabad Placement Management System`,
  });
}

module.exports = {
  sendEmail,
  sendOTPEmail,
  sendDeclarationEmail,
  sendJobApprovalEmail,
  sendJobRejectionEmail,
  sendApplicationConfirmationEmail,
  sendApplicationStatusEmail,
  sendCompanyApprovedEmail,
  sendCompanyRejectedEmail,
  sendExamRequestedEmail,
  sendExamForwardedEmail,
  sendFacultyConfirmedEmail,
  sendExamFinalizedEmail,
  sendExamLinkUpdatedEmail,
  sendExamVenueAssignedEmail,
  sendExamCancelledEmail,
  sendInterviewRequestedEmail,
  sendInterviewForwardedEmail,
  sendInterviewFacultyConfirmedEmail,
  sendInterviewScheduledEmail,
  sendInterviewSlotAssignedEmail,
  sendInterviewLinkUpdatedEmail,
  sendInterviewCancelledEmail,
};
