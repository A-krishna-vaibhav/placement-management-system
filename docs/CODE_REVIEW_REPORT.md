# Code Review and Walkthrough Report
## University of Hyderabad — Placement Management System

**Document Version:** 1.0  
**Date:** May 2026  
**Authors:** Krishna Vaibhav (22MCCE13), Team Member (22MCCE16)  
**Review Type:** Peer Code Walkthrough + Static Analysis  
**Scope:** Backend API + Frontend React Application  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Review Methodology](#2-review-methodology)
3. [Backend Code Review](#3-backend-code-review)
4. [Frontend Code Review](#4-frontend-code-review)
5. [Security Review](#5-security-review)
6. [Architecture and Design Review](#6-architecture-and-design-review)
7. [Findings Summary](#7-findings-summary)
8. [Conclusion](#8-conclusion)

---

## 1. Introduction

### 1.1 Purpose

This report documents the results of a code review and walkthrough conducted on the UoH Placement Management System (PMS) codebase. The review examines code quality, security, architecture, and adherence to best practices.

### 1.2 Scope

| Area | Files Reviewed |
|---|---|
| Backend middleware | `auth.js`, `rbac.js`, `errorHandler.js`, `validators.js`, `profileValidator.js` |
| Backend controllers | `authController.js`, `jobController.js`, `applicationController.js`, `studentProfileController.js`, `declarationController.js`, `adminController.js` |
| Backend config | `app.js`, `constants.js`, `firebase.js` |
| Frontend pages | `LandingPage.jsx`, `RegisterPage.jsx`, `LoginPage.jsx`, `StudentProfilePage.jsx`, `CompanyProfilePage.jsx` |
| Frontend components | `UoH3DLogo.jsx`, `CampusGallery.jsx`, `Logo.jsx`, `LandingNav.jsx` |
| Frontend utilities | `profileValidation.js`, `api.js` |

---

## 2. Review Methodology

### 2.1 Review Process

1. **Static walkthrough** — Each file read top-to-bottom, logic traced manually
2. **Checklist-based review** — Security, SOLID principles, error handling, naming
3. **Cross-file consistency check** — Constants reuse, role definitions, API contract alignment
4. **Test alignment** — Verified test cases cover the reviewed logic paths

### 2.2 Rating Scale

| Rating | Meaning |
|---|---|
| Good | Meets or exceeds standards |
| Acceptable | Minor improvement possible, not blocking |
| Needs Improvement | Should be addressed before production |
| Critical | Must be fixed immediately |

---

## 3. Backend Code Review

### 3.1 `src/backend/src/app.js` — Express Application Setup

**Rating: Good**

| Aspect | Observation |
|---|---|
| Security headers | `helmet()` applied globally — correct |
| CORS | Origin whitelist implemented with environment variable — good |
| Rate limiting | Separate limiters for auth routes (20 req/min) and authed routes (100 req/min) — well thought out |
| Body parsing | `express.json({ limit: '10mb' })` — reasonable limit for resume payloads |
| Logging | `morgan('dev')` suppressed in test environment — correct |
| Health check | `/api/health` endpoint returns environment and timestamp — useful for DevOps |
| Error handling | `notFoundHandler` before `errorHandler` — correct Express middleware order |
| Route mounting | All 13 route modules mounted cleanly with clear `/api/` prefix |

**Improvement:** The CORS `allowedOrigins` env var silently defaults to localhost origins. In production, this variable must be explicitly set — a startup warning would help catch misconfiguration.

---

### 3.2 `src/backend/src/config/constants.js` — Application Constants

**Rating: Good**

| Aspect | Observation |
|---|---|
| Immutability | All constant objects use `Object.freeze()` — prevents accidental mutation |
| Role definition | Single source of truth for all roles — used consistently across middleware and controllers |
| Status enums | `ACCOUNT_STATUS`, `JOB_STATUS`, `APPLICATION_STATUS` etc. are all defined as frozen objects |
| Comment alignment | References to SRS sections (e.g., `FR-1.14`, `FR-1.15`) link code to requirements |
| Job assignment rules | `JOB_ASSIGNMENT_RULES` keyword → school mapping is a good extensible design |

**Improvement:** `COLLECTIONS` names are string literals. A typo in a controller referencing the wrong collection name would silently fail (Firestore creates a new collection). Consider a runtime check that validates all collections exist on startup.

---

### 3.3 `src/backend/src/middleware/auth.js` — Authentication Middleware

**Rating: Good**

| Aspect | Observation |
|---|---|
| Token extraction | `Authorization: Bearer <token>` pattern followed correctly |
| Firebase ID token verification | Uses `auth.verifyIdToken()` — standard Firebase pattern |
| Account status gating | All 4 blocking statuses (DEACTIVATED, SUSPENDED, PENDING_APPROVAL, UNVERIFIED) handled with specific 403 codes |
| Error differentiation | `auth/id-token-expired` returns 401 with specific message; generic errors return 500 |
| `req.user` shape | Attaches `uid`, `email`, `role`, `status`, `fullName` — sufficient for downstream use |
| Principle of least privilege | `authorize(...roles)` factory used on every protected route |

**Issue Found:** `rbac.js` exports a duplicate `authorize` function identical to the one in `auth.js`. This creates two sources of truth for the same function. Currently `rbac.js` authorize is unused — `auth.js` authorize is used everywhere.

**Recommendation:** Delete `rbac.js` and import `authorize` only from `auth.js`.

---

### 3.4 `src/backend/src/middleware/validators.js` — Input Validation

**Rating: Good**

| Aspect | Observation |
|---|---|
| Framework | Uses `express-validator` — industry standard |
| Email domain enforcement | Custom `.custom()` check ensures `@uohyd.ac.in` for STUDENT role |
| Role whitelist | `SELF_REGISTRABLE_ROLES` from constants used — no hardcoded strings |
| Company conditional fields | `.if(body('role').equals(ROLES.COMPANY))` — correct conditional validation |
| Website URL validation | `isURL({ require_protocol: true, protocols: ['http','https'] })` — correct |
| Whitespace-only rejection | Custom checks added to fullName and password — good security practice |

**Improvement:** The `companyName` field only validates when `role === COMPANY` at registration time. If a company user later calls a PATCH route without the role field, the validator won't run. This is handled by `profileValidator.js` separately — which is correct but could benefit from a shared utility.

---

### 3.5 `src/backend/src/middleware/profileValidator.js` — Profile Update Validation

**Rating: Good**

| Aspect | Observation |
|---|---|
| Cross-field validation | `graduationYear` vs `joiningYear` cross-check is correctly implemented |
| Phone validation | All-same-digit pattern rejected (`/^(\d)\1{9}$/`) — good heuristic |
| Year range | Bounded between 1980 and `CURRENT_YEAR + 6` — reasonable |
| CGPA format | 2 decimal place regex used — prevents floating point abuse |
| URL validation | `linkedinUrl` checked with protocol requirement |
| Isolation | Completely isolated from existing routes — added as non-breaking middleware |

---

### 3.6 `src/backend/src/controllers/authController.js` — Authentication Controller

**Rating: Acceptable**

| Aspect | Observation |
|---|---|
| OTP flow | Two-step login (issue OTP → verify OTP) is correctly implemented |
| Status promotion | UNVERIFIED → ACTIVE transition on first email-verified login is handled |
| `devOtp` exposure | OTP value exposed in response body only in non-production environments — correct |
| Password not stored | Password handled entirely by Firebase Auth — no plaintext storage |
| Audit logging | Registration and login events are not currently audit-logged |

**Issue Found:** The `devOtp` check uses `process.env.NODE_ENV !== 'production'`. This is correct, but the check should also verify the email is a test email to prevent accidental exposure in staging environments with production-like data.

---

### 3.7 `src/backend/src/controllers/jobController.js` — Job Controller

**Rating: Good**

| Aspect | Observation |
|---|---|
| Status machine | Job status transitions (PENDING → OPEN/REJECTED, OPEN → CLOSED/WITHDRAWN) are correctly enforced |
| Ownership checks | Company can only modify their own jobs — `job.companyId !== req.user.uid` guard present |
| Email notifications | `sendJobApprovalEmail` / `sendJobRejectionEmail` called on status change |
| School assignment | `assignSchoolsToJob` logic uses `JOB_ASSIGNMENT_RULES` keyword matching |
| Audit logging | `auditLogger` called for APPROVE_JOB, REJECT_JOB actions |

---

### 3.8 `src/backend/src/controllers/applicationController.js` — Application Controller

**Rating: Good**

| Aspect | Observation |
|---|---|
| Declaration gate | Application blocked if no signed declaration found — correctly enforced |
| Eligibility checks | CGPA minimum and backlog maximum checked against `job.eligibility` |
| Duplicate prevention | Existing application check before creating new one — 409 on duplicate |
| Withdrawal | Cannot withdraw if already SELECTED or REJECTED — business rule enforced |
| Student isolation | Students only see their own applications — `userId === req.user.uid` filter |

---

## 4. Frontend Code Review

### 4.1 `src/frontend/src/services/api.js` — API Client

**Rating: Acceptable**

| Aspect | Observation |
|---|---|
| Base URL | Uses `import.meta.env.VITE_API_URL` — environment-driven, correct |
| Auth header | Firebase ID token attached via `onAuthStateChanged` — standard pattern |
| Error handling | Network errors propagated to calling component |

**Issue:** No request retry logic or timeout configuration. A slow backend response will hang indefinitely.

---

### 4.2 `src/frontend/src/utils/profileValidation.js` — Frontend Validation

**Rating: Good**

| Aspect | Observation |
|---|---|
| Pure module | No side effects, no imports — just plain ES functions |
| CGPA format | `!/^\d+(\.\d{1,2})?$/.test()` — correct 2-decimal limit |
| Duplicate skills | `Set` comparison used to detect duplicates |
| E-signature cross-field | At least one word from fullName must appear in signature |
| Error shape | Returns `{ valid: boolean, errors: {} }` — clean API |

---

### 4.3 `src/frontend/src/components/landing/UoH3DLogo.jsx` — 3D Logo

**Rating: Good**

| Aspect | Observation |
|---|---|
| Performance | `useMemo` on all geometry/shape definitions — shapes not recreated on re-render |
| Animation | `useFrame` used correctly — no `setInterval`, no re-renders |
| Memory | No disposable THREE objects created in render path without memoization |
| Accessibility | `aria-label` and `role="img"` on container div |
| DPR cap | `dpr={[1, 1.8]}` prevents excessive pixel ratio on Retina screens |
| Alpha canvas | `gl={{ alpha: true }}` — transparent background, blends with landing page |

---

### 4.4 `src/frontend/src/pages/RegisterPage.jsx` and `StudentProfilePage.jsx`

**Rating: Good**

| Aspect | Observation |
|---|---|
| Validation wiring | `validateRegisterForm` / `validateProfileForm` called before API request |
| Error display | Per-field inline error messages shown below each input |
| Error clearing | Errors cleared on input change — good UX |
| toast notifications | `react-hot-toast` used for success/failure feedback |
| Loading state | Submit button disabled during API call — prevents double submission |

---

### 4.5 `src/frontend/src/components/ui/Logo.jsx`

**Rating: Good**

| Aspect | Observation |
|---|---|
| Theme handling | `theme='light'` and `theme='dark'` variants supported |
| Drop shadow | `drop-shadow` filter used instead of `brightness-0 invert` — preserves UoH crest colours |
| Size variants | `sm`, `md`, `lg` via `SIZES` map — clean, no magic numbers |
| Variant prop | `variant='full'` shows text; `variant='mark'` shows logo only |

---

## 5. Security Review

### 5.1 Authentication and Authorization

| Check | Status | Notes |
|---|---|---|
| Firebase ID token verification on every protected request | PASS | `authenticate` middleware used |
| RBAC enforced on every route | PASS | `authorize(ROLES.X)` on all protected handlers |
| No JWT secret stored in code | PASS | Firebase handles token signing |
| Account status gating | PASS | DEACTIVATED/SUSPENDED/PENDING blocked at middleware |
| Self-registration of privileged roles blocked | PASS | FACULTY, TPO, ADMIN cannot self-register |

### 5.2 Input Validation

| Check | Status | Notes |
|---|---|---|
| All registration fields validated | PASS | express-validator rules |
| Profile update fields validated | PASS | profileValidator.js middleware |
| University email enforced for students | PASS | Custom validator |
| SQL/NoSQL injection | PASS | Firebase Firestore SDK uses parameterized queries |
| XSS prevention | PASS | No `dangerouslySetInnerHTML`; React escapes by default |
| File type restriction on resume upload | ACCEPTABLE | Multer configured for PDF only |

### 5.3 Rate Limiting

| Route Group | Limit | Status |
|---|---|---|
| Auth routes (login, register, OTP) | 20 req/min per IP | PASS |
| All authenticated routes | 100 req/min per IP | PASS |

### 5.4 Data Privacy

| Check | Status | Notes |
|---|---|---|
| Passwords stored by Firebase Auth (hashed) | PASS | No plaintext storage |
| OTP stored in Firestore with TTL | PASS | 10-minute expiry |
| Firestore security rules defined | PASS | `firestore.rules` file exists |
| `serviceAccountKey.json` in `.gitignore` | PASS | Not committed to repository |

---

## 6. Architecture and Design Review

### 6.1 Separation of Concerns

| Layer | Assessment |
|---|---|
| Routes | Thin — only mount middleware chains and call controllers |
| Controllers | Handle request/response; call Firestore; call services |
| Middleware | Stateless — authenticate, authorize, validate |
| Services | `emailService`, `auditLogger`, `otpService` — isolated side effects |
| Config | `constants.js` is single source of truth — no hardcoded strings in controllers |

**Rating: Good** — Clean layered architecture with no cross-layer leakage.

### 6.2 Naming Conventions

| Concern | Convention | Adherence |
|---|---|---|
| Files | camelCase for JS files | Consistent |
| React components | PascalCase | Consistent |
| Constants | SCREAMING_SNAKE_CASE | Consistent |
| API routes | kebab-case URLs | Consistent |
| Firestore collections | camelCase | Consistent |

### 6.3 Code Duplication

| Issue | Location | Severity |
|---|---|---|
| Duplicate `authorize` function | `auth.js` vs `rbac.js` | Low |
| Similar error response shape repeated | Multiple controllers | Low — could use a helper |
| Firestore `.get()` pattern repeated | All controllers | Acceptable — standard pattern |

### 6.4 Comments and Documentation

| Aspect | Assessment |
|---|---|
| File-level JSDoc | Present in all major files |
| SRS cross-references | `FR-1.x`, `QA-Sx` references in middleware and constants |
| Complex logic explained | Cross-field validation, OTP flow, status transitions commented |
| Inline comments for obvious code | Avoided appropriately |

---

## 7. Findings Summary

### 7.1 Issues Requiring Attention

| ID | File | Finding | Severity | Recommendation |
|---|---|---|---|---|
| CR-01 | `rbac.js` | Duplicate `authorize` function never used | Low | Delete file, keep only `auth.js` version |
| CR-02 | `app.js` | No startup warning when `CORS_ALLOWED_ORIGINS` not set in production | Low | Add production env check |
| CR-03 | `authController.js` | `devOtp` exposed in staging environments | Medium | Add email domain check before exposing |
| CR-04 | `api.js` | No request timeout | Low | Add `AbortController` with 30s timeout |
| CR-05 | `companyController.js` | Only 17% statement coverage — untested | Medium | Add test cases in next sprint |
| CR-06 | `resumeController.js` | File upload endpoint untested | Medium | Add multipart test setup |

### 7.2 Positive Highlights

| Highlight | Location |
|---|---|
| Clean frozen constants with SRS references | `constants.js` |
| Non-breaking isolated validation middleware | `profileValidator.js` |
| Two-step OTP login flow correctly implemented | `authController.js`, `otpService.js` |
| Complete RBAC on every protected route | All route files |
| `useMemo` on all R3F geometries | `UoH3DLogo.jsx` |
| Pure validation utility with no side effects | `profileValidation.js` |
| Rate limiting correctly split by auth vs authed | `app.js` |
| Account status gating before any data access | `auth.js` |

---

## 8. Conclusion

The codebase demonstrates sound architecture and security practices. The layered Express architecture is clean, constants are well-organized, and RBAC is applied consistently. The most significant finding is the dead `rbac.js` file and the low coverage on `companyController.js` and `resumeController.js`. These are minor issues that do not affect correctness of the tested modules.

The frontend follows React best practices — memoized geometries, no inline style logic, clean prop APIs, and validation isolated in utility functions. The system is production-ready pending the minor improvements noted above.

---

*End of Code Review and Walkthrough Report*
