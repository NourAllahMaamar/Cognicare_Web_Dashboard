import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/ui/StatCard';

export default function AdminAnalytics() {
  const { t } = useTranslation();
  const { authGet } = useAuth('admin');
  const [stats, setStats] = useState({ users: 0, orgs: 0, families: 0, pending: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

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
    } catch {}
    setLoading(false);
  };

  // Compute role distribution from user data
  const [roleData, setRoleData] = useState([]);
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const users = await authGet('/users');
        if (!Array.isArray(users)) return;
        const counts = {};
        users.forEach(u => { const r = u.role || 'unknown'; counts[r] = (counts[r] || 0) + 1; });
        const total = users.length || 1;
        const colors = { admin: '#2563EB', orgLeader: '#7c3aed', specialist: '#3b82f6', family: '#6b7280' };
        setRoleData(Object.entries(counts).map(([role, count]) => ({
          role, count, pct: Math.round((count / total) * 100),
          color: colors[role] || '#94a3b8'
        })));
      } catch {}
    };
    fetchRoles();
  }, []);

  // SVG line chart points (simulated growth data)
  const months = [
    t('adminAnalytics.months.jan'), t('adminAnalytics.months.feb'), t('adminAnalytics.months.mar'),
    t('adminAnalytics.months.apr'), t('adminAnalytics.months.may'), t('adminAnalytics.months.jun'),
    t('adminAnalytics.months.jul'), t('adminAnalytics.months.aug'), t('adminAnalytics.months.sep'),
    t('adminAnalytics.months.oct'), t('adminAnalytics.months.nov'), t('adminAnalytics.months.dec')
  ];
  const newUsers = [120, 180, 240, 310, 380, 420, 500, 560, 620, 700, 780, 850];
  const activeUsers = [80, 120, 160, 200, 260, 310, 370, 420, 480, 530, 600, 680];

  const toPath = (data, maxVal) => {
    const w = 540, h = 180;
    const points = data.map((v, i) => ({
      x: (i / (data.length - 1)) * w,
      y: h - (v / maxVal) * h
    }));
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  };

  const maxVal = Math.max(...newUsers, ...activeUsers) * 1.1;

  // Donut chart
  const planData = [
    { name: t('adminAnalytics.planTypes.pecs'), pct: 45, color: '#2563EB' },
    { name: t('adminAnalytics.planTypes.teacch'), pct: 30, color: '#7c3aed' },
    { name: t('adminAnalytics.planTypes.activities'), pct: 25, color: '#3b82f6' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('adminAnalytics.title')}</h2>
          <p className="text-slate-500 dark:text-text-muted mt-1">{t('adminAnalytics.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            <span className="material-symbols-outlined text-lg">calendar_today</span> {t('adminAnalytics.last30Days')}
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors shadow-lg shadow-primary/20">
            <span className="material-symbols-outlined text-lg">download</span> {t('adminAnalytics.exportReport')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard label={t('adminAnalytics.totalUsers')} value={stats.users.toLocaleString()} icon="group" trend="+12.5%" />
            <StatCard label={t('adminAnalytics.organizations')} value={stats.orgs.toLocaleString()} icon="corporate_fare" trend="+5.2%" />
            <StatCard label={t('adminAnalytics.families')} value={stats.families.toLocaleString()} icon="family_restroom" trend="+8.1%" />
            <StatCard label={t('adminAnalytics.pendingReviews')} value={stats.pending.toLocaleString()} icon="pending_actions" trend={stats.pending > 0 ? `${stats.pending} ${t('adminAnalytics.pending')}` : t('adminAnalytics.clear')} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* User Growth Chart */}
            <div className="xl:col-span-2 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-bold">{t('adminAnalytics.userGrowth')}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{t('adminAnalytics.userGrowthSubtitle')}</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-primary" /> {t('adminAnalytics.newUsers')}</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> {t('adminAnalytics.active')}</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <svg viewBox="0 0 560 220" className="w-full min-w-[400px]">
                  {/* Grid lines */}
                  {[0, 1, 2, 3].map(i => (
                    <line key={i} x1="0" y1={i * 60} x2="540" y2={i * 60} stroke="currentColor" className="text-slate-100 dark:text-slate-800" strokeDasharray="4" />
                  ))}
                  {/* Area under new users */}
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <path d={`${toPath(newUsers, maxVal)} L540,180 L0,180 Z`} fill="url(#areaGrad)" />
                  {/* Lines */}
                  <path d={toPath(newUsers, maxVal)} fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d={toPath(activeUsers, maxVal)} fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  {/* X-axis labels */}
                  {months.map((m, i) => (
                    <text key={m} x={(i / 11) * 540} y="200" className="fill-slate-400 text-[10px]" textAnchor="middle">{m}</text>
                  ))}
                </svg>
              </div>
            </div>

            {/* Activity Feed */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">{t('adminAnalytics.activityFeed')}</h3>
                <button className="text-xs text-primary font-bold hover:underline">{t('adminAnalytics.viewAll')}</button>
              </div>
              <div className="relative">
                <div className="absolute left-[11px] top-0 bottom-0 w-0.5 bg-slate-100 dark:bg-slate-800" />
                <div className="space-y-5">
                  {[
                    { color: 'bg-primary', title: t('adminAnalytics.activities.newOrg.title'), desc: t('adminAnalytics.activities.newOrg.desc'), time: t('adminAnalytics.activities.newOrg.time') },
                    { color: 'bg-amber-500', title: t('adminAnalytics.activities.highLoad.title'), desc: t('adminAnalytics.activities.highLoad.desc'), time: t('adminAnalytics.activities.highLoad.time') },
                    { color: 'bg-success', title: t('adminAnalytics.activities.payment.title'), desc: t('adminAnalytics.activities.payment.desc'), time: t('adminAnalytics.activities.payment.time') },
                    { color: 'bg-blue-500', title: t('adminAnalytics.activities.report.title'), desc: t('adminAnalytics.activities.report.desc'), time: t('adminAnalytics.activities.report.time') },
                    { color: 'bg-purple-500', title: t('adminAnalytics.activities.feature.title'), desc: t('adminAnalytics.activities.feature.desc'), time: t('adminAnalytics.activities.feature.time') },
                  ].map((item, i) => (
                    <div key={i} className="relative pl-8">
                      <div className={`absolute left-0 top-1 w-6 h-6 rounded-full ${item.color} ring-4 ring-white dark:ring-surface-dark flex items-center justify-center`}>
                        <div className="w-2 h-2 rounded-full bg-white" />
                      </div>
                      <p className="font-bold text-sm">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.desc}</p>
                      <p className="text-xs text-slate-300 dark:text-slate-600 mt-0.5">{item.time}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Health CTA */}
              <div className="mt-6 p-4 rounded-xl bg-primary/5 border border-primary/20">
                <p className="font-bold text-sm">{t('adminAnalytics.systemHealth')}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-success"></span>
                  </span>
                  <span className="text-xs font-bold text-success">{t('adminAnalytics.allSystemsOperational')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Plan Distribution + Users by Role */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Plan Distribution */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-6">
              <h3 className="font-bold mb-4">{t('adminAnalytics.planDistribution')}</h3>
              <div className="flex items-center gap-8">
                <div className="relative w-32 h-32 flex-shrink-0">
                  <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                    {(() => {
                      let offset = 0;
                      return planData.map((seg, i) => {
                        const dash = (seg.pct / 100) * 100;
                        const el = (
                          <circle key={i} cx="18" cy="18" r="14" fill="none" stroke={seg.color} strokeWidth="5"
                            strokeDasharray={`${dash} ${100 - dash}`} strokeDashoffset={-offset} strokeLinecap="round" />
                        );
                        offset += dash;
                        return el;
                      });
                    })()}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg font-black">{(stats.families * 1.5).toFixed(0)}</p>
                      <p className="text-[10px] text-slate-400">{t('adminAnalytics.total')}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 flex-1">
                  {planData.map(seg => (
                    <div key={seg.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: seg.color }} />
                        <span className="text-sm font-medium">{seg.name}</span>
                      </div>
                      <span className="text-sm font-bold">{seg.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Users by Role */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-6">
              <h3 className="font-bold mb-4">{t('adminAnalytics.usersByRole')}</h3>
              <div className="space-y-4">
                {(roleData.length > 0 ? roleData : [
                  { role: 'admin', count: 2, pct: 5, color: '#2563EB' },
                  { role: 'orgLeader', count: 8, pct: 15, color: '#7c3aed' },
                  { role: 'specialist', count: 20, pct: 35, color: '#3b82f6' },
                  { role: 'family', count: 25, pct: 45, color: '#6b7280' },
                ]).map(r => (
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
    </div>
  );
}


