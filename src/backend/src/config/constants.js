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
  EXAM_SCHEDULES:          'examSchedules',
  INTERVIEW_SCHEDULES:     'interviewSchedules',
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
  ANNOUNCEMENTS:           'announcements',
});

const EXAM_STATUS = Object.freeze({
  REQUESTED:            'REQUESTED',
  FORWARDED_TO_FACULTY: 'FORWARDED_TO_FACULTY',
  FACULTY_CONFIRMED:    'FACULTY_CONFIRMED',
  FINALIZED:            'FINALIZED',
  CANCELLED:            'CANCELLED',
});

const EXAM_MODE = Object.freeze({
  ONLINE:  'ONLINE',
  OFFLINE: 'OFFLINE',
});

const INTERVIEW_STATUS = Object.freeze({
  REQUESTED:            'REQUESTED',
  FORWARDED_TO_FACULTY: 'FORWARDED_TO_FACULTY',
  FACULTY_CONFIRMED:    'FACULTY_CONFIRMED',
  SCHEDULED:            'SCHEDULED',   // slots generated, assignment done
  LIVE:                 'LIVE',
  COMPLETED:            'COMPLETED',
  CANCELLED:            'CANCELLED',
});

const INTERVIEW_MODE = Object.freeze({
  ONLINE:  'ONLINE',
  OFFLINE: 'OFFLINE',
});

const ALLOCATION_MODE = Object.freeze({
  AUTO:           'AUTO',           // system auto-assigns students to slots
  STUDENT_CHOICE: 'STUDENT_CHOICE', // students pick slots first-come first-served
});

const LINK_TYPE = Object.freeze({
  COMMON:   'COMMON',   // one meeting link for all slots
  PER_SLOT: 'PER_SLOT', // unique link per slot
});

