/**
 * Student Profile Validation Utility
 * ─────────────────────────────────────
 * Pure functions — no side effects, no imports, no component coupling.
 * Used by StudentProfilePage before calling the update API.
 *
 * validateProfileForm(form) → { valid: boolean, errors: { [field]: string } }
 * validateRegisterForm(form) → { valid: boolean, errors: { [field]: string } }
 */

const CURRENT_YEAR = new Date().getFullYear();
const MIN_YEAR     = 1980;
const MAX_GRAD_LAG = 8;

/* ─── helpers ────────────────────────────────────────────────────── */

const isBlank  = (v) => v === undefined || v === null || String(v).trim() === '';
const isPresent = (v) => !isBlank(v);

/**
 * Parse a year value from string or number. Returns NaN on failure.
 */
const parseYear = (v) => {
  const n = parseInt(String(v).trim(), 10);
  return Number.isNaN(n) ? NaN : n;
};

/**
 * Parse a CGPA value. Returns NaN if not numeric.
 */
const parseCgpa = (v) => {
  if (isBlank(v)) return null;
  const n = parseFloat(String(v).trim());
  return Number.isNaN(n) ? NaN : n;
};

/* ─── Individual field validators ────────────────────────────────── */
// Each returns a string error message or '' (no error).

export const validateRollNumber = (val) => {
  if (isBlank(val)) return ''; // optional field
  const v = String(val).trim();
  if (v.length < 2 || v.length > 20)
    return 'Roll number must be 2–20 characters.';
  if (!/^[A-Za-z0-9\-\/]+$/.test(v))
    return 'Roll number may only contain letters, digits, hyphens, or slashes.';
  return '';
};

export const validateProgramme = (val) => {
  if (isBlank(val)) return ''; // optional
  const v = String(val).trim();
  if (v.length < 2 || v.length > 120)
    return 'Programme name must be 2–120 characters.';
  if (!/^[A-Za-z0-9\s.\-()\/]+$/.test(v))
    return 'Programme name contains invalid characters.';
  return '';
};

export const validateJoiningYear = (val) => {
  if (isBlank(val)) return ''; // optional
  const n = parseYear(val);
  if (Number.isNaN(n))             return 'Joining year must be a number.';
  if (!Number.isInteger(n))        return 'Joining year must be a whole number.';
  if (n < MIN_YEAR)                return `Joining year cannot be before ${MIN_YEAR}.`;
  if (n > CURRENT_YEAR)            return `Joining year cannot be in the future (max ${CURRENT_YEAR}).`;
  return '';
};

export const validateGraduationYear = (val, joiningYear) => {
  if (isBlank(val)) return ''; // optional
  const n = parseYear(val);
  if (Number.isNaN(n))             return 'Graduation year must be a number.';
  if (!Number.isInteger(n))        return 'Graduation year must be a whole number.';
  if (n < MIN_YEAR)                return `Graduation year cannot be before ${MIN_YEAR}.`;
  if (n > CURRENT_YEAR + MAX_GRAD_LAG)
    return `Graduation year seems too far in the future (max ${CURRENT_YEAR + MAX_GRAD_LAG}).`;

  // Cross-field: must be ≥ joining year
  if (isPresent(joiningYear)) {
    const jy = parseYear(joiningYear);
    if (!Number.isNaN(jy) && n < jy)
      return 'Graduation year cannot be earlier than joining year.';
  }
  return '';
};

export const validateCgpa = (val) => {
  if (isBlank(val)) return ''; // optional (can be cleared)
  const n = parseCgpa(val);
  if (Number.isNaN(n))    return 'CGPA must be a number (e.g. 8.5).';
  if (n < 0)              return 'CGPA cannot be negative.';
  if (n > 10)             return 'CGPA cannot exceed 10.0.';
  // Max 2 decimal places
  if (!/^\d+(\.\d{1,2})?$/.test(String(val).trim()))
    return 'CGPA may have at most 2 decimal places (e.g. 8.75).';
  return '';
};

export const validateBacklogs = (val) => {
  if (isBlank(val)) return ''; // optional
  const n = parseInt(String(val).trim(), 10);
  if (Number.isNaN(n))    return 'Backlogs must be a whole number.';
  if (!Number.isInteger(n)) return 'Backlogs must be a whole number (no decimals).';
  if (n < 0)              return 'Backlogs cannot be negative.';
  if (n > 30)             return 'Backlogs value seems too high. Please verify.';
  return '';
};

export const validatePhoneNumber = (val) => {
  if (isBlank(val)) return ''; // optional
  const stripped = String(val).replace(/\s/g, '');
  if (!/^\d{10}$/.test(stripped))
    return 'Phone number must be exactly 10 digits — no spaces, letters, or country code.';
  if (/^(\d)\1{9}$/.test(stripped))
    return 'Phone number is not valid (all identical digits).';
  if (/^0{10}$/.test(stripped))
    return 'Phone number cannot be all zeros.';
  return '';
};

