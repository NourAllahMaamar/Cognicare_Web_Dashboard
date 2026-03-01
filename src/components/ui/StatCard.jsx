export default function StatCard({ label, value, icon, iconBg = 'bg-blue-50 dark:bg-blue-900/30', iconColor = 'text-primary', trend, trendLabel, className = '' }) {
  const isPositive = trend && !trend.startsWith('-');

  return (
    <div className={`bg-white dark:bg-surface-dark p-5 rounded-xl border border-slate-300 dark:border-slate-800 shadow-md hover:shadow-lg transition-shadow ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-500 dark:text-text-muted">{label}</span>
          <span className="text-2xl font-bold">{value}</span>
        </div>
        {icon && (
          <div className={`rounded-lg p-2 ${iconBg} ${iconColor}`}>
            <span className="material-symbols-outlined text-[20px]">{icon}</span>
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-2">
          <span className={`text-xs font-bold flex items-center gap-0.5 ${isPositive ? 'text-success' : 'text-error'}`}>
            <span className="material-symbols-outlined text-sm">{isPositive ? 'trending_up' : 'trending_down'}</span>
            {trend}
          </span>
          {trendLabel && <span className="text-xs text-slate-400">{trendLabel}</span>}
        </div>
      )}
    </div>
  );
}
