/**
 * Declaration Endpoint Tests
 * ──────────────────────────
 * GET  /api/declarations/current
 * POST /api/declarations/sign
 * GET  /api/declarations/my
 */

const request = require('supertest');
const { clearMockData, setMockFirestoreDoc } = require('./mocks/firebase');

jest.mock('../src/config/firebase', () => require('./mocks/firebase'));
jest.mock('../src/services/emailService', () => ({
  sendEmail:             jest.fn(async () => ({ ok: true })),
  sendOTPEmail:          jest.fn(async () => ({ ok: true })),
  sendDeclarationEmail:  jest.fn(async () => ({ ok: true })),
  sendJobApprovalEmail:  jest.fn(async () => ({ ok: true })),
  sendJobRejectionEmail: jest.fn(async () => ({ ok: true })),
}));

const app = require('../src/app');

const STUDENT_UID   = 'student-decl-1';
const STUDENT_TOKEN = `valid-token-${STUDENT_UID}`;
const DECL_ID       = 'decl-v1';

function seedActive() {
  clearMockData();
  // Authenticated student
  setMockFirestoreDoc('users', STUDENT_UID, {
    uid:      STUDENT_UID,
    email:    `${STUDENT_UID}@uohyd.ac.in`,
    fullName: 'Decl Student',
    role:     'STUDENT',
    status:   'ACTIVE',
  });
  // Active declaration version
  setMockFirestoreDoc('declarationVersions', DECL_ID, {
    version:   '1.0',
    text:      'I declare that all information provided is accurate.',
    isActive:  true,
    createdAt: new Date().toISOString(),
    createdBy: 'admin',
  });
}

describe('GET /api/declarations/current', () => {
  beforeEach(seedActive);

  test('returns the active declaration for authenticated user', async () => {
    const res = await request(app)
      .get('/api/declarations/current')
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.version).toBe('1.0');
    expect(res.body.data.text).toBeDefined();
  });

  test('401 without token', async () => {
    await request(app).get('/api/declarations/current').expect(401);
  });
});

describe('POST /api/declarations/sign', () => {
  beforeEach(seedActive);

  test('student can sign the current declaration', async () => {
    const res = await request(app)
      .post('/api/declarations/sign')
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`)
      .send({ declarationVersionId: DECL_ID, eSignature: 'Decl Student' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.eSignature).toBe('Decl Student');
    expect(res.body.data.textHash).toBeDefined();
  });

  test('400 if eSignature is missing', async () => {
    const res = await request(app)
      .post('/api/declarations/sign')
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`)
      .send({ declarationVersionId: DECL_ID })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('404 if declarationVersionId is invalid', async () => {
    const res = await request(app)
      .post('/api/declarations/sign')
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`)
      .send({ declarationVersionId: 'no-such-id', eSignature: 'Test' })
      .expect(404);

    expect(res.body.success).toBe(false);
  });

  test('403 if non-student tries to sign', async () => {
    const tpoUid = 'tpo-sign-1';
    setMockFirestoreDoc('users', tpoUid, {
      uid: tpoUid, email: `${tpoUid}@uohyd.ac.in`,
      fullName: 'TPO User', role: 'TPO', status: 'ACTIVE',
    });
    const res = await request(app)
      .post('/api/declarations/sign')
      .set('Authorization', `Bearer valid-token-${tpoUid}`)
      .send({ declarationVersionId: DECL_ID, eSignature: 'TPO User' })
      .expect(403);

    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/declarations/my', () => {
  beforeEach(seedActive);

  test('returns empty array before signing', async () => {
    const res = await request(app)
      .get('/api/declarations/my')
      .set('Authorization', `Bearer ${STUDENT_TOKEN}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });
});
