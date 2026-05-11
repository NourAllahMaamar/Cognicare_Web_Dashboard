import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';
import { recordApiMetric } from '../utils/performanceMonitor';
import {
  clearAllLegacyAuthTokens,
  clearAuthSession,
  getAccessToken,
  getStoredUser,
  storeAuthSession,
} from '../utils/authSession';

/* ── In-memory GET cache (shared across all useAuth instances) ── */
const _getCache = new Map();
const CACHE_TTL = 60_000; // 60 seconds default

export function clearAuthCache() {
  _getCache.clear();
}

/**
 * Reusable auth hook for role-based dashboard sessions.
 * Handles token storage, refresh, and authenticated fetch with auto-retry on 401.
 *
 * @param {'admin' | 'orgLeader' | 'specialist'} role
 */
export function useAuth(role) {
  const navigate = useNavigate();

  const keys = useMemo(() => ({
    admin: { token: 'adminToken', refresh: 'adminRefreshToken', user: 'adminUser', loginPath: '/admin/login' },
    orgLeader: { token: 'orgLeaderToken', refresh: 'orgLeaderRefreshToken', user: 'orgLeaderUser', loginPath: '/org/login' },
    specialist: { token: 'specialistToken', refresh: 'specialistRefreshToken', user: 'specialistUser', loginPath: '/specialist/login' },
  })[role], [role]);

  const getToken = useCallback(() => getAccessToken(role), [role]);
  const getUser = useCallback(() => getStoredUser(role), [role]);

  const handleSessionExpired = useCallback(() => {
    clearAuthCache();
    clearAuthSession(role);
    navigate(keys.loginPath);
  }, [navigate, keys, role]);

  const refreshAccessToken = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      if (res.ok) {
        const data = await res.json();
        storeAuthSession(role, data);
        return data.accessToken;
      }
      handleSessionExpired();
      return null;
    } catch {
      handleSessionExpired();
      return null;
    }
  }, [handleSessionExpired, role]);

  const ensureSession = useCallback(async () => {
    clearAllLegacyAuthTokens();
    const token = getToken();
    const user = getUser();
    if (token && user) {
      return { accessToken: token, user };
    }

    const refreshedToken = await refreshAccessToken();
    const refreshedUser = getStoredUser(role);
    return refreshedToken && refreshedUser
      ? { accessToken: refreshedToken, user: refreshedUser }
      : null;
  }, [getToken, getUser, refreshAccessToken, role]);

  /**
   * Authenticated fetch with auto-retry on 401.
   * @param {string} path - API path (relative to API_BASE_URL or absolute)
   * @param {RequestInit} options - fetch options
   * @returns {Promise<Response>}
   */
  const authFetch = useCallback(async (path, options = {}) => {
    const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    let token = getToken();
    const startedAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const method = (options.method || 'GET').toUpperCase();
    let status = 0;
    let ok = false;
    let retried = false;
    let errorMessage;

    const doFetch = (t) => fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options.headers,
        ...(t ? { 'Authorization': `Bearer ${t}` } : {}),
      },
    });

    try {
      let res = await doFetch(token);
      status = res.status;
      ok = res.ok;

      if (res.status === 401) {
        const newToken = await refreshAccessToken();
        if (!newToken) return res;
        retried = true;
        res = await doFetch(newToken);
        status = res.status;
        ok = res.ok;
        if (res.status === 401) { handleSessionExpired(); }
      }

      return res;
    } catch (err) {
      errorMessage = err?.message || 'Network error';
      throw err;
    } finally {
      const endedAt = (typeof performance !== 'undefined' ? performance.now() : Date.now());
      recordApiMetric({
        role,
        method,
        path,
        status,
        ok,
        retried,
        durationMs: Math.round(endedAt - startedAt),
        route: typeof window !== 'undefined' ? window.location.pathname : '',
        error: errorMessage,
      });
    }
  }, [getToken, refreshAccessToken, handleSessionExpired, role]);

  /**
   * Convenience: authenticated GET that returns parsed JSON.
   * Supports in-memory TTL caching. Pass { skipCache: true } to bypass.
   */
  const authGet = useCallback(async (path, { ttl = CACHE_TTL, skipCache = false } = {}) => {
    const userId = String(getUser()?.id || getUser()?._id || '').trim();
    const token = getToken() || '';
    const tokenScope = token ? token.slice(-16) : 'no-token';
    const userScope = userId || 'anonymous';
    const cacheKey = `${role}:${userScope}:${tokenScope}:${path}`;

    if (!skipCache) {
      const cached = _getCache.get(cacheKey);
      if (cached && Date.now() - cached.ts < ttl) {
        return structuredClone(cached.data);
      }
    }

    const res = await authFetch(path);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Object.assign(new Error(err.message || `HTTP ${res.status}`), { status: res.status });
    }
    const data = await res.json();
    _getCache.set(cacheKey, { ts: Date.now(), data });
    return data;
  }, [authFetch, getToken, getUser, role]);

  /**
   * Convenience: authenticated POST/PATCH/DELETE with JSON body.
   */
  const authMutate = useCallback(async (path, { method = 'POST', body, isFormData = false } = {}) => {
    const headers = isFormData ? {} : { 'Content-Type': 'application/json' };
    const res = await authFetch(path, {
      method,
      headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : undefined),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Object.assign(new Error(err.message || `HTTP ${res.status}`), { status: res.status });
    }
    _getCache.clear(); // Invalidate all cached GETs after any mutation
    return res.json().catch(() => ({}));
  }, [authFetch]);

  const logout = useCallback(() => {
    const token = getToken();
    fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }).catch(() => {});
    handleSessionExpired();
  }, [getToken, handleSessionExpired]);

  /** Manually clear the in-memory GET cache */
  const clearCache = useCallback(() => clearAuthCache(), []);

  return { getToken, getUser, ensureSession, authFetch, authGet, authMutate, logout, handleSessionExpired, refreshAccessToken, clearCache };
}
