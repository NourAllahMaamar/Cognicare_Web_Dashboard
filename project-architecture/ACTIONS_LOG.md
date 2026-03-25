# Actions log — CogniCare Web (`cognicareweb/`)

Record of inspection and documentation for **this repository only** — the **React + Vite** staff/admin dashboard. The API and database live in the sibling **`cognicare/backend`** repo.

## Phase 1 — Discovery (inspected)

| Path / artifact | Notes |
|-----------------|--------|
| `package.json`, `vite.config.js` | React 19, Vite 7, Tailwind 4, proxy `/api` + `/uploads` |
| `src/App.jsx` | Lazy routes: admin, org, specialist, landing, confirm-account |
| `src/config.js`, `src/hooks/useAuth.js` | `API_BASE_URL`, JWT storage per role, `authFetch` / 401 refresh |
| `src/apiClient.js` | `cachedGet` with TTL |
| `src/pages/**/*.jsx` | All dashboard pages; grep for `authGet` / `authMutate` / `authFetch` / `fetch` |
| `src/components/`, `src/context/`, `src/i18n.js` | UI, theme, translations |
| `architecture/` (existing) | `README.md`, `ROUTES-AND-ROLES.md`, `API-AND-ENV.md`, `STACK-AND-CONVENTIONS.md`, `bilan/` |

## Phase 2 — Functional understanding

SPA for **platform admin**, **organization leader**, and **specialist** workflows against the shared CogniCare API. No server-side rendering; no MongoDB in this repo.

## Phase 3 — Architecture extraction

See `ARCHITECTURE.md` and `DATA_FLOW.md` — browser → Vite dev proxy → Nest API; production builds call `VITE_BACKEND_ORIGIN`.

## Phase 4 — Testing strategy

See `TEST_PLAN.md` — Playwright/Cypress E2E, component tests **needs verification**, lint-only today.

## Phase 5 — Deliverables

Eleven files under `cognicareweb/project-architecture/` (table below).

## Architecture decisions (docs)

- **New folder:** `project-architecture/` at **repo root** alongside existing `architecture/`.
- **Relationship:** `architecture/` remains the lightweight index + bilans; `project-architecture/` is the **full** architecture + QA pack requested here. Cross-link both in team onboarding.

## Assumptions / needs verification

- Exact production `VITE_BACKEND_ORIGIN` per environment.
- Whether `*_OLD.jsx` pages are dead code or fallbacks.

## Files generated

| File | Purpose |
|------|---------|
| `ACTIONS_LOG.md` | This log |
| `ARCHITECTURE.md` | Web app architecture |
| `FEATURE_INVENTORY.md` | UI features |
| `TEST_PLAN.md` | QA matrix |
| `FOLDER_STRUCTURE.md` | Directories |
| `DATA_FLOW.md` | Browser ↔ API |
| `API_MAP.md` | **API paths used by this SPA** (not Nest source) |
| `AUTH_AND_SECURITY.md` | Tokens, CSP, proxy |
| `TECH_DEBT_AND_RECOMMENDATIONS.md` | Debt |
| `NEXT_STEPS.md` | Roadmap |
| `AGENTS.md` | Agent guide |
