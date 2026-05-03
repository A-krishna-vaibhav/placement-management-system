# User Manual
## University of Hyderabad — Placement Management System

**Document Version:** 1.0  
**Date:** May 2026  
**System:** UoH Placement Management System (PMS)  
**Support:** Training and Placement Office, University of Hyderabad  

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started — All Users](#2-getting-started--all-users)
3. [Student Guide](#3-student-guide)
4. [Company (Recruiter) Guide](#4-company-recruiter-guide)
5. [Faculty Guide](#5-faculty-guide)
6. [TPO Guide](#6-tpo-guide)
7. [Admin Guide](#7-admin-guide)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Introduction

### 1.1 What is the PMS?

The Placement Management System (PMS) is the University of Hyderabad's official online platform for managing campus placements. It connects students, companies, faculty coordinators, the Training and Placement Office (TPO), and system administrators on a single platform.

### 1.2 What Can You Do?

| Role | Key Actions |
|---|---|
| **Student** | Build profile, sign PGAB declaration, apply for jobs, track applications, view exams and interview slots |
| **Company** | Post job openings, view applicants, request exam and interview scheduling |
| **Faculty** | View school students, confirm exam/interview schedules assigned by TPO |
| **TPO** | Approve companies and jobs, assign jobs to schools, coordinate exams and interviews, post announcements |
| **Admin** | Manage all users, provision Faculty and TPO accounts, view audit logs |

### 1.3 Supported Browsers

- Google Chrome (recommended)
- Mozilla Firefox
- Microsoft Edge
- Safari (macOS)

### 1.4 Access the System

Open your browser and navigate to the system URL provided by your institution. The landing page is publicly accessible; all features require login.

---

## 2. Getting Started — All Users

### 2.1 Registration

**Who can self-register:** Students and Company recruiters only.  
Faculty, TPO, and Admin accounts are created by the system administrator.

**Step 1:** Click **Create your account** on the landing page or go to `/register`.

**Step 2:** Fill in the registration form:

| Field | Notes |
|---|---|
| Full Name | Your legal name — letters, spaces, hyphens, apostrophes only |
| Email | Students: must be `@uohyd.ac.in`. Companies: any professional email |
| Password | Minimum 6 characters |
| Role | Select **Student** or **Company** |
| School (Students) | Select your School from the dropdown |
| Department (Students) | Select your Department |
| Company Name (Companies) | Your organisation's registered name |

**Step 3:** Click **Register**.

- **Students** receive a verification email. Click the link in the email to activate your account.
- **Companies** are placed in `Pending Approval` status and must wait for TPO approval before logging in.

---

### 2.2 Email Verification (Students)

After registering, check your `@uohyd.ac.in` inbox for a verification email from Firebase/UoH PMS. Click the **Verify Email** link. Your account status changes from `UNVERIFIED` to `ACTIVE`.

> If you don't see the email, check your spam folder.

---

### 2.3 Logging In

**Step 1:** Go to `/login` or click **Sign in** on the landing page.

**Step 2:** Sign in with Firebase (your registered email and password). This is handled by Firebase Authentication.

**Step 3:** After Firebase verifies your credentials, the system sends a **One-Time Password (OTP)** to your registered email.

**Step 4:** Enter the 6-digit OTP on the OTP verification screen. The OTP expires in **10 minutes**.

**Step 5:** You are logged in and redirected to your Dashboard.

---

### 2.4 Forgot Password

1. Click **Forgot password?** on the login screen.
2. Enter your registered email address.
3. Click **Send reset link**.
4. Check your email for a password reset link from Firebase.
5. Click the link and set a new password.

---

### 2.5 Dashboard

After login, all users see the Dashboard which shows:
- Welcome message with your name and role
- Quick statistics (role-specific)
- Recent announcements from the TPO
- Quick links to your most-used sections

---

## 3. Student Guide

### 3.1 Complete Your Profile

Before applying for any job, your profile must be complete.

**Navigate to:** Sidebar → **My Profile**

**Fill in all fields:**

| Field | Notes |
|---|---|
| CGPA | Numeric, 0–10, up to 2 decimal places (e.g., 8.75) |
| Backlogs | Number of active backlogs (0 if none) |
| Joining Year | Year you joined UoH (e.g., 2022) |
| Graduation Year | Expected graduation year (must be ≥ Joining Year) |
| Phone | 10-digit Indian mobile number |
| Skills | Enter skills separated by commas |
| LinkedIn URL | Full URL starting with `https://` |
| E-Signature | Type your full name as your digital signature |

Click **Save Changes** to update your profile. Errors (if any) are shown in red below each field.

---

### 3.2 Upload Your Resume

1. Go to **My Profile**.
2. Scroll to the **Resume** section.
3. Drag and drop a PDF file onto the upload area, or click to browse.
4. Only **PDF** files are accepted.
5. You can upload multiple resumes (e.g., one for tech roles, one for management roles).
6. To delete a resume, click the **Delete** icon next to it.

---

### 3.3 Sign the PGAB Declaration

The PGAB (Placement Guidance and Advisory Bureau) declaration is a one-time requirement before you can apply for any job.

**Navigate to:** Sidebar → **Declaration**

1. Read the declaration text carefully.
2. Type your full name in the **E-Signature** field exactly as it appears in your profile.
3. Click **Sign Declaration**.
4. A confirmation is shown and the signed date is recorded.

> You can only sign once. Once signed, this section shows your signature status.

---

### 3.4 Browse and Apply for Jobs

**Navigate to:** Sidebar → **Jobs**

**Viewing jobs:**
- The jobs list shows all job postings currently **OPEN** and for which you are eligible based on your school and department.
- Click any job card to view full details (company, description, CTC, eligibility criteria, deadline).

**Applying:**
1. Open a job you want to apply for.
2. Click **Apply Now**.
3. If you have not signed the declaration, you will be blocked with a message to sign first.
4. If your CGPA is below the job's minimum or you have more backlogs than allowed, you will see an eligibility error.
5. On successful application, status shows **Applied**.

> You cannot apply to the same job twice.

---

### 3.5 Track Applications

**Navigate to:** Sidebar → **My Applications**

View all your applications with current status:

| Status | Meaning |
|---|---|
| Applied | Application received |
| Shortlisted | Company has shortlisted you |
| Not Shortlisted | Not selected for further rounds |
| Interview Scheduled | Interview slot assigned |
| Selected | Congratulations — you have an offer |
| Rejected | Not selected after interview |
| Withdrawn | You withdrew the application |

**To withdraw an application:**
1. Click on an application with status **Applied** or **Shortlisted**.
2. Click **Withdraw Application**.
3. Confirm the withdrawal. This cannot be undone.

> You cannot withdraw if status is **Selected** or **Rejected**.

---

### 3.6 View Exam Schedule

**Navigate to:** Sidebar → **Exams**

View upcoming placement exams relevant to your school. Details include:
- Company and job title
- Date and time
- Mode (Online / Offline)
- Meeting link (Online) or Venue (Offline)

---

### 3.7 View Interview Schedule

**Navigate to:** Sidebar → **Interviews**

View scheduled interviews. If the allocation mode is **Student Choice**, you can select your preferred time slot from the available slots before the booking deadline.

---

## 4. Company (Recruiter) Guide

### 4.1 Account Approval

After registration, your account is in **Pending Approval** status. You will receive an email once the TPO approves or rejects your account. You cannot log in until approved.

---

### 4.2 Complete Company Profile

**Navigate to:** Sidebar → **Company Profile**

Fill in:
- Company Name
- Website URL
- Industry
- Company Description (up to 1000 characters)
- HR Phone Number

Click **Edit** to enter edit mode, make changes, and click **Save** in the sticky footer bar.

---

### 4.3 Post a Job

**Navigate to:** Sidebar → **My Job Postings** → **Post New Job**

Fill in the job details:

| Field | Notes |
|---|---|
| Job Title | e.g., Software Development Intern |
| Description | Full job description |
| Location | City or Remote |
| CTC / Stipend | Compensation package |
| Job Type | Full Time / Internship / Contract |
| Minimum CGPA | Minimum eligibility CGPA |
| Maximum Backlogs | Maximum allowed active backlogs (0 for no backlogs) |
| Application Deadline | Last date to apply |

Click **Submit for Approval**. The job goes to `PENDING_APPROVAL` status and awaits TPO review.

---

### 4.4 Manage Job Postings

**Navigate to:** Sidebar → **My Job Postings**

| Action | When Available | Effect |
|---|---|---|
| **Close Job** | Status = OPEN | Stops new applications |
| **Withdraw Job** | Status = PENDING or OPEN | Removes the posting entirely |

---

### 4.5 View Applicants

1. Click on an approved (OPEN) job posting.
2. Click **View Applicants**.
3. See the list of students who applied with their profiles.
4. Click **Shortlist** or **Not Shortlist** against each applicant.

---

### 4.6 Request Exam / Interview

After shortlisting candidates, use the dashboard to request an exam or interview schedule through the TPO. Fill in preferred dates, mode (online/offline), and the TPO will coordinate with Faculty to finalize.

---

## 5. Faculty Guide

Faculty accounts are provisioned by the Admin. You receive your login credentials via email.

### 5.1 View School Students

**Navigate to:** Sidebar → **Students**

View all students registered under your school with their profile details, CGPA, department, and application activity.

---

### 5.2 Review Job Postings

**Navigate to:** Sidebar → **Jobs**

View jobs assigned to your school by the TPO. You can provide school-level approval or flag concerns to the TPO.

---

### 5.3 Confirm Exam Schedules

When the TPO forwards an exam schedule to your school, you receive a notification. Navigate to **Exams** and click **Confirm** to approve the schedule or contact the TPO if the date is unavailable.

---

### 5.4 Confirm Interview Schedules

When the TPO forwards an interview schedule, navigate to **Interviews** and confirm the available slots for your school's students.

---

## 6. TPO Guide

TPO accounts are provisioned by the Admin.

### 6.1 Approve Companies

**Navigate to:** Sidebar → **Companies**

View companies in `Pending Approval` status. For each company:
- Review their profile and website
- Click **Approve** to activate their account
- Click **Reject** (with a reason) to decline

Approved companies receive an email notification.

---

### 6.2 Approve / Reject Jobs

**Navigate to:** Sidebar → **Jobs** (filter: Pending Approval)

Review job postings submitted by companies. For each job:
1. Click the job to see full details and eligibility criteria.
2. Click **Approve** — the job becomes OPEN and visible to eligible students.
3. Click **Reject** (with reason) — company is notified.
4. Click **Assign to Schools** to manually control which schools see the job.

---

### 6.3 Coordinate Exam Scheduling

**Navigate to:** Sidebar → **Exam Schedules**

1. When a company requests an exam, it appears with status `REQUESTED`.
2. Click **Forward to Faculty** to send to the relevant school's faculty coordinator.
3. Faculty confirms → status becomes `FACULTY_CONFIRMED`.
4. Click **Finalize** to lock the schedule and notify all eligible students.
5. Add venue (offline) or meeting link (online) after finalizing.

---

### 6.4 Coordinate Interview Scheduling

**Navigate to:** Sidebar → **Interview Schedules**

Similar to exam scheduling:
1. Review company's interview request (dates, mode, allocation preference).
2. Forward to Faculty → Faculty confirms.
3. Set `SCHEDULED` status — generates interview slots.
4. Choose allocation mode:
   - **Auto** — system assigns students to slots
   - **Student Choice** — students book their own slots

---

### 6.5 Manage Announcements

**Navigate to:** Sidebar → **Announcements**

1. Click **New Announcement**.
2. Enter title and content (Markdown supported).
3. Click **Publish** — visible to all users on their dashboard.
4. To delete, click the trash icon next to any announcement.

---

### 6.6 View Statistics

**Navigate to:** Sidebar → **Statistics**

Dashboard showing:
- Total registered students
- Total companies (by status)
- Total jobs (by status)
- Total applications submitted
- Placement rate

---

## 7. Admin Guide

Admin account is seeded at system deployment. Contact your system administrator for credentials.

### 7.1 View All Users

**Navigate to:** Sidebar → **Users**

Search and filter users by role, status, and school. View full profile details for any user.

---

### 7.2 Update User Status

1. Click on a user.
2. Click **Update Status**.
3. Select new status: `ACTIVE`, `SUSPENDED`, or `DEACTIVATED`.
4. Confirm the change.

> You cannot deactivate your own admin account.

---

### 7.3 Provision Faculty and TPO Accounts

These roles cannot self-register. Only Admin can create them.

**Navigate to:** Sidebar → **Users** → **Provision New Account**

1. Select role: **FACULTY** or **TPO**.
2. Enter their full name and `@uohyd.ac.in` email.
3. Set a temporary password.
4. Click **Create Account**.
5. The user receives their credentials via email and must change their password on first login.

---

### 7.4 View Audit Logs

**Navigate to:** Sidebar → **Audit Logs**

Immutable log of all privileged actions:
- Company approvals and rejections
- Job approvals and rejections
- User status changes
- Account provisioning
- Announcement creation and deletion

Each log shows: **Action**, **Actor**, **Target**, **Timestamp**, **Details**.

---

## 8. Troubleshooting

### 8.1 Common Issues

| Problem | Solution |
|---|---|
| "Email not verified" on login | Check your `@uohyd.ac.in` inbox and click the verification link. Check spam folder. |
| "Account pending approval" on login | Your company account is awaiting TPO review. Wait for the approval email. |
| "Account suspended" on login | Contact the TPO or Admin. |
| OTP not received | Check spam folder. OTP expires in 10 minutes — request a new one by logging in again. |
| Cannot apply for a job | Ensure: (1) PGAB declaration is signed, (2) your CGPA and backlogs meet eligibility, (3) job is still OPEN. |
| Resume upload fails | Ensure the file is PDF format and under 10 MB. |
| Profile save fails | Check for red error messages below each field. Fix all errors before saving. |
| Cannot see jobs | Some jobs are assigned to specific schools — contact TPO if you believe you should see a posting. |

### 8.2 Browser Issues

- Clear browser cache and cookies if the page does not load correctly.
- Disable browser extensions that may block Firebase authentication.
- Use an incognito window to rule out extension conflicts.

### 8.3 Contact Support

For issues not resolved by this manual, contact:

**Training and Placement Office**  
University of Hyderabad  
Gachibowli, Hyderabad — 500046  
Email: tpo@uohyd.ac.in

---

*End of User Manual*
