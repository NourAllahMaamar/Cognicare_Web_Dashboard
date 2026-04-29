import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

const TRIALS_COUNT = 10;
const MASTERY_THRESHOLD = 80;

export default function SkillTrackerCreator() {
  const [searchParams] = useSearchParams();
  const childId = searchParams.get('childId');
  const navigate = useNavigate();
  const { authMutate } = useAuth('specialist');
  const { t } = useTranslation();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [baselinePercent, setBaselinePercent] = useState(0);
  const [targetPercent, setTargetPercent] = useState(MASTERY_THRESHOLD);
  const [trials, setTrials] = useState(Array(TRIALS_COUNT).fill(null));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  useEffect(() => { if (!childId) setError(t('skillTracker.childRequired')); }, [childId, t]);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate('/specialist/dashboard/children');
  };

  const toggleTrial = (i) => {
    const t = [...trials];
    t[i] = t[i] === null ? 'pass' : t[i] === 'pass' ? 'fail' : null;
    setTrials(t);
  };

  const completedTrials = trials.filter(t => t !== null).length;
  const passCount = trials.filter(t => t === 'pass').length;
  const currentPercent = completedTrials > 0 ? Math.round((passCount / completedTrials) * 100) : 0;
  const mastered = currentPercent >= targetPercent && completedTrials === TRIALS_COUNT;

  const handleSave = async () => {
    if (!childId || !title) { setError(t('skillTracker.titleRequired')); return; }
    setLoading(true);
    try {
      await authMutate('/specialized-plans', {
        body: {
          childId, type: 'SkillTracker', title,
          content: { description, baselinePercent, targetPercent, trials, currentPercent, mastered, completedTrials, passCount },
        },
      });
      setSuccess(t('skillTracker.saved'));
      setTimeout(() => navigate('/specialist/dashboard/children'), 1200);
    } catch (err) { setError(err.message); }
    setLoading(false);
  };

  const inputCls = 'w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-bg-dark">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">{t('skillTracker.title')}</h1>
              <p className="text-sm text-slate-500">{t('skillTracker.subtitle')}</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={loading} className="w-full sm:w-auto px-4 md:px-6 py-2 md:py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark disabled:opacity-50 transition-colors">
            {loading ? t('skillTracker.saving') : t('skillTracker.saveTracker')}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6">
        {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium mb-4">{error}</div>}
        {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium mb-4">{success}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Settings */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-5">
              <label className="block text-sm font-bold mb-2">{t('skillTracker.skillTitle')}</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('skillTracker.titlePlaceholder')} className={inputCls} />
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-5">
              <label className="block text-sm font-bold mb-2">{t('skillTracker.description')}</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder={t('skillTracker.descriptionPlaceholder')} className={inputCls} />
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-5">
              <h3 className="text-sm font-bold mb-4">{t('skillTracker.percentages')}</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">{t('skillTracker.baseline')}</span>
                    <span className="font-bold">{baselinePercent}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={baselinePercent} onChange={e => setBaselinePercent(Number(e.target.value))} className="w-full accent-slate-400" />
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-500">{t('skillTracker.target')}</span>
                    <span className="font-bold text-success">{targetPercent}%</span>
                  </div>
                  <input type="range" min={0} max={100} value={targetPercent} onChange={e => setTargetPercent(Number(e.target.value))} className="w-full accent-success" />
                </div>
              </div>
            </div>
          </div>

          {/* Right: Trial Grid + Stats */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 text-center">
                <p className="text-2xl font-black text-primary">{passCount}<span className="text-sm font-normal text-slate-400">/{TRIALS_COUNT}</span></p>
                <p className="text-xs text-slate-500 mt-1">{t('skillTracker.correct')}</p>
              </div>
              <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 text-center">
                <p className={`text-2xl font-black ${currentPercent >= targetPercent ? 'text-success' : 'text-amber-500'}`}>{currentPercent}%</p>
                <p className="text-xs text-slate-500 mt-1">{t('skillTracker.accuracy')}</p>
              </div>
              <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 text-center">
                <p className="text-2xl font-black">{mastered ? '🏆' : '—'}</p>
                <p className="text-xs text-slate-500 mt-1">{mastered ? t('skillTracker.mastered') : t('skillTracker.inProgress')}</p>
              </div>
            </div>

            {/* Progress comparison bar */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-5">
              <h3 className="text-sm font-bold mb-3">{t('skillTracker.progressComparison')}</h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>{t('skillTracker.baseline')}</span><span>{baselinePercent}%</span></div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-400 rounded-full" style={{ width: `${baselinePercent}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>{t('skillTracker.current')}</span><span className="font-bold">{currentPercent}%</span></div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${currentPercent >= targetPercent ? 'bg-success' : 'bg-primary'}`} style={{ width: `${currentPercent}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1"><span>{t('skillTracker.target')}</span><span>{targetPercent}%</span></div>
                  <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-success/30 rounded-full" style={{ width: `${targetPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Trial Grid */}
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-5">
              <h3 className="text-sm font-bold mb-1">{t('skillTracker.trialGrid')}</h3>
              <p className="text-xs text-slate-400 mb-4">{t('skillTracker.instructions')}</p>
              <div className="grid grid-cols-5 gap-3">
                {trials.map((trial, i) => (
                  <button key={i} onClick={() => toggleTrial(i)} className={`aspect-square rounded-xl text-lg font-bold flex flex-col items-center justify-center gap-0.5 transition-all ${trial === 'pass' ? 'bg-success text-white shadow-lg shadow-success/20' : trial === 'fail' ? 'bg-error text-white shadow-lg shadow-error/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 hover:bg-slate-200'}`}>
                    <span className="text-xl">{trial === 'pass' ? '✓' : trial === 'fail' ? '✕' : ''}</span>
                    <span className="text-[10px] opacity-70">{t('skillTracker.trial')} {i + 1}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

