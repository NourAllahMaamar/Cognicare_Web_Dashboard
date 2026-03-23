const MAX_ENTRIES = 500;
const entries = [];
const listeners = new Set();

function sanitizeText(value, maxLen = 300) {
  if (value == null) return '';
  const str = String(value).slice(0, maxLen);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toSafeNumber(value, fallback = 0) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return n;
}

function notify() {
  listeners.forEach((cb) => {
    try { cb(); } catch {}
  });
}

export function recordApiMetric(metric) {
  const safeMetric = {
    role: sanitizeText(metric?.role, 40),
    method: sanitizeText(metric?.method, 12),
    path: sanitizeText(metric?.path, 400),
    status: Math.max(0, Math.floor(toSafeNumber(metric?.status, 0))),
    ok: Boolean(metric?.ok),
    retried: Boolean(metric?.retried),
    durationMs: Math.max(0, Math.round(toSafeNumber(metric?.durationMs, 0))),
    route: sanitizeText(metric?.route, 300),
    error: sanitizeText(metric?.error, 500),
    correlationId: sanitizeText(metric?.correlationId, 64),
  };

  entries.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    ...safeMetric,
  });

  if (entries.length > MAX_ENTRIES) {
    entries.length = MAX_ENTRIES;
  }

  notify();
}

export function getRecentApiMetrics(limit = 100) {
  return entries.slice(0, limit);
}

export function subscribeToApiMetrics(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export function getMetricsSince(windowMs = 5 * 60 * 1000) {
  const cutoff = Date.now() - windowMs;
  return entries.filter((e) => e.timestamp >= cutoff);
}
