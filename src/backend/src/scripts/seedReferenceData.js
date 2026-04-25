/**
 * Seeds the 12 Schools and all programmes of the University of Hyderabad
 * into Firestore. Idempotent — re-running updates rather than duplicates.
 *
 * Source: UoH Prospectus 2026 / uohyd.ac.in/schools-departments/
 * Run: node src/scripts/seedReferenceData.js
 */

require('dotenv').config();

const { db } = require('../config/firebase');
const { COLLECTIONS } = require('../config/constants');

/* ─── Schools ─────────────────────────────────────────────────────── */
const SCHOOLS = [
  { id: 'sms-math-stat', name: 'School of Mathematics & Statistics',          shortCode: 'SMMS' },
  { id: 'sop',           name: 'School of Physics',                           shortCode: 'SOP'  },
  { id: 'sms-chem',      name: 'School of Chemistry',                         shortCode: 'SOC'  },
  { id: 'sls',           name: 'School of Life Sciences',                     shortCode: 'SLS'  },
  { id: 'soh',           name: 'School of Humanities',                        shortCode: 'SOH'  },
  { id: 'sss',           name: 'School of Social Sciences',                   shortCode: 'SSS'  },
  { id: 'soe',           name: 'School of Economics',                         shortCode: 'SOE'  },
  { id: 'scis',          name: 'School of Computer & Information Sciences',    shortCode: 'SCIS' },
  { id: 'sns-arts',      name: 'S.N. School of Arts & Communication',         shortCode: 'SNS'  },
  { id: 'sms-mgmt',      name: 'School of Management Studies',                shortCode: 'SMS'  },
  { id: 'soms',          name: 'School of Medical Sciences',                  shortCode: 'SOMS' },
  { id: 'sest',          name: 'School of Engineering Sciences & Technology', shortCode: 'SEST' },
];

