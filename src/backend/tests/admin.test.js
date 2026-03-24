/**
 * T-25 — Role Assignment Endpoint Tests
 * ──────────────────────────────────────
 * Covers: admin can assign roles, non-admin gets 403.
 *
 * Since admin routes require authenticate + authorize('Admin'),
 * we test both middleware layers.
 */

const request = require('supertest');
const { clearMockData, setMockFirestoreDoc, mockAuth } = require('./mocks/firebase');

jest.mock('../src/config/firebase', () => require('./mocks/firebase'));

const app = require('../src/app');

describe('Admin User Management', () => {
  beforeEach(() => {
    clearMockData();

    // Create admin user in Firestore
    setMockFirestoreDoc('users', 'admin-uid', {
      uid: 'admin-uid',
      name: 'Admin',
      email: 'admin-uid@uohyd.ac.in',
      role: 'Admin',
      department: 'TPO',
      status: 'Active',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create a regular student
    setMockFirestoreDoc('users', 'student-uid', {
      uid: 'student-uid',
      name: 'Student',
      email: 'student-uid@uohyd.ac.in',
      role: 'Student',
      department: 'CS',
      status: 'Inactive',
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Create a target user to be updated
    setMockFirestoreDoc('users', 'target-user', {
      uid: 'target-user',
      name: 'Target User',
      email: 'target-user@uohyd.ac.in',
      role: 'Student',
      department: 'CS',
      status: 'Inactive',
      isVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });

  // ── GET /api/admin/users ──

  describe('GET /api/admin/users', () => {
    test('admin should retrieve user list', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeDefined();
      expect(Array.isArray(res.body.data.users)).toBe(true);
    });

    test('non-admin should be rejected with 403', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer valid-token-student-uid')
        .expect(403);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Access denied');
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
    test('admin should update a user role', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/role')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .send({ role: 'Faculty' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.role).toBe('Faculty');
    });

    test('admin should reject invalid role value', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/role')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .send({ role: 'SuperUser' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });

    test('non-admin should not update roles', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/role')
        .set('Authorization', 'Bearer valid-token-student-uid')
        .send({ role: 'Admin' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  // ── PATCH /api/admin/users/:id/status ──

  describe('PATCH /api/admin/users/:id/status', () => {
    test('admin should activate a user account', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/status')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .send({ status: 'Active' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Active');
    });

    test('admin should deactivate a user account', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/status')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .send({ status: 'Deactivated' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('Deactivated');
    });

    test('non-admin should not update status', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/status')
        .set('Authorization', 'Bearer valid-token-student-uid')
        .send({ status: 'Active' })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    test('admin should reject invalid status value', async () => {
      const res = await request(app)
        .patch('/api/admin/users/target-user/status')
        .set('Authorization', 'Bearer valid-token-admin-uid')
        .send({ status: 'Banned' })
        .expect(400);

      expect(res.body.success).toBe(false);
    });
  });
});
