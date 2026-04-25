import { motion, useInView } from 'motion/react';
import { useRef } from 'react';

/**
 * Reveal — wraps children and fades/slides them in when scrolled into view.
 *
 * Props:
 *   delay:     seconds (stagger children by incrementing delay)
 *   direction: 'up' (default) | 'left' | 'right' | 'none'
 *   className: passed through
 */
export default function Reveal({ children, delay = 0, direction = 'up', className = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  const offsets = {
    up:    { y: 24, x: 0 },
    left:  { x: 24, y: 0 },
    right: { x: -24, y: 0 },
    none:  { x: 0, y: 0 },
  };
  const initial = { opacity: 0, ...offsets[direction] };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : initial}
      transition={{ duration: 0.7, ease: [0.2, 0.8, 0.2, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
