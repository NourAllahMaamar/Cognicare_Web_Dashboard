import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardAssistantContext } from '../../assistant/useDashboardAssistantContext';

const starterMessages = {
  admin:
    'I can explain system metrics, summarize the current admin overview, and point you to the next dashboard page to check.',
  orgLeader:
    'I can summarize your organization dashboard, explain staff or family trends, and help you interpret specialist insight cards.',
  specialist:
    'I can summarize your current dashboard data, explain plan counts and suggestions, and guide you to the next specialist workflow.',
};

export default function DashboardAssistant({ role }) {
  const location = useLocation();
  const { authFetch } = useAuth(role);
  const { uiContext } = useDashboardAssistantContext();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState(() => [
    {
      role: 'model',
      content: starterMessages[role] || 'I can help explain this dashboard.',
    },
  ]);

  useEffect(() => {
    setMessages([
      {
        role: 'model',
        content: starterMessages[role] || 'I can help explain this dashboard.',
      },
    ]);
    setInput('');
  }, [role, location.pathname]);

  const summaryChips = useMemo(() => {
    if (!uiContext || typeof uiContext !== 'object') return [];
    return Object.entries(uiContext)
      .filter(([, value]) =>
        typeof value === 'number' ||
        typeof value === 'string' ||
        typeof value === 'boolean',
      )
      .slice(0, 3)
      .map(([key, value]) => ({
        key,
        value: String(value),
      }));
  }, [uiContext]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const nextMessages = [
      ...messages,
      { role: 'user', content: trimmed },
    ];
    setMessages(nextMessages);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter((message) => message.role === 'user' || message.role === 'model')
        .map((message) => ({
          role: message.role,
          content: message.content,
        }));

      const response = await authFetch('/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmed,
          history,
          surface: 'web',
          route: location.pathname,
          uiContext,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      const reply =
        typeof data.reply === 'string' && data.reply.trim().length > 0
          ? data.reply
          : 'I do not have anything useful to add right now.';
      const readOnlyNote = data.pendingAction
        ? '\n\nThis dashboard assistant is read-only in this release, so no action was executed.'
        : '';
      setMessages((current) => [
        ...current,
        {
          role: 'model',
          content: `${reply}${readOnlyNote}`,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: 'model',
          content:
            error instanceof Error && error.message
              ? error.message
              : 'The assistant is temporarily unavailable.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
      >
        <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
        <span>Ask Cogni</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div
            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-slate-300 bg-white shadow-2xl dark:border-slate-800 dark:bg-surface-dark">
            <div className="border-b border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    Assistant
                  </div>
                  <h3 className="mt-3 text-lg font-bold">Cogni Dashboard Assistant</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-text-muted">
                    Read-only support for the current dashboard view.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  {location.pathname}
                </span>
                {summaryChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {chip.key}: {chip.value}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        isUser
                          ? 'bg-primary text-white'
                          : 'border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-100'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300">
                    Cogni is thinking…
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 px-5 py-4 dark:border-slate-800">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-900/50">
                <textarea
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      void handleSend();
                    }
                  }}
                  rows={3}
                  placeholder="Ask about the current dashboard state, metrics, or next steps…"
                  className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none"
                />
                <div className="mt-2 flex items-center justify-between px-1">
                  <p className="text-xs text-slate-400">
                    Read-only in this release
                  </p>
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={loading}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined text-[18px]">send</span>
                    <span>Send</span>
                  </button>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
