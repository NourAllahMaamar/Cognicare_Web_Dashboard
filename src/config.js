// API Configuration


export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const isDev = import.meta.env.DEV;
const DEFAULT_PROD_BACKEND_ORIGIN =
  'https://cognicare-mobile-h4ct.onrender.com';
const BACKEND_ORIGIN =
  import.meta.env.VITE_BACKEND_ORIGIN ||
  (isDev ? 'https://cognicare-mobile-h4ct.onrender.com' : DEFAULT_PROD_BACKEND_ORIGIN);
export const API_BASE_URL = isDev ? '/api/v1' : `${BACKEND_ORIGIN}/api/v1`;
// For uploaded images: relative path in dev (proxy), full URL in prod
export const getUploadUrl = (pathOrUrl) =>
  !pathOrUrl ? '' : pathOrUrl.startsWith('http') ? pathOrUrl : (isDev ? pathOrUrl : `${BACKEND_ORIGIN}${pathOrUrl}`);
