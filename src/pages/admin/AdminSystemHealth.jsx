import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config';
import {
  getRecentApiMetrics,
  subscribeToApiMetrics,
} from '../../utils/performanceMonitor';

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

function routeToComponent(route = '') {
  if (!route.startsWith('/admin/dashboard')) return route || 'unknown';
  const part = route.split('/')[3] || 'overview';
  const map = {
    '': 'Overview',
    overview: 'Overview',
    organizations: 'Organizations',
    users: 'Users',
    families: 'Families',
    reviews: 'Org Reviews',
    training: 'Training',
    'caregiver-applications': 'Applications',
    analytics: 'Analytics',
    'system-health': 'System Health',
    settings: 'Settings',
  };
  return map[part] || part;
}

export default function AdminSystemHealth() {
  const { authFetch } = useAuth('admin');

  const [aiHealth, setAiHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [probeRows, setProbeRows] = useState([]);
  const [logs, setLogs] = useState(() => getRecentApiMetrics(120));

  useEffect(() => {
    const unsubscribe = subscribeToApiMetrics(() => {
      setLogs(getRecentApiMetrics(120));
    });
    return unsubscribe;
  }, []);

  const runProbes = useCallback(async () => {
    const probes = [
      { component: 'Users', path: '/users', method: 'GET' },
      { component: 'Organizations', path: '/organization/all', method: 'GET' },
      { component: 'Families', path: '/organization/admin/families', method: 'GET' },
      { component: 'Org Reviews', path: '/organization/admin/pending-requests', method: 'GET' },
      { component: 'AI Engine', path: '/org-scan-ai/health', method: 'GET', public: true },
    ];

    const results = await Promise.all(probes.map(async (p) => {
      const start = performance.now();
      let status = 0;
      try {
        const res = p.public
          ? await fetch(`${API_BASE_URL}${p.path}`)
          : await authFetch(p.path, { method: p.method });
        status = res.status;
        return {
          ...p,
          status,
          ok: res.ok,
          latencyMs: Math.round(performance.now() - start),
          checkedAt: Date.now(),
        };
      } catch {
        return {
          ...p,
          status,
          ok: false,
          latencyMs: Math.round(performance.now() - start),
          checkedAt: Date.now(),
        };
      }
    }));

    setProbeRows(results);
  }, [authFetch]);

  const loadHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/org-scan-ai/health`).catch(() => null);
      setAiHealth(res?.ok ? await res.json() : null);
      await runProbes();
    } finally {
      setLoading(false);
    }
  }, [runProbes]);

  useEffect(() => {
    loadHealth();
    const id = setInterval(loadHealth, 30_000);
    return () => clearInterval(id);
  }, [loadHealth]);

  const componentLatencyRows = useMemo(() => {
    const recent = logs.filter((l) => Date.now() - l.timestamp <= 10 * 60 * 1000);
    const bucket = recent.reduce((acc, row) => {
      const key = routeToComponent(row.route);
      if (!acc[key]) acc[key] = [];
      acc[key].push(row);
      return acc;
    }, {});

    return Object.entries(bucket)
      .map(([component, rows]) => {
        const latencies = rows.map((r) => r.durationMs || 0);
        const errors = rows.filter((r) => !r.ok).length;
        return {
          component,
          count: rows.length,
          avgMs: Math.round(latencies.reduce((s, v) => s + v, 0) / Math.max(1, latencies.length)),
          p95Ms: percentile(latencies, 95),
          errRate: Math.round((errors / Math.max(1, rows.length)) * 100),
        };
      })
      .sort((a, b) => b.avgMs - a.avgMs);
  }, [logs]);

  const exportCsv = useCallback(() => {
    const headers = ['timestamp', 'component', 'route', 'method', 'endpoint', 'latencyMs', 'status', 'ok', 'retried', 'error'];
    const rows = logs.map((l) => [
      new Date(l.timestamp).toISOString(),
      routeToComponent(l.route),
      l.route || '',
      l.method || '',
      l.path || '',
      String(l.durationMs ?? ''),
      String(l.status ?? ''),
      String(!!l.ok),
      String(!!l.retried),
      (l.error || '').replaceAll(',', ';'),
    ]);

    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-system-log-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [logs]);

  const systemStatus = probeRows.every((r) => r.ok) ? 'ALL SYSTEMS OPERATIONAL' : 'DEGRADED';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Health & Compliance</h2>
          <p className="text-slate-500 dark:text-text-muted mt-1">Live API audit log and latency monitoring per dashboard component</p>
          <div className="flex items-center gap-2 mt-3">
            <span className={`relative inline-flex h-3 w-3 rounded-full ${systemStatus === 'ALL SYSTEMS OPERATIONAL' ? 'bg-success' : 'bg-warning'}`} />
            <span className={`text-sm font-mono font-bold ${systemStatus === 'ALL SYSTEMS OPERATIONAL' ? 'text-success' : 'text-warning'}`}>{systemStatus}</span>
          </div>
        </div>
        <button
          onClick={loadHealth}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark"
        >
          <span className="material-symbols-outlined text-lg">refresh</span>
          Refresh
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
            {probeRows.map((svc) => (
              <div key={svc.component} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-bold text-sm">{svc.component}</p>
                  <span className={`text-xs font-bold ${svc.ok ? 'text-success' : 'text-error'}`}>{svc.ok ? 'Online' : 'Error'}</span>
                </div>
                <p className="text-2xl font-black">{svc.latencyMs} ms</p>
                <p className="text-xs text-slate-500 mt-1">{svc.path}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-6">
            <h3 className="font-bold mb-4">Latency by Dashboard Component (last 10 min)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase">Component</th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase">Requests</th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase">Avg</th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase">P95</th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase">Error Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {componentLatencyRows.map((r) => (
                    <tr key={r.component} className="border-b border-slate-100 dark:border-slate-800/50">
                      <td className="py-3 px-3 font-medium">{r.component}</td>
                      <td className="py-3 px-3">{r.count}</td>
                      <td className="py-3 px-3 font-mono">{r.avgMs} ms</td>
                      <td className="py-3 px-3 font-mono">{r.p95Ms} ms</td>
                      <td className={`py-3 px-3 font-mono ${r.errRate > 0 ? 'text-error' : 'text-success'}`}>{r.errRate}%</td>
                    </tr>
                  ))}
                  {componentLatencyRows.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400">No recent traffic yet. Navigate across admin pages to populate component latency.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold">Audit Log (Live API Requests)</h3>
              <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-lg hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-sm">download</span>
                Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase">Timestamp</th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase">Component</th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase">Method</th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase">Endpoint</th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase">Latency</th>
                    <th className="text-left py-3 px-3 text-xs font-bold text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-primary/5">
                      <td className="py-3 px-3 font-mono text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                      <td className="py-3 px-3">{routeToComponent(log.route)}</td>
                      <td className="py-3 px-3 font-mono">{log.method}</td>
                      <td className="py-3 px-3 font-mono text-xs text-slate-500">{log.path}</td>
                      <td className="py-3 px-3 font-mono">{log.durationMs} ms</td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${log.ok ? 'text-success bg-success/10' : 'text-error bg-error/10'}`}>
                          {log.status || 'ERR'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">No API log entries yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {aiHealth && (
            <div className="text-xs text-slate-500">AI health endpoint response: <span className="font-mono">{JSON.stringify(aiHealth)}</span></div>
          )}
        </>
      )}
    </div>
  );
}

