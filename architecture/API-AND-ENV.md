# API and environment

## Client API base URL

Defined in [`src/config.js`](../src/config.js):

- **Development** (`import.meta.env.DEV`): `API_BASE_URL = '/api/v1'` — same origin as the Vite dev server; requests go through the **Vite proxy** (see below).
- **Production**: `API_BASE_URL = \`${BACKEND_ORIGIN}/api/v1\`` where  
  `BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || 'https://cognicare-mobile-h4ct.onrender.com'`.

## Uploads and asset URLs

`getUploadUrl(pathOrUrl)` resolves relative paths: in dev, paths are used as-is (proxy); in prod, non-absolute paths are prefixed with `BACKEND_ORIGIN`.

## Vite proxy (development only)

[`vite.config.js`](../vite.config.js) uses `loadEnv` and sets:

- `backendOrigin = env.VITE_BACKEND_ORIGIN || 'http://localhost:3000'`
- Proxy rules:
  - `/api` → `backendOrigin`
  - `/uploads` → `backendOrigin`

So the browser calls `http://localhost:5173/api/v1/...` and Vite forwards to `http://localhost:3000/api/v1/...` (or your chosen origin).

**Important:** If `VITE_BACKEND_ORIGIN` points to an unreachable host, login and API calls may fail silently or appear as “no redirect” after login. Align the backend port with your actual API process (`vite.config.js` and `config.js` both default to port 3000; keep `VITE_BACKEND_ORIGIN` aligned with your active backend process).

## Environment variables (names only)

| Variable | Role |
|----------|------|
| `VITE_BACKEND_ORIGIN` | Backend origin for production `API_BASE_URL` and upload base; also used by Vite dev proxy target |

Do **not** commit real secrets in `.env` files checked into git. Document test URLs and credentials outside the repo or in private ops docs.

## Auth pattern

[`src/hooks/useAuth.js`](../src/hooks/useAuth.js) uses `API_BASE_URL` for refresh and authenticated `fetch` wrappers. Login pages POST to `${API_BASE_URL}/auth/login` (and related auth endpoints).

Org staff invite UX in `OrgStaff` is currently scoped to existing-account invites; use the create flow for brand-new staff accounts so onboarding is non-blocking.
Org family invite UX in `OrgFamilies` is similarly scoped to existing-account invites; use create for net-new families.
`/confirm-account` now uses activated role from `/auth/activate` response to redirect users to the correct login entrypoint.
Organization signup request submission should return promptly; automated certificate analysis is background/non-blocking and manual admin review remains the reliable fallback.

## CSP (dev server)

`vite.config.js` sets `Content-Security-Policy` and other security headers on the **dev** `server.headers`. `connect-src` includes `backendOrigin` so the browser can talk to the API when needed beyond same-origin proxy behavior.
