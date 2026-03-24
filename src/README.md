# 🎓 Placement Management System — University of Hyderabad

> **School of Computer and Information Sciences (SCIS)**  
> Sprint 1: Setup & User Authentication

---

## 📋 Project Overview

A full-stack web application for managing campus placements at the University of Hyderabad. The system supports four user roles: **Student**, **Faculty (TPO)**, **Company/Recruiter**, and **Admin**.

### Sprint 1 Deliverables

| # | Deliverable | Status |
|---|-------------|--------|
| D-01 | Working Authentication System (register, verify, login, reset) | ✅ |
| D-02 | Role-Based Access Control (4 roles enforced at API + UI) | ✅ |
| D-03 | Admin User Management Interface | ✅ |
| D-04 | Version-Controlled Codebase | ✅ |
| D-05 | CI/CD Pipeline (GitHub Actions) | ✅ |
| D-06 | Docker + docker-compose for local staging | ✅ |
| D-07 | API Documentation | ✅ |
| D-08 | Unit Test Suite (Jest) | ✅ |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **Backend** | Node.js + Express |
| **Database** | Firebase Firestore |
| **Auth** | Firebase Authentication (Email/Password + Google SSO) |
| **Testing** | Jest + Supertest |
| **CI/CD** | GitHub Actions |
| **Containers** | Docker + docker-compose |
| **Deployment** | Vercel (frontend) + Render.com (backend) |

---

## 📁 Project Structure

```
src/
├── backend/
│   ├── src/
│   │   ├── config/          # Firebase & constants
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, RBAC, validators, errors
│   │   ├── routes/           # Express route definitions
│   │   ├── scripts/          # Admin seed script
│   │   ├── utils/            # Helpers
│   │   ├── app.js            # Express application
│   │   └── server.js         # Entry point
│   ├── tests/                # Jest unit tests
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── components/       # Shared components (Navbar, Layout, ProtectedRoute)
│   │   ├── config/           # Firebase client config
│   │   ├── contexts/         # AuthContext (state management)
│   │   ├── pages/            # All page components
│   │   ├── services/         # API service layer
│   │   ├── App.jsx           # Router
│   │   ├── main.jsx          # Entry point
│   │   └── index.css         # Tailwind + custom styles
│   ├── Dockerfile
│   ├── package.json
│   └── .env.example
│
├── docker-compose.yml
├── API_DOCUMENTATION.md
└── Sprint1_Documentation.md
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm 10+
- Firebase project with Auth + Firestore enabled

### 1. Clone & Install

```bash
# Backend
cd src/backend
cp .env.example .env
# Edit .env with your Firebase credentials
npm install

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your Firebase client config
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing)
3. Enable **Authentication** → Sign-in methods: Email/Password + Google
4. Enable **Firestore Database**
5. **Backend:** Project Settings → Service Accounts → Generate Private Key → copy values to `backend/.env`
6. **Frontend:** Project Settings → General → Your Apps → Add Web App → copy config to `frontend/.env`

### 3. Seed Admin User

```bash
cd src/backend
node src/scripts/seedAdmin.js
```

Default admin: `admin@uohyd.ac.in` / `Admin@123456`

### 4. Run Development Servers

```bash
# Terminal 1 — Backend
cd src/backend
npm run dev

# Terminal 2 — Frontend
cd src/frontend
npm run dev
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health check: http://localhost:5000/api/health

### 5. Run with Docker

```bash
cd src
docker-compose up --build
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

---

## 🧪 Running Tests

```bash
cd src/backend
npm test
```

Tests cover:
- **T-23:** Registration endpoint (valid input, duplicate email, missing fields, university email validation)
- **T-24:** Login endpoint (correct credentials, unverified account, expired token)
- **T-25:** Admin role assignment (admin can assign, non-admin gets 403)

---

## 🔒 University Email Validation Rule

| Role | Email Requirement |
|------|------------------|
| **Student** | Must end with `@uohyd.ac.in` |
| **Faculty (TPO)** | Must end with `@uohyd.ac.in` |
| **Company** | Any valid email |

This is enforced on **both** frontend (instant feedback) and backend (server-side security).

---

## 📖 API Docs

See [API_DOCUMENTATION.md](./API_DOCUMENTATION.md) for full endpoint documentation.

---

## 👥 Team

| Role | Responsibility |
|------|---------------|
| Frontend Developer | React UI, auth pages, admin panel |
| Backend Developer | Express API, Firebase integration, RBAC, tests |

---

*Sprint 1 — University of Hyderabad × SCIS Placement Management Portal*
