/**
 * Login Endpoint Tests (Step 1 — OTP issuance)
 * ─────────────────────────────────────────────
 * POST /api/login verifies the Firebase ID token and issues an OTP.
 * Full session is established only after POST /api/verify-login-otp.
 */

const request = require('supertest');
const { clearMockData, setMockFirestoreDoc } = require('./mocks/firebase');

jest.mock('../src/config/firebase', () => require('./mocks/firebase'));

const app = require('../src/app');

describe('POST /api/login (Step 1 — OTP issuance)', () => {
  beforeEach(() => {
    clearMockData();
  });

  // ── Success — OTP issued ──

  test('should issue OTP for a valid verified ACTIVE user', async () => {
    const uid = 'test-user-1';

    setMockFirestoreDoc('users', uid, {
      uid,
      fullName: 'Test Student',
      email:    `${uid}@uohyd.ac.in`,
      role:     'STUDENT',
      status:   'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/login')
      .set('Authorization', `Bearer valid-token-${uid}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.otpRequired).toBe(true);
    expect(res.body.data.uid).toBe(uid);
    // devOtp exposed in test/dev environment
    expect(res.body.data.devOtp).toBeDefined();
  });

  // ── UNVERIFIED → ACTIVE transition on first verified login ──

  test('should promote UNVERIFIED to ACTIVE when email is verified', async () => {
    const uid = 'inactive-user';

    setMockFirestoreDoc('users', uid, {
      uid,
      fullName: 'New Student',
      email:    `${uid}@uohyd.ac.in`,
      role:     'STUDENT',
      status:   'UNVERIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/login')
      .set('Authorization', `Bearer valid-token-${uid}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.otpRequired).toBe(true);
  });

  // ── Blocking statuses ──

  test('should reject login for PENDING_APPROVAL account', async () => {
    const uid = 'pending-company';

    setMockFirestoreDoc('users', uid, {
      uid,
      fullName: 'Pending Company',
      email:    `${uid}@acme.com`,
      role:     'COMPANY',
      status:   'PENDING_APPROVAL',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/login')
      .set('Authorization', `Bearer valid-token-${uid}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('PENDING_APPROVAL');
  });

  test('should reject login for SUSPENDED account', async () => {
    const uid = 'suspended-user';

    setMockFirestoreDoc('users', uid, {
      uid,
      fullName: 'Suspended User',
      email:    `${uid}@uohyd.ac.in`,
      role:     'STUDENT',
      status:   'SUSPENDED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .post('/api/login')
      .set('Authorization', `Bearer valid-token-${uid}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('SUSPENDED');
  });

  test('should reject login for DEACTIVATED account', async () => {
    const uid = 'deactivated-user';

    setMockFirestoreDoc('users', uid, {
      uid,
      fullName: 'Deactivated',
      email:    `${uid}@uohyd.ac.in`,
      role:     'STUDENT',
      status:   'DEACTIVATED',
    });

    const res = await request(app)
      .post('/api/login')
      .set('Authorization', `Bearer valid-token-${uid}`)
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('DEACTIVATED');
  });

  // ── Unverified email ──

  test('should reject login for unverified email', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('Authorization', 'Bearer valid-token-unverified')
      .expect(403);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('EMAIL_NOT_VERIFIED');
  });

  // ── Token errors ──

  test('should reject login without a token', async () => {
    const res = await request(app)
      .post('/api/login')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('No token');
  });

  test('should reject login with an expired token', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('Authorization', 'Bearer expired-token')
      .expect(401);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('expired');
  });

  test('should reject login with an invalid token', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('Authorization', 'Bearer invalid-token')
      .expect(500);

    expect(res.body.success).toBe(false);
  });

  test('should reject login if Firestore profile does not exist', async () => {
    const res = await request(app)
      .post('/api/login')
      .set('Authorization', 'Bearer valid-token-no-profile')
      .expect(404);

    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('not found');
  });
});

// ── OTP Verification (Step 2) ──

describe('POST /api/verify-login-otp (Step 2 — complete sign-in)', () => {
  beforeEach(() => {
    clearMockData();
  });

  const setupActiveUser = (uid) => {
    setMockFirestoreDoc('users', uid, {
      uid,
      fullName:  'Active Student',
      email:     `${uid}@uohyd.ac.in`,
      role:      'STUDENT',
      status:    'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  };

  test('should reject OTP verification without a token', async () => {
    const res = await request(app)
      .post('/api/verify-login-otp')
      .send({ otp: '123456' })
      .expect(401);

    expect(res.body.success).toBe(false);
  });

  test('should reject OTP verification when no active OTP exists', async () => {
    const uid = 'otp-user-1';
    setupActiveUser(uid);

    const res = await request(app)
      .post('/api/verify-login-otp')
      .set('Authorization', `Bearer valid-token-${uid}`)
      .send({ otp: '123456' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('NO_OTP');
  });

  test('should complete sign-in with correct OTP', async () => {
    const uid = 'otp-user-2';
    setupActiveUser(uid);

    // Step 1 — issue OTP
    const loginRes = await request(app)
      .post('/api/login')
      .set('Authorization', `Bearer valid-token-${uid}`)
      .expect(200);

    const devOtp = loginRes.body.data.devOtp;
    expect(devOtp).toBeDefined();

    // Step 2 — verify OTP
    const res = await request(app)
      .post('/api/verify-login-otp')
      .set('Authorization', `Bearer valid-token-${uid}`)
      .send({ otp: devOtp })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.uid).toBe(uid);
    expect(res.body.data.role).toBe('STUDENT');
  });
});
