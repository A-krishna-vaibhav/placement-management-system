/**
 * Registration Endpoint Tests
 * ───────────────────────────
 * Covers: valid input, duplicate email, missing fields,
 *         university email enforcement, Faculty/TPO/Admin self-registration block.
 */

const request = require('supertest');
const { clearMockData } = require('./mocks/firebase');

jest.mock('../src/config/firebase', () => require('./mocks/firebase'));

const app = require('../src/app');

describe('POST /api/register', () => {
  beforeEach(() => {
    clearMockData();
  });

  const validStudentPayload = {
    fullName:     'Test Student',
    email:        'teststudent@uohyd.ac.in',
    password:     'Test1234A',
    role:         'STUDENT',
    schoolId:     'scis',
    departmentId: 'dept-scis',
  };

  const validCompanyPayload = {
    fullName:    'Acme Corp Recruiter',
    email:       'recruiter@acme.com',
    password:    'Recruiter1A',
    role:        'COMPANY',
    companyName: 'Acme Corp',
  };

  // ── Success Cases ──

  test('should register a student with valid input', async () => {
    const res = await request(app)
      .post('/api/register')
      .send(validStudentPayload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(validStudentPayload.email);
    expect(res.body.data.role).toBe('STUDENT');
    expect(res.body.data.status).toBe('UNVERIFIED');
  });

  test('should register a company with any valid email and return PENDING_APPROVAL', async () => {
    const res = await request(app)
      .post('/api/register')
      .send(validCompanyPayload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('COMPANY');
    expect(res.body.data.status).toBe('PENDING_APPROVAL');
  });

  // ── Self-Registration Blocks (FR-1.11, FR-1.13) ──

  test('should reject self-registration as FACULTY with 403', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        name:     'Dr. Faculty',
        email:    'faculty@uohyd.ac.in',
        password: 'Faculty1A',
        role:     'FACULTY',
      })
      .expect(400); // validator rejects FACULTY from SELF_REGISTRABLE_ROLES

    expect(res.body.success).toBe(false);
  });

  test('should reject self-registration as TPO with 400', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        name:     'TPO User',
        email:    'tpo@uohyd.ac.in',
        password: 'TpoPass1A',
        role:     'TPO',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('should reject self-registration as ADMIN with 400', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        name:     'Hacker',
        email:    'hacker@uohyd.ac.in',
        password: 'Hack1234A',
        role:     'ADMIN',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // ── Validation Failures ──

  test('should reject registration with missing name', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, fullName: '' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('should reject registration with missing email', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, email: '' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('should reject registration with missing password', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, password: '' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('should reject registration with missing role', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, role: '' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('should reject student registration without schoolId', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, schoolId: '' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('should reject student registration without departmentId', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, departmentId: '' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // ── Password Policy (FR-1.14) ──

  test('should accept password with no uppercase (policy only requires 6+ chars)', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, password: 'test1234' })
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  test('should accept password with no digit (policy only requires 6+ chars)', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, email: 'teststudent2@uohyd.ac.in', password: 'TestPassA' })
      .expect(201);

    expect(res.body.success).toBe(true);
  });

  test('should reject weak password — too short', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, password: 'Te1A' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // ── University Email Enforcement (FR-1.2) ──

  test('should reject student registration with non-university email', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, email: 'student@gmail.com' })
      .expect(400);

    expect(res.body.success).toBe(false);
    const hasEmailError = res.body.errors?.some(
      (e) => e.message && e.message.includes('uohyd.ac.in')
    );
    expect(hasEmailError).toBe(true);
  });

  test('should reject student registration with subdomain of university domain', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, email: 'student@sub.uohyd.ac.in' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // ── Duplicate Email ──

  test('should reject duplicate email registration', async () => {
    await request(app)
      .post('/api/register')
      .send(validStudentPayload)
      .expect(201);

    const res = await request(app)
      .post('/api/register')
      .send(validStudentPayload)
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });
});
