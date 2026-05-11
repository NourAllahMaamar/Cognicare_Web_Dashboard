import cogniThinking from '../../../assets/cogni/cogni-thinking.png';

/**
 * Animated typing indicator shown while the assistant is processing.
 * Props: { mode } — 'refresh' | 'message'
 */
export default function TypingIndicator({ mode }) {
  const label =
    mode === 'refresh' ? 'Cogni is refreshing…' : 'Cogni is thinking…';

  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
        <span className="h-6 w-6 overflow-hidden rounded-full border border-primary/20 bg-white flex-shrink-0">
          <img src={cogniThinking} alt="Cogni" className="h-full w-full object-cover" />
        </span>
        <span>{label}</span>
        <span className="flex items-center gap-0.5 ms-1" aria-hidden="true">
          <span className="ca-typing-dot" />
          <span className="ca-typing-dot" style={{ animationDelay: '0.2s' }} />
          <span className="ca-typing-dot" style={{ animationDelay: '0.4s' }} />
        </span>
      </div>
    </div>
  );
}
