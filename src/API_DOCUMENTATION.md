# Sprint 1 — API Documentation

> **Base URL:** `http://localhost:5000/api`  
> **Authentication:** Firebase ID Token in `Authorization: Bearer <token>` header  
> **Content-Type:** `application/json`

---

## Table of Contents

1. [Health Check](#1-health-check)
2. [Registration](#2-registration)
3. [Login](#3-login)
4. [Email Verification](#4-email-verification)
5. [Forgot Password](#5-forgot-password)
6. [Reset Password](#6-reset-password)
7. [Get Profile](#7-get-profile)
8. [Admin — List Users](#8-admin--list-users)
9. [Admin — Update User Role](#9-admin--update-user-role)
10. [Admin — Update User Status](#10-admin--update-user-status)

---

## 1. Health Check

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/health` |
| **Auth** | None |

**Response** `200 OK`
```json
{
  "success": true,
  "message": "PMS Backend is running.",
  "timestamp": "2026-03-22T10:00:00.000Z",
  "environment": "development"
}
```

---

## 2. Registration

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/register` |
| **Auth** | None |

**Request Body**
```json
{
  "name": "John Doe",
  "email": "johndoe@uohyd.ac.in",
  "password": "StrongPass@1",
  "department": "Computer Science",
  "role": "Student"
}
```

**Validation Rules**
| Field | Rules |
|-------|-------|
| `name` | Required, 2–100 chars |
| `email` | Required, valid email. If role is `Student` or `Faculty`, must end with `@uohyd.ac.in` |
| `password` | Required, min 8 chars, 1 uppercase, 1 number, 1 special char |
| `department` | Required |
| `role` | Required, one of: `Student`, `Faculty`, `Company` (self-registration as `Admin` is blocked) |

**Response** `201 Created`
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "uid": "abc123",
    "name": "John Doe",
    "email": "johndoe@uohyd.ac.in",
    "role": "Student",
    "department": "Computer Science",
    "status": "Inactive"
  }
}
```

**Error Responses**
| Status | Condition |
|--------|-----------|
| `400` | Validation errors / non-university email for Student/Faculty |
| `403` | Attempted self-registration as Admin |
| `409` | Email already exists |
| `500` | Server error |

---

## 3. Login

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/login` |
| **Auth** | `Bearer <Firebase ID Token>` |

> **Note:** The actual sign-in happens on the client via Firebase Client SDK. This endpoint receives the resulting ID token, verifies it, syncs the Firestore profile, and returns user data.

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Login successful.",
  "data": {
    "uid": "abc123",
    "name": "John Doe",
    "email": "johndoe@uohyd.ac.in",
    "role": "Student",
    "department": "Computer Science",
    "status": "Active",
    "isVerified": true
  }
}
```

**Error Responses**
| Status | Condition |
|--------|-----------|
| `401` | No token / expired token |
| `403` | Email not verified / account deactivated |
| `404` | User profile not found in Firestore |

---

## 4. Email Verification

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/verify-email` |
| **Auth** | `Bearer <Firebase ID Token>` |

> Called by the frontend after the user clicks the Firebase verification link. Syncs Firestore status to `Active`.

**Response** `200 OK`
```json
{
  "success": true,
  "message": "Email verified and account activated."
}
```

---

## 5. Forgot Password

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/forgot-password` |
| **Auth** | None |

**Request Body**
```json
{
  "email": "johndoe@uohyd.ac.in"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "If an account with that email exists, a reset link has been sent."
}
```

> Always returns 200 to prevent email enumeration.

---

## 6. Reset Password

| | |
|---|---|
| **Method** | `POST` |
| **URL** | `/api/reset-password` |
| **Auth** | None |

> Handled entirely by Firebase Client SDK (`confirmPasswordReset`). This endpoint is a placeholder.

---

## 7. Get Profile

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/me` |
| **Auth** | `Bearer <Firebase ID Token>` (verified + active) |

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "uid": "abc123",
    "email": "johndoe@uohyd.ac.in",
    "emailVerified": true,
    "role": "Student",
    "status": "Active",
    "name": "John Doe",
    "department": "Computer Science"
  }
}
```

---

## 8. Admin — List Users

| | |
|---|---|
| **Method** | `GET` |
| **URL** | `/api/admin/users` |
| **Auth** | `Bearer <token>` — **Admin only** |

**Query Parameters**
| Param | Type | Description |
|-------|------|-------------|
| `role` | `string` | Filter by role (`Student`, `Faculty`, `Company`, `Admin`) |
| `status` | `string` | Filter by status (`Active`, `Inactive`, `Deactivated`) |
| `page` | `number` | Page number (default: 1) |
| `limit` | `number` | Items per page (default: 20) |

**Response** `200 OK`
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "uid": "abc123",
        "name": "John Doe",
        "email": "johndoe@uohyd.ac.in",
        "role": "Student",
        "department": "Computer Science",
        "status": "Inactive",
        "isVerified": false,
        "createdAt": "2026-03-22T10:00:00.000Z",
        "updatedAt": "2026-03-22T10:00:00.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

**Error:** `403` if non-admin.

---

## 9. Admin — Update User Role

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/admin/users/:id/role` |
| **Auth** | `Bearer <token>` — **Admin only** |

**Request Body**
```json
{
  "role": "Faculty"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "User role updated to 'Faculty'.",
  "data": { "uid": "abc123", "role": "Faculty" }
}
```

---

## 10. Admin — Update User Status

| | |
|---|---|
| **Method** | `PATCH` |
| **URL** | `/api/admin/users/:id/status` |
| **Auth** | `Bearer <token>` — **Admin only** |

**Request Body**
```json
{
  "status": "Active"
}
```

**Response** `200 OK`
```json
{
  "success": true,
  "message": "User status updated to 'Active'.",
  "data": { "uid": "abc123", "status": "Active" }
}
```

---

## Firestore Data Model

### `users` collection

| Field | Type | Description |
|-------|------|-------------|
| `uid` | `string` | Firebase Auth UID (document ID) |
| `name` | `string` | Full name |
| `email` | `string` | Email address |
| `role` | `string` | `Student` \| `Faculty` \| `Company` \| `Admin` |
| `department` | `string` | Department name |
| `status` | `string` | `Inactive` \| `Active` \| `Deactivated` |
| `isVerified` | `boolean` | Email verification status |
| `createdAt` | `string` | ISO 8601 timestamp |
| `updatedAt` | `string` | ISO 8601 timestamp |

---

## Error Response Format

All error responses follow this structure:

```json
{
  "success": false,
  "message": "Human-readable error message.",
  "errors": [
    { "field": "email", "message": "Must be a valid email address." }
  ]
}
```

---

*Generated for Sprint 1 — University of Hyderabad Placement Management System*
