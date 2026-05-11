// API Configuration
// Dev can switch between the Vite proxy and Render; production stays Render-safe.

export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const isDev = import.meta.env.DEV;
export const LOCAL_BACKEND_ORIGIN =
  import.meta.env.VITE_LOCAL_BACKEND_ORIGIN || 'http://localhost:3000';
export const RENDER_BACKEND_ORIGIN =
  import.meta.env.VITE_RENDER_BACKEND_ORIGIN ||
  'https://cognicare-mobile-h4ct.onrender.com';
export const DEFAULT_PROD_BACKEND_ORIGIN = RENDER_BACKEND_ORIGIN;
const BACKEND_SOURCE_KEY = 'cognicare.backendSource.v1';

function isLocalOrigin(origin) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(String(origin || '').trim());
}

function normalizeBackendOrigin(origin) {
  const candidate = String(origin || '').trim().replace(/\/+$/, '');

  if (!candidate) return '';

  // A production bundle must never point at the viewer's own machine.
  // This protects Azure/Render builds from accidentally baking in a local .env.
  if (!isDev && isLocalOrigin(candidate)) {
    return DEFAULT_PROD_BACKEND_ORIGIN;
  }

  return candidate;
}

export function getBackendSource() {
  if (typeof window === 'undefined') return isDev ? 'local' : 'render';
  const stored = window.localStorage.getItem(BACKEND_SOURCE_KEY);
  if (stored === 'render' || stored === 'local') return stored;
  return isDev ? 'local' : 'render';
}

export function setBackendSource(source) {
  if (typeof window === 'undefined') return;
  if (source === 'render' || source === 'local') {
    window.localStorage.setItem(BACKEND_SOURCE_KEY, source);
  }
}

export function getBackendOrigin(source = getBackendSource()) {
  if (source === 'render') return RENDER_BACKEND_ORIGIN;
  return normalizeBackendOrigin(
    import.meta.env.VITE_BACKEND_ORIGIN ||
    (isDev ? LOCAL_BACKEND_ORIGIN : DEFAULT_PROD_BACKEND_ORIGIN)
  );
}

const BACKEND_ORIGIN = getBackendOrigin();
export const API_BASE_URL =
  isDev && getBackendSource() === 'local'
    ? '/api/v1'
    : `${BACKEND_ORIGIN}/api/v1`;
// For uploaded images: relative path in dev (proxy), full URL in prod
export const getUploadUrl = (pathOrUrl) =>
  !pathOrUrl ? '' : pathOrUrl.startsWith('http') ? pathOrUrl : (isDev && getBackendSource() === 'local' ? pathOrUrl : `${BACKEND_ORIGIN}${pathOrUrl}`);
