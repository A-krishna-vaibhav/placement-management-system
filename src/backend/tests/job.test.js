/**
 * Job Endpoint Tests
 * ─────────────────
 * POST  /api/jobs
 * GET   /api/jobs
 * GET   /api/jobs/:id
 * PATCH /api/jobs/:id/approve
 * PATCH /api/jobs/:id/reject
 * PATCH /api/jobs/:id/close
 * PATCH /api/jobs/:id/withdraw
 */

const request = require('supertest');
const { clearMockData, setMockFirestoreDoc, mockDocData } = require('./mocks/firebase');

jest.mock('../src/config/firebase', () => require('./mocks/firebase'));
jest.mock('../src/services/emailService', () => ({
  sendEmail:             jest.fn(async () => ({ ok: true })),
  sendOTPEmail:          jest.fn(async () => ({ ok: true })),
  sendDeclarationEmail:  jest.fn(async () => ({ ok: true })),
  sendJobApprovalEmail:  jest.fn(async () => ({ ok: true })),
  sendJobRejectionEmail: jest.fn(async () => ({ ok: true })),
}));

const app = require('../src/app');

const CO_UID   = 'company-job-1';
const CO_TOKEN = `valid-token-${CO_UID}`;
const TPO_UID  = 'tpo-job-1';
const TPO_TOKEN = `valid-token-${TPO_UID}`;
const ST_UID   = 'student-job-1';
const ST_TOKEN = `valid-token-${ST_UID}`;
const JOB_ID   = 'job-test-001';

function seed() {
  clearMockData();
  setMockFirestoreDoc('users', CO_UID, {
    uid: CO_UID, email: `${CO_UID}@company.com`,
    fullName: 'Company User', role: 'COMPANY', status: 'ACTIVE',
  });
  setMockFirestoreDoc('companies', CO_UID, {
    companyId: CO_UID, companyName: 'TestCorp', status: 'ACTIVE',
  });
  setMockFirestoreDoc('users', TPO_UID, {
    uid: TPO_UID, email: `${TPO_UID}@uohyd.ac.in`,
    fullName: 'TPO User', role: 'TPO', status: 'ACTIVE',
  });
  setMockFirestoreDoc('users', ST_UID, {
    uid: ST_UID, email: `${ST_UID}@uohyd.ac.in`,
    fullName: 'Student User', role: 'STUDENT', status: 'ACTIVE',
  });
}

function seedJob(status = 'PENDING_APPROVAL') {
  setMockFirestoreDoc('jobs', JOB_ID, {
    companyId:   CO_UID,
    companyName: 'TestCorp',
    title:       'SDE Intern',
    description: 'Build cool stuff',
    status,
    eligibility: {},
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  });
}

describe('POST /api/jobs', () => {
  beforeEach(seed);

  test('company can create a job posting', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${CO_TOKEN}`)
      .send({ title: 'SDE Intern', description: 'Build stuff', location: 'Hyderabad' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('PENDING_APPROVAL');
    expect(res.body.data.companyId).toBe(CO_UID);
  });

  test('400 if title is missing', async () => {
    const res = await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${CO_TOKEN}`)
      .send({ description: 'No title' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('403 if student tries to create job', async () => {
    await request(app)
      .post('/api/jobs')
      .set('Authorization', `Bearer ${ST_TOKEN}`)
      .send({ title: 'Job', description: 'Desc' })
      .expect(403);
  });
});

describe('GET /api/jobs', () => {
  beforeEach(() => { seed(); seedJob('OPEN'); });

  test('student sees OPEN jobs', async () => {
    const res = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${ST_TOKEN}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('company sees own jobs', async () => {
    const res = await request(app)
      .get('/api/jobs')
      .set('Authorization', `Bearer ${CO_TOKEN}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  test('TPO can filter by status', async () => {
    const res = await request(app)
      .get('/api/jobs?status=OPEN')
      .set('Authorization', `Bearer ${TPO_TOKEN}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

describe('GET /api/jobs/:id', () => {
  beforeEach(() => { seed(); seedJob('OPEN'); });

  test('student can get an open job', async () => {
    const res = await request(app)
      .get(`/api/jobs/${JOB_ID}`)
      .set('Authorization', `Bearer ${ST_TOKEN}`)
      .expect(200);

    expect(res.body.data.title).toBe('SDE Intern');
  });

  test('student cannot see PENDING_APPROVAL job', async () => {
    seedJob('PENDING_APPROVAL');
    await request(app)
      .get(`/api/jobs/${JOB_ID}`)
      .set('Authorization', `Bearer ${ST_TOKEN}`)
      .expect(404);
  });

  test('404 for non-existent job', async () => {
    await request(app)
      .get('/api/jobs/no-such-id')
      .set('Authorization', `Bearer ${ST_TOKEN}`)
      .expect(404);
  });
});

describe('PATCH /api/jobs/:id/approve', () => {
  beforeEach(() => { seed(); seedJob('PENDING_APPROVAL'); });

  test('TPO can approve a pending job', async () => {
    const res = await request(app)
      .patch(`/api/jobs/${JOB_ID}/approve`)
      .set('Authorization', `Bearer ${TPO_TOKEN}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  test('400 if job is already OPEN', async () => {
    seedJob('OPEN');
    const res = await request(app)
      .patch(`/api/jobs/${JOB_ID}/approve`)
      .set('Authorization', `Bearer ${TPO_TOKEN}`)
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('403 if company tries to approve', async () => {
    await request(app)
      .patch(`/api/jobs/${JOB_ID}/approve`)
      .set('Authorization', `Bearer ${CO_TOKEN}`)
      .expect(403);
  });
});

describe('PATCH /api/jobs/:id/reject', () => {
  beforeEach(() => { seed(); seedJob('PENDING_APPROVAL'); });

  test('TPO can reject a pending job with reason', async () => {
    const res = await request(app)
      .patch(`/api/jobs/${JOB_ID}/reject`)
      .set('Authorization', `Bearer ${TPO_TOKEN}`)
      .send({ reason: 'Insufficient details' })
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

describe('PATCH /api/jobs/:id/close', () => {
  beforeEach(() => { seed(); seedJob('OPEN'); });

  test('TPO can close an open job', async () => {
    const res = await request(app)
      .patch(`/api/jobs/${JOB_ID}/close`)
      .set('Authorization', `Bearer ${TPO_TOKEN}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  test('400 if job is not OPEN', async () => {
    seedJob('CLOSED');
    const res = await request(app)
      .patch(`/api/jobs/${JOB_ID}/close`)
      .set('Authorization', `Bearer ${TPO_TOKEN}`)
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});

describe('PATCH /api/jobs/:id/withdraw', () => {
  beforeEach(() => { seed(); seedJob('PENDING_APPROVAL'); });

  test('company can withdraw their own pending job', async () => {
    const res = await request(app)
      .patch(`/api/jobs/${JOB_ID}/withdraw`)
      .set('Authorization', `Bearer ${CO_TOKEN}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  test('403 if company tries to withdraw another company job', async () => {
    const otherCo = 'other-company-1';
    setMockFirestoreDoc('users', otherCo, {
      uid: otherCo, email: `${otherCo}@corp.com`,
      fullName: 'Other Corp', role: 'COMPANY', status: 'ACTIVE',
    });
    await request(app)
      .patch(`/api/jobs/${JOB_ID}/withdraw`)
      .set('Authorization', `Bearer valid-token-${otherCo}`)
      .expect(403);
  });
});