/* ─── Programmes (stored as "departments" for student registration) ── */
const DEPARTMENTS = [

  /* ── 1. School of Mathematics & Statistics ── */
  { id: 'prog-imsc-math',      schoolId: 'sms-math-stat', name: 'Integrated M.Sc. Mathematical Sciences',       type: 'integrated' },
  { id: 'prog-msc-math',       schoolId: 'sms-math-stat', name: 'M.Sc. Mathematics',                            type: 'pg' },
  { id: 'prog-msc-appmath',    schoolId: 'sms-math-stat', name: 'M.Sc. Applied Mathematics',                    type: 'pg' },
  { id: 'prog-msc-statsor',    schoolId: 'sms-math-stat', name: 'M.Sc. Statistics-OR (Operations Research)',    type: 'pg' },

  /* ── 2. School of Physics ── */
  { id: 'prog-imsc-phys',      schoolId: 'sop', name: 'Integrated M.Sc. Physics',                              type: 'integrated' },
  { id: 'prog-msc-phys',       schoolId: 'sop', name: 'M.Sc. Physics',                                        type: 'pg' },
  { id: 'prog-imsc-geol',      schoolId: 'sop', name: 'Integrated M.Sc. Applied Geology',                     type: 'integrated' },
  { id: 'prog-imsc-earth',     schoolId: 'sop', name: 'Integrated M.Sc. Earth Sciences',                      type: 'integrated' },
  { id: 'prog-msc-ocean',      schoolId: 'sop', name: 'M.Sc. Ocean and Atmospheric Sciences',                 type: 'pg' },
  { id: 'prog-mtech-mineral',  schoolId: 'sop', name: 'M.Tech Mineral Exploration',                           type: 'pg' },

  /* ── 3. School of Chemistry ── */
  { id: 'prog-imsc-chem',      schoolId: 'sms-chem', name: 'Integrated M.Sc. Chemical Sciences',              type: 'integrated' },
  { id: 'prog-msc-chem',       schoolId: 'sms-chem', name: 'M.Sc. Chemistry',                                 type: 'pg' },

  /* ── 4. School of Life Sciences ── */
  { id: 'prog-imsc-bio',       schoolId: 'sls', name: 'Integrated M.Sc. Biology (Systems Biology)',           type: 'integrated' },
  { id: 'prog-msc-biochem',    schoolId: 'sls', name: 'M.Sc. Biochemistry',                                   type: 'pg' },
  { id: 'prog-msc-plantbio',   schoolId: 'sls', name: 'M.Sc. Plant Biology & Biotechnology',                  type: 'pg' },
  { id: 'prog-msc-microbio',   schoolId: 'sls', name: 'M.Sc. Molecular Microbiology',                         type: 'pg' },
  { id: 'prog-msc-animalbio',  schoolId: 'sls', name: 'M.Sc. Animal Biology & Biotechnology',                 type: 'pg' },
  { id: 'prog-msc-biotech',    schoolId: 'sls', name: 'M.Sc. Biotechnology (via GAT-B)',                      type: 'pg' },

  /* ── 5. School of Humanities ── */
  { id: 'prog-ima-english',    schoolId: 'soh', name: 'Integrated M.A. English',                              type: 'integrated' },
  { id: 'prog-ima-hindi',      schoolId: 'soh', name: 'Integrated M.A. Hindi',                               type: 'integrated' },
  { id: 'prog-ima-telugu',     schoolId: 'soh', name: 'Integrated M.A. Telugu',                              type: 'integrated' },
  { id: 'prog-ima-urdu',       schoolId: 'soh', name: 'Integrated M.A. Urdu',                                type: 'integrated' },
  { id: 'prog-ima-phil',       schoolId: 'soh', name: 'Integrated M.A. Philosophy',                          type: 'integrated' },
  { id: 'prog-ima-sanskrit',   schoolId: 'soh', name: 'Integrated M.A. Sanskrit',                            type: 'integrated' },
  { id: 'prog-ima-langsci',    schoolId: 'soh', name: 'Integrated M.A. Language Sciences',                   type: 'integrated' },
  { id: 'prog-ima-complt',     schoolId: 'soh', name: 'Integrated M.A. Comparative Literature',              type: 'integrated' },
  { id: 'prog-ma-english',     schoolId: 'soh', name: 'M.A. English',                                        type: 'pg' },
  { id: 'prog-ma-hindi',       schoolId: 'soh', name: 'M.A. Hindi',                                          type: 'pg' },
  { id: 'prog-ma-telugu',      schoolId: 'soh', name: 'M.A. Telugu',                                         type: 'pg' },
  { id: 'prog-ma-urdu',        schoolId: 'soh', name: 'M.A. Urdu',                                           type: 'pg' },
  { id: 'prog-ma-appling',     schoolId: 'soh', name: 'M.A. Applied Linguistics',                            type: 'pg' },
  { id: 'prog-ma-complt',      schoolId: 'soh', name: 'M.A. Comparative Literature',                         type: 'pg' },
  { id: 'prog-ma-els',         schoolId: 'soh', name: 'M.A. English Language Studies',                       type: 'pg' },
  { id: 'prog-ma-sanskrit',    schoolId: 'soh', name: 'M.A. Sanskrit Studies',                               type: 'pg' },
  { id: 'prog-ma-phil',        schoolId: 'soh', name: 'M.A. Philosophy',                                     type: 'pg' },

  /* ── 6. School of Social Sciences ── */
  { id: 'prog-ima-hist',       schoolId: 'sss', name: 'Integrated M.A. History',                             type: 'integrated' },
  { id: 'prog-ima-polsci',     schoolId: 'sss', name: 'Integrated M.A. Political Science',                   type: 'integrated' },
  { id: 'prog-ima-socio',      schoolId: 'sss', name: 'Integrated M.A. Sociology',                           type: 'integrated' },
  { id: 'prog-ima-anthro',     schoolId: 'sss', name: 'Integrated M.A. Anthropology',                        type: 'integrated' },
  { id: 'prog-ma-hist',        schoolId: 'sss', name: 'M.A. History',                                        type: 'pg' },
  { id: 'prog-ma-polsci',      schoolId: 'sss', name: 'M.A. Political Science',                              type: 'pg' },
  { id: 'prog-ma-socio',       schoolId: 'sss', name: 'M.A. Sociology',                                      type: 'pg' },
  { id: 'prog-ma-anthro',      schoolId: 'sss', name: 'M.A. Anthropology',                                   type: 'pg' },
  { id: 'prog-med-edu',        schoolId: 'sss', name: 'M.Ed. Education',                                     type: 'pg' },

  /* ── 7. School of Economics ── */
  { id: 'prog-ima-econ',       schoolId: 'soe', name: 'Integrated M.A. Economics',                           type: 'integrated' },
  { id: 'prog-ma-econ',        schoolId: 'soe', name: 'M.A. Economics',                                      type: 'pg' },
  { id: 'prog-ma-finecon',     schoolId: 'soe', name: 'M.A. Financial Economics',                            type: 'pg' },

  /* ── 8. School of Computer & Information Sciences (SCIS) ── */
  { id: 'prog-imtech-cs',      schoolId: 'scis', name: 'Integrated M.Tech Computer Science',                 type: 'integrated' },
  { id: 'prog-mca',            schoolId: 'scis', name: 'M.C.A. (Master of Computer Applications)',           type: 'pg' },
  { id: 'prog-mtech-cs',       schoolId: 'scis', name: 'M.Tech Computer Science',                            type: 'pg' },
  { id: 'prog-mtech-ai',       schoolId: 'scis', name: 'M.Tech Artificial Intelligence',                     type: 'pg' },
  { id: 'prog-mtech-it',       schoolId: 'scis', name: 'M.Tech Information Technology',                      type: 'pg' },
  { id: 'prog-mtech-is',       schoolId: 'scis', name: 'M.Tech Information Security',                        type: 'pg' },

  /* ── 9. S.N. School of Arts & Communication ── */
  { id: 'prog-ma-media-stud',  schoolId: 'sns-arts', name: 'M.A. Communication — Media Studies',            type: 'pg' },
  { id: 'prog-ma-media-prac',  schoolId: 'sns-arts', name: 'M.A. Communication — Media Practice',           type: 'pg' },
  { id: 'prog-mpa-kuchipudi',  schoolId: 'sns-arts', name: 'M.P.A. Dance — Kuchipudi',                      type: 'pg' },
  { id: 'prog-mpa-bharata',    schoolId: 'sns-arts', name: 'M.P.A. Dance — Bharatanatyam',                  type: 'pg' },
  { id: 'prog-mpa-theatre',    schoolId: 'sns-arts', name: 'M.P.A. Theatre Arts',                            type: 'pg' },
  { id: 'prog-mpa-hindustani', schoolId: 'sns-arts', name: 'M.P.A. Music — Hindustani Vocal',               type: 'pg' },
  { id: 'prog-mpa-karnataka',  schoolId: 'sns-arts', name: 'M.P.A. Music — Karnataka Vocal',                type: 'pg' },
  { id: 'prog-mfa-painting',   schoolId: 'sns-arts', name: 'M.F.A. Painting',                               type: 'pg' },
  { id: 'prog-mfa-print',      schoolId: 'sns-arts', name: 'M.F.A. Print Making',                           type: 'pg' },
  { id: 'prog-mfa-sculpture',  schoolId: 'sns-arts', name: 'M.F.A. Sculpture',                              type: 'pg' },
  { id: 'prog-mfa-arthist',    schoolId: 'sns-arts', name: 'M.F.A. Art History & Visual Studies',           type: 'pg' },

  /* ── 10. School of Management Studies ── */
  { id: 'prog-mba-gen',        schoolId: 'sms-mgmt', name: 'M.B.A. (General)',                              type: 'pg' },
  { id: 'prog-mba-health',     schoolId: 'sms-mgmt', name: 'M.B.A. Health Care & Hospital Management',      type: 'pg' },
  { id: 'prog-mba-analytics',  schoolId: 'sms-mgmt', name: 'M.B.A. Business Analytics',                    type: 'pg' },

  /* ── 11. School of Medical Sciences ── */
  { id: 'prog-imsc-hpsy',      schoolId: 'soms', name: 'Integrated M.Sc. Health Psychology',               type: 'integrated' },
  { id: 'prog-imooptom',       schoolId: 'soms', name: '6-Year Integrated M.Optom. (Optometry)',            type: 'integrated' },
  { id: 'prog-mph',            schoolId: 'soms', name: 'M.P.H. (Master of Public Health)',                 type: 'pg' },
  { id: 'prog-msc-hpsy',       schoolId: 'soms', name: 'M.Sc. Health Psychology',                          type: 'pg' },
  { id: 'prog-msc-neurocog',   schoolId: 'soms', name: 'M.Sc. Neural & Cognitive Science',                 type: 'pg' },

  /* ── 12. School of Engineering Sciences & Technology ── */
  { id: 'prog-imtech-mat',     schoolId: 'sest', name: 'Integrated M.Tech Materials Engineering',          type: 'integrated' },
  { id: 'prog-mtech-mat',      schoolId: 'sest', name: 'M.Tech Materials Engineering',                     type: 'pg' },
  { id: 'prog-mtech-nano',     schoolId: 'sest', name: 'M.Tech Nano Science and Technology',               type: 'pg' },
  { id: 'prog-mtech-mfg',      schoolId: 'sest', name: 'M.Tech Manufacturing Science and Engineering',     type: 'pg' },
  { id: 'prog-mtech-sim',      schoolId: 'sest', name: 'M.Tech Modeling and Simulation',                   type: 'pg' },
  { id: 'prog-mtech-vlsi',     schoolId: 'sest', name: 'M.Tech Microelectronics and VLSI Design',          type: 'pg' },
];

