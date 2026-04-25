/**
 * Seed Admin User
 * ───────────────
 * Creates or updates the initial Admin account in Firebase Auth + Firestore.
 * Reads credentials from environment variables.
 * Run: node src/scripts/seedAdmin.js
 */

const { auth, db } = require('../config/firebase');
const { ROLES, ACCOUNT_STATUS, COLLECTIONS } = require('../config/constants');

const email    = process.env.SEED_ADMIN_EMAIL    || 'admin@uohyd.ac.in';
const password = process.env.SEED_ADMIN_PASSWORD || 'Admin@Uoh2026';
const name     = process.env.SEED_ADMIN_NAME     || 'System Administrator';

async function seedAdmin() {
  try {
    console.log('🌱  Seeding admin user...');

    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`⚠️  Admin already exists: ${userRecord.uid}`);
    } catch (err) {
      if (err.code !== 'auth/user-not-found') throw err;
      userRecord = await auth.createUser({
        email,
        password,
        displayName: name,
        emailVerified: true,
      });
      console.log(`✅  Admin created: ${userRecord.uid}`);
    }

    await auth.setCustomUserClaims(userRecord.uid, { role: ROLES.ADMIN });

    const now = new Date().toISOString();
    await db.collection(COLLECTIONS.USERS).doc(userRecord.uid).set({
      uid:         userRecord.uid,
      email,
      fullName:    name,
      role:        ROLES.ADMIN,
      status:      ACCOUNT_STATUS.ACTIVE,
      createdAt:   now,
      updatedAt:   now,
      lastLoginAt: null,
    }, { merge: true });

    console.log(`    Email: ${email}`);
    console.log('    ⚠️  Change the password after first login!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌  Seed failed:', error);
    process.exit(1);
  }
}

seedAdmin();
