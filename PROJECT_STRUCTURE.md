# Project Structure — Placement Management System

```
Placement_Management_System/
├── src/
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.js
│   │   │   ├── server.js
│   │   │   ├── config/
│   │   │   │   ├── constants.js
│   │   │   │   └── firebase.js
│   │   │   ├── controllers/
│   │   │   │   ├── adminController.js
│   │   │   │   ├── announcementController.js
│   │   │   │   ├── applicationController.js
│   │   │   │   ├── authController.js
│   │   │   │   ├── companyController.js
│   │   │   │   ├── declarationController.js
│   │   │   │   ├── examController.js
│   │   │   │   ├── facultyController.js
│   │   │   │   ├── interviewController.js
│   │   │   │   ├── jobController.js
│   │   │   │   ├── resumeController.js
│   │   │   │   ├── statsController.js
│   │   │   │   └── studentProfileController.js
│   │   │   ├── middleware/
│   │   │   │   ├── auth.js
│   │   │   │   ├── errorHandler.js
│   │   │   │   ├── profileValidator.js       ← sprint 2 (validation)
│   │   │   │   ├── rbac.js
│   │   │   │   └── validators.js
│   │   │   ├── routes/
│   │   │   │   ├── adminRoutes.js
│   │   │   │   ├── announcementRoutes.js
│   │   │   │   ├── applicationRoutes.js
│   │   │   │   ├── authRoutes.js
│   │   │   │   ├── companyRoutes.js
│   │   │   │   ├── declarationRoutes.js
│   │   │   │   ├── examRoutes.js
│   │   │   │   ├── facultyRoutes.js
│   │   │   │   ├── interviewRoutes.js
│   │   │   │   ├── jobRoutes.js
│   │   │   │   ├── profileRoutes.js
│   │   │   │   ├── referenceRoutes.js
│   │   │   │   └── statsRoutes.js
│   │   │   ├── scripts/                      ← DB seed/migration scripts
│   │   │   │   ├── migrateUsersV2.js
│   │   │   │   ├── resetAndSeedUsers.js
│   │   │   │   ├── seedAdmin.js
│   │   │   │   ├── seedFacultyAccounts.js
│   │   │   │   ├── seedInitialDeclaration.js
│   │   │   │   ├── seedReferenceData.js
│   │   │   │   └── syncFirestoreUserToAuth.js
│   │   │   ├── services/
│   │   │   │   ├── auditLogger.js
│   │   │   │   ├── emailService.js
│   │   │   │   └── otpService.js
│   │   │   └── utils/
│   │   │       └── validationHelper.js
│   │   ├── tests/
│   │   │   ├── mocks/
│   │   │   │   ├── firebase.js
│   │   │   │   └── uuid.js
│   │   │   ├── admin.test.js
│   │   │   ├── application.test.js
│   │   │   ├── declaration.test.js
│   │   │   ├── job.test.js
│   │   │   ├── login.test.js
│   │   │   ├── register.test.js
│   │   │   ├── setup.js
│   │   │   └── studentProfile.test.js
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── frontend/
│   │   ├── public/
│   │   │   └── campus/                       ← 5 wildlife/landscape photos
│   │   │       ├── deer-forest.jpg
│   │   │       ├── deer-golden.jpg
│   │   │       ├── duck-lake.jpg
│   │   │       ├── stork-water.jpg
│   │   │       └── sunset-reflection.jpg
│   │   ├── src/
│   │   │   ├── assets/
│   │   │   │   └── uoh-logo.png              ← official UoH crest
│   │   │   ├── components/
│   │   │   │   ├── landing/
│   │   │   │   │   ├── AnimatedStat.jsx
│   │   │   │   │   ├── AnnouncementCard.jsx
│   │   │   │   │   ├── CampusGallery.jsx     ← photo mosaic section
│   │   │   │   │   ├── HeroArtwork.jsx       ← SVG 2D emblem motif
│   │   │   │   │   ├── LandingNav.jsx
│   │   │   │   │   ├── Reveal.jsx
│   │   │   │   │   └── UoH3DLogo.jsx         ← procedural 3D R3F crest
│   │   │   │   └── ui/
│   │   │   │       ├── Alert.jsx
│   │   │   │       ├── Badge.jsx
│   │   │   │       ├── Button.jsx
│   │   │   │       ├── Card.jsx
│   │   │   │       ├── Input.jsx
│   │   │   │       ├── Logo.jsx              ← UoH crest with drop-shadow
│   │   │   │       ├── PageHeader.jsx
│   │   │   │       ├── Select.jsx
│   │   │   │       └── index.js
│   │   │   ├── config/
│   │   │   │   └── firebase.js
│   │   │   ├── contexts/
│   │   │   │   └── AuthContext.jsx
│   │   │   ├── data/
│   │   │   │   └── announcements.js
│   │   │   ├── pages/
│   │   │   │   ├── AdminUsersPage.jsx
│   │   │   │   ├── AnnouncementsPage.jsx
│   │   │   │   ├── ApplicationsPage.jsx
│   │   │   │   ├── CompanyProfilePage.jsx    ← premium redesign
│   │   │   │   ├── DashboardPage.jsx
│   │   │   │   ├── ExamSchedulePage.jsx
│   │   │   │   ├── FacultyExamsPage.jsx
│   │   │   │   ├── FacultyInterviewsPage.jsx
│   │   │   │   ├── FacultyJobsPage.jsx
│   │   │   │   ├── FacultyStudentsPage.jsx
│   │   │   │   ├── ForgotPasswordPage.jsx
│   │   │   │   ├── InterviewRequestPage.jsx
│   │   │   │   ├── JobApplicantsPage.jsx
│   │   │   │   ├── JobDetailPage.jsx
│   │   │   │   ├── JobsPage.jsx
│   │   │   │   ├── LandingPage.jsx           ← gallery + photo hero
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── NotFoundPage.jsx
│   │   │   │   ├── RecruiterJobsPage.jsx
│   │   │   │   ├── RegisterPage.jsx          ← validation wired
│   │   │   │   ├── ResetPasswordPage.jsx
│   │   │   │   ├── StudentExamsPage.jsx
│   │   │   │   ├── StudentInterviewsPage.jsx
│   │   │   │   ├── StudentProfilePage.jsx    ← validation wired
│   │   │   │   ├── TPOCompaniesPage.jsx
│   │   │   │   ├── TPOExamSchedulesPage.jsx
│   │   │   │   ├── TPOInterviewSchedulesPage.jsx
│   │   │   │   ├── TPOJobsPage.jsx
│   │   │   │   ├── UnauthorizedPage.jsx
│   │   │   │   ├── VerifyEmailPage.jsx
│   │   │   │   └── VerifyOTPPage.jsx
│   │   │   ├── services/
│   │   │   │   └── api.js
│   │   │   ├── utils/
│   │   │   │   └── profileValidation.js      ← frontend validation layer
│   │   │   ├── App.jsx
│   │   │   ├── index.css                     ← Tailwind + all lp-* landing styles
│   │   │   └── main.jsx
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── tailwind.config.js
│   │   └── vite.config.js
│   │
│   ├── uploads/                              ← resume PDF storage (per tenant/user)
│   └── docker-compose.yml
│
├── others/                                   ← project documents & PDFs
├── photos/                                   ← raw campus photos (IMG_*)
├── firebase.json
├── firestore.indexes.json
├── firestore.rules
└── serviceAccountKey.json
```

