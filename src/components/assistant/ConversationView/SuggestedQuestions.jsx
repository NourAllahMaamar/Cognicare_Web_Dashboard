/**
 * Suggested follow-up questions shown after an assistant response.
 * Props: { questions, onSelect, disabled }
 */
export default function SuggestedQuestions({ questions, onSelect, disabled }) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-2 ca-message-enter">
      <span className="w-full text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
        Suggested
      </span>
      {questions.slice(0, 3).map((question, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelect(question)}
          disabled={disabled}
          className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary transition-all duration-150 hover:bg-primary/10 hover:border-primary/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {question}
        </button>
      ))}
    </div>
  );
}
