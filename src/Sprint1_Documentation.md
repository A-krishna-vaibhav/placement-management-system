# Sprint 1 Documentation — University of Hyderabad Placement Management System

---

## 1. Sprint Overview

| Field             | Details                                              |
|-------------------|------------------------------------------------------|
| **Sprint Number** | Sprint 1                                             |
| **Sprint Name**   | Setup & User Authentication                          |
| **Duration**      | 2 Weeks                                              |
| **Team Size**     | 2 Developers                                         |
| **Project**       | University of Hyderabad X School of Computer and Information Sciences — Placement Management Portal |
| **Methodology**   | Agile Scrum (2-week time-boxed iterations)           |

---

## 2. Sprint Goals

1. Establish the foundational project infrastructure (repository, CI/CD, environments).
2. Implement a secure user authentication system (registration, login, email verification).
3. Implement role-based access control (RBAC) so that each user type (Student, Faculty, Company, Admin) can access only their permitted features.
4. Deliver a basic Admin interface to manage and assign user roles.
5. Produce a version-controlled, tested, and documented codebase as a stable base for future sprints.

> **Definition of Done:** All acceptance criteria are met, unit tests pass, code is reviewed and merged, and the sprint deliverables are deployed to the staging environment.

---

## 3. User Stories

### US-01 — New User Registration

> **As a** new user (Student, Faculty, or Company Recruiter),  
> **I want** to register an account by providing my name, institutional email, department, and password,  
> **so that** I can access the placement portal with an appropriate role.

**Priority:** Critical  
**Story Points:** 5

---

### US-02 — User Login

> **As a** registered user,  
> **I want** to log in using my email and password (or Google/Firebase SSO),  
> **so that** I can securely access my personalised dashboard.

**Priority:** Critical  
**Story Points:** 3

---

### US-03 — Email Verification

> **As a** newly registered user,  
> **I want** to receive a verification email after sign-up,  
> **so that** my account is activated and my identity is confirmed.

**Priority:** High  
**Story Points:** 2

---

### US-04 — Password Reset

> **As a** registered user who has forgotten their password,  
> **I want** to reset my password via a secure email link,  
> **so that** I can regain access to my account without administrator intervention.

**Priority:** High  
**Story Points:** 2

---

### US-05 — Role Assignment by Admin

> **As an** administrator,  
> **I want** to view pending user registrations and assign or update user roles (Student, Faculty, Company, Admin),  
> **so that** each user has access only to the features appropriate to their role.

**Priority:** Critical  
**Story Points:** 5

---

## 4. Task Breakdown

### 4.1 Project Setup

| # | Task | Owner | Notes |
|---|------|-------|-------|
| T-01 | Create Git repository and define branching strategy (`main`, `dev`, `feature/*`) | Both | Version control baseline |
| T-02 | Initialise frontend project (React.js / Next.js) with folder structure | FE Dev | Component-based architecture |
| T-03 | Initialise backend project (Node.js/Express or Django) with folder structure | BE Dev | REST API skeleton |
| T-04 | Configure CI/CD pipeline (GitHub Actions / GitLab CI) for automated builds | Both | Trigger on PR to `dev` |
| T-05 | Provision development and staging cloud environments (AWS / Azure / GCP) | BE Dev | Include database instance |

---

### 4.2 Database & Data Model

| # | Task | Owner | Notes |
|---|------|-------|-------|
| T-06 | Define database schema: `Users` table/collection with fields `UserID`, `Name`, `Email`, `Role`, `Department`, `PasswordHash`, `IsVerified` | BE Dev | Supports PostgreSQL or Firestore |
| T-07 | Define `Roles` reference table/collection (`Student`, `Faculty`, `Company`, `Admin`) | BE Dev | Used for RBAC enforcement |
| T-08 | Implement data validation rules: unique email, password hashing (bcrypt), mandatory fields | BE Dev | Server-side enforcement |

---

### 4.3 Registration & Login (Backend)

