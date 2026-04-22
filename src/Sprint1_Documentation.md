# Sprint 1 Documentation
# University of Hyderabad — Placement Management System

---

## 1. Sprint Overview

| Field | Details |
|---|---|
| **Sprint Number** | Sprint 1 |
| **Sprint Name** | Setup & User Authentication |
| **Duration** | 2 Weeks |
| **Team** | 22MCCE13 · 22MCCE16 |
| **Methodology** | Agile Scrum |
| **Status** | ✅ Complete |

### Sprint Goal
> Establish the project foundation — infrastructure, authentication, RBAC, and admin user management — as a stable, tested base for all future sprints.

---

## 2. User Stories

### US-01 — New User Registration
> **As a** new user (Student, Faculty, or Company Recruiter),  
> **I want** to register an account with my name, email, department, password, and role,  
> **so that** I can access the placement portal with appropriate permissions.

**Priority:** Critical | **Points:** 5 | **Status:** ✅ Done

---

### US-02 — User Login
> **As a** registered user,  
> **I want** to log in using email+password or Google SSO,  
> **so that** I can securely access my personalised dashboard.

**Priority:** Critical | **Points:** 3 | **Status:** ✅ Done

---

### US-03 — Email Verification
> **As a** newly registered user,  
> **I want** to verify my email address after registration,  
> **so that** my identity is confirmed and my account is activated.

**Priority:** High | **Points:** 2 | **Status:** ✅ Done

---

### US-04 — Password Reset
> **As a** user who forgot their password,  
> **I want** to reset it via a secure email link,  
> **so that** I can regain access without administrator help.

**Priority:** High | **Points:** 2 | **Status:** ✅ Done

---

### US-05 — Admin User Management
> **As an** administrator,  
> **I want** to view all registered users, assign/change roles, activate/deactivate/delete accounts,  
> **so that** only authorised users can access the system.

**Priority:** Critical | **Points:** 5 | **Status:** ✅ Done

---

## 3. Task Breakdown & Completion

### 3.1 Project Setup

| # | Task | Status | Notes |
|---|------|--------|-------|
| T-01 | Git repository + branching strategy | ✅ | GitHub: A-krishna-vaibhav/placement-management-system, branch: main |
| T-02 | Frontend project initialised | ✅ | React 18 + Vite 5 + Tailwind CSS 3.4 |
| T-03 | Backend project initialised | ✅ | Node.js + Express.js, modular MVC structure |
| T-04 | CI/CD pipeline configured | ✅ | GitHub Actions — runs Jest on push/PR to main |
| T-05 | Docker setup | ✅ | docker-compose.yml with backend + frontend + nginx containers |

### 3.2 Database & Data Model

| # | Task | Status | Notes |
|---|------|--------|-------|
| T-06 | Users collection/schema defined | ✅ | Firestore users collection — uid, name, email, role, status, department, createdAt |
| T-07 | Roles defined | ✅ | constants.js — ROLES: Student, Faculty, Company, Admin |
| T-08 | Validation rules implemented | ✅ | express-validator in validators.js; unique email via Firebase Auth |

### 3.3 Registration & Login (Backend)

| # | Task | Status | Notes |
|---|------|--------|-------|
| T-09 | POST /api/register | ✅ | Creates Firebase Auth user + Firestore doc; status defaults to Inactive |
| T-10 | POST /api/login | ✅ | Validates via Firebase Auth; returns user profile from Firestore |
| T-11 | Firebase Auth middleware | ✅ | authenticate() verifies Firebase ID token on all protected routes |
| T-12 | Email verification | ✅ | Firebase sends verification email automatically |
| T-13 | POST /api/forgot-password + reset | ✅ | Firebase reset email + client-side confirmPasswordReset() |

### 3.4 Registration & Login (Frontend)

| # | Task | Status | Notes |
|---|------|--------|-------|
| T-14 | Registration Page | ✅ | Split-panel; role toggle buttons; UoH logo; university email validation for Students |
| T-15 | Login Page | ✅ | Split-panel; icon inputs; password toggle; Google SSO; spinner |
| T-16 | Forgot Password Page | ✅ | Split-panel with UoH logo; success state after email sent |
| T-17 | Reset Password Page | ✅ | Split-panel; verifies oobCode; password strength indicator |
| T-18 | Protected route guards | ✅ | ProtectedRoute in App.jsx — redirects unauthenticated to /login |

### 3.5 Role Management (Admin)

| # | Task | Status | Notes |
|---|------|--------|-------|
| T-19 | GET /api/admin/users | ✅ | Returns all users; filterable by role and status |
| T-20 | PATCH /api/admin/users/:id/role | ✅ | Updates role in Firestore; admin-only |
| T-21 | PATCH /api/admin/users/:id/status | ✅ | Updates status (Active/Inactive/Deactivated) |
| T-21b | DELETE /api/admin/users/:id | ✅ | Deletes from Firestore + Firebase Auth |
| T-22 | Admin User Management Page | ✅ | Search + filters; table with actions; optimistic UI updates |

### 3.6 Testing

