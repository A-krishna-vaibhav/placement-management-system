/**
 * Test Mocks — Firebase
 * ─────────────────────
 * Provides mock implementations of firebase-admin for unit testing.
 * Exports the same shape as ../src/config/firebase.js: { admin, db, auth }
 */

// In-memory user store
const mockUsers = {};
const mockFirestoreData = {};

const mockAuth = {
  createUser: jest.fn(async ({ email, password, displayName, emailVerified }) => {
    if (mockUsers[email]) {
      const error = new Error('Email already exists');
      error.code = 'auth/email-already-exists';
      throw error;
    }
    const uid = `mock-uid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    mockUsers[email] = { uid, email, displayName, emailVerified };
    return { uid, email, displayName, emailVerified };
  }),

  verifyIdToken: jest.fn(async (token) => {
    if (token === 'expired-token') {
      const error = new Error('Token expired');
      error.code = 'auth/id-token-expired';
      throw error;
    }
    if (token === 'invalid-token') {
      throw new Error('Invalid token');
    }
    // Valid tokens follow pattern: valid-token-{uid}
    const parts = token.split('valid-token-');
    let uid = parts[1] || 'test-uid';
    // Normalize some test tokens to match firestore doc ids used in tests
    if (uid === 'unverified') uid = 'unverified-user';
    return {
      uid,
      email: `${uid}@uohyd.ac.in`,
      email_verified: token.includes('unverified') ? false : true,
    };
  }),

  setCustomUserClaims: jest.fn(async () => {}),

  generateEmailVerificationLink: jest.fn(async (email) => {
    return `https://mock-verify.com/verify?email=${email}`;
  }),

  generatePasswordResetLink: jest.fn(async (email) => {
    return `https://mock-reset.com/reset?email=${email}`;
  }),

  getUserByEmail: jest.fn(async (email) => {
    if (mockUsers[email]) return mockUsers[email];
    const error = new Error('User not found');
    error.code = 'auth/user-not-found';
    throw error;
  }),

  updateUser: jest.fn(async () => {}),
};

// Firestore mock
const mockDocData = {};

const mockDocRef = (collection, docId) => ({
  get: jest.fn(async () => {
    const key = `${collection}/${docId}`;
    if (mockDocData[key]) {
      return { exists: true, data: () => mockDocData[key], id: docId };
    }
    return { exists: false, data: () => null, id: docId };
  }),
  set: jest.fn(async (data) => {
    const key = `${collection}/${docId}`;
    mockDocData[key] = data;
  }),
  update: jest.fn(async (data) => {
    const key = `${collection}/${docId}`;
    if (mockDocData[key]) {
      mockDocData[key] = { ...mockDocData[key], ...data };
    }
  }),
});

const mockCollectionRef = (collectionName) => ({
  doc: jest.fn((docId) => mockDocRef(collectionName, docId)),
  where: jest.fn(function () { return this; }),
  orderBy: jest.fn(function () { return this; }),
  get: jest.fn(async () => {
    const results = [];
    Object.keys(mockDocData).forEach((key) => {
      if (key.startsWith(`${collectionName}/`)) {
        const id = key.split('/')[1];
        results.push({
          id,
          data: () => mockDocData[key],
        });
      }
    });
    return {
      forEach: (cb) => results.forEach(cb),
      size: results.length,
    };
  }),
});

const mockDb = {
  collection: jest.fn((name) => mockCollectionRef(name)),
};

// Helper to set up test data
const setMockFirestoreDoc = (collection, docId, data) => {
  const key = `${collection}/${docId}`;
  mockDocData[key] = data;
};

const clearMockData = () => {
  Object.keys(mockUsers).forEach((k) => delete mockUsers[k]);
  Object.keys(mockDocData).forEach((k) => delete mockDocData[k]);
  jest.clearAllMocks();
};

// Export shape compatible with ../src/config/firebase.js
module.exports = {
  // For tests that import specific names
  mockAuth,
  mockDb,
  mockUsers,
  mockDocData,
  setMockFirestoreDoc,
  clearMockData,

  // Primary exports expected by the app code
  auth: mockAuth,
  db: mockDb,
  admin: {},
};