## Key Entry Points

| Layer | File |
|---|---|
| Backend server | `src/backend/src/server.js` |
| Frontend bootstrap | `src/frontend/src/main.jsx` → `App.jsx` |
| Landing page | `src/frontend/src/pages/LandingPage.jsx` |
| 3D logo (R3F) | `src/frontend/src/components/landing/UoH3DLogo.jsx` |
| UI logo (2D crest) | `src/frontend/src/components/ui/Logo.jsx` |
| All CSS | `src/frontend/src/index.css` |
| Frontend API client | `src/frontend/src/services/api.js` |
| Auth context | `src/frontend/src/contexts/AuthContext.jsx` |
| Backend auth middleware | `src/backend/src/middleware/auth.js` |
| RBAC middleware | `src/backend/src/middleware/rbac.js` |
| Profile validation (BE) | `src/backend/src/middleware/profileValidator.js` |
| Profile validation (FE) | `src/frontend/src/utils/profileValidation.js` |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + Vite |
| 3D rendering | React Three Fiber v8 + Three.js + @react-three/drei |
| Animation | Framer Motion (motion/react v12) |
| Styling | Tailwind CSS v3 + custom CSS (`lp-*` namespace) |
| Backend framework | Node.js + Express |
| Database | Firebase Firestore |
| Authentication | Firebase Auth |
| Validation (BE) | express-validator |
| File storage | Local filesystem (`src/uploads/`) |
| Containerisation | Docker + docker-compose |
| CI | GitHub Actions (`.github/workflows/ci.yml`) |
