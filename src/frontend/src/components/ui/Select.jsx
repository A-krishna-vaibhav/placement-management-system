import clsx from 'clsx';
import { forwardRef } from 'react';

const Select = forwardRef(function Select(
  { label, error, hint, icon = null, placeholder = 'Select…', options = [], containerClassName = '', id, className = '', ...rest },
  ref
) {
  const inputId = id || rest.name;

  return (
    <div className={clsx('w-full', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="form-label">
          {label}
          {hint && <span className="form-hint ml-1.5">{hint}</span>}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
            {icon}
          </span>
        )}
        <select
          ref={ref}
          id={inputId}
          className={clsx(
            'input-field appearance-none pr-10 cursor-pointer',
            icon  && 'pl-10',
            error && 'input-error',
            className
          )}
          aria-invalid={!!error}
          {...rest}
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </div>
      {error && (
        <p className="form-error">
          <span aria-hidden="true">⚠ </span>{error}
        </p>
      )}
    </div>
  );
});

export default Select;
