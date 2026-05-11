import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
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

function alertPillClasses(severity) {
  if (severity === 'critical') {
    return 'text-rose-700 bg-rose-100 dark:text-rose-200 dark:bg-rose-900/30';
  }
  if (severity === 'warning') {
    return 'text-amber-700 bg-amber-100 dark:text-amber-200 dark:bg-amber-900/30';
  }
  return 'text-sky-700 bg-sky-100 dark:text-sky-200 dark:bg-sky-900/30';
}

function aiStatusClasses(status) {
  if (status === 'working') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200';
  }
  if (status === 'not_configured') {
    return 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-300';
  }
  if (status === 'quota_limited') {
    return 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200';
  }
  return 'border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-200';
}

function aiStatusLabel(status) {
  const labels = {
    working: 'Working',
    not_configured: 'Not configured',
    ended_or_invalid: 'Ended/invalid',
    auth_error: 'Auth error',
    quota_limited: 'Quota limited',
    timeout: 'Timeout',
    error: 'Error',
  };
  return labels[status] || status || 'Unknown';
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
  const { authFetch, authGet, authMutate } = useAuth('admin');
  const { t } = useTranslation();

  const initialSnapshot = readSnapshot();
  const [aiHealth, setAiHealth] = useState(initialSnapshot?.aiHealth || null);
  const [aiDiagnostics, setAiDiagnostics] = useState(initialSnapshot?.aiDiagnostics || null);
  const [probeRows, setProbeRows] = useState(Array.isArray(initialSnapshot?.probeRows) ? initialSnapshot.probeRows : []);
  const [logs, setLogs] = useState(() => getRecentApiMetrics(120));
  const [viewState, setViewState] = useState(initialSnapshot?.probeRows?.length ? 'live_degraded_with_fallback' : 'loading_initial');
  const [warning, setWarning] = useState(initialSnapshot?.warning || '');
  const [lastSnapshotAt, setLastSnapshotAt] = useState(initialSnapshot?.savedAt || null);
  const [opsDashboard, setOpsDashboard] = useState(null);
  const [opsActionPending, setOpsActionPending] = useState(false);
  const [opsActionMessage, setOpsActionMessage] = useState('');

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

  const goldenSignals = useMemo(() => {
    const recent = logs.filter((entry) => Date.now() - entry.timestamp <= 5 * 60 * 1000);
    const total = recent.length;
    const latencies = recent.map((entry) => Number(entry.durationMs || 0)).filter((value) => Number.isFinite(value));
    const errors = recent.filter((entry) => !entry.ok).length;
    const slowRequests = recent.filter((entry) => Number(entry.durationMs || 0) > 1200).length;
    return {
      trafficRpm: Math.round(total / 5),
      errorRatePct: total > 0 ? Math.round((errors / total) * 1000) / 10 : 0,
      p95LatencyMs: percentile(latencies, 95),
      p99LatencyMs: percentile(latencies, 99),
      saturationProxyPct: total > 0 ? Math.round((slowRequests / total) * 1000) / 10 : 0,
    };
  }, [logs]);

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
      { component: t('adminSystemHealth.compUsers'), path: '/users' },
      { component: t('adminSystemHealth.compOrganizations'), path: '/organization/all' },
      { component: t('adminSystemHealth.compFamilies'), path: '/organization/admin/families' },
      { component: t('adminSystemHealth.compOrgReviews'), path: '/organization/admin/pending-requests' },
      { component: t('adminSystemHealth.compAiEngine'), path: '/admin/ops/ai-diagnostics' },
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
      setAiDiagnostics(snapshot.aiDiagnostics || null);
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

  const loadOpsDashboard = useCallback(async () => {
    try {
      const data = await authGet('/admin/ops/dashboard', { skipCache: true });
      setOpsDashboard(data && typeof data === 'object' ? data : null);
    } catch {
      setOpsDashboard(null);
    }
  }, [authGet]);

  const loadHealth = useCallback(async ({ manual = false } = {}) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    if (manual) {
      setViewState('loading_initial');
    }

    const probes = [
      { component: t('adminSystemHealth.compUsers'), path: '/users', method: 'GET' },
      { component: t('adminSystemHealth.compOrganizations'), path: '/organization/all', method: 'GET' },
      { component: t('adminSystemHealth.compFamilies'), path: '/organization/admin/families', method: 'GET' },
      { component: t('adminSystemHealth.compOrgReviews'), path: '/organization/admin/pending-requests', method: 'GET' },
      { component: t('adminSystemHealth.compAiEngine'), path: '/admin/ops/ai-diagnostics', method: 'GET' },
    ];

    let aiResponse = null;
    let hadFailure = false;

    try {
      const diagnosticsPath = `/admin/ops/ai-diagnostics${manual ? '?refresh=true' : ''}`;
      const [aiProbe, probeResults] = await Promise.all([
        fetchWithTimeout((signal) => authFetch(diagnosticsPath, { method: 'GET', signal })).catch(() => null),
        Promise.all(probes.map((probe) => runProbeWithRetry(probe))),
      ]);

      aiResponse = aiProbe;
      const probeFailure = probeResults.some((probe) => !probe.ok);
      hadFailure = probeFailure;

      const aiPayload = aiProbe?.ok ? await aiProbe.json() : null;
      setAiHealth(aiPayload);
      setAiDiagnostics(aiPayload);

      if (!probeFailure) {
        setProbeRows(probeResults);
        setViewState('live_ok');
        setWarning('');

        const snapshot = {
          aiHealth: aiPayload,
          aiDiagnostics: aiPayload,
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
      void loadOpsDashboard();
      inFlightRef.current = false;
      if (!manual) {
        scheduleNextPoll(hadFailure || !aiResponse?.ok);
      }
    }
  }, [applyFallback, authFetch, loadOpsDashboard, runProbeWithRetry, scheduleNextPoll, t]);

  useEffect(() => {
    void loadHealth({ manual: false });
    void loadOpsDashboard();
    return () => {
      if (pollTimerRef.current) {
        window.clearTimeout(pollTimerRef.current);
      }
    };
  }, [loadHealth, loadOpsDashboard]);

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

  const exportCountermeasuresCsv = useCallback(() => {
    const rows = opsDashboard?.enforcement?.actionHistory || [];
    const headers = ['timestamp', 'action', 'target', 'actor', 'reason', 'result'];
    const dataRows = rows.map((row) => [
      new Date(row.timestamp).toISOString(),
      row.action || '',
      row.target || '',
      row.actor || '',
      (row.reason || '').replaceAll(',', ';'),
      row.result || '',
    ]);
    const csv = [headers.join(','), ...dataRows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `ops-countermeasures-${Date.now()}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [opsDashboard]);

  const runOpsAction = useCallback(async (action) => {
    setOpsActionPending(true);
    setOpsActionMessage('');
    try {
      await action();
      setOpsActionMessage(t('adminSystemHealth.opsActionSuccess', { defaultValue: 'Action applied.' }));
      await loadOpsDashboard();
    } catch (error) {
      setOpsActionMessage(
        error?.message || t('adminSystemHealth.opsActionFailed', { defaultValue: 'Action failed.' }),
      );
    } finally {
      setOpsActionPending(false);
    }
  }, [loadOpsDashboard, t]);

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
          onClick={() => {
            void loadHealth({ manual: true });
            void loadOpsDashboard();
          }}
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
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-4">
              <div>
                <h3 className="font-bold text-sm md:text-base">AI Engine Models</h3>
                <p className="mt-1 text-xs text-slate-500 dark:text-text-muted">
                  Admin-only provider checks for configured Gemini, Groq, and OpenAI model routes.
                </p>
              </div>
              {aiDiagnostics?.generatedAt ? (
                <span className="text-xs text-slate-500 dark:text-text-muted">
                  {new Date(aiDiagnostics.generatedAt).toLocaleString()}
                </span>
              ) : null}
            </div>
            {Array.isArray(aiDiagnostics?.models) && aiDiagnostics.models.length ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {aiDiagnostics.models.map((model) => (
                  <div key={`${model.provider}-${model.feature}-${model.model}`} className="rounded-xl border border-slate-200 p-3 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{model.feature}</p>
                        <p className="mt-1 text-xs font-mono text-slate-500 dark:text-text-muted truncate">
                          {model.provider} · {model.model}
                        </p>
                      </div>
                      <span className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-bold ${aiStatusClasses(model.status)}`}>
                        {aiStatusLabel(model.status)}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-slate-500 dark:text-text-muted">
                      {model.reason}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-500 dark:text-text-muted">
                      {model.latencyMs ? <span>{model.latencyMs} ms</span> : null}
                      <span>{model.configured ? 'API key configured' : 'API key missing'}</span>
                      <span>{(model.envKeys || []).join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">No AI diagnostics have been returned yet.</p>
            )}
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm md:text-base">{t('adminSystemHealth.goldenSignalsTitle', { defaultValue: 'Production Golden Signals (5 min)' })}</h3>
              <span className="text-xs text-slate-500 dark:text-text-muted">{t('adminSystemHealth.goldenSignalsHint', { defaultValue: 'Latency, traffic, errors, and saturation proxy.' })}</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-3">
                <p className="text-xs text-slate-500">{t('adminSystemHealth.signalTraffic', { defaultValue: 'Traffic' })}</p>
                <p className="text-xl font-black">{goldenSignals.trafficRpm}<span className="text-xs font-semibold ms-1">rpm</span></p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-3">
                <p className="text-xs text-slate-500">{t('adminSystemHealth.signalErrors', { defaultValue: 'Error rate' })}</p>
                <p className={`text-xl font-black ${goldenSignals.errorRatePct > 2 ? 'text-error' : 'text-success'}`}>{goldenSignals.errorRatePct}%</p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-3">
                <p className="text-xs text-slate-500">{t('adminSystemHealth.signalLatencyP95', { defaultValue: 'Latency p95' })}</p>
                <p className="text-xl font-black">{goldenSignals.p95LatencyMs}<span className="text-xs font-semibold ms-1">ms</span></p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-3">
                <p className="text-xs text-slate-500">{t('adminSystemHealth.signalLatencyP99', { defaultValue: 'Latency p99' })}</p>
                <p className="text-xl font-black">{goldenSignals.p99LatencyMs}<span className="text-xs font-semibold ms-1">ms</span></p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-3">
                <p className="text-xs text-slate-500">{t('adminSystemHealth.signalSaturation', { defaultValue: 'Saturation proxy' })}</p>
                <p className={`text-xl font-black ${goldenSignals.saturationProxyPct > 15 ? 'text-warning' : ''}`}>{goldenSignals.saturationProxyPct}%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
              <h3 className="font-bold text-sm md:text-base mb-3">{t('adminSystemHealth.securityOpsTitle', { defaultValue: 'Security Ops' })}</h3>
              {opsDashboard?.security ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">{t('adminSystemHealth.securityTotalReq', { defaultValue: 'Requests (15 min)' })}</span><span className="font-bold">{opsDashboard.security.totalRequests}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{t('adminSystemHealth.securityFailedAuth', { defaultValue: 'Failed auth' })}</span><span className={`font-bold ${opsDashboard.security.failedAuthCount > 20 ? 'text-error' : ''}`}>{opsDashboard.security.failedAuthCount}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{t('adminSystemHealth.securitySuspiciousHits', { defaultValue: 'Suspicious path hits' })}</span><span className={`font-bold ${opsDashboard.security.suspiciousPathHits > 10 ? 'text-warning' : ''}`}>{opsDashboard.security.suspiciousPathHits}</span></div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{t('adminSystemHealth.securityTopIps', { defaultValue: 'Top suspicious IPs' })}</p>
                    <div className="space-y-1 max-h-32 overflow-auto">
                      {(opsDashboard.security.suspiciousIps || []).slice(0, 5).map((ipRow) => (
                        <div key={ipRow.ip} className="flex items-center justify-between gap-2 text-xs font-mono">
                          <span className="truncate">{ipRow.ip}</span>
                          <div className="flex items-center gap-2">
                            <span>{ipRow.failedAuth}/{ipRow.total}</span>
                            <button
                              disabled={opsActionPending}
                              onClick={() => {
                                void runOpsAction(() => authMutate('/admin/ops/actions/block-ip', {
                                  method: 'POST',
                                  body: { ip: ipRow.ip, durationMinutes: 15, reason: 'Suspicious IP from Security Ops panel' },
                                }));
                              }}
                              className="px-2 py-0.5 rounded border border-rose-300 text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                            >
                              {t('adminSystemHealth.block15m', { defaultValue: 'Block 15m' })}
                            </button>
                          </div>
                        </div>
                      ))}
                      {(opsDashboard.security.suspiciousIps || []).length === 0 ? <p className="text-xs text-slate-400">{t('adminSystemHealth.none', { defaultValue: 'No alerts' })}</p> : null}
                    </div>
                  </div>
                </div>
              ) : <p className="text-sm text-slate-400">{t('adminSystemHealth.noData', { defaultValue: 'No ops data yet.' })}</p>}
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
              <h3 className="font-bold text-sm md:text-base mb-3">{t('adminSystemHealth.finopsTitle', { defaultValue: 'FinOps (efficiency proxy)' })}</h3>
              {opsDashboard?.finops ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">{t('adminSystemHealth.finopsRpm', { defaultValue: 'Req/min' })}</span><span className="font-bold">{opsDashboard.finops.requestsPerMinute}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{t('adminSystemHealth.finopsP95', { defaultValue: 'Latency p95' })}</span><span className="font-bold">{opsDashboard.finops.p95LatencyMs} ms</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{t('adminSystemHealth.finopsCompute', { defaultValue: 'Compute ms (15 min)' })}</span><span className="font-bold">{opsDashboard.finops.totalComputeMs}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">{t('adminSystemHealth.finopsEgress', { defaultValue: 'Egress bytes (15 min)' })}</span><span className="font-bold">{opsDashboard.finops.totalEgressBytes}</span></div>
                </div>
              ) : <p className="text-sm text-slate-400">{t('adminSystemHealth.noData', { defaultValue: 'No ops data yet.' })}</p>}
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
              <h3 className="font-bold text-sm md:text-base mb-3">{t('adminSystemHealth.dbAuditTitle', { defaultValue: 'DB Audit' })}</h3>
              {opsDashboard?.dbAudit ? (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span className="text-slate-500">{t('adminSystemHealth.dbTotalOps', { defaultValue: 'DB ops (15 min)' })}</span><span className="font-bold">{opsDashboard.dbAudit.totalDbOps}</span></div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{t('adminSystemHealth.dbTopCollections', { defaultValue: 'Top collections' })}</p>
                    <div className="space-y-1 max-h-28 overflow-auto">
                      {(opsDashboard.dbAudit.topCollections || []).slice(0, 5).map((row) => (
                        <div key={row.collection} className="flex justify-between text-xs font-mono">
                          <span>{row.collection}</span>
                          <span>{row.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">{t('adminSystemHealth.dbNoisyQueries', { defaultValue: 'Noisy query fingerprints' })}</p>
                    <div className="space-y-1 max-h-20 overflow-auto">
                      {(opsDashboard.dbAudit.noisyQueries || []).slice(0, 5).map((row) => (
                        <div key={row.queryHash} className="flex justify-between text-xs font-mono">
                          <span>{row.queryHash}</span>
                          <span>{row.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : <p className="text-sm text-slate-400">{t('adminSystemHealth.noData', { defaultValue: 'No ops data yet.' })}</p>}
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm md:text-base">{t('adminSystemHealth.countermeasuresTitle', { defaultValue: 'Countermeasures' })}</h3>
              {opsDashboard?.enforcement?.rateLimit ? (
                <span className="text-xs font-mono text-slate-500">
                  {opsDashboard.enforcement.rateLimit.profile} · {opsDashboard.enforcement.rateLimit.perMinuteLimit}/min
                </span>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                disabled={opsActionPending}
                onClick={() => {
                  void runOpsAction(() => authMutate('/admin/ops/actions/rate-limit-profile', {
                    method: 'POST',
                    body: { profile: 'elevated', durationMinutes: 30 },
                  }));
                }}
                className="px-3 py-1.5 rounded-lg border border-amber-300 text-amber-700 hover:bg-amber-50 text-sm font-semibold disabled:opacity-50"
              >
                {t('adminSystemHealth.raiseRate30m', { defaultValue: 'Raise rate-limit (30m)' })}
              </button>
              <button
                disabled={opsActionPending}
                onClick={() => {
                  void runOpsAction(() => authMutate('/admin/ops/actions/rate-limit-profile', {
                    method: 'POST',
                    body: { profile: 'normal' },
                  }));
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 text-sm font-semibold disabled:opacity-50"
              >
                {t('adminSystemHealth.restoreRate', { defaultValue: 'Restore normal rate-limit' })}
              </button>
            </div>
            {(opsDashboard?.enforcement?.blockedIps || []).length > 0 ? (
              <div className="mt-3 border-t border-slate-200 dark:border-slate-800 pt-3">
                <p className="text-xs text-slate-500 mb-2">{t('adminSystemHealth.blockedIpsTitle', { defaultValue: 'Temporarily blocked IPs' })}</p>
                <div className="space-y-1 max-h-28 overflow-auto">
                  {opsDashboard.enforcement.blockedIps.slice(0, 8).map((row) => (
                    <div key={row.ip} className="flex items-center justify-between gap-2 text-xs font-mono">
                      <span className="truncate">{row.ip}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">{new Date(row.blockedUntil).toLocaleTimeString()}</span>
                        <button
                          disabled={opsActionPending}
                          onClick={() => {
                            void runOpsAction(() => authMutate('/admin/ops/actions/unblock-ip', {
                              method: 'POST',
                              body: { ip: row.ip },
                            }));
                          }}
                          className="px-2 py-0.5 rounded border border-slate-300 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {t('adminSystemHealth.unblock', { defaultValue: 'Unblock' })}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {opsActionMessage ? (
              <p className="mt-3 text-xs text-slate-500">{opsActionMessage}</p>
            ) : null}
            {(opsDashboard?.enforcement?.actionHistory || []).length > 0 ? (
              <div className="mt-3 border-t border-slate-200 dark:border-slate-800 pt-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="text-xs text-slate-500">{t('adminSystemHealth.recentCountermeasures', { defaultValue: 'Recent countermeasures' })}</p>
                  <button
                    onClick={exportCountermeasuresCsv}
                    className="px-2 py-1 rounded border border-slate-300 text-xs font-semibold hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-800"
                  >
                    {t('adminSystemHealth.exportCountermeasuresCsv', { defaultValue: 'Export CSV' })}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-800">
                        <th className="text-start py-2 pe-2 text-slate-400 uppercase">{t('adminSystemHealth.colTimestamp', { defaultValue: 'Timestamp' })}</th>
                        <th className="text-start py-2 pe-2 text-slate-400 uppercase">{t('adminSystemHealth.colAction', { defaultValue: 'Action' })}</th>
                        <th className="text-start py-2 pe-2 text-slate-400 uppercase">{t('adminSystemHealth.colTarget', { defaultValue: 'Target' })}</th>
                        <th className="text-start py-2 pe-2 text-slate-400 uppercase">{t('adminSystemHealth.colActor', { defaultValue: 'Actor' })}</th>
                        <th className="text-start py-2 text-slate-400 uppercase">{t('adminSystemHealth.colResult', { defaultValue: 'Result' })}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {opsDashboard.enforcement.actionHistory.slice(0, 10).map((row) => (
                        <tr key={`${row.timestamp}-${row.action}-${row.target}`} className="border-b border-slate-100 dark:border-slate-800/50">
                          <td className="py-2 pe-2 font-mono text-slate-500">{new Date(row.timestamp).toLocaleTimeString()}</td>
                          <td className="py-2 pe-2 font-mono">{row.action}</td>
                          <td className="py-2 pe-2 font-mono">{row.target}</td>
                          <td className="py-2 pe-2 font-mono">{row.actor}</td>
                          <td className="py-2 font-mono">
                            <span className={`px-1.5 py-0.5 rounded ${row.result === 'applied' ? 'bg-success/10 text-success' : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>
                              {row.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm md:text-base">{t('adminSystemHealth.thresholdAlertsTitle', { defaultValue: 'Threshold alerts' })}</h3>
              <span className="text-xs text-slate-500">{t('adminSystemHealth.thresholdAlertsHint', { defaultValue: 'Auto-detected from current 15-minute window' })}</span>
            </div>
            {(opsDashboard?.alerts || []).length > 0 ? (
              <div className="space-y-2">
                {(opsDashboard.alerts || []).map((alert) => (
                  <div key={alert.id} className="rounded-lg border border-slate-200 dark:border-slate-800 px-3 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase ${alertPillClasses(alert.severity)}`}>{alert.severity}</span>
                      <span className="text-xs text-slate-500 font-mono">{alert.category}.{alert.metric}</span>
                    </div>
                    <p className="mt-1 text-sm">{alert.message}</p>
                    <p className="mt-1 text-xs font-mono text-slate-500">
                      {t('adminSystemHealth.thresholdCurrent', { defaultValue: 'current' })}: {alert.current} · {t('adminSystemHealth.thresholdAt', { defaultValue: 'threshold' })}: {alert.threshold}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">{t('adminSystemHealth.thresholdNoAlerts', { defaultValue: 'No threshold alerts in the current window.' })}</p>
            )}
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
              {t('adminSystemHealth.aiDebugLabel')} <span className="font-mono">{JSON.stringify(aiHealth)}</span>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
