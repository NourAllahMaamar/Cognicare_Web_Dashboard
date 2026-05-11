/**
 * Error banner shown when the assistant encounters an error.
 * Props: { error, onRetry, onDismiss, loading, retryCount }
 */
export default function ErrorBanner({ error, onRetry, onDismiss, loading, retryCount = 0 }) {
  if (!error) return null;

  const displayError =
    retryCount >= 3
      ? `${error} Please check your internet connection.`
      : error;

  return (
    <div
      role="alert"
      className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="flex-1 min-w-0 break-words">{displayError}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              disabled={loading}
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/40"
            >
              Retry
            </button>
          )}
          {onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss error"
              className="rounded-lg p-1 text-amber-700 transition-colors hover:bg-amber-100 dark:text-amber-300 dark:hover:bg-amber-900/40"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
