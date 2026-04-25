import clsx from 'clsx';
import uohLogo from '../../assets/uoh-logo.png';

const SIZES = {
  sm: { mark: 'w-8 h-8',   text: 'text-sm' },
  md: { mark: 'w-12 h-12', text: 'text-base' },
  lg: { mark: 'w-20 h-20', text: 'text-lg' },
};

export default function Logo({ variant = 'full', theme = 'dark', size = 'md', className = '' }) {
  const { mark, text } = SIZES[size] || SIZES.md;
  const textCls  = theme === 'light' ? 'text-white' : 'text-ink-800';
  // When theme is light, invert the maroon logo to white as a stopgap until a proper white asset is available
  const filterCls = theme === 'light' ? 'brightness-0 invert' : '';

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      <img
        src={uohLogo}
        alt="University of Hyderabad"
        className={clsx('object-contain drop-shadow-sm', mark, filterCls)}
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
