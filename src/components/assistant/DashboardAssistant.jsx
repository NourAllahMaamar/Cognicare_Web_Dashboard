import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardAssistantContext } from '../../assistant/useDashboardAssistantContext';
import { useAssistantResize } from '../../hooks/useAssistantResize';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import cogniWave from '../../assets/cogni/cogni-wave.png';
import cogniThinking from '../../assets/cogni/cogni-thinking.png';
import { metaLabel, metaTimestamp } from '../../utils/assistant/metaHelpers';
import MessageBubble from './MessageBubble/MessageBubble';
import ContextChips from './AssistantHeader/ContextChips';
import HeaderActions from './AssistantHeader/HeaderActions';
import QuickPrompts from './AssistantHeader/QuickPrompts';
import SuggestedQuestions from './ConversationView/SuggestedQuestions';
import TypingIndicator from './ConversationView/TypingIndicator';
import VoiceInputButton from './InputArea/VoiceInputButton';
import ErrorBanner from './ErrorBanner';
import SettingsModal from './SettingsModal';
import SavedChatsPanel from './SavedChatsPanel';
import { getQuickPromptsForContext } from '../../utils/assistant/promptGenerator';
import { generateSuggestions } from '../../utils/assistant/suggestionGenerator';
import { MAX_MESSAGES_BEFORE_WARNING } from '../../constants/assistant.constants';
import { useTheme } from '../../hooks/useTheme';
import { storageService } from '../../services/assistant/StorageService';

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
    preferences,
    updatePreference,
  } = useDashboardAssistantContext();
  const [isClient, setIsClient] = useState(false);
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
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  // 16.1 — clear confirmation
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  // 16.2 — conversation search
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  // 17.1 — settings modal
  const [showSettings, setShowSettings] = useState(false);
  // Saved chats panel
  const [showSavedChats, setShowSavedChats] = useState(false);
  // 26.1 — retry count tracking
  const [retryCount, setRetryCount] = useState(0);
  // 27.1 — scroll-to-bottom button
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const lastRefreshSignatureRef = useRef(null);
  const panelRef = useRef(null);
  // 21.1 — auto-scroll to bottom ref
  const messagesEndRef = useRef(null);
  // 27.1 — conversation container ref for scroll tracking
  const conversationContainerRef = useRef(null);
  const { theme } = useTheme() ?? { theme: 'light' };
  const isDark = theme === 'dark';
  const isRtl = i18n.dir() === 'rtl';
  const open = assistantOpen;
  const panelWidth = assistantPanelWidth;

  const { isResizing, startResize } = useAssistantResize(panelWidth, setAssistantPanelWidth);
  useFocusTrap(panelRef, open && isClient);

  useEffect(() => {
    setIsClient(true);
    storageService.clearOldConversations();
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

  // Auto-save current conversation to localStorage when messages change
  useEffect(() => {
    if (messages.length <= 1) return; // don't save just the starter message
    try {
      const routeKey = location.pathname;
      const existing = storageService.loadConversation(routeKey);
      const conv = {
        id: existing?.id ?? crypto.randomUUID?.() ?? Date.now().toString(),
        routeKey,
        messages,
        createdAt: existing?.createdAt ?? new Date(),
        updatedAt: new Date(),
        metadata: {
          messageCount: messages.length,
          lastMessageAt: new Date(),
          role,
        },
      };
      storageService.saveConversation(routeKey, conv);
    } catch {
      // non-critical
    }
  }, [messages, location.pathname, role]);

  // 21.1 — auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 27.1 — track scroll position to show/hide scroll-to-bottom button
  useEffect(() => {
    const container = conversationContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const distanceFromBottom =
        container.scrollHeight - container.scrollTop - container.clientHeight;
      setShowScrollToBottom(distanceFromBottom > 100);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [open]);

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

  const quickPrompts = useMemo(
    () => getQuickPromptsForContext(role, location.pathname, t),
    [role, location.pathname, t],
  );

  // 16.2 — filtered messages for search
  const displayedMessages = useMemo(
    () =>
      searchQuery
        ? messages.filter((m) =>
            m.content.toLowerCase().includes(searchQuery.toLowerCase()),
          )
        : messages,
    [messages, searchQuery],
  );

  // 16.3 — export conversation as text file
  const exportConversation = useCallback(() => {
    const lines = messages
      .map((m) => `[${m.role === 'user' ? 'You' : 'Cogni'}]: ${m.content}`)
      .join('\n\n');
    const blob = new Blob([lines], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cogni-conversation-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  // 16.4 — shareable links require backend; skipped in this release
  // TODO: implement shareable conversation links when backend support is available

  const refreshSignature = useMemo(
    () => JSON.stringify({ path: location.pathname, uiContext }),
    [location.pathname, uiContext],
  );

  const requestAssistant = useCallback(async ({
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
      setSuggestedQuestions([]);
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
      setSuggestedQuestions(
        data.suggestedQuestions && data.suggestedQuestions.length > 0
          ? data.suggestedQuestions
          : generateSuggestions(reply, role, location.pathname),
      );
      // 26.1 — reset retry count on success
      setRetryCount(0);
    } catch (requestError) {
      // 26.1 — increment retry count on error
      setRetryCount((c) => c + 1);
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
  }, [loading, messages, role, location.pathname, uiContext, i18n.language, authFetch, t]);

  // 19.1 — global Ctrl+K / Cmd+K shortcut to open assistant
  useEffect(() => {
    const handleGlobalKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setAssistantOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKey);
    return () => window.removeEventListener('keydown', handleGlobalKey);
  }, [setAssistantOpen]);

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

    // 25.1 — skip auto-refresh on navigation if user disabled it (but still refresh on first entry)
    if (nextReason === 'navigation' && preferences?.autoRefreshOnNavigation === false) {
      lastRefreshSignatureRef.current = refreshSignature;
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

  const handleSend = useCallback(async () => {
    await requestAssistant({
      mode: 'message',
      message: input,
      appendUserMessage: true,
    });
  }, [requestAssistant, input]);

  const handleRefresh = useCallback(async (reason = 'manual') => {
    await requestAssistant({
      mode: 'refresh',
      refreshReason: reason,
    });
  }, [requestAssistant]);

  const retryLastRequest = useCallback(async () => {
    if (!lastRequest) return;

    await requestAssistant({
      mode: lastRequest.mode,
      message: lastRequest.message ?? undefined,
      refreshReason: lastRequest.refreshReason ?? undefined,
    });
  }, [requestAssistant, lastRequest]);

  return (
    <>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setAssistantOpen((current) => !current);
        }}
        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all duration-200 hover:shadow-[0_0_12px_rgba(37,99,235,0.25)] ${
          open
            ? 'border-primary/35 bg-primary/20 text-primary ring-2 ring-primary/20'
            : 'border-primary/20 bg-primary/10 text-primary hover:bg-primary/15'
        }`}
        aria-expanded={open}
        aria-controls="dashboard-assistant-panel"
      >
        <span className="inline-flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-primary/30">
          <img src={cogniWave} alt="Cogni" className="h-full w-full object-cover" />
        </span>
        <span className="hidden sm:inline">{t('dashboardAssistant.askCogni', 'Ask Cogni')}</span>
      </button>

      {open && isClient && createPortal(
        <div className="pointer-events-none fixed sm:inset-y-0 sm:end-0 inset-x-0 bottom-0 top-auto sm:top-0 z-[70] flex sm:justify-end sm:p-4 p-0">
          <aside
            id="dashboard-assistant-panel"
            ref={panelRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="true"
            aria-label={t('dashboardAssistant.title', 'Cogni Dashboard Assistant')}
            dir={i18n.dir()}
            data-density={preferences?.messageDensity ?? 'comfortable'}
            className={`cogni-assistant ca-panel-enter pointer-events-auto relative flex sm:h-full h-[92vh] sm:max-h-[calc(100vh-2rem)] max-h-full flex-col overflow-hidden sm:rounded-3xl border ${
              isResizing ? 'select-none' : ''
            } ${isDark ? 'dark' : ''}`}            style={{
              background: 'var(--ca-glass-bg)',
              backdropFilter: 'blur(var(--ca-glass-blur))',
              WebkitBackdropFilter: 'blur(var(--ca-glass-blur))',
              boxShadow: 'var(--ca-glass-shadow)',
              border: '1px solid var(--ca-glass-border)',
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
            <div className="pointer-events-none absolute inset-y-0 start-0 w-1 opacity-80" style={{ background: 'var(--ca-accent-gradient)' }} />
            {/* ── Compact header ── */}
            <div
              className="border-b px-4 pt-3 pb-2 backdrop-blur-sm"
              style={{ background: 'var(--ca-header-bg)', borderColor: 'var(--ca-header-border)' }}
            >
              {/* Row 1: avatar + title + actions — single tight row */}
              <div className={`flex items-center gap-2.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                {/* Avatar with live dot */}
                <div className="relative flex-shrink-0">
                  <div className="h-8 w-8 overflow-hidden rounded-xl bg-primary/10 ring-1 ring-primary/20 shadow-sm">
                    <img src={cogniThinking} alt="Cogni" className="h-full w-full object-cover" />
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900" />
                </div>

                {/* Title + meta — truncated to one line each */}
                <div className="min-w-0 flex-1" style={{ textAlign: isRtl ? 'right' : 'left' }}>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[13px] font-bold text-slate-900 dark:text-slate-100 truncate">
                      Cogni
                    </span>
                    <span className="flex-shrink-0 inline-flex items-center gap-0.5 rounded-full bg-primary/15 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                      <span className="material-symbols-outlined text-[10px]" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                      AI
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500 truncate leading-tight mt-0.5">
                    {latestMeta
                      ? `${metaLabel(latestMeta, t)} · ${metaTimestamp(latestMeta, t, i18n.language)}`
                      : t('dashboardAssistant.subtitle', 'Dashboard assistant')}
                  </p>
                </div>

                {/* Actions */}
                <HeaderActions
                  onRefresh={() => void handleRefresh()}
                  onClose={() => setAssistantOpen(false)}
                  onSettings={() => setShowSettings(true)}
                  onSearch={() => setShowSearch((v) => !v)}
                  onExport={exportConversation}
                  onHistory={() => setShowSavedChats(true)}
                  loading={loading}
                  t={t}
                />
              </div>

              {/* Row 2: context chips — compact, max 2 visible */}
              <ContextChips
                location={location}
                summaryChips={summaryChips}
                isRtl={isRtl}
                t={t}
              />

              {/* Row 3: quick prompts */}
              <QuickPrompts
                prompts={quickPrompts}
                onSelect={(prompt) => {
                  setInput(prompt);
                  void requestAssistant({ mode: 'message', message: prompt, appendUserMessage: true });
                }}
                disabled={loading}
                isRtl={isRtl}
              />

              {/* Search input (collapsible) */}
              {showSearch && (
                <div className="mt-2 flex items-center gap-2">
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t('dashboardAssistant.searchPlaceholder', 'Search conversation…')}
                    autoFocus
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700 outline-none transition-colors focus:border-primary dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      aria-label={t('dashboardAssistant.clearSearch', 'Clear search')}
                      className="rounded-lg p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                </div>
              )}
            </div>

            <ErrorBanner
              error={error}
              onRetry={() => void retryLastRequest()}
              onDismiss={() => setError('')}
              loading={loading}
              retryCount={retryCount}
            />

            <div
              ref={conversationContainerRef}
              className="relative flex-1 overflow-y-auto px-4 py-3"
              style={{ background: 'var(--ca-conversation-bg)' }}
              aria-label={t('dashboardAssistant.conversationHistory', 'Conversation history')}
            >
              {/* 21.1 — long conversation warning */}
              {messages.length > MAX_MESSAGES_BEFORE_WARNING && (
                <div className="mb-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800/50 dark:bg-amber-900/20 dark:text-amber-300">
                  {t('dashboardAssistant.longConversationWarning', 'Long conversation — consider clearing to improve performance')}
                </div>
              )}
              {/* 18.1 — onboarding welcome banner */}
              {!preferences?.onboardingCompleted && (
                <div className="mb-3 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3">
                  <span className="text-xl leading-none">👋</span>
                  <div className="flex-1">
                    <p className="text-sm text-slate-700 dark:text-slate-200">
                      {t(
                        'dashboardAssistant.onboarding',
                        'Welcome to Cogni! I can summarize your dashboard, answer questions, and guide your workflow. Try a quick prompt above to get started.',
                      )}
                    </p>
                    <button
                      type="button"
                      onClick={() => updatePreference('onboardingCompleted', true)}
                      className="mt-2 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-primary-dark"
                    >
                      {t('dashboardAssistant.gotIt', 'Got it')}
                    </button>
                  </div>
                </div>
              )}

              <div className={`flex items-center justify-between ${isRtl ? 'flex-row-reverse' : ''}`}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                  {t('dashboardAssistant.conversation', 'Conversation')}
                  {searchQuery && (
                    <span className="ms-2 font-normal normal-case text-primary">
                      {displayedMessages.length} {t('dashboardAssistant.results', 'result(s)')}
                    </span>
                  )}
                </p>
                {/* 16.1 — clear with confirmation */}
                {messages.length > 1 && (
                  showClearConfirm ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {t('dashboardAssistant.clearConfirm', 'Clear conversation?')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMessages([
                            {
                              role: 'model',
                              content: starterMessageForRole(role, t),
                              meta: null,
                            },
                          ]);
                          setSuggestedQuestions([]);
                          setShowClearConfirm(false);
                        }}
                        className="rounded-lg border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600 transition-colors hover:bg-red-100 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400"
                      >
                        {t('dashboardAssistant.yes', 'Yes')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowClearConfirm(false)}
                        className="rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      >
                        {t('dashboardAssistant.cancel', 'Cancel')}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                      {t('dashboardAssistant.clear', 'Clear')}
                    </button>
                  )
                )}
              </div>

              {/* 19.2 — messages container with role="log" */}
              <div role="log" aria-live="off">
                {displayedMessages.map((message, index) => (
                  <MessageBubble
                    key={`${message.role}-${index}`}
                    message={message}
                    isRtl={isRtl}
                    t={t}
                    i18n={i18n}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>

              <SuggestedQuestions
                questions={suggestedQuestions}
                onSelect={(question) => {
                  setInput(question);
                  void requestAssistant({ mode: 'message', message: question, appendUserMessage: true });
                }}
                disabled={loading}
              />
              {loading && (
                <TypingIndicator mode={lastRequest?.mode ?? 'message'} />
              )}

              {/* 19.2 — aria-live region for last assistant message */}
              <div
                aria-live="polite"
                aria-atomic="true"
                className="sr-only"
              >
                {messages.length > 0 && messages[messages.length - 1]?.role === 'model'
                  ? messages[messages.length - 1].content
                  : ''}
              </div>

              {/* 21.1 — scroll anchor */}
              <div ref={messagesEndRef} />
            </div>

            {/* 27.1 — floating scroll-to-bottom button */}
            {showScrollToBottom && (
              <button
                type="button"
                onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                aria-label="Scroll to bottom"
                className="absolute bottom-24 end-6 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg transition-all hover:bg-primary-dark"
              >
                ↓
              </button>
            )}
            {/* ── Input area ── */}
            <div
              className="border-t px-3 py-3 backdrop-blur-sm"
              style={{ background: 'var(--ca-header-bg)', borderColor: 'var(--ca-header-border)' }}
            >
              {/* Textarea + send row */}
              <div className="flex items-end gap-2">
                <div className="relative flex-1">
                  <textarea
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSend();
                      }
                    }}
                    rows={2}
                    placeholder={t(
                      'dashboardAssistant.inputPlaceholder',
                      'Ask about the dashboard…',
                    )}
                    aria-label={t('dashboardAssistant.messageInput', 'Message input')}
                    disabled={loading}
                    className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/10 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:focus:border-primary"
                    style={{ textAlign: isRtl ? 'right' : 'left' }}
                  />
                </div>

                {/* Action buttons stacked vertically */}
                <div className={`flex flex-col gap-1.5 ${isRtl ? 'items-start' : 'items-end'}`}>
                  {/* Voice input */}
                  <VoiceInputButton
                    onTranscript={(text) => {
                      setInput((prev) => (prev ? `${prev} ${text}` : text));
                    }}
                    locale={i18n.language}
                    disabled={loading}
                  />
                  {/* Send button */}
                  <button
                    type="button"
                    onClick={() => void handleSend()}
                    disabled={loading || input.trim().length === 0}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white shadow-sm transition-all hover:bg-primary-dark active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    aria-label={t('dashboardAssistant.send', 'Send')}
                  >
                    <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
                  </button>
                </div>
              </div>

              {/* Footer row: refresh only — removed "Read-only" label */}
              <div className={`mt-2 flex items-center ${queuedMessage ? 'justify-between' : 'justify-end'} ${isRtl ? 'flex-row-reverse' : ''}`}>
                {queuedMessage && (
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {t('dashboardAssistant.queued', 'Queued…')}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => void handleRefresh()}
                  disabled={loading}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-slate-800 dark:hover:text-slate-300"
                >
                  <span className={`material-symbols-outlined text-[14px] ${loading ? 'animate-spin' : ''}`}>refresh</span>
                  {t('dashboardAssistant.refresh', 'Refresh')}
                </button>
              </div>
            </div>

            {/* Settings overlay — rendered inside the panel so it stays within bounds */}
            <SettingsModal
              open={showSettings}
              onClose={() => setShowSettings(false)}
              preferences={preferences}
              onUpdatePreference={updatePreference}
              isDark={isDark}
              onSearch={() => { setShowSearch(true); }}
              onExport={exportConversation}
            />

            {/* Saved chats overlay */}
            <SavedChatsPanel
              open={showSavedChats}
              onClose={() => setShowSavedChats(false)}
              isDark={isDark}
              onLoadChat={(savedMessages) => {
                setMessages(savedMessages);
                setSuggestedQuestions([]);
                setShowSavedChats(false);
              }}
              onDeleteChat={() => {
                // Force re-render by toggling panel
                setShowSavedChats(false);
                setTimeout(() => setShowSavedChats(true), 50);
              }}
            />
          </aside>
        </div>,
        document.body,
      )}
    </>
  );
}