const SLOT_STATUS = Object.freeze({
  AVAILABLE:  'AVAILABLE',
  BOOKED:     'BOOKED',
  COMPLETED:  'COMPLETED',
  CANCELLED:  'CANCELLED',
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

const SCHOOL_APPROVAL_STATUS = Object.freeze({
  PENDING_FACULTY:  'PENDING_FACULTY',
  FACULTY_APPROVED: 'FACULTY_APPROVED',
  FACULTY_REJECTED: 'FACULTY_REJECTED',
});

const APPLICATION_STATUS = Object.freeze({
  APPLIED:                'APPLIED',
  SHORTLISTED:            'SHORTLISTED',
  NOT_SHORTLISTED:        'NOT_SHORTLISTED',
  INTERVIEW_SCHEDULED:    'INTERVIEW_SCHEDULED',
  NOT_SELECTED_INTERVIEW: 'NOT_SELECTED_INTERVIEW',
  SELECTED:               'SELECTED',
  REJECTED:               'REJECTED',
  WITHDRAWN_STUDENT:      'WITHDRAWN_STUDENT',
  WITHDRAWN_SYSTEM:       'WITHDRAWN_SYSTEM',
});

// Audit log action types per SRS §3.4
const AUDIT_ACTION = Object.freeze({
  APPROVE_COMPANY:   'APPROVE_COMPANY',
  REJECT_COMPANY:    'REJECT_COMPANY',
  APPROVE_JOB:       'APPROVE_JOB',
  REJECT_JOB:        'REJECT_JOB',
  ASSIGN_JD:         'ASSIGN_JD',
  CREATE_DRIVE:      'CREATE_DRIVE',
  BLACKLIST_ADD:     'BLACKLIST_ADD',
  BLACKLIST_LIFT:    'BLACKLIST_LIFT',
  ROLE_CHANGE:       'ROLE_CHANGE',
  BROADCAST_EMAIL:   'BROADCAST_EMAIL',
  CONFIG_CHANGE:     'CONFIG_CHANGE',
  PROVISION_FACULTY:       'PROVISION_FACULTY',
  PROVISION_TPO:           'PROVISION_TPO',
  DEACTIVATE_USER:         'DEACTIVATE_USER',
  CREATE_ANNOUNCEMENT:     'CREATE_ANNOUNCEMENT',
  DELETE_ANNOUNCEMENT:     'DELETE_ANNOUNCEMENT',
  FACULTY_APPROVE_JOB:     'FACULTY_APPROVE_JOB',
  FACULTY_REJECT_JOB:      'FACULTY_REJECT_JOB',
  EXAM_REQUESTED:              'EXAM_REQUESTED',
  EXAM_FORWARDED:              'EXAM_FORWARDED',
  EXAM_FACULTY_CONFIRMED:      'EXAM_FACULTY_CONFIRMED',
  EXAM_FINALIZED:              'EXAM_FINALIZED',
  EXAM_CANCELLED:              'EXAM_CANCELLED',
  EXAM_LINK_UPDATED:           'EXAM_LINK_UPDATED',
  EXAM_VENUE_ASSIGNED:         'EXAM_VENUE_ASSIGNED',
  INTERVIEW_REQUESTED:         'INTERVIEW_REQUESTED',
  INTERVIEW_FORWARDED:         'INTERVIEW_FORWARDED',
  INTERVIEW_FACULTY_CONFIRMED: 'INTERVIEW_FACULTY_CONFIRMED',
  INTERVIEW_SCHEDULED:         'INTERVIEW_SCHEDULED',
  INTERVIEW_COMPLETED:         'INTERVIEW_COMPLETED',
  INTERVIEW_CANCELLED:         'INTERVIEW_CANCELLED',
  INTERVIEW_LINK_UPDATED:      'INTERVIEW_LINK_UPDATED',
  INTERVIEW_SLOT_BOOKED:       'INTERVIEW_SLOT_BOOKED',
  INTERVIEW_SLOT_CANCELLED:    'INTERVIEW_SLOT_CANCELLED',
});

/**
 * Extensible keyword → school mapping used by the TPO JD assignment UI
 * to suggest relevant schools when a new job is being assigned.
 * Each rule: { label, keywords, schoolIds }
 */
const JOB_ASSIGNMENT_RULES = Object.freeze([
  {
    label: 'Software / Engineering',
    keywords: [
      'software', 'developer', 'engineer', 'coding', 'programming',
      'backend', 'frontend', 'fullstack', 'web', 'mobile', 'java',
      'python', 'javascript', 'node', 'react', 'devops', 'cloud',
      'database', 'system', 'security', 'network', 'embedded',
    ],
    schoolIds: ['scis'],
  },
  {
    label: 'Data / AI / Analytics',
    keywords: [
      'data', 'analytics', 'analyst', 'machine learning', 'ml', 'ai',
      'artificial intelligence', 'data science', 'statistics', 'statistical',
      'quantitative', 'deep learning', 'nlp', 'computer vision', 'research',
      'algorithm', 'modeling', 'simulation',
    ],
    schoolIds: ['scis', 'sms-math-stat'],
  },
  {
    label: 'Management / Business',
    keywords: [
      'management', 'manager', 'mba', 'business', 'strategy', 'consulting',
      'finance', 'marketing', 'operations', 'hr', 'human resources',
      'supply chain', 'product manager',
    ],
    schoolIds: ['sms-mgmt'],
  },
  {
    label: 'Biotech / Pharma / Healthcare',
    keywords: [
      'biotech', 'pharma', 'pharmaceutical', 'biology', 'biochemistry',
      'microbiology', 'clinical', 'medical', 'health', 'laboratory',
      'life sciences', 'research scientist',
    ],
    schoolIds: ['sls', 'soms'],
  },
  {
    label: 'Media / Communication / Design',
    keywords: [
      'media', 'communication', 'design', 'content', 'journalism',
      'digital marketing', 'ux', 'ui', 'creative', 'photography',
      'film', 'advertising',
    ],
    schoolIds: ['sns-arts'],
  },
  {
    label: 'Economics / Finance',
    keywords: [
      'economics', 'economist', 'financial', 'investment', 'banking',
      'portfolio', 'trading', 'actuary', 'insurance',
    ],
    schoolIds: ['soe', 'sms-math-stat'],
  },
  {
    label: 'Materials / Nanotechnology / Manufacturing',
    keywords: [
      'materials', 'nanotechnology', 'nano', 'manufacturing', 'vlsi',
      'microelectronics', 'semiconductor', 'fabrication', 'metallurgy',
    ],
    schoolIds: ['sest'],
  },
]);

module.exports = {
  ROLES,
  SELF_REGISTRABLE_ROLES,
  UNIVERSITY_EMAIL_ROLES,
  ADMIN_PROVISIONED_ROLES,
  ACCOUNT_STATUS,
  COMPANY_STATUS,
  JOB_STATUS,
  SCHOOL_APPROVAL_STATUS,
  APPLICATION_STATUS,
  EXAM_STATUS,
  EXAM_MODE,
  INTERVIEW_STATUS,
  INTERVIEW_MODE,
  ALLOCATION_MODE,
  LINK_TYPE,
  SLOT_STATUS,
  UNIVERSITY_EMAIL_DOMAIN,
  COLLECTIONS,
  PASSWORD_POLICY,
  OTP_POLICY,
  AUDIT_ACTION,
  JOB_ASSIGNMENT_RULES,
};
