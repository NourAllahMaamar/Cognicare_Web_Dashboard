/**
 * ContextChips — compact status + route chip only.
 * Keeps the header tight: just the live badge and a short route label.
 */
export default function ContextChips({ location, summaryChips, isRtl, t }) {
  // Show only the last meaningful path segment, e.g. "dashboard" from "/admin/dashboard"
  const shortRoute = (() => {
    const parts = location.pathname.replace(/^\//, '').split('/').filter(Boolean);
    if (parts.length === 0) return '/';
    // Last segment only, capitalised
    const last = parts[parts.length - 1];
    return last.charAt(0).toUpperCase() + last.slice(1);
  })();

  // Pick the single most useful numeric metric (first one found)
  const topMetric = summaryChips.find(c => !isNaN(Number(c.value)));

  return (
    <div className={`mt-2 flex items-center gap-1.5 flex-wrap ${isRtl ? 'justify-end' : ''}`}>
      {/* Live badge */}
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-500 dark:text-emerald-400">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
        {t('dashboardAssistant.status.live', 'Live')}
      </span>

      {/* Route — single segment, truncated */}
      <span
        className="max-w-[120px] truncate rounded-full border px-2 py-0.5 text-[10px] font-medium"
        style={{
          background: 'var(--ca-chip-bg)',
          borderColor: 'var(--ca-chip-border)',
          color: 'var(--ca-chip-text)',
        }}
        title={location.pathname}
      >
        {shortRoute}
      </span>

      {/* One numeric metric chip */}
      {topMetric && (
        <span
          className="rounded-full border px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: 'var(--ca-chip-bg)',
            borderColor: 'var(--ca-chip-border)',
            color: 'var(--ca-chip-text)',
          }}
        >
          {topMetric.value} {topMetric.key.replace(/([A-Z])/g, ' $1').toLowerCase().replace(/^total\s?/, '').trim()}
        </span>
      )}
    </div>
  );
}
