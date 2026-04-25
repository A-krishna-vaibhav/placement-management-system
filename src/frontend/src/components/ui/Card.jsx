import clsx from 'clsx';

export default function Card({ variant = 'default', header, footer, className = '', children }) {
  return (
    <div className={clsx(variant === 'maroon' ? 'card-maroon' : 'card', className)}>
      {header && <div className="card-header">{header}</div>}
      <div className="card-body">{children}</div>
      {footer && <div className="card-header border-b-0 border-t">{footer}</div>}
    </div>
  );
}
