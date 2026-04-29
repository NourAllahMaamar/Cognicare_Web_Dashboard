import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config';
import { useTranslation } from 'react-i18next';
import {
  getRecentApiMetrics,
  subscribeToApiMetrics,
} from '../../utils/performanceMonitor';

const HEALTH_SNAPSHOT_KEY = 'adminSystemHealthSnapshot.v2';
const BASE_POLL_INTERVAL_MS = 30_000;
const MAX_POLL_INTERVAL_MS = 240_000;
const REQUEST_TIMEOUT_MS = 7_000;
const RETRY_LIMIT = 1;

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

function routeToComponent(route = '', t) {
  if (!route.startsWith('/admin/dashboard')) return route || 'unknown';
  const part = route.split('/')[3] || 'overview';
  const map = {};
  if (t) {
    map[''] = t('adminSystemHealth.compOverview');
    map.overview = t('adminSystemHealth.compOverview');
    map.organizations = t('adminSystemHealth.compOrganizations');
    map.users = t('adminSystemHealth.compUsers');
    map.families = t('adminSystemHealth.compFamilies');
    map.reviews = t('adminSystemHealth.compOrgReviews');
    map.training = t('adminSystemHealth.compTraining');
    map['caregiver-applications'] = t('adminSystemHealth.compApplications');
    map.analytics = t('adminSystemHealth.compAnalytics');
    map['system-health'] = t('adminSystemHealth.compSystemHealth');
    map.settings = t('adminSystemHealth.compSettings');
  } else {
    map[''] = 'Overview';
    map.overview = 'Overview';
    map.organizations = 'Organizations';
    map.users = 'Users';
    map.families = 'Families';
    map.reviews = 'Org Reviews';
    map.training = 'Training';
    map['caregiver-applications'] = 'Applications';
    map.analytics = 'Analytics';
    map['system-health'] = 'System Health';
    map.settings = 'Settings';
  }
  return map[part] || part;
}

function readSnapshot() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(HEALTH_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeSnapshot(snapshot) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(HEALTH_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore storage write failures.
  }
}

async function fetchWithTimeout(request, timeoutMs = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await request(controller.signal);
  } finally {
    window.clearTimeout(timer);
  }
}

