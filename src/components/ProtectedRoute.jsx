import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { clearAuthCache } from '../hooks/useAuth';
import { API_BASE_URL } from '../config';

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
  if (!userKey || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(userKey);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readStoredValue(key) {
  if (!key || typeof localStorage === 'undefined') return '';
  return localStorage.getItem(key) || '';
}

function clearSession({ tokenKey, userKey }) {
  clearAuthCache();
  if (typeof localStorage === 'undefined') return;
  if (tokenKey) localStorage.removeItem(tokenKey);
  if (userKey) localStorage.removeItem(userKey);
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

async function fetchProfileRole(token, timeoutMs = 10_000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
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
  const token = readStoredValue(config.tokenKey);
  const user = readStoredUser(config.userKey);
  const storedRole = normalizeRole(user?.role);
  const hasLocalSession = Boolean(token && user && storedRole);
  const cacheKey = `${sessionKey}:${token}`;
  const [validationState, setValidationState] = useState(
    hasLocalSession ? 'checking' : 'denied',
  );

  useEffect(() => {
    const expectedNormalizedRoles = expectedNormalizedRolesKey
      ? expectedNormalizedRolesKey.split('|')
      : [];

    if (!hasLocalSession) {
      setValidationState('denied');
      return;
    }

    if (!expectedNormalizedRoles.includes(storedRole)) {
      setValidationState('denied');
      return;
    }

    const cached = readCachedValidation(cacheKey);
    if (cached && expectedNormalizedRoles.includes(cached.role)) {
      setValidationState('allowed');
      return;
    }

    let isCancelled = false;
    setValidationState('checking');

    fetchProfileRole(token)
      .then((serverRole) => {
        if (isCancelled) return;
        const isAllowedRole = expectedNormalizedRoles.includes(serverRole);
        if (isAllowedRole) {
          sessionValidationCache.set(cacheKey, {
            role: serverRole,
            checkedAt: Date.now(),
          });
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
    cacheKey,
    expectedNormalizedRolesKey,
    hasLocalSession,
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
