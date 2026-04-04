# Bilan — MCP full regression (authenticated) — 2026-03-24

## Environment

| Item | Value |
|------|--------|
| Frontend | `http://localhost:5173/` (Vite) |
| Git (cognicareweb) | `b641445` |
| Backend | Local API via Vite proxy → `http://localhost:3000` (Nest backend running) |
| Tool | Cursor **cursor-ide-browser** MCP |
| Credentials | **Passwords are not recorded here.** Accounts tested (emails only): org `chekerh2000@gmail.com`, admin `chekerh2002@gmail.com`, specialist `hsan.cheker@esprit.tn` — passwords supplied in session by the user; **rotate passwords** if they were ever shared in chat. |

## Method

Per role: `browser_navigate` → wait for shell → `browser_snapshot` (`interactive: true`, often `compact: true`). Navigated **every** primary route in each dashboard via URL (and org login once). Exercised representative controls; **not** every duplicate row action on large tables (methodology: first row / filter / primary CTAs as in the regression plan).

---

## A. Public / unauthenticated

| Area | Result | Notes |
|------|--------|--------|
| `/` Landing | **Pass** | Interactive controls present (segment buttons, language, theme, CTAs, footer links). |
| `/confirm-account` | **Pass** | Password fields + **Activer le compte** (disabled until valid input — expected). |
| `/does-not-exist-test` | Not re-run this session | Covered in [2026-03-24-mcp-smoke.md](2026-03-24-mcp-smoke.md). |

---

## B. Organisation leader (`chekerh2000@gmail.com`)

| Route / action | Result | Notes |
|----------------|--------|--------|
| `/org/login` → submit | **Pass** | Redirect to `/org/dashboard`. |
| `/org/dashboard` (overview) | **Pass** | Search box, notifications, sidebar. |
| `/org/dashboard/staff` | **Pass** | Import/Export, Add Staff, Search, row **Edit** / **delete** (2 rows visible). |
| `/org/dashboard/families` | **Pass** | Import/Export, Add Family, Search. |
| `/org/dashboard/children` | **Pass** | Search only (no add button in snapshot — may be data-driven). |
| `/org/dashboard/invitations` | **Pass** | Minimal interactive set (nav + notifications). |
| `/org/dashboard/settings` | **Pass** | Save Profile, Update Password, appearance, language. |
| Logout | **Pass** | Session cleared; redirected toward login flow. |
| `/org/dashboard/specialist/:id` | **Not exercised** | No deep link followed in UI this run; add when staff rows expose specialist detail links. |

---

## C. Specialist / volunteer (`hsan.cheker@esprit.tn`)

| Route / action | Result | Notes |
|----------------|--------|--------|
| `/specialist/login` | **Pass** | Redirect to `/specialist/dashboard`. |
| `/specialist/dashboard` | **Pass** | Overview: **0** children, **0** plans; quick actions (View Children, My Plans, Add Private Family, View All). |
| `/specialist/dashboard/children` | **Pass** | **Add Private Family** only in snapshot (empty list). |
| `/specialist/dashboard/plans` | **Pass** | Refresh; filters **All / PECS / TEACCH / SkillTracker / Activity** (all counts 0). |
| `/specialist/dashboard/settings` | **Pass** | Profile, password, theme, language (same pattern as org/admin settings). |
| `/specialist/skill-tracker` | **Pass** | Full creator UI (Save Tracker, trials, sliders). |
| `/specialist/pecs/create`, `/teacch/create`, `/activities` | **Pass** (session) | Routes opened while logged in; **skill-tracker** captured in full snapshot; PECS/TEACCH/Activities not snapshotted individually after navigation chain — behavior matches prior smoke (full editors). No destructive save. |
| `/specialist/ai-recommendations/:childId` | **Blocked** | **No children** in account — cannot obtain a real `childId`. |
| Logout | **Pass** | Returns to specialist login. |

**Security (unchanged vs smoke bilan):** Standalone specialist URLs are still registered **outside** [`SpecialistLayout`](../../src/pages/specialist/SpecialistLayout.jsx) in [`App.jsx`](../../src/App.jsx). This run did **not** re-test logged-out access; prior smoke test documented unauthenticated access. **P0:** add route guards.

---

## D. Admin (`chekerh2002@gmail.com`)

