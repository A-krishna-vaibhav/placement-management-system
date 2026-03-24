/**
 * Unauthorized Page
 */

import { Link } from 'react-router-dom';
import { HiOutlineShieldExclamation, HiOutlineArrowLeft } from 'react-icons/hi';

const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
    <div className="text-center animate-slide-up max-w-sm">
      <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 ring-1 ring-red-200">
        <HiOutlineShieldExclamation className="w-8 h-8 text-red-500" />
      </div>
      <h1 className="text-2xl font-bold text-surface-900 mb-2">Access Denied</h1>
      <p className="text-surface-500 text-sm mb-7 leading-relaxed">
        You don't have permission to view this page.
        Contact your administrator if you believe this is an error.
      </p>
      <Link to="/dashboard" className="btn-primary gap-2">
        <HiOutlineArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </Link>
    </div>
  </div>
);

export default UnauthorizedPage;
