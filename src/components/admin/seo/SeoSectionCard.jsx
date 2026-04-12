export default function SeoSectionCard({ title, subtitle, icon, actions = null, children, className = '' }) {
  return (
    <section className={`rounded-3xl border border-slate-300 bg-white p-6 shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-surface-dark dark:shadow-none ${className}`}>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          {icon ? (
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:bg-primary/15">
              <span className="material-symbols-outlined text-[24px]">{icon}</span>
            </div>
          ) : null}
          <div>
            <h3 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">{title}</h3>
            {subtitle ? (
              <p className="mt-1 text-sm text-slate-500 dark:text-text-muted">{subtitle}</p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
      {children}
    </section>
  );
}
