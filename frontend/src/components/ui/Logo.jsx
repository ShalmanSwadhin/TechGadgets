import { Link } from 'react-router-dom';
import { LOGO_SRC, SITE_NAME } from '../../config/site';

const sizeMap = {
  sm: 'h-8 w-8',
  md: 'h-9 w-9',
  lg: 'h-11 w-11',
  xl: 'h-16 w-16',
};

/**
 * Centralized brand logo. Renders the single logo asset defined in
 * config/site.js so the entire app can be rebranded from one place.
 */
export default function Logo({
  to = '/',
  size = 'md',
  withText = true,
  label,
  className = '',
  textClassName = 'text-xl font-display font-bold tracking-tight',
}) {
  const mark = (
    <span
      className={`flex ${sizeMap[size]} items-center justify-center overflow-hidden rounded-xl bg-slate-900 shadow-glow-sm ring-1 ring-brand-500/40`}
    >
      <img
        src={LOGO_SRC}
        alt={`${SITE_NAME} logo`}
        className="h-full w-full object-cover"
        loading="eager"
        decoding="async"
      />
    </span>
  );

  const content = (
    <>
      {mark}
      {withText && <span className={textClassName}>{label ?? SITE_NAME}</span>}
    </>
  );

  const base = `inline-flex items-center gap-2.5 ${className}`;

  if (to) {
    return (
      <Link to={to} className={base} aria-label={SITE_NAME}>
        {content}
      </Link>
    );
  }
  return <div className={base}>{content}</div>;
}
