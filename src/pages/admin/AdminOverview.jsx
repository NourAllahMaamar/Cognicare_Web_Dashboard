import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StatCard from '../../components/ui/StatCard';
import { useAuth } from '../../hooks/useAuth';

export default function AdminOverview() {
  const { t } = useTranslation();
  const { authGet } = useAuth('admin');
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: [], orgs: [], pending: [] });
  const [loading, setLoading] = useState(true);
  const [aiHealth, setAiHealth] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [users, orgs, pending, families] = await Promise.all([
        authGet('/users').catch(() => []),
        authGet('/organization/all').catch(() => []),
        authGet('/organization/admin/pending-requests').catch(() => []),
        authGet('/organization/admin/families').catch(() => []),
      ]);

      // AI health - no auth needed
      const aiRes = await fetch('/api/v1/org-scan-ai/health').catch(() => null);
      const aiData = aiRes?.ok ? await aiRes.json() : null;

      setStats({ users: Array.isArray(users) ? users : [], orgs: Array.isArray(orgs) ? orgs : [], pending: Array.isArray(pending) ? pending : [], families: Array.isArray(families) ? families : [] });
      setAiHealth(aiData);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  const usersByRole = (role) => stats.users.filter(u => u.role === role).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">{t('adminOverview.title')}</h2>
        <p className="text-slate-500 dark:text-text-muted mt-1">{t('adminOverview.subtitle')}</p>
      </div>

      {/* AI Health Banner */}
      {aiHealth && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-success/10 border border-success/20">
          <div className="rounded-full bg-success/20 p-2 text-success">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p className="text-sm font-bold text-success">{t('adminOverview.aiOperational')}</p>
            <p className="text-xs text-slate-500 dark:text-text-muted">{t('adminOverview.aiSubtitle')}</p>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t('adminOverview.totalUsers')} value={stats.users.length} icon="group" trend={`+${usersByRole('family')}`} trendLabel={t('adminOverview.families')} />
        <StatCard label={t('adminOverview.organizations')} value={stats.orgs.length} icon="corporate_fare" iconBg="bg-purple-50 dark:bg-purple-900/30" iconColor="text-purple-600" trend={`${stats.pending.length} ${t('adminOverview.pending')}`} trendLabel={t('adminOverview.reviews')} />
        <StatCard label={t('adminOverview.families')} value={stats.families?.length || 0} icon="family_restroom" iconBg="bg-orange-50 dark:bg-orange-900/30" iconColor="text-orange-600" />
        <StatCard label={t('adminOverview.pendingReviews')} value={stats.pending.length} icon="pending_actions" iconBg="bg-warning/20" iconColor="text-warning" trend={stats.pending.length > 0 ? `${stats.pending.length} ${t('adminOverview.awaiting')}` : '0'} trendLabel={t('adminOverview.decision')} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate('/admin/dashboard/users')}
          className="flex items-center gap-4 p-5 rounded-xl bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-800 hover:border-primary/30 transition-all group"
        >
          <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">person_add</span>
          </div>
          <div className="text-left">
            <p className="font-bold">{t('adminOverview.manageUsers')}</p>
            <p className="text-sm text-slate-500 dark:text-text-muted">{stats.users.length} {t('adminOverview.totalUsersCount')}</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/admin/dashboard/reviews')}
          className="flex items-center gap-4 p-5 rounded-xl bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-800 hover:border-primary/30 transition-all group"
        >
          <div className="p-3 rounded-xl bg-warning/10 text-warning group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">shield</span>
          </div>
          <div className="text-left">
            <p className="font-bold">{t('adminOverview.reviewOrgs')}</p>
            <p className="text-sm text-slate-500 dark:text-text-muted">{stats.pending.length} {t('adminOverview.pendingReviewsCount')}</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/admin/dashboard/system-health')}
          className="flex items-center gap-4 p-5 rounded-xl bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-800 hover:border-primary/30 transition-all group"
        >
          <div className="p-3 rounded-xl bg-success/10 text-success group-hover:scale-110 transition-transform">
            <span className="material-symbols-outlined">monitor_heart</span>
          </div>
          <div className="text-left">
            <p className="font-bold">{t('adminOverview.systemHealth')}</p>
            <p className="text-sm text-slate-500 dark:text-text-muted">{t('adminOverview.systemHealthStatus')}</p>
          </div>
        </button>
      </div>

      {/* Role Distribution */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-6">{t('adminOverview.userDistribution')}</h3>
        <div className="space-y-4">
          {[
            { role: 'family', label: t('adminOverview.roleLabels.family'), color: 'bg-primary' },
            { role: 'organization_leader', label: t('adminOverview.roleLabels.orgLeader'), color: 'bg-purple-500' },
            { role: 'psychologist', label: t('adminOverview.roleLabels.psychologist'), color: 'bg-emerald-500' },
            { role: 'speech_therapist', label: t('adminOverview.roleLabels.speechTherapist'), color: 'bg-orange-500' },
            { role: 'occupational_therapist', label: t('adminOverview.roleLabels.occupationalTherapist'), color: 'bg-cyan-500' },
            { role: 'doctor', label: t('adminOverview.roleLabels.doctor'), color: 'bg-red-500' },
            { role: 'volunteer', label: t('adminOverview.roleLabels.volunteer'), color: 'bg-yellow-500' },
          ].map(({ role, label, color }) => {
            const count = usersByRole(role);
            const pct = stats.users.length ? Math.round((count / stats.users.length) * 100) : 0;
            return (
              <div key={role}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm font-medium">{label}</span>
                  <span className="text-sm font-bold text-slate-500 dark:text-text-muted">{pct}% ({count})</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2">
                  <div className={`${color} h-2 rounded-full transition-all`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