/* ─── Runner ───────────────────────────────────────────────────────── */
async function seed() {
  console.log(`\nSeeding ${SCHOOLS.length} schools...`);
  const sBatch = db.batch();
  for (const s of SCHOOLS) {
    sBatch.set(db.collection(COLLECTIONS.SCHOOLS).doc(s.id), s, { merge: true });
  }
  await sBatch.commit();
  console.log(`✓ ${SCHOOLS.length} schools written.`);

  // Delete old department docs before re-seeding (ids changed)
  console.log(`\nClearing old department/programme documents...`);
  const oldSnap = await db.collection(COLLECTIONS.DEPARTMENTS).get();
  if (!oldSnap.empty) {
    const delBatch = db.batch();
    oldSnap.docs.forEach((d) => delBatch.delete(d.ref));
    await delBatch.commit();
    console.log(`  Deleted ${oldSnap.size} old document(s).`);
  }

  console.log(`\nSeeding ${DEPARTMENTS.length} programmes...`);
  // Firestore batches are capped at 500 writes
  const BATCH_SIZE = 400;
  for (let i = 0; i < DEPARTMENTS.length; i += BATCH_SIZE) {
    const chunk = DEPARTMENTS.slice(i, i + BATCH_SIZE);
    const dBatch = db.batch();
    for (const d of chunk) {
      dBatch.set(db.collection(COLLECTIONS.DEPARTMENTS).doc(d.id), d, { merge: true });
    }
    await dBatch.commit();
  }
  console.log(`✓ ${DEPARTMENTS.length} programmes written.`);

  console.log('\n✅  Reference data seeded successfully.\n');
  process.exit(0);
}

seed().catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); });
