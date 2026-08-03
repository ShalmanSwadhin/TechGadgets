/**
 * Consistent section heading with an eyebrow label to establish hierarchy
 * and give each homepage/section its own identity within one design system.
 */
export default function SectionHeader({ eyebrow, title, description, action, align = 'left' }) {
  const centered = align === 'center';
  return (
    <div
      className={`flex flex-wrap items-end gap-4 ${
        centered ? 'flex-col text-center' : 'justify-between'
      }`}
    >
      <div className={`max-w-2xl ${centered ? 'mx-auto' : ''}`}>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        {description && (
          <p className="mt-2 text-slate-500 dark:text-slate-400">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
