export default function PageHeader({ title, subtitle, actions, className = '' }) {
  return (
    <header className={`flex items-start justify-between gap-6 pb-6 mb-6 ${className}`}>
      <div>
        <div className="uoh-bar mb-3"></div>
        <h1 className="page-title">{title}</h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="flex-shrink-0 flex items-center gap-2">{actions}</div>}
    </header>
  );
}