export const validateSkills = (val) => {
  if (isBlank(val)) return ''; // optional
  const arr = String(val).split(',').map((s) => s.trim()).filter(Boolean);
  if (arr.length === 0) return '';
  if (arr.length > 30)  return 'You may list at most 30 skills.';
  for (const skill of arr) {
    if (skill.length > 60)
      return `Skill "${skill.substring(0, 20)}…" is too long (max 60 characters).`;
    if (/[<>"'`;]/.test(skill))
      return `Skill "${skill.substring(0, 20)}" contains invalid characters.`;
  }
  // Duplicate check (case-insensitive)
  const lower  = arr.map((s) => s.toLowerCase());
  const unique = new Set(lower);
  if (unique.size !== lower.length)
    return 'Duplicate skills found. Each skill should appear only once.';
  return '';
};

export const validateESignature = (val, fullName) => {
  if (isBlank(val)) return 'Please type your full name as your e-signature.';
  const trimmed = String(val).trim();
  if (trimmed.length < 2) return 'E-signature must be at least 2 characters.';
  if (trimmed.length > 100) return 'E-signature is too long.';
  // Optional: warn if e-signature doesn't loosely match the registered name
  if (isPresent(fullName)) {
    const sigLower  = trimmed.toLowerCase();
    const nameLower = String(fullName).trim().toLowerCase();
    // At least one word from the name should appear in the signature
    const nameWords = nameLower.split(/\s+/).filter((w) => w.length > 1);
    const anyMatch  = nameWords.some((w) => sigLower.includes(w));
    if (!anyMatch)
      return 'E-signature does not appear to match your registered name.';
  }
  return '';
};

/* ─── Full form validator ─────────────────────────────────────────── */

/**
 * Validates the student profile edit form.
 * All fields are optional individually, but cross-field rules apply when both are present.
 *
 * @param {Object} form  The form state from StudentProfilePage
 * @returns {{ valid: boolean, errors: Object.<string, string> }}
 */
export const validateProfileForm = (form) => {
  const errors = {};

  const set = (key, msg) => { if (msg) errors[key] = msg; };

  set('rollNumber',     validateRollNumber(form.rollNumber));
  set('programme',      validateProgramme(form.programme));
  set('joiningYear',    validateJoiningYear(form.joiningYear));
  set('graduationYear', validateGraduationYear(form.graduationYear, form.joiningYear));
  set('cgpa',           validateCgpa(form.cgpa));
  set('backlogs',       validateBacklogs(form.backlogs));
  set('phoneNumber',    validatePhoneNumber(form.phoneNumber));
  set('skills',         validateSkills(form.skills));

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};

/* ─── Registration form validator ─────────────────────────────────── */

const UNIVERSITY_DOMAIN = 'uohyd.ac.in';

export const validateFullName = (val) => {
  if (isBlank(val))                 return 'Full name is required.';
  const v = String(val).trim();
  if (v.length < 2)                 return 'Full name must be at least 2 characters.';
  if (v.length > 100)               return 'Full name cannot exceed 100 characters.';
  if (!/^[A-Za-z\s.\-']+$/.test(v))
    return 'Full name may only contain letters, spaces, hyphens, apostrophes, or periods.';
  if (/^\s*$/.test(v))              return 'Full name cannot be blank.';
  return '';
};

export const validateEmail = (val, role) => {
  if (isBlank(val)) return 'Email address is required.';
  const v = String(val).trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))
    return 'Enter a valid email address.';
  if (role === 'STUDENT' && !v.endsWith(`@${UNIVERSITY_DOMAIN}`))
    return `Students must use their university email (@${UNIVERSITY_DOMAIN}).`;
  return '';
};

export const validatePassword = (val) => {
  if (isBlank(val))     return 'Password is required.';
  if (val.length < 6)   return 'Password must be at least 6 characters.';
  if (/^\s+$/.test(val)) return 'Password cannot be whitespace only.';
  return '';
};

export const validateConfirmPassword = (val, password) => {
  if (isBlank(val))      return 'Please confirm your password.';
  if (val !== password)  return 'Passwords do not match.';
  return '';
};

export const validateCompanyWebsite = (val) => {
  if (isBlank(val)) return ''; // optional
  const v = String(val).trim();
  try {
    const url = new URL(v);
    if (!['http:', 'https:'].includes(url.protocol))
      return 'Website must start with http:// or https://';
  } catch {
    return 'Enter a valid website URL (e.g. https://company.com).';
  }
  return '';
};

/**
 * Validates the registration form.
 *
 * @param {Object} form  The form state from RegisterPage
 * @returns {{ valid: boolean, errors: Object.<string, string> }}
 */
export const validateRegisterForm = (form) => {
  const errors = {};
  const set = (key, msg) => { if (msg) errors[key] = msg; };

  set('fullName', validateFullName(form.fullName));
  set('email',    validateEmail(form.email, form.role));
  set('password', validatePassword(form.password));
  set('confirmPassword', validateConfirmPassword(form.confirmPassword, form.password));

  if (form.role === 'STUDENT') {
    if (!form.schoolId)     errors.schoolId     = 'Please select a school.';
    if (!form.departmentId) errors.departmentId = 'Please select a department.';
  }

  if (form.role === 'COMPANY') {
    const cn = String(form.companyName || '').trim();
    if (!cn || cn.length < 2) errors.companyName = 'Company name (min 2 characters) is required.';
    else if (cn.length > 150) errors.companyName = 'Company name cannot exceed 150 characters.';
    set('website', validateCompanyWebsite(form.website));
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
};
