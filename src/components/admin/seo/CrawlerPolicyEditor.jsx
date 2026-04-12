import { useTranslation } from 'react-i18next';

function routeListToText(routes = []) {
  return Array.isArray(routes) ? routes.join(', ') : '';
}

export default function CrawlerPolicyEditor({ policies = [], publicRoutesText = '', siteOrigin = '', saving = false, onPublicRoutesChange, onSiteOriginChange, onPolicyChange, onSave }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {t('adminAnalytics.seo.siteOrigin')}
          </label>
          <input
            type="text"
            value={siteOrigin}
            onChange={(event) => onSiteOriginChange(event.target.value)}
            placeholder="https://www.cognicare.app"
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-950/60"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
            {t('adminAnalytics.seo.publicRoutes')}
          </label>
          <textarea
            value={publicRoutesText}
            onChange={(event) => onPublicRoutesChange(event.target.value)}
            rows={3}
            placeholder="/, /about, /features, /download"
            className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-950/60"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm dark:divide-slate-800">
            <thead className="bg-slate-50/80 dark:bg-slate-900/40">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('adminAnalytics.seo.crawlers.userAgent')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('adminAnalytics.seo.crawlers.allow')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('adminAnalytics.seo.crawlers.disallow')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('adminAnalytics.seo.crawlers.crawlDelay')}</th>
                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-slate-400">{t('adminAnalytics.seo.crawlers.enabled')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-surface-dark">
              {policies.map((policy, index) => (
                <tr key={policy.id || policy.userAgent} className="align-top">
                  <td className="px-4 py-4">
                    <input
                      type="text"
                      value={policy.userAgent}
                      onChange={(event) => onPolicyChange(index, 'userAgent', event.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-950/60"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <textarea
                      value={routeListToText(policy.allow)}
                      onChange={(event) => onPolicyChange(index, 'allow', event.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-950/60"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <textarea
                      value={routeListToText(policy.disallow)}
                      onChange={(event) => onPolicyChange(index, 'disallow', event.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-950/60"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <input
                      type="number"
                      min="1"
                      value={policy.crawlDelay ?? ''}
                      onChange={(event) => onPolicyChange(index, 'crawlDelay', event.target.value)}
                      className="w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-slate-700 dark:bg-slate-950/60"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <label className="inline-flex items-center gap-3 rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(policy.enabled)}
                        onChange={(event) => onPolicyChange(index, 'enabled', event.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                      />
                      {policy.enabled ? t('adminAnalytics.seo.crawlers.on') : t('adminAnalytics.seo.crawlers.off')}
                    </label>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-900/30 dark:text-text-muted">
        <p>{t('adminAnalytics.seo.crawlers.help')}</p>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          <span className="material-symbols-outlined text-sm">save</span>
          {saving ? t('adminAnalytics.seo.saving') : t('adminAnalytics.seo.savePolicies')}
        </button>
      </div>
    </div>
  );
}
