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
import {
  API_BASE_URL,
  LOCAL_BACKEND_ORIGIN,
  RENDER_BACKEND_ORIGIN,
  getBackendSource,
  setBackendSource,
} from '../../config';

function listToText(list = []) {
  return Array.isArray(list) ? list.join(', ') : '';
}

function textToList(text = '') {
  return text
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function downloadTextFile(filename, content, mimeType = 'text/plain;charset=utf-8') {
  const blob = new Blob([content || ''], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

const DEMO_INTEGRATION_DEFAULTS = {
  githubRepository: 'CogniCare/cognicare',
  githubBranch: 'main',
  githubLighthouseWorkflowId: 'lighthouse.yml',
  githubZapWorkflowId: 'zap.yml',
  githubTokenSecretRef: 'GITHUB_TOKEN',
  jenkinsBaseUrl: 'http://localhost:8080',
  jenkinsJobName: 'cognicare-backend',
  jenkinsUsernameSecretRef: 'JENKINS_USERNAME',
  jenkinsApiTokenSecretRef: 'JENKINS_API_TOKEN',
  searchConsolePropertyUri: 'sc-domain:cognicare.app',
  searchConsoleCredentialsSecretRef: 'SEARCH_CONSOLE_CREDENTIALS',
  searchConsoleSitemapUrl: 'https://cognicare.app/sitemap.xml',
  sentryDsnSecretRef: 'SENTRY_DSN',
  sentryEnvironment: 'production',
  grafanaBaseUrl: 'http://localhost:3301',
  grafanaDashboardUid: 'cognicare-observability',
  grafanaApiTokenSecretRef: 'GRAFANA_API_TOKEN',
  prometheusBaseUrl: 'http://localhost:9090',
  prometheusJobName: 'cognicare_backend',
  sonarqubeBaseUrl: 'http://localhost:9000',
  sonarqubeProjectKey: 'cognicare-backend',
  sonarqubeTokenSecretRef: 'SONAR_TOKEN_BACKEND',
};

function buildIntegrationLinks(draft) {
  return [
    {
      label: 'GitHub Actions',
      icon: 'commit',
      href: draft.githubRepository
        ? `https://github.com/${draft.githubRepository}/actions`
        : '',
    },
    {
      label: 'Jenkins',
      icon: 'integration_instructions',
      href: draft.jenkinsBaseUrl && draft.jenkinsJobName
        ? `${draft.jenkinsBaseUrl.replace(/\/$/, '')}/job/${encodeURIComponent(draft.jenkinsJobName)}`
        : '',
    },
    {
      label: 'Search Console',
      icon: 'travel_explore',
      href: draft.searchConsolePropertyUri
        ? `https://search.google.com/search-console?resource_id=${encodeURIComponent(draft.searchConsolePropertyUri)}`
        : '',
    },
    {
      label: 'Grafana',
      icon: 'monitoring',
      href: draft.grafanaBaseUrl && draft.grafanaDashboardUid
        ? `${draft.grafanaBaseUrl.replace(/\/$/, '')}/d/${encodeURIComponent(draft.grafanaDashboardUid)}`
        : '',
    },
    {
      label: 'Prometheus',
      icon: 'query_stats',
      href: draft.prometheusBaseUrl
        ? `${draft.prometheusBaseUrl.replace(/\/$/, '')}/targets`
        : '',
    },
    {
      label: 'SonarQube',
      icon: 'verified',
      href: draft.sonarqubeBaseUrl && draft.sonarqubeProjectKey
        ? `${draft.sonarqubeBaseUrl.replace(/\/$/, '')}/dashboard?id=${encodeURIComponent(draft.sonarqubeProjectKey)}`
        : '',
    },
  ];
}

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const { authGet } = useAuth('admin');
  const [stats, setStats] = useState({ users: 0, orgs: 0, families: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [roleData, setRoleData] = useState([]);
  const [backendSource, setBackendSourceState] = useState(() => getBackendSource());
  const [backendHealth, setBackendHealth] = useState({
    local: { status: 'checking', message: 'Checking local backend...' },
    render: { status: 'checking', message: 'Checking Render backend...' },
  });

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
    generatedArtifacts,
    hasMoreHistory,
    lastSnapshotAt,
    reload: reloadSeo,
    saveControlPlane,
    runAction,
    loadMoreHistory,
    refreshGeneratedArtifacts,
    resetFeedback,
  } = useSeoControlPlane();

  const [siteOrigin, setSiteOrigin] = useState('');
  const [publicRoutesText, setPublicRoutesText] = useState('');
  const [crawlerPolicies, setCrawlerPolicies] = useState([]);
  const [integrationDraft, setIntegrationDraft] = useState({
    githubRepository: '',
    githubBranch: '',
    githubLighthouseWorkflowId: '',
    githubZapWorkflowId: '',
    githubTokenSecretRef: '',
    jenkinsBaseUrl: '',
    jenkinsJobName: '',
    jenkinsUsernameSecretRef: '',
    jenkinsApiTokenSecretRef: '',
    searchConsolePropertyUri: '',
    searchConsoleCredentialsSecretRef: '',
    searchConsoleSitemapUrl: '',
    sentryDsnSecretRef: '',
    sentryEnvironment: '',
    grafanaBaseUrl: '',
    grafanaDashboardUid: '',
    grafanaApiTokenSecretRef: '',
    prometheusBaseUrl: '',
    prometheusJobName: '',
    sonarqubeBaseUrl: '',
    sonarqubeProjectKey: '',
    sonarqubeTokenSecretRef: '',
  });
  const integrationLinks = useMemo(
    () => buildIntegrationLinks(integrationDraft),
    [integrationDraft],
  );

  useEffect(() => {
    if (!controlPlane) return;
    setSiteOrigin(controlPlane.siteOrigin || '');
    setPublicRoutesText(listToText(controlPlane.publicRoutes));
    setCrawlerPolicies(Array.isArray(controlPlane.crawlerPolicies) ? controlPlane.crawlerPolicies : []);
    setIntegrationDraft({
      githubRepository: controlPlane.githubActions?.repository || '',
      githubBranch: controlPlane.githubActions?.branch || '',
      githubLighthouseWorkflowId: controlPlane.githubActions?.lighthouseWorkflowId || '',
      githubZapWorkflowId: controlPlane.githubActions?.zapWorkflowId || '',
      githubTokenSecretRef: controlPlane.githubActions?.tokenSecretRef || '',
      jenkinsBaseUrl: controlPlane.jenkins?.baseUrl || '',
      jenkinsJobName: controlPlane.jenkins?.jobName || '',
      jenkinsUsernameSecretRef: controlPlane.jenkins?.usernameSecretRef || '',
      jenkinsApiTokenSecretRef: controlPlane.jenkins?.apiTokenSecretRef || '',
      searchConsolePropertyUri: controlPlane.searchConsole?.propertyUri || '',
      searchConsoleCredentialsSecretRef: controlPlane.searchConsole?.credentialsSecretRef || '',
      searchConsoleSitemapUrl: controlPlane.searchConsole?.sitemapUrl || '',
      sentryDsnSecretRef: controlPlane.sentry?.dsnSecretRef || '',
      sentryEnvironment: controlPlane.sentry?.environment || '',
      grafanaBaseUrl: controlPlane.grafana?.baseUrl || '',
      grafanaDashboardUid: controlPlane.grafana?.dashboardUid || '',
      grafanaApiTokenSecretRef: controlPlane.grafana?.apiTokenSecretRef || '',
      prometheusBaseUrl: controlPlane.prometheus?.baseUrl || '',
      prometheusJobName: controlPlane.prometheus?.jobName || '',
      sonarqubeBaseUrl: controlPlane.sonarqube?.baseUrl || '',
      sonarqubeProjectKey: controlPlane.sonarqube?.projectKey || '',
      sonarqubeTokenSecretRef: controlPlane.sonarqube?.tokenSecretRef || '',
    });
  }, [controlPlane]);

  useEffect(() => {
    loadData();
    fetchRoles();
  }, []);

  const refreshBackendHealth = useCallback(async () => {
    const checks = [
      ['local', LOCAL_BACKEND_ORIGIN],
      ['render', RENDER_BACKEND_ORIGIN],
    ];
    const results = await Promise.all(
      checks.map(async ([key, origin]) => {
        try {
          const startedAt = performance.now();
          const res = await fetch(`${origin}/api/v1/health`, {
            headers: { Accept: 'application/json' },
          });
          const durationMs = Math.round(performance.now() - startedAt);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const payload = await res.json().catch(() => ({}));
          return [
            key,
            {
              status: 'online',
              message: `${payload.status || 'ok'} in ${durationMs} ms`,
              origin,
            },
          ];
        } catch (err) {
          return [
            key,
            {
              status: 'offline',
              message: err?.message || 'Unavailable',
              origin,
            },
          ];
        }
      }),
    );
    setBackendHealth(Object.fromEntries(results));
  }, []);

  useEffect(() => {
    refreshBackendHealth();
  }, [refreshBackendHealth]);

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

  const onSaveIntegrations = useCallback(async () => {
    await saveControlPlane({
      siteOrigin,
      publicRoutes: textToList(publicRoutesText),
      crawlerPolicies,
      githubActions: {
        repository: integrationDraft.githubRepository,
        branch: integrationDraft.githubBranch,
        lighthouseWorkflowId: integrationDraft.githubLighthouseWorkflowId,
        zapWorkflowId: integrationDraft.githubZapWorkflowId,
        tokenSecretRef: integrationDraft.githubTokenSecretRef,
      },
      jenkins: {
        baseUrl: integrationDraft.jenkinsBaseUrl,
        jobName: integrationDraft.jenkinsJobName,
        usernameSecretRef: integrationDraft.jenkinsUsernameSecretRef,
        apiTokenSecretRef: integrationDraft.jenkinsApiTokenSecretRef,
      },
      searchConsole: {
        propertyUri: integrationDraft.searchConsolePropertyUri,
        credentialsSecretRef: integrationDraft.searchConsoleCredentialsSecretRef,
        sitemapUrl: integrationDraft.searchConsoleSitemapUrl,
      },
      sentry: {
        dsnSecretRef: integrationDraft.sentryDsnSecretRef,
        environment: integrationDraft.sentryEnvironment,
      },
      grafana: {
        baseUrl: integrationDraft.grafanaBaseUrl,
        dashboardUid: integrationDraft.grafanaDashboardUid,
        apiTokenSecretRef: integrationDraft.grafanaApiTokenSecretRef,
      },
      prometheus: {
        baseUrl: integrationDraft.prometheusBaseUrl,
        jobName: integrationDraft.prometheusJobName,
      },
      sonarqube: {
        baseUrl: integrationDraft.sonarqubeBaseUrl,
        projectKey: integrationDraft.sonarqubeProjectKey,
        tokenSecretRef: integrationDraft.sonarqubeTokenSecretRef,
      },
    });
  }, [crawlerPolicies, integrationDraft, publicRoutesText, saveControlPlane, siteOrigin]);

  const applyDemoIntegrations = useCallback(() => {
    resetFeedback();
    const nextSiteOrigin = siteOrigin || window.location.origin;
    setSiteOrigin(nextSiteOrigin);
    setIntegrationDraft({
      ...DEMO_INTEGRATION_DEFAULTS,
      searchConsoleSitemapUrl: `${nextSiteOrigin.replace(/\/$/, '')}/sitemap.xml`,
    });
  }, [resetFeedback, siteOrigin]);

  const handleBackendSourceChange = useCallback((source) => {
    setBackendSource(source);
    setBackendSourceState(source);
    window.location.reload();
  }, []);

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
            <span className="sm:hidden">{t('adminAnalytics.last30Days')}</span>
          </button>
          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-lg flex-shrink-0">download</span>
            <span className="hidden sm:inline">{t('adminAnalytics.exportReport')}</span>
            <span className="sm:hidden">{t('adminAnalytics.exportReport')}</span>
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-slate-300 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-surface-dark">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-bold">Backend data source</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-text-muted">
              Current API base: <span className="font-mono">{API_BASE_URL}</span>
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            {[
              { key: 'local', label: 'Local backend', origin: LOCAL_BACKEND_ORIGIN },
              { key: 'render', label: 'Render backend', origin: RENDER_BACKEND_ORIGIN },
            ].map((item) => {
              const health = backendHealth[item.key] || {};
              const active = backendSource === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => handleBackendSourceChange(item.key)}
                  className={`min-w-[220px] rounded-xl border px-3 py-2 text-left transition ${
                    active
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-slate-300 hover:border-primary/60 dark:border-slate-700'
                  }`}
                >
                  <span className="flex items-center justify-between gap-2 text-sm font-bold">
                    {item.label}
                    <span className={`h-2.5 w-2.5 rounded-full ${
                      health.status === 'online'
                        ? 'bg-success'
                        : health.status === 'checking'
                          ? 'bg-warning'
                          : 'bg-error'
                    }`} />
                  </span>
                  <span className="mt-1 block truncate text-[11px] text-slate-500 dark:text-text-muted">
                    {item.origin}
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold">
                    {active ? 'Selected' : 'Switch and reload'} · {health.message || 'Not checked'}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              onClick={refreshBackendHealth}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 px-3 py-2 text-sm font-bold hover:border-primary hover:text-primary dark:border-slate-700"
            >
              <span className="material-symbols-outlined text-base">sync</span>
              Check
            </button>
          </div>
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

          <div id="seo-actions">
            <SeoSectionCard
              title={t('adminAnalytics.seo.actions.title')}
              subtitle={t('adminAnalytics.seo.actions.subtitle')}
              icon="rocket_launch"
              className="border-slate-200 bg-slate-50/50 dark:bg-slate-900/20"
            >
              <div className="space-y-4">
              <SeoActionPanel runningAction={runningAction} onAction={runAction} />
              <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-sm font-bold">Generated crawl artifacts</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-text-muted">
                      {generatedArtifacts?.generatedAt
                        ? `Generated ${generatedArtifacts.routeCount} public URLs on ${new Date(generatedArtifacts.generatedAt).toLocaleString()}.`
                        : 'Generate the latest robots.txt and sitemap.xml from the saved control-plane routes.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void refreshGeneratedArtifacts()}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-bold transition hover:border-primary hover:text-primary dark:border-slate-700"
                    >
                      <span className="material-symbols-outlined text-sm">sync</span>
                      Generate
                    </button>
                    <button
                      type="button"
                      disabled={!generatedArtifacts?.robotsTxt}
                      onClick={() => downloadTextFile('robots.txt', generatedArtifacts.robotsTxt)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-bold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      robots.txt
                    </button>
                    <button
                      type="button"
                      disabled={!generatedArtifacts?.sitemapXml}
                      onClick={() => downloadTextFile('sitemap.xml', generatedArtifacts.sitemapXml, 'application/xml;charset=utf-8')}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-bold transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700"
                    >
                      <span className="material-symbols-outlined text-sm">download</span>
                      sitemap.xml
                    </button>
                  </div>
                </div>
              </div>
              </div>
            </SeoSectionCard>
          </div>

          <SeoSectionCard
            title={t('adminAnalytics.seo.tools.title')}
            subtitle={t('adminAnalytics.seo.tools.subtitle')}
            icon="hub"
            className="border-slate-200 bg-slate-50/50 dark:bg-slate-900/20"
          >
            <SeoToolStatusGrid tools={toolStatuses} />
          </SeoSectionCard>

          <SeoSectionCard
            title={t('adminAnalytics.seo.integrations.title', { defaultValue: 'Integration credentials and endpoints' })}
            subtitle={t('adminAnalytics.seo.integrations.subtitle', { defaultValue: 'Configure Jenkins/GitHub/Search Console/Sentry/Grafana/Prometheus/SonarQube references for production automations.' })}
            icon="admin_panel_settings"
            className="border-slate-200 bg-slate-50/50 dark:bg-slate-900/20"
          >
            <div className="space-y-5">
              <div className="flex flex-col gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/30 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-100">
                    Release-demo configuration
                  </p>
                  <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-200">
                    Fills the dashboard with project-specific endpoint references. Secret values still stay in backend environment variables.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={applyDemoIntegrations}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-emerald-700"
                >
                  <span className="material-symbols-outlined text-sm">auto_fix_high</span>
                  Fill demo setup
                </button>
              </div>

              <div className="grid grid-cols-1 gap-3 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900 dark:border-sky-900/60 dark:bg-sky-950/30 dark:text-sky-100">
                  <p className="font-bold">Manual production setup</p>
                  <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                    {[
                      'Create the GitHub or Jenkins workflows that run Lighthouse and ZAP against the production URL.',
                      'Add token environment variables on the backend host; this form stores only secret reference names.',
                      'Verify the Search Console property, grant API access, and use the sitemap URL shown here.',
                      'Publish the downloaded robots.txt and sitemap.xml with the web app before submitting the sitemap.',
                    ].map((item) => (
                      <div key={item} className="flex gap-2">
                        <span className="material-symbols-outlined mt-0.5 text-base text-sky-600">task_alt</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="text-sm font-bold">Related admin sections and links</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <a href="/admin/dashboard/system-health" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-bold transition hover:border-primary hover:text-primary dark:border-slate-700">
                      <span className="material-symbols-outlined text-sm">monitor_heart</span>
                      System Health
                    </a>
                    <a href="#seo-actions" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-bold transition hover:border-primary hover:text-primary dark:border-slate-700">
                      <span className="material-symbols-outlined text-sm">rocket_launch</span>
                      SEO Actions
                    </a>
                    <a href="#seo-history" className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-3 py-2 text-xs font-bold transition hover:border-primary hover:text-primary dark:border-slate-700">
                      <span className="material-symbols-outlined text-sm">history</span>
                      Action History
                    </a>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {integrationLinks.map((link) => (
                      <a
                        key={link.label}
                        href={link.href || '#'}
                        target={link.href ? '_blank' : undefined}
                        rel={link.href ? 'noreferrer' : undefined}
                        aria-disabled={!link.href}
                        onClick={(event) => {
                          if (!link.href) event.preventDefault();
                        }}
                        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-xs font-bold transition ${
                          link.href
                            ? 'border-slate-300 hover:border-primary hover:text-primary dark:border-slate-700'
                            : 'cursor-not-allowed border-slate-200 text-slate-400 dark:border-slate-800'
                        }`}
                      >
                        <span className="material-symbols-outlined text-sm">{link.icon}</span>
                        {link.label}
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="font-semibold text-sm mb-3">GitHub Actions</p>
                  <div className="space-y-3">
                    <input value={integrationDraft.githubRepository} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, githubRepository: event.target.value })); }} placeholder="org/repository" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.githubBranch} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, githubBranch: event.target.value })); }} placeholder="main" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.githubLighthouseWorkflowId} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, githubLighthouseWorkflowId: event.target.value })); }} placeholder="lighthouse.yml" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.githubZapWorkflowId} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, githubZapWorkflowId: event.target.value })); }} placeholder="zap.yml" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.githubTokenSecretRef} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, githubTokenSecretRef: event.target.value })); }} placeholder="GITHUB_TOKEN_SECRET_REF" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="font-semibold text-sm mb-3">Jenkins</p>
                  <div className="space-y-3">
                    <input value={integrationDraft.jenkinsBaseUrl} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, jenkinsBaseUrl: event.target.value })); }} placeholder="https://jenkins.example.com" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.jenkinsJobName} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, jenkinsJobName: event.target.value })); }} placeholder="cognicare-prod-pipeline" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.jenkinsUsernameSecretRef} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, jenkinsUsernameSecretRef: event.target.value })); }} placeholder="JENKINS_USERNAME_SECRET_REF" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.jenkinsApiTokenSecretRef} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, jenkinsApiTokenSecretRef: event.target.value })); }} placeholder="JENKINS_API_TOKEN_SECRET_REF" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="font-semibold text-sm mb-3">Search Console</p>
                  <div className="space-y-3">
                    <input value={integrationDraft.searchConsolePropertyUri} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, searchConsolePropertyUri: event.target.value })); }} placeholder="sc-domain:cognicare.app" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.searchConsoleSitemapUrl} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, searchConsoleSitemapUrl: event.target.value })); }} placeholder="https://cognicare.app/sitemap.xml" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.searchConsoleCredentialsSecretRef} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, searchConsoleCredentialsSecretRef: event.target.value })); }} placeholder="SEARCH_CONSOLE_CREDENTIALS_REF" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="font-semibold text-sm mb-3">Sentry</p>
                  <div className="space-y-3">
                    <input value={integrationDraft.sentryDsnSecretRef} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, sentryDsnSecretRef: event.target.value })); }} placeholder="SENTRY_DSN_SECRET_REF" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.sentryEnvironment} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, sentryEnvironment: event.target.value })); }} placeholder="production" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="font-semibold text-sm mb-3">Grafana</p>
                  <div className="space-y-3">
                    <input value={integrationDraft.grafanaBaseUrl} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, grafanaBaseUrl: event.target.value })); }} placeholder="http://devops-grafana:3000" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.grafanaDashboardUid} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, grafanaDashboardUid: event.target.value })); }} placeholder="cognicare-observability" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.grafanaApiTokenSecretRef} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, grafanaApiTokenSecretRef: event.target.value })); }} placeholder="GRAFANA_API_TOKEN_SECRET_REF" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="font-semibold text-sm mb-3">Prometheus</p>
                  <div className="space-y-3">
                    <input value={integrationDraft.prometheusBaseUrl} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, prometheusBaseUrl: event.target.value })); }} placeholder="http://devops-prometheus:9090" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.prometheusJobName} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, prometheusJobName: event.target.value })); }} placeholder="cognicare_backend_local" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <p className="font-semibold text-sm mb-3">SonarQube</p>
                  <div className="space-y-3">
                    <input value={integrationDraft.sonarqubeBaseUrl} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, sonarqubeBaseUrl: event.target.value })); }} placeholder="http://devops-sonarqube:9000" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.sonarqubeProjectKey} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, sonarqubeProjectKey: event.target.value })); }} placeholder="cognicare-backend" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                    <input value={integrationDraft.sonarqubeTokenSecretRef} onChange={(event) => { resetFeedback(); setIntegrationDraft((prev) => ({ ...prev, sonarqubeTokenSecretRef: event.target.value })); }} placeholder="SONAR_TOKEN_BACKEND" className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onSaveIntegrations}
                  disabled={seoSaving}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-sm">save</span>
                  {seoSaving ? t('adminAnalytics.seo.saving') : t('adminAnalytics.seo.savePolicies')}
                </button>
              </div>
            </div>
          </SeoSectionCard>

          <div id="seo-history">
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
        </div>
      </SeoSectionCard>
    </div>
  );
}
