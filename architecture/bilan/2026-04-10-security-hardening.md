# 2026-04-10 Security Hardening

## Scope

- Production web container headers
- Public APK delivery safety
- Release/deployment guidance alignment

## Changes

- Hardened `nginx.conf` with:
  - `Content-Security-Policy`
  - `Strict-Transport-Security`
  - `Referrer-Policy`
  - `Permissions-Policy`
  - `X-Frame-Options: DENY`
  - `server_tokens off`
- Kept explicit APK attachment headers for `/downloads/*.apk`
- Updated the README security notes to reflect the production container posture

## Why

The public landing and dashboard app are moving toward an external pilot release. The container now ships safer default browser protections without replacing the existing 3D landing direction or changing the release-manifest download flow.

## Operational note

The current pilot still serves the Android APK from the public web app. If artifact size becomes a problem later, `mobile-release.json` can point at external object storage without redesigning the landing page.

## Follow-up Findings (Source Audit, 2026-04-10)

### Critical

1. **Cross-account cache leakage risk in `useAuth`**
   - Shared GET cache key currently uses `role:path` only.
   - Same-role account switches in one browser tab can reuse stale cached payloads.
2. **Service worker caches authenticated API responses**
   - Workbox runtime cache currently includes `/api/v1/*`.
   - Sensitive dashboard responses can persist in browser cache storage.

### High

1. **Token/session storage in `localStorage`**
   - Access and refresh tokens remain script-readable and vulnerable to XSS theft.
2. **Cache key collision risk in `cachedGet`**
   - `token.slice(0,16)` is not sufficient isolation between JWTs with shared prefixes.
3. **Route protection is mostly client-storage based**
   - Role gating exists but remains fragile as a defense-in-depth layer if backend guards drift.

### Medium

1. **RNE verification flow is still client-simulated/randomized in places** and should not be treated as production trust evidence.
2. **Fixed polling/probing strategy** can create avoidable backend load under high concurrency.
3. **Large list rendering without strict pagination contract** can degrade quickly with growth.

## Production Hardening Actions (Web)

1. Remove runtime service-worker caching for authenticated API routes.
2. Scope all in-memory caches by user/session identity and clear on login/logout/401.
3. Move toward HttpOnly cookie session strategy for production deployments.
4. Add explicit protected-route wrappers with strict role checks on all dashboard and creator routes.
5. Reduce polling load with visibility-aware intervals and backoff policies.
6. Enforce paginated API usage in admin/org/specialist heavy tables.

---

## Execution Update (2026-04-12)

### Resolved from the 2026-04-10 findings

- Cross-account cache leakage risk in `useAuth`:
  - Resolved by user/session-scoped cache keying.
- Service worker/runtime caching of authenticated API responses:
  - Resolved by removing API runtime caching from PWA Workbox config.
- RNE flow simulated/randomized trust evidence:
  - Resolved in active UI path by switching to backend analysis contract (`/org-scan-ai/analyze`) and review-driven decision state.

### Additional hardening shipped

- Specialist role parity (`careProvider`) aligned between login allowlist and route protection.
- Back-navigation fallback added to audited specialist creator pages for no-history entry.
- Specialist/UI mojibake text defects corrected in touched creator/login pages.

### Residual notes

- Web lint still reports two warnings in untouched files (`src/components/3d/CogniCompanion.jsx`, `src/pages/home/LandingPage.jsx`) for unused `motion` imports.
- Token strategy remains role-scoped local storage in this cycle (cookie-session migration intentionally deferred).
