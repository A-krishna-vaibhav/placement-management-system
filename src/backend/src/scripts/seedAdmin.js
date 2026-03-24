/**
 * Seed Admin User
 * ───────────────
 * Creates the initial Admin account in Firebase Auth + Firestore.
 * Run once:  node src/scripts/seedAdmin.js
 */

const { auth, db } = require('../config/firebase');
const { ROLES, ACCOUNT_STATUS, COLLECTIONS } = require('../config/constants');

const ADMIN_EMAIL = 'admin@uohyd.ac.in';
const ADMIN_PASSWORD = 'Admin@123456';
const ADMIN_NAME = 'PMS Administrator';
const ADMIN_DEPARTMENT = 'Training & Placement Office';

async function seedAdmin() {
  try {
    console.log('🌱  Seeding admin user...');

    // Check if admin already exists
    try {
      const existing = await auth.getUserByEmail(ADMIN_EMAIL);
      console.log(`⚠️  Admin user already exists: ${existing.uid}`);
      return;
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
    }

    // Create in Firebase Auth
    const userRecord = await auth.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
      emailVerified: true,
    });

    // Set custom claims
    await auth.setCustomUserClaims(userRecord.uid, { role: ROLES.ADMIN });

    // Create Firestore profile
    await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
      uid: userRecord.uid,
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: ROLES.ADMIN,
      department: ADMIN_DEPARTMENT,
      status: ACCOUNT_STATUS.ACTIVE,
      isVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log(`✅  Admin user created: ${userRecord.uid}`);
    console.log(`    Email: ${ADMIN_EMAIL}`);
    console.log(`    Password: ${ADMIN_PASSWORD}`);
    console.log('    ⚠️  Change the password after first login!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌  Seed failed:', error);
    process.exit(1);
  }
}

seedAdmin();
