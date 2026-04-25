/**
 * syncFirestoreUserToAuth.js
 * ───────────────────────────
 * If a user exists in Firestore but NOT in Firebase Auth,
 * this script creates their Auth account with a temporary password.
 *
 * Usage:
 *   node src/scripts/syncFirestoreUserToAuth.js <email> [tempPassword]
 *
 * Example:
 *   node src/scripts/syncFirestoreUserToAuth.js 22mcce13@uohyd.ac.in TempPass@123
 */

require('dotenv').config();

const { auth, db } = require('../config/firebase');
const { COLLECTIONS, ACCOUNT_STATUS } = require('../config/constants');

const email    = process.argv[2];
const tempPwd  = process.argv[3] || 'TempPass@2026';

if (!email) {
  console.error('Usage: node syncFirestoreUserToAuth.js <email> [tempPassword]');
  process.exit(1);
}

async function sync() {
  try {
    // 1. Find user in Firestore by email
    const snap = await db.collection(COLLECTIONS.USERS).where('email', '==', email).limit(1).get();
    if (snap.empty) {
      console.error(`❌  No Firestore user found with email: ${email}`);
      process.exit(1);
    }
    const fsUser = snap.docs[0].data();
    const uid    = snap.docs[0].id;
    console.log(`✅  Found Firestore user: ${fsUser.fullName} (${uid})`);

    // 2. Check if they already exist in Firebase Auth
    try {
      const authUser = await auth.getUserByEmail(email);
      console.log(`ℹ️   Auth account already exists for ${email} (uid: ${authUser.uid})`);
      console.log('    If login fails, the password may just be wrong.');
      console.log(`    Reset it with: node syncFirestoreUserToAuth.js ${email} <newPassword>`);

      // Update password
      await auth.updateUser(authUser.uid, { password: tempPwd });
      console.log(`✅  Password reset to: ${tempPwd}`);
      console.log('    Tell the user to change their password after login.');
      process.exit(0);
    } catch (e) {
      if (e.code !== 'auth/user-not-found') throw e;
    }

    // 3. Create Auth account with the Firestore uid
    const userRecord = await auth.createUser({
      uid,
      email,
      password:      tempPwd,
      displayName:   fsUser.fullName,
      emailVerified: true,   // Skip email verification for manually-synced accounts
    });
    await auth.setCustomUserClaims(userRecord.uid, { role: fsUser.role });

    // 4. Ensure Firestore status is ACTIVE
    if (fsUser.status !== ACCOUNT_STATUS.ACTIVE) {
      await db.collection(COLLECTIONS.USERS).doc(uid).update({ status: ACCOUNT_STATUS.ACTIVE });
      console.log(`    Status updated to ACTIVE.`);
    }

    console.log(`\n✅  Auth account created successfully.`);
    console.log(`    Email:    ${email}`);
    console.log(`    Password: ${tempPwd}  ← tell the user to change this`);
    console.log(`    Role:     ${fsUser.role}`);
    process.exit(0);
  } catch (error) {
    console.error('❌  Sync failed:', error.message);
    process.exit(1);
  }
}

sync();
