# Technical debt and recommendations — `cognicareweb/`

## High impact

| Item | Recommendation |
|------|----------------|
| No automated tests | Add Playwright + CI job |
| JWT in localStorage | Document risk; tighten CSP; consider cookie session if API evolves |
| `*_OLD.jsx` pages | Delete or move to `legacy/` with README |

## Medium impact

| Item | Recommendation |
|------|----------------|
| Dual GET caches (`useAuth` vs `apiClient.cachedGet`) | Standardize on one pattern + invalidation |
| AdminOverview hardcoded `fetch('/api/v1/org-scan-ai/health')` | Use `API_BASE_URL` consistently |
| Large admin pages | Split into subcomponents + hooks |

## Low effort quick wins

| Item | Action |
|------|--------|
| `.env.example` | `VITE_BACKEND_ORIGIN=http://localhost:3000` |
| `package.json` | Add `test:e2e` script when Playwright added |
| Link docs | In `architecture/README.md`, point to `../project-architecture/` |

## Maintainability

- Lazy routes are good — keep new pages lazy in `App.jsx`.
- Prefer `authMutate`/`authGet` over ad hoc `fetch` for consistent 401 handling.
