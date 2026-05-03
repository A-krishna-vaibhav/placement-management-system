/**
 * HeroArtwork — fully animated 3-D UoH emblem motif.
 * Atom (top-left), open book (bottom-left), lightning bolt (right).
 * Orbits spin in 3-D perspective; nucleus pulses; book pages flutter;
 * bolt has a live glow. Sanskrit motto arcs along the bottom.
 */

import { motion } from 'motion/react';

export default function HeroArtwork({ className = '' }) {
  return (
    <motion.svg
      viewBox="0 0 480 480"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="University of Hyderabad emblem motif"
      className={className}
      initial="hidden"
      animate="visible"
      style={{ overflow: 'visible' }}
    >
      <defs>
        {/* Radial glow for nucleus */}
        <radialGradient id="nucleusGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#D4A820" stopOpacity="1" />
          <stop offset="60%"  stopColor="#B8941F" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#8B6B10" stopOpacity="0.4" />
        </radialGradient>

        {/* Glow filter for bolt */}
        <filter id="boltGlow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Soft shadow for book */}
        <filter id="bookShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#8B2838" floodOpacity="0.15" />
        </filter>

        {/* Gold gradient for bolt */}
        <linearGradient id="boltGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%"   stopColor="#D4A820" />
          <stop offset="50%"  stopColor="#B8941F" />
          <stop offset="100%" stopColor="#7D6313" />
        </linearGradient>

        {/* Clipping for motto arc path */}
        <path id="motto-arc" d="M 70 430 Q 240 485 410 430" fill="none" />
      </defs>

      {/* ── Ambient outer ring ── */}
      <motion.circle
        cx="240" cy="240" r="208"
        fill="none"
        stroke="#8B2838"
        strokeWidth="1"
        strokeDasharray="3 8"
        strokeOpacity="0.18"
        variants={{
          hidden:  { opacity: 0, rotate: -30 },
          visible: { opacity: 1, rotate: 0, transition: { duration: 1.4, ease: 'easeOut' } },
        }}
        style={{ transformOrigin: '240px 240px' }}
      />
      <motion.circle
        cx="240" cy="240" r="180"
        fill="none"
        stroke="#C9A227"
        strokeWidth="0.6"
        strokeDasharray="2 12"
        strokeOpacity="0.12"
        variants={{
          hidden:  { opacity: 0 },
          visible: { opacity: 1, transition: { delay: 0.3, duration: 1.2 } },
        }}
      />

      {/* ══════════════════════════════════════════
          ATOM — top-left  (3-D perspective orbits)
         ══════════════════════════════════════════ */}
      <motion.g
        variants={{
          hidden:  { opacity: 0, y: -16 },
          visible: { opacity: 1, y: 0, transition: { delay: 0.15, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] } },
        }}
      >
        {/* Orbit plane 1 — equatorial */}
        <motion.ellipse
          cx="155" cy="155" rx="75" ry="28"
          fill="none" stroke="#8B2838" strokeWidth="2" strokeOpacity="0.85"
          style={{ transformOrigin: '155px 155px' }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 16, ease: 'linear' }}
        />
        {/* Orbit plane 2 — tilted 60° */}
        <motion.ellipse
          cx="155" cy="155" rx="75" ry="28"
          fill="none" stroke="#8B2838" strokeWidth="2" strokeOpacity="0.7"
          style={{ transformOrigin: '155px 155px' }}
          animate={{ rotate: [60, 420] }}
          transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
        />
        {/* Orbit plane 3 — tilted -60° */}
        <motion.ellipse
          cx="155" cy="155" rx="75" ry="28"
          fill="none" stroke="#8B2838" strokeWidth="2" strokeOpacity="0.55"
          style={{ transformOrigin: '155px 155px' }}
          animate={{ rotate: [-60, 300] }}
          transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
        />

        {/* Nucleus — pulsing gold orb */}
        <motion.circle
          cx="155" cy="155" r="10"
          fill="url(#nucleusGlow)"
          animate={{ r: [9, 11.5, 9], opacity: [0.9, 1, 0.9] }}
          transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
        />
        {/* Nucleus inner highlight */}
        <circle cx="151" cy="151" r="3.5" fill="white" opacity="0.35" />

        {/* Electron 1 — orbit 1 */}
        <motion.circle
          r="4.5" fill="#8B2838"
          animate={{
            cx: [230, 155, 80, 155, 230],
            cy: [155, 178, 155, 132, 155],
          }}
          transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
        />
        {/* Electron 2 — orbit 2 (offset phase) */}
        <motion.circle
          r="3.5" fill="#C35365" opacity="0.8"
          animate={{
            cx: [80, 155, 230, 155, 80],
            cy: [155, 132, 155, 178, 155],
          }}
          transition={{ repeat: Infinity, duration: 5.5, ease: 'linear' }}
        />
        {/* Electron 3 — orbit 3 */}
        <motion.circle
          r="3" fill="#EDB5C0" opacity="0.6"
          animate={{
            cx: [155, 230, 155, 80, 155],
            cy: [132, 155, 178, 155, 132],
          }}
          transition={{ repeat: Infinity, duration: 7, ease: 'linear' }}
        />
      </motion.g>

      {/* ══════════════════════════════════════════
          OPEN BOOK — bottom-left
         ══════════════════════════════════════════ */}
      <motion.g
        filter="url(#bookShadow)"
        variants={{
          hidden:  { opacity: 0, y: 16 },
          visible: { opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] } },
        }}
      >
        {/* Left page */}
        <motion.path
          d="M 92 338 Q 135 316 170 338 L 170 408 Q 135 388 92 408 Z"
          fill="#FAF7F2" stroke="#8B2838" strokeWidth="2" strokeLinejoin="round"
          animate={{ d: [
            'M 92 338 Q 135 316 170 338 L 170 408 Q 135 388 92 408 Z',
            'M 92 338 Q 135 312 170 338 L 170 408 Q 135 384 92 408 Z',
            'M 92 338 Q 135 316 170 338 L 170 408 Q 135 388 92 408 Z',
          ]}}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', times: [0, 0.5, 1] }}
        />
        {/* Right page */}
        <motion.path
          d="M 170 338 Q 205 316 245 338 L 245 408 Q 205 388 170 408 Z"
          fill="#FAF7F2" stroke="#8B2838" strokeWidth="2" strokeLinejoin="round"
          animate={{ d: [
            'M 170 338 Q 205 316 245 338 L 245 408 Q 205 388 170 408 Z',
            'M 170 338 Q 205 312 248 337 L 248 408 Q 205 384 170 408 Z',
            'M 170 338 Q 205 316 245 338 L 245 408 Q 205 388 170 408 Z',
          ]}}
          transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut', delay: 0.3, times: [0, 0.5, 1] }}
        />
        {/* Spine */}
        <line x1="170" y1="338" x2="170" y2="408" stroke="#8B2838" strokeWidth="2" />
        {/* Left page rules */}
        <line x1="108" y1="357" x2="152" y2="352" stroke="#D48594" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="108" y1="371" x2="152" y2="366" stroke="#D48594" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="108" y1="385" x2="152" y2="380" stroke="#D48594" strokeWidth="1.3" strokeLinecap="round" />
        {/* Right page rules */}
        <line x1="187" y1="352" x2="230" y2="357" stroke="#D48594" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="187" y1="366" x2="230" y2="371" stroke="#D48594" strokeWidth="1.3" strokeLinecap="round" />
        <line x1="187" y1="380" x2="230" y2="385" stroke="#D48594" strokeWidth="1.3" strokeLinecap="round" />
      </motion.g>

      {/* ══════════════════════════════════════════
          LIGHTNING BOLT — right  (with glow)
         ══════════════════════════════════════════ */}
      <motion.g
        variants={{
          hidden:  { opacity: 0, scale: 0.75, rotate: -12 },
          visible: {
            opacity: 1, scale: 1, rotate: 0,
            transition: { delay: 0.65, duration: 1, type: 'spring', stiffness: 110, damping: 14 },
          },
        }}
        style={{ transformOrigin: '345px 215px' }}
      >
        {/* Glow shadow behind bolt */}
        <motion.path
          d="M 345 96 L 302 202 L 345 202 L 298 348 L 392 202 L 348 202 L 392 96 Z"
          fill="#C9A227"
          opacity="0.18"
          filter="url(#boltGlow)"
          animate={{ opacity: [0.12, 0.28, 0.12] }}
          transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
        />
        {/* Bolt body */}
        <path
          d="M 345 96 L 302 202 L 345 202 L 298 348 L 392 202 L 348 202 L 392 96 Z"
          fill="url(#boltGrad)"
          stroke="#8B2838"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Bolt highlight streak */}
        <motion.path
          d="M 355 105 L 335 180 L 355 178"
          fill="none"
          stroke="white"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeOpacity="0.35"
          animate={{ strokeOpacity: [0.2, 0.5, 0.2] }}
          transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
        />
      </motion.g>

      {/* ══════════════════════════════════════════
          SANSKRIT MOTTO — bottom arc
         ══════════════════════════════════════════ */}
      <motion.g
        variants={{
          hidden:  { opacity: 0 },
          visible: { opacity: 1, transition: { delay: 1.05, duration: 1 } },
        }}
      >
        <text
          fill="#8B2838"
          fontFamily="Fraunces, Georgia, serif"
          fontSize="16"
          fontStyle="italic"
          letterSpacing="2.5"
        >
          <textPath href="#motto-arc" startOffset="50%" textAnchor="middle">
            सा विद्या या विमुच्यते
          </textPath>
        </text>
      </motion.g>

      {/* ══════════════════════════════════════════
          GRAIN DOTS — ambient texture
         ══════════════════════════════════════════ */}
      <motion.g
        variants={{
          hidden:  { opacity: 0 },
          visible: { opacity: 0.45, transition: { delay: 1.3, duration: 1.5 } },
        }}
      >
        {Array.from({ length: 48 }).map((_, i) => {
          const seed = i * 13.37;
          const x = ((Math.sin(seed) + 1) / 2) * 480;
          const y = ((Math.cos(seed * 1.7) + 1) / 2) * 480;
          const r = 0.7 + ((i * 7) % 10) / 18;
          return (
            <circle
              key={i}
              cx={x} cy={y} r={r}
              fill={i % 3 === 0 ? '#8B2838' : '#C9A227'}
            />
          );
        })}
      </motion.g>
    </motion.svg>
  );
}
