# Folder structure — `cognicareweb/`

| Path | Purpose | Notes |
|------|---------|--------|
| `src/App.jsx` | Router + lazy pages | Single source of URL map |
| `src/main.jsx` | React root | — |
| `src/config.js` | `API_BASE_URL`, `getUploadUrl` | Dev `/api/v1`; prod `VITE_BACKEND_ORIGIN` |
| `src/hooks/useAuth.js` | JWT + `authFetch` / cache | Three role variants |
| `src/apiClient.js` | `cachedGet` helper | Optional; token-based cache key |
| `src/pages/admin/` | Platform admin | `AdminLayout.jsx` wraps nested routes |
| `src/pages/org/` | Org leader (current) | Staff, families, children, invitations |
| `src/pages/org-leader/` | Org leader extras | `OrgLeaderLogin`, `OrgSpecialistDetail` |
| `src/pages/specialist/` | Specialist tools | Layout + creators + AI/behavior |
| `src/pages/shared/` | `SettingsPage`, `NotFound` | Reused across roles |
| `src/pages/home/` | `LandingPage` | Public |
| `src/components/` | UI + layouts | `layouts/SidebarLayout`, `ui/*` |
| `src/context/` | Theme | `ThemeContext` |
| `src/utils/` | `planUtils`, `performanceMonitor` | — |
| `public/` | Static assets | — |
| `architecture/` | Existing docs + `bilan/` | **Complements** `project-architecture/` |
| `project-architecture/` | This documentation pack | Full architecture + QA |
| `dist/` | Build output | Gitignored |
| `vite.config.js` | Proxy, CSP, chunks | Critical for local API |

**Well organized:** Role-aligned `pages/`; shared auth hook.

**Improve:** Remove or quarantine `*_OLD.jsx`; add `tests/` or `e2e/`; add `.env.example` with `VITE_BACKEND_ORIGIN` documented.
