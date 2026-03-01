import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import StatusBadge from '../../components/ui/StatusBadge';

/**
 * Admin: review and approve/reject autism training courses.
 * Scraped content must be validated by professionals before visible in the app.
 */
export default function AdminTrainingCourses() {
  const { authGet, authMutate } = useAuth('admin');
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
      setError(err.message || 'Failed to load training courses');
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
      setSuccess(approveDecision ? 'Course approved' : 'Course marked as needs clarification');
      setReviewing(null);
      loadData();
    } catch (err) {
      setError(err.message || 'Update failed');
    }
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-2xl font-bold">Training Courses (Autism)</h2>
        <p className="text-slate-500 dark:text-text-muted mt-1">
          Review scraped training content. Approve to make visible in the app for caregivers.
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
        <div className="p-12 text-center text-slate-400 bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800">
          No training courses yet. Add courses via the scraper and API, then review them here.
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between bg-white dark:bg-surface-dark rounded-xl border border-slate-300 dark:border-slate-800 p-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined">school</span>
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-sm truncate">{course.title}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {course.topics?.join(', ') || 'â€”'} â€¢ Order: {course.order ?? 0}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <StatusBadge status={course.approved ? 'approved' : 'pending'} />
                <button
                  onClick={() => openReview(course)}
                  className="text-sm text-primary font-medium hover:underline"
                >
                  Review
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Review modal */}
      {reviewing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setReviewing(null)}
        >
          <div
            className="bg-white dark:bg-surface-dark rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold">Review: {reviewing.title}</h3>
              {reviewing.sourceUrl && (
                <a
                  href={reviewing.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-primary hover:underline mt-1 inline-block"
                >
                  Source â†’
                </a>
              )}
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">
                Professional comments
              </label>
              <textarea
                value={professionalComments}
                onChange={(e) => setProfessionalComments(e.target.value)}
                placeholder="Optional notes (e.g. needs clarification, approved for publication)"
                className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm mb-4 resize-none h-24"
              />
              <div className="flex gap-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    checked={approveDecision === true}
                    onChange={() => setApproveDecision(true)}
                  />
                  <span className="text-sm font-medium">Approve</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="decision"
                    checked={approveDecision === false}
                    onChange={() => setApproveDecision(false)}
                  />
                  <span className="text-sm font-medium">Needs clarification</span>
                </label>
              </div>
            </div>
            <div className="p-6 border-t border-slate-200 dark:border-slate-800 flex gap-3">
              <button
                onClick={() => setReviewing(null)}
                className="flex-1 py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className={`flex-1 py-3 rounded-xl font-bold text-sm text-white ${
                  approveDecision
                    ? 'bg-success hover:bg-success/90'
                    : 'bg-warning hover:bg-warning/90'
                }`}
              >
                {approveDecision ? 'Approve' : 'Mark needs clarification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


