/**
 * Student Profile Endpoint Tests
 * ─────────────────────────────
 * GET   /api/profile
 * PATCH /api/profile
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

const UID   = 'student-profile-1';
const TOKEN = `valid-token-${UID}`;

function seed() {
  clearMockData();
  setMockFirestoreDoc('users', UID, {
    uid: UID, email: `${UID}@uohyd.ac.in`,
    fullName: 'Profile Student', role: 'STUDENT', status: 'ACTIVE',
  });
  setMockFirestoreDoc('studentProfiles', UID, {
    userId:         UID,
    schoolId:       null,
    departmentId:   null,
    rollNumber:     null,
    programme:      null,
    joiningYear:    null,
    graduationYear: null,
    cgpa:           null,
    backlogs:       0,
    skills:         [],
    resumes:        [],
    phoneNumber:    null,
    profileComplete: false,
    changeHistory:  [],
    createdAt:      new Date().toISOString(),
    updatedAt:      new Date().toISOString(),
  });
}

describe('GET /api/profile', () => {
  beforeEach(seed);

  test('returns student profile', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${TOKEN}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.userId).toBe(UID);
  });

  test('401 without token', async () => {
    await request(app).get('/api/profile').expect(401);
  });

  test('403 for non-student role', async () => {
    const tpoUid = 'tpo-profile-1';
    setMockFirestoreDoc('users', tpoUid, {
      uid: tpoUid, email: `${tpoUid}@uohyd.ac.in`,
      fullName: 'TPO', role: 'TPO', status: 'ACTIVE',
    });
    await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer valid-token-${tpoUid}`)
      .expect(403);
  });
});

describe('PATCH /api/profile', () => {
  beforeEach(seed);

  test('updates allowed fields and records change history for cgpa', async () => {
    const res = await request(app)
      .patch('/api/profile')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ rollNumber: '21SCS001', cgpa: 8.5, backlogs: 0 })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.rollNumber).toBe('21SCS001');
    // cgpa change should be recorded
    expect(res.body.data.changeHistory.some((h) => h.field === 'cgpa')).toBe(true);
  });

  test('400 when no valid fields provided', async () => {
    const res = await request(app)
      .patch('/api/profile')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ invalidField: 'value' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('updates skills as comma-separated array', async () => {
    const res = await request(app)
      .patch('/api/profile')
      .set('Authorization', `Bearer ${TOKEN}`)
      .send({ skills: ['Python', 'React'] })
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});
