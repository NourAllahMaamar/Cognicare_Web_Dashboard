// Props: { onRefresh, onClose, onSettings, onSearch, onExport, onHistory, loading, t }
export default function HeaderActions({ onRefresh, onClose, onSettings, onSearch, onExport, onHistory, loading, t }) {
  return (
    <div className="flex items-center gap-0.5 flex-shrink-0">
      {/* History / saved chats */}
      {onHistory && (
        <button
          type="button"
          onClick={onHistory}
          aria-label="Saved chats"
          className="rounded-lg p-1.5 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            history
          </span>
        </button>
      )}

      {/* Search */}
      {onSearch && (
        <button
          type="button"
          onClick={onSearch}
          aria-label={t('dashboardAssistant.search', 'Search conversation')}
          className="rounded-lg p-1.5 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            search
          </span>
        </button>
      )}

      {/* Export */}
      {onExport && (
        <button
          type="button"
          onClick={onExport}
          aria-label={t('dashboardAssistant.export', 'Export conversation')}
          className="rounded-lg p-1.5 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            download
          </span>
        </button>
      )}

      {/* Settings */}
      {onSettings && (
        <button
          type="button"
          onClick={onSettings}
          aria-label={t('dashboardAssistant.settings', 'Settings')}
          className="rounded-lg p-1.5 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
            settings
          </span>
        </button>
      )}

      {/* Refresh */}
      <button
        type="button"
        onClick={onRefresh}
        disabled={loading}
        aria-label={t('dashboardAssistant.refresh', 'Refresh')}
        className="rounded-lg p-1.5 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <span
          className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}
          style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}
        >
          refresh
        </span>
      </button>

      {/* Close */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('dashboardAssistant.close', 'Close')}
        className="rounded-lg p-1.5 text-slate-500 transition-all duration-150 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
      >
        <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>
          close
        </span>
      </button>
    </div>
  );
}
