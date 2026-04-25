import { Link } from 'react-router-dom';
import { HiOutlineHome } from 'react-icons/hi';

const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center bg-cream-100 px-4">
    <div className="text-center animate-slide-up max-w-sm">
      <p className="font-display text-8xl font-semibold text-ink-100 select-none leading-none mb-4">404</p>
      <h1 className="font-display text-2xl font-semibold text-ink-800 mb-2">Page not found</h1>
      <p className="text-ink-500 text-sm mb-7">
        The page you&rsquo;re looking for doesn&rsquo;t exist or has been moved.
      </p>
      <Link to="/" className="btn-primary gap-2">
        <HiOutlineHome className="w-4 h-4" />
        Go Home
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
