import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

export default function OrgSpecialistDetail() {
  const { specialistId } = useParams();
  const navigate = useNavigate();
  const { authGet } = useAuth('orgLeader');
  const { t } = useTranslation();

  const [summary, setSummary] = useState(null);
  const [specialistInfo, setSpecialistInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!specialistId) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [summaryData, staff] = await Promise.all([
          authGet(`/progress-ai/org/specialist/${specialistId}/summary`).catch(() => null),
          authGet('/organization/my-organization/staff').catch(() => []),
        ]);
        setSummary(summaryData);
        const spec = Array.isArray(staff) ? staff.find(s => (s._id || s.id) === specialistId) : null;
        if (spec) setSpecialistInfo({ name: spec.fullName || 'Specialist', role: spec.role || 'specialist', email: spec.email || '', phone: spec.phone || '' });
      } catch (err) {
        setError(err.message || t('orgSpecialist.errorLoad'));
      }
      setLoading(false);
    };
    load();
  }, [specialistId]);

  const statCards = summary ? [
    { icon: 'assignment', label: t('orgSpecialist.totalPlans'), value: summary.totalPlans ?? 0, bg: 'bg-primary/10', text: 'text-primary' },
    { icon: 'child_care', label: t('orgSpecialist.childrenFollowed'), value: summary.childrenCount ?? 0, bg: 'bg-success/10', text: 'text-success' },
    ...(summary.approvalRatePercent != null ? [{ icon: 'thumb_up', label: t('orgSpecialist.approvalRate'), value: `${summary.approvalRatePercent}%`, sub: t('orgSpecialist.approvalSub', { approved: summary.approvedCount ?? 0, total: summary.totalFeedback ?? 0 }), bg: 'bg-warning/10', text: 'text-warning' }] : []),
    ...(summary.resultsImprovedRatePercent != null ? [{ icon: 'trending_up', label: t('orgSpecialist.improvementRate'), value: `${summary.resultsImprovedRatePercent}%`, sub: t('orgSpecialist.improvementSub', { count: summary.resultsImprovedTrueCount ?? 0 }), bg: 'bg-success/10', text: 'text-success' }] : []),
  ] : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
        <p className="text-sm text-slate-500 dark:text-text-muted">{t('orgSpecialist.loading')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Back + Header */}
      <div>
        <button onClick={() => navigate('/org/dashboard/staff')} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors mb-3 md:mb-4">
          <span className="material-symbols-outlined text-lg flex-shrink-0">arrow_back</span> {t('orgSpecialist.backToStaff')}
        </button>
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 flex-shrink-0 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl md:text-3xl">smart_toy</span>
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl md:text-2xl font-bold truncate">{t('orgSpecialist.title')}</h2>
            {specialistInfo && (
              <p className="text-xs md:text-sm text-slate-500 dark:text-text-muted mt-0.5 truncate">
                {specialistInfo.name} • <span className="capitalize">{specialistInfo.role?.replace(/_/g, ' ')}</span>
                {specialistInfo.email && <span> • {specialistInfo.email}</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-lg flex-shrink-0">warning</span>
          <span className="truncate">{error}</span>
        </div>
      )}

      {/* Stat Cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-5">
              <div className="flex items-center gap-2 md:gap-3 mb-3">
                <div className={`w-9 h-9 md:w-10 md:h-10 flex-shrink-0 rounded-xl ${s.bg} ${s.text} flex items-center justify-center`}>
                  <span className="material-symbols-outlined text-lg md:text-xl">{s.icon}</span>
                </div>
                <span className="text-xs md:text-sm text-slate-500 dark:text-text-muted font-medium truncate">{s.label}</span>
              </div>
              <p className="text-xl md:text-2xl font-black">{s.value}</p>
              {s.sub && <p className="text-[10px] md:text-xs text-slate-400 mt-1 truncate">{s.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Plans by Type */}
      {summary?.planCountByType && Object.keys(summary.planCountByType).length > 0 && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary flex-shrink-0">category</span>
            <span className="truncate">{t('orgSpecialist.plansByType')}</span>
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {Object.entries(summary.planCountByType).map(([type, count]) => (
              <div key={type} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 md:p-4 text-center">
                <p className="text-xl md:text-2xl font-black text-primary">{count}</p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 capitalize truncate">{type.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Details */}
      {summary?.totalFeedback != null && summary.totalFeedback > 0 && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4 md:p-6">
          <h3 className="text-base md:text-lg font-bold mb-3 md:mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary flex-shrink-0">rate_review</span>
            <span className="truncate">{t('orgSpecialist.feedbackDetails')}</span>
          </h3>
          <div className="grid grid-cols-3 gap-3 md:gap-4">
            {[
            { label: t('orgSpecialist.approved'), value: summary.approvedCount ?? 0, color: 'text-success' },
              { label: t('orgSpecialist.modified'), value: summary.modifiedCount ?? 0, color: 'text-warning' },
              { label: t('orgSpecialist.dismissed'), value: summary.dismissedCount ?? 0, color: 'text-error' },
            ].map(fb => (
              <div key={fb.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3 md:p-4 text-center">
                <p className={`text-xl md:text-2xl font-black ${fb.color}`}>{fb.value}</p>
                <p className="text-[10px] md:text-xs text-slate-500 mt-1 truncate">{fb.label}</p>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mt-3 md:mt-4">
            <div className="flex h-2 md:h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              {summary.totalFeedback > 0 && (
                <>
                  <div className="bg-success transition-all" style={{ width: `${((summary.approvedCount || 0) / summary.totalFeedback) * 100}%` }} />
                  <div className="bg-warning transition-all" style={{ width: `${((summary.modifiedCount || 0) / summary.totalFeedback) * 100}%` }} />
                  <div className="bg-error transition-all" style={{ width: `${((summary.dismissedCount || 0) / summary.totalFeedback) * 100}%` }} />
                </>
              )}
            </div>
            <div className="flex flex-wrap justify-between gap-2 mt-2 text-[10px] md:text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block flex-shrink-0" /> {t('orgSpecialist.approved')}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block flex-shrink-0" /> {t('orgSpecialist.modified')}</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error inline-block flex-shrink-0" /> {t('orgSpecialist.dismissed')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!summary && !error && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-8 md:p-12 text-center">
          <span className="material-symbols-outlined text-4xl md:text-5xl text-slate-300 dark:text-slate-600 mb-3">analytics</span>
          <p className="text-sm md:text-base text-slate-500 dark:text-text-muted">{t('orgSpecialist.noData')}</p>
        </div>
      )}
    </div>
  );
}

