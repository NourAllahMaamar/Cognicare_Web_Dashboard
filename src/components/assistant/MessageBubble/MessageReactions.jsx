import { useState } from 'react';
import { REACTION_EMOJIS } from '../../../constants/assistant.constants';

/**
 * Emoji reaction picker and display for assistant messages.
 * Props: { messageId, onReaction }
 */
export default function MessageReactions({ messageId, onReaction }) {
  const [selectedReaction, setSelectedReaction] = useState(null);
  const [showPicker, setShowPicker] = useState(false);

  const handleReaction = (emoji) => {
    const next = selectedReaction === emoji ? null : emoji;
    setSelectedReaction(next);
    onReaction?.(messageId, next);
    setShowPicker(false);
  };

  return (
    <div className="relative mt-1 flex items-center gap-1">
      {/* Selected reaction display */}
      {selectedReaction && (
        <button
          type="button"
          onClick={() => handleReaction(selectedReaction)}
          className="ca-reaction-enter rounded-full bg-primary/10 px-2 py-0.5 text-sm border border-primary/20 hover:bg-primary/20 transition-colors"
          aria-label={`Remove reaction ${selectedReaction}`}
          title="Click to remove"
        >
          {selectedReaction}
        </button>
      )}

      {/* Add reaction button */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="rounded-full p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 transition-colors opacity-0 group-hover:opacity-100"
        aria-label="Add reaction"
        title="React"
      >
        <span className="material-symbols-outlined text-[14px]">add_reaction</span>
      </button>

      {/* Emoji picker */}
      {showPicker && (
        <div className="absolute bottom-full left-0 mb-1 flex gap-1 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-2 shadow-lg z-10 ca-message-enter">
          {REACTION_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => handleReaction(emoji)}
              className={`rounded-lg p-1.5 text-lg transition-all hover:scale-125 hover:bg-slate-100 dark:hover:bg-slate-700 ${
                selectedReaction === emoji ? 'bg-primary/10 scale-110' : ''
              }`}
              aria-label={`React with ${emoji}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
