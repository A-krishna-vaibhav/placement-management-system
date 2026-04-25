import clsx from 'clsx';
import { forwardRef } from 'react';

const Input = forwardRef(function Input(
  { label, error, hint, icon = null, trailing = null, containerClassName = '', id, className = '', ...rest },
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
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'input-field',
            icon     && 'pl-10',
            trailing && 'pr-10',
            error    && 'input-error',
            className
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
        {trailing && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400">
            {trailing}
          </span>
        )}
      </div>
      {error && (
        <p id={`${inputId}-error`} className="form-error">
          <span aria-hidden="true">⚠ </span>{error}
        </p>
      )}
    </div>
  );
});

export default Input;
