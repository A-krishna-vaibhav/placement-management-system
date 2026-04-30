/**
 * seedFacultyAccounts.js
 * ──────────────────────
 * Targeted script — does NOT wipe all users.
 *
 * 1. Removes legacy faculty1@dev.com and faculty2@dev.com from both
 *    Firebase Auth and Firestore (users + facultyProfiles collections).
 * 2. Removes any other existing FACULTY accounts (auth + Firestore) so
 *    the 12 new ones are the single source of truth.
 * 3. Creates exactly 12 faculty accounts — one per UoH school —
 *    with email <schoolShortCode_lowercase>@dev.com and password 123456.
 *    Each account gets a corresponding facultyProfiles document.
 *
 * Safe to run multiple times — idempotent per school (skips if email exists).
 *
 * Run from src/backend/:  node src/scripts/seedFacultyAccounts.js
 */

require('dotenv').config();

const { auth, db } = require('../config/firebase');
const { ROLES, ACCOUNT_STATUS, COLLECTIONS } = require('../config/constants');

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

const LEGACY_FACULTY_EMAILS = ['faculty1@dev.com', 'faculty2@dev.com'];

async function deleteAuthByEmail(email) {
  try {
    const record = await auth.getUserByEmail(email);
    await auth.deleteUser(record.uid);
    console.log(`    Auth deleted: ${email} (uid: ${record.uid})`);
    return record.uid;
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.log(`    Auth not found (skipped): ${email}`);
      return null;
    }
    throw err;
  }
}

async function deleteFirestoreUser(uid) {
  if (!uid) return;
  const batch = db.batch();
  batch.delete(db.collection(COLLECTIONS.USERS).doc(uid));
  batch.delete(db.collection(COLLECTIONS.FACULTY_PROFILES).doc(uid));
  await batch.commit();
  console.log(`    Firestore docs deleted for uid: ${uid}`);
}

async function purgeAllExistingFaculty() {
  console.log('\n🔍  Finding all existing FACULTY Firestore accounts...');
  const snap = await db.collection(COLLECTIONS.USERS)
    .where('role', '==', ROLES.FACULTY).get();

  if (snap.empty) { console.log('    None found.'); return; }

  for (const doc of snap.docs) {
    const { email } = doc.data();
    console.log(`    Removing existing faculty: ${email} (${doc.id})`);
    try { await auth.deleteUser(doc.id); } catch (e) { /* already gone */ }
    const batch = db.batch();
    batch.delete(doc.ref);
    batch.delete(db.collection(COLLECTIONS.FACULTY_PROFILES).doc(doc.id));
    await batch.commit();
  }
  console.log(`    Removed ${snap.size} existing faculty account(s).`);
}

async function createFaculty({ email, displayName, schoolId }) {
  // Skip if already exists in Firebase Auth
  try {
    await auth.getUserByEmail(email);
    console.log(`    Already exists (skipped): ${email}`);
    return;
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;
  }

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
  console.log(`  ✅  FACULTY | ${email.padEnd(25)} | school: ${schoolId} | uid: ${userRecord.uid}`);
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  PMS Faculty Account Seed (targeted — preserves other users)');
  console.log('═══════════════════════════════════════════════════════════');

  // Step 1: Remove legacy accounts
  console.log('\n🗑   Removing legacy faculty accounts...');
  for (const email of LEGACY_FACULTY_EMAILS) {
    const uid = await deleteAuthByEmail(email);
    await deleteFirestoreUser(uid);
  }

  // Step 2: Remove ALL existing faculty (clean slate for 12 new ones)
  await purgeAllExistingFaculty();

  // Step 3: Create 12 new faculty accounts
  console.log('\n🌱  Creating 12 faculty accounts...');
  for (const fac of FACULTY_SEEDS) await createFaculty(fac);

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Done! All 12 faculty accounts created (password: 123456)');
  console.log('═══════════════════════════════════════════════════════════');
  for (const { email, schoolId } of FACULTY_SEEDS) {
    console.log(`  ${email.padEnd(25)} → ${schoolId}`);
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(0);
}

main().catch((err) => {
  console.error('❌  Error:', err.message);
  process.exit(1);
});
