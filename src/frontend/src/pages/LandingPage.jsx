import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';
import {
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineArrowRight,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
  HiOutlineExternalLink,
} from 'react-icons/hi';

import { Button, Logo } from '../components/ui';
import LandingNav       from '../components/landing/LandingNav';
import UoH3DLogo       from '../components/landing/UoH3DLogo';
import AnimatedStat     from '../components/landing/AnimatedStat';
import AnnouncementCard from '../components/landing/AnnouncementCard';
import Reveal           from '../components/landing/Reveal';
import CampusGallery   from '../components/landing/CampusGallery';

import { announcements } from '../data/announcements';

const STEPS = [
  {
    icon: HiOutlineAcademicCap,
    title: 'Register as a Student',
    body:  'Sign up with your @uohyd.ac.in email, verify your inbox, and complete your academic profile in under five minutes.',
  },
  {
    icon: HiOutlineDocumentText,
    title: 'Sign the PGAB Declaration',
    body:  "Electronically sign the University's candidate declaration — a one-time step that keeps your applications compliant.",
  },
  {
    icon: HiOutlineBriefcase,
    title: 'Apply and track',
    body:  'Browse eligible job postings filtered for your School, CGPA and programme. One-click apply; track every application from here.',
  },
];

const STATS = [
  { value: 5000, label: 'Students Registered', suffix: '+' },
  { value: 42,   label: 'Departments', suffix: '' },
  { value: 300,  label: 'Recruiting Partners', suffix: '+' },
  { value: 12,   label: 'Schools', suffix: '' },
];

