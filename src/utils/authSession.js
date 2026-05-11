const SESSION_CONFIG = {
  admin: {
    tokenKey: 'adminToken',
    refreshKey: 'adminRefreshToken',
    userKey: 'adminUser',
  },
  orgLeader: {
    tokenKey: 'orgLeaderToken',
    refreshKey: 'orgLeaderRefreshToken',
    userKey: 'orgLeaderUser',
  },
  specialist: {
    tokenKey: 'specialistToken',
    refreshKey: 'specialistRefreshToken',
    userKey: 'specialistUser',
  },
};

const accessTokens = new Map();

function getConfig(role) {
  return SESSION_CONFIG[role] || {};
}

function safeSessionStorage() {
  return typeof sessionStorage === 'undefined' ? null : sessionStorage;
}

function safeLocalStorage() {
  return typeof localStorage === 'undefined' ? null : localStorage;
}

export function getAccessToken(role) {
  return accessTokens.get(role) || '';
}

export function setAccessToken(role, accessToken) {
  if (accessToken) {
    accessTokens.set(role, accessToken);
  } else {
    accessTokens.delete(role);
  }
}

export function getStoredUser(role) {
  const { userKey } = getConfig(role);
  if (!userKey) return null;

  const session = safeSessionStorage();
  const local = safeLocalStorage();
  const raw = session?.getItem(userKey) || local?.getItem(userKey);

  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeAuthSession(role, { accessToken, user }) {
  const { tokenKey, refreshKey, userKey } = getConfig(role);
  const session = safeSessionStorage();
  const local = safeLocalStorage();

  setAccessToken(role, accessToken);
  if (userKey && user) {
    session?.setItem(userKey, JSON.stringify(user));
  }

  if (local) {
    if (tokenKey) local.removeItem(tokenKey);
    if (refreshKey) local.removeItem(refreshKey);
    if (userKey) local.removeItem(userKey);
  }
}

export function updateStoredUser(role, updater) {
  const { userKey } = getConfig(role);
  const session = safeSessionStorage();
  if (!userKey || !session) return null;

  const current = getStoredUser(role) || {};
  const nextUser =
    typeof updater === 'function' ? updater(current) : { ...current, ...updater };
  session.setItem(userKey, JSON.stringify(nextUser));
  return nextUser;
}

export function clearAuthSession(role) {
  const { tokenKey, refreshKey, userKey } = getConfig(role);
  const session = safeSessionStorage();
  const local = safeLocalStorage();

  accessTokens.delete(role);
  if (userKey) session?.removeItem(userKey);
  if (tokenKey) local?.removeItem(tokenKey);
  if (refreshKey) local?.removeItem(refreshKey);
  if (userKey) local?.removeItem(userKey);
}

export function clearAllLegacyAuthTokens() {
  const local = safeLocalStorage();
  if (!local) return;

  for (const { tokenKey, refreshKey } of Object.values(SESSION_CONFIG)) {
    if (tokenKey) local.removeItem(tokenKey);
    if (refreshKey) local.removeItem(refreshKey);
  }
}

export function getSessionRoleKeys() {
  return Object.keys(SESSION_CONFIG);
}
