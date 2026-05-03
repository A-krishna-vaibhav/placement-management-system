import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { HiMenu, HiX } from 'react-icons/hi';
import { Logo } from '../ui';

const NAV_LINKS = [
  { href: '#announcements', label: 'Announcements' },
  { href: '#how-it-works',  label: 'How it works' },
  { href: '#contact',       label: 'Contact' },
];

export default function LandingNav() {
  const [scrolled, setScrolled]     = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeLink, setActiveLink] = useState('');

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 48);
    handler();
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  return (
    <motion.header
      initial={{ y: -64, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
      className={`landing-nav ${scrolled ? 'landing-nav--scrolled' : ''}`}
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex-shrink-0 focus-visible:outline-none">
          <Logo variant="full" size="sm" />
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setActiveLink(l.href)}
              className={`landing-nav__link ${activeLink === l.href ? 'landing-nav__link--active' : ''}`}
            >
              {l.label}
            </a>
          ))}
        </nav>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-2">
          <Link to="/login" className="landing-nav__signin">
            Sign in
          </Link>
          <Link to="/register" className="landing-nav__register">
            Register
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 rounded-lg text-ink-800 hover:bg-cream-200 transition-colors"
          onClick={() => setMobileOpen((s) => !s)}
          aria-label="Toggle navigation menu"
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen
            ? <HiX className="w-5 h-5" />
            : <HiMenu className="w-5 h-5" />
          }
        </button>
      </div>

      {/* Mobile dropdown */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="mobile-nav"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="md:hidden overflow-hidden"
            style={{ background: 'rgba(251,249,244,0.97)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(214,208,198,0.6)' }}
          >
            <div className="px-6 py-5 space-y-1">
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="block px-3 py-2.5 text-base font-medium text-ink-700 rounded-lg hover:text-maroon-600 hover:bg-maroon-50 transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <div className="pt-4 border-t border-ink-100 grid grid-cols-2 gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="btn btn-md text-center text-maroon-700 border border-maroon-200 hover:bg-maroon-50 rounded-lg transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="btn-primary btn-md text-center rounded-lg"
                >
                  Register
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
