/**
 * Application Constants
 * ─────────────────────
 * Central location for all shared constants.
 */

const ROLES = {
  STUDENT: 'Student',
  FACULTY: 'Faculty',
  COMPANY: 'Company',
  ADMIN: 'Admin',
};

const ACCOUNT_STATUS = {
  INACTIVE: 'Inactive',
  ACTIVE: 'Active',
  DEACTIVATED: 'Deactivated',
};

// Roles that require a university email (@uohyd.ac.in)
// Only Students are required to use a university email.
const UNIVERSITY_ROLES = [ROLES.STUDENT];

const UNIVERSITY_EMAIL_DOMAIN = process.env.UNIVERSITY_EMAIL_DOMAIN || 'uohyd.ac.in';

const COLLECTIONS = {
  USERS: 'users',
  ROLES: 'roles',
};

module.exports = {
  ROLES,
  ACCOUNT_STATUS,
  UNIVERSITY_ROLES,
  UNIVERSITY_EMAIL_DOMAIN,
  COLLECTIONS,
};
