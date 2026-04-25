/**
 * HeroArtwork — an abstract motif derived from the UoH emblem elements:
 * an atomic orbit, an open book, and a lightning strike, arranged in a
 * 3-panel composition. Each element animates on mount via Motion.
 *
 * Designed to sit in the right column of the hero, approximately 480×480.
 */

import { motion } from 'motion/react';

export default function HeroArtwork({ className = '' }) {
  return (
    <motion.svg
      viewBox="0 0 480 480"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="University of Hyderabad emblem motif — atom, book, and lightning, representing knowledge, learning, and potential"
      className={className}
      initial="hidden"
      animate="visible"
    >
      {/* ======= Background ambient ring ======= */}
      <motion.circle
        cx="240" cy="240" r="200"
        fill="none"
        stroke="#ECE2CD"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        variants={{
          hidden:  { opacity: 0, rotate: -20 },
          visible: { opacity: 1, rotate: 0, transition: { duration: 1.2, ease: 'easeOut' } },
        }}
        style={{ transformOrigin: '240px 240px' }}
      />

      {/* ======= Atom (top-left) ======= */}
      <motion.g
        variants={{
          hidden:  { opacity: 0, y: -12 },
          visible: { opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.7 } },
        }}
      >
        {/* orbit 1 */}
        <motion.ellipse
          cx="160" cy="160" rx="72" ry="28"
          fill="none" stroke="#8B2838" strokeWidth="2"
          style={{ transformOrigin: '160px 160px' }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
        />
        {/* orbit 2 */}
        <motion.ellipse
          cx="160" cy="160" rx="72" ry="28"
          fill="none" stroke="#8B2838" strokeWidth="2"
          style={{ transformOrigin: '160px 160px', transform: 'rotate(60deg)' }}
          animate={{ rotate: [60, 420] }}
          transition={{ repeat: Infinity, duration: 22, ease: 'linear' }}
        />
        {/* orbit 3 */}
        <motion.ellipse
          cx="160" cy="160" rx="72" ry="28"
          fill="none" stroke="#8B2838" strokeWidth="2"
          style={{ transformOrigin: '160px 160px', transform: 'rotate(-60deg)' }}
          animate={{ rotate: [-60, 300] }}
          transition={{ repeat: Infinity, duration: 26, ease: 'linear' }}
        />
        {/* nucleus */}
        <circle cx="160" cy="160" r="8" fill="#B8941F" />
        {/* electron dot */}
        <motion.circle
          cx={232} cy={160} r="4" fill="#8B2838"
          animate={{
            cx: [232, 160, 88, 160, 232],
            cy: [160, 182, 160, 138, 160],
          }}
          transition={{ repeat: Infinity, duration: 6, ease: 'linear' }}
        />
      </motion.g>

      {/* ======= Open book (bottom-left) ======= */}
      <motion.g
        variants={{
          hidden:  { opacity: 0, y: 12 },
          visible: { opacity: 1, y: 0, transition: { delay: 0.45, duration: 0.7 } },
        }}
      >
        {/* left page */}
        <path
          d="M 100 340 Q 140 320 170 340 L 170 405 Q 140 385 100 405 Z"
          fill="#FAF7F2" stroke="#8B2838" strokeWidth="2" strokeLinejoin="round"
        />
        {/* right page */}
        <path
          d="M 170 340 Q 200 320 240 340 L 240 405 Q 200 385 170 405 Z"
          fill="#FAF7F2" stroke="#8B2838" strokeWidth="2" strokeLinejoin="round"
        />
        {/* spine */}
        <line x1="170" y1="340" x2="170" y2="405" stroke="#8B2838" strokeWidth="2" />
        {/* page rules */}
        <line x1="115" y1="358" x2="155" y2="354" stroke="#D48594" strokeWidth="1.2" />
        <line x1="115" y1="372" x2="155" y2="368" stroke="#D48594" strokeWidth="1.2" />
        <line x1="115" y1="386" x2="155" y2="382" stroke="#D48594" strokeWidth="1.2" />
        <line x1="185" y1="354" x2="225" y2="358" stroke="#D48594" strokeWidth="1.2" />
        <line x1="185" y1="368" x2="225" y2="372" stroke="#D48594" strokeWidth="1.2" />
        <line x1="185" y1="382" x2="225" y2="386" stroke="#D48594" strokeWidth="1.2" />
      </motion.g>

      {/* ======= Lightning bolt (right) ======= */}
      <motion.path
        d="M 340 100 L 300 200 L 340 200 L 300 340 L 380 200 L 340 200 L 380 100 Z"
        fill="#B8941F"
        stroke="#8B2838"
        strokeWidth="2"
        strokeLinejoin="round"
        variants={{
          hidden:  { opacity: 0, scale: 0.8, rotate: -8 },
          visible: {
            opacity: 1, scale: 1, rotate: 0,
            transition: { delay: 0.7, duration: 0.9, type: 'spring', stiffness: 120 },
          },
        }}
        style={{ transformOrigin: '340px 200px' }}
      />

      {/* ======= Sanskrit motto along the bottom arc ======= */}
      <motion.g
        variants={{
          hidden:  { opacity: 0 },
          visible: { opacity: 1, transition: { delay: 1.0, duration: 0.8 } },
        }}
      >
        <defs>
          <path id="motto-arc" d="M 80 420 Q 240 470 400 420" fill="none" />
        </defs>
        <text
          fill="#8B2838"
          fontFamily="Fraunces, serif"
          fontSize="18"
          fontStyle="italic"
          letterSpacing="2"
        >
          <textPath href="#motto-arc" startOffset="50%" textAnchor="middle">
            सा विद्या या विमुच्यते
          </textPath>
        </text>
      </motion.g>

      {/* ======= Subtle grain dots ======= */}
      <motion.g
        variants={{
          hidden:  { opacity: 0 },
          visible: { opacity: 0.4, transition: { delay: 1.2, duration: 1.2 } },
        }}
      >
        {Array.from({ length: 40 }).map((_, i) => {
          const seed = i * 13.37;
          const x = ((Math.sin(seed) + 1) / 2) * 480;
          const y = ((Math.cos(seed * 1.7) + 1) / 2) * 480;
          const r = 0.8 + ((i * 7) % 10) / 20;
          return <circle key={i} cx={x} cy={y} r={r} fill="#8B2838" />;
        })}
      </motion.g>
    </motion.svg>
  );
}