export default function AdminSystemHealth() {
  const { authFetch } = useAuth('admin');
  const { t } = useTranslation();

  const initialSnapshot = readSnapshot();
  const [aiHealth, setAiHealth] = useState(initialSnapshot?.aiHealth || null);
  const [probeRows, setProbeRows] = useState(Array.isArray(initialSnapshot?.probeRows) ? initialSnapshot.probeRows : []);
  const [logs, setLogs] = useState(() => getRecentApiMetrics(120));
  const [viewState, setViewState] = useState(initialSnapshot?.probeRows?.length ? 'live_degraded_with_fallback' : 'loading_initial');
  const [warning, setWarning] = useState(initialSnapshot?.warning || '');
  const [lastSnapshotAt, setLastSnapshotAt] = useState(initialSnapshot?.savedAt || null);

  const inFlightRef = useRef(false);
  const retryCountRef = useRef(0);
  const pollTimerRef = useRef(null);

  const componentLatencyRows = useMemo(() => {
    const recent = logs.filter((entry) => Date.now() - entry.timestamp <= 10 * 60 * 1000);
    const bucket = recent.reduce((acc, row) => {
      const key = routeToComponent(row.route, t);
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});

    return Object.entries(bucket)
      .map(([component, rows]) => {
        const latencies = rows.map((row) => row.durationMs || 0);
        const errors = rows.filter((row) => !row.ok).length;
        return {
          component,
          count: rows.length,
          avgMs: Math.round(latencies.reduce((sum, value) => sum + value, 0) / Math.max(1, latencies.length)),
          p95Ms: percentile(latencies, 95),
          errRate: Math.round((errors / Math.max(1, rows.length)) * 100),
        };
      })
      .sort((a, b) => b.avgMs - a.avgMs);
  }, [logs, t]);

  const estimateProbeRowsFromLogs = useCallback(() => {
    const recent = getRecentApiMetrics(200);
    const byPath = recent.reduce((acc, row) => {
      const path = row.path || '';
      if (!path) return acc;
      if (!acc[path]) acc[path] = [];
      acc[path].push(row);
      return acc;
    }, {});

    const probes = [
      { component: 'Users', path: '/users' },
      { component: 'Organizations', path: '/organization/all' },
      { component: 'Families', path: '/organization/admin/families' },
      { component: 'Org Reviews', path: '/organization/admin/pending-requests' },
      { component: 'AI Engine', path: '/org-scan-ai/health', public: true },
    ];

    return probes.map((probe) => {
      const rows = byPath[probe.path] || [];
      const statuses = rows.map((r) => Number(r.status || 0)).filter(Boolean);
      const hasOk = rows.some((r) => r.ok);
      const avgLatency = rows.length
        ? Math.round(rows.reduce((sum, row) => sum + Number(row.durationMs || 0), 0) / rows.length)
        : REQUEST_TIMEOUT_MS;
      return {
        ...probe,
        method: 'GET',
        status: statuses.at(-1) || (hasOk ? 200 : 0),
        ok: rows.length ? hasOk : false,
        latencyMs: avgLatency,
        checkedAt: Date.now(),
        estimated: true,
      };
    });
  }, []);

  useEffect(() => {
    const unsubscribe = subscribeToApiMetrics(() => {
      setLogs(getRecentApiMetrics(120));
    });
    return unsubscribe;
  }, []);

  const runProbeWithRetry = useCallback(async (probe) => {
    let attempt = 0;
    while (attempt <= RETRY_LIMIT) {
      const start = performance.now();
      try {
        const response = await fetchWithTimeout((signal) => (
          probe.public
            ? fetch(`${API_BASE_URL}${probe.path}`, { method: probe.method, signal })
            : authFetch(probe.path, { method: probe.method, signal })
        ));

        return {
          ...probe,
          status: response.status,
          ok: response.ok,
          latencyMs: Math.round(performance.now() - start),
          checkedAt: Date.now(),
        };
      } catch {
        attempt += 1;
        if (attempt > RETRY_LIMIT) {
          return {
            ...probe,
            status: 0,
            ok: false,
            latencyMs: Math.round(performance.now() - start),
            checkedAt: Date.now(),
          };
        }
      }
    }

    return {
      ...probe,
      status: 0,
      ok: false,
      latencyMs: REQUEST_TIMEOUT_MS,
      checkedAt: Date.now(),
    };
  }, [authFetch]);

  const applyFallback = useCallback(() => {
    const snapshot = readSnapshot();
    if (snapshot?.probeRows?.length) {
      setProbeRows(snapshot.probeRows);
      setAiHealth(snapshot.aiHealth || null);
      setLastSnapshotAt(snapshot.savedAt || null);
      setWarning(t('adminSystemHealth.aiFallbackSnapshot'));
      setViewState('live_degraded_with_fallback');
      return true;
    }

    const estimated = estimateProbeRowsFromLogs();
    if (estimated.length > 0) {
      setProbeRows(estimated);
      setAiHealth(null);
      setWarning(t('adminSystemHealth.aiFallbackEstimate'));
      setViewState('live_degraded_with_fallback');
      return true;
    }

    setWarning(t('adminSystemHealth.aiFallbackNoData'));
    setViewState('error_no_data');
    return false;
  }, [estimateProbeRowsFromLogs, t]);

  const scheduleNextPoll = useCallback((hadFailure) => {
    if (pollTimerRef.current) {
      window.clearTimeout(pollTimerRef.current);
    }

    if (hadFailure) {
      retryCountRef.current = Math.min(retryCountRef.current + 1, 3);
    } else {
      retryCountRef.current = 0;
    }

    const delay = Math.min(BASE_POLL_INTERVAL_MS * Math.pow(2, retryCountRef.current), MAX_POLL_INTERVAL_MS);
    pollTimerRef.current = window.setTimeout(() => {
      void loadHealth({ manual: false });
    }, delay);
  }, []);

  const loadHealth = useCallback(async ({ manual = false } = {}) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (manual) {
      setViewState('loading_initial');
    }

    const probes = [
      { component: 'Users', path: '/users', method: 'GET' },
      { component: 'Organizations', path: '/organization/all', method: 'GET' },
      { component: 'Families', path: '/organization/admin/families', method: 'GET' },
      { component: 'Org Reviews', path: '/organization/admin/pending-requests', method: 'GET' },
      { component: 'AI Engine', path: '/org-scan-ai/health', method: 'GET', public: true },
    ];

    let aiResponse = null;
    let hadFailure = false;

    try {
      const [aiProbe, probeResults] = await Promise.all([
        fetchWithTimeout((signal) => fetch(`${API_BASE_URL}/org-scan-ai/health`, { signal })).catch(() => null),
        Promise.all(probes.map((probe) => runProbeWithRetry(probe))),
      ]);

      aiResponse = aiProbe;
      const probeFailure = probeResults.some((probe) => !probe.ok);
      hadFailure = probeFailure;

      const aiPayload = aiProbe?.ok ? await aiProbe.json() : null;
      setAiHealth(aiPayload);

      if (!probeFailure) {
        setProbeRows(probeResults);
        setViewState('live_ok');
        setWarning('');

        const snapshot = {
          aiHealth: aiPayload,
          probeRows: probeResults,
          savedAt: Date.now(),
          warning: '',
        };
        writeSnapshot(snapshot);
        setLastSnapshotAt(snapshot.savedAt);
      } else {
        applyFallback();
      }
    } catch {
      hadFailure = true;
      applyFallback();
    } finally {
      inFlightRef.current = false;
      if (!manual) {
        scheduleNextPoll(hadFailure || !aiResponse?.ok);
      }
    }
  }, [applyFallback, runProbeWithRetry, scheduleNextPoll]);

  useEffect(() => {
    void loadHealth({ manual: false });
    return () => {
      if (pollTimerRef.current) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, [loadHealth]);

  const exportCsv = useCallback(() => {
    const headers = ['timestamp', 'component', 'route', 'method', 'endpoint', 'latencyMs', 'status', 'ok', 'retried', 'error'];
    const rows = logs.map((entry) => [
      new Date(entry.timestamp).toISOString(),
      routeToComponent(entry.route),
      entry.route || '',
      entry.method || '',
      entry.path || '',
      String(entry.durationMs ?? ''),
      String(entry.status ?? ''),
      String(!!entry.ok),
      String(!!entry.retried),
      (entry.error || '').replaceAll(',', ';'),
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `admin-system-log-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const systemStatus = probeRows.length > 0 && probeRows.every((row) => row.ok)
    ? t('adminSystemHealth.allOperational')
    : t('adminSystemHealth.degraded');

  const isInitialLoading = viewState === 'loading_initial' && probeRows.length === 0;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">{t('adminSystemHealth.title')}</h2>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-0.5 md:mt-1">{t('adminSystemHealth.subtitle')}</p>
          <div className="flex items-center gap-2 mt-2 md:mt-3">
            <span className={`relative inline-flex h-3 w-3 rounded-full flex-shrink-0 ${probeRows.length > 0 && probeRows.every((row) => row.ok) ? 'bg-success' : 'bg-warning'}`} />
            <span className={`text-xs md:text-sm font-mono font-bold ${probeRows.length > 0 && probeRows.every((row) => row.ok) ? 'text-success' : 'text-warning'}`}>
              {systemStatus}
            </span>
          </div>
        </div>
        <button
          onClick={() => void loadHealth({ manual: true })}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark flex-shrink-0"
        >
          <span className="material-symbols-outlined text-lg flex-shrink-0">refresh</span>
          <span className="hidden sm:inline">{t('adminSystemHealth.refresh')}</span>
          <span className="sm:hidden">{t('adminSystemHealth.refresh')}</span>
        </button>
      </div>

      {warning ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
          <p className="font-semibold">{t('adminSystemHealth.fallbackTitle')}</p>
          <p className="mt-1">{warning}</p>
          {lastSnapshotAt ? (
            <p className="mt-1 text-xs opacity-80">
              {t('adminSystemHealth.lastSnapshot', { date: new Date(lastSnapshotAt).toLocaleString() })}
            </p>
          ) : null}
        </div>
      ) : null}

      {isInitialLoading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : viewState === 'error_no_data' ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-6 text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200">
          <p className="font-semibold">{t('adminSystemHealth.noDataTitle')}</p>
          <p className="mt-1 text-sm">{t('adminSystemHealth.noDataDescription')}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 md:gap-4">
            {probeRows.map((svc) => (
              <div key={svc.component} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-3 md:p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-xs md:text-sm truncate">{svc.component}</p>
                  <span className={`text-xs font-bold ${svc.ok ? 'text-success' : 'text-error'}`}>
                    {svc.ok ? t('adminSystemHealth.online') : t('adminSystemHealth.error')}
                  </span>
                </div>
                <p className="text-lg md:text-2xl font-black">{svc.latencyMs} ms</p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 truncate">{svc.path}</p>
                {svc.estimated ? (
                  <p className="mt-1 text-[11px] text-amber-600 dark:text-amber-300">{t('adminSystemHealth.estimated')}</p>
                ) : null}
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
            <h3 className="font-bold mb-3 md:mb-4 text-sm md:text-base">{t('adminSystemHealth.latencyTable')}</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-start py-3 px-3 text-xs font-bold text-slate-400 uppercase">{t('adminSystemHealth.colComponent')}</th>
                    <th className="text-start py-3 px-3 text-xs font-bold text-slate-400 uppercase">{t('adminSystemHealth.colRequests')}</th>
                    <th className="text-start py-3 px-3 text-xs font-bold text-slate-400 uppercase">{t('adminSystemHealth.colAvg')}</th>
                    <th className="text-start py-3 px-3 text-xs font-bold text-slate-400 uppercase">{t('adminSystemHealth.colP95')}</th>
                    <th className="text-start py-3 px-3 text-xs font-bold text-slate-400 uppercase">{t('adminSystemHealth.colErrorRate')}</th>
                  </tr>
                </thead>
                <tbody>
                  {componentLatencyRows.map((row) => (
                    <tr key={row.component} className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="py-3 px-3 font-medium">{row.component}</td>
                      <td className="py-3 px-3">{row.count}</td>
                      <td className="py-3 px-3 font-mono">{row.avgMs} ms</td>
                      <td className="py-3 px-3 font-mono">{row.p95Ms} ms</td>
                      <td className={`py-3 px-3 font-mono ${row.errRate > 0 ? 'text-error' : 'text-success'}`}>{row.errRate}%</td>
                    </tr>
                  ))}
                  {componentLatencyRows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">{t('adminSystemHealth.noTrafficYet')}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 md:mb-6">
              <h3 className="font-bold text-sm md:text-base">{t('adminSystemHealth.auditLog')}</h3>
              <button onClick={exportCsv} className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-lg hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-sm flex-shrink-0">download</span>
                <span className="hidden sm:inline">{t('adminSystemHealth.exportCsv')}</span>
                <span className="sm:hidden">{t('adminSystemHealth.exportCsv')}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-start py-3 px-3 text-xs font-bold text-slate-400 uppercase">{t('adminSystemHealth.colTimestamp')}</th>
                    <th className="text-start py-3 px-3 text-xs font-bold text-slate-400 uppercase">{t('adminSystemHealth.colComponent')}</th>
                    <th className="text-start py-3 px-3 text-xs font-bold text-slate-400 uppercase">{t('adminSystemHealth.colMethod')}</th>
                    <th className="text-start py-3 px-3 text-xs font-bold text-slate-400 uppercase">{t('adminSystemHealth.colEndpoint')}</th>
                    <th className="text-start py-3 px-3 text-xs font-bold text-slate-400 uppercase">{t('adminSystemHealth.colLatency')}</th>
                    <th className="text-start py-3 px-3 text-xs font-bold text-slate-400 uppercase">{t('adminSystemHealth.colStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((entry) => (
                    <tr key={entry.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-primary/5">
                      <td className="py-3 px-3 font-mono text-xs text-slate-500">{new Date(entry.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-3">{routeToComponent(entry.route, t)}</td>
                      <td className="py-3 px-3 font-mono">{entry.method}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-500">{entry.path}</td>
                      <td className="py-3 px-3 font-mono">{entry.durationMs} ms</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${entry.ok ? 'text-success bg-success/10' : 'text-error bg-error/10'}`}>
                          {entry.status || 'ERR'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">{t('adminSystemHealth.noLogEntries')}</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </div>

          {aiHealth ? (
            <div className="text-xs text-slate-500">
              AI health endpoint response: <span className="font-mono">{JSON.stringify(aiHealth)}</span>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
