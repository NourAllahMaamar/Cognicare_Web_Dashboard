import { useTranslation } from 'react-i18next';

function formatTimestamp(value, emptyLabel) {
  if (!value) return emptyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return date.toLocaleString();
}

const STATUS_CLASS = {
  CONNECTED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  DEGRADED: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  DISABLED: 'bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300',
  ERROR: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
  PENDING: 'bg-slate-100 text-slate-700 dark:bg-slate-900/60 dark:text-slate-300',
  RUNNING: 'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300',
  COMPLETED: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  FAILED: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
};

export default function SeoHistoryTable({ history = [], onLoadMore, hasMoreHistory = false, refreshing = false }) {
  const { t } = useTranslation();

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
          <thead className="bg-slate-50/80 dark:bg-slate-900/40">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('adminAnalytics.seo.history.action')}</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('adminAnalytics.seo.history.target')}</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('adminAnalytics.seo.history.status')}</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('adminAnalytics.seo.history.started')}</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('adminAnalytics.seo.history.summary')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-surface-dark">
            {history.length > 0 ? history.map((entry) => (
              <tr key={entry.id} className="align-top">
                <td className="px-4 py-4 font-semibold text-slate-900 dark:text-white">
                  {t(`adminAnalytics.seo.actions.items.${entry.action}`, {
                    defaultValue: entry.action,
                  })}
                </td>
                <td className="px-4 py-4 font-mono text-xs text-slate-500 dark:text-slate-300">{entry.target || t('adminAnalytics.seo.none')}</td>
                <td className="px-4 py-4">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase ${STATUS_CLASS[entry.status] || STATUS_CLASS.DISABLED}`}>
                    {t(`adminAnalytics.seo.tools.status.${entry.status}`)}
                  </span>
                </td>
                <td className="px-4 py-4 text-slate-500 dark:text-text-muted">{formatTimestamp(entry.startedAt, t('adminAnalytics.seo.notAvailable'))}</td>
                <td className="px-4 py-4 text-slate-600 dark:text-slate-300">{entry.summary || entry.correlationId || t('adminAnalytics.seo.none')}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-400 dark:text-slate-500">
                  {t('adminAnalytics.seo.history.empty')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {hasMoreHistory ? (
        <div className="border-t border-slate-200 bg-slate-50/80 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/40">
          <button
            type="button"
            onClick={onLoadMore}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
          >
            <span className="material-symbols-outlined text-sm">history</span>
            {refreshing ? t('adminAnalytics.seo.refreshing') : t('adminAnalytics.seo.history.loadMore')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
