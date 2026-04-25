/**
 * One-time migration: map legacy role/status to SRS v2.0 values.
 *
 * Legacy → v2.0 mapping:
 *   role: 'Student' → 'STUDENT', 'Faculty' → 'FACULTY',
 *         'Company' → 'COMPANY', 'Admin' → 'ADMIN'
 *   status: 'Inactive' (verified)   → 'ACTIVE'
 *           'Inactive' (unverified) → 'UNVERIFIED'
 *           'Active'                → 'ACTIVE'
 *           'Deactivated'           → 'DEACTIVATED'
 *
 * Safe to run repeatedly — skips docs already migrated.
 */

const { db, auth } = require('../config/firebase');
const { COLLECTIONS, ROLES, ACCOUNT_STATUS } = require('../config/constants');

const ROLE_MAP = {
  'Student': ROLES.STUDENT,
  'Faculty': ROLES.FACULTY,
  'Company': ROLES.COMPANY,
  'Admin':   ROLES.ADMIN,
};

const STATUS_MAP = {
  'Active':      ACCOUNT_STATUS.ACTIVE,
  'Deactivated': ACCOUNT_STATUS.DEACTIVATED,
};

async function migrate() {
  console.log('Starting user migration to SRS v2.0 schema...');
  const snapshot = await db.collection(COLLECTIONS.USERS).get();
  let migrated = 0, skipped = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const updates = {};

    // Role migration
    if (ROLE_MAP[data.role]) {
      updates.role = ROLE_MAP[data.role];
    }

    // Status migration — requires checking email verification in Firebase Auth
    if (data.status === 'Inactive') {
      try {
        const fbUser = await auth.getUser(doc.id);
        updates.status = fbUser.emailVerified ? ACCOUNT_STATUS.ACTIVE : ACCOUNT_STATUS.UNVERIFIED;
      } catch (err) {
        console.warn(`User ${doc.id} not found in Firebase Auth; defaulting to UNVERIFIED`);
        updates.status = ACCOUNT_STATUS.UNVERIFIED;
      }
    } else if (STATUS_MAP[data.status]) {
      updates.status = STATUS_MAP[data.status];
    }

    if (Object.keys(updates).length === 0) {
      skipped++;
      continue;
    }

    updates.migratedAt = new Date().toISOString();
    await doc.ref.update(updates);

    // Also update custom claims to match new role value
    if (updates.role) {
      await auth.setCustomUserClaims(doc.id, { role: updates.role });
    }

    console.log(`Migrated ${doc.id}: ${JSON.stringify(updates)}`);
    migrated++;
  }

  console.log(`\nDone. Migrated: ${migrated}, Skipped (already up-to-date): ${skipped}`);
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
