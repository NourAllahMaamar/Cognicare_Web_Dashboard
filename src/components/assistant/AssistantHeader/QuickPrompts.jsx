/**
 * QuickPrompts — horizontally scrollable prompt chips.
 * Compact pill style that fits in the header without wrapping.
 */
export default function QuickPrompts({ prompts, onSelect, disabled, isRtl }) {
  return (
    <div
      className="mt-2 flex gap-1.5 overflow-x-auto pb-0.5 hide-scrollbar"
      style={{ direction: isRtl ? 'rtl' : 'ltr' }}
    >
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => onSelect(prompt)}
          disabled={disabled}
          className="flex-shrink-0 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 shadow-sm transition-all duration-150 hover:border-primary/40 hover:bg-primary/8 hover:text-primary active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
