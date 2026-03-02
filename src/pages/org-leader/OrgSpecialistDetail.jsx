import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export default function OrgSpecialistDetail() {
  const { specialistId } = useParams();
  const navigate = useNavigate();
  const { authGet } = useAuth('orgLeader');

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
        setError(err.message || 'Failed to load specialist data');
      }
      setLoading(false);
    };
    load();
  }, [specialistId]);

  const statCards = summary ? [
    { icon: 'assignment', label: 'Total Plans', value: summary.totalPlans ?? 0, bg: 'bg-primary/10', text: 'text-primary' },
    { icon: 'child_care', label: 'Children Followed', value: summary.childrenCount ?? 0, bg: 'bg-success/10', text: 'text-success' },
    ...(summary.approvalRatePercent != null ? [{ icon: 'thumb_up', label: 'Approval Rate', value: `${summary.approvalRatePercent}%`, sub: `${summary.approvedCount ?? 0} of ${summary.totalFeedback ?? 0}`, bg: 'bg-warning/10', text: 'text-warning' }] : []),
    ...(summary.resultsImprovedRatePercent != null ? [{ icon: 'trending_up', label: 'Improvement Rate', value: `${summary.resultsImprovedRatePercent}%`, sub: `${summary.resultsImprovedTrueCount ?? 0} confirmed`, bg: 'bg-success/10', text: 'text-success' }] : []),
  ] : [];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4" />
        <p className="text-sm text-slate-500 dark:text-text-muted">Loading specialist summary"¦</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back + Header */}
      <div>
        <button onClick={() => navigate('/org/dashboard/staff')} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-primary transition-colors mb-4">
          <span className="material-symbols-outlined text-lg">arrow_back</span> Back to Staff
        </button>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">smart_toy</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Progress Summary</h2>
            {specialistInfo && (
              <p className="text-slate-500 dark:text-text-muted mt-0.5">
                {specialistInfo.name} • <span className="capitalize">{specialistInfo.role?.replace(/_/g, ' ')}</span>
                {specialistInfo.email && <span> • {specialistInfo.email}</span>}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-lg">warning</span>{error}
        </div>
      )}

      {/* Stat Cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((s, i) => (
            <div key={i} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl ${s.bg} ${s.text} flex items-center justify-center`}>
                  <span className="material-symbols-outlined">{s.icon}</span>
                </div>
                <span className="text-sm text-slate-500 dark:text-text-muted font-medium">{s.label}</span>
              </div>
              <p className="text-2xl font-black">{s.value}</p>
              {s.sub && <p className="text-xs text-slate-400 mt-1">{s.sub}</p>}
            </div>
          ))}
        </div>
      )}

      {/* Plans by Type */}
      {summary?.planCountByType && Object.keys(summary.planCountByType).length > 0 && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">category</span>
            Plans by Type
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {Object.entries(summary.planCountByType).map(([type, count]) => (
              <div key={type} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-primary">{count}</p>
                <p className="text-xs text-slate-500 mt-1 capitalize">{type.replace(/_/g, ' ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Feedback Details */}
      {summary?.totalFeedback != null && summary.totalFeedback > 0 && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">rate_review</span>
            Feedback Details
          </h3>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Approved', value: summary.approvedCount ?? 0, color: 'text-success' },
              { label: 'Modified', value: summary.modifiedCount ?? 0, color: 'text-warning' },
              { label: 'Dismissed', value: summary.dismissedCount ?? 0, color: 'text-error' },
            ].map(fb => (
              <div key={fb.label} className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 text-center">
                <p className={`text-2xl font-black ${fb.color}`}>{fb.value}</p>
                <p className="text-xs text-slate-500 mt-1">{fb.label}</p>
              </div>
            ))}
          </div>
          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex h-3 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
              {summary.totalFeedback > 0 && (
                <>
                  <div className="bg-success transition-all" style={{ width: `${((summary.approvedCount || 0) / summary.totalFeedback) * 100}%` }} />
                  <div className="bg-warning transition-all" style={{ width: `${((summary.modifiedCount || 0) / summary.totalFeedback) * 100}%` }} />
                  <div className="bg-error transition-all" style={{ width: `${((summary.dismissedCount || 0) / summary.totalFeedback) * 100}%` }} />
                </>
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-success inline-block" /> Approved</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-warning inline-block" /> Modified</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-error inline-block" /> Dismissed</span>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!summary && !error && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-12 text-center">
          <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-600 mb-3">analytics</span>
          <p className="text-slate-500 dark:text-text-muted">No data available for this specialist yet.</p>
        </div>
      )}
    </div>
  );
}

