/**
 * resetAndSeedUsers.js
 * ─────────────────────
 * 1. Deletes ALL users from Firebase Auth and their Firestore documents.
 * 2. Creates 4 dev seed accounts: Admin, TPO, Faculty1, Faculty2.
 *
 * Run from src/backend/:  node src/scripts/resetAndSeedUsers.js
 */

require('dotenv').config();

const { auth, db } = require('../config/firebase');
const { ROLES, ACCOUNT_STATUS, COLLECTIONS } = require('../config/constants');

const SEED_USERS = [
  {
    email:       'admin@dev.com',
    password:    '123456',
    displayName: 'Admin',
    role:        ROLES.ADMIN,
  },
  {
    email:       'tpo@dev.com',
    password:    '123456',
    displayName: 'TPO',
    role:        ROLES.TPO,
  },
  {
    email:       'faculty1@dev.com',
    password:    '123456',
    displayName: 'faculty1',
    role:        ROLES.FACULTY,
  },
  {
    email:       'faculty2@dev.com',
    password:    '123456',
    displayName: 'faculty2',
    role:        ROLES.FACULTY,
  },
];

async function deleteAllUsers() {
  console.log('\n🗑   Deleting all Firebase Auth users...');
  let pageToken;
  let totalDeleted = 0;

  do {
    const result = await auth.listUsers(1000, pageToken);
    if (result.users.length === 0) break;

    const uids = result.users.map((u) => u.uid);
    await auth.deleteUsers(uids);
    totalDeleted += uids.length;
    console.log(`    Deleted ${uids.length} auth user(s)`);
    pageToken = result.pageToken;
  } while (pageToken);

  console.log(`    Total auth users deleted: ${totalDeleted}`);
}

async function deleteAllFirestoreUsers() {
  console.log('\n🗑   Deleting all Firestore user documents...');
  const snapshot = await db.collection(COLLECTIONS.USERS).get();
  if (snapshot.empty) {
    console.log('    No Firestore user docs found.');
    return;
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`    Deleted ${snapshot.size} Firestore user document(s)`);
}

async function createUser({ email, password, displayName, role }) {
  const userRecord = await auth.createUser({
    email,
    password,
    displayName,
    emailVerified: true,
  });

  await auth.setCustomUserClaims(userRecord.uid, { role });

  const now = new Date().toISOString();
  await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
    uid:         userRecord.uid,
    email,
    fullName:    displayName,
    role,
    status:      ACCOUNT_STATUS.ACTIVE,
    createdAt:   now,
    updatedAt:   now,
    lastLoginAt: null,
  });

  console.log(`  ✅  ${role.padEnd(8)} | ${email.padEnd(30)} | uid: ${userRecord.uid}`);
}

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  PMS Dev Reset & Seed');
  console.log('═══════════════════════════════════════════');

  await deleteAllUsers();
  await deleteAllFirestoreUsers();

  console.log('\n🌱  Creating seed users...');
  for (const user of SEED_USERS) {
    await createUser(user);
  }

  console.log('\n═══════════════════════════════════════════');
  console.log('  Done! Credentials:');
  console.log('═══════════════════════════════════════════');
  for (const { email, password, role } of SEED_USERS) {
    console.log(`  ${role.padEnd(8)} | ${email.padEnd(30)} | password: ${password}`);
  }
  console.log('═══════════════════════════════════════════\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
