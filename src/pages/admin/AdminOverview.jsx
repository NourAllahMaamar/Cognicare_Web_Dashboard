import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../../components/ui/StatCard';
import { useAuth } from '../../hooks/useAuth';

export default function AdminOverview() {
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
        <h2 className="text-3xl font-bold tracking-tight">System Oversight</h2>
        <p className="text-slate-500 dark:text-text-muted mt-1">Monitor AI services health and review organization applications.</p>
      </div>

      {/* AI Health Banner */}
      {aiHealth && (
        <div className="flex items-center gap-4 p-4 rounded-xl bg-success/10 border border-success/20">
          <div className="rounded-full bg-success/20 p-2 text-success">
            <span className="material-symbols-outlined">check_circle</span>
          </div>
          <div>
            <p className="text-sm font-bold text-success">AI Services Operational</p>
            <p className="text-xs text-slate-500 dark:text-text-muted">Gemini API and Embedding Model are running normally</p>
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats.users.length} icon="group" trend={`+${usersByRole('family')}`} trendLabel="families" />
        <StatCard label="Organizations" value={stats.orgs.length} icon="corporate_fare" iconBg="bg-purple-50 dark:bg-purple-900/30" iconColor="text-purple-600" trend={`${stats.pending.length} pending`} trendLabel="reviews" />
        <StatCard label="Families" value={stats.families?.length || 0} icon="family_restroom" iconBg="bg-orange-50 dark:bg-orange-900/30" iconColor="text-orange-600" />
        <StatCard label="Pending Reviews" value={stats.pending.length} icon="pending_actions" iconBg="bg-warning/20" iconColor="text-warning" trend={stats.pending.length > 0 ? `${stats.pending.length} awaiting` : '0'} trendLabel="decision" />
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
            <p className="font-bold">Manage Users</p>
            <p className="text-sm text-slate-500 dark:text-text-muted">{stats.users.length} total users</p>
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
            <p className="font-bold">Review Organizations</p>
            <p className="text-sm text-slate-500 dark:text-text-muted">{stats.pending.length} pending reviews</p>
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
            <p className="font-bold">System Health</p>
            <p className="text-sm text-slate-500 dark:text-text-muted">All systems operational</p>
          </div>
        </button>
      </div>

      {/* Role Distribution */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-6">
        <h3 className="text-lg font-bold mb-6">User Distribution by Role</h3>
        <div className="space-y-4">
          {[
            { role: 'family', label: 'Families', color: 'bg-primary' },
            { role: 'organization_leader', label: 'Organization Leaders', color: 'bg-purple-500' },
            { role: 'psychologist', label: 'Psychologists', color: 'bg-emerald-500' },
            { role: 'speech_therapist', label: 'Speech Therapists', color: 'bg-orange-500' },
            { role: 'occupational_therapist', label: 'Occupational Therapists', color: 'bg-cyan-500' },
            { role: 'doctor', label: 'Doctors', color: 'bg-red-500' },
            { role: 'volunteer', label: 'Volunteers', color: 'bg-yellow-500' },
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

