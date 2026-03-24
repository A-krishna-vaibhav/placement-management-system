/**
 * Jest Setup — Module Mocks
 * ─────────────────────────
 * Mocks firebase-admin so tests don't need a real Firebase project.
 */

const { mockAuth, mockDb } = require('./mocks/firebase');

jest.mock('../src/config/firebase', () => ({
  auth: mockAuth,
  db: mockDb,
  admin: {},
}));
