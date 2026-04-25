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
};
