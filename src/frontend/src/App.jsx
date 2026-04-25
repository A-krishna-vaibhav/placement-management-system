import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LandingPage        from './pages/LandingPage';
import LoginPage          from './pages/LoginPage';
import RegisterPage       from './pages/RegisterPage';
import VerifyOTPPage      from './pages/VerifyOTPPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage  from './pages/ResetPasswordPage';
import VerifyEmailPage    from './pages/VerifyEmailPage';
import DashboardPage      from './pages/DashboardPage';
import AdminUsersPage     from './pages/AdminUsersPage';
import StudentProfilePage from './pages/StudentProfilePage';
import JobsPage           from './pages/JobsPage';
import JobDetailPage      from './pages/JobDetailPage';
import ApplicationsPage   from './pages/ApplicationsPage';
import RecruiterJobsPage  from './pages/RecruiterJobsPage';
import JobApplicantsPage  from './pages/JobApplicantsPage';
import TPOJobsPage        from './pages/TPOJobsPage';
import TPOCompaniesPage   from './pages/TPOCompaniesPage';
import FacultyStudentsPage from './pages/FacultyStudentsPage';
import CompanyProfilePage from './pages/CompanyProfilePage';
import UnauthorizedPage   from './pages/UnauthorizedPage';
import NotFoundPage       from './pages/NotFoundPage';

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          gutter={10}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#fdf8f0',
              color: '#1c1412',
              borderRadius: '8px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              border: '1px solid #e8d9c4',
            },
            success: { iconTheme: { primary: '#16a34a', secondary: '#fdf8f0' } },
            error:   { iconTheme: { primary: '#7c1c2e', secondary: '#fdf8f0' } },
          }}
        />

        <Routes>
          {/* Public */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/verify-otp"      element={<VerifyOTPPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
          <Route path="/verify-email"    element={<VerifyEmailPage />} />
          <Route path="/unauthorized"    element={<UnauthorizedPage />} />

          {/* All authenticated users */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Student */}
          <Route element={<ProtectedRoute allowedRoles={['STUDENT']}><Layout /></ProtectedRoute>}>
            <Route path="/profile"          element={<StudentProfilePage />} />
            <Route path="/jobs"             element={<JobsPage />} />
            <Route path="/jobs/:id"         element={<JobDetailPage />} />
            <Route path="/applications"     element={<ApplicationsPage />} />
          </Route>

          {/* Company (recruiter) */}
          <Route element={<ProtectedRoute allowedRoles={['COMPANY']}><Layout /></ProtectedRoute>}>
            <Route path="/company/jobs"                element={<RecruiterJobsPage />} />
            <Route path="/company/jobs/:id/applicants" element={<JobApplicantsPage />} />
            <Route path="/company/profile"             element={<CompanyProfilePage />} />
            <Route path="/jobs/:id"                    element={<JobDetailPage />} />
          </Route>

          {/* Faculty */}
          <Route element={<ProtectedRoute allowedRoles={['FACULTY']}><Layout /></ProtectedRoute>}>
            <Route path="/faculty/students" element={<FacultyStudentsPage />} />
          </Route>

          {/* TPO + Admin */}
          <Route element={<ProtectedRoute allowedRoles={['TPO', 'ADMIN']}><Layout /></ProtectedRoute>}>
            <Route path="/tpo/jobs"      element={<TPOJobsPage />} />
            <Route path="/tpo/companies" element={<TPOCompaniesPage />} />
            <Route path="/jobs/:id"      element={<JobDetailPage />} />
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={['ADMIN']}><Layout /></ProtectedRoute>}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          <Route path="/"  element={<LandingPage />} />
          <Route path="*"  element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
