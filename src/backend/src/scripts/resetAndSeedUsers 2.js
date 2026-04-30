/**
 * resetAndSeedUsers.js
 * ─────────────────────
 * 1. Deletes ALL users from Firebase Auth and their Firestore documents.
 * 2. Creates dev seed accounts: Admin, TPO, and 12 Faculty (one per school).
 *
 * Run from src/backend/:  node src/scripts/resetAndSeedUsers.js
 */

require('dotenv').config();

const { auth, db } = require('../config/firebase');
const { ROLES, ACCOUNT_STATUS, COLLECTIONS } = require('../config/constants');

// One faculty per school — email = <shortCode_lowercase>@dev.com
const FACULTY_SEEDS = [
  { email: 'smms@dev.com', displayName: 'Faculty SMMS', schoolId: 'sms-math-stat' },
  { email: 'sop@dev.com',  displayName: 'Faculty SOP',  schoolId: 'sop'           },
  { email: 'soc@dev.com',  displayName: 'Faculty SOC',  schoolId: 'sms-chem'      },
  { email: 'sls@dev.com',  displayName: 'Faculty SLS',  schoolId: 'sls'           },
  { email: 'soh@dev.com',  displayName: 'Faculty SOH',  schoolId: 'soh'           },
  { email: 'sss@dev.com',  displayName: 'Faculty SSS',  schoolId: 'sss'           },
  { email: 'soe@dev.com',  displayName: 'Faculty SOE',  schoolId: 'soe'           },
  { email: 'scis@dev.com', displayName: 'Faculty SCIS', schoolId: 'scis'          },
  { email: 'sns@dev.com',  displayName: 'Faculty SNS',  schoolId: 'sns-arts'      },
  { email: 'sms@dev.com',  displayName: 'Faculty SMS',  schoolId: 'sms-mgmt'      },
  { email: 'soms@dev.com', displayName: 'Faculty SOMS', schoolId: 'soms'          },
  { email: 'sest@dev.com', displayName: 'Faculty SEST', schoolId: 'sest'          },
];

const BASE_USERS = [
  { email: 'admin@dev.com', password: '123456', displayName: 'Admin', role: ROLES.ADMIN },
  { email: 'tpo@dev.com',   password: '123456', displayName: 'TPO',   role: ROLES.TPO  },
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
  if (snapshot.empty) { console.log('    No Firestore user docs found.'); return; }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`    Deleted ${snapshot.size} Firestore user document(s)`);
}

async function deleteAllFacultyProfiles() {
  console.log('\n🗑   Deleting all Firestore facultyProfile documents...');
  const snapshot = await db.collection(COLLECTIONS.FACULTY_PROFILES).get();
  if (snapshot.empty) { console.log('    No faculty profiles found.'); return; }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => batch.delete(doc.ref));
  await batch.commit();
  console.log(`    Deleted ${snapshot.size} faculty profile(s)`);
}

async function createBaseUser({ email, password, displayName, role }) {
  const userRecord = await auth.createUser({ email, password, displayName, emailVerified: true });
  await auth.setCustomUserClaims(userRecord.uid, { role });

  const now = new Date().toISOString();
  await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
    uid: userRecord.uid, email, fullName: displayName,
    role, status: ACCOUNT_STATUS.ACTIVE,
    createdAt: now, updatedAt: now, lastLoginAt: null,
  });

  console.log(`  ✅  ${role.padEnd(8)} | ${email.padEnd(30)} | uid: ${userRecord.uid}`);
}

async function createFaculty({ email, displayName, schoolId }) {
  const userRecord = await auth.createUser({
    email, password: '123456', displayName, emailVerified: true,
  });
  await auth.setCustomUserClaims(userRecord.uid, { role: ROLES.FACULTY });

  const now = new Date().toISOString();
  const batch = db.batch();

  batch.set(db.collection(COLLECTIONS.USERS).doc(userRecord.uid), {
    uid: userRecord.uid, email, fullName: displayName,
    role: ROLES.FACULTY, status: ACCOUNT_STATUS.ACTIVE,
    createdAt: now, updatedAt: now, lastLoginAt: null,
  });

  batch.set(db.collection(COLLECTIONS.FACULTY_PROFILES).doc(userRecord.uid), {
    userId: userRecord.uid, schoolId,
    designation: null, phoneNumber: null,
    createdAt: now, updatedAt: now,
  });

  await batch.commit();
  console.log(`  ✅  FACULTY   | ${email.padEnd(30)} | schoolId: ${schoolId}`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  PMS Dev Reset & Seed');
  console.log('═══════════════════════════════════════════════════════════');

  await deleteAllUsers();
  await deleteAllFirestoreUsers();
  await deleteAllFacultyProfiles();

  console.log('\n🌱  Creating base seed users (Admin, TPO)...');
  for (const user of BASE_USERS) await createBaseUser(user);

  console.log('\n🌱  Creating 12 faculty accounts (one per school)...');
  for (const fac of FACULTY_SEEDS) await createFaculty(fac);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Done! Credentials (all passwords: 123456)');
  console.log('═══════════════════════════════════════════════════════════');
  for (const { email, role } of BASE_USERS) {
    console.log(`  ${role.padEnd(8)} | ${email}`);
  }
  console.log('  ---');
  for (const { email, schoolId } of FACULTY_SEEDS) {
    console.log(`  FACULTY  | ${email.padEnd(25)} | school: ${schoolId}`);
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
