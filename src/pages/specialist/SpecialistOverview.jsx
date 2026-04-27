import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import StatCard from '../../components/ui/StatCard';
import { getTypeColor } from '../../utils/planUtils';
import { useDashboardAssistantContext } from '../../assistant/useDashboardAssistantContext';

export default function SpecialistOverview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { authGet } = useAuth('specialist');
  const { setUiContext } = useDashboardAssistantContext();

  const [orgChildren, setOrgChildren] = useState([]);
  const [privateChildren, setPrivateChildren] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);

  const dedupeChildren = (items) => {
    const map = new Map();
    for (const item of items) {
      if (!item || typeof item !== 'object') continue;
      const key =
        item._id ||
        item.id ||
        item.childId ||
        `${item.fullName || ''}-${item.dateOfBirth || ''}`;
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, item);
      }
    }
    return Array.from(map.values());
  };

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [orgC, privC, plans, sug] = await Promise.all([
        authGet('/organization/my-organization/children', { ttl: 60_000 }).catch(() => []),
        authGet('/children/specialist/my-children', { ttl: 60_000 }).catch(() => []),
        authGet('/specialized-plans/my-plans').catch(() => []),
        authGet('/progress-ai/activity-suggestions', { ttl: 30_000 }).catch(() => []),
      ]);
      setOrgChildren(dedupeChildren(Array.isArray(orgC) ? orgC : []));
      setPrivateChildren(dedupeChildren(Array.isArray(privC) ? privC : []));
      setAllPlans(Array.isArray(plans) ? plans : []);
      setSuggestions(Array.isArray(sug) ? sug : []);
    } catch {}
    setLoading(false);
  };

  const pecsCount = allPlans.filter(p => p.type === 'PECS').length;
  const teacchCount = allPlans.filter(p => p.type === 'TEACCH').length;
  const totalUniqueChildren = useMemo(
    () => dedupeChildren([...orgChildren, ...privateChildren]).length,
    [orgChildren, privateChildren],
  );

  const recentPlans = allPlans.slice(0, 6);

  useEffect(() => {
    setUiContext({
      page: 'specialist-overview',
      totalChildren: totalUniqueChildren,
      organizationChildren: orgChildren.length,
      privateChildren: privateChildren.length,
      totalPlans: allPlans.length,
      pecsBoards: pecsCount,
      teacchTrackers: teacchCount,
      suggestionCount: suggestions.length,
      topSuggestions: suggestions
        .slice(0, 3)
        .map((item) =>
          typeof item === 'string'
            ? item
            : item?.suggestion || item?.text || 'Suggestion available',
        ),
    });
  }, [
    allPlans.length,
    orgChildren.length,
    pecsCount,
    privateChildren.length,
    setUiContext,
    suggestions,
    teacchCount,
    totalUniqueChildren,
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">{t('specialistDashboard.tabs.overview', 'Overview')}</h2>
        <p className="text-sm text-slate-500 dark:text-text-muted mt-0.5 md:mt-1">{t('specialistDashboard.welcome', 'Welcome to your specialist dashboard')}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <StatCard label={t('specialistDashboard.orgChildren', 'Org Children')} value={orgChildren.length} icon="groups" />
            <StatCard label={t('specialistDashboard.privatePatients', 'Private Patients')} value={privateChildren.length} icon="person" />
            <StatCard label="PECS Boards" value={pecsCount} icon="grid_view" />
            <StatCard label="TEACCH Trackers" value={teacchCount} icon="track_changes" />
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            <button onClick={() => navigate('/specialist/dashboard/children')} className="flex items-center gap-3 p-4 md:p-5 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 md:w-11 md:h-11 flex-shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><span className="material-symbols-outlined">child_care</span></div>
              <div className="text-left min-w-0 flex-1"><p className="font-bold text-sm md:text-base truncate">{t('specialistDashboard.viewChildren', 'View Children')}</p><p className="text-xs text-slate-400 truncate">{totalUniqueChildren} total</p></div>
            </button>
            <button onClick={() => navigate('/specialist/dashboard/plans')} className="flex items-center gap-3 p-4 md:p-5 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 md:w-11 md:h-11 flex-shrink-0 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center"><span className="material-symbols-outlined">assignment</span></div>
              <div className="text-left min-w-0 flex-1"><p className="font-bold text-sm md:text-base truncate">{t('specialistDashboard.myPlans', 'My Plans')}</p><p className="text-xs text-slate-400 truncate">{allPlans.length} plans</p></div>
            </button>
            <button onClick={() => navigate('/specialist/dashboard/children')} className="flex items-center gap-3 p-4 md:p-5 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 hover:shadow-lg transition-shadow">
              <div className="w-10 h-10 md:w-11 md:h-11 flex-shrink-0 rounded-xl bg-success/10 text-success flex items-center justify-center"><span className="material-symbols-outlined">add_circle</span></div>
              <div className="text-left min-w-0 flex-1"><p className="font-bold text-sm md:text-base truncate">{t('specialistDashboard.addFamily', 'Add Private Family')}</p><p className="text-xs text-slate-400 truncate">Create new family</p></div>
            </button>
          </div>

          {/* AI Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
              <h3 className="font-bold flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                {t('specialistDashboard.aiSuggestions', 'AI Activity Suggestions')}
              </h3>
              <ul className="space-y-2">
                {suggestions.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-300">
                    <span className="material-symbols-outlined text-primary text-sm mt-0.5">lightbulb</span>
                    <span>{typeof s === 'string' ? s : s.suggestion || s.text || JSON.stringify(s)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recent Plans */}
          <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{t('specialistDashboard.recentPlans', 'Recent Plans')}</h3>
              <button onClick={() => navigate('/specialist/dashboard/plans')} className="text-xs text-primary font-bold hover:underline">{t('common.viewAll', 'View All')}</button>
            </div>
            {recentPlans.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">{t('specialistDashboard.noPlans', 'No plans yet')}</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
                {recentPlans.map(plan => (
                  <div key={plan._id} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 md:p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${getTypeColor(plan.type)}`} />
                      <span className="text-xs font-bold uppercase text-slate-400">{plan.type}</span>
                    </div>
                    <p className="font-bold text-sm mb-1">{plan.title || plan.name || plan.type}</p>
                    <p className="text-xs text-slate-400">{plan.childName || plan.child?.fullName || '"”'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
