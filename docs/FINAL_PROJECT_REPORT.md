# Final Project Report
## University of Hyderabad — Placement Management System

---

**Project Title:** Placement Management System (PMS) for the University of Hyderabad  
**Course:** Software Engineering (MCC601)  
**Semester:** VI — IMTECH Programme  
**Institution:** School of Computer and Information Sciences, University of Hyderabad  
**Date:** May 2026  

| S.No | Student Name | Roll Number |
|---|---|---|
| 1 | Krishna Vaibhav | 22MCCE13 |
| 2 | Team Member | 22MCCE16 |

**Guided by:** [DR NAVEEN NEKURI]  
**School:** School of Computer and Information Sciences (SCIS)  

---

## Table of Contents

1. [Abstract](#1-abstract)
2. [Introduction](#2-introduction)
3. [Literature Review](#3-literature-review)
4. [System Requirements](#4-system-requirements)
5. [System Design and Architecture](#5-system-design-and-architecture)
6. [Implementation](#6-implementation)
7. [Validation and Verification](#7-validation-and-verification)
8. [Testing](#8-testing)
9. [Results and Screenshots Description](#9-results-and-screenshots-description)
10. [SCRUM and Sprint Summary](#10-scrum-and-sprint-summary)
11. [Challenges and Solutions](#11-challenges-and-solutions)
12. [Future Scope](#12-future-scope)
13. [Conclusion](#13-conclusion)
14. [References](#14-references)

---

## 1. Abstract

The University of Hyderabad Placement Management System (UoH PMS) is a full-stack web application developed to digitize and streamline the campus placement process. The system replaces ad-hoc coordination conducted via email, spreadsheets, and physical notice boards with a centralized, role-aware platform serving five distinct user roles: Students, Companies, Faculty Coordinators, the Training and Placement Office (TPO), and System Administrators.

The system was developed using React 18 and React Three Fiber on the frontend, Node.js and Express on the backend, Firebase Authentication for identity management, and Google Cloud Firestore as the primary database. It implements a two-step OTP-based login system, a PGAB declaration signing flow, job posting with a TPO approval workflow, CGPA and backlog-based eligibility gating for applications, and exam and interview scheduling coordination.

The project was developed using SCRUM methodology over two sprints. Sprint 1 delivered core authentication and profile management. Sprint 2 delivered job management, application tracking, declarations, exams, interviews, statistics, and a premium landing page with 3D WebGL animation. All 70 automated test cases pass with a statement coverage of 50%.

**Keywords:** Placement Management, Full-Stack Web Application, Firebase, React, Express.js, SCRUM, Role-Based Access Control, PGAB Declaration, WebGL.

---

## 2. Introduction

### 2.1 Background

The University of Hyderabad (UoH) is a central university with 12 schools, 42 departments, and over 5,000 students enrolled across postgraduate, doctoral, and integrated programmes. Managing campus placements at this scale presents significant coordination challenges:

- Students must be informed about eligible job openings across multiple schools
- Companies must coordinate exam and interview scheduling with the institution
- The TPO must vet companies, review job postings, and coordinate with faculty
- Faculty must confirm schedules and supervise school-level participation
- All stakeholders previously relied on email threads and shared spreadsheets

### 2.2 Problem Statement

The absence of a centralized placement management system leads to:
- Information reaching students inconsistently
- Missed applications due to poor visibility of job postings
- Manual eligibility checking by the TPO
- No audit trail for company approvals and job decisions
- No digital record of PGAB declaration compliance

### 2.3 Objectives

1. Build a web application that centralizes the placement workflow for all stakeholders
2. Implement role-based access control with five distinct roles
3. Automate eligibility checking (CGPA, backlogs, school, department)
4. Digitize the PGAB declaration signing process
5. Provide a TPO-controlled approval workflow for companies and job postings
6. Coordinate exam and interview scheduling with Faculty confirmation
7. Maintain an immutable audit log of all privileged actions
8. Deliver a premium user interface with 3D animation on the landing page

### 2.4 Scope

The system covers the complete placement lifecycle from student registration to final selection. It does not cover:
- Online proctored examination delivery
- Video interview hosting (links to external tools)
- Payment gateway for any fees
- Alumni placement tracking

---

## 3. Literature Review

### 3.1 Existing Systems

Several institutions have deployed placement management systems. A review of comparable systems reveals common patterns:

| System | Institution | Limitation |
|---|---|---|
| Superset (formerly iCampusPro) | IITs, NITs | Commercial, subscription-based, not customizable |
| College-specific PHP portals | Various | Outdated tech stack, no mobile support, poor UX |
| Manual Excel + email workflows | Most central universities | Error-prone, no real-time tracking, no audit |

### 3.2 Technology Survey

**Frontend frameworks:** React was chosen over Vue and Angular for its component model, large ecosystem (React Three Fiber, Framer Motion), and team familiarity.

**Backend frameworks:** Express.js was chosen for its minimalism, middleware composability, and wide adoption. Alternatives (NestJS, Fastify) were evaluated but deemed over-engineered for the project scope.

**Database:** Firebase Firestore was chosen for its real-time capabilities, serverless pricing, and tight integration with Firebase Authentication. PostgreSQL was considered but requires schema migration management and a separate server.

**3D Web Graphics:** React Three Fiber (R3F) was chosen as the React binding for Three.js. R3F v8 was used (compatible with React 18; v9 requires React 19).

**Authentication:** Firebase Authentication provides OAuth-compatible identity management with built-in email verification and password reset, reducing implementation effort and security risk.

---

## 4. System Requirements

### 4.1 Functional Requirements

| ID | Requirement |
|---|---|
| FR-1 | Students shall register with a `@uohyd.ac.in` email address |
| FR-2 | Companies shall register with any professional email and await TPO approval |
| FR-3 | Faculty and TPO accounts shall be provisioned only by the Admin |
| FR-4 | All users shall complete two-factor login (Firebase token + OTP) |
| FR-5 | Students shall sign the PGAB declaration before applying for any job |
| FR-6 | Companies shall submit job postings for TPO approval |
| FR-7 | The system shall enforce CGPA and backlog eligibility before allowing application |
| FR-8 | The TPO shall assign jobs to specific schools after approval |
| FR-9 | Companies shall be able to shortlist, reject, and select applicants |
| FR-10 | The TPO shall coordinate exam and interview scheduling with Faculty |
| FR-11 | All privileged TPO and Admin actions shall be recorded in an audit log |
| FR-12 | The TPO shall be able to broadcast announcements to all users |
| FR-13 | Students shall be able to upload and manage PDF resumes |
| FR-14 | The Admin shall be able to suspend or deactivate any user account |

### 4.2 Non-Functional Requirements

| ID | Requirement | Measure |
|---|---|---|
| NFR-1 | Response time | API responses < 2 seconds under normal load |
| NFR-2 | Security | HTTPS, rate limiting, RBAC, Firebase ID token verification |
| NFR-3 | Availability | 99% uptime (Firebase SLA) |
| NFR-4 | Usability | Mobile-responsive; WCAG 2.1 AA for text contrast |
| NFR-5 | Scalability | Stateless backend — horizontally scalable |
| NFR-6 | Maintainability | Code coverage ≥ 50%; linting via ESLint |
| NFR-7 | Compliance | PGAB declaration signed before job applications |

---

## 5. System Design and Architecture

### 5.1 Architecture Overview

The system follows a three-tier client-server architecture:

```
┌──────────────────────┐
│  React SPA (Client)  │  Port 5173 (Dev) / 80 (Prod)
│  Vite + Tailwind CSS │
│  React Three Fiber   │
└──────────┬───────────┘
           │ REST API (Bearer token)
┌──────────▼───────────┐
│  Express.js (Server) │  Port 3000
│  Middleware chain    │
│  Controllers         │
└──────┬───────┬───────┘
       │       │
┌──────▼──┐ ┌──▼──────────────┐
│Firebase │ │  Cloud Firestore │
│  Auth   │ │  (NoSQL DB)      │
└─────────┘ └─────────────────┘
```

### 5.2 Key Design Patterns

| Pattern | Where Used |
|---|---|
| **Middleware chain** | Express route pipeline: authenticate → authorize → validate → controller |
| **Single source of truth** | `constants.js` — all roles, statuses, collection names |
| **Factory function** | `authorize(...roles)` — generates role-check middleware |
| **Repository pattern** | Controllers use Firestore SDK directly (no ORM needed for NoSQL) |
| **Observer** | `AuthContext` — `onAuthStateChanged` triggers React re-renders |
| **Strategy** | Interview allocation: AUTO vs STUDENT_CHOICE strategies |

### 5.3 Database Collections

Key Firestore collections:

| Collection | Description |
|---|---|
| `users` | All user accounts with role and status |
| `studentProfiles` | Academic profile, skills, resumes |
| `companies` | Company profiles and approval status |
| `jobs` | Job postings with eligibility and status |
| `applications` | Student job applications |
| `declarationVersions` | PGAB declaration text versions |
| `declarationSignatures` | Student signatures with timestamps |
| `examSchedules` | Exam scheduling and coordination |
| `interviewSchedules` | Interview scheduling with slot management |
| `auditLogs` | Immutable action log |
| `announcements` | TPO broadcasts |
| `otpCodes` | Temporary OTP storage (10-min TTL) |

### 5.4 Security Architecture

- **Authentication:** Firebase ID token verified on every API request via `auth.verifyIdToken()`
- **Authorization:** Role-based access control enforced in middleware before any controller runs
- **Rate limiting:** 20 req/min on auth routes; 100 req/min on data routes
- **Input validation:** express-validator on backend; pure validation utility on frontend
- **HTTP security:** `helmet()` middleware sets Content-Security-Policy, X-Frame-Options, HSTS
- **Firestore rules:** `firestore.rules` restricts direct client access to collections

---

## 6. Implementation

### 6.1 Development Environment

| Tool | Version |
|---|---|
| Node.js | 18.x |
| npm | 9.x |
| Vite | 5.1.0 |
| Git | 2.x |
| VS Code | 1.90+ |
| Firebase CLI | 13.x |

### 6.2 Backend Implementation

The backend is a Node.js + Express REST API structured as:

```
src/backend/src/
├── app.js            — Express app configuration
├── server.js         — HTTP server entry point
├── config/           — Firebase init, constants
├── controllers/      — Business logic per resource
├── middleware/       — Auth, RBAC, validation
├── routes/           — URL → middleware → controller wiring
├── services/         — Email, OTP, audit logging
└── utils/            — Shared helper functions
```

**Key implementation decisions:**

1. **Two-step OTP login:** Firebase ID token validates identity; OTP via email confirms possession of inbox. Prevents account takeover even if Firebase token is intercepted.

2. **Status machine for jobs:**
   ```
   PENDING_APPROVAL → OPEN (TPO approves)
   PENDING_APPROVAL → REJECTED (TPO rejects)
   OPEN → CLOSED (Company closes)
   OPEN → WITHDRAWN (Company withdraws)
   ```

3. **Declaration gate:** Every job application checks for a `declarationSignatures` document before proceeding. No signature = 403 blocked.

4. **Audit logging:** Every TPO/Admin action writes an immutable `auditLogs` document. No update/delete routes exist for this collection.

### 6.3 Frontend Implementation

The frontend is a React 18 SPA built with Vite. Key implementation areas:

**Landing page:** Features a procedural 3D recreation of the UoH crest built with React Three Fiber — circular rings, Ashoka Chakra wheel, open book, atom orbits, lightning bolt, and scroll banner. No external GLB file is needed. The scene runs at 60fps with controlled Y-axis rotation and sin-wave float via `useFrame`.

**Form validation:** A pure utility module (`profileValidation.js`) validates all form fields client-side before API submission. The same validation rules are independently enforced on the backend (`profileValidator.js`) — defense in depth.

**Authentication context:** `AuthContext.jsx` uses Firebase `onAuthStateChanged` to track the current user globally. Protected routes check this context before rendering.

**API client:** `api.js` wraps all fetch calls, automatically attaching the current user's Firebase ID token as the Bearer header.

### 6.4 Email Service

Transactional emails are sent via the Resend API (`resend.com`). Email types:
- OTP delivery
- Job approval/rejection notification to company
- Declaration confirmation to student
- Account provisioning credentials to Faculty/TPO

### 6.5 File Upload

Resume PDFs are uploaded via Multer to the local filesystem at `src/uploads/{projectId}/{uid}/`. File type is restricted to `application/pdf`. Maximum size: 10 MB per file.

---

## 7. Validation and Verification

### 7.1 Requirements Traceability Matrix

| Requirement | Module | Verified By |
|---|---|---|
| FR-1: @uohyd.ac.in email for students | `validators.js` | Test R-14, R-15 |
| FR-2: Company pending approval | `authController.js` | Test R-02 |
| FR-3: Admin-provisioned roles only | `adminController.js` | Test AD-07 |
| FR-4: Two-factor OTP login | `authController.js`, `otpService.js` | Test L-01 to L-11 |
| FR-5: Declaration before application | `applicationController.js` | Test A-02 |
| FR-6: Job posting submitted for approval | `jobController.js` | Test J-01 |
| FR-7: Eligibility gating | `applicationController.js` | Test A-03 |
| FR-8: TPO assigns jobs to schools | `jobController.js` | Manual test |
| FR-9: Shortlisting | `applicationController.js` | Test A-08 |
| FR-10: Exam/interview scheduling | `examController.js`, `interviewController.js` | Manual test |
| FR-11: Audit log | `auditLogger.js` | Code review CR |
| FR-12: Announcements | `announcementController.js` | Manual test |
| FR-13: Resume upload | `resumeController.js` | Manual test |
| FR-14: Account status management | `adminController.js` | Test AD-03 |

### 7.2 Verification Methods

| Method | Applied To |
|---|---|
| Unit/Integration testing (Jest + Supertest) | All API endpoints |
| Code walkthrough | All controller and middleware files |
| Manual browser testing | Frontend UI, 3D rendering, form validation |
| Security checklist | Auth, RBAC, rate limiting, input validation |
| Build verification | Vite production build (1354 modules, 0 errors) |

---

## 8. Testing

### 8.1 Test Summary

| Test Suite | Cases | Passed | Failed |
|---|---|---|---|
| Registration | 16 | 16 | 0 |
| Login + OTP | 11 | 11 | 0 |
| Jobs | 12 | 12 | 0 |
| Applications | 10 | 10 | 0 |
| Declarations | 8 | 8 | 0 |
| Admin | 8 | 8 | 0 |
| Student Profile | 5 | 5 | 0 |
| **Total** | **70** | **70** | **0** |

### 8.2 Coverage

| Metric | Coverage |
|---|---|
| Statements | 50% (607/1198) |
| Functions | 40% (39/96) |
| Branches | 41% (196/471) |

**High-coverage modules:** `jobController.js` (80%), `validationHelper.js` (100%), `validators.js` (100%), `constants.js` (100%), `studentProfileController.js` (83%)

**Low-coverage modules:** `companyController.js` (17%), `resumeController.js` (11%) — file upload testing requires multipart setup, deferred to future sprint.

### 8.3 Security Testing Results

| Test | Result |
|---|---|
| RBAC enforcement on all routes | PASS |
| Rate limiting (auth routes) | PASS |
| Rate limiting (data routes) | PASS |
| Token expiry rejection | PASS |
| Account status gating | PASS |
| University email enforcement | PASS |
| Duplicate registration prevention | PASS |
| SQL/NoSQL injection (Firestore SDK) | PASS — parameterized queries |
| XSS (React default escaping) | PASS |

---

## 9. Results and Screenshots Description

### 9.1 Landing Page

The landing page presents:
- A full-screen hero section with a procedural 3D UoH crest on the right, animated with slow Y-axis rotation and sin-wave float
- A Sanskrit motto below the crest: *सा विद्या या विमुच्यते*
- Statistics section (5000+ students, 42 departments, 300+ recruiting partners)
- How-it-works section (3 steps: Register → Sign Declaration → Apply)
- A full-bleed campus photography section with 5 wildlife/landscape photos from the UoH campus
- A CTA (call to action) section with backdrop campus photography
- Footer with contact details

### 9.2 Authentication

- Registration form with dynamic field display (student fields / company fields based on role selection)
- Email verification prompt screen
- Two-step login: Firebase sign-in → OTP entry screen
- OTP entry with 6 digit inputs and 10-minute countdown

### 9.3 Student Dashboard

Shows: Welcome card, recent announcements from TPO, quick navigation to profile, jobs, applications, exams, and interviews.

### 9.4 Student Profile

Full academic profile form with: CGPA, backlogs, years, phone, skills (multi-value), LinkedIn URL, e-signature. Resume upload section with drag-and-drop. Real-time per-field validation with inline error messages.

### 9.5 Job Listings

Cards showing job title, company name, CTC, location, job type, eligibility at a glance. Click to expand full description and apply.

### 9.6 Company Profile

Premium card layout with monogram avatar, status badge, three card sections (Identity, Contact, About), character counter for description, sticky edit footer bar.

### 9.7 TPO Dashboard

Company approval queue, job approval queue, exam and interview management, announcement composer, statistics overview.

---

## 10. SCRUM and Sprint Summary

### 10.1 Sprint 1 — Core Foundation

**Duration:** Weeks 1–4  
**Goal:** Authentication, profile management, declaration signing

**Delivered:**
- User registration (Student and Company)
- Firebase email verification flow
- Two-step OTP login system
- Student profile (CRUD + resume upload)
- PGAB declaration version management and signing
- Admin user management (list, status update, provision)
- Reference data API (schools, departments)
- Initial landing page with LandingNav and hero section

**Velocity:** 23 story points delivered of 26 planned

### 10.2 Sprint 2 — Core Features

**Duration:** Weeks 5–8  
**Goal:** Jobs, applications, scheduling, UI polish

**Delivered:**
- Job posting and approval workflow
- School assignment to jobs
- Student application with eligibility gating
- Application status tracking and withdrawal
- Exam scheduling workflow (REQUESTED → FACULTY_CONFIRMED → FINALIZED)
- Interview scheduling with slot management and AUTO/STUDENT_CHOICE allocation
- Faculty portal (students, jobs, exams, interviews)
- TPO portal (companies, jobs, exams, interviews, stats, announcements)
- Announcements module
- Statistics dashboard
- Complete landing page redesign: 3D UoH crest (R3F), campus photo gallery, photo-hero section
- Company profile page redesign (premium SaaS-grade UI)
- Frontend validation layer (`profileValidation.js`)
- Backend validation layer (`profileValidator.js`)
- Official UoH crest logo integration

**Velocity:** 41 story points delivered of 44 planned

### 10.3 Sprint Retrospective

**What went well:**
- Firebase Authentication integration was smooth and reliable
- React Three Fiber allowed rapid 3D prototyping without native WebGL knowledge
- `constants.js` single-source-of-truth prevented naming inconsistencies across 30+ files
- Modular middleware design made adding validation non-breaking

**What to improve:**
- File upload testing (Multer + multipart) needs its own test setup — deferred to Sprint 3
- Interview slot booking UI can be more intuitive for students
- Mobile responsiveness of the 3D canvas section needs further optimization

---

## 11. Challenges and Solutions

### Challenge 1: React Three Fiber Version Incompatibility

**Problem:** Installing `@react-three/fiber@9` caused a crash (`Cannot read properties of undefined (reading 'S')` at `createReconciler`). R3F v9 requires React 19; the project uses React 18.

**Solution:** Downgraded to `@react-three/fiber@8.18.0` using `--legacy-peer-deps`. This version is fully compatible with React 18 and all drei helpers.

---

### Challenge 2: Official UoH Crest Logo Rendering

**Problem:** The previous logo used `brightness-0 invert` CSS filter to make a plain-colour PNG visible on dark backgrounds. When the official UoH crest (detailed maroon-on-white line art) was substituted, the filter turned the entire image solid white — losing all crest detail.

**Solution:** Removed the filter. Used `drop-shadow` instead to provide visual lift on dark backgrounds without altering the crest's colours. The crest now renders correctly on all backgrounds (dark maroon sidebar, cream landing nav, dark footer).

---

### Challenge 3: Cross-Field Validation (Joining Year vs Graduation Year)

**Problem:** The profile update endpoint is a PATCH request where any field is optional. Standard validators run per-field — a cross-field check requires both values to be present simultaneously.

**Solution:** Used `express-validator`'s `.custom()` with access to `req.body`. The cross-field check only executes when both `joiningYear` and `graduationYear` are present in the request body. If only one is sent, no cross-validation fires.

---

### Challenge 4: Firestore Composite Queries Without SQL

**Problem:** Complex queries (e.g., "open jobs assigned to school X, ordered by date") require composite indexes in Firestore. Missing indexes cause query failures at runtime.

**Solution:** All composite queries were identified during development and added to `firestore.indexes.json`. The Firebase CLI deploys these indexes before the application is used.

---

### Challenge 5: OTP Exposure in Non-Production Environments

**Problem:** During development and testing, the OTP must be accessible without a real email inbox. But the OTP must not be exposed in production.

**Solution:** The `devOtp` field is included in the login response body only when `process.env.NODE_ENV !== 'production'`. In the test environment, the Jest mock Firebase always returns `valid-token-{uid}` tokens, and the `devOtp` is read from the response in multi-step test flows.

---

## 12. Future Scope

| Feature | Description | Priority |
|---|---|---|
| Resume AI scoring | Automatically rank resumes against job descriptions using NLP | High |
| In-app notifications | Real-time bell notifications without email | High |
| Mobile app | React Native or PWA for student-facing features | Medium |
| Video interview hosting | Integrated video calls via WebRTC or third-party SDK | Medium |
| Alumni network | Track placed students and their career progression | Medium |
| Company rating | Students rate company interview process post-placement | Low |
| Bulk CSV import | Allow TPO to bulk-import student data from university ERP | High |
| Analytics dashboard | Placement trends, school-wise statistics, year-on-year graphs | Medium |
| Blacklist management UI | Full blacklist feature with reason and duration | Medium |
| Multi-language support | Telugu and Hindi interfaces for broader accessibility | Low |

---

## 13. Conclusion

The University of Hyderabad Placement Management System successfully digitalizes the campus placement process end-to-end. The system serves five distinct roles with appropriate access controls, implements a policy-compliant PGAB declaration workflow, enforces automated eligibility checking, and provides a coordinated exam and interview scheduling system.

The two-sprint SCRUM development delivered a full-stack web application with 70 passing automated test cases, a 50% statement coverage baseline, clean layered Express architecture, and a premium React frontend with 3D WebGL animation on the landing page.

The system is deployable via Docker, CI-tested on every push via GitHub Actions, and ready for institutional use following configuration of production Firebase credentials, the Resend API key, and CORS origins.

The codebase is maintainable, extensible, and well-documented across five supporting documents: System Design Document, Test Plan and Report, Code Review Report, User Manual, and this Final Project Report.

---

## 14. References

1. Firebase Documentation — Authentication and Firestore. Google. [https://firebase.google.com/docs]
2. React Three Fiber Documentation. Pmndrs. [https://docs.pmnd.rs/react-three-fiber]
3. Three.js Documentation. [https://threejs.org/docs]
4. Express.js API Reference. [https://expressjs.com/en/4x/api.html]
5. express-validator Documentation. [https://express-validator.github.io/docs]
6. Framer Motion Documentation. [https://www.framer.com/motion]
7. Tailwind CSS Documentation. [https://tailwindcss.com/docs]
8. Jest Documentation. [https://jestjs.io/docs/getting-started]
9. Vite Documentation. [https://vitejs.dev/guide]
10. Resend API Documentation. [https://resend.com/docs]
11. Pressman, R.S. (2014). *Software Engineering: A Practitioner's Approach* (8th ed.). McGraw-Hill.
12. Sommerville, I. (2016). *Software Engineering* (10th ed.). Pearson Education.
13. Schwaber, K. & Sutherland, J. (2020). *The Scrum Guide*. Scrum.org.

---

*End of Final Project Report*

---

**Declaration**

We declare that this project work titled "Placement Management System for University of Hyderabad" is our original work submitted in partial fulfilment of the requirements for the degree of Master of Computer Applications at the University of Hyderabad. The work has not been submitted elsewhere for any other degree or qualification.

| Name | Roll Number | Signature |
|---|---|---|
| Krishna Vaibhav | 22MCCE13 | |
| Team Member | 22MCCE16 | |

**Date:** May 2026  
**Place:** Hyderabad
