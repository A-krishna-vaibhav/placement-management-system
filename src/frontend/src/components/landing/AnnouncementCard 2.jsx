import { motion } from 'motion/react';
import { HiOutlineArrowRight } from 'react-icons/hi';
import { formatAnnouncementDate } from '../../data/announcements';

const CATEGORY_COLORS = {
  Events:      'badge-maroon',
  Placements:  'badge-success',
  Internships: 'badge-warning',
  Reports:     'badge-neutral',
  Policy:      'badge-neutral',
};

/**
 * AnnouncementCard — replicates the SCIS news-card pattern but with
 * better typography, real categorisation, and hover feedback.
 */
export default function AnnouncementCard({ announcement }) {
  const { title, summary, date, category, imageAlt } = announcement;
  const badgeClass = CATEGORY_COLORS[category] || 'badge-neutral';

  return (
    <motion.article
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="group card overflow-hidden flex flex-col h-full cursor-pointer"
    >
      {/* Decorative image placeholder — abstract maroon → gold gradient */}
      <div
        className="h-48 w-full bg-gradient-to-br from-maroon-100 via-maroon-50 to-gold-100 relative overflow-hidden"
        role="img"
        aria-label={imageAlt}
      >
        <CardDecoration seed={title.length} />
      </div>

      <div className="card-body flex-1 flex flex-col">
        <div className="flex items-center gap-2 mb-3">
          <span className={badgeClass}>{category}</span>
          <time dateTime={date} className="text-xs text-ink-400">
            {formatAnnouncementDate(date)}
          </time>
        </div>

        <h3 className="font-display text-xl font-semibold text-ink-800 leading-snug mb-2 text-balance">
          {title}
        </h3>

        <p className="text-sm text-ink-500 leading-relaxed flex-1">
          {summary}
        </p>

        <div className="mt-4 flex items-center gap-1.5 text-sm font-medium text-maroon-600 group-hover:text-maroon-700 group-hover:gap-2.5 transition-all">
          Read more
          <HiOutlineArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>
    </motion.article>
  );
}

/**
 * CardDecoration — simple SVG patterns so each card has visual variety
 * without needing real images. Seeded by an integer for determinism.
 */
function CardDecoration({ seed }) {
  const variant = seed % 4;

  if (variant === 0) {
    return (
      <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full">
        {[40, 80, 120, 160, 200].map((r, i) => (
          <circle key={i} cx="340" cy="100" r={r} fill="none" stroke="#8B2838" strokeWidth="1" opacity={0.22 - i * 0.03} />
        ))}
      </svg>
    );
  }
  if (variant === 1) {
    return (
      <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full">
        {Array.from({ length: 16 }).map((_, i) => (
          <line key={i} x1={i * 30} y1="0" x2={i * 30 + 100} y2="200" stroke="#8B2838" strokeWidth="1" opacity="0.12" />
        ))}
      </svg>
    );
  }
  if (variant === 2) {
    return (
      <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full">
        {Array.from({ length: 60 }).map((_, i) => {
          const x = (i % 10) * 44 + 20;
          const y = Math.floor(i / 10) * 34 + 20;
          const r = 2 + ((i * 3) % 4);
          return <circle key={i} cx={x} cy={y} r={r} fill="#8B2838" opacity={0.18} />;
        })}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 400 200" className="absolute inset-0 w-full h-full">
      {Array.from({ length: 8 }).map((_, i) => {
        const x = i * 55 + 10;
        const y = 40 + (i % 2) * 80;
        return (
          <polygon
            key={i}
            points={`${x},${y} ${x + 28},${y} ${x + 14},${y - 24}`}
            fill="#B8941F"
            opacity="0.22"
          />
        );
      })}
    </svg>
  );
}
