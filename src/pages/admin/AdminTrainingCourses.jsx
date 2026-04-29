import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/ui/StatusBadge';
import { useTranslation } from 'react-i18next';

/**
 * Admin: review and approve/reject autism training courses.
 * Scraped content must be validated by professionals before visible in the app.
 */
export default function AdminTrainingCourses() {
  const { authGet, authMutate } = useAuth('admin');
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [reviewing, setReviewing] = useState(null);
  const [approveDecision, setApproveDecision] = useState(true);
  const [professionalComments, setProfessionalComments] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await authGet('/training/admin/courses');
      setCourses(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err.message || t('adminTraining.noCoursesYet'));
    }
    setLoading(false);
  };

  const openReview = (course) => {
    setReviewing(course);
    setApproveDecision(course.approved !== false);
    setProfessionalComments(course.professionalComments || '');
  };

  const handleApprove = async () => {
    if (!reviewing) return;
    try {
      await authMutate(`/training/admin/courses/${reviewing.id}/approve`, {
        method: 'PATCH',
        body: {
          approved: approveDecision,
          professionalComments: professionalComments.trim() || undefined,
        },
      });
      setSuccess(approveDecision ? t('adminTraining.courseApproved') : t('adminTraining.courseNeedsWork'));
      setReviewing(null);
      loadData();
    } catch (err) {
      setError(err.message || t('adminTraining.updateFailed'));
    }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">{t('adminTraining.title')}</h2>
        <p className="text-sm text-slate-500 dark:text-text-muted mt-0.5 md:mt-1">
          {t('adminTraining.subtitle')}
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-error/10 text-error text-sm font-medium">{error}</div>
      )}
      {success && (
        <div className="p-3 rounded-lg bg-success/10 text-success text-sm font-medium">{success}</div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      ) : courses.length === 0 ? (
        <div className="p-8 md:p-12 text-center text-slate-400 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800">
          <span className="material-symbols-outlined text-4xl mb-2 flex-shrink-0">school</span>
          <p className="text-sm md:text-base">{t('adminTraining.noCoursesYet')}</p>
        </div>
      ) : (
        <div className="space-y-2 md:space-y-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-3 md:p-4 gap-3"
            >
              <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base md:text-lg">school</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-xs md:text-sm truncate">{course.title}</p>
                  <p className="text-[10px] md:text-xs text-slate-500 truncate">
                    {course.topics?.join(', ') || ''} • {t('adminTraining.orderLabel')} {course.order ?? 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 md:gap-3 shrink-0">
                <StatusBadge status={course.approved ? 'approved' : 'pending'} />
                <button
                  onClick={() => openReview(course)}
                  className="text-xs md:text-sm text-primary font-medium hover:underline"
                >
                  {t('adminTraining.review')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review modal */}
      {reviewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={() => setReviewing(null)}
        >
          <div
            className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 md:p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base md:text-lg font-bold truncate">{t('adminTraining.reviewModalTitle', { title: reviewing.title })}</h3>
              {reviewing.sourceUrl && (
                <a
                  href={reviewing.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline mt-1 inline-block"
                >
                  {t('adminTraining.source')}
                </a>
              )}
            </div>
            <div className="p-4 md:p-6 overflow-y-auto flex-1">
              <label className="block text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                {t('adminTraining.professionalComments')}
              </label>
              <textarea
                value={professionalComments}
                onChange={(e) => setProfessionalComments(e.target.value)}
                placeholder={t('adminTraining.commentsPlaceholder')}
                className="w-full px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm mb-4 resize-none h-24"
              />
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    checked={approveDecision === true}
                    onChange={() => setApproveDecision(true)}
                  />
                  <span className="text-sm font-medium">{t('adminTraining.optionApprove')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    checked={approveDecision === false}
                    onChange={() => setApproveDecision(false)}
                  />
                  <span className="text-sm font-medium">{t('adminTraining.optionNeedsWork')}</span>
                </label>
              </div>
            </div>
            <div className="p-4 md:p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => setReviewing(null)}
                className="flex-1 py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                {t('adminTraining.cancel')}
              </button>
              <button
                onClick={handleApprove}
                className={`flex-1 py-3 rounded-xl font-bold text-sm text-white ${
                  approveDecision
                    ? 'bg-success hover:bg-success/90'
                    : 'bg-warning hover:bg-warning/90'
                }`}
              >
                {approveDecision ? t('adminTraining.submitApprove') : t('adminTraining.submitNeedsWork')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