| # | Task | Owner | Notes |
|---|------|-------|-------|
| T-09 | Implement `POST /api/register` endpoint — accepts name, email, department, password; hashes password; stores user; sends verification email | BE Dev | Returns 201 on success |
| T-10 | Implement `POST /api/login` endpoint — validates credentials; returns JWT token (expiry < 24 hrs) | BE Dev | FR1.3, FR2.2 |
| T-11 | Integrate Firebase Authentication **or** custom JWT middleware for session management | BE Dev | Token attached to all subsequent API requests |
| T-12 | Implement `GET /api/verify-email?token=` endpoint to activate account | BE Dev | Account inactive until verified |
| T-13 | Implement `POST /api/forgot-password` and `POST /api/reset-password` endpoints | BE Dev | Secure token-based reset link |

---

### 4.4 Registration & Login (Frontend)

| # | Task | Owner | Notes |
|---|------|-------|-------|
| T-14 | Build **Registration Page**: form with name, institutional email, department, password, confirm password fields | FE Dev | Client-side validation |
| T-15 | Build **Login Page**: form with email, password fields; optional "Sign in with Google" button | FE Dev | Redirects to role-specific dashboard on success |
| T-16 | Build **Forgot Password Page**: email input form | FE Dev | Triggers reset email |
| T-17 | Build **Reset Password Page**: new password + confirm form (accessed via reset link) | FE Dev | Token validated before render |
| T-18 | Implement protected route guard — redirect unauthenticated users to Login | FE Dev | Checks JWT validity |

---

### 4.5 Role Management (Admin)

| # | Task | Owner | Notes |
|---|------|-------|-------|
| T-19 | Implement `GET /api/admin/users` endpoint — returns list of users filterable by role/status | BE Dev | Admin-only; RBAC enforced |
| T-20 | Implement `PATCH /api/admin/users/:id/role` endpoint — assigns or updates a user's role | BE Dev | Admin-only |
| T-21 | Implement `PATCH /api/admin/users/:id/status` endpoint — activate/deactivate accounts | BE Dev | Admin-only |
| T-22 | Build **Admin User Management Page**: table of pending/all users with role dropdown and approve/deactivate actions | FE Dev | Role-specific dashboard section |

---

### 4.6 Testing

| # | Task | Owner | Notes |
|---|------|-------|-------|
| T-23 | Write unit tests for registration endpoint (valid input, duplicate email, missing fields) | BE Dev | Jest / PyTest |
| T-24 | Write unit tests for login endpoint (correct credentials, wrong password, unverified account) | BE Dev | |
| T-25 | Write unit tests for role assignment endpoint (admin can assign, non-admin cannot) | BE Dev | |
| T-26 | Manual end-to-end testing: register → verify email → login → admin assigns role → dashboard loads | Both | Test all four roles |

---

### 4.7 Documentation

| # | Task | Owner | Notes |
|---|------|-------|-------|
| T-27 | Document all Sprint 1 API endpoints (method, URL, request/response schema, auth requirements) | BE Dev | In README or API spec file |
| T-28 | Update sprint backlog in project management tool (Jira / Trello / GitHub Projects) | Both | Reflect actual vs estimated effort |

---

## 5. Acceptance Criteria

### US-01 — New User Registration

- [ ] A user can submit the registration form with name, institutional email, department, and password.
- [ ] Duplicate email addresses are rejected with a clear error message.
- [ ] Passwords are stored as bcrypt hashes; plaintext is never persisted.
- [ ] A new account is created with status `Inactive` until email is verified.
- [ ] Required field validations are enforced both client-side and server-side.

---

### US-02 — User Login

- [ ] A verified user can log in with correct email and password and receives a JWT token.
- [ ] An unverified user cannot log in and sees an instructive error message.
- [ ] An incorrect password returns a 401 error with a user-friendly message.
- [ ] On successful login, the user is redirected to their role-specific dashboard.
- [ ] JWT tokens expire within 24 hours; expired tokens are rejected.

---

### US-03 — Email Verification

- [ ] A verification email is sent automatically upon successful registration.
- [ ] Clicking the verification link activates the account (status changes to `Active`).
- [ ] The verification link expires after a configurable period (e.g., 24 hours).
- [ ] Attempting to log in with an unverified account shows a clear prompt to verify.

---

### US-04 — Password Reset

- [ ] A user can request a password reset by entering their registered email.
- [ ] A secure, time-limited reset link is sent to the registered email address.
- [ ] Following the link allows the user to set a new password.
- [ ] The reset link is invalidated after single use or expiry.
- [ ] An invalid or expired token displays an appropriate error message.

