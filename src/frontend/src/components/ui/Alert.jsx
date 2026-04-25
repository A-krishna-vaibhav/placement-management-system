import clsx from 'clsx';
import { HiCheckCircle, HiExclamation, HiXCircle, HiInformationCircle } from 'react-icons/hi';

const VARIANTS = {
  success: { cls: 'alert-success', Icon: HiCheckCircle },
  warning: { cls: 'alert-warning', Icon: HiExclamation },
  danger:  { cls: 'alert-danger',  Icon: HiXCircle },
  info:    { cls: 'alert-info',    Icon: HiInformationCircle },
};

export default function Alert({ variant = 'info', title, icon, className = '', children }) {
  const { cls, Icon } = VARIANTS[variant] || VARIANTS.info;
  const Glyph = icon || <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />;

  return (
    <div className={clsx(cls, className)} role="alert">
      {Glyph}
      <div className="flex-1">
        {title && <p className="font-semibold leading-tight mb-0.5">{title}</p>}
        <p className="text-sm leading-relaxed">{children}</p>
      </div>
    </div>
  );
}
