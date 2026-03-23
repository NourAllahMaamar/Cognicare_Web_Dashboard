import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { getTypeColor, getTypeBg } from '../../utils/planUtils';

export default function SpecialistPlans() {
  const { t } = useTranslation();
  const { authGet, authFetch } = useAuth('specialist');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [expandedPlan, setExpandedPlan] = useState(null);

  useEffect(() => { loadPlans(); }, []);

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await authGet('/specialized-plans/my-plans');
      setPlans(Array.isArray(data) ? data : []);
    } catch {}
    setLoading(false);
  };

  const handleDelete = async (plan) => {
    if (!confirm('Delete this plan?')) return;
    try {
      await authFetch(`/specialized-plans/${plan._id}`, { method: 'DELETE' });
      setSuccess('Plan deleted');
      loadPlans();
    } catch (err) { setError(err.message); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const filtered = filter === 'all' ? plans : plans.filter(p => p.type === filter);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{t('specialistDashboard.tabs.myPlans', 'My Plans')}</h2>
          <p className="text-slate-500 dark:text-text-muted mt-1">{plans.length} total plans</p>
        </div>
        <button onClick={loadPlans} className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 dark:hover:bg-slate-800">
          <span className="material-symbols-outlined text-lg">refresh</span> Refresh
        </button>
      </div>

      {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium">{success}</div>}

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'PECS', 'TEACCH', 'SkillTracker', 'Activity'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 text-sm font-bold rounded-xl transition-colors ${filter === f ? 'bg-primary text-white' : 'bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}>
            {f === 'all' ? 'All' : f} {f !== 'all' && <span className="ml-1 text-xs opacity-70">({plans.filter(p => p.type === f).length})</span>}
          </button>
        ))}
      </div>

      {/* Plans */}
      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800">
          <span className="material-symbols-outlined text-4xl mb-2">assignment</span>
          <p>No plans found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(plan => (
            <div key={plan._id} className={`bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 overflow-hidden`}>
              <div className="p-5 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors" onClick={() => setExpandedPlan(expandedPlan === plan._id ? null : plan._id)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className={`w-3 h-3 rounded-full ${getTypeColor(plan.type)}`} />
                    <div>
                      <span className="text-xs font-bold uppercase text-slate-400">{plan.type}</span>
                      <p className="font-bold">{plan.title || plan.name || plan.type}</p>
                      <p className="text-sm text-slate-500">{plan.childName || plan.child?.fullName || '"”'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); handleDelete(plan); }} className="p-2 text-error hover:bg-error/5 rounded-lg"><span className="material-symbols-outlined text-sm">delete</span></button>
                    <span className={`material-symbols-outlined transition-transform ${expandedPlan === plan._id ? 'rotate-180' : ''}`}>expand_more</span>
                  </div>
                </div>
              </div>

              {/* Expanded details */}
              {expandedPlan === plan._id && (
                <div className={`px-5 pb-5 pt-0 border-t border-slate-100 dark:border-slate-800`}>
                  <div className={`mt-4 p-4 rounded-xl ${getTypeBg(plan.type)}`}>
                    {plan.type === 'PECS' && plan.board && (
                      <div className="space-y-3">
                        <p className="font-bold text-sm">PECS Board Items</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {(plan.board.items || plan.board || []).map((item, i) => (
                            <div key={i} className="bg-white dark:bg-surface-dark rounded-lg p-3 text-center">
                              {item.imageUrl && <img src={getUploadUrl(item.imageUrl)} alt={item.label} className="w-16 h-16 object-cover rounded-lg mx-auto mb-2" onError={e => { e.target.src = '/placeholder.png'; }} />}
                              <p className="text-xs font-bold">{item.label}</p>
                              {item.trials && (
                                <div className="flex gap-0.5 justify-center mt-1">
                                  {item.trials.slice(0, 10).map((t, j) => (
                                    <span key={j} className={`w-3 h-3 rounded-sm text-[8px] flex items-center justify-center font-bold ${t.pass ? 'bg-success/20 text-success' : t.pass === false ? 'bg-error/20 text-error' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                      {t.pass ? 'âœ“' : t.pass === false ? 'âœ—' : 'Â·'}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {plan.type === 'TEACCH' && plan.workSystem && (
                      <div className="space-y-3">
                        <p className="font-bold text-sm">Work System</p>
                        <div className="grid grid-cols-2 gap-3">
                          {['whatToDo', 'howMuch', 'whenDone', 'whatNext'].map(key => (
                            <div key={key} className="bg-white dark:bg-surface-dark rounded-lg p-3">
                              <p className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1')}</p>
                              <p className="text-sm font-medium mt-0.5">{plan.workSystem[key] || '"”'}</p>
                            </div>
                          ))}
                        </div>
                        {plan.goals?.length > 0 && (
                          <div>
                            <p className="font-bold text-sm mt-3 mb-2">Goals</p>
                            {plan.goals.map((g, i) => (
                              <div key={i} className="mb-2">
                                <div className="flex justify-between text-xs mb-1">
                                  <span className="font-medium">{g.name || g.goal}</span>
                                  <span className="text-slate-400">{g.currentLevel || 0}/{g.targetLevel || 100}</span>
                                </div>
                                <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div className="h-full bg-purple-500 rounded-full" style={{ width: `${((g.currentLevel || 0) / (g.targetLevel || 100)) * 100}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {plan.type === 'SkillTracker' && (
                      <div className="space-y-2">
                        <p className="font-bold text-sm">Skill Tracker</p>
                        <p className="text-sm text-slate-500">{plan.totalTrials || 0} trials</p>
                        {plan.currentLevel != null && (
                          <div>
                            <div className="flex justify-between text-xs mb-1">
                              <span>Progress</span>
                              <span>{plan.currentLevel}/{plan.targetLevel || 100}</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className="h-full bg-success rounded-full" style={{ width: `${((plan.currentLevel || 0) / (plan.targetLevel || 100)) * 100}%` }} />
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {plan.type === 'Activity' && (
                      <div className="space-y-2">
                        <p className="font-bold text-sm">Activity Plan</p>
                        {plan.description && <p className="text-sm text-slate-500">{plan.description}</p>}
                        {plan.dueDate && <p className="text-xs text-slate-400">Due: {new Date(plan.dueDate).toLocaleDateString()}</p>}
                        {plan.status && <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${plan.status === 'completed' ? 'bg-success/10 text-success' : plan.status === 'in_progress' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>{plan.status}</span>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


