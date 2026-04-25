import { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'motion/react';

/**
 * AnimatedStat — count-up stat card.
 *
 * Props:
 *   value:    final number to animate to (integer)
 *   label:    e.g. 'Students'
 *   suffix:   e.g. '+', 'LPA', '%'  (default '+')
 *   duration: seconds (default 2)
 */
export default function AnimatedStat({ value, label, suffix = '+', duration = 2 }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => setDisplay(Math.floor(v)),
    });
    return () => controls.stop();
  }, [inView, value, duration]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="text-left"
    >
      <p className="font-display text-5xl md:text-6xl font-semibold text-maroon-600 tabular-nums leading-none">
        {display.toLocaleString('en-IN')}
        <span className="text-gold-500">{suffix}</span>
      </p>
      <p className="mt-3 text-sm uppercase tracking-[0.18em] text-ink-400">
        {label}
      </p>
    </motion.div>
  );
}