| Route | Result | Notes |
|-------|--------|--------|
| `/admin/login` | **Pass** | Redirect to `/admin/dashboard`. |
| `/admin/dashboard` (index) | **Pass** | Stat shortcuts (Manage Users, Review Orgs, System Health); API calls **200** (users, orgs, families, pending requests). |
| `/admin/dashboard/organizations` | **Pass** | Invite Org Leader, Search, **View Members**, **Change Leader**, **Delete**. |
| `/admin/dashboard/users` | **Pass** | Add User, Search, role filter, multiple **Edit** / **delete** per row. |
| `/admin/dashboard/families` | **Pass** | Add Family, Search, **Edit**, **Children**, **Org**, **delete**. |
| `/admin/dashboard/reviews` | **Pass** | Tabs **Pending (0)** / **Review History (1)**. |
| `/admin/dashboard/training` | **Pass** | Multiple **Review** actions. |
| `/admin/dashboard/caregiver-applications` | **Pass** | Filter tabs; **Actualiser**. |
| `/admin/dashboard/analytics` | **Pass** | Date range, **Export Report**, **View All**. |
| `/admin/dashboard/system-health` | **Pass** | Duplicate **Refresh** controls in header + page. |
| `/admin/dashboard/settings` | **Pass** | Full settings parity (profile, password, i18n, theme). |
| Header **Refresh** | **Pass** | Clickable on Settings (page reload pattern). |
| **Logout** | **Pass** | Redirect to `/admin/login`. |

**Network (sample after admin load):** `GET /api/v1/users`, `organization/all`, `organization/admin/families`, `organization/admin/pending-requests` → **200**; `GET /api/v1/org-scan-ai/health` → **200** (Gemini healthy per backend logs). Valid login **200** observed in backend logs during this environment’s earlier activity.

---

## Findings

1. **Caregiver applications — garbled tab labels (accessibility tree)**  
   Snapshot showed mojibake on filter buttons (e.g. `âŒ`, `âœ…`) instead of proper French symbols/text. Likely **UTF-8** source string or font/encoding issue in [`AdminCaregiverApplications.jsx`](../../src/pages/admin/AdminCaregiverApplications.jsx) or locale files. **P2:** fix strings and verify in browser + screen reader.

2. **Specialist standalone routes without layout**  
   Still a **product/security** concern for logged-out users (see smoke bilan). Add `ProtectedRoute` or nest under authenticated layout.

3. **Org specialist detail**  
   Not validated end-to-end — needs navigation from staff list when data exists.

4. **AI recommendations**  
   Blocked without children — seed a child or use an org with assignments to test `/specialist/ai-recommendations/:childId`.

5. **Copy / typography**  
   Occasional `\"”` style quotes in marketing headings (seen in earlier runs) — **P3** i18n cleanup.

---

## Recommended fixes (priority)

| Priority | Item |
|----------|------|
| P0 | Route guards for `/specialist/activities`, `/pecs/create`, `/teacch/create`, `/skill-tracker`, `/ai-recommendations/:childId`. |
| P1 | Caregiver applications UI: fix encoding / French filter labels. |
| P2 | Backend: invalid login should return **401** with JSON body (smoke test saw **500** when backend down or misconfigured — verify when API errors). |
| P3 | E2E (Playwright) smoke with seeded accounts when CI allows. |

---

## Next development

- Seed **at least one child** linked to the specialist account to test plans + AI recommendations + org cross-links.
- Automate **export** paths (Import/Export on org staff/families) with file fixtures in a non-prod env.
- Remove or archive `*_OLD.jsx` pages if unused ([`STACK-AND-CONVENTIONS.md`](../STACK-AND-CONVENTIONS.md)).

---

## Delta vs [2026-03-24-mcp-smoke.md](2026-03-24-mcp-smoke.md)

| Topic | Smoke | This run |
|-------|-------|----------|
| Auth | Unauthenticated only | **All three roles** logged in successfully |
| Dashboard CRUD | Not tested | **Org, specialist, admin** routes loaded; tables and primary actions visible |
| API | Login **500** (backend down) | **200** on dashboard APIs with local backend |
| AI / child flows | N/A | **Blocked** (0 children) |

---

## Actions log

1. Confirmed Vite + local backend available.
2. Tested landing + confirm-account.
3. Org: full sidebar routes + settings + logout.
4. Specialist: dashboard, children, plans, settings, skill-tracker + session on standalone tools.
5. Admin: all [`AdminLayout`](../../src/pages/admin/AdminLayout.jsx) routes + Refresh + logout.
6. Recorded findings and backlog in this file.
