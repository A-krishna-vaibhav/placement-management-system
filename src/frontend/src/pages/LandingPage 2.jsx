import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineArrowRight,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineLocationMarker,
} from 'react-icons/hi';

import { Button, Logo } from '../components/ui';
import LandingNav       from '../components/landing/LandingNav';
import HeroArtwork      from '../components/landing/HeroArtwork';
import AnimatedStat     from '../components/landing/AnimatedStat';
import AnnouncementCard from '../components/landing/AnnouncementCard';
import Reveal           from '../components/landing/Reveal';

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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-cream-100">
      <LandingNav />

      {/* ============ HERO ============ */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 overflow-hidden bg-paper-texture">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Headline column */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
              className="lg:col-span-7"
            >
              <div className="uoh-bar mb-6"></div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-maroon-600 mb-4">
                University of Hyderabad · Placement Portal
              </p>
              <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-semibold text-ink-800 leading-[1.05] tracking-tight text-balance">
                Where <span className="italic text-maroon-600">your degree</span> meets
                <br />your first offer.
              </h1>
              <p className="mt-6 text-lg md:text-xl text-ink-600 leading-relaxed max-w-2xl text-pretty">
                A centralised placement system for students, faculty coordinators, the Training
                &amp; Placement Office, and recruiters — built to the policy of the
                Placement Guidance and Advisory Bureau.
              </p>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="mt-10 flex flex-wrap items-center gap-4"
              >
                <Link to="/register">
                  <Button variant="primary" size="lg" iconRight={<HiOutlineArrowRight className="w-4 h-4" />}>
                    Create your account
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" size="lg">
                    Sign in
                  </Button>
                </Link>
              </motion.div>

              <p className="mt-6 text-xs text-ink-400">
                Students sign up with their <span className="font-medium text-ink-600">@uohyd.ac.in</span> email.
                Companies register with any official email, then await TPO approval.
              </p>
            </motion.div>

            {/* Artwork column */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="lg:col-span-5"
            >
              <HeroArtwork className="w-full max-w-md mx-auto" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* ============ STATS STRIP ============ */}
      <section className="py-16 lg:py-20 bg-cream-50 border-y border-ink-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-ink-400 mb-10 text-center">
              At a glance
            </p>
          </Reveal>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8">
            <AnimatedStat value={5000} label="Students" />
            <AnimatedStat value={42}   label="Departments" suffix="" />
            <AnimatedStat value={300}  label="Recruiters" />
            <AnimatedStat value={12}   label="Schools" suffix="" />
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="max-w-2xl mb-14">
            <Reveal>
              <div className="uoh-bar mb-4"></div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink-800 tracking-tight">
                Three steps to your first application
              </h2>
              <p className="mt-4 text-lg text-ink-500 leading-relaxed">
                The PMS enforces the PGAB workflow by design — so no application is submitted
                without the declarations and checks the University requires.
              </p>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              return (
                <Reveal key={step.title} delay={i * 0.12}>
                  <div className="card h-full">
                    <div className="card-body">
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-12 h-12 rounded-lg bg-maroon-50 text-maroon-600 flex items-center justify-center">
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="font-display text-3xl font-semibold text-ink-200 tabular-nums">
                          0{i + 1}
                        </span>
                      </div>
                      <h3 className="font-display text-xl font-semibold text-ink-800 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-ink-500 leading-relaxed">
                        {step.body}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ ANNOUNCEMENTS ============ */}
      <section id="announcements" className="py-20 lg:py-28 bg-cream-200/40 border-y border-ink-100">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="flex items-end justify-between mb-12 gap-6 flex-wrap">
            <Reveal>
              <div className="uoh-bar mb-4"></div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold text-ink-800 tracking-tight">
                Recent announcements
              </h2>
              <p className="mt-3 text-lg text-ink-500 leading-relaxed max-w-2xl">
                Placement drives, policy updates, events and reports from the PGAB and
                participating Schools.
              </p>
            </Reveal>
            <Reveal direction="left">
              <a href="#" className="text-sm font-medium text-maroon-600 hover:text-maroon-700 flex items-center gap-1.5 group">
                View all
                <HiOutlineArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
              </a>
            </Reveal>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {announcements.map((a, i) => (
              <Reveal key={a.id} delay={i * 0.08}>
                <AnnouncementCard announcement={a} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FINAL CTA ============ */}
      <section className="relative py-24 lg:py-32 bg-maroon-deep overflow-hidden">
        {/* Gold halo */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-4xl mx-auto px-6 lg:px-10 relative text-center">
          <Reveal>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold-300 mb-4">
              Placement season 2026–27 is open
            </p>
            <h2 className="font-display text-4xl md:text-5xl lg:text-6xl font-semibold text-white leading-tight tracking-tight text-balance">
              Ready to begin?
            </h2>
            <p className="mt-6 text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl mx-auto text-pretty">
              Create your account in under five minutes. The system verifies your
              university email and walks you through the PGAB declaration.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button
                  variant="primary"
                  size="lg"
                  iconRight={<HiOutlineArrowRight className="w-4 h-4" />}
                  className="!bg-white !text-maroon-700 hover:!bg-cream-100"
                >
                  Register now
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  variant="secondary"
                  size="lg"
                  className="!bg-white/10 !text-white !border-white/20 hover:!bg-white/20"
                >
                  I already have an account
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer id="contact" className="bg-ink-900 text-ink-200">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16">
          <div className="grid md:grid-cols-12 gap-10">
            {/* Brand column */}
            <div className="md:col-span-4">
              <Logo variant="full" size="md" theme="light" />
              <p className="mt-5 text-sm text-ink-300 leading-relaxed max-w-xs">
                The official placement management portal of the University of Hyderabad,
                operated under the Placement Guidance and Advisory Bureau (PGAB).
              </p>
              <p className="mt-4 font-display italic text-gold-300 text-sm">
                सा विद्या या विमुच्यते
              </p>
            </div>

            {/* Quick links */}
            <div className="md:col-span-3">
              <p className="text-xs uppercase tracking-[0.18em] text-gold-400 mb-4 font-medium">
                Quick links
              </p>
              <ul className="space-y-2.5 text-sm">
                {[
                  ['#announcements', 'Announcements'],
                  ['#how-it-works',  'How it works'],
                  ['/register',      'Register'],
                  ['/login',         'Sign in'],
                ].map(([href, label]) => (
                  <li key={href}>
                    {href.startsWith('#') ? (
                      <a href={href} className="text-ink-300 hover:text-white transition-colors">
                        {label}
                      </a>
                    ) : (
                      <Link to={href} className="text-ink-300 hover:text-white transition-colors">
                        {label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div className="md:col-span-5">
              <p className="text-xs uppercase tracking-[0.18em] text-gold-400 mb-4 font-medium">
                Placement Guidance and Advisory Bureau
              </p>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <HiOutlineLocationMarker className="w-5 h-5 flex-shrink-0 mt-0.5 text-gold-400" />
                  <span className="text-ink-300">
                    Administrative Building, University of Hyderabad,<br />
                    Prof. C.R. Rao Road, Gachibowli,<br />
                    Hyderabad 500046, Telangana
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <HiOutlineMail className="w-5 h-5 flex-shrink-0 text-gold-400" />
                  <a href="mailto:placementuoh@gmail.com" className="text-ink-300 hover:text-white">
                    placementuoh@gmail.com
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <HiOutlinePhone className="w-5 h-5 flex-shrink-0 text-gold-400" />
                  <span className="text-ink-300">040-23132140</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-ink-800 flex flex-wrap items-center justify-between gap-4 text-xs text-ink-400">
            <p>© 2026 University of Hyderabad · Placement Guidance and Advisory Bureau</p>
            <p className="font-mono">PMS v2.0 · Built by Team 22MCCE13 &amp; 22MCCE16</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
