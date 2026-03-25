import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';

const TASK_TYPES = ['all', 'PECS', 'TEACCH', 'Activity', 'game', 'SkillTracker'];
const RANGE_PRESETS = [
  { key: '7d', days: 7 },
  { key: '30d', days: 30 },
  { key: '90d', days: 90 },
];

const EMOTION_COLORS = {
  positive: '#10b981',
  engaged: '#06b6d4',
  neutral: '#94a3b8',
  struggling: '#f59e0b',
  avoidance: '#ef4444',
  distressed: '#dc2626',
  low_energy: '#8b5cf6',
};

export default function SpecialistBehaviorAnalytics() {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { authGet } = useAuth('specialist');

  const [rangeKey, setRangeKey] = useState('30d');
  const [taskType, setTaskType] = useState('all');
  const [dashboard, setDashboard] = useState(null);
  const [insights, setInsights] = useState(null);
  const [consentInfo, setConsentInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const rangeDays = useMemo(
    () => RANGE_PRESETS.find((r) => r.key === rangeKey)?.days ?? 30,
    [rangeKey],
  );

  const querySuffix = useMemo(() => {
    const to = new Date();
    const from = new Date(to.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    const p = new URLSearchParams({
      from: from.toISOString(),
      to: to.toISOString(),
    });
    if (taskType && taskType !== 'all') p.set('taskType', taskType);
    return `?${p.toString()}`;
  }, [rangeDays, taskType]);

  const load = useCallback(async () => {
    if (!childId) return;
    setLoading(true);
    setError('');
    try {
      const [dash, ins, consent] = await Promise.all([
        authGet(`/behavior-analytics/child/${childId}/dashboard${querySuffix}`, {
          skipCache: true,
        }),
        authGet(`/behavior-analytics/child/${childId}/insights${querySuffix}`, {
          skipCache: true,
        }),
        authGet(`/behavior-analytics/child/${childId}/consent`, {
          skipCache: true,
        }),
      ]);
      setDashboard(dash);
      setInsights(ins);
      setConsentInfo(consent);
    } catch (e) {
      setError(e.message || 'Failed to load behavior analytics');
      setDashboard(null);
      setInsights(null);
    } finally {
      setLoading(false);
    }
  }, [authGet, childId, querySuffix]);

  useEffect(() => {
    load();
  }, [load]);

  const emotionPieData = useMemo(() => {
    if (!dashboard?.emotionMix) return [];
    return Object.entries(dashboard.emotionMix).map(([name, value]) => ({
      name,
      value,
    }));
  }, [dashboard]);

  const taskPerfData = useMemo(() => {
    if (!dashboard?.byTaskType) return [];
    return Object.entries(dashboard.byTaskType).map(([type, v]) => ({
      type,
      completed: v.completed ?? 0,
      abandoned: v.abandoned ?? 0,
      rate: dashboard.completionRates?.[type] ?? 0,
    }));
  }, [dashboard]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-bg-dark">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/specialist/dashboard/children')}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <span className="material-symbols-outlined">arrow_back</span>
              </button>
              <div>
                <h1 className="text-xl font-bold">
                  {t('behaviorAnalytics.title', 'Behavior analytics')}
                </h1>
                <p className="text-sm text-slate-500 dark:text-text-muted">
                  {t('behaviorAnalytics.subtitle', 'Engagement & task insights')} ·{' '}
                  <span className="font-mono text-xs">{childId}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {RANGE_PRESETS.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => setRangeKey(r.key)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    rangeKey === r.key
                      ? 'bg-primary text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t(`behaviorAnalytics.range.${r.key}`, r.key)}
                </button>
              ))}
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value)}
                className="text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-surface-dark px-3 py-1.5"
              >
                {TASK_TYPES.map((tt) => (
                  <option key={tt} value={tt}>
                    {tt === 'all'
                      ? t('behaviorAnalytics.allTaskTypes', 'All task types')
                      : tt}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto px-6 pt-6">
          <div className="p-4 bg-error/10 border border-error/20 text-error rounded-xl text-sm font-medium">
            {error}
          </div>
        </div>
      )}

      {loading && (
        <div className="max-w-6xl mx-auto px-6 py-16 text-center">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400 mt-3">
            {t('behaviorAnalytics.loading', 'Loading analytics…')}
          </p>
        </div>
      )}

      {!loading && dashboard && (
        <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
          {/* Consent & privacy */}
          <section
            className={`rounded-xl border p-5 ${
              consentInfo?.enabled
                ? 'bg-success/5 border-success/20'
                : 'bg-amber-500/5 border-amber-500/25'
            }`}
          >
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-2xl text-primary">
                {consentInfo?.enabled ? 'verified_user' : 'privacy_tip'}
              </span>
              <div>
                <h2 className="font-bold text-sm mb-1">
                  {t('behaviorAnalytics.consent.title', 'Family consent')}
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  {consentInfo?.enabled
                    ? t(
                        'behaviorAnalytics.consent.on',
                        'This family has opted in to AI-assisted behavior analysis. Data is used to surface engagement patterns and support therapy decisions.',
                      )
                    : t(
                        'behaviorAnalytics.consent.off',
                        'Behavior tracking is off by default. The family must opt in from the mobile app before interaction data is collected or analyzed.',
                      )}
                </p>
              </div>
            </div>
          </section>

          {dashboard.message && (
            <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-sm text-slate-600 dark:text-slate-300">
              {dashboard.message}
            </div>
          )}

          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase">
                {t('behaviorAnalytics.kpi.events', 'Events (period)')}
              </p>
              <p className="text-2xl font-black text-primary mt-1">
                {dashboard.eventCount ?? 0}
              </p>
            </div>
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <p className="text-xs font-bold text-slate-400 uppercase">
                {t('behaviorAnalytics.kpi.confidence', 'Data confidence')}
              </p>
              <p className="text-2xl font-black mt-1 capitalize">
                {dashboard.dataConfidence ?? '—'}
              </p>
            </div>
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-4 col-span-2">
              <p className="text-xs font-bold text-slate-400 uppercase">
                {t('behaviorAnalytics.kpi.note', 'Quality')}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                {dashboard.insufficientDataMessage ||
                  t(
                    'behaviorAnalytics.kpi.ok',
                    'Charts reflect inferred engagement labels from task events (completions, abandonments, retries, and optional emoji feedback).',
                  )}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5 min-h-[320px]">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">
                  show_chart
                </span>
                {t('behaviorAnalytics.charts.engagement', 'Daily engagement')}
              </h3>
              {(dashboard.series?.length ?? 0) === 0 ? (
                <p className="text-sm text-slate-400 text-center py-16">
                  {t('behaviorAnalytics.empty.series', 'No series data in this range.')}
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={dashboard.series}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="engagementScore"
                      name={t('behaviorAnalytics.charts.score', 'Engagement score')}
                      stroke="#6366f1"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5 min-h-[320px]">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">
                  sentiment_satisfied
                </span>
                {t('behaviorAnalytics.charts.emotion', 'Inferred response mix')}
              </h3>
              {emotionPieData.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-16">
                  {t('behaviorAnalytics.empty.emotion', 'No emotion labels yet.')}
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={emotionPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={88}
                      label
                    >
                      {emotionPieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={EMOTION_COLORS[entry.name] || '#94a3b8'}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-5 min-h-[320px] lg:col-span-2">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-lg">
                  stacked_bar_chart
                </span>
                {t('behaviorAnalytics.charts.tasks', 'Task type performance')}
              </h3>
              {taskPerfData.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-16">
                  {t('behaviorAnalytics.empty.tasks', 'No task breakdown.')}
                </p>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={taskPerfData}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                    <XAxis dataKey="type" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="completed"
                      name={t('behaviorAnalytics.charts.completed', 'Completed')}
                      fill="#10b981"
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar
                      dataKey="abandoned"
                      name={t('behaviorAnalytics.charts.abandoned', 'Abandoned')}
                      fill="#f87171"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* AI insights */}
          {insights && (
            <section className="bg-white dark:bg-surface-dark rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">psychology</span>
                {t('behaviorAnalytics.ai.title', 'AI insights & recommendations')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed">
                {insights.narrative}
              </p>
              {insights.confidenceNote && (
                <p className="text-sm text-amber-700 dark:text-amber-400/90">
                  {insights.confidenceNote}
                </p>
              )}
              {(insights.recommendations?.length ?? 0) > 0 && (
                <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
                  {insights.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <p className="text-xs text-slate-400 text-center max-w-2xl mx-auto leading-relaxed">
            {t(
              'behaviorAnalytics.footer',
              'Behavior labels are heuristic summaries, not clinical diagnoses. When data is sparse, interpret trends cautiously.',
            )}
          </p>
        </main>
      )}
    </div>
  );
}
