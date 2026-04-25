/**
 * Application-wide constants.
 * Keep these in sync with SRS v2.0 §3.4.
 */

const ROLES = Object.freeze({
  STUDENT: 'STUDENT',
  FACULTY: 'FACULTY',   // School Placement Coordinator (admin-created)
  TPO:     'TPO',       // Central Training & Placement Officer (admin-created)
  COMPANY: 'COMPANY',
  ADMIN:   'ADMIN',     // Seeded only
});

// Roles that a visitor can self-register as
const SELF_REGISTRABLE_ROLES = Object.freeze([ROLES.STUDENT, ROLES.COMPANY]);

// Roles that require @uohyd.ac.in email
const UNIVERSITY_EMAIL_ROLES = Object.freeze([ROLES.STUDENT, ROLES.FACULTY, ROLES.TPO]);

// Roles that can only be provisioned by an Administrator
const ADMIN_PROVISIONED_ROLES = Object.freeze([ROLES.FACULTY, ROLES.TPO]);

const ACCOUNT_STATUS = Object.freeze({
  UNVERIFIED:        'UNVERIFIED',        // Student: awaiting email verification
  PENDING_APPROVAL:  'PENDING_APPROVAL',  // Company: awaiting TPO approval
  ACTIVE:            'ACTIVE',
  SUSPENDED:         'SUSPENDED',
  DEACTIVATED:       'DEACTIVATED',
});

const COMPANY_STATUS = Object.freeze({
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE:           'ACTIVE',
  REJECTED:         'REJECTED',
  SUSPENDED:        'SUSPENDED',
});

const UNIVERSITY_EMAIL_DOMAIN = 'uohyd.ac.in';

const COLLECTIONS = Object.freeze({
  USERS:                   'users',
  STUDENT_PROFILES:        'studentProfiles',
  FACULTY_PROFILES:        'facultyProfiles',
  COMPANIES:               'companies',
  JOBS:                    'jobs',
  APPLICATIONS:            'applications',
  DRIVES:                  'drives',
  INTERVIEW_SLOTS:         'interviewSlots',
  SLOT_BOOKINGS:           'slotBookings',
  DECLARATION_VERSIONS:    'declarationVersions',
  DECLARATION_SIGNATURES:  'declarationSignatures',
  BLACKLISTS:              'blacklists',
  AUDIT_LOGS:              'auditLogs',
  SCHOOLS:                 'schools',
  DEPARTMENTS:             'departments',
  OTP_CODES:               'otpCodes',
  NOTIFICATIONS:           'notifications',
});

// Password policy per SRS FR-1.14
const PASSWORD_POLICY = Object.freeze({
  MIN_LENGTH: 6,
  REGEX: /^.{6,}$/,
  DESCRIPTION: 'at least 6 characters',
});

// OTP policy per SRS FR-1.15, FR-1.16
const OTP_POLICY = Object.freeze({
  LENGTH: 6,
  TTL_MINUTES: 10,
  MAX_ATTEMPTS: 3,
});

const JOB_STATUS = Object.freeze({
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  OPEN:             'OPEN',
  CLOSED:           'CLOSED',
  REJECTED:         'REJECTED',
  WITHDRAWN:        'WITHDRAWN',
});

const APPLICATION_STATUS = Object.freeze({
  APPLIED:             'APPLIED',
  SHORTLISTED:         'SHORTLISTED',
  INTERVIEW_SCHEDULED: 'INTERVIEW_SCHEDULED',
  INTERVIEWED:         'INTERVIEWED',
  SELECTED:            'SELECTED',
  REJECTED:            'REJECTED',
  WAITLISTED:          'WAITLISTED',
  WITHDRAWN_STUDENT:   'WITHDRAWN_STUDENT',
  WITHDRAWN_SYSTEM:    'WITHDRAWN_SYSTEM',
});

// Audit log action types per SRS §3.4
const AUDIT_ACTION = Object.freeze({
  APPROVE_COMPANY:   'APPROVE_COMPANY',
  REJECT_COMPANY:    'REJECT_COMPANY',
  APPROVE_JOB:       'APPROVE_JOB',
  REJECT_JOB:        'REJECT_JOB',
  CREATE_DRIVE:      'CREATE_DRIVE',
  BLACKLIST_ADD:     'BLACKLIST_ADD',
  BLACKLIST_LIFT:    'BLACKLIST_LIFT',
  ROLE_CHANGE:       'ROLE_CHANGE',
  BROADCAST_EMAIL:   'BROADCAST_EMAIL',
  CONFIG_CHANGE:     'CONFIG_CHANGE',
  PROVISION_FACULTY: 'PROVISION_FACULTY',
  PROVISION_TPO:     'PROVISION_TPO',
  DEACTIVATE_USER:   'DEACTIVATE_USER',
});

module.exports = {
  ROLES,
  SELF_REGISTRABLE_ROLES,
  UNIVERSITY_EMAIL_ROLES,
  ADMIN_PROVISIONED_ROLES,
  ACCOUNT_STATUS,
  COMPANY_STATUS,
  JOB_STATUS,
  APPLICATION_STATUS,
  UNIVERSITY_EMAIL_DOMAIN,
  COLLECTIONS,
  PASSWORD_POLICY,
  OTP_POLICY,
  AUDIT_ACTION,
};
