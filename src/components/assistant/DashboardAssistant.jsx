import { useEffect, useMemo, useRef, useState } from 'react';
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

function metaLabel(meta) {
  switch (meta?.strategy) {
    case 'default':
      return 'Instant summary';
    case 'cached':
      return 'Reused answer';
    case 'lite_model':
      return 'Light analysis';
    case 'smart_model':
      return 'Deep analysis';
    default:
      return 'Assistant reply';
  }
}

function metaTimestamp(meta) {
  if (!meta?.generatedAt) return 'just updated';
  const parsed = new Date(meta.generatedAt);
  if (Number.isNaN(parsed.getTime())) return 'just updated';

  return `updated at ${parsed.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export default function DashboardAssistant({ role }) {
  const location = useLocation();
  const { authFetch } = useAuth(role);
  const { uiContext } = useDashboardAssistantContext();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [latestMeta, setLatestMeta] = useState(null);
  const [messages, setMessages] = useState(() => [
    {
      role: 'model',
      content: starterMessages[role] || 'I can help explain this dashboard.',
      meta: null,
    },
  ]);
  const [lastRequest, setLastRequest] = useState(null);
  const lastRefreshSignatureRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        role: 'model',
        content: starterMessages[role] || 'I can help explain this dashboard.',
        meta: null,
      },
    ]);
    setInput('');
    setError('');
    setLatestMeta(null);
    setLastRequest(null);
    lastRefreshSignatureRef.current = null;
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

  const refreshSignature = useMemo(
    () => JSON.stringify({ path: location.pathname, uiContext }),
    [location.pathname, uiContext],
  );

  const requestAssistant = async ({
    mode,
    message,
    refreshReason,
    appendUserMessage = false,
  }) => {
    if (loading) return;

    const trimmed = typeof message === 'string' ? message.trim() : '';
    if (mode === 'message' && !trimmed) return;

    setError('');
    setLastRequest({ mode, message: trimmed || null, refreshReason });

    if (appendUserMessage) {
      setMessages((current) => [
        ...current,
        { role: 'user', content: trimmed, meta: null },
      ]);
      setInput('');
    }

    setLoading(true);

    try {
      const history =
        mode === 'refresh'
          ? []
          : messages
              .filter((item) => item.role === 'user' || item.role === 'model')
              .map((item) => ({
                role: item.role,
                content: item.content,
              }));

      if (
        appendUserMessage &&
        history.length > 0 &&
        history[history.length - 1]?.role === 'user'
      ) {
        history.pop();
      }

      const response = await authFetch('/chatbot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(mode === 'message' ? { message: trimmed } : {}),
          ...(history.length > 0 ? { history } : {}),
          surface: 'web',
          route: location.pathname,
          uiContext,
          mode,
          ...(refreshReason ? { refreshReason } : {}),
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
        ? '\n\nThis dashboard assistant stays read-only in this release, so no action was executed.'
        : '';
      setLatestMeta(data.meta ?? null);
      setMessages((current) => [
        ...current,
        {
          role: 'model',
          content: `${reply}${readOnlyNote}`,
          meta: data.meta ?? null,
        },
      ]);
    } catch (requestError) {
      setError(
        requestError instanceof Error && requestError.message
          ? requestError.message
          : 'The assistant is temporarily unavailable.',
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) {
      lastRefreshSignatureRef.current = null;
      return;
    }

    const nextReason = lastRefreshSignatureRef.current
      ? lastRefreshSignatureRef.current === refreshSignature
        ? null
        : 'navigation'
      : 'entry';

    if (!nextReason) {
      return;
    }

    lastRefreshSignatureRef.current = refreshSignature;
    void requestAssistant({
      mode: 'refresh',
      refreshReason: nextReason,
    });
  }, [open, refreshSignature]);

  const handleSend = async () => {
    await requestAssistant({
      mode: 'message',
      message: input,
      appendUserMessage: true,
    });
  };

  const handleRefresh = async (reason = 'manual') => {
    await requestAssistant({
      mode: 'refresh',
      refreshReason: reason,
    });
  };

  const retryLastRequest = async () => {
    if (!lastRequest) return;

    await requestAssistant({
      mode: lastRequest.mode,
      message: lastRequest.message ?? undefined,
      refreshReason: lastRequest.refreshReason ?? undefined,
    });
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
          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 shadow-2xl dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950">
            <div className="border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-sm">
                    <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                    Assistant
                  </div>
                  <h3 className="mt-3 text-lg font-bold">Cogni Dashboard Assistant</h3>
                  <p className="mt-1 text-sm text-slate-500 dark:text-text-muted">
                    Read-only support for the current dashboard view.
                  </p>
                  {latestMeta && (
                    <p className="mt-2 text-xs font-semibold text-slate-400">
                      {metaLabel(latestMeta)} • {metaTimestamp(latestMeta)}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRefresh()}
                    disabled={loading}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined">refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {location.pathname}
                </span>
                {summaryChips.map((chip) => (
                  <span
                    key={chip.key}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {chip.key}: {chip.value}
                  </span>
                ))}
              </div>
            </div>

            {error && (
              <div className="border-b border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-200">
                <div className="flex items-center justify-between gap-3">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => void retryLastRequest()}
                    disabled={loading}
                    className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-amber-950/40 dark:text-amber-100 dark:hover:bg-amber-900/40"
                  >
                    Retry
                  </button>
                </div>
              </div>
            )}

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
                          ? 'border border-primary/30 bg-primary text-white'
                          : 'border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                      }`}
                    >
                      <div>{message.content}</div>
                      {!isUser && message.meta && (
                        <p className="mt-2 text-[11px] font-semibold text-slate-400">
                          {metaLabel(message.meta)} • {metaTimestamp(message.meta)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-start">
                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {lastRequest?.mode === 'refresh'
                      ? 'Cogni is refreshing this view…'
                      : 'Cogni is thinking…'}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
              <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-850">
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
                <div className="mt-2 flex items-center justify-between gap-3 px-1">
                  <p className="text-xs text-slate-400">
                    Read-only in this release
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRefresh()}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      <span className="material-symbols-outlined text-[18px]">refresh</span>
                      <span>Refresh</span>
                    </button>
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
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
