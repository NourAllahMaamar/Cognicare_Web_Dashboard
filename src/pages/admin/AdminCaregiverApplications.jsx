import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { getUploadUrl } from '../../config';

export default function AdminCaregiverApplications() {
  const { t } = useTranslation();
  const { authGet, authMutate } = useAuth('admin');
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filter, setFilter] = useState('pending');
  const [reviewingApp, setReviewingApp] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => { fetchApplications(); }, [filter]);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const data = await authGet(`/volunteers/applications?status=${filter}`, { skipCache: true });
      setApplications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, decision) => {
    try {
      const body = { decision };
      if (decision === 'denied' && rejectionReason) {
        body.deniedReason = rejectionReason;
      }
      if (decision === 'denied' && !rejectionReason) {
        setError(t('caregiverApplications.rejectionReasonRequired'));
        setTimeout(() => setError(''), 3000);
        return;
      }
      await authMutate(`/volunteers/applications/${id}/review`, { method: 'PATCH', body });
      setSuccess(t('caregiverApplications.reviewSuccess', { status: decision === 'approved' ? t('caregiverApplications.approved') : t('caregiverApplications.denied') }));
      setReviewingApp(null);
      setRejectionReason('');
      fetchApplications();
    } catch (err) {
      setError(err.message);
    }
    setTimeout(() => { setError(''); setSuccess(''); }, 4000);
  };

  const statusColors = {
    pending: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    denied: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  const roleLabels = {
    caregiver: t('caregiverApplications.roles.caregiver'),
    psychologist: t('caregiverApplications.roles.psychologist'),
    speech_therapist: t('caregiverApplications.roles.speechTherapist'),
    occupational_therapist: t('caregiverApplications.roles.occupationalTherapist'),
    ergotherapist: t('caregiverApplications.roles.occupationalTherapist'),
    doctor: t('caregiverApplications.roles.doctor'),
    organization_leader: t('caregiverApplications.roles.orgLeader'),
    other: t('caregiverApplications.roles.other'),
  };

  const docTypeLabels = {
    id_card: t('caregiverApplications.docTypes.idCard'),
    certificate: t('caregiverApplications.docTypes.certificate'),
    diploma: t('caregiverApplications.docTypes.diploma'),
    other: t('caregiverApplications.docTypes.other'),
  };

  const pendingCount = applications.length;

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-white">{t('caregiverApplications.title')}</h2>
          <p className="text-sm text-slate-500 dark:text-text-muted mt-0.5 md:mt-1">
            {pendingCount} {t('caregiverApplications.applicationsCount')}
          </p>
        </div>
        <button onClick={fetchApplications} className="w-full sm:w-auto flex items-center justify-center gap-2 px-3 md:px-4 py-2 md:py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-600 dark:text-slate-300">
          <span className="material-symbols-outlined text-lg flex-shrink-0">refresh</span>
          <span className="hidden sm:inline">{t('caregiverApplications.refresh')}</span>
          <span className="sm:hidden">{t('caregiverApplications.refresh')}</span>
        </button>
      </div>

      {/* Messages */}
      {error && <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium">{error}</div>}
      {success && <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium">{success}</div>}

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['pending', 'approved', 'denied'].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filter === s
              ? 'bg-primary text-white shadow-lg shadow-primary/25'
              : 'bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            {s === 'pending' && 'â³ '}{s === 'approved' && 'âœ… '}{s === 'denied' && 'âŒ '}
            {t(`caregiverApplications.filters.${s}`)}
          </button>
        ))}
      </div>

      {/* Applications List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : applications.length === 0 ? (
        <div className="p-8 md:p-12 text-center text-slate-400 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800">
          <span className="material-symbols-outlined text-5xl mb-3 block flex-shrink-0">folder_open</span>
          <p className="font-medium text-sm md:text-base">{t('caregiverApplications.noApplications')}</p>
          <p className="text-xs md:text-sm mt-1">{t(`caregiverApplications.noApplicationsSub.${filter}`)}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {applications.map((app) => {
            const user = app.user || {};
            return (
              <div key={app.id} className="bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 overflow-hidden hover:shadow-lg transition-shadow">
                {/* Header */}
                <div className="p-4 md:p-5 border-b border-slate-100 dark:border-slate-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-base md:text-lg flex-shrink-0">
                        {user.fullName?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm md:text-base text-slate-900 dark:text-white truncate">{user.fullName || t('caregiverApplications.unknownUser')}</p>
                        <p className="text-xs md:text-sm text-slate-500 dark:text-text-muted truncate">{user.email}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusColors[app.status]}`}>
                      {t(`caregiverApplications.filters.${app.status}`)}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div className="p-4 md:p-5 space-y-2 md:space-y-3">
                  {/* Role */}
                  {app.careProviderType && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-sm text-slate-400">badge</span>
                    <span className="text-slate-500 dark:text-slate-400">{t('caregiverApplications.requestedRole')}:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">{roleLabels[app.careProviderType] || app.careProviderType}</span>
                  </div>
                  )}

                  {/* Specialty */}
                  {app.specialty && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-sm text-slate-400">school</span>
                      <span className="text-slate-500 dark:text-slate-400">{t('caregiverApplications.specialty')}:</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{app.specialty}</span>
                    </div>
                  )}

                  {/* Phone */}
                  {user.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="material-symbols-outlined text-sm text-slate-400">phone</span>
                      <span className="font-medium text-slate-700 dark:text-slate-200">{user.phone}</span>
                    </div>
                  )}

                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm">
                    <span className="material-symbols-outlined text-sm text-slate-400">calendar_today</span>
                    <span className="text-slate-500 dark:text-slate-400">{t('caregiverApplications.submittedOn')}:</span>
                    <span className="font-medium text-slate-700 dark:text-slate-200">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : t('common.na')}
                    </span>
                  </div>

                  {/* Denial reason */}
                  {app.status === 'denied' && app.deniedReason && (
                    <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-400">
                      <span className="font-bold">{t('caregiverApplications.denialReason')}:</span> {app.deniedReason}
                    </div>
                  )}

                  {/* Documents */}
                  {app.documents && app.documents.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        {t('caregiverApplications.documents')} ({app.documents.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {app.documents.map((doc, i) => (
                          <button
                            key={i}
                            onClick={() => setPreviewDoc(doc)}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium hover:bg-primary/5 hover:border-primary/30 transition-all text-slate-600 dark:text-slate-300"
                          >
                            <span className="material-symbols-outlined text-base text-primary">
                              {doc.mimeType?.includes('pdf') ? 'picture_as_pdf' : 'image'}
                            </span>
                            <span>{docTypeLabels[doc.type] || doc.type}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!app.documents || app.documents.length === 0) && (
                    <p className="text-xs text-slate-400 italic mt-2">{t('caregiverApplications.noDocuments')}</p>
                  )}
                </div>

                {/* Actions */}
                {app.status === 'pending' && (
                  <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                    <button
                      onClick={() => handleReview(app.id, 'approved')}
                      className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-lg">check_circle</span>
                      {t('caregiverApplications.approve')}
                    </button>
                    <button
                      onClick={() => { setReviewingApp(app); setRejectionReason(''); }}
                      className="flex-1 py-2.5 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-lg">cancel</span>
                      {t('caregiverApplications.deny')}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Rejection Modal */}
      {reviewingApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setReviewingApp(null)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-300 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">{t('caregiverApplications.denyTitle')}</h3>
              <button onClick={() => setReviewingApp(null)} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
              <p className="font-bold text-sm text-slate-700 dark:text-slate-200">{reviewingApp.user?.fullName}</p>
              <p className="text-xs text-slate-500">{reviewingApp.user?.email}</p>
            </div>
            <label className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2 block">
              {t('caregiverApplications.rejectionReasonLabel')} *
            </label>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder={t('caregiverApplications.rejectionPlaceholder')}
              className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm resize-none h-24 focus:ring-2 focus:ring-primary mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setReviewingApp(null)} className="flex-1 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                {t('caregiverApplications.cancel')}
              </button>
              <button
                onClick={() => handleReview(reviewingApp.id, 'denied')}
                className="flex-1 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors"
              >
                {t('caregiverApplications.confirmDeny')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setPreviewDoc(null)}>
          <div className="bg-white dark:bg-surface-dark rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden shadow-2xl border border-slate-300 dark:border-slate-800" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 dark:border-slate-800">
              <div className="min-w-0 flex-1">
                <h3 className="text-base md:text-lg font-bold text-slate-900 dark:text-white truncate">
                  {docTypeLabels[previewDoc.type] || previewDoc.type}
                </h3>
                {previewDoc.fileName && <p className="text-xs text-slate-500">{previewDoc.fileName}</p>}
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={getUploadUrl(previewDoc.url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-primary"
                  title={t('caregiverApplications.openInNewTab')}
                >
                  <span className="material-symbols-outlined">open_in_new</span>
                </a>
                <button onClick={() => setPreviewDoc(null)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
            </div>
            {/* Preview */}
            <div className="p-4 overflow-auto max-h-[75vh] flex items-center justify-center bg-slate-50 dark:bg-slate-900">
              {previewDoc.mimeType?.includes('pdf') ? (
                <iframe
                  src={getUploadUrl(previewDoc.url)}
                  className="w-full h-[70vh] rounded-lg border border-slate-300 dark:border-slate-700"
                  title={t('caregiverApplications.docPreview')}
                />
              ) : (
                <img
                  src={getUploadUrl(previewDoc.url)}
                  alt={previewDoc.type}
                  className="max-w-full max-h-[70vh] rounded-lg object-contain shadow-lg"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


