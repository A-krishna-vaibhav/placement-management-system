/**
 * Application Endpoint Tests
 * ──────────────────────────
 * POST  /api/jobs/:id/apply
 * GET   /api/applications
 * PATCH /api/applications/:id/withdraw
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

const ST_UID   = 'student-app-1';
const ST_TOKEN = `valid-token-${ST_UID}`;
const CO_UID   = 'company-app-1';
const JOB_ID   = 'open-job-001';
const DECL_ID  = 'decl-sig-001';
const APP_ID   = 'application-001';

function seed() {
  clearMockData();

  setMockFirestoreDoc('users', ST_UID, {
    uid: ST_UID, email: `${ST_UID}@uohyd.ac.in`,
    fullName: 'App Student', role: 'STUDENT', status: 'ACTIVE',
  });
  setMockFirestoreDoc('studentProfiles', ST_UID, {
    userId: ST_UID, cgpa: 8.0, backlogs: 0,
    departmentId: 'CS', skills: [], resumes: [], profileComplete: true,
  });
  setMockFirestoreDoc('declarationSignatures', DECL_ID, {
    userId: ST_UID, declarationVersionId: 'v1', signedAt: new Date().toISOString(),
  });
  setMockFirestoreDoc('users', CO_UID, {
    uid: CO_UID, email: `${CO_UID}@corp.com`,
    fullName: 'Corp', role: 'COMPANY', status: 'ACTIVE',
  });
  setMockFirestoreDoc('jobs', JOB_ID, {
    companyId:   CO_UID,
    companyName: 'TestCorp',
    title:       'SDE Intern',
    description: 'Build stuff',
    status:      'OPEN',
    eligibility: { minCgpa: 6.0, maxBacklogs: 2 },
    createdAt:   new Date().toISOString(),
    updatedAt:   new Date().toISOString(),
  });
}

describe('POST /api/jobs/:id/apply', () => {
  beforeEach(seed);

  test('student can apply to an open job when eligible and declaration signed', async () => {
    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/apply`)
      .set('Authorization', `Bearer ${ST_TOKEN}`)
      .send({})
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.studentId).toBe(ST_UID);
    expect(res.body.data.status).toBe('APPLIED');
  });

  test('403 if student has not signed declaration', async () => {
    // Remove the signature
    delete mockDocData[`declarationSignatures/${DECL_ID}`];

    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/apply`)
      .set('Authorization', `Bearer ${ST_TOKEN}`)
      .send({})
      .expect(403);

    expect(res.body.code).toBe('DECLARATION_REQUIRED');
  });

  test('403 if student CGPA is below minimum', async () => {
    setMockFirestoreDoc('studentProfiles', ST_UID, {
      userId: ST_UID, cgpa: 5.0, backlogs: 0,
      departmentId: 'CS', skills: [], resumes: [],
    });

    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/apply`)
      .set('Authorization', `Bearer ${ST_TOKEN}`)
      .send({})
      .expect(403);

    expect(res.body.code).toBe('NOT_ELIGIBLE');
  });

  test('400 if job is not OPEN', async () => {
    setMockFirestoreDoc('jobs', JOB_ID, {
      companyId: CO_UID, companyName: 'TestCorp',
      title: 'Closed Job', description: 'Closed',
      status: 'CLOSED', eligibility: {},
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .post(`/api/jobs/${JOB_ID}/apply`)
      .set('Authorization', `Bearer ${ST_TOKEN}`)
      .send({})
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  test('403 if company user tries to apply', async () => {
    await request(app)
      .post(`/api/jobs/${JOB_ID}/apply`)
      .set('Authorization', `Bearer valid-token-${CO_UID}`)
      .send({})
      .expect(403);
  });
});

describe('GET /api/applications', () => {
  beforeEach(seed);

  test('returns empty list before applying', async () => {
    const res = await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer ${ST_TOKEN}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  test('403 for non-student', async () => {
    await request(app)
      .get('/api/applications')
      .set('Authorization', `Bearer valid-token-${CO_UID}`)
      .expect(403);
  });
});

describe('PATCH /api/applications/:id/withdraw', () => {
  beforeEach(() => {
    seed();
    setMockFirestoreDoc('applications', APP_ID, {
      studentId:   ST_UID,
      jobId:       JOB_ID,
      jobTitle:    'SDE Intern',
      companyName: 'TestCorp',
      status:      'APPLIED',
      statusHistory: [{ status: 'APPLIED', changedAt: new Date().toISOString(), changedBy: ST_UID }],
      appliedAt:   new Date().toISOString(),
      updatedAt:   new Date().toISOString(),
    });
  });

  test('student can withdraw an applied application', async () => {
    const res = await request(app)
      .patch(`/api/applications/${APP_ID}/withdraw`)
      .set('Authorization', `Bearer ${ST_TOKEN}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });

  test('403 if student tries to withdraw another student application', async () => {
    const otherSt = 'other-student-1';
    setMockFirestoreDoc('users', otherSt, {
      uid: otherSt, email: `${otherSt}@uohyd.ac.in`,
      fullName: 'Other Student', role: 'STUDENT', status: 'ACTIVE',
    });
    const res = await request(app)
      .patch(`/api/applications/${APP_ID}/withdraw`)
      .set('Authorization', `Bearer valid-token-${otherSt}`)
      .expect(403);

    expect(res.body.success).toBe(false);
  });

  test('400 if application is already SELECTED', async () => {
    setMockFirestoreDoc('applications', APP_ID, {
      studentId: ST_UID, jobId: JOB_ID, jobTitle: 'SDE',
      companyName: 'Corp', status: 'SELECTED',
      statusHistory: [], appliedAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    });

    const res = await request(app)
      .patch(`/api/applications/${APP_ID}/withdraw`)
      .set('Authorization', `Bearer ${ST_TOKEN}`)
      .expect(400);

    expect(res.body.success).toBe(false);
  });
});
