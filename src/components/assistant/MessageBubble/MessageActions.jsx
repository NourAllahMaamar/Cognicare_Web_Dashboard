import { useState } from 'react';

/**
 * Hover-revealed action buttons for assistant messages.
 * Props: { onCopy, onFeedback, messageId }
 */
export default function MessageActions({ onCopy, onFeedback, messageId }) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState(null); // 'positive' | 'negative' | null
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const handleCopy = async () => {
    await onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleFeedback = (type) => {
    const next = feedback === type ? null : type;
    setFeedback(next);
    onFeedback?.(messageId, next);
    if (next !== null) {
      setFeedbackGiven(true);
      setTimeout(() => setFeedbackGiven(false), 2000);
    }
  };

  return (
    <div className="mt-1.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
      {/* Copy button */}
      <button
        type="button"
        onClick={handleCopy}
        aria-label="Copy message"
        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-300 transition-colors"
        title="Copy"
      >
        <span className={`material-symbols-outlined text-[15px] ${copied ? 'ca-copy-success' : ''}`}>
          {copied ? 'check' : 'content_copy'}
        </span>
      </button>

      {/* Thumbs up */}
      <button
        type="button"
        onClick={() => handleFeedback('positive')}
        aria-label="Helpful"
        className={`rounded-md p-1 transition-colors ${
          feedback === 'positive'
            ? 'text-success bg-success/10'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700'
        }`}
        title="Helpful"
      >
        <span
          className="material-symbols-outlined text-[15px]"
          style={{ fontVariationSettings: feedback === 'positive' ? "'FILL' 1" : "'FILL' 0" }}
        >
          thumb_up
        </span>
      </button>

      {/* Thumbs down */}
      <button
        type="button"
        onClick={() => handleFeedback('negative')}
        aria-label="Not helpful"
        className={`rounded-md p-1 transition-colors ${
          feedback === 'negative'
            ? 'text-error bg-error/10'
            : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700'
        }`}
        title="Not helpful"
      >
        <span
          className="material-symbols-outlined text-[15px]"
          style={{ fontVariationSettings: feedback === 'negative' ? "'FILL' 1" : "'FILL' 0" }}
        >
          thumb_down
        </span>
      </button>

      {/* Feedback confirmation */}
      {feedbackGiven && (
        <span className="ml-1 text-[11px] text-slate-400 ca-message-enter">
          Thanks!
        </span>
      )}
    </div>
  );
}
