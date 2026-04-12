import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import{ useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

const GOAL_TEMPLATES = {
  communication: ['Follow 2-step instructions', 'Request items using words/pictures', 'Respond to greetings', 'Answer yes/no questions'],
  social: ['Take turns in play', 'Maintain personal space', 'Identify emotions in others', 'Participate in group activities'],
  academic: ['Sort objects by category', 'Match identical objects', 'Complete a 3-step task independently', 'Follow a visual schedule'],
  selfCare: ['Wash hands independently', 'Put on/remove shoes', 'Use utensils during meals', 'Brush teeth with visual guide'],
  motor: ['String beads', 'Cut with scissors on a line', 'Write first name', 'Catch a ball from 5 feet'],
  behavior: ['Transition between activities with timer', 'Wait for 2 minutes', 'Accept changes in routine', 'Use a calm-down strategy'],
};

export default function TEACCHTrackerCreator() {
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const navigate = useNavigate();
  const { authMutate } = useAuth('specialist');
  const { t } = useTranslation();

  const CATEGORIES = [
    { id: 'communication', label: t('teachCreator.categories.communication'), icon: 'chat_bubble', color: 'text-blue-500' },
    { id: 'social', label: t('teachCreator.categories.social'), icon: 'group', color: 'text-purple-500' },
    { id: 'academic', label: t('teachCreator.categories.academic'), icon: 'school', color: 'text-amber-500' },
    { id: 'selfCare', label: t('teachCreator.categories.selfCare'), icon: 'self_improvement', color: 'text-green-500' },
    { id: 'motor', label: t('teachCreator.categories.motor'), icon: 'sports_handball', color: 'text-red-500' },
    { id: 'behavior', label: t('teachCreator.categories.behavior'), icon: 'psychology', color: 'text-cyan-500' },
  ];

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('communication');
  const [goals, setGoals] = useState([]);
  const [customGoal, setCustomGoal] = useState('');
  const [workSystem, setWorkSystem] = useState({ steps: [''], visualSchedule: true, leftToRight: true });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { if (!childId) setError(t('teachCreator.childRequired')); }, [childId, t]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/specialist/dashboard/children');
  };

  const addGoal = (text) => {
    if (!text || goals.find(g => g.text === text)) return;
    setGoals([...goals, { id: Date.now().toString(), text, status: 'not_started', notes: '' }]);
  };

  const removeGoal = (id) => setGoals(goals.filter(g => g.id !== id));

  const updateGoal = (id, field, value) => setGoals(goals.map(g => g.id === id ? { ...g, [field]: value } : g));

  const addWorkStep = () => setWorkSystem({ ...workSystem, steps: [...workSystem.steps, ''] });

  const updateWorkStep = (i, val) => {
    const steps = [...workSystem.steps];
    steps[i] = val;
    setWorkSystem({ ...workSystem, steps });
  };

  const removeWorkStep = (i) => setWorkSystem({ ...workSystem, steps: workSystem.steps.filter((_, idx) => idx !== i) });

  const handleSave = async () => {
    if (!childId || !title || goals.length === 0) { setError(t('teachCreator.validationError')); return; }
    setLoading(true);
    try {
      await authMutate('/specialized-plans', {
        body: { childId, type: 'TEACCH', title, content: { category, goals, workSystem } },
      });
      setSuccess('Tracker saved!');
      setTimeout(() => navigate('/specialist/dashboard/children'), 1200);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const statusColors = { not_started: 'bg-slate-100 text-slate-500', in_progress: 'bg-amber-100 text-amber-700', mastered: 'bg-success/10 text-success' };
  const statusLabels = { not_started: t('teachCreator.status.not_started'), in_progress: t('teachCreator.status.in_progress'), mastered: t('teachCreator.status.mastered') };
  const inputCls = 'w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold">{t('teachCreator.title')}</h1>
              <p className="text-xs text-slate-500">{t('teachCreator.subtitle')}</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={loading} className="px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark disabled:opacity-50 transition-colors">
            {loading ? t('teachCreator.saving') : t('teachCreator.saveTracker')}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium mb-4">{error}</div>}
        {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium mb-4">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Setup */}
          <div className="space-y-4">
            {/* Title */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-5">
              <label className="block text-sm font-bold mb-2">{t('teachCreator.planTitle')}</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('teachCreator.titlePlaceholder')} className={inputCls} />
            </div>

            {/* Category */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-5">
              <label className="block text-sm font-bold mb-3">{t('teachCreator.category')}</label>
              <div className="grid grid-cols-2 gap-2">
                {CATEGORIES.map(c => (
                  <button key={c.id} onClick={() => setCategory(c.id)} className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors ${category === c.id ? 'bg-primary/10 text-primary border-2 border-primary' : 'bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 border-2 border-transparent'}`}>
                    <span className={`material-symbols-outlined text-sm ${c.color}`}>{c.icon}</span>
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Goal Templates */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-5">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
                {t('teachCreator.quickAddGoals')}
              </h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {(GOAL_TEMPLATES[category] || []).map(t => (
                  <button key={t} onClick={() => addGoal(t)} disabled={goals.find(g => g.text === t)} className="w-full text-left p-2 rounded-lg text-xs hover:bg-primary/5 disabled:opacity-40 disabled:cursor-not-allowed transition-colors truncate">
                    + {t}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <input type="text" value={customGoal} onChange={e => setCustomGoal(e.target.value)} placeholder={t('teachCreator.customGoalPlaceholder')} className={`${inputCls} flex-1`} />
                <button onClick={() => { addGoal(customGoal); setCustomGoal(''); }} disabled={!customGoal} className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold disabled:opacity-50">
                  {t('teachCreator.add')}
                </button>
              </div>
            </div>
          </div>

          {/* Center: Goals */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-5">
              <h3 className="text-lg font-bold mb-1">{t('teachCreator.goals')} ({goals.length})</h3>
              <p className="text-xs text-slate-400 mb-4">{t('teachCreator.goalsSubtitle')}</p>

              {goals.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <span className="material-symbols-outlined text-3xl mb-2">flag</span>
                  <p className="text-sm">{t('teachCreator.emptyState')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {goals.map(goal => (
                    <div key={goal.id} className="p-4 rounded-xl border border-slate-300 dark:border-slate-700">
                      <div className="flex items-start gap-3">
                        <div className="flex-1">
                          <p className="text-sm font-medium">{goal.text}</p>
                          <select value={goal.status} onChange={e => updateGoal(goal.id, 'status', e.target.value)} className="mt-2 px-3 py-1 rounded-lg text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700">
                            {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                          </select>
                        </div>
                        <button onClick={() => removeGoal(goal.id)} className="p-1 text-error hover:bg-error/5 rounded-lg">
                          <span className="material-symbols-outlined text-sm">close</span>
                        </button>
                      </div>
                      <input type="text" value={goal.notes} onChange={e => updateGoal(goal.id, 'notes', e.target.value)} placeholder={t('teachCreator.notesPlaceholder')} className="mt-2 w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs" />
                      {/* Status badge */}
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-bold ${statusColors[goal.status]}`}>
                        {statusLabels[goal.status]}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Work System */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-5">
              <h3 className="text-sm font-bold mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">view_list</span>
                {t('teachCreator.workSystem')}
              </h3>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={workSystem.visualSchedule} onChange={e => setWorkSystem({ ...workSystem, visualSchedule: e.target.checked })} className="w-4 h-4 rounded text-primary" />
                  {t('teachCreator.visualSchedule')}
                </label>
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={workSystem.leftToRight} onChange={e => setWorkSystem({ ...workSystem, leftToRight: e.target.checked })} className="w-4 h-4 rounded text-primary" />
                  {t('teachCreator.leftToRight')}
                </label>
              </div>
              <div className="space-y-2">
                {workSystem.steps.map((step, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                    <input type="text" value={step} onChange={e => updateWorkStep(i, e.target.value)} placeholder={`${t('teachCreator.step')} ${i + 1}`} className={`${inputCls} flex-1`} />
                    {workSystem.steps.length > 1 && (
                      <button onClick={() => removeWorkStep(i)} className="p-1 text-error hover:bg-error/5 rounded-lg">
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    )}
                  </div>
                ))}
                <button onClick={addWorkStep} className="w-full py-2 bg-primary/5 text-primary rounded-xl text-xs font-bold hover:bg-primary/10 transition-colors">
                  {t('teachCreator.addStep')}
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-5">
              <h3 className="text-sm font-bold mb-3">{t('teachCreator.summary')}</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-slate-500">{t('teachCreator.category')}</span><span className="font-bold">{CATEGORIES.find(c => c.id === category)?.label}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t('teachCreator.goals')}</span><span className="font-bold">{goals.length}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t('teachCreator.mastered')}</span><span className="font-bold text-success">{goals.filter(g => g.status === 'mastered').length}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t('teachCreator.inProgressCount')}</span><span className="font-bold text-amber-500">{goals.filter(g => g.status === 'in_progress').length}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">{t('teachCreator.workSteps')}</span><span className="font-bold">{workSystem.steps.filter(s => s).length}</span></div>
              </div>
              {goals.length > 0 && (
                <div className="mt-3 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden flex">
                  <div className="h-full bg-success transition-all" style={{ width: `${(goals.filter(g => g.status === 'mastered').length / goals.length) * 100}%` }} />
                  <div className="h-full bg-amber-400 transition-all" style={{ width: `${(goals.filter(g => g.status === 'in_progress').length / goals.length) * 100}%` }} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

