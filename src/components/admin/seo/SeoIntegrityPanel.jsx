import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

function formatTimestamp(value, emptyLabel) {
  if (!value) return emptyLabel;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return emptyLabel;
  return date.toLocaleString();
}

function computeDrift(publicRoutes = [], comparedRoutes = []) {
  if (!Array.isArray(publicRoutes) || !publicRoutes.length) {
    return { missing: [], extra: [] };
  }

  const normalizedPublic = new Set(publicRoutes);
  const normalizedCompared = new Set(Array.isArray(comparedRoutes) ? comparedRoutes : []);

  return {
    missing: publicRoutes.filter((route) => !normalizedCompared.has(route)),
    extra: [...normalizedCompared].filter((route) => !normalizedPublic.has(route)),
  };
}

function StatusPill({ ok, label }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'}`}>
      <span className="material-symbols-outlined text-sm">{ok ? 'check_circle' : 'error'}</span>
      {label}
    </span>
  );
}

export default function SeoIntegrityPanel({ controlPlane }) {
  const { t } = useTranslation();
  const publicRoutes = Array.isArray(controlPlane?.publicRoutes) ? controlPlane.publicRoutes : [];
  const robotsStatus = controlPlane?.robotsStatus || {};
  const sitemapStatus = controlPlane?.sitemapStatus || {};

  const robotsDrift = useMemo(
    () => computeDrift(publicRoutes, robotsStatus.paths),
    [publicRoutes, robotsStatus.paths],
  );
  const sitemapDrift = useMemo(
    () => computeDrift(publicRoutes, sitemapStatus.paths),
    [publicRoutes, sitemapStatus.paths],
  );

  const cards = [
    {
      id: 'robots',
      title: 'robots.txt',
      status: robotsStatus.exists,
      summary: t('adminAnalytics.seo.integrity.robotsSummary'),
      url: robotsStatus.url,
      updatedAt: robotsStatus.lastGeneratedAt,
      missing: robotsDrift.missing.length,
      extra: robotsDrift.extra.length,
      warnings: robotsStatus.warnings || [],
    },
    {
      id: 'sitemap',
      title: 'sitemap.xml',
      status: sitemapStatus.exists,
      summary: t('adminAnalytics.seo.integrity.sitemapSummary'),
      url: sitemapStatus.url,
      updatedAt: sitemapStatus.lastGeneratedAt,
      missing: sitemapDrift.missing.length,
      extra: sitemapDrift.extra.length,
      warnings: sitemapStatus.warnings || [],
      count: sitemapStatus.count,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      {cards.map((card) => (
        <article key={card.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 dark:border-slate-800 dark:bg-slate-900/30">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h4 className="text-base font-bold text-slate-900 dark:text-white">{card.title}</h4>
                <StatusPill ok={card.status} label={card.status ? t('adminAnalytics.seo.integrity.ready') : t('adminAnalytics.seo.integrity.attention')} />
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-text-muted">{card.summary}</p>
            </div>
            <div className="text-right text-xs text-slate-400 dark:text-slate-500">
              <p>{card.url || t('adminAnalytics.seo.notAvailable')}</p>
              <p>{formatTimestamp(card.updatedAt, t('adminAnalytics.seo.notAvailable'))}</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t('adminAnalytics.seo.integrity.allowedRoutes')}</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{publicRoutes.length}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t('adminAnalytics.seo.integrity.missing')}</p>
              <p className={`mt-2 text-2xl font-black ${card.missing ? 'text-rose-600 dark:text-rose-300' : 'text-emerald-600 dark:text-emerald-300'}`}>{card.missing}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{t('adminAnalytics.seo.integrity.extra')}</p>
              <p className={`mt-2 text-2xl font-black ${card.extra ? 'text-amber-600 dark:text-amber-300' : 'text-emerald-600 dark:text-emerald-300'}`}>{card.extra}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950/60">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{card.id === 'sitemap' ? t('adminAnalytics.seo.integrity.entries') : t('adminAnalytics.seo.integrity.warnings')}</p>
              <p className="mt-2 text-2xl font-black text-slate-900 dark:text-white">{card.id === 'sitemap' ? card.count || 0 : card.warnings.length}</p>
            </div>
          </div>

          {card.warnings.length > 0 ? (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
              <p className="font-semibold">{t('adminAnalytics.seo.integrity.warnings')}</p>
              <ul className="mt-2 space-y-1">
                {card.warnings.slice(0, 3).map((warning) => (
                  <li key={warning} className="flex gap-2">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    <span>{warning}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