export default function LandingPage() {
  const heroRef = useRef(null);
  const { scrollY } = useScroll();
  const heroY        = useTransform(scrollY, [0, 500], [0, 80]);
  // Parallax for the photo-hero background
  const photoBgY     = useTransform(scrollY, [0, 600], [0, 120]);

  return (
    <div className="lp-root">
      <LandingNav />

      {/* ══════════════════════════════════════════════════════
          HERO — split: text left, 3D logo right
         ══════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="lp-hero" aria-label="Hero">
        {/* Layered background */}
        <div className="lp-hero__bg" aria-hidden="true">
          <div className="lp-hero__grain" />
          <div className="lp-hero__gradient" />
          <div className="lp-hero__glow-maroon" />
          <div className="lp-hero__glow-gold" />
        </div>

        <div className="lp-container lp-hero__inner">
          {/* ── Text column ── */}
          <motion.div
            className="lp-hero__text"
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="lp-eyebrow">
              <span className="lp-eyebrow__pip" aria-hidden="true" />
              University of Hyderabad · Placement Portal
            </div>

            <h1 className="lp-hero__h1">
              Where{' '}
              <em className="lp-hero__em">your degree</em>
              <br />
              meets your first<br className="sm:hidden" /> offer.
            </h1>

            <p className="lp-hero__sub">
              A centralised placement system for students, faculty coordinators, the
              Training &amp; Placement Office, and recruiters — built to the policy
              of the Placement Guidance and Advisory Bureau.
            </p>

            <motion.div
              className="lp-hero__cta-row"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45, duration: 0.7, ease: 'easeOut' }}
            >
              <Link to="/register">
                <button className="lp-btn-primary">
                  Create your account
                  <HiOutlineArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/login">
                <button className="lp-btn-ghost">
                  Sign in
                </button>
              </Link>
            </motion.div>

            <motion.p
              className="lp-hero__footnote"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.75, duration: 0.6 }}
            >
              Students sign up with their{' '}
              <code className="lp-code">@uohyd.ac.in</code> email.
              Companies register with any official email and await TPO approval.
            </motion.p>
          </motion.div>

          {/* ── 3D Logo stage ── */}
          <motion.div
            className="lp-hero__canvas-wrap"
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.08 }}
            style={{ y: heroY }}
          >
            <div className="lp-hero__canvas-glow" aria-hidden="true" />
            <UoH3DLogo className="lp-hero__canvas" />
            <motion.p
              className="lp-motto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8 }}
            >
              सा विद्या या विमुच्यते
            </motion.p>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="lp-hero__scroll-hint"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4, duration: 0.6 }}
          aria-hidden="true"
        >
          <div className="lp-scroll-track">
            <motion.div
              className="lp-scroll-dot"
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
            />
          </div>
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════
          PHOTO HERO — full-bleed cinematic photo banner
          Uses sunset-reflection as immersive section divider
         ══════════════════════════════════════════════════════ */}
      <section className="lp-photo-hero" aria-hidden="true">
        <motion.div
          className="lp-photo-hero__bg"
          style={{ y: photoBgY }}
        >
          <img
            src="/campus/sunset-reflection.jpg"
            alt=""
            className="lp-photo-hero__img"
            loading="eager"
            decoding="async"
          />
        </motion.div>
        {/* Multi-layer overlay for readability */}
        <div className="lp-photo-hero__overlay" />
        <div className="lp-photo-hero__inner">
          <Reveal direction="none">
            <p className="lp-photo-hero__quote">
              "The University of Hyderabad campus — where knowledge
              meets nature, and careers begin."
            </p>
            <p className="lp-photo-hero__attr">
              5,000 acres · Hyderabad, Telangana
            </p>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          STATS STRIP
         ══════════════════════════════════════════════════════ */}
      <section className="lp-stats" aria-label="At a glance">
        <div className="lp-container">
          <Reveal>
            <p className="lp-overline lp-stats__label">At a glance</p>
          </Reveal>
          <div className="lp-stats__grid">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.09}>
                <AnimatedStat value={s.value} label={s.label} suffix={s.suffix} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          HOW IT WORKS
         ══════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="lp-how" aria-labelledby="how-heading">
        <div className="lp-container">
          <div className="lp-section-header">
            <Reveal>
              <div className="lp-rule" />
              <h2 id="how-heading" className="lp-section-h2">
                Three steps to your first application
              </h2>
              <p className="lp-section-sub">
                The PMS enforces the PGAB workflow by design — so no application is
                submitted without the declarations and checks the University requires.
              </p>
            </Reveal>
          </div>

          <div className="lp-steps">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.title} delay={i * 0.14}>
                  <article className="lp-step-card">
                    <div className="lp-step-card__top-bar" />
                    <div className="lp-step-card__inner">
                      <div className="lp-step-card__header">
                        <div className="lp-step-icon">
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className="lp-step-num">0{i + 1}</span>
                      </div>
                      <h3 className="lp-step-card__h3">{step.title}</h3>
                      <p className="lp-step-card__body">{step.body}</p>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CAMPUS GALLERY — photo mosaic
         ══════════════════════════════════════════════════════ */}
      <CampusGallery />

      {/* ══════════════════════════════════════════════════════
          ANNOUNCEMENTS
         ══════════════════════════════════════════════════════ */}
      <section id="announcements" className="lp-announce" aria-labelledby="announce-heading">
        <div className="lp-container">
          <div className="lp-announce__head">
            <Reveal>
              <div className="lp-rule" />
              <h2 id="announce-heading" className="lp-section-h2">
                Recent announcements
              </h2>
              <p className="lp-section-sub lp-announce__sub">
                Placement drives, policy updates, events and reports from the PGAB
                and participating Schools.
              </p>
            </Reveal>
            <Reveal direction="left">
              <a
                href="https://uohyd.ac.in/events/"
                target="_blank"
                rel="noopener noreferrer"
                className="lp-view-all"
              >
                View all
                <HiOutlineExternalLink className="w-4 h-4" />
              </a>
            </Reveal>
          </div>

          <div className="lp-announce__grid">
            {announcements.map((a, i) => (
              <Reveal key={a.id} delay={i * 0.07}>
                <AnnouncementCard announcement={a} />
              </Reveal>
            ))}
          </div>

          {/* I-SURE callout */}
          <Reveal delay={0.18}>
            <div className="lp-isure">
              <div className="lp-isure__inner">
                <div>
                  <p className="lp-isure__label">Featured Programme</p>
                  <h3 className="lp-isure__h3">I-SURE 2026 — SCIS Internships</h3>
                  <p className="lp-isure__body">
                    Applications now open for the SCIS Internship, Skill Upgradation and
                    Research Enhancement programme at the School of Computer &amp;
                    Information Sciences.
                  </p>
                </div>
                <a
                  href="https://scis.uohyd.ac.in/isure/index.php"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="lp-isure__btn"
                >
                  Apply on SCIS
                  <HiOutlineExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          CTA — photo-backed dark section
         ══════════════════════════════════════════════════════ */}
      <section className="lp-cta" aria-label="Register call to action">
        {/* Campus photo background with heavy maroon overlay */}
        <div className="lp-cta__photo-bg" aria-hidden="true">
          <img
            src="/campus/deer-golden.jpg"
            alt=""
            className="lp-cta__photo-img"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="lp-cta__overlay" aria-hidden="true" />
        <div className="lp-cta__grain" aria-hidden="true" />
        <div className="lp-cta__halo" aria-hidden="true" />

        <div className="lp-container lp-cta__inner">
          <Reveal>
            <p className="lp-cta__eyebrow">Placement season 2026–27 is open</p>
            <h2 className="lp-cta__h2">Ready to begin?</h2>
            <p className="lp-cta__sub">
              Create your account in under five minutes. The system verifies your
              university email and walks you through the PGAB declaration.
            </p>
            <div className="lp-cta__btns">
              <Link to="/register">
                <button className="lp-cta-btn-primary">
                  Register now
                  <HiOutlineArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link to="/login">
                <button className="lp-cta-btn-ghost">
                  I already have an account
                </button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════
          FOOTER
         ══════════════════════════════════════════════════════ */}
      <footer id="contact" className="lp-footer" aria-label="Footer">
        <div className="lp-container lp-footer__grid">
          {/* Brand */}
          <div className="lp-footer__brand">
            <Logo variant="full" size="md" theme="light" />
            <p className="lp-footer__brand-desc">
              The official placement management portal of the University of Hyderabad,
              operated under the Placement Guidance and Advisory Bureau (PGAB).
            </p>
            <p className="lp-footer__motto">सा विद्या या विमुच्यते</p>
          </div>

          {/* Quick links */}
          <div>
            <p className="lp-footer__col-label">Quick links</p>
            <ul className="lp-footer__links">
              {[
                ['#announcements', 'Announcements'],
                ['#how-it-works',  'How it works'],
                ['/register',      'Register'],
                ['/login',         'Sign in'],
              ].map(([href, label]) => (
                <li key={href}>
                  {href.startsWith('#') ? (
                    <a href={href} className="lp-footer__link">{label}</a>
                  ) : (
                    <Link to={href} className="lp-footer__link">{label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* External */}
          <div>
            <p className="lp-footer__col-label">External</p>
            <ul className="lp-footer__links">
              {[
                ['https://uohyd.ac.in/events/', 'UoH Events'],
                ['https://scis.uohyd.ac.in/isure/index.php', 'I-SURE SCIS'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lp-footer__link lp-footer__link--ext"
                  >
                    {label}
                    <HiOutlineExternalLink className="w-3.5 h-3.5 opacity-50" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <p className="lp-footer__col-label">PGAB Office</p>
            <ul className="lp-footer__contact">
              <li>
                <HiOutlineLocationMarker className="lp-footer__icon" />
                <span>
                  Administrative Building, University of Hyderabad,
                  Prof. C.R. Rao Road, Gachibowli,
                  Hyderabad 500046, Telangana
                </span>
              </li>
              <li>
                <HiOutlineMail className="lp-footer__icon" />
                <a href="mailto:placementuoh@gmail.com" className="lp-footer__link">
                  placementuoh@gmail.com
                </a>
              </li>
              <li>
                <HiOutlinePhone className="lp-footer__icon" />
                <span>040-23132140</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="lp-container lp-footer__bottom">
          <p>© 2026 University of Hyderabad · Placement Guidance and Advisory Bureau</p>
          <p className="lp-footer__build">PMS v2.0 · Team 22MCCE13 &amp; 22MCCE16</p>
        </div>
      </footer>
    </div>
  );
}
