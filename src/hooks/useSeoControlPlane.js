import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';

const CONTROL_PLANE_PATH = '/admin/seo/control-plane';
const ACTIONS_PATH = '/admin/seo/actions';
const HISTORY_PATH = '/admin/seo/actions/history?limit=8';
const TOOL_STATUS_PATH = '/admin/seo/tools/status';
const POLL_INTERVAL_MS = 45_000;
const SEO_SNAPSHOT_KEY = 'adminSeoControlPlaneSnapshot.v1';

const DEFAULT_PUBLIC_ROUTES = ['/', '/admin/login', '/org/login', '/specialist/login'];
const DEFAULT_CRAWLER_POLICIES = [
  { userAgent: 'Googlebot', allow: ['/'], disallow: ['/admin/dashboard', '/org/dashboard', '/specialist/dashboard', '/api'], crawlDelay: null, enabled: true },
  { userAgent: 'Bingbot', allow: ['/'], disallow: ['/admin/dashboard', '/org/dashboard', '/specialist/dashboard', '/api'], crawlDelay: null, enabled: true },
  { userAgent: '*', allow: ['/'], disallow: ['/admin/dashboard', '/org/dashboard', '/specialist/dashboard', '/api'], crawlDelay: null, enabled: true },
];
const DEFAULT_TOOLS = [
  { tool: 'github_actions', label: 'GitHub Actions', status: 'DISABLED', summary: 'Awaiting backend status.', lastSuccessAt: null, lastErrorSummary: '' },
  { tool: 'jenkins', label: 'Jenkins', status: 'DISABLED', summary: 'Awaiting backend status.', lastSuccessAt: null, lastErrorSummary: '' },
  { tool: 'search_console', label: 'Search Console', status: 'DISABLED', summary: 'Awaiting backend status.', lastSuccessAt: null, lastErrorSummary: '' },
  { tool: 'lighthouse', label: 'Lighthouse', status: 'DISABLED', summary: 'Awaiting backend status.', lastSuccessAt: null, lastErrorSummary: '' },
  { tool: 'zap', label: 'OWASP ZAP', status: 'DISABLED', summary: 'Awaiting backend status.', lastSuccessAt: null, lastErrorSummary: '' },
  { tool: 'sentry', label: 'Sentry', status: 'DISABLED', summary: 'Awaiting backend status.', lastSuccessAt: null, lastErrorSummary: '' },
];

