/**
 * CampusGallery — photo mosaic strip showing UoH campus life.
 *
 * Layout (desktop): asymmetric 3-column grid
 *   Col 1 (wide): sunset-reflection.jpg  — full height, landscape cinematic
 *   Col 2 (narrow, stacked): deer-golden.jpg top + stork-water.jpg bottom
 *   Col 3 (wide): duck-lake.jpg          — full height, moody dusk
 *
 * On mobile: single vertical stack, all images equal width.
 *
 * Each image has a hover parallax via CSS transform, a dark scrim overlay
 * that lifts on hover, and a caption that fades in on hover.
 */
import { motion } from 'motion/react';
import Reveal from './Reveal';

const PHOTOS = [
  {
    src:     '/campus/sunset-reflection.jpg',
    alt:     'Sunset reflecting in a still lake on the UoH campus',
    caption: 'The lake at dusk',
    span:    'tall',   // occupies full column height on desktop
  },
  {
    src:     '/campus/deer-golden.jpg',
    alt:     'Spotted deer resting in golden-hour light at UoH',
    caption: 'Spotted deer — campus wildlife reserve',
    span:    'half-top',
  },
  {
    src:     '/campus/stork-water.jpg',
    alt:     'Painted stork wading through the campus lake',
    caption: 'Painted stork, campus wetlands',
    span:    'half-bottom',
  },
  {
    src:     '/campus/duck-lake.jpg',
    alt:     'Duck swimming across the UoH campus lake at twilight',
    caption: 'Twilight on the campus lake',
    span:    'tall',
  },
];

function GalleryPhoto({ src, alt, caption, delay = 0 }) {
  return (
    <Reveal delay={delay} className="lp-gallery__photo-wrap">
      <motion.div
        className="lp-gallery__photo"
        whileHover={{ scale: 1.028 }}
        transition={{ duration: 0.55, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="lp-gallery__img"
        />
        {/* Scrim — lifted on hover via CSS group */}
        <div className="lp-gallery__scrim" />
        {/* Caption */}
        <p className="lp-gallery__caption">{caption}</p>
      </motion.div>
    </Reveal>
  );
}

export default function CampusGallery() {
  return (
    <section className="lp-gallery" aria-label="Campus life photography">
      <div className="lp-container">
        <div className="lp-gallery__head">
          <Reveal>
            <p className="lp-overline">Campus life</p>
            <h2 className="lp-gallery__h2">
              A campus unlike any other
            </h2>
            <p className="lp-gallery__sub">
              5,000 acres of reserved forest, wetland lakes and wildlife corridors
              surround your academic journey at the University of Hyderabad.
            </p>
          </Reveal>
        </div>

        {/* Mosaic grid */}
        <div className="lp-gallery__grid">
          {/* Col 1 — tall left */}
          <div className="lp-gallery__col lp-gallery__col--tall">
            <GalleryPhoto {...PHOTOS[0]} delay={0} />
          </div>

          {/* Col 2 — stacked pair */}
          <div className="lp-gallery__col lp-gallery__col--stack">
            <GalleryPhoto {...PHOTOS[1]} delay={0.1} />
            <GalleryPhoto {...PHOTOS[2]} delay={0.18} />
          </div>

          {/* Col 3 — tall right */}
          <div className="lp-gallery__col lp-gallery__col--tall">
            <GalleryPhoto {...PHOTOS[3]} delay={0.08} />
          </div>
        </div>

        {/* Deer-in-forest — full-bleed cinematic banner */}
        <Reveal delay={0.12} className="lp-gallery__banner-wrap">
          <motion.div
            className="lp-gallery__banner"
            whileHover={{ scale: 1.015 }}
            transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
          >
            <img
              src="/campus/deer-forest.jpg"
              alt="Spotted deer glimpsed through dense forest foliage at UoH"
              loading="lazy"
              decoding="async"
              className="lp-gallery__banner-img"
            />
            <div className="lp-gallery__banner-scrim" />
            <div className="lp-gallery__banner-text">
              <p className="lp-gallery__banner-eyebrow">UoH Reserve Forest</p>
              <p className="lp-gallery__banner-caption">
                One of the few university campuses in India with a protected
                wildlife corridor — home to spotted deer, painted storks, and
                over 200 species of birds.
              </p>
            </div>
          </motion.div>
        </Reveal>
      </div>
    </section>
  );
}
