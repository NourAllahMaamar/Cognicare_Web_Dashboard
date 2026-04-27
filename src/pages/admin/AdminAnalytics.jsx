import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useSeoControlPlane } from '../../hooks/useSeoControlPlane';
import StatCard from '../../components/ui/StatCard';
import SeoSectionCard from '../../components/admin/seo/SeoSectionCard';
import CrawlerPolicyEditor from '../../components/admin/seo/CrawlerPolicyEditor';
import SeoIntegrityPanel from '../../components/admin/seo/SeoIntegrityPanel';
import SeoActionPanel from '../../components/admin/seo/SeoActionPanel';
import SeoToolStatusGrid from '../../components/admin/seo/SeoToolStatusGrid';
import SeoHistoryTable from '../../components/admin/seo/SeoHistoryTable';

function listToText(list = []) {
  return Array.isArray(list) ? list.join(', ') : '';
}

function textToList(text = '') {
  return text
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const { authGet } = useAuth('admin');
  const [stats, setStats] = useState({ users: 0, orgs: 0, families: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState([]);

  const {
    loading: seoLoading,
    refreshing: seoRefreshing,
    saving: seoSaving,
    runningAction,
    error: seoError,
    success: seoSuccess,
    controlPlane,
    toolStatuses,
    history,
    hasMoreHistory,
    lastSnapshotAt,
    reload: reloadSeo,
    saveControlPlane,
    runAction,
    loadMoreHistory,
    resetFeedback,
  } = useSeoControlPlane();

  const [siteOrigin, setSiteOrigin] = useState('');
  const [publicRoutesText, setPublicRoutesText] = useState('');
  const [crawlerPolicies, setCrawlerPolicies] = useState([]);

  useEffect(() => {
    if (!controlPlane) return;
    setSiteOrigin(controlPlane.siteOrigin || '');
    setPublicRoutesText(listToText(controlPlane.publicRoutes));
    setCrawlerPolicies(Array.isArray(controlPlane.crawlerPolicies) ? controlPlane.crawlerPolicies : []);
  }, [controlPlane]);

  useEffect(() => {
    loadData();
    fetchRoles();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [users, orgs, families, pending] = await Promise.all([
        authGet('/users').catch(() => []),
        authGet('/organization/all').catch(() => []),
        authGet('/organization/admin/families').catch(() => []),
        authGet('/organization/admin/pending-requests').catch(() => []),
      ]);
      setStats({
        users: Array.isArray(users) ? users.length : 0,
        orgs: Array.isArray(orgs) ? orgs.length : 0,
        families: Array.isArray(families) ? families.length : 0,
        pending: Array.isArray(pending) ? pending.length : 0,
      });
    } catch {
      // Ignore dashboard stat errors and keep previous values.
    }
    setLoading(false);
  };

  const fetchRoles = async () => {
    try {
      const users = await authGet('/users');
      if (!Array.isArray(users)) return;
      const counts = {};
      users.forEach((u) => {
        const role = u?.role || 'unknown';
        counts[role] = (counts[role] || 0) + 1;
      });
      const total = users.length || 1;
      const colors = { admin: '#2563EB', orgLeader: '#7c3aed', specialist: '#3b82f6', family: '#6b7280' };
      setRoleData(
        Object.entries(counts).map(([role, count]) => ({
          role,
          count,
          pct: Math.round((count / total) * 100),
          color: colors[role] || '#94a3b8',
        })),
      );
    } catch {
      // Ignore role chart errors.
    }
  };

  const onCrawlerPolicyChange = useCallback((index, field, value) => {
    setCrawlerPolicies((prev) =>
      prev.map((policy, i) => {
        if (i !== index) return policy;
        if (field === 'allow' || field === 'disallow') {
          return { ...policy, [field]: textToList(String(value || '')) };
        }
        if (field === 'crawlDelay') {
          if (value === '' || value === null || Number(value) <= 0) {
            return { ...policy, crawlDelay: null };
          }
          return { ...policy, crawlDelay: Number(value) };
        }
        return { ...policy, [field]: value };
      }),
    );
  }, []);

  const onSaveCrawlerPolicies = useCallback(async () => {
    await saveControlPlane({
      siteOrigin,
      publicRoutes: textToList(publicRoutesText),
      crawlerPolicies,
    });
  }, [crawlerPolicies, publicRoutesText, saveControlPlane, siteOrigin]);

  const months = [
    t('adminAnalytics.months.jan'),
    t('adminAnalytics.months.feb'),
    t('adminAnalytics.months.mar'),
    t('adminAnalytics.months.apr'),
    t('adminAnalytics.months.may'),
    t('adminAnalytics.months.jun'),
    t('adminAnalytics.months.jul'),
    t('adminAnalytics.months.aug'),
    t('adminAnalytics.months.sep'),
    t('adminAnalytics.months.oct'),
    t('adminAnalytics.months.nov'),
    t('adminAnalytics.months.dec'),
  ];
  const newUsers = [120, 180, 240, 310, 380, 420, 500, 560, 620, 700, 780, 850];
  const activeUsers = [80, 120, 160, 200, 260, 310, 370, 420, 480, 530, 600, 680];

  const toPath = (data, maxVal) => {
    const w = 540;
    const h = 180;
    const points = data.map((value, index) => ({
      x: (index / (data.length - 1)) * w,
      y: h - (value / maxVal) * h,
    }));
    return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`).join(' ');
  };

  const maxVal = Math.max(...newUsers, ...activeUsers) * 1.1;

  const planData = useMemo(
    () => [
      { name: t('adminAnalytics.planTypes.pecs'), pct: 45, color: '#2563EB' },
      { name: t('adminAnalytics.planTypes.teacch'), pct: 30, color: '#7c3aed' },
      { name: t('adminAnalytics.planTypes.activities'), pct: 25, color: '#3b82f6' },
    ],
    [t],
  );

  const seoBannerTone = seoError
    ? 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200'
    : 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200';

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">{t('adminAnalytics.title')}</h2>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-0.5 md:mt-1">{t('adminAnalytics.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-lg flex-shrink-0">calendar_today</span>
            <span className="hidden sm:inline">{t('adminAnalytics.last30Days')}</span>
            <span className="sm:hidden">Last 30 Days</span>
          </button>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-lg flex-shrink-0">download</span>
            <span className="hidden sm:inline">{t('adminAnalytics.exportReport')}</span>
            <span className="sm:hidden">Export</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4">
            <StatCard label={t('adminAnalytics.totalUsers')} value={stats.users.toLocaleString()} icon="group" trend="+12.5%" />
            <StatCard label={t('adminAnalytics.organizations')} value={stats.orgs.toLocaleString()} icon="corporate_fare" trend="+5.2%" />
            <StatCard label={t('adminAnalytics.families')} value={stats.families.toLocaleString()} icon="family_restroom" trend="+8.1%" />
            <StatCard label={t('adminAnalytics.pendingReviews')} value={stats.pending.toLocaleString()} icon="pending_actions" trend={stats.pending > 0 ? `${stats.pending} ${t('adminAnalytics.pending')}` : t('adminAnalytics.clear')} />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 md:gap-4">
            <div className="xl:col-span-2 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3 md:mb-4 gap-2">
                <div>
                  <h3 className="text-sm md:text-base font-bold">{t('adminAnalytics.userGrowth')}</h3>
                  <p className="text-[10px] md:text-xs text-slate-400 mt-0.5">{t('adminAnalytics.userGrowthSubtitle')}</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> {t('adminAnalytics.newUsers')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> {t('adminAnalytics.active')}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <svg viewBox="0 0 560 220" className="w-full min-w-[400px]">
                  {[0, 1, 2, 3].map((i) => (
                    <line key={i} x1="0" y1={i * 60} x2="540" y2={i * 60} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="4" />
                  ))}
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`${toPath(newUsers, maxVal)} L540,180 L0,180 Z`} fill="url(#areaGrad)" />
                  <path d={toPath(newUsers, maxVal)} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={toPath(activeUsers, maxVal)} fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {months.map((month, index) => (
                    <text key={month} x={(index / 11) * 540} y="200" className="fill-slate-400 text-[10px]" textAnchor="middle">{month}</text>
                  ))}
                </svg>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
              <div className="flex items-center justify-between mb-3 md:mb-4">
                <h3 className="text-sm md:text-base font-bold">{t('adminAnalytics.activityFeed')}</h3>
                <button className="text-[10px] md:text-xs text-primary font-bold hover:underline">{t('adminAnalytics.viewAll')}</button>
              </div>
              <div className="relative">
                <div className="absolute start-[11px] top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-4 md:space-y-5">
                  {[
                    { color: 'bg-primary', title: t('adminAnalytics.activities.newOrg.title'), desc: t('adminAnalytics.activities.newOrg.desc'), time: t('adminAnalytics.activities.newOrg.time') },
                    { color: 'bg-amber-500', title: t('adminAnalytics.activities.highLoad.title'), desc: t('adminAnalytics.activities.highLoad.desc'), time: t('adminAnalytics.activities.highLoad.time') },
                    { color: 'bg-success', title: t('adminAnalytics.activities.payment.title'), desc: t('adminAnalytics.activities.payment.desc'), time: t('adminAnalytics.activities.payment.time') },
                    { color: 'bg-blue-500', title: t('adminAnalytics.activities.report.title'), desc: t('adminAnalytics.activities.report.desc'), time: t('adminAnalytics.activities.report.time') },
                    { color: 'bg-purple-500', title: t('adminAnalytics.activities.feature.title'), desc: t('adminAnalytics.activities.feature.desc'), time: t('adminAnalytics.activities.feature.time') },
                  ].map((item, index) => (
                    <div key={index} className="relative ps-6 md:ps-8">
                      <div className={`absolute start-0 top-1 w-5 h-5 md:w-6 md:h-6 rounded-full ${item.color} ring-4 ring-white dark:ring-surface-dark flex items-center justify-center flex-shrink-0`}>
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-white" />
                      </div>
                      <p className="font-bold text-xs md:text-sm truncate">{item.title}</p>
                      <p className="text-[10px] md:text-xs text-slate-400 truncate">{item.desc}</p>
                      <p className="text-[10px] md:text-xs text-slate-300 dark:text-slate-600 mt-0.5">{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 md:mt-6 p-3 md:p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="font-bold text-xs md:text-sm">{t('adminAnalytics.systemHealth')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2 w-2 md:h-2.5 md:w-2.5 flex-shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 md:h-2.5 md:w-2.5 bg-success" />
                  </span>
                  <span className="text-[10px] md:text-xs font-bold text-success">{t('adminAnalytics.allSystemsOperational')}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
              <h3 className="text-sm md:text-base font-bold mb-3 md:mb-4">{t('adminAnalytics.planDistribution')}</h3>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                <div className="relative w-24 h-24 md:w-32 md:h-32 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {(() => {
                      let offset = 0;
                      return planData.map((seg, i) => {
                        const dash = (seg.pct / 100) * 100;
                        const el = (
                          <circle key={i} cx="18" cy="18" r="14" fill="none" stroke={seg.color} strokeWidth="5" strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={-offset} strokeLinecap="round" />
                        );
                        offset += dash;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-base md:text-lg font-black">{(stats.families * 1.5).toFixed(0)}</p>
                      <p className="text-[10px] md:text-xs text-slate-400">{t('adminAnalytics.total')}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 md:space-y-3 flex-1 w-full">
                  {planData.map((seg) => (
                    <div key={seg.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full flex-shrink-0" style={{ backgroundColor: seg.color }} />
                        <span className="text-xs md:text-sm font-medium truncate">{seg.name}</span>
                      </div>
                      <span className="text-xs md:text-sm font-bold flex-shrink-0">{seg.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
              <h3 className="text-sm md:text-base font-bold mb-3 md:mb-4">{t('adminAnalytics.usersByRole')}</h3>
              <div className="space-y-3 md:space-y-4">
                {(roleData.length > 0 ? roleData : [
                  { role: 'admin', count: 2, pct: 5, color: '#2563EB' },
                  { role: 'orgLeader', count: 8, pct: 15, color: '#7c3aed' },
                  { role: 'specialist', count: 20, pct: 35, color: '#3b82f6' },
                  { role: 'family', count: 25, pct: 45, color: '#6b7280' },
                ]).map((r) => (
                  <div key={r.role}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">{t(`adminAnalytics.roles.${r.role}`)}</span>
                      <span className="text-sm font-bold">{r.count.toLocaleString()}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${r.pct}%`, backgroundColor: r.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      <SeoSectionCard
        title={t('adminAnalytics.seo.title')}
        subtitle={t('adminAnalytics.seo.subtitle')}
        icon="travel_explore"
        actions={(
          <button
            type="button"
            onClick={() => reloadSeo({ silent: true })}
            disabled={seoLoading || seoRefreshing}
            className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            {seoRefreshing ? t('adminAnalytics.seo.refreshing') : t('adminAnalytics.seo.refresh')}
          </button>
        )}
      >
        <div className="space-y-6">
          <div className={`rounded-2xl border px-4 py-3 text-sm ${seoBannerTone}`}>
            <p className="font-semibold">
              {seoError ? t('adminAnalytics.seo.banner.degraded') : t('adminAnalytics.seo.banner.operational')}
            </p>
            <p className="mt-1 text-xs opacity-90">
              {seoError
                ? seoError
                : t('adminAnalytics.seo.banner.snapshot', {
                    date: lastSnapshotAt ? new Date(lastSnapshotAt).toLocaleString() : t('adminAnalytics.seo.notAvailable'),
                  })}
            </p>
          </div>

          {seoSuccess ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200">
              <p className="font-semibold">{t('adminAnalytics.seo.successTitle')}</p>
              <p className="mt-1 text-xs">
                {t(`adminAnalytics.seo.actions.items.${seoSuccess}`, { defaultValue: seoSuccess })}
              </p>
            </div>
          ) : null}

          <SeoSectionCard
            title={t('adminAnalytics.seo.crawlers.title')}
            subtitle={t('adminAnalytics.seo.crawlers.subtitle')}
            icon="smart_toy"
            className="border-slate-200 bg-slate-50/50 dark:bg-slate-900/20"
          >
            <CrawlerPolicyEditor
              policies={crawlerPolicies}
              publicRoutesText={publicRoutesText}
              siteOrigin={siteOrigin}
              saving={seoSaving}
              onPublicRoutesChange={(value) => {
                resetFeedback();
                setPublicRoutesText(value);
              }}
              onSiteOriginChange={(value) => {
                resetFeedback();
                setSiteOrigin(value);
              }}
              onPolicyChange={(index, field, value) => {
                resetFeedback();
                onCrawlerPolicyChange(index, field, value);
              }}
              onSave={onSaveCrawlerPolicies}
            />
          </SeoSectionCard>

          <SeoSectionCard
            title={t('adminAnalytics.seo.integrity.title')}
            subtitle={t('adminAnalytics.seo.integrity.subtitle')}
            icon="rule_settings"
            className="border-slate-200 bg-slate-50/50 dark:bg-slate-900/20"
          >
            <SeoIntegrityPanel controlPlane={controlPlane} />
          </SeoSectionCard>

          <SeoSectionCard
            title={t('adminAnalytics.seo.actions.title')}
            subtitle={t('adminAnalytics.seo.actions.subtitle')}
            icon="rocket_launch"
            className="border-slate-200 bg-slate-50/50 dark:bg-slate-900/20"
          >
            <SeoActionPanel runningAction={runningAction} onAction={runAction} />
          </SeoSectionCard>

          <SeoSectionCard
            title={t('adminAnalytics.seo.tools.title')}
            subtitle={t('adminAnalytics.seo.tools.subtitle')}
            icon="hub"
            className="border-slate-200 bg-slate-50/50 dark:bg-slate-900/20"
          >
            <SeoToolStatusGrid tools={toolStatuses} />
          </SeoSectionCard>

          <SeoSectionCard
            title={t('adminAnalytics.seo.history.title')}
            subtitle={t('adminAnalytics.seo.history.subtitle')}
            icon="history"
            className="border-slate-200 bg-slate-50/50 dark:bg-slate-900/20"
          >
            <SeoHistoryTable
              history={history}
              hasMoreHistory={hasMoreHistory}
              refreshing={seoRefreshing}
              onLoadMore={loadMoreHistory}
            />
          </SeoSectionCard>
        </div>
      </SeoSectionCard>
    </div>
  );
}
