/**
 * SavedChatsPanel — shows all conversations saved in localStorage.
 * Renders as an absolute overlay inside the assistant panel.
 *
 * Props:
 * - open: boolean
 * - onClose: () => void
 * - onLoadChat: (messages: Message[]) => void  — loads a saved chat into the active view
 * - isDark: boolean
 */

import { useMemo, useState } from 'react';
import { STORAGE_KEYS } from '../../constants/assistant.constants';

/** Load all cogni conversations from localStorage */
function loadAllConversations() {
  const results = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(STORAGE_KEYS.CONVERSATION_PREFIX)) continue;
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const conv = JSON.parse(raw);
        if (!conv?.messages?.length) continue;
        // Revive dates
        conv.updatedAt = conv.updatedAt ? new Date(conv.updatedAt) : new Date(0);
        conv.createdAt = conv.createdAt ? new Date(conv.createdAt) : new Date(0);
        conv.messages = conv.messages.map((m) => ({
          ...m,
          timestamp: m.timestamp ? new Date(m.timestamp) : new Date(),
        }));
        results.push({ key, conv });
      } catch {
        // skip corrupt entries
      }
    }
  } catch {
    // localStorage unavailable
  }
  // Sort newest first
  return results.sort((a, b) => b.conv.updatedAt - a.conv.updatedAt);
}

function formatDate(date) {
  if (!date || isNaN(date.getTime())) return '';
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function getPreview(messages) {
  // Find the last user message for preview
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === 'user') {
      return messages[i].content.slice(0, 80);
    }
  }
  // Fall back to last assistant message
  const last = messages[messages.length - 1];
  return last?.content?.slice(0, 80) ?? '';
}

export default function SavedChatsPanel({ open, onClose, onLoadChat, isDark, onDeleteChat }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  const conversations = useMemo(() => {
    if (!open) return [];
    return loadAllConversations();
  }, [open]);

  if (!open) return null;

  const textPrimary = isDark ? '#F1F5F9' : '#0F172A';
  const textSecondary = isDark ? '#94A3B8' : '#64748B';
  const borderColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(226,232,240,0.8)';
  const bgHover = isDark ? 'rgba(30,41,59,0.6)' : 'rgba(248,250,252,0.8)';
  const bgPanel = isDark ? 'rgba(15,23,42,0.98)' : 'rgba(255,255,255,0.98)';

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col rounded-3xl overflow-hidden"
      style={{ background: bgPanel, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
        style={{ borderColor }}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px]" style={{ color: '#2563EB', fontVariationSettings: "'FILL' 1" }}>
            history
          </span>
          <span className="text-sm font-bold" style={{ color: textPrimary }}>Saved Chats</span>
          {conversations.length > 0 && (
            <span
              className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold"
              style={{ background: 'rgba(37,99,235,0.15)', color: '#2563EB' }}
            >
              {conversations.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close saved chats"
          className="rounded-lg p-1.5 transition-colors"
          style={{ color: textSecondary }}
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 py-12">
            <span className="material-symbols-outlined text-[40px]" style={{ color: textSecondary, fontVariationSettings: "'FILL' 0" }}>
              chat_bubble_outline
            </span>
            <p className="text-sm text-center" style={{ color: textSecondary }}>
              No saved chats yet.<br />Start a conversation with Cogni!
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {conversations.map(({ key, conv }) => {
              const preview = getPreview(conv.messages);
              const dateLabel = formatDate(conv.updatedAt);
              const msgCount = conv.messages.filter(m => m.role === 'user').length;
              const routeLabel = conv.routeKey
                ? conv.routeKey.split('/').filter(Boolean).pop() ?? conv.routeKey
                : 'Chat';

              return (
                <div
                  key={key}
                  className="group relative rounded-xl border transition-all duration-150 cursor-pointer"
                  style={{ borderColor, background: 'transparent' }}
                  onMouseEnter={e => e.currentTarget.style.background = bgHover}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  onClick={() => onLoadChat(conv.messages)}
                >
                  <div className="px-3 py-2.5">
                    {/* Route + date */}
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span
                        className="text-[10px] font-semibold uppercase tracking-wide truncate"
                        style={{ color: '#2563EB' }}
                      >
                        {routeLabel}
                      </span>
                      <span className="text-[10px] flex-shrink-0" style={{ color: textSecondary }}>
                        {dateLabel}
                      </span>
                    </div>

                    {/* Preview */}
                    <p
                      className="text-xs leading-relaxed line-clamp-2"
                      style={{ color: textPrimary }}
                    >
                      {preview || 'Empty conversation'}
                    </p>

                    {/* Message count */}
                    <p className="text-[10px] mt-1" style={{ color: textSecondary }}>
                      {msgCount} {msgCount === 1 ? 'message' : 'messages'}
                    </p>
                  </div>

                  {/* Delete button — appears on hover */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDelete(key);
                    }}
                    aria-label="Delete chat"
                    className="absolute top-2 right-2 rounded-lg p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: '#EF4444', background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)' }}
                  >
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          className="absolute inset-0 z-30 flex items-center justify-center rounded-3xl"
          style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
          <div
            className="mx-4 rounded-2xl p-5 shadow-xl"
            style={{ background: isDark ? '#1E293B' : '#ffffff', border: `1px solid ${borderColor}` }}
          >
            <p className="text-sm font-semibold mb-1" style={{ color: textPrimary }}>Delete this chat?</p>
            <p className="text-xs mb-4" style={{ color: textSecondary }}>This cannot be undone.</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl border py-2 text-xs font-semibold transition-colors"
                style={{ borderColor, color: textSecondary }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  try { localStorage.removeItem(confirmDelete); } catch {}
                  onDeleteChat?.(confirmDelete);
                  setConfirmDelete(null);
                }}
                className="flex-1 rounded-xl py-2 text-xs font-semibold text-white transition-colors"
                style={{ background: '#EF4444' }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
