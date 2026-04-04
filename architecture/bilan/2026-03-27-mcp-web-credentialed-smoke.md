# Bilan — credentialed web smoke (2026-03-27)

## Environment

| Item | Value |
|------|--------|
| Web | Vite dev `http://127.0.0.1:5173/` |
| API | Proxied via `VITE_BACKEND_ORIGIN=https://cognicare-mobile-h4ct.onrender.com` (see `cognicareweb/vite.config.js`) |
| Tooling | **`cursor-ide-browser`** MCP (`browser_navigate`, `browser_snapshot`, `browser_fill`, `browser_click`, `browser_wait_for`) |

Credentials were supplied in the session only (not stored in the repo).

## Results

| Role | Account (email) | Post-login URL | Notes |
|------|-----------------|------------------|--------|
| Admin | `chekerh2002@gmail.com` | `/admin/dashboard` | Admin Console; session from prior step in same run |
| Organization leader | `chekerh2000@gmail.com` | `/org/dashboard` | Search box “Rechercher un spécialiste par nom…”, shell controls |
| Specialist | `hsan.cheker@esprit.tn` | `/specialist/dashboard` | View Children, My Plans, Add Private Family, View All |

**Outcome:** All three logins reached their expected protected dashboards against the Render backend.

### Deep routes (same session, 2026-03-27 continuation)

| Area | URL | Result |
|------|-----|--------|
| Specialist | `/specialist/dashboard/children` | **Pass** — “Enfants”, org/private sections empty state |
| Specialist | `/specialist/dashboard/plans` | **Pass** — “Mes Plans”, filter chips (PECS/TEACCH/SkillTracker/Activity), 0 plans |
| Specialist | `/specialist/pecs/create` | **Pass** — PECS creator (Save Board, phase combobox, tile fields) behind `RequireSpecialistAuth` |
| Admin | `/admin/dashboard/users` | **Pass** — User Management, search/filter, 9 users listed with actions |
| Org | `/org/dashboard/staff` | **Pass** — “Gestion du personnel”, Import/Export, Add Staff, 2 staff rows |

No screenshots were attached in this run (browser MCP snapshot text only).

### Local-stack continuation (same day)

| Item | Value |
|------|-------|
| Web | `http://localhost:5174` |
| API | `http://localhost:3001` via `VITE_BACKEND_ORIGIN=http://localhost:3001` |
| Trigger | Initial local login retries on `:5173` failed because dev default expected backend `:3000` |

| Role | Post-login URL | Result |
|------|----------------|--------|
| Admin | `/admin/dashboard` | **Pass** |
| Organization leader | `/org/dashboard` | **Pass** |
| Specialist | `/specialist/dashboard` | **Pass** |

Outcome: credentialed MCP smoke also passes on local stack once backend origin is aligned.
