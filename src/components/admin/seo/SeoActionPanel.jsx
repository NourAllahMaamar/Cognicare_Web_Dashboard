import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

const PRIVATE_PREFIXES = ['/admin/dashboard', '/org/dashboard', '/specialist/dashboard', '/api'];

function normalizePath(value) {
  if (!value) return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

export default function SeoActionPanel({ runningAction, onAction }) {
  const { t } = useTranslation();
  const [inspectPath, setInspectPath] = useState('');
  const [inspectError, setInspectError] = useState('');

  const normalizedInspectPath = useMemo(() => normalizePath(inspectPath), [inspectPath]);

  const handleInspect = async () => {
    const nextPath = normalizedInspectPath;
    if (!nextPath) {
      setInspectError(t('adminAnalytics.seo.actions.pathRequired'));
      return;
    }
    const isPrivatePath = PRIVATE_PREFIXES.some(
      (prefix) => nextPath === prefix || nextPath.startsWith(`${prefix}/`),
    );
    if (isPrivatePath) {
      setInspectError(t('adminAnalytics.seo.actions.privatePathBlocked'));
      return;
    }

    setInspectError('');
    await onAction({
      action: 'INSPECT_URL_COVERAGE',
      targetPath: nextPath,
      tool: 'search_console',
    });
  };

  const buttons = [
    {
      action: 'REGENERATE_SITEMAP',
      icon: 'alt_route',
      label: t('adminAnalytics.seo.actions.items.REGENERATE_SITEMAP'),
      tool: 'github_actions',
    },
    {
      action: 'VALIDATE_ROBOTS_RULES',
      icon: 'rule_settings',
      label: t('adminAnalytics.seo.actions.items.VALIDATE_ROBOTS_RULES'),
      tool: 'zap',
    },
    {
      action: 'SUBMIT_SITEMAP',
      icon: 'publish',
      label: t('adminAnalytics.seo.actions.items.SUBMIT_SITEMAP'),
      tool: 'search_console',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {buttons.map((button) => (
            <button
              key={button.action}
              type="button"
              onClick={() => onAction({ action: button.action, tool: button.tool })}
              disabled={Boolean(runningAction)}
              className="group flex min-h-[9rem] flex-col justify-between rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950/60"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary transition group-hover:scale-105 dark:bg-primary/15">
                <span className="material-symbols-outlined text-[22px]">{button.icon}</span>
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">{button.label}</p>
                <p className="mt-1 text-xs text-slate-500 dark:text-text-muted">
                  {runningAction === button.action ? t('adminAnalytics.seo.actions.running') : t('adminAnalytics.seo.actions.ready')}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/30">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <span className="material-symbols-outlined text-[22px]">manage_search</span>
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 dark:text-white">{t('adminAnalytics.seo.actions.items.inspect_url_coverage')}</h4>
            <p className="mt-1 text-sm text-slate-500 dark:text-text-muted">{t('adminAnalytics.seo.actions.inspectHelp')}</p>
          </div>
        </div>

        <label className="block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
          {t('adminAnalytics.seo.actions.inspectPathLabel')}
        </label>
        <input
          type="text"
          value={inspectPath}
          onChange={(event) => {
            setInspectPath(event.target.value);
            if (inspectError) setInspectError('');
          }}
          placeholder={t('adminAnalytics.seo.actions.inspectPlaceholder')}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-950/60"
        />
        {inspectError ? (
          <p className="mt-2 flex items-center gap-2 text-sm text-rose-600 dark:text-rose-300">
            <span className="material-symbols-outlined text-sm">error</span>
            {inspectError}
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-500 dark:text-text-muted">{t('adminAnalytics.seo.actions.inspectSafety')}</p>
        )}

        <button
          type="button"
          onClick={handleInspect}
          disabled={Boolean(runningAction)}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          <span className="material-symbols-outlined text-sm">travel_explore</span>
          {runningAction === 'INSPECT_URL_COVERAGE'
            ? t('adminAnalytics.seo.actions.running')
            : t('adminAnalytics.seo.actions.runInspect')}
        </button>
      </div>
    </div>
  );
}
