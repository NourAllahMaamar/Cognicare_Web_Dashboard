import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardAssistantContext } from '../../assistant/useDashboardAssistantContext';
import {
  MIN_ASSISTANT_PANEL_WIDTH,
  MAX_ASSISTANT_PANEL_WIDTH,
} from '../../assistant/constants';
import cogniWave from '../../assets/cogni/cogni-wave.png';
import cogniThinking from '../../assets/cogni/cogni-thinking.png';
import cogniHappy from '../../assets/cogni/cogni-happy.png';

function starterMessageForRole(role, t) {
  switch (role) {
    case 'admin':
      return t(
        'dashboardAssistant.starter.admin',
        'I can explain system metrics, summarize the current admin overview, and point you to the next dashboard page to check.',
      );
    case 'orgLeader':
      return t(
        'dashboardAssistant.starter.orgLeader',
        'I can summarize your organization dashboard, explain staff or family trends, and help you interpret specialist insight cards.',
      );
    case 'specialist':
      return t(
        'dashboardAssistant.starter.specialist',
        'I can summarize your current dashboard data, explain plan counts and suggestions, and guide you to the next specialist workflow.',
      );
    default:
      return t(
        'dashboardAssistant.starter.default',
        'I can help explain this dashboard.',
      );
  }
}

function metaLabel(meta, t) {
  switch (meta?.strategy) {
    case 'default':
      return t('dashboardAssistant.meta.instantSummary', 'Instant summary');
    case 'cached':
      return t('dashboardAssistant.meta.reusedAnswer', 'Reused answer');
    case 'lite_model':
      return t('dashboardAssistant.meta.lightAnalysis', 'Light analysis');
    case 'smart_model':
      return t('dashboardAssistant.meta.deepAnalysis', 'Deep analysis');
    default:
      return t('dashboardAssistant.meta.assistantReply', 'Assistant reply');
  }
}

function metaTimestamp(meta, t, locale) {
  if (!meta?.generatedAt) {
    return t('dashboardAssistant.meta.justUpdated', 'just updated');
  }

  const parsed = new Date(meta.generatedAt);
  if (Number.isNaN(parsed.getTime())) {
    return t('dashboardAssistant.meta.justUpdated', 'just updated');
  }

  const time = parsed.toLocaleTimeString(locale || undefined, {
    hour: '2-digit',
    minute: '2-digit',
  });

  return t('dashboardAssistant.meta.updatedAt', {
    time,
    defaultValue: 'updated at {{time}}',
  });
}

