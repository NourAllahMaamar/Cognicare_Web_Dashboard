import { API_BASE_URL } from './config';

// Simple in-memory cache for GET responses keyed by URL.
const responseCache = new Map();

function isFresh(entry, ttlMs) {
  if (!entry) return false;
  return Date.now() - entry.timestamp < ttlMs;
}

/**
 * Cached GET helper using the browser fetch API.
 *
 * - For GET requests only.
 * - Uses a simple in-memory cache with a short TTL (default 60s).
 * - Accepts an optional `token` for Bearer authentication.
 */
export async function cachedGet(path, { ttlMs = 60_000, signal, token } = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  // Include a token slice in the key so different sessions never share cache.
  const cacheKey = token ? `${url}::${token.slice(0, 16)}` : url;

  const cached = responseCache.get(cacheKey);
  if (isFresh(cached, ttlMs)) {
    return structuredClone(cached.data);
  }

  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include',
    headers,
    signal,
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const error = new Error(errBody.message || `HTTP ${res.status}`);
    error.status = res.status;
    throw error;
  }

  const data = await res.json();
  responseCache.set(cacheKey, { timestamp: Date.now(), data });
  return structuredClone(data);
}

