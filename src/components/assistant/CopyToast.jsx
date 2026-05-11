/**
 * Brief toast notification for copy success.
 * Auto-dismisses after 1.5 seconds.
 */
export default function CopyToast({ visible }) {
  if (!visible) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[80] flex items-center gap-2 rounded-full bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 shadow-lg ca-message-enter"
      role="status"
      aria-live="polite"
    >
      <span className="material-symbols-outlined text-[16px] text-success">check_circle</span>
      Copied to clipboard
    </div>
  );
}
