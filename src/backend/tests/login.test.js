/**
 * T-24 — Login Endpoint Tests
 * ───────────────────────────
 * Covers: correct credentials, unverified account, expired token.
 *
 * NOTE: Since login is Firebase Client SDK → this backend endpoint
 * receives and verifies ID tokens. We test the token verification flow.
 */

const request = require('supertest');
const { clearMockData, setMockFirestoreDoc } = require('./mocks/firebase');

jest.mock('../src/config/firebase', () => require('./mocks/firebase'));

const app = require('../src/app');

describe('POST /api/login', () => {
  beforeEach(() => {
    clearMockData();
  });

  // ── Success ──

  test('should login successfully with a valid verified token', async () => {
    const uid = 'test-user-1';

    // Set up Firestore profile
    setMockFirestoreDoc('users', uid, {
      uid,
      name: 'Test Student',
      email: `${uid}@uohyd.ac.in`,
      role: 'Student',
      department: 'CS',
      status: 'Active',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/login')
      .set('Authorization', `Bearer valid-token-${uid}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.uid).toBe(uid);
    expect(res.body.data.role).toBe('Student');
  });

  // ── Auto-activate on first verified login ──

  test('should activate an inactive account when email is verified', async () => {
    const uid = 'inactive-user';

    setMockFirestoreDoc('users', uid, {
      uid,
      name: 'Inactive User',
      email: `${uid}@uohyd.ac.in`,
      role: 'Student',
      department: 'CS',
      status: 'Inactive',
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/login')
      .set('Authorization', `Bearer valid-token-${uid}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('Active');
  });

  // ── Unverified Email ──

  test('should reject login for unverified email', async () => {
    const uid = 'unverified-user';

    setMockFirestoreDoc('users', uid, {
      uid,
      name: 'Unverified',
      email: `${uid}@uohyd.ac.in`,
      role: 'Student',
      department: 'CS',
      status: 'Inactive',
      isVerified: false,
    });

    const res = await request(app)
      .post('/api/login')
      .set('Authorization', 'Bearer valid-token-unverified')
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('verify your email');
  });

  // ── No token ──

  test('should reject login without a token', async () => {
    const res = await request(app)
      .post('/api/login')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('No token');
  });

  // ── Expired token ──

  test('should reject login with an expired token', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('Authorization', 'Bearer expired-token')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('expired');
  });

  // ── Invalid token ──

  test('should reject login with an invalid token', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('Authorization', 'Bearer invalid-token')
      .expect(500);

    expect(res.body.success).toBe(false);
  });

  // ── User profile not found ──

  test('should reject login if Firestore profile does not exist', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('Authorization', 'Bearer valid-token-no-profile')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });

  // ── Deactivated Account ──

  test('should reject login for deactivated account', async () => {
    const uid = 'deactivated-user';

    setMockFirestoreDoc('users', uid, {
      uid,
      name: 'Deactivated',
      email: `${uid}@uohyd.ac.in`,
      role: 'Student',
      department: 'CS',
      status: 'Deactivated',
      isVerified: true,
    });

    const res = await request(app)
      .post('/api/login')
      .set('Authorization', `Bearer valid-token-${uid}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('deactivated');
  });
});
