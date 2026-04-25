/**
 * Admin User Management Endpoint Tests
 * ─────────────────────────────────────
 * Covers: list users, role updates, status updates, RBAC enforcement.
 */

const request = require('supertest');
const { clearMockData, setMockFirestoreDoc } = require('./mocks/firebase');

jest.mock('../src/config/firebase', () => require('./mocks/firebase'));

const app = require('../src/app');

describe('Admin User Management', () => {
  beforeEach(() => {
    clearMockData();

    setMockFirestoreDoc('users', 'admin-uid', {
      uid:       'admin-uid',
      fullName:  'System Admin',
      email:     'admin-uid@uohyd.ac.in',
      role:      'ADMIN',
      status:    'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setMockFirestoreDoc('users', 'student-uid', {
      uid:       'student-uid',
      fullName:  'Student User',
      email:     'student-uid@uohyd.ac.in',
      role:      'STUDENT',
      status:    'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    setMockFirestoreDoc('users', 'target-user', {
      uid:       'target-user',
      fullName:  'Target User',
      email:     'target-user@uohyd.ac.in',
      role:      'STUDENT',
      status:    'UNVERIFIED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // ── GET /api/admin/users ──

  describe('GET /api/admin/users', () => {
    test('ADMIN should retrieve user list', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeDefined();
      expect(Array.isArray(res.body.data.users)).toBe(true);
    });

    test('non-ADMIN should be rejected with 403', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token-student-uid')
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Insufficient permission');
    });

    test('unauthenticated request should be rejected with 401', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /api/admin/users/:id/role ──

  describe('PATCH /api/admin/users/:id/role', () => {
    test('ADMIN should update a user role to FACULTY', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/role')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .send({ role: 'FACULTY' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('FACULTY');
    });

    test('ADMIN should update a user role to COMPANY', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/role')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .send({ role: 'COMPANY' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('COMPANY');
    });

    test('ADMIN should reject an invalid role value', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/role')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .send({ role: 'SuperUser' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('non-ADMIN should not update roles', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/role')
        .set('Authorization', 'Bearer valid-token-student-uid')
        .send({ role: 'ADMIN' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /api/admin/users/:id/status ──

  describe('PATCH /api/admin/users/:id/status', () => {
    test('ADMIN should set user status to ACTIVE', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/status')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .send({ status: 'ACTIVE' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('ACTIVE');
    });

    test('ADMIN should set user status to DEACTIVATED', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/status')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .send({ status: 'DEACTIVATED' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('DEACTIVATED');
    });

    test('ADMIN should set user status to SUSPENDED', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/status')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .send({ status: 'SUSPENDED' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('SUSPENDED');
    });

    test('non-ADMIN should not update status', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/status')
        .set('Authorization', 'Bearer valid-token-student-uid')
        .send({ status: 'ACTIVE' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    test('ADMIN should reject an invalid status value', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/status')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .send({ status: 'Banned' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
