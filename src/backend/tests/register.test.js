/**
 * T-23 — Registration Endpoint Tests
 * ───────────────────────────────────
 * Covers: valid input, duplicate email, missing fields,
 *         university email enforcement, admin self-registration block.
 */

const request = require('supertest');
const { clearMockData } = require('./mocks/firebase');

// Must mock BEFORE requiring app
jest.mock('../src/config/firebase', () => require('./mocks/firebase'));

const app = require('../src/app');

describe('POST /api/register', () => {
  beforeEach(() => {
    clearMockData();
  });

  const validStudentPayload = {
    name: 'Test Student',
    email: 'teststudent@uohyd.ac.in',
    password: 'Test@1234',
    department: 'Computer Science',
    role: 'Student',
  };

  const validCompanyPayload = {
    name: 'Acme Corp Recruiter',
    email: 'recruiter@acme.com',
    password: 'Recruiter@123',
    department: 'Human Resources',
    role: 'Company',
  };

  // ── Success Cases ──

  test('should register a student with valid input', async () => {
    const res = await request(app)
      .post('/api/register')
      .send(validStudentPayload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(validStudentPayload.email);
    expect(res.body.data.role).toBe('Student');
    expect(res.body.data.status).toBe('Inactive');
  });

  test('should register a company recruiter with any valid email', async () => {
    const res = await request(app)
      .post('/api/register')
      .send(validCompanyPayload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('Company');
  });

  test('should register a faculty with university email', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        name: 'Dr. Faculty',
        email: 'faculty@uohyd.ac.in',
        password: 'Faculty@123',
        department: 'Computer Science',
        role: 'Faculty',
      })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.role).toBe('Faculty');
  });

  // ── Validation Failures ──

  test('should reject registration with missing name', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, name: '' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.errors.some((e) => e.field === 'name')).toBe(true);
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

  test('should reject registration with missing department', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, department: '' })
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

  test('should reject weak password (no uppercase)', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, password: 'test@1234' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('should reject weak password (too short)', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, password: 'Te@1' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // ── University Email Enforcement ──

  test('should reject student registration with non-university email', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({ ...validStudentPayload, email: 'student@gmail.com' })
      .expect(400);

    expect(res.body.success).toBe(false);
    const hasEmailError = res.body.errors?.some(
      (e) => e.message && e.message.includes('university email')
    );
    expect(hasEmailError).toBe(true);
  });

  test('should reject faculty registration with non-university email', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        name: 'Dr. Faculty',
        email: 'faculty@gmail.com',
        password: 'Faculty@123',
        department: 'Computer Science',
        role: 'Faculty',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // ── Admin Self-Registration Block ──

  test('should reject self-registration as Admin', async () => {
    const res = await request(app)
      .post('/api/register')
      .send({
        name: 'Hacker',
        email: 'hacker@uohyd.ac.in',
        password: 'Hack@12345',
        department: 'IT',
        role: 'Admin',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  // ── Duplicate Email ──

  test('should reject duplicate email registration', async () => {
    // First registration
    await request(app)
      .post('/api/register')
      .send(validStudentPayload)
      .expect(201);

    // Second registration with same email
    const res = await request(app)
      .post('/api/register')
      .send(validStudentPayload)
      .expect(409);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('already exists');
  });
});
