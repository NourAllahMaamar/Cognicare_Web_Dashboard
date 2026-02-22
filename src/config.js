// API Configuration
// Use relative path in dev so Vite proxy handles it (avoids CORS); full URL for production build
const isDev = import.meta.env.DEV;
const BACKEND_ORIGIN = 'https://cognicare-mobile-h4ct.onrender.com';
export const API_BASE_URL = isDev ? '/api/v1' : `${BACKEND_ORIGIN}/api/v1`;
// For uploaded images: relative path in dev (proxy), full URL in prod
export const getUploadUrl = (pathOrUrl) =>
  !pathOrUrl ? '' : pathOrUrl.startsWith('http') ? pathOrUrl : (isDev ? pathOrUrl : `${BACKEND_ORIGIN}${pathOrUrl}`);