| # | Task | Status | Notes |
|---|------|--------|-------|
| T-23 | Unit tests — register endpoint | ✅ | Valid input, duplicate email, missing fields |
| T-24 | Unit tests — login endpoint | ✅ | Correct, wrong password, unverified |
| T-25 | Unit tests — admin endpoints | ✅ | listUsers, updateRole, updateStatus, deleteUser; 403 for non-admin |
| T-26 | End-to-end manual testing | ✅ | Full flow: register → verify → login → admin assigns role → dashboard |

**32/32 tests passing** ✅

---

## 4. API Endpoints Implemented

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | /api/register | No | Any | Register new user |
| POST | /api/login | No | Any | Login and get profile |
| POST | /api/forgot-password | No | Any | Send reset email |
| POST | /api/reset-password | No | Any | Reset password |
| GET | /api/verify-email | Yes | Any | Email verification handler |
| GET | /api/me | Yes | Any | Get own profile |
| GET | /api/admin/users | Yes | Admin | List all users |
| PATCH | /api/admin/users/:id/role | Yes | Admin | Update user role |
| PATCH | /api/admin/users/:id/status | Yes | Admin | Update user status |
| DELETE | /api/admin/users/:id | Yes | Admin | Delete user permanently |

---

## 5. Acceptance Criteria — Verification

### US-01 Registration ✅
- [x] Form accepts name, email, department, password, role
- [x] Duplicate emails rejected (Firebase Auth enforces uniqueness)
- [x] Passwords stored as Firebase Auth hashes — plaintext never persisted
- [x] New accounts created with status Inactive
- [x] Client-side AND server-side validation both enforced

### US-02 Login ✅
- [x] Verified user logs in and receives Firebase ID token
- [x] Unverified user sees prompt to verify email
- [x] Wrong password returns 401 with user-friendly message
- [x] Successful login redirects to role-specific dashboard
- [x] Firebase tokens auto-expire and refresh via SDK

### US-03 Email Verification ✅
- [x] Verification email sent on registration
- [x] Clicking link activates Firebase Auth account
- [x] VerifyEmailPage shown with resend button

### US-04 Password Reset ✅
- [x] Reset email sent from ForgotPasswordPage
- [x] ResetPasswordPage validates oobCode before showing form
- [x] Password confirmed and submitted via confirmPasswordReset()
- [x] Invalid/expired token shows error with new-link option

### US-05 Admin User Management ✅
- [x] Admin views all users with role + status filters + search
- [x] Admin can assign Student / Faculty / Company / Admin roles
- [x] Admin can activate / deactivate / delete any user
- [x] Changes reflect immediately in the UI (optimistic updates)
- [x] Non-admin users receive 403 Forbidden on all admin endpoints

---

## 6. Sprint Metrics

| Metric | Value |
|---|---|
| Story Points Planned | 17 |
| Story Points Delivered | 17 |
| Tasks Planned | 28 |
| Tasks Completed | 30 (28 + 2 bonus) |
| Unit Tests Written | 32 |
| Unit Tests Passing | 32 (100%) |
| API Endpoints | 10 |
| Frontend Pages | 9 |
| Bugs Found | 5 |
| Bugs Resolved | 5 |

---

## 7. Deliverables

| # | Deliverable | Status |
|---|-------------|--------|
| D-01 | Working Authentication System | ✅ |
| D-02 | Role-Based Access Control (RBAC) | ✅ |
| D-03 | Admin User Management Interface | ✅ |
| D-04 | Version-Controlled Codebase on GitHub | ✅ |
| D-05 | CI/CD Pipeline (GitHub Actions) | ✅ |
| D-06 | Docker Setup (Node v20 containers) | ✅ |
| D-07 | API Documentation | ✅ |
| D-08 | Unit Test Suite (32/32 passing) | ✅ |
| D-09 | Responsive UI Design System (Tailwind) | ✅ |

---

## 8. Challenges & Resolutions

| Challenge | Resolution |
|---|---|
| Node.js v25 incompatible with Vite/Rollup | Dockerfiles pinned to Node v20 LTS |
| Firebase private key formatting in .env | Wrapped in double quotes with explicit \n escapes |
| authController empty on load (dotenv race) | Ensured dotenv.config() runs before any require() in server.js |
| Docker build too slow (105MB context) | Added .dockerignore for node_modules, dist, .git, coverage |
| Firebase rate-limiting on test registrations | Catch block shows friendly approval message instead of raw error |

---

## 9. Sprint Retrospective

### What Went Well
- Firebase Auth eliminated custom token infrastructure entirely
- Tailwind CSS sped up UI development significantly
- Modular MVC backend made adding endpoints straightforward
- Jest mocking of Firebase Admin SDK enabled isolated unit tests

### Improvements for Sprint 2
- Add pagination to Admin Users table
- Add profile photo upload (Firebase Storage)
- Email notifications for role changes
- Refresh token rotation for longer sessions

---

*Sprint 1 — University of Hyderabad Placement Management System*  
*Team: 22MCCE13 · 22MCCE16 | March 2026*
