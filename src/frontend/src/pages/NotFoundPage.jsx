/**
 * 404 Not Found Page
 */

import { Link } from 'react-router-dom';
import { HiOutlineHome } from 'react-icons/hi';

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
    <div className="text-center animate-slide-up max-w-sm">
      <p className="text-8xl font-black text-surface-100 select-none leading-none mb-4">404</p>
      <h1 className="text-2xl font-bold text-surface-900 mb-2">Page not found</h1>
      <p className="text-surface-500 text-sm mb-7">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn-primary gap-2">
        <HiOutlineHome className="w-4 h-4" />
        Go Home
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
