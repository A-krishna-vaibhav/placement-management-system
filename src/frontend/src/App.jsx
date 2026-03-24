/**
 * App Component — Router Configuration
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import DashboardPage from './pages/DashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import UnauthorizedPage from './pages/UnauthorizedPage';
import NotFoundPage from './pages/NotFoundPage';

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
              background: '#0f172a',
              color: '#f1f5f9',
              borderRadius: '14px',
              padding: '12px 16px',
              fontSize: '14px',
              fontWeight: '500',
              boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
              border: '1px solid rgba(255,255,255,0.08)',
            },
            success: {
              iconTheme: { primary: '#34d399', secondary: '#0f172a' },
            },
            error: {
              iconTheme: { primary: '#f87171', secondary: '#0f172a' },
            },
          }}
        />

        <Routes>
          {/* Public */}
          <Route path="/login"           element={<LoginPage />} />
          <Route path="/register"        element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password"  element={<ResetPasswordPage />} />
          <Route path="/verify-email"    element={<VerifyEmailPage />} />
          <Route path="/unauthorized"    element={<UnauthorizedPage />} />

          {/* Authenticated */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Admin */}
          <Route element={<ProtectedRoute allowedRoles={['Admin']}><Layout /></ProtectedRoute>}>
            <Route path="/admin/users" element={<AdminUsersPage />} />
          </Route>

          <Route path="/"  element={<Navigate to="/login" replace />} />
          <Route path="*"  element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
