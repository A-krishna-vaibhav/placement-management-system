import { Link } from 'react-router-dom';
import { HiOutlineShieldExclamation, HiOutlineArrowLeft } from 'react-icons/hi';

const UnauthorizedPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-cream-100 px-4">
    <div className="text-center animate-slide-up max-w-sm">
      <div className="w-16 h-16 bg-danger-bg rounded-2xl flex items-center justify-center mx-auto mb-5 ring-1 ring-danger-ring/30">
        <HiOutlineShieldExclamation className="w-8 h-8 text-danger" />
      </div>
      <h1 className="font-display text-2xl font-semibold text-ink-800 mb-2">Access Denied</h1>
      <p className="text-ink-500 text-sm mb-7 leading-relaxed">
        You don&rsquo;t have permission to view this page.
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