function readSeoSnapshot() {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(SEO_SNAPSHOT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function writeSeoSnapshot(snapshot) {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SEO_SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Ignore snapshot persistence failures.
  }
}

function uniqueStrings(values = []) {
  return Array.from(new Set(values.filter((value) => typeof value === 'string' && value.trim()).map((value) => value.trim())));
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeCrawlerPolicy(policy, index) {
  return {
    id: policy?.id || `${policy?.userAgent || 'agent'}-${index}`,
    userAgent: policy?.userAgent || '*',
    allow: uniqueStrings(toArray(policy?.allow)),
    disallow: uniqueStrings(toArray(policy?.disallow)),
    crawlDelay: policy?.crawlDelay ?? null,
    enabled: policy?.enabled !== false,
  };
}

function normalizeCollection(source, keys = []) {
  for (const key of keys) {
    if (Array.isArray(source?.[key])) return source[key];
  }
  return [];
}

function normalizeToolStatus(rawStatus) {
  const status = String(rawStatus || 'DISABLED').toUpperCase();
  if (['CONNECTED', 'DEGRADED', 'DISABLED', 'ERROR'].includes(status)) return status;
  return 'DISABLED';
}

function normalizeJobStatus(rawStatus) {
  const status = String(rawStatus || '').toUpperCase();
  if (['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'].includes(status)) return status;
  if (status === 'ERROR') return 'FAILED';
  return 'PENDING';
}

function normalizeToolIdentifier(identifier) {
  const normalized = String(identifier || '').toLowerCase();
  if (normalized === 'github') return 'github_actions';
  if (normalized === 'searchconsole') return 'search_console';
  if (normalized === 'search_console') return 'search_console';
  if (normalized === 'github_actions') return 'github_actions';
  return normalized || 'unknown';
}

function normalizeControlPlane(payload) {
  const robotsStatus = payload?.robotsStatus || {};
  const sitemapStatus = payload?.sitemapStatus || {};
  const crawlerPolicies = Array.isArray(payload?.crawlerPolicies) && payload.crawlerPolicies.length
    ? payload.crawlerPolicies.map(normalizeCrawlerPolicy)
    : DEFAULT_CRAWLER_POLICIES.map(normalizeCrawlerPolicy);

  return {
    siteOrigin: payload?.siteOrigin || (typeof window !== 'undefined' ? window.location.origin : ''),
    publicRoutes: uniqueStrings(Array.isArray(payload?.publicRoutes) && payload.publicRoutes.length ? payload.publicRoutes : DEFAULT_PUBLIC_ROUTES),
    crawlerPolicies,
    robotsStatus: {
      exists: robotsStatus?.exists ?? robotsStatus?.managed !== false,
      url: robotsStatus?.url || '/robots.txt',
      lastGeneratedAt: robotsStatus?.lastGeneratedAt || robotsStatus?.updatedAt || null,
      warnings: uniqueStrings(normalizeCollection(robotsStatus, ['warnings', 'issues'])),
      paths: uniqueStrings(normalizeCollection(robotsStatus, ['paths', 'allowedPaths', 'listedPaths', 'publicRoutes'])),
      driftDetected: Boolean(robotsStatus?.driftDetected),
    },
    sitemapStatus: {
      exists: sitemapStatus?.exists ?? sitemapStatus?.configured !== false,
      url: sitemapStatus?.url || '/sitemap.xml',
      lastGeneratedAt: sitemapStatus?.lastGeneratedAt || sitemapStatus?.updatedAt || null,
      warnings: uniqueStrings(normalizeCollection(sitemapStatus, ['warnings', 'issues'])),
      paths: uniqueStrings(normalizeCollection(sitemapStatus, ['paths', 'listedPaths', 'urls', 'publicRoutes'])),
      count: Number(sitemapStatus?.count || sitemapStatus?.publicRouteCount || 0),
      driftDetected: Boolean(sitemapStatus?.driftDetected),
    },
    toolStatuses: payload?.toolStatuses,
    warnings: uniqueStrings(normalizeCollection(payload, ['warnings', 'issues'])),
    lastAuditAt: payload?.lastAuditAt || payload?.updatedAt || null,
  };
}

function normalizeToolStatuses(statuses, fallback = []) {
  const merged = [...DEFAULT_TOOLS];
  const source = Array.isArray(statuses) ? statuses : Array.isArray(statuses?.toolStatuses) ? statuses.toolStatuses : [];
  const candidates = source.length ? source : fallback;

  candidates.forEach((item) => {
    const identifier = normalizeToolIdentifier(item?.tool || item?.name || item?.id);
    const index = merged.findIndex((entry) => entry.tool === identifier);
    const normalized = {
      tool: identifier || item?.label || 'unknown',
      label: item?.label || item?.name || DEFAULT_TOOLS[index]?.label || identifier || 'Tool',
      status: normalizeToolStatus(item?.status),
      summary: item?.summary || item?.description || item?.message || '',
      lastSuccessAt: item?.lastSuccessfulRunAt || item?.lastSuccessAt || item?.lastCompletedAt || null,
      lastErrorSummary: item?.lastErrorSummary || item?.error || '',
    };

    if (index >= 0) {
      merged[index] = { ...merged[index], ...normalized };
    } else {
      merged.push(normalized);
    }
  });

  return merged;
}

function enrichScanToolStatuses(toolStatuses, historyItems = []) {
  const next = [...toolStatuses];
  const latestLighthouse = historyItems.find((item) => item.action === 'TRIGGER_LIGHTHOUSE_SCAN');
  const latestZap = historyItems.find((item) => item.action === 'TRIGGER_ZAP_SCAN');

  function applyScanStatus(toolKey, latest) {
    const index = next.findIndex((item) => item.tool === toolKey);
    if (index < 0 || !latest) return;

    if (latest.status === 'COMPLETED') {
      next[index] = {
        ...next[index],
        status: 'CONNECTED',
        lastSuccessAt: latest.finishedAt || latest.startedAt || null,
        summary: latest.summary || next[index].summary,
        lastErrorSummary: '',
      };
      return;
    }

    if (latest.status === 'FAILED') {
      next[index] = {
        ...next[index],
        status: 'ERROR',
        summary: latest.summary || next[index].summary,
        lastErrorSummary: latest.summary || 'Latest run failed.',
      };
      return;
    }

    next[index] = {
      ...next[index],
      status: 'DEGRADED',
      summary: latest.summary || 'Queued or running.',
    };
  }

  applyScanStatus('lighthouse', latestLighthouse);
  applyScanStatus('zap', latestZap);
  return next;
}

function normalizeHistory(payload) {
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : Array.isArray(payload?.history)
        ? payload.history
        : [];

  return {
    items: items.map((entry, index) => ({
      id: entry?.id || entry?.jobId || `${entry?.action || 'job'}-${index}`,
      action: entry?.action || entry?.type || 'unknown_action',
      status: normalizeJobStatus(entry?.status),
      target: entry?.target || entry?.targetPath || '',
      startedAt: entry?.startedAt || entry?.createdAt || null,
      finishedAt: entry?.finishedAt || entry?.completedAt || null,
      summary: entry?.summary || entry?.message || '',
      correlationId: entry?.correlationId || '',
    })),
    nextCursor: payload?.nextCursor || null,
  };
}

function createIdempotencyKey() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function useSeoControlPlane() {
  const { authGet, authMutate } = useAuth('admin');
  const initialSnapshot = readSeoSnapshot();
  const [loading, setLoading] = useState(!initialSnapshot);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runningAction, setRunningAction] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [controlPlane, setControlPlane] = useState(() => normalizeControlPlane(initialSnapshot?.controlPlane || {}));
  const [toolStatuses, setToolStatuses] = useState(() => normalizeToolStatuses(initialSnapshot?.toolStatuses || DEFAULT_TOOLS));
  const [history, setHistory] = useState(() => (Array.isArray(initialSnapshot?.history) ? initialSnapshot.history : []));
  const [historyCursor, setHistoryCursor] = useState(() => initialSnapshot?.historyCursor || null);
  const [lastSnapshotAt, setLastSnapshotAt] = useState(() => initialSnapshot?.savedAt || null);

  const load = useCallback(async ({ silent = false, cursor = null } = {}) => {
    if (silent) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError('');

    try {
      const historyPath = cursor ? `${HISTORY_PATH}&cursor=${encodeURIComponent(cursor)}` : HISTORY_PATH;
      const [controlPlaneResponse, toolStatusResponse, historyResponse] = await Promise.all([
        authGet(CONTROL_PLANE_PATH, { skipCache: true }).catch(() => ({})),
        authGet(TOOL_STATUS_PATH, { skipCache: true }).catch(() => []),
        authGet(historyPath, { skipCache: true }).catch(() => ({ items: [] })),
      ]);

      const normalizedControlPlane = normalizeControlPlane(controlPlaneResponse);
      const normalizedHistory = normalizeHistory(historyResponse);
      const normalizedToolStatuses = normalizeToolStatuses(toolStatusResponse, normalizedControlPlane.toolStatuses);
      const scanAwareToolStatuses = enrichScanToolStatuses(normalizedToolStatuses, normalizedHistory.items);
      let nextHistory = normalizedHistory.items;

      setControlPlane(normalizedControlPlane);
      setToolStatuses(scanAwareToolStatuses);
      setHistory((prev) => {
        nextHistory = cursor ? [...prev, ...normalizedHistory.items] : normalizedHistory.items;
        return nextHistory;
      });
      setHistoryCursor(normalizedHistory.nextCursor);
      const snapshot = {
        controlPlane: normalizedControlPlane,
        toolStatuses: scanAwareToolStatuses,
        history: nextHistory,
        historyCursor: normalizedHistory.nextCursor,
        savedAt: Date.now(),
      };
      writeSeoSnapshot(snapshot);
      setLastSnapshotAt(snapshot.savedAt);
    } catch (err) {
      const snapshot = readSeoSnapshot();
      if (snapshot) {
        const snapshotControlPlane = normalizeControlPlane(snapshot.controlPlane || {});
        const snapshotHistory = Array.isArray(snapshot.history) ? snapshot.history : [];
        const snapshotTools = enrichScanToolStatuses(
          normalizeToolStatuses(snapshot.toolStatuses || DEFAULT_TOOLS, snapshotControlPlane.toolStatuses),
          snapshotHistory,
        );
        setControlPlane(snapshotControlPlane);
        setToolStatuses(snapshotTools);
        setHistory(snapshotHistory);
        setHistoryCursor(snapshot.historyCursor || null);
        setLastSnapshotAt(snapshot.savedAt || null);
        setError('Something is wrong with AI/SEO services right now. Showing latest saved data.');
      } else {
        setError(err?.message || 'Failed to load SEO control plane.');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authGet]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      load({ silent: true });
    }, POLL_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [load]);

  const saveControlPlane = useCallback(async (draft) => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        siteOrigin: draft?.siteOrigin || controlPlane.siteOrigin,
        publicRoutes: uniqueStrings(draft?.publicRoutes || controlPlane.publicRoutes),
        crawlerPolicies: (draft?.crawlerPolicies || controlPlane.crawlerPolicies).map((policy) => ({
          userAgent: policy.userAgent,
          allow: uniqueStrings(policy.allow),
          disallow: uniqueStrings(policy.disallow),
          crawlDelay: policy.crawlDelay === '' || policy.crawlDelay === null ? null : Number(policy.crawlDelay),
          enabled: Boolean(policy.enabled),
        })),
      };

      const response = await authMutate(CONTROL_PLANE_PATH, { method: 'PATCH', body: payload });
      setControlPlane(normalizeControlPlane({ ...controlPlane, ...payload, ...response }));
      setSuccess('control-plane-saved');
      await load({ silent: true });
      return response;
    } catch (err) {
      setError(err?.message || 'Failed to save SEO control plane.');
      throw err;
    } finally {
      setSaving(false);
    }
  }, [authMutate, controlPlane, load]);

  const runAction = useCallback(async ({ action, targetPath = '', tool = '' }) => {
    setRunningAction(action);
    setError('');
    setSuccess('');

    try {
      const response = await authMutate(ACTIONS_PATH, {
        method: 'POST',
        body: {
          action,
          targetPath: targetPath || undefined,
          tool: tool || undefined,
          idempotencyKey: createIdempotencyKey(),
        },
      });
      setSuccess(action);
      await load({ silent: true });
      return response;
    } catch (err) {
      setError(err?.message || 'Failed to run SEO action.');
      throw err;
    } finally {
      setRunningAction('');
    }
  }, [authMutate, load]);

  const loadMoreHistory = useCallback(async () => {
    if (!historyCursor) return;
    await load({ silent: true, cursor: historyCursor });
  }, [historyCursor, load]);

  const resetFeedback = useCallback(() => {
    setError('');
    setSuccess('');
  }, []);

  const derived = useMemo(() => ({
    loading,
    refreshing,
    saving,
    runningAction,
    error,
    success,
    controlPlane,
    toolStatuses,
    history,
    hasMoreHistory: Boolean(historyCursor),
    lastSnapshotAt,
  }), [controlPlane, error, history, historyCursor, lastSnapshotAt, loading, refreshing, runningAction, saving, success, toolStatuses]);

  return {
    ...derived,
    reload: load,
    saveControlPlane,
    runAction,
    loadMoreHistory,
    resetFeedback,
  };
}

export const seoControlPlaneDefaults = {
  publicRoutes: DEFAULT_PUBLIC_ROUTES,
  crawlerPolicies: DEFAULT_CRAWLER_POLICIES,
  tools: DEFAULT_TOOLS,
};