function readNumericMetric(uiContext, key) {
  const value = uiContext?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function metricLabel(key, t) {
  return t(`dashboardAssistant.metrics.${key}`, key);
}

function buildLocalRefreshReply({ role, route, uiContext, t }) {
  const metrics = [];
  const pushMetric = (key) => {
    const value = readNumericMetric(uiContext, key);
    if (value == null) return;
    metrics.push(`${metricLabel(key, t)}: ${value}`);
  };

  if (role === 'admin') {
    pushMetric('totalUsers');
    pushMetric('totalOrganizations');
    pushMetric('totalFamilies');
    pushMetric('pendingReviews');
  } else if (role === 'orgLeader') {
    pushMetric('totalStaff');
    pushMetric('totalFamilies');
    pushMetric('totalChildren');
    pushMetric('invitations');
  } else if (role === 'specialist') {
    pushMetric('totalChildren');
    pushMetric('organizationChildren');
    pushMetric('privateChildren');
    pushMetric('totalPlans');
    pushMetric('pecsBoards');
    pushMetric('teacchTrackers');
    pushMetric('suggestionCount');
  }

  if (metrics.length === 0 && uiContext && typeof uiContext === 'object') {
    for (const [key, value] of Object.entries(uiContext)) {
      if (
        typeof value === 'number' ||
        typeof value === 'string' ||
        typeof value === 'boolean'
      ) {
        metrics.push(`${metricLabel(key, t)}: ${String(value)}`);
      }
      if (metrics.length >= 4) break;
    }
  }

  if (metrics.length === 0) {
    return t(
      'dashboardAssistant.localSummary.empty',
      'I can summarize this screen as soon as your dashboard metrics load.',
    );
  }

  return t('dashboardAssistant.localSummary.snapshot', {
    route,
    metrics: metrics.join(' • '),
    defaultValue: 'Current snapshot for {{route}}: {{metrics}}.',
  });
}

export default function DashboardAssistant({ role }) {
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { authFetch } = useAuth(role);
  const {
    uiContext,
    assistantOpen,
    setAssistantOpen,
    assistantPanelWidth,
    setAssistantPanelWidth,
  } = useDashboardAssistantContext();
  const [isClient, setIsClient] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [queuedMessage, setQueuedMessage] = useState('');
  const [error, setError] = useState('');
  const [latestMeta, setLatestMeta] = useState(null);
  const [messages, setMessages] = useState(() => [
    {
      role: 'model',
      content: starterMessageForRole(role, t),
      meta: null,
    },
  ]);
  const [lastRequest, setLastRequest] = useState(null);
  const lastRefreshSignatureRef = useRef(null);
  const resizeSessionRef = useRef(null);
  const isRtl = i18n.dir() === 'rtl';
  const open = assistantOpen;
  const panelWidth = assistantPanelWidth;

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    setMessages([
      {
        role: 'model',
        content: starterMessageForRole(role, t),
        meta: null,
      },
    ]);
    setQueuedMessage('');
    setInput('');
    setError('');
    setLatestMeta(null);
    setLastRequest(null);
    lastRefreshSignatureRef.current = null;
  }, [role, location.pathname, i18n.language]);

  useEffect(() => {
    if (!open) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setAssistantOpen(false);
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [open]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (event) => {
      const session = resizeSessionRef.current;
      if (!session) return;
      const deltaX = session.startX - event.clientX;
      const nextWidth = Math.min(
        MAX_ASSISTANT_PANEL_WIDTH,
        Math.max(MIN_ASSISTANT_PANEL_WIDTH, session.startWidth + deltaX),
      );
      setAssistantPanelWidth(nextWidth);
    };

    const handleEnd = () => {
      setIsResizing(false);
      resizeSessionRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [isResizing]);

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
    const trimmed = typeof message === 'string' ? message.trim() : '';
    if (mode === 'message' && !trimmed) return;

    if (loading) {
      if (mode === 'message' && trimmed) {
        setQueuedMessage(trimmed);
        setInput('');
      }
      return;
    }

    setError('');
    setLastRequest({ mode, message: trimmed || null, refreshReason });

    if (appendUserMessage) {
      setMessages((current) => [
        ...current,
        { role: 'user', content: trimmed, meta: null },
      ]);
      setInput('');
    }

    if (mode === 'refresh') {
      const localMeta = {
        strategy: 'default',
        complexity: 'simple',
        refreshed: true,
        cacheHit: false,
        generatedAt: new Date().toISOString(),
        reason: `local_refresh_${refreshReason ?? 'manual'}`,
      };
      const localReply = buildLocalRefreshReply({
        role,
        route: location.pathname,
        uiContext,
        t,
      });
      setLatestMeta(localMeta);
      setMessages((current) => [
        ...current,
        {
          role: 'model',
          content: localReply,
          meta: localMeta,
        },
      ]);
      return;
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
          locale: i18n.language,
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
          : t(
            'dashboardAssistant.fallbackReply',
            'I do not have anything useful to add right now.',
          );
      const readOnlyNote = data.pendingAction
        ? `\n\n${t(
          'dashboardAssistant.readOnlyActionNote',
          'This dashboard assistant stays read-only in this release, so no action was executed.',
        )}`
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
          : t(
            'dashboardAssistant.unavailable',
            'Cogni is temporarily unavailable.',
          ),
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

  useEffect(() => {
    if (loading || !queuedMessage) return;
    const nextMessage = queuedMessage;
    setQueuedMessage('');
    void requestAssistant({
      mode: 'message',
      message: nextMessage,
      appendUserMessage: true,
    });
  }, [loading, queuedMessage]);

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

  const startResize = (event) => {
    event.preventDefault();
    event.stopPropagation();
    resizeSessionRef.current = {
      startX: event.clientX,
      startWidth: panelWidth,
    };
    setIsResizing(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setAssistantOpen((current) => !current);
        }}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
          open
            ? 'border-primary/35 bg-primary/20 text-primary'
            : 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/15'
        }`}
        aria-expanded={open}
        aria-controls="dashboard-assistant-panel"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-primary/30">
          <img src={cogniWave} alt="Cogni" className="h-full w-full object-cover" />
        </span>
        <span>{t('dashboardAssistant.askCogni', 'Ask Cogni')}</span>
      </button>

      {open && isClient && createPortal(
        <div className="pointer-events-none fixed inset-y-0 end-0 z-[70] flex justify-end p-2 sm:p-4">
          <aside
            id="dashboard-assistant-panel"
            dir={i18n.dir()}
            className={`pointer-events-auto relative flex h-full max-h-[calc(100vh-1rem)] flex-col overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-b from-white via-slate-50 to-slate-100 shadow-2xl dark:border-slate-700 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 ${
              isResizing ? 'select-none' : ''
            }`}
            style={{
              width: `min(calc(100vw - 1rem), ${panelWidth}px)`,
            }}
          >
            <button
              type="button"
              onMouseDown={startResize}
              aria-label={t('dashboardAssistant.resize', 'Resize assistant panel')}
              title={t('dashboardAssistant.resizeHint', 'Drag to resize')}
              className="absolute -start-2 top-0 hidden h-full w-4 cursor-col-resize items-center justify-center sm:flex"
            >
              <span className="h-20 w-1.5 rounded-full bg-slate-300/90 shadow-sm transition-colors hover:bg-primary/70 dark:bg-slate-600 dark:hover:bg-primary/70" />
            </button>
            <div className="pointer-events-none absolute inset-y-0 start-0 w-1 bg-gradient-to-b from-primary via-blue-500 to-cyan-400 opacity-80" />
            <div className="border-b border-slate-200/80 bg-white/90 px-5 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/90">
              <div className="flex items-start justify-between gap-4">
                <div className={`flex items-start gap-3 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <div className="h-12 w-12 overflow-hidden rounded-2xl bg-primary/10 ring-1 ring-primary/20">
                    <img src={cogniThinking} alt="Cogni" className="h-full w-full object-cover" />
                  </div>
                  <div style={{ textAlign: isRtl ? 'right' : 'left' }}>
                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary shadow-sm">
                      <span className="material-symbols-outlined text-[14px]">bolt</span>
                      {t('dashboardAssistant.assistantTag', 'Assistant')}
                    </div>
                    <h3 className="mt-3 text-lg font-bold">
                      {t('dashboardAssistant.title', 'Cogni Dashboard Assistant')}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500 dark:text-text-muted">
                      {t(
                        'dashboardAssistant.subtitle',
                        'Read-only support for the current dashboard view.',
                      )}
                    </p>
                    {latestMeta && (
                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        {metaLabel(latestMeta, t)} • {metaTimestamp(latestMeta, t, i18n.language)}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleRefresh()}
                    disabled={loading}
                    aria-label={t('dashboardAssistant.refresh', 'Refresh')}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined">refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssistantOpen(false)}
                    aria-label={t('dashboardAssistant.close', 'Close assistant')}
                    className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              </div>
              <div className={`mt-4 flex flex-wrap gap-2 ${isRtl ? 'justify-end' : ''}`}>
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary shadow-sm">
                  {t('dashboardAssistant.status.live', 'Cogni Live')}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {t('dashboardAssistant.routeLabel', 'Screen')}: {location.pathname}
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
                    {t('dashboardAssistant.retry', 'Retry')}
                  </button>
                </div>
              </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.08),_transparent_55%)] px-5 py-4 dark:bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_55%)]">
              <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  {t('dashboardAssistant.conversation', 'Conversation')}
                </p>
                {messages.length > 1 && (
                  <button
                    type="button"
                    onClick={() => setMessages([
                      {
                        role: 'model',
                        content: starterMessageForRole(role, t),
                        meta: null,
                      },
                    ])}
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {t('dashboardAssistant.clear', 'Clear')}
                  </button>
                )}
              </div>
              {messages.map((message, index) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={`${message.role}-${index}`}
                    className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                  >
                    {!isUser && (
                      <div className={`mt-1 ${isRtl ? 'ml-2' : 'mr-2'} h-8 w-8 overflow-hidden rounded-full border border-primary/20 bg-white`}>
                        <img src={cogniHappy} alt="Cogni" className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div
                      className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        isUser
                          ? 'border border-primary/30 bg-primary text-white'
                          : 'border border-slate-200 bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
                      }`}
                      style={{ textAlign: isRtl ? 'right' : 'left' }}
                    >
                      <div className="whitespace-pre-wrap leading-relaxed">{message.content}</div>
                      {!isUser && message.meta && (
                        <p className="mt-2 text-[11px] font-semibold text-slate-400">
                          {metaLabel(message.meta, t)} • {metaTimestamp(message.meta, t, i18n.language)}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    <span className="h-6 w-6 overflow-hidden rounded-full border border-primary/20 bg-white">
                      <img src={cogniThinking} alt="Cogni" className="h-full w-full object-cover" />
                    </span>
                    {lastRequest?.mode === 'refresh'
                      ? t('dashboardAssistant.refreshing', 'Cogni is refreshing this view…')
                      : t('dashboardAssistant.thinking', 'Cogni is thinking…')}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-sm dark:border-slate-700 dark:bg-slate-900/95">
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                {t('dashboardAssistant.inputLabel', 'Ask Cogni')}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
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
                  placeholder={t(
                    'dashboardAssistant.inputPlaceholder',
                    'Ask about the current dashboard state, metrics, or next steps…',
                  )}
                  className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                  style={{ textAlign: isRtl ? 'right' : 'left' }}
                />
                <div className={`mt-2 flex items-center justify-between gap-3 px-1 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <p className="text-xs text-slate-400">
                    {queuedMessage
                      ? t(
                        'dashboardAssistant.queued',
                        'Message queued while Cogni refreshes',
                      )
                      : t('dashboardAssistant.readOnly', 'Read-only in this release')}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRefresh()}
                      disabled={loading}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      <span className="material-symbols-outlined text-[18px]">refresh</span>
                      <span>{t('dashboardAssistant.refresh', 'Refresh')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleSend()}
                      disabled={loading || input.trim().length === 0}
                      className="inline-flex items-center gap-2 rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>{t('dashboardAssistant.send', 'Send')}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
