# Auth and security — `cognicareweb/`

## Mechanism

- **JWT** stored in **`localStorage`** per role (`useAuth.js`): `adminToken`, `orgLeaderToken`, `specialistToken` (+ refresh + serialized user).
- **Login:** `POST /api/v1/auth/login` with JSON; response tokens stored, user redirected to dashboard.
- **Authenticated requests:** `Authorization: Bearer <accessToken>` via `authFetch` / `authGet` / `authMutate`.
- **Refresh:** On 401, `POST /auth/refresh` with refresh token; on failure, clear storage and redirect to role login.

## Session handling

- **No httpOnly cookies** in observed code — XSS can steal tokens. Mitigate with strict CSP (partially set in `vite.config.js`), dependency audits, avoid injecting HTML.
- **Separate keys per role** reduce cross-dashboard leakage but user could still paste tokens.

## Authorization

- **Server-side only** — UI must not be trusted. All checks duplicated in Nest API.
- Layout components read `localStorage` for display; **inferred** no route guard component beyond parent layout redirect.

## Sensitive flows

- **Settings:** profile PATCH, change-password PATCH — same as mobile API.
- **Import:** multipart Excel to `/import/*` — org leader only on API side.

## Vite / browser security

- Dev server sets **CSP**, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` (`vite.config.js`).
- `connect-src` includes `backendOrigin` for API calls.

## Proxy

- Dev: `/api` → `VITE_BACKEND_ORIGIN`. Misconfiguration causes “login does not redirect” (documented in vite comments).

## Recommendations

| Priority | Action |
|----------|--------|
| High | Add Playwright + test refresh + logout |
| Medium | Document token storage threat model for auditors |
| Medium | Add `.env.example` with `VITE_BACKEND_ORIGIN` |
| Low | Consider httpOnly cookie session **if** API supports it |
