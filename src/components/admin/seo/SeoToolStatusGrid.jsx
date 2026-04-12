import { useTranslation } from 'react-i18next';

const STATUS_STYLES = {
  CONNECTED: {
    tone: 'text-emerald-700 dark:text-emerald-300',
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-300',
    icon: 'check_circle',
  },
  DEGRADED: {
    tone: 'text-amber-700 dark:text-amber-300',
    chip: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300',
    icon: 'warning',
  },
  DISABLED: {
    tone: 'text-slate-600 dark:text-slate-300',
    chip: 'border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300',
    icon: 'pause_circle',
  },
  ERROR: {
    tone: 'text-rose-700 dark:text-rose-300',
    chip: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/30 dark:text-rose-300',
    icon: 'error',
  },
};

const TOOL_ICONS = {
  github_actions: 'deployed_code',
  jenkins: 'lan',
  search_console: 'travel_explore',
  lighthouse: 'lightbulb',
  zap: 'shield',
  sentry: 'monitoring',
};

function formatTimestamp(value, emptyLabel) {
  if (!value) return emptyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return date.toLocaleString();
}

export default function SeoToolStatusGrid({ tools = [] }) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {tools.map((tool) => {
        const state = STATUS_STYLES[tool.status] || STATUS_STYLES.DISABLED;
        const localizedLabel = t(`adminAnalytics.seo.tools.items.${tool.tool}`, {
          defaultValue: tool.label,
        });
        return (
          <article
            key={tool.tool}
            className="rounded-2xl border border-slate-200 bg-slate-50/60 p-5 dark:border-slate-800 dark:bg-slate-900/30"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-slate-700 shadow-sm dark:bg-slate-950/70 dark:text-slate-200">
                  <span className="material-symbols-outlined text-[22px]">{TOOL_ICONS[tool.tool] || 'extension'}</span>
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">{localizedLabel}</h4>
                  <p className={`text-xs font-medium ${state.tone}`}>{tool.summary || t('adminAnalytics.seo.tools.awaitingBackend')}</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.18em] ${state.chip}`}>
                <span className="material-symbols-outlined text-sm">{state.icon}</span>
                {t(`adminAnalytics.seo.tools.status.${tool.status}`)}
              </span>
            </div>

            <dl className="mt-4 space-y-2 text-sm text-slate-500 dark:text-text-muted">
              <div className="flex items-center justify-between gap-3">
                <dt>{t('adminAnalytics.seo.tools.lastSuccess')}</dt>
                <dd className="font-medium text-slate-700 dark:text-slate-200">{formatTimestamp(tool.lastSuccessAt, t('adminAnalytics.seo.notAvailable'))}</dd>
              </div>
              <div className="flex items-center justify-between gap-3">
                <dt>{t('adminAnalytics.seo.tools.lastError')}</dt>
                <dd className="max-w-[15rem] text-right text-xs text-slate-600 dark:text-slate-300">
                  {tool.lastErrorSummary || t('adminAnalytics.seo.none')}
                </dd>
              </div>
            </dl>
          </article>
        );
      })}
    </div>
  );
}
