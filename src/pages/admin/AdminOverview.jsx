import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StatCard from '../../components/ui/StatCard';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardAssistantContext } from '../../assistant/useDashboardAssistantContext';

function summarizeAiHealth(aiDiagnostics) {
  const summary = aiDiagnostics?.summary || {};
  const working = Number(summary.working || 0);
  const attention = Number(summary.attention || 0);
  const notConfigured = Number(summary.notConfigured || 0);
  if (!aiDiagnostics) {
    return {
      tone: 'warning',
      icon: 'help',
      title: 'AI diagnostics unavailable',
      subtitle: 'The admin diagnostics endpoint did not return data.',
    };
  }
  if (working > 0 && attention === 0) {
    return {
      tone: 'success',
      icon: 'check_circle',
      title: 'AI engine verified',
      subtitle: `${working} model checks working · ${notConfigured} not configured`,
    };
  }
  if (working > 0) {
    return {
      tone: 'warning',
      icon: 'warning',
      title: 'AI engine partially available',
      subtitle: `${working} working · ${attention} need attention · ${notConfigured} not configured`,
    };
  }
  return {
    tone: 'error',
    icon: 'error',
    title: 'AI engine needs attention',
    subtitle: `${attention} failing · ${notConfigured} not configured`,
  };
}

function aiBannerClasses(tone) {
  if (tone === 'success') return 'bg-success/10 border-success/20 text-success';
  if (tone === 'error') return 'bg-error/10 border-error/20 text-error';
  return 'bg-warning/10 border-warning/20 text-warning';
}

export default function AdminOverview() {
  const { t } = useTranslation();
  const { authGet } = useAuth('admin');
  const navigate = useNavigate();
  const { setUiContext } = useDashboardAssistantContext();
  const [stats, setStats] = useState({ users: [], orgs: [], pending: [] });
  const [loading, setLoading] = useState(true);
  const [aiDiagnostics, setAiDiagnostics] = useState(null);

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

      const aiData = await authGet('/admin/ops/ai-diagnostics', { skipCache: true }).catch(() => null);

      setStats({ users: Array.isArray(users) ? users : [], orgs: Array.isArray(orgs) ? orgs : [], pending: Array.isArray(pending) ? pending : [], families: Array.isArray(families) ? families : [] });
      setAiDiagnostics(aiData);
    } catch (err) {
      console.error('Failed to load overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  const usersByRole = (role) => stats.users.filter(u => u.role === role).length;

  useEffect(() => {
    setUiContext({
      page: 'admin-overview',
      totalUsers: stats.users.length,
      totalOrganizations: stats.orgs.length,
      pendingReviews: stats.pending.length,
      totalFamilies: stats.families?.length || 0,
      aiConfigured: Number(aiDiagnostics?.summary?.working || 0) > 0,
    });
  }, [
    aiDiagnostics,
    setUiContext,
    stats.families,
    stats.orgs.length,
    stats.pending.length,
    stats.users.length,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">{t('adminOverview.title')}</h2>
        <p className="text-sm text-slate-500 dark:text-text-muted mt-0.5 md:mt-1">{t('adminOverview.subtitle')}</p>
      </div>

      {/* AI Health Banner */}
      {(() => {
        const aiStatus = summarizeAiHealth(aiDiagnostics);
        return (
        <div className={`flex items-center gap-4 p-4 rounded-xl border ${aiBannerClasses(aiStatus.tone)}`}>
          <div className="rounded-full bg-white/60 p-2 dark:bg-slate-950/30">
            <span className="material-symbols-outlined">{aiStatus.icon}</span>
          </div>
          <div>
            <p className="text-sm font-bold">{aiStatus.title}</p>
            <p className="text-xs text-slate-500 dark:text-text-muted">{aiStatus.subtitle}</p>
          </div>
        </div>
        );
      })()}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard label={t('adminOverview.totalUsers')} value={stats.users.length} icon="group" trend={`+${usersByRole('family')}`} trendLabel={t('adminOverview.families')} />
        <StatCard label={t('adminOverview.organizations')} value={stats.orgs.length} icon="corporate_fare" iconBg="bg-purple-50 dark:bg-purple-900/30" iconColor="text-purple-600" trend={`${stats.pending.length} ${t('adminOverview.pending')}`} trendLabel={t('adminOverview.reviews')} />
        <StatCard label={t('adminOverview.families')} value={stats.families?.length || 0} icon="family_restroom" iconBg="bg-orange-50 dark:bg-orange-900/30" iconColor="text-orange-600" />
        <StatCard label={t('adminOverview.pendingReviews')} value={stats.pending.length} icon="pending_actions" iconBg="bg-warning/20" iconColor="text-warning" trend={stats.pending.length > 0 ? `${stats.pending.length} ${t('adminOverview.awaiting')}` : '0'} trendLabel={t('adminOverview.decision')} />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <button
          onClick={() => navigate('/admin/dashboard/users')}
          className="flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-800 hover:border-primary/30 transition-all group"
        >
          <div className="p-2 md:p-3 rounded-xl bg-primary/10 text-primary group-hover:scale-110 transition-transform flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">person_add</span>
          </div>
          <div className="text-start min-w-0 flex-1">
            <p className="font-bold text-sm md:text-base truncate">{t('adminOverview.manageUsers')}</p>
            <p className="text-xs md:text-sm text-slate-500 dark:text-text-muted truncate">{stats.users.length} {t('adminOverview.totalUsersCount')}</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/admin/dashboard/reviews')}
          className="flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-800 hover:border-primary/30 transition-all group"
        >
          <div className="p-2 md:p-3 rounded-xl bg-warning/10 text-warning group-hover:scale-110 transition-transform flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">shield</span>
          </div>
          <div className="text-start min-w-0 flex-1">
            <p className="font-bold text-sm md:text-base truncate">{t('adminOverview.reviewOrgs')}</p>
            <p className="text-xs md:text-sm text-slate-500 dark:text-text-muted truncate">{stats.pending.length} {t('adminOverview.pendingReviewsCount')}</p>
          </div>
        </button>
        <button
          onClick={() => navigate('/admin/dashboard/system-health')}
          className="flex items-center gap-3 md:gap-4 p-4 md:p-5 rounded-xl bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-800 hover:border-primary/30 transition-all group"
        >
          <div className="p-2 md:p-3 rounded-xl bg-success/10 text-success group-hover:scale-110 transition-transform flex-shrink-0">
            <span className="material-symbols-outlined text-lg md:text-xl">monitor_heart</span>
          </div>
          <div className="text-start min-w-0 flex-1">
            <p className="font-bold text-sm md:text-base truncate">{t('adminOverview.systemHealth')}</p>
            <p className="text-xs md:text-sm text-slate-500 dark:text-text-muted truncate">{t('adminOverview.systemHealthStatus')}</p>
          </div>
        </button>
      </div>

      {/* Role Distribution */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
        <h3 className="text-base md:text-lg font-bold mb-4 md:mb-6">{t('adminOverview.userDistribution')}</h3>
        <div className="space-y-3 md:space-y-4">
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
