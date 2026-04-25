/**
 * Seeds the PGAB Self-Declaration v1 into Firestore.
 * Run: node src/scripts/seedInitialDeclaration.js
 */

require('dotenv').config();

const { db } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');

const DECLARATION_TEXT = `University of Hyderabad
Placement Guidance & Advisory Bureau

SELF-DECLARATION

To,
The Placement Guidance and Advisory Bureau (PGAB),
University of Hyderabad.

I, _______________________________________, with the registration number __________________ hereby declare that I want to participate in the Placement Drive conducted by the Placement Guidance and Advisory Bureau (PGAB), University of Hyderabad.

I completely understand my responsibilities and under no circumstance will I disobey company's norms. I acknowledge my privileges and hence will value each opportunity provided by PGAB, failing which I will be blacklisted from sitting in any further opportunities. I accept all the terms and conditions stipulated by the PGAB which are mentioned below and will abide by the same.

Terms and Conditions:

1. I will abide by all the rules of the PGAB as stated in their rulebook.

2. I understand that failing to abide by the rules of the PGAB would get me blacklisted from the Placements, which makes me ineligible to access the services of both the PGAB and the Placement Cell of my school / Department, University of Hyderabad.

3. Before giving consent to apply for any company, I will satisfy myself regarding the pay package etc. If I don't attend the placement drive after applying, I agree that I will not be allowed to attend next 3 placement drives.

4. If I get an offer, I will accept it and honor my commitment as stipulated by the company. Failing to do so, I will be debarred from all placement drives.

5. I assure that the information I provide to PGAB or the Company is true in all aspects.

Note: Central Placement Cell is to be understood as referring to the Office of the Placement Guidance Advisory Bureau of the University of Hyderabad.

By typing my full name below and clicking "Sign Declaration", I electronically sign this declaration and confirm that I have read, understood, and agree to all the terms and conditions stated above.`.trim();

async function seed() {
  const id = 'v1-pgab-2024-26';

  // Deactivate any existing active versions first
  const existing = await db
    .collection(COLLECTIONS.DECLARATION_VERSIONS)
    .where('isActive', '==', true)
    .get();

  const batch = db.batch();
  existing.docs.forEach((d) => batch.update(d.ref, { isActive: false }));

  // Set the new active version
  const ref = db.collection(COLLECTIONS.DECLARATION_VERSIONS).doc(id);
  batch.set(ref, {
    version:       1,
    text:          DECLARATION_TEXT,
    isActive:      true,
    effectiveFrom: new Date('2024-08-01T00:00:00Z').toISOString(),
    createdAt:     new Date().toISOString(),
    createdBy:     'system-seed',
  }, { merge: true });

  await batch.commit();
  console.log('✅  PGAB Self-Declaration v1 seeded and set as active.');
  process.exit(0);
}

seed().catch((e) => { console.error('❌ Seed failed:', e.message); process.exit(1); });
