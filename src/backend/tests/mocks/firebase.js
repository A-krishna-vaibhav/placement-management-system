/**
 * Test Mocks — Firebase
 * ─────────────────────
 * Provides mock implementations of firebase-admin for unit testing.
 * Exports the same shape as ../src/config/firebase.js: { admin, db, auth }
 */

const mockUsers = {};
const mockDocData = {};

const mockAuth = {
  createUser: jest.fn(async ({ email, password, displayName, emailVerified }) => {
    if (mockUsers[email]) {
      const error = new Error('Email already exists');
      error.code = 'auth/email-already-exists';
      throw error;
    }
    const uid = `mock-uid-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
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

  getUser: jest.fn(async (uid) => {
    const found = Object.values(mockUsers).find((u) => u.uid === uid);
    if (found) return found;
    const error = new Error('User not found');
    error.code = 'auth/user-not-found';
    throw error;
  }),

  updateUser: jest.fn(async () => {}),
  deleteUser:  jest.fn(async () => {}),
};

/* ──────────────────── Firestore mock ──────────────────── */

const mockDocRef = (collection, docId) => ({
  get: jest.fn(async () => {
    const key = `${collection}/${docId}`;
    if (mockDocData[key]) {
      return { exists: true, data: () => mockDocData[key], id: docId };
    }
    return { exists: false, data: () => null, id: docId };
  }),
  set: jest.fn(async (data, opts) => {
    const key = `${collection}/${docId}`;
    if (opts && opts.merge) {
      mockDocData[key] = { ...(mockDocData[key] || {}), ...data };
    } else {
      mockDocData[key] = data;
    }
  }),
  update: jest.fn(async (data) => {
    const key = `${collection}/${docId}`;
    if (mockDocData[key]) {
      mockDocData[key] = { ...mockDocData[key], ...data };
    }
  }),
  delete: jest.fn(async () => {
    const key = `${collection}/${docId}`;
    delete mockDocData[key];
  }),
  ref: {
    update: jest.fn(async (data) => {
      const key = `${collection}/${docId}`;
      if (mockDocData[key]) {
        mockDocData[key] = { ...mockDocData[key], ...data };
      }
    }),
  },
});

const mockCollectionRef = (collectionName) => ({
  doc: jest.fn((docId) => mockDocRef(collectionName, docId)),
  where: jest.fn(function () { return this; }),
  orderBy: jest.fn(function () { return this; }),
  limit: jest.fn(function () { return this; }),
  add: jest.fn(async (data) => {
    const id = `auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const key = `${collectionName}/${id}`;
    mockDocData[key] = data;
    return { id };
  }),
  get: jest.fn(async () => {
    const results = [];
    Object.keys(mockDocData).forEach((key) => {
      if (key.startsWith(`${collectionName}/`)) {
        const id = key.split('/')[1];
        results.push({
          id,
          data: () => mockDocData[key],
          ref: mockDocRef(collectionName, id),
        });
      }
    });
    return {
      docs: results,
      forEach: (cb) => results.forEach(cb),
      empty: results.length === 0,
      size: results.length,
    };
  }),
});

// Batch mock — collects ops and applies them on commit
const mockBatch = () => {
  const ops = [];
  return {
    set: jest.fn((ref, data, opts) => {
      ops.push({ type: 'set', ref, data, opts });
    }),
    update: jest.fn((ref, data) => {
      ops.push({ type: 'update', ref, data });
    }),
    delete: jest.fn((ref) => {
      ops.push({ type: 'delete', ref });
    }),
    commit: jest.fn(async () => {
      for (const op of ops) {
        if (op.type === 'set')    await op.ref.set(op.data, op.opts);
        if (op.type === 'update') await op.ref.update(op.data);
        if (op.type === 'delete') await op.ref.delete();
      }
    }),
  };
};

const mockDb = {
  collection: jest.fn((name) => mockCollectionRef(name)),
  batch:      jest.fn(() => mockBatch()),
  runTransaction: jest.fn(async (updateFn) => {
    // Simple transaction mock — passes a txn object with get/set/update
    const txn = {
      get: jest.fn(async (ref) => ref.get()),
      set: jest.fn(async (ref, data) => ref.set(data)),
      update: jest.fn(async (ref, data) => ref.update(data)),
    };
    return updateFn(txn);
  }),
};

/* ──────────────────── Test helpers ──────────────────── */

const setMockFirestoreDoc = (collection, docId, data) => {
  mockDocData[`${collection}/${docId}`] = data;
};

const clearMockData = () => {
  Object.keys(mockUsers).forEach((k)    => delete mockUsers[k]);
  Object.keys(mockDocData).forEach((k)  => delete mockDocData[k]);
  jest.clearAllMocks();
};

module.exports = {
  mockAuth,
  mockDb,
  mockUsers,
  mockDocData,
  setMockFirestoreDoc,
  clearMockData,

  // Primary exports expected by the app code
  auth:    mockAuth,
  db:      mockDb,
  admin:   {},
  storage: null,
};
