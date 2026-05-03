# System Design Document
## University of Hyderabad — Placement Management System

**Document Version:** 1.0  
**Date:** May 2026  
**Authors:** Krishna Vaibhav (22MCCE13), Team Member (22MCCE16)  
**Project:** UoH Placement Management System (PMS)  

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture](#2-architecture)
3. [Technology Stack](#3-technology-stack)
4. [Database Design](#4-database-design)
5. [API Design](#5-api-design)
6. [Authentication and Authorization](#6-authentication-and-authorization)
7. [Frontend Architecture](#7-frontend-architecture)
8. [Module Design](#8-module-design)
9. [Deployment Architecture](#9-deployment-architecture)
10. [Non-Functional Design Decisions](#10-non-functional-design-decisions)

---

## 1. System Overview

### 1.1 Purpose

The UoH Placement Management System (PMS) is a centralized web application for the University of Hyderabad's Training and Placement Office (TPO). It manages the full placement lifecycle: student registration, PGAB declaration signing, job posting by companies, application tracking, exam scheduling, and interview coordination.

### 1.2 Actors

| Actor | Description | How Account is Created |
|---|---|---|
| **Student** | UoH student seeking placement | Self-registration with `@uohyd.ac.in` email |
| **Company (Recruiter)** | Corporate recruiter posting jobs | Self-registration, awaits TPO approval |
| **TPO** | Training and Placement Officer | Admin-provisioned only |
| **Faculty** | School Placement Coordinator | Admin-provisioned only |
| **Admin** | System administrator | Seeded at deployment |

### 1.3 Key Functional Areas

1. User registration, email verification, OTP-based login
2. Student academic profile management and resume upload
3. PGAB declaration management and digital signature
4. Company profile management (TPO-approved)
5. Job posting, approval workflow, school assignment
6. Student application with eligibility gating
7. Exam and interview scheduling coordination
8. Announcements broadcasting
9. Audit logging of all privileged actions

---

## 2. Architecture

### 2.1 Overall Architecture

The system follows a **3-tier architecture**:

```
┌─────────────────────────────────────────────┐
│                   CLIENT                     │
│          React SPA (Vite, Port 5173)         │
│    React Three Fiber · Framer Motion         │
│    Tailwind CSS · react-router-dom           │
└─────────────────┬───────────────────────────┘
                  │ HTTPS REST API
                  │ Firebase ID Token (Authorization: Bearer)
┌─────────────────▼───────────────────────────┐
│                  SERVER                      │
│         Node.js + Express (Port 3000)        │
│    Middleware: Helmet · CORS · Rate Limit    │
│    Auth: Firebase Admin SDK                  │
│    Validation: express-validator             │
└──────────┬──────────────────┬───────────────┘
           │                  │
┌──────────▼──────┐  ┌────────▼───────────────┐
│  Firebase Auth   │  │   Cloud Firestore       │
│  (Identity)      │  │   (Application Data)    │
└─────────────────┘  └────────────────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   Local Filesystem  │
                    │   (Resume PDFs)     │
                    │   src/uploads/      │
                    └────────────────────┘
```

### 2.2 Request Lifecycle

```
Client Request
    │
    ▼
Express Router
    │
    ├── Rate Limiter (express-rate-limit)
    │
    ├── authenticate (verify Firebase ID token, attach req.user)
    │
    ├── authorize (RBAC role check)
    │
    ├── Validator (express-validator rules)
    │
    ▼
Controller
    │
    ├── Firestore read/write
    ├── emailService (optional)
    ├── auditLogger (optional)
    │
    ▼
JSON Response
```

### 2.3 Separation of Concerns

| Layer | Responsibility |
|---|---|
| **Routes** | Define URL → middleware chain → controller mapping |
| **Middleware** | Authentication, authorization, input validation |
| **Controllers** | Business logic, Firestore operations, response formatting |
| **Services** | Email delivery, OTP management, audit logging |
| **Config** | Firebase SDK init, constants, environment variables |

---

## 3. Technology Stack

### 3.1 Backend

| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express.js | 4.18.2 | HTTP framework |
| Firebase Admin SDK | 12.0.0 | Firestore + Auth server-side |
| express-validator | 7.0.1 | Input validation |
| Helmet | 7.1.0 | Security HTTP headers |
| CORS | 2.8.5 | Cross-origin resource sharing |
| express-rate-limit | 7.1.5 | Rate limiting |
| Morgan | 1.10.0 | HTTP request logging |
| Multer | 2.1.1 | File upload handling |
| Resend | 6.12.2 | Transactional email delivery |
| UUID | 14.0.0 | Document ID generation |
| Jest + Supertest | 29.7 / 6.3.4 | Testing |

### 3.2 Frontend

| Technology | Version | Purpose |
|---|---|---|
| React | 18.2.0 | UI framework |
| Vite | 5.1.0 | Build tool and dev server |
| React Router DOM | 6.22.0 | Client-side routing |
| React Three Fiber | 8.18.0 | 3D rendering (WebGL) |
| Three.js | 0.184.0 | 3D geometry and materials |
| @react-three/drei | 9.122.0 | R3F helpers (Environment, etc.) |
| Framer Motion | 12.38.0 | Animation library |
| Firebase (client) | 10.8.0 | Auth + Firestore client SDK |
| Tailwind CSS | 3.4.1 | Utility-first styling |
| react-hot-toast | 2.4.1 | Toast notifications |
| react-dropzone | 15.0.0 | Drag-and-drop file upload |
| react-markdown | 10.1.0 | Markdown rendering |
| clsx | 2.1.1 | Conditional className utility |

### 3.3 Infrastructure

| Component | Technology |
|---|---|
| Database | Google Cloud Firestore (NoSQL) |
| Authentication | Firebase Authentication |
| File Storage | Local filesystem (`src/uploads/`) |
| Containerization | Docker + docker-compose |
| CI/CD | GitHub Actions |
| Email | Resend API |

---

## 4. Database Design

Firestore is a NoSQL document database. The system uses the following top-level collections:

### 4.1 `users` Collection

Stores identity and role information for all users.

```
users/{uid}
├── uid: string
├── fullName: string
├── email: string
├── role: STUDENT | FACULTY | TPO | COMPANY | ADMIN
├── status: UNVERIFIED | PENDING_APPROVAL | ACTIVE | SUSPENDED | DEACTIVATED
├── schoolId: string (STUDENT only)
├── departmentId: string (STUDENT only)
├── createdAt: ISO timestamp
└── updatedAt: ISO timestamp
```

### 4.2 `studentProfiles` Collection

Stores academic and professional profile data for students.

```
studentProfiles/{uid}
├── userId: string (ref → users/{uid})
├── cgpa: number (0–10, 2 decimal places)
├── backlogs: number
├── joiningYear: number
├── graduationYear: number
├── phone: string (10 digits)
├── skills: string[]
├── linkedinUrl: string
├── resumes: { resumeId, filename, uploadedAt, url }[]
├── eSignature: string
├── profileComplete: boolean
└── updatedAt: ISO timestamp
```

### 4.3 `companies` Collection

Stores company profile data.

```
companies/{uid}
├── companyId: string (same as users/{uid})
├── companyName: string
├── website: string
├── description: string
├── industry: string
├── hrPhone: string
├── status: PENDING_APPROVAL | ACTIVE | REJECTED | SUSPENDED
├── approvedBy: string (TPO uid)
├── approvedAt: ISO timestamp
└── updatedAt: ISO timestamp
```

### 4.4 `jobs` Collection

```
jobs/{jobId}
├── jobId: string (UUID)
├── companyId: string (ref → users)
├── companyName: string
├── title: string
├── description: string
├── location: string
├── ctc: string
├── jobType: FULL_TIME | INTERNSHIP | CONTRACT
├── eligibility: { minCgpa, maxBacklogs, allowedSchools[], allowedDepartments[] }
├── status: PENDING_APPROVAL | OPEN | CLOSED | REJECTED | WITHDRAWN
├── assignedSchools: string[]
├── createdAt: ISO timestamp
└── updatedAt: ISO timestamp
```

### 4.5 `applications` Collection

```
applications/{applicationId}
├── applicationId: string (UUID)
├── jobId: string (ref → jobs)
├── studentId: string (ref → users)
├── companyId: string
├── status: APPLIED | SHORTLISTED | NOT_SHORTLISTED | INTERVIEW_SCHEDULED
│           | NOT_SELECTED_INTERVIEW | SELECTED | REJECTED
│           | WITHDRAWN_STUDENT | WITHDRAWN_SYSTEM
├── appliedAt: ISO timestamp
└── updatedAt: ISO timestamp
```

### 4.6 `declarationVersions` Collection

```
declarationVersions/{versionId}
├── version: string (e.g., "1.0")
├── text: string (full declaration text)
├── isActive: boolean
├── createdAt: ISO timestamp
└── createdBy: string (admin uid)
```

### 4.7 `declarationSignatures` Collection

```
declarationSignatures/{signatureId}
├── userId: string
├── declarationVersionId: string
├── signedAt: ISO timestamp
└── ipAddress: string (optional)
```

### 4.8 `examSchedules` Collection

```
examSchedules/{examId}
├── examId: string (UUID)
├── jobId: string
├── companyId: string
├── title: string
├── date: ISO timestamp
├── mode: ONLINE | OFFLINE
├── venue: string (OFFLINE)
├── meetingLink: string (ONLINE)
├── assignedSchools: string[]
├── status: REQUESTED | FORWARDED_TO_FACULTY | FACULTY_CONFIRMED | FINALIZED | CANCELLED
└── createdAt: ISO timestamp
```

### 4.9 `interviewSchedules` Collection

```
interviewSchedules/{interviewId}
├── interviewId: string (UUID)
├── jobId: string
├── companyId: string
├── mode: ONLINE | OFFLINE
├── allocationMode: AUTO | STUDENT_CHOICE
├── linkType: COMMON | PER_SLOT
├── status: REQUESTED | FORWARDED_TO_FACULTY | FACULTY_CONFIRMED | SCHEDULED | LIVE | COMPLETED | CANCELLED
├── slots: interviewSlots subcollection
└── createdAt: ISO timestamp
```

### 4.10 Other Collections

| Collection | Purpose |
|---|---|
| `otpCodes` | Temporary OTP storage with TTL (10 min) |
| `auditLogs` | Immutable log of privileged admin/TPO actions |
| `announcements` | TPO broadcasts to all users |
| `schools` | Reference data — UoH school list |
| `departments` | Reference data — department list per school |
| `blacklists` | Student blacklist managed by admin |
| `notifications` | In-app notifications |

### 4.11 Firestore Indexes

Composite indexes defined in `firestore.indexes.json` for:
- `applications` ordered by `studentId` + `appliedAt`
- `jobs` ordered by `status` + `createdAt`
- `examSchedules` ordered by `jobId` + `status`
- `auditLogs` ordered by `actorId` + `createdAt`

---

## 5. API Design

### 5.1 Base URL

```
Development:  http://localhost:3000/api
Production:   https://<domain>/api
```

### 5.2 Authentication

All protected endpoints require:
```
Authorization: Bearer <Firebase ID Token>
```

### 5.3 Response Envelope

All responses follow:
```json
{
  "success": true | false,
  "message": "Human-readable description",
  "data": { ... },
  "code": "ERROR_CODE",
  "errors": [{ "field": "email", "message": "..." }]
}
```

### 5.4 Endpoint Reference

#### Authentication

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/register` | No | — | Create new student or company account |
| POST | `/login` | Firebase token | — | Issue OTP to verified user |
| POST | `/verify-login-otp` | Firebase token | — | Complete login by verifying OTP |
| POST | `/forgot-password` | No | — | Send password reset email |
| GET | `/health` | No | — | Health check |

#### Student Profile

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/profile` | Yes | STUDENT | Get own profile |
| PATCH | `/profile` | Yes | STUDENT | Update profile fields |
| POST | `/profile/resume` | Yes | STUDENT | Upload resume PDF |
| DELETE | `/profile/resume/:id` | Yes | STUDENT | Delete a resume |

#### Declarations

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/declarations/current` | Yes | Any | Get active declaration version |
| POST | `/declarations/sign` | Yes | STUDENT | Sign the active declaration |
| GET | `/declarations/my` | Yes | STUDENT | Get own signature status |

#### Company

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/company/profile` | Yes | COMPANY | Get company profile |
| PATCH | `/company/profile` | Yes | COMPANY | Update company profile |

#### Jobs

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| POST | `/jobs` | Yes | COMPANY | Post a new job |
| GET | `/jobs` | Yes | Any | List jobs (filtered by role) |
| GET | `/jobs/:id` | Yes | Any | Get single job |
| PATCH | `/jobs/:id/approve` | Yes | TPO | Approve a job |
| PATCH | `/jobs/:id/reject` | Yes | TPO | Reject a job |
| PATCH | `/jobs/:id/assign` | Yes | TPO | Assign job to schools |
| PATCH | `/jobs/:id/close` | Yes | COMPANY | Close job posting |
| PATCH | `/jobs/:id/withdraw` | Yes | COMPANY | Withdraw job posting |
| POST | `/jobs/:id/apply` | Yes | STUDENT | Apply to a job |

#### Applications

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/applications` | Yes | STUDENT/COMPANY/TPO | List applications (role-filtered) |
| GET | `/jobs/:id/applicants` | Yes | COMPANY/TPO | List applicants for a job |
| PATCH | `/applications/:id/withdraw` | Yes | STUDENT | Withdraw application |
| PATCH | `/applications/:id/shortlist` | Yes | COMPANY | Shortlist an applicant |

#### Admin

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/admin/users` | Yes | ADMIN | List all users |
| PATCH | `/admin/users/:id/status` | Yes | ADMIN | Update user status |
| POST | `/admin/provision` | Yes | ADMIN | Create FACULTY/TPO account |
| GET | `/admin/audit-logs` | Yes | ADMIN | View audit logs |

#### TPO

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/admin/companies` | Yes | TPO/ADMIN | List all companies |
| PATCH | `/admin/companies/:id/approve` | Yes | TPO | Approve company |
| PATCH | `/admin/companies/:id/reject` | Yes | TPO | Reject company |

#### Announcements

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/announcements` | Yes | Any | List announcements |
| POST | `/announcements` | Yes | TPO | Create announcement |
| DELETE | `/announcements/:id` | Yes | TPO | Delete announcement |

#### Stats

| Method | Endpoint | Auth | Role | Description |
|---|---|---|---|---|
| GET | `/stats` | Yes | TPO/ADMIN | Placement statistics summary |

### 5.5 HTTP Status Codes Used

| Code | Meaning |
|---|---|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST) |
| 400 | Validation error or bad request |
| 401 | No token or expired token |
| 403 | Forbidden (wrong role or account status) |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, double application) |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

---

## 6. Authentication and Authorization

### 6.1 Authentication Flow

```
Step 1 — Registration
  Client → POST /api/register (email, password, role)
  Firebase Auth creates user
  Firestore users/{uid} document created
  Status: UNVERIFIED (student) | PENDING_APPROVAL (company)

Step 2 — Email Verification
  Firebase sends verification email
  User clicks link → Firebase marks email as verified

Step 3 — Login (Step 1: OTP issuance)
  Client → Firebase SDK → getIdToken()
  Client → POST /api/login (Authorization: Bearer <idToken>)
  Backend: verifyIdToken() → check Firestore status → issue OTP via email
  If status UNVERIFIED + email now verified → promote to ACTIVE

Step 4 — Login (Step 2: OTP verification)
  Client → POST /api/verify-login-otp (otp: "123456")
  Backend: check OTP in otpCodes/{uid}, verify not expired
  Returns: { uid, role, fullName, email }

Step 5 — Authenticated Requests
  Client → any protected endpoint (Authorization: Bearer <idToken>)
  Backend authenticate middleware: verifyIdToken → Firestore lookup → attach req.user
```

### 6.2 RBAC Matrix

| Resource | STUDENT | COMPANY | FACULTY | TPO | ADMIN |
|---|---|---|---|---|---|
| Own profile | R/W | — | — | — | — |
| Company profile | — | R/W | — | — | — |
| Declaration sign | W | — | — | — | — |
| Jobs (create) | — | W | — | — | — |
| Jobs (view) | R | R | R | R | R |
| Jobs (approve/reject) | — | — | — | W | — |
| Applications (submit) | W | — | — | — | — |
| Applications (view own) | R | — | — | — | — |
| Applications (view all for job) | — | R | — | R | — |
| Exam schedules | R | R | R/W | R/W | R |
| Interview schedules | R | R | R/W | R/W | R |
| User management | — | — | — | — | R/W |
| Company approval | — | — | — | W | — |
| Announcements | R | R | R | R/W | R |
| Audit logs | — | — | — | — | R |
| Statistics | — | — | — | R | R |

---

## 7. Frontend Architecture

### 7.1 Application Structure

```
src/frontend/src/
├── App.jsx              — Router, ProtectedRoute wiring
├── main.jsx             — React root, AuthProvider
├── contexts/
│   └── AuthContext.jsx  — Global auth state (Firebase onAuthStateChanged)
├── services/
│   └── api.js           — Axios/fetch wrapper, auto-attaches Bearer token
├── pages/               — One file per route
├── components/
│   ├── ui/              — Reusable design-system components
│   └── landing/         — Landing page specific components
└── utils/
    └── profileValidation.js  — Pure validation functions
```

### 7.2 Routing

Protected routes check `AuthContext` for authenticated user and role. Unauthorized access redirects to `/unauthorized`.

| Route | Component | Access |
|---|---|---|
| `/` | LandingPage | Public |
| `/login` | LoginPage | Public |
| `/register` | RegisterPage | Public |
| `/dashboard` | DashboardPage | Any authenticated |
| `/profile` | StudentProfilePage | STUDENT |
| `/jobs` | JobsPage | STUDENT |
| `/applications` | ApplicationsPage | STUDENT |
| `/company/profile` | CompanyProfilePage | COMPANY |
| `/company/jobs` | RecruiterJobsPage | COMPANY |
| `/tpo/companies` | TPOCompaniesPage | TPO |
| `/tpo/jobs` | TPOJobsPage | TPO |
| `/faculty/students` | FacultyStudentsPage | FACULTY |
| `/admin/users` | AdminUsersPage | ADMIN |

### 7.3 State Management

No global state library (Redux etc.) is used. State is managed via:
- `AuthContext` — current user and role (React Context)
- `useState` — local component state for forms and data
- `useEffect` + API calls — data fetching per page

### 7.4 3D Landing Page Components

| Component | Technology | Description |
|---|---|---|
| `UoH3DLogo.jsx` | React Three Fiber | Procedural 3D UoH crest with rotation/float animation |
| `HeroArtwork.jsx` | SVG + Framer Motion | Animated 2D emblem (atom, book, bolt, Sanskrit text) |
| `CampusGallery.jsx` | Framer Motion | Asymmetric photo mosaic with hover effects |
| `Reveal.jsx` | Framer Motion | Scroll-triggered fade-in wrapper |
| `AnimatedStat.jsx` | Framer Motion | Count-up animation for statistics |

---

## 8. Module Design

### 8.1 Email Service (`emailService.js`)

Wraps the Resend API for transactional emails:
- OTP delivery (`sendOTPEmail`)
- Job approval/rejection notifications (`sendJobApprovalEmail`, `sendJobRejectionEmail`)
- Declaration confirmation (`sendDeclarationEmail`)
- Generic broadcasts (`sendEmail`)

### 8.2 OTP Service (`otpService.js`)

- Generates 6-digit OTP using `crypto.randomInt`
- Stores in `otpCodes/{uid}` Firestore collection with `expiresAt` timestamp
- Maximum 3 attempts per OTP (tracks `attempts` field)
- TTL: 10 minutes

### 8.3 Audit Logger (`auditLogger.js`)

- Writes to `auditLogs` Firestore collection
- Each log: `{ action, actorId, actorRole, targetId, details, timestamp }`
- Called after every sensitive TPO/Admin action
- Immutable — no update or delete routes for audit logs

### 8.4 Validation Layer

**Backend (`profileValidator.js`):**
- `express-validator` chain for PATCH /api/profile
- Cross-field validation: `graduationYear >= joiningYear`
- All fields optional — only validates fields present in request body

**Frontend (`profileValidation.js`):**
- Pure ES module with no imports
- `validateProfileForm(form)` → `{ valid, errors }`
- `validateRegisterForm(form)` → `{ valid, errors }`
- Client-side only — does not replace backend validation

---

## 9. Deployment Architecture

### 9.1 Development

```bash
# Backend
cd src/backend && npm run dev     # nodemon, port 3000

# Frontend
cd src/frontend && npm run dev    # Vite HMR, port 5173
```

### 9.2 Docker Deployment

`src/docker-compose.yml` defines:

```yaml
services:
  backend:
    build: ./backend
    ports: ["3000:3000"]
    env_file: ./backend/.env

  frontend:
    build: ./frontend
    ports: ["80:80"]
    # nginx serves built React SPA
```

### 9.3 Environment Variables

**Backend (`.env`):**
```
NODE_ENV=production
PORT=3000
CORS_ALLOWED_ORIGINS=https://pms.uohyd.ac.in
FIREBASE_PROJECT_ID=...
RESEND_API_KEY=...
```

**Frontend (`.env`):**
```
VITE_API_URL=https://pms.uohyd.ac.in/api
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

### 9.4 CI/CD

GitHub Actions (`.github/workflows/ci.yml`):
1. Install backend dependencies
2. Run Jest test suite with coverage
3. Install frontend dependencies
4. Run Vite production build
5. Fail pipeline on any test failure or build error

---

## 10. Non-Functional Design Decisions

### 10.1 Performance

| Decision | Rationale |
|---|---|
| Vite bundler | Fast HMR, tree-shaking, Rollup-based production builds |
| `dpr={[1, 1.8]}` on Canvas | Caps pixel ratio — prevents GPU overload on Retina screens |
| `useMemo` on all THREE geometries | Shapes computed once, not on every render frame |
| `loading="lazy"` on all campus images | Defers offscreen image fetching |
| Rate limiting | Prevents API abuse; separate limits for auth vs data routes |

### 10.2 Security

| Decision | Rationale |
|---|---|
| Firebase ID token per request | Stateless auth — no session cookies to steal |
| `helmet()` | Sets X-Frame-Options, CSP, HSTS, and 10+ other headers |
| Input validation on both client and server | Defense in depth |
| `Object.freeze()` on all constants | Prevents runtime mutation of roles/statuses |
| `serviceAccountKey.json` in `.gitignore` | Prevents credential leak |

### 10.3 Scalability

| Decision | Rationale |
|---|---|
| Firestore NoSQL | Horizontally scalable; no schema migrations |
| Stateless Express server | Can be horizontally scaled behind a load balancer |
| Docker containerization | Portable deployment; environment parity |

### 10.4 Maintainability

| Decision | Rationale |
|---|---|
| Single `constants.js` source of truth | Role/status changes propagate everywhere |
| Route → Middleware → Controller separation | Each layer has one responsibility |
| `lp-*` CSS namespace | Landing page styles don't leak into app styles |
| Tailwind utility classes | No naming conflicts between component styles |

---

*End of System Design Document*
