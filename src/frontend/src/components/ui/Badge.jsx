import clsx from 'clsx';

const STATUS_MAP = {
  ACTIVE:            { variant: 'success', label: 'Active' },
  UNVERIFIED:        { variant: 'warning', label: 'Awaiting verification' },
  PENDING_APPROVAL:  { variant: 'warning', label: 'Pending approval' },
  SUSPENDED:         { variant: 'danger',  label: 'Suspended' },
  DEACTIVATED:       { variant: 'neutral', label: 'Deactivated' },
  REJECTED:          { variant: 'danger',  label: 'Rejected' },
  OPEN:              { variant: 'success', label: 'Open' },
  CLOSED:            { variant: 'neutral', label: 'Closed' },
  APPLIED:           { variant: 'maroon',  label: 'Applied' },
  SHORTLISTED:       { variant: 'maroon',  label: 'Shortlisted' },
  SELECTED:          { variant: 'success', label: 'Selected' },
};

const VARIANT_CLASS = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  neutral: 'badge-neutral',
  maroon:  'badge-maroon',
};

export default function Badge({ status, variant, children, className = '' }) {
  if (status && STATUS_MAP[status]) {
    const { variant: v, label } = STATUS_MAP[status];
    return <span className={clsx(VARIANT_CLASS[v], className)}>{children || label}</span>;
  }
  return (
    <span className={clsx(VARIANT_CLASS[variant || 'neutral'], className)}>
      {children}
    </span>
  );
}
