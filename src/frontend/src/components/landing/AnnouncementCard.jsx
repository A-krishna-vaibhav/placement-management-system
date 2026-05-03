import { motion } from 'motion/react';
import { HiOutlineArrowRight } from 'react-icons/hi';
import { formatAnnouncementDate } from '../../data/announcements';

const CATEGORY_META = {
  Events:      { cls: 'badge-maroon',   link: 'https://uohyd.ac.in/events/' },
  Placements:  { cls: 'badge-success',  link: 'https://uohyd.ac.in/events/' },
  Internships: { cls: 'badge-warning',  link: 'https://scis.uohyd.ac.in/isure/index.php' },
  Reports:     { cls: 'badge-neutral',  link: 'https://uohyd.ac.in/events/' },
  Policy:      { cls: 'badge-neutral',  link: 'https://uohyd.ac.in/events/' },
};

export default function AnnouncementCard({ announcement }) {
  const { title, summary, date, category, imageAlt } = announcement;
  const meta = CATEGORY_META[category] || { cls: 'badge-neutral', link: 'https://uohyd.ac.in/events/' };

  return (
    <motion.a
      href={meta.link}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${title} — opens in a new tab`}
      whileHover={{ y: -5 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className="announcement-card group block"
    >
      {/* Decorative image band */}
      <div
        className="announcement-card__image"
        role="img"
        aria-label={imageAlt}
      >
        <CardDecoration seed={title.length} />
        {/* Gold bar accent on hover */}
        <div className="announcement-card__gold-bar" />
      </div>

      <div className="announcement-card__body">
        <div className="announcement-card__meta">
          <span className={meta.cls}>{category}</span>
          <time dateTime={date} className="text-xs text-ink-400 tabular-nums">
            {formatAnnouncementDate(date)}
          </time>
        </div>

        <h3 className="announcement-card__title">
          {title}
        </h3>

        <p className="announcement-card__summary">
          {summary}
        </p>

        <div className="announcement-card__cta">
          Read more
          <HiOutlineArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
        </div>
      </div>
    </motion.a>
  );
}

function CardDecoration({ seed }) {
  const variant = seed % 4;

  if (variant === 0) {
    return (
      <svg viewBox="0 0 400 192" className="absolute inset-0 w-full h-full">
        {[50, 95, 145, 195, 250].map((r, i) => (
          <circle key={i} cx="360" cy="96" r={r} fill="none" stroke="#8B2838"
            strokeWidth="1.2" opacity={0.22 - i * 0.03} />
        ))}
        <circle cx="360" cy="96" r="12" fill="#8B2838" opacity="0.12" />
      </svg>
    );
  }
  if (variant === 1) {
    return (
      <svg viewBox="0 0 400 192" className="absolute inset-0 w-full h-full">
        {Array.from({ length: 18 }).map((_, i) => (
          <line key={i} x1={i * 26 - 20} y1="0" x2={i * 26 + 80} y2="192"
            stroke="#8B2838" strokeWidth="1" opacity="0.11" />
        ))}
        {/* Gold accent diagonal */}
        <line x1="10" y1="0" x2="200" y2="192" stroke="#C9A227" strokeWidth="1.5" opacity="0.18" />
      </svg>
    );
  }
  if (variant === 2) {
    return (
      <svg viewBox="0 0 400 192" className="absolute inset-0 w-full h-full">
        {Array.from({ length: 60 }).map((_, i) => {
          const x = (i % 10) * 42 + 20;
          const y = Math.floor(i / 10) * 36 + 18;
          const r = 1.8 + ((i * 3) % 4);
          const isGold = i % 7 === 0;
          return (
            <circle key={i} cx={x} cy={y} r={r}
              fill={isGold ? '#C9A227' : '#8B2838'}
              opacity={isGold ? 0.22 : 0.15} />
          );
        })}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 400 192" className="absolute inset-0 w-full h-full">
      {Array.from({ length: 9 }).map((_, i) => {
        const x = i * 50 + 10;
        const y = 38 + (i % 2) * 80;
        return (
          <polygon key={i}
            points={`${x},${y} ${x + 30},${y} ${x + 15},${y - 26}`}
            fill={i % 3 === 0 ? '#C9A227' : '#8B2838'}
            opacity="0.2"
          />
        );
      })}
    </svg>
  );
}
