import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/ui/StatusBadge';
import { API_BASE_URL, getUploadUrl } from '../../config';
import { useTranslation } from 'react-i18next';

export default function AdminFraudReview() {
  const { authGet, authMutate } = useAuth('admin');
  const { t } = useTranslation();
  const [pending, setPending] = useState([]);
  const [reviewed, setReviewed] = useState([]);
  const [loading, setLoading] = useState(true);
  const [subTab, setSubTab] = useState('pending');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewingOrg, setReviewingOrg] = useState(null);
  const [fraudAnalysis, setFraudAnalysis] = useState(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [aiHealth, setAiHealth] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [p, r] = await Promise.all([
        authGet('/organization/admin/pending-requests').catch(() => []),
        authGet('/organization/admin/reviewed-requests').catch(() => []),
      ]);
      setPending(Array.isArray(p) ? p : []);
      setReviewed(Array.isArray(r) ? r : []);

      const aiRes = await fetch(`${API_BASE_URL}/org-scan-ai/health`).catch(() => null);
      setAiHealth(aiRes?.ok ? await aiRes.json() : null);
    } catch {}
    setLoading(false);
  };

  const openReview = async (org) => {
    setReviewingOrg(org);
    setRejectionReason('');
    setLoadingAnalysis(true);
    try {
      const analyses = await authGet(`/org-scan-ai/organization/${org._id || org.organizationId}/analyses`);
      const latest = Array.isArray(analyses) && analyses.length > 0 ? analyses[analyses.length - 1] : null;
      setFraudAnalysis(latest);
    } catch { setFraudAnalysis(null); }
    setLoadingAnalysis(false);
  };

  const runAiScan = async (org) => {
    const orgId = org._id || org.organizationId;
    setLoadingAnalysis(true);
    try {
      const result = await authMutate(`/org-scan-ai/rescan/${orgId}`, {});
      setFraudAnalysis(result);
      setSuccess(t('adminFraud.runAiScan'));
    } catch (err) {
      setError(err.message || 'Failed to run AI scan');
      setFraudAnalysis(null);
    }
    setLoadingAnalysis(false);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleDecision = async (decision) => {
    if (!reviewingOrg) return;
    const orgId = reviewingOrg._id || reviewingOrg.organizationId;
    try {
      const body = { decision };
      if (decision === 'rejected' && rejectionReason) body.reason = rejectionReason;
      await authMutate(`/organization/admin/review/${orgId}`, { body });
      setSuccess(t('adminFraud.orgDecision', { decision }));
      setReviewingOrg(null);
      loadData();
    } catch (err) { setError(err.message); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleReReview = async (org, decision) => {
    const orgId = org._id || org.organizationId;
    try {
      await authMutate(`/organization/admin/re-review/${orgId}`, { body: { decision } });
      setSuccess(t('adminFraud.orgDecision', { decision }));
      loadData();
    } catch (err) { setError(err.message); }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const getRiskColor = (score) => {
    if (score >= 70) return 'text-error';
    if (score >= 40) return 'text-warning';
    return 'text-success';
  };

  const getRiskLevel = (score) => {
    if (score >= 70) return t('adminFraud.riskHigh');
    if (score >= 40) return t('adminFraud.riskMedium');
    return t('adminFraud.riskLow');
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">{t('adminFraud.title')}</h2>
        <p className="text-slate-500 dark:text-text-muted mt-1">{t('adminFraud.subtitle')}</p>
      </div>

      {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium">{success}</div>}

      {/* AI Health */}
      {aiHealth && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-success/10 border border-success/20">
          <span className="material-symbols-outlined text-success">check_circle</span>
          <span className="text-sm font-medium text-success">{t('adminFraud.aiOperational')}</span>
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button onClick={() => setSubTab('pending')} className={`px-6 pb-3 text-sm font-bold border-b-2 transition-colors ${subTab === 'pending' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
          {t('adminFraud.tabPending', { count: pending.length })}
        </button>
        <button onClick={() => setSubTab('history')} className={`px-6 pb-3 text-sm font-bold border-b-2 transition-colors ${subTab === 'history' ? 'border-primary text-primary' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
          {t('adminFraud.tabHistory', { count: reviewed.length })}
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
      ) : subTab === 'pending' ? (
        <div className="space-y-4">
          {pending.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800">
              <span className="material-symbols-outlined text-4xl mb-2">check_circle</span>
              <p>{t('adminFraud.noPendingReviews')}</p>
            </div>
          ) : (
            pending.map(org => (
              <div key={org._id || org.organizationId} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                      <span className="material-symbols-outlined text-2xl">corporate_fare</span>
                    </div>
                    <div>
                      <p className="font-bold">{org.organizationName || org.name}</p>
                      <p className="text-sm text-slate-500">{org.leaderName || org.leader?.fullName} • {org.leaderEmail || org.leader?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => openReview(org)} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors">{t('adminFraud.review')}</button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {reviewed.map(org => (
            <div key={org._id || org.organizationId} className="flex items-center justify-between bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined">corporate_fare</span>
                </div>
                <div>
                  <p className="font-bold text-sm">{org.organizationName || org.name}</p>
                  <p className="text-xs text-slate-500">{org.leaderEmail || org.leader?.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={org.reviewStatus || org.status || 'reviewed'} />
                <button onClick={() => handleReReview(org, 'approved')} className="text-xs text-success font-medium hover:underline">{t('adminFraud.approve')}</button>
                <button onClick={() => handleReReview(org, 'rejected')} className="text-xs text-error font-medium hover:underline">{t('adminFraud.revoke')}</button>
              </div>
            </div>
          ))}
          {reviewed.length === 0 && (
            <div className="p-12 text-center text-slate-400 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800">{t('adminFraud.noReviewHistory')}</div>
          )}
        </div>
      )}

      {/* Review Modal */}
      {reviewingOrg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setReviewingOrg(null)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-300 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{t('adminFraud.reviewModalTitle', { name: reviewingOrg.organizationName || reviewingOrg.name })}</h3>
              <button onClick={() => setReviewingOrg(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"><span className="material-symbols-outlined">close</span></button>
            </div>

            {/* Org Info */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 mb-6">
              <p className="text-sm"><strong>{t('adminFraud.leader')}</strong> {reviewingOrg.leaderName || reviewingOrg.leader?.fullName}</p>
              <p className="text-sm"><strong>{t('adminFraud.emailLabel')}</strong> {reviewingOrg.leaderEmail || reviewingOrg.leader?.email}</p>
              {reviewingOrg.certificateUrl && (
                <a href={getUploadUrl(reviewingOrg.certificateUrl)} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline mt-2 inline-block">{t('adminFraud.viewCertificate')}</a>
              )}
            </div>

            {/* Fraud Analysis */}
            {loadingAnalysis ? (
              <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
            ) : fraudAnalysis ? (
              <div className="space-y-4 mb-6">
                <h4 className="font-bold flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">shield</span>
                  {t('adminFraud.aiAnalysis')}
                  <button onClick={() => runAiScan(reviewingOrg)} className="ml-auto text-xs text-primary hover:underline font-medium inline-flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">refresh</span> {t('adminFraud.rescan')}
                  </button>
                </h4>
                <div className="flex items-center gap-6">
                  <div className="relative w-24 h-24">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className="text-slate-200 dark:text-slate-700" strokeWidth="8" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" className={getRiskColor(fraudAnalysis.riskScore || 0)} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${(fraudAnalysis.riskScore || 0) * 2.51} 251`} />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-xl font-black ${getRiskColor(fraudAnalysis.riskScore || 0)}`}>{fraudAnalysis.riskScore || 0}</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-bold">{t('adminFraud.riskLevel')} <StatusBadge status={getRiskLevel(fraudAnalysis.riskScore || 0)} /></p>
                    {fraudAnalysis.extractedInfo && (
                      <div className="mt-2 text-sm text-slate-500 space-y-1">
                        {fraudAnalysis.extractedInfo.businessName && <p>{t('adminFraud.businessLabel')} {fraudAnalysis.extractedInfo.businessName}</p>}
                        {fraudAnalysis.extractedInfo.registrationNumber && <p>{t('adminFraud.regLabel')} {fraudAnalysis.extractedInfo.registrationNumber}</p>}
                        {fraudAnalysis.extractedInfo.issuingAuthority && <p>{t('adminFraud.authorityLabel')} {fraudAnalysis.extractedInfo.issuingAuthority}</p>}
                      </div>
                    )}
                  </div>
                </div>
                {fraudAnalysis.flags?.length > 0 && (
                  <div>
                    <p className="text-sm font-bold text-error mb-2">{t('adminFraud.detectedFlags')}</p>
                    <ul className="space-y-1.5">
                      {fraudAnalysis.flags.map((flag, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="material-symbols-outlined text-error text-sm mt-0.5">warning</span>
                          <span>{typeof flag === 'string' ? flag : flag.description || flag.flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl mb-6 text-center">
                <span className="material-symbols-outlined text-4xl text-slate-300 dark:text-slate-600 mb-2">shield</span>
                <p className="text-sm text-slate-400 mb-4">{t('adminFraud.noAnalysis')}</p>
                <button onClick={() => runAiScan(reviewingOrg)} className="px-5 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary-dark transition-colors inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-lg">smart_toy</span>
                  {t('adminFraud.runAiScan')}
                </button>
              </div>
            )}

            {/* Decision */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
              <textarea value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder={t('adminFraud.notesPlaceholder')} className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm mb-4 resize-none h-20 focus:ring-2 focus:ring-primary" />
              <div className="flex gap-3">
                <button onClick={() => setReviewingOrg(null)} className="flex-1 py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800">{t('adminFraud.skip')}</button>
                <button onClick={() => handleDecision('rejected')} className="flex-1 py-3 bg-error text-white rounded-xl font-bold text-sm hover:bg-error/90">{t('adminFraud.reject')}</button>
                <button onClick={() => handleDecision('approved')} className="flex-1 py-3 bg-success text-white rounded-xl font-bold text-sm hover:bg-success/90">{t('adminFraud.approve')}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


