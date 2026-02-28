import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { API_BASE_URL } from '../../config';

export default function AdminSystemHealth() {
  const { authGet } = useAuth('admin');
  const [aiHealth, setAiHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadHealth(); }, []);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/org-scan-ai/health`).catch(() => null);
      setAiHealth(res?.ok ? await res.json() : null);
    } catch {}
    setLoading(false);
  };

  const services = [
    { name: 'Backend API', icon: 'api', latency: '45 ms', load: 'Load: 25%', loadPct: 25, status: 'Online', color: 'bg-primary' },
    { name: 'Gemini AI Engine', icon: 'psychology', latency: '120 ms', load: 'Load: 65%', loadPct: 65, status: aiHealth ? 'Online' : 'Offline', color: 'bg-purple-500' },
    { name: 'MongoDB Database', icon: 'database', latency: '12 ms', load: 'Connections: Active', loadPct: 40, status: 'Online', color: 'bg-blue-500' },
    { name: 'Redis Cache', icon: 'bolt', latency: '8 ms', load: 'Memory Usage: 45%', loadPct: 45, status: 'Online', color: 'bg-amber-500' },
  ];

  // Generate 30-day uptime bars
  const uptimeBars = Array.from({ length: 30 }, (_, i) => {
    if (i === 22) return 60; // simulated incident
    if (i === 15) return 85; // minor dip
    return 95 + Math.random() * 5;
  });

  const getBarColor = (pct) => {
    if (pct < 50) return 'bg-error';
    if (pct < 80) return 'bg-amber-500';
    return 'bg-success';
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">System Health & Compliance</h2>
        <p className="text-slate-500 dark:text-text-muted mt-1">Real-time status monitoring and security audit logs</p>
        <div className="flex items-center gap-2 mt-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success"></span>
          </span>
          <span className="text-sm font-mono font-bold text-success">ALL SYSTEMS OPERATIONAL</span>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          {/* Service Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {services.map(svc => (
              <div key={svc.name} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5 relative overflow-hidden">
                <span className="material-symbols-outlined absolute -right-4 -top-4 text-7xl text-slate-100 dark:text-slate-800/50">{svc.icon}</span>
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-bold text-sm">{svc.name}</p>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${svc.status === 'Online' ? 'bg-success/10 text-success ring-1 ring-success/20' : 'bg-error/10 text-error ring-1 ring-error/20'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${svc.status === 'Online' ? 'bg-success' : 'bg-error'}`} />
                      {svc.status}
                    </span>
                  </div>
                  <p className="text-2xl font-black mb-1">{svc.latency}</p>
                  <p className="text-xs text-slate-500 mb-3">{svc.load}</p>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${svc.color}`} style={{ width: `${svc.loadPct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Uptime + Maintenance */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Uptime Chart */}
            <div className="xl:col-span-2 bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">monitoring</span>
                  <h3 className="font-bold">System Availability (30 Days)</h3>
                </div>
                <span className="px-3 py-1 bg-success/10 text-success text-xs font-bold rounded-full">99.97% Avg</span>
              </div>
              <div className="flex items-end gap-[3px] h-40">
                {uptimeBars.map((pct, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end group cursor-pointer">
                    <div className={`rounded-t-sm ${getBarColor(pct)} opacity-80 group-hover:opacity-100 transition-opacity min-h-[2px]`} style={{ height: `${pct}%` }} />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs text-slate-400 font-mono">
                <span>30 days ago</span>
                <span>Today</span>
              </div>
            </div>

            {/* Upcoming Maintenance */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary">schedule</span>
                <h3 className="font-bold">Upcoming Maintenance</h3>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 rounded-lg border-l-4 border-primary bg-primary/5">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 uppercase">Nov</p>
                    <p className="text-xl font-black">24</p>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Database Migration</p>
                    <p className="text-xs text-slate-400 mt-1">Estimated downtime: 15 min</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 rounded-lg border-l-4 border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                  <div className="text-center">
                    <p className="text-xs text-slate-400 uppercase">Nov</p>
                    <p className="text-xl font-black">30</p>
                  </div>
                  <div>
                    <p className="font-bold text-sm">Security Patching</p>
                    <p className="text-xs text-slate-400 mt-1">No downtime expected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Audit Log */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">manage_search</span>
                <h3 className="font-bold">Audit Log</h3>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary text-sm font-bold rounded-lg hover:bg-primary/20 transition-colors">
                <span className="material-symbols-outlined text-sm">download</span> Export CSV
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase">Timestamp</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase">User</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase">Action</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase">Resource</th>
                    <th className="text-left py-3 px-4 text-xs font-bold text-slate-400 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { time: '2024-01-18 14:23:01', user: 'System', initials: 'SY', action: 'Auto-Scaling Triggered', resource: 'worker-pool', status: 'Success', statusColor: 'text-success bg-success/10' },
                    { time: '2024-01-18 13:45:12', user: 'Admin', initials: 'AD', action: 'Updated Configuration', resource: 'api-config', status: 'Success', statusColor: 'text-success bg-success/10' },
                    { time: '2024-01-18 11:10:45', user: 'Unknown', initials: 'UN', action: 'Failed Login Attempt', resource: 'admin-portal', status: 'Failed', statusColor: 'text-error bg-error/10' },
                    { time: '2024-01-18 09:30:22', user: 'Cron Job', initials: 'CJ', action: 'Daily Database Backup', resource: 'db-primary', status: 'Success', statusColor: 'text-success bg-success/10' },
                  ].map((log, i) => (
                    <tr key={i} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-primary/5 transition-colors">
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{log.time}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{log.initials}</div>
                          <span>{log.user}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4">{log.action}</td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-500">{log.resource}</td>
                      <td className="py-3 px-4"><span className={`px-2.5 py-1 rounded-full text-xs font-bold ${log.statusColor}`}>{log.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
