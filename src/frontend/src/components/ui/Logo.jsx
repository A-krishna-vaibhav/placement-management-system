import clsx from 'clsx';
import uohLogo from '../../assets/uoh-logo.png';

const SIZES = {
  sm: { mark: 'w-8 h-8',   text: 'text-sm' },
  md: { mark: 'w-12 h-12', text: 'text-base' },
  lg: { mark: 'w-20 h-20', text: 'text-lg' },
};

export default function Logo({ variant = 'full', theme = 'dark', size = 'md', className = '' }) {
  const { mark, text } = SIZES[size] || SIZES.md;
  const textCls = theme === 'light' ? 'text-white' : 'text-ink-800';
  // On dark backgrounds keep the crest legible: drop-shadow lifts it from the bg.
  // No colour inversion — the official crest has its own maroon+white colouring.
  const imgCls  = theme === 'light'
    ? 'drop-shadow-[0_1px_4px_rgba(0,0,0,0.55)]'
    : 'drop-shadow-sm';

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <img
        src={uohLogo}
        alt="University of Hyderabad"
        className={clsx('object-contain', mark, imgCls)}
      />
      {variant === 'full' && (
        <div className={clsx('leading-tight', textCls)}>
          <div className={clsx('font-display font-semibold', text)}>University of Hyderabad</div>
          <div className="text-xs font-medium opacity-80 uppercase tracking-wider">Placement Portal</div>
        </div>
      )}
    </div>
  );
}
