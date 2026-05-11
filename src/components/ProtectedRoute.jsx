import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { clearAuthCache } from '../hooks/useAuth';
import { API_BASE_URL } from '../config';
import {
  clearAuthSession,
  getAccessToken,
  getStoredUser,
  storeAuthSession,
} from '../utils/authSession';

const SESSION_CONFIG = {
  admin: {
    loginPath: '/admin/login',
    tokenKey: 'adminToken',
    userKey: 'adminUser',
    allowedRoles: ['admin'],
  },
  orgLeader: {
    loginPath: '/org/login',
    tokenKey: 'orgLeaderToken',
    userKey: 'orgLeaderUser',
    allowedRoles: ['organization_leader'],
  },
  specialist: {
    loginPath: '/specialist/login',
    tokenKey: 'specialistToken',
    userKey: 'specialistUser',
    allowedRoles: [
      'psychologist',
      'speech_therapist',
      'occupational_therapist',
      'doctor',
      'volunteer',
      'careProvider',
    ],
  },
};

const SESSION_VALIDATION_TTL_MS = 60_000;
const sessionValidationCache = new Map();

function readStoredUser(userKey) {
  if (!userKey) return null;
  const sessionKey = Object.entries(SESSION_CONFIG).find(
    ([, config]) => config.userKey === userKey,
  )?.[0];
  return sessionKey ? getStoredUser(sessionKey) : null;
}

function clearSession({ tokenKey }) {
  clearAuthCache();
  const sessionKey = Object.entries(SESSION_CONFIG).find(
    ([, config]) => config.tokenKey === tokenKey,
  )?.[0];
  if (sessionKey) clearAuthSession(sessionKey);
}

function normalizeRole(role) {
  return String(role || '').trim().toLowerCase();
}

function readCachedValidation(cacheKey) {
  const cached = sessionValidationCache.get(cacheKey);
  if (!cached) return null;
  if (Date.now() - cached.checkedAt > SESSION_VALIDATION_TTL_MS) {
    sessionValidationCache.delete(cacheKey);
    return null;
  }
  return cached;
}

async function refreshSession(sessionKey, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`REFRESH_${res.status}`);
    const payload = await res.json();
    storeAuthSession(sessionKey, payload);
    return payload;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function fetchProfileRole(token, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`PROFILE_${res.status}`);
    }
    const payload = await res.json();
    return normalizeRole(payload?.role);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export default function ProtectedRoute({
  sessionKey,
  allowedRoles,
  loginPath,
  children,
}) {
  const location = useLocation();
  const config = SESSION_CONFIG[sessionKey] || {};
  const expectedRoles = allowedRoles || config.allowedRoles || [];
  const expectedNormalizedRolesKey = expectedRoles
    .map((role) => normalizeRole(role))
    .join('|');
  const targetLoginPath = loginPath || config.loginPath || '/';
  const token = getAccessToken(sessionKey);
  const user = readStoredUser(config.userKey);
  const storedRole = normalizeRole(user?.role);
  const hasLocalSession = Boolean(token && user && storedRole);
  const [validationState, setValidationState] = useState('checking');

  useEffect(() => {
    const expectedNormalizedRoles = expectedNormalizedRolesKey
      ? expectedNormalizedRolesKey.split('|')
      : [];

    let activeToken = token;
    let activeRole = storedRole;

    let isCancelled = false;
    setValidationState('checking');

    const validate = async () => {
      if (!hasLocalSession) {
        const refreshed = await refreshSession(sessionKey);
        activeToken = refreshed?.accessToken || '';
        activeRole = normalizeRole(refreshed?.user?.role);
      }

      if (!activeToken || !expectedNormalizedRoles.includes(activeRole)) {
        throw new Error('DENIED');
      }

      const activeCacheKey = `${sessionKey}:${activeToken}`;
      const cached = readCachedValidation(activeCacheKey);
      if (cached && expectedNormalizedRoles.includes(cached.role)) {
        return cached.role;
      }

      const serverRole = await fetchProfileRole(activeToken);
      sessionValidationCache.set(activeCacheKey, {
        role: serverRole,
        checkedAt: Date.now(),
      });
      return serverRole;
    };

    validate()
      .then((serverRole) => {
        if (isCancelled) return;
        const isAllowedRole = expectedNormalizedRoles.includes(serverRole);
        if (isAllowedRole) {
          setValidationState('allowed');
          return;
        }
        setValidationState('denied');
      })
      .catch(() => {
        if (isCancelled) return;
        setValidationState('denied');
      });

    return () => {
      isCancelled = true;
    };
  }, [
    expectedNormalizedRolesKey,
    hasLocalSession,
    sessionKey,
    storedRole,
    token,
  ]);

  if (validationState === 'checking') {
    return (
      <div className="min-h-[40vh] flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (validationState !== 'allowed') {
    clearSession(config);
    return <Navigate to={targetLoginPath} replace state={{ from: location.pathname }} />;
  }

  return children || <Outlet />;
}
