/**
 * Placeholder announcements data for the landing page.
 * In Sprint 4+, this will be replaced with an API call to
 * GET /api/announcements (TPO-posted public announcements).
 */

export const announcements = [
  {
    id: 'announce-2026-04-ai-summit',
    title: 'AI Impact Pre-Summit 2026 at UoH',
    summary: 'Researchers, industry leaders, and students convene at Shankar Dayal Sharma Auditorium to discuss the national AI roadmap.',
    date: '2026-02-20',
    category: 'Events',
    imageAlt: 'AI summit stage illustration',
  },
  {
    id: 'announce-2026-04-recruiter-drive',
    title: 'Recruiter Registration Open for 2026 Season',
    summary: 'Companies hiring M.Tech, MCA and I.M.Tech talent can now register to participate in on-campus drives beginning September 2026.',
    date: '2026-04-15',
    category: 'Placements',
    imageAlt: 'Campus building illustration',
  },
  {
    id: 'announce-2026-04-isure',
    title: 'I-SURE 2026 — Summer Internships at SCIS',
    summary: 'Applications open for the SCIS Internship, Skill Upgradation and Research Enhancement programme. Last date: 30 April 2026.',
    date: '2026-04-10',
    category: 'Internships',
    imageAlt: 'Lab and research illustration',
  },
  {
    id: 'announce-2026-04-placement-stats',
    title: '2024–25 Placement Report Published',
    summary: 'Median CTC across programmes was ₹10.2 LPA with 69 offers from product-based recruiters including EA Sports, IBM, Intel, Samsung and Teradata.',
    date: '2026-04-01',
    category: 'Reports',
    imageAlt: 'Charts and graphs illustration',
  },
  {
    id: 'announce-2026-03-self-declaration',
    title: 'PGAB Self-Declaration: 2026–27 Cycle',
    summary: 'All placement candidates must electronically sign the revised candidate declaration before the first application of the new season.',
    date: '2026-03-25',
    category: 'Policy',
    imageAlt: 'Document and signature illustration',
  },
  {
    id: 'announce-2026-03-hackathon',
    title: 'Smart India Hackathon 2026 — Internal Round',
    summary: 'UoH internal SIH round will be conducted in August 2026. Teams are invited to pre-register across all Schools of Engineering, Computer Science and Management.',
    date: '2026-03-12',
    category: 'Events',
    imageAlt: 'Hackathon illustration',
  },
];

/** Helper: announcement date formatting */
export function formatAnnouncementDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day:   'numeric',
    month: 'short',
    year:  'numeric',
  });
}
