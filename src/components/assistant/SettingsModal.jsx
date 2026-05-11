/**
 * SettingsModal — settings panel rendered as an absolute overlay
 * INSIDE the assistant panel, not as a full-screen fixed modal.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - preferences: UserPreferences
 * - onUpdatePreference: (key, value) => void
 * - isDark: boolean — passed from parent so dark styles apply correctly
 */
export default function SettingsModal({ open, onClose, preferences, onUpdatePreference, isDark, onSearch, onExport }) {
  if (!open) return null;

  return (
    /* Overlay fills the panel (parent must be position:relative) */
    <div
      className="absolute inset-0 z-20 flex flex-col overflow-y-auto rounded-3xl"
      style={{
        background: isDark ? 'rgba(15,23,42,0.98)' : 'rgba(255,255,255,0.98)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Assistant settings"
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-5 py-4"
        style={{
          borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(226,232,240,0.8)',
        }}
      >
        <h2 className={`text-sm font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
          Assistant Settings
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings"
          className={`rounded-lg p-1.5 transition-colors ${
            isDark
              ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 px-5 py-4 space-y-6">

        {/* Panel width */}
        <fieldset>
          <legend className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Panel Width
          </legend>
          <div className="flex gap-2">
            {['compact', 'default', 'wide'].map((w) => (
              <label
                key={w}
                className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border py-2 text-xs font-medium capitalize transition-colors ${
                  preferences?.panelWidth === w
                    ? 'border-primary bg-primary/10 text-primary'
                    : isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="panelWidth"
                  value={w}
                  checked={preferences?.panelWidth === w}
                  onChange={() => onUpdatePreference('panelWidth', w)}
                  className="sr-only"
                />
                {w}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Message density */}
        <fieldset>
          <legend className={`mb-2 text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Message Density
          </legend>
          <div className="flex gap-2">
            {['compact', 'comfortable', 'spacious'].map((d) => (
              <label
                key={d}
                className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border py-2 text-xs font-medium capitalize transition-colors ${
                  preferences?.messageDensity === d
                    ? 'border-primary bg-primary/10 text-primary'
                    : isDark
                      ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <input
                  type="radio"
                  name="messageDensity"
                  value={d}
                  checked={preferences?.messageDensity === d}
                  onChange={() => onUpdatePreference('messageDensity', d)}
                  className="sr-only"
                />
                {d}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Toggles */}
        <div className="space-y-4">
          <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Behaviour
          </p>          {[
            { key: 'autoRefreshOnNavigation', label: 'Auto-refresh on navigation' },
            { key: 'showSuggestedQuestions', label: 'Show suggested questions' },
            { key: 'animations', label: 'Animations' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-3">
              <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {label}
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={!!preferences?.[key]}
                onClick={() => onUpdatePreference(key, !preferences?.[key])}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  preferences?.[key] ? 'bg-primary' : isDark ? 'bg-slate-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    preferences?.[key] ? 'translate-x-4' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        {/* Actions */}
        {(onSearch || onExport) && (
          <div className="pt-2 space-y-2">
            <p className={`text-[11px] font-semibold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Actions
            </p>
            {onSearch && (
              <button
                type="button"
                onClick={() => { onSearch(); onClose(); }}
                className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>search</span>
                Search conversation
              </button>
            )}
            {onExport && (
              <button
                type="button"
                onClick={() => { onExport(); onClose(); }}
                className={`w-full flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors ${
                  isDark ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 0, 'wght' 300" }}>download</span>
                Export conversation
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