---

### US-05 — Role Assignment by Admin

- [ ] Admin can view a list of all registered users, filterable by role and status.
- [ ] Admin can assign one of the following roles: `Student`, `Faculty`, `Company`, `Admin`.
- [ ] Admin can activate or deactivate any user account.
- [ ] Role changes take effect immediately on the user's next authenticated request.
- [ ] Non-admin users cannot access any admin user management endpoints (return 403).

---

## 6. Deliverables

| # | Deliverable | Description |
|---|-------------|-------------|
| D-01 | **Working Authentication System** | Users can register, verify email, log in, and reset passwords |
| D-02 | **Role-Based Access Control (RBAC)** | Four roles enforced at API and UI levels |
| D-03 | **Admin User Management Interface** | Admin can view, approve, and assign roles to users |
| D-04 | **Version-Controlled Codebase** | Git repository with `main`/`dev` branches and branching strategy in place |
| D-05 | **CI/CD Pipeline** | Automated build and basic test pipeline running on PR/push |
| D-06 | **Staging Environment** | Fully deployed and accessible staging instance |
| D-07 | **API Documentation** | All Sprint 1 endpoints documented (method, path, request/response, auth) |
| D-08 | **Unit Test Suite** | Tests covering registration, login, and role assignment endpoints |

---

## 7. Dependencies

| Dependency | Details | Impact if Blocked |
|------------|---------|-------------------|
| Authentication Technology Decision | Team must choose between Firebase Auth and custom JWT before T-09 | Blocks all auth tasks |
| Cloud Environment Provisioning | AWS / Azure / GCP account and project setup required | Blocks T-05, T-12 |
| Database Choice | PostgreSQL or Firebase Firestore must be selected before T-06 | Blocks schema and API tasks |
| University Email Domain | Required for sending verification and reset emails | Blocks T-09, T-13; workaround: use transactional email service (SendGrid) |

> **Note:** Sprint 2 (Profiles & Job Postings) is fully dependent on Sprint 1's authentication and RBAC being complete.

---

## 8. Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Firebase Auth integration failure or misconfiguration | Medium | High — blocks entire auth flow | Spike task in Week 1; have fallback JWT implementation ready |
| Environment setup delays consuming feature development time | High | Medium — reduces sprint velocity | Allocate first 2 days exclusively to setup; timebox strictly |
| Scope creep into Sprint 2 features | Medium | Medium — destabilises sprint | Refer all new requests to the product backlog; no mid-sprint scope additions |
| Email delivery failures (spam filters, domain issues) | Low | Medium — breaks verification flow | Use SendGrid sandbox in development; test early |
| Underestimation of RBAC complexity | Low | Medium — role enforcement bugs | Implement and test RBAC middleware before building user-facing features |

---

## 9. Assumptions

- Both developers are familiar with the chosen tech stack (React, Node.js/Express or Django, PostgreSQL / Firestore).
- Cloud infrastructure and accounts are accessible before sprint kick-off.
- An email gateway (e.g., SendGrid) account is available for sending verification and reset emails.
- The university's institutional email domain is available or a placeholder domain is used during development.
- Admin accounts for the portal will be seeded manually or created by an existing admin; self-registration as Admin is not permitted.
- All users are assumed to have access to a modern web browser (Chrome, Firefox, Edge, Safari) and a stable internet connection.

---

## 10. Sprint Ceremonies

| Ceremony | Frequency | Duration | Purpose |
|----------|-----------|----------|---------|
| Sprint Planning | Day 1 | 1 hour | Confirm stories, assign tasks, estimate effort |
| Daily Standup | Daily | 15 minutes | Share progress, surface blockers |
| Sprint Review / Demo | Day 14 | 30 minutes | Demo deliverables to stakeholders |
| Sprint Retrospective | Day 14 | 30 minutes | Reflect on process and identify improvements |

---

*Document prepared for the University of Hyderabad Placement Management System — Sprint 1.*  
*Sources: Sprint Plan (Sprints_SCRUM_.pdf), SRS (SRS_PMS.pdf), Feasibility Report (Feasibility_Report.pdf).*
