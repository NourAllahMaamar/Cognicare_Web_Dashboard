# Test plan — `cognicareweb/`

**Stack:** React 19, Vite — no Jest/Vitest in `package.json` today. **Recommended:** **Playwright** (or Cypress) for E2E; **Vitest + React Testing Library** for components.

---

## Cross-cutting

| What | Scenarios | Expected | Priority | Level | Auto |
|------|-----------|----------|----------|-------|------|
| API reachability | Dev server + proxy | Login works | P0 | Manual / E2E | high |
| Token refresh | Expired access token | Silent refresh or login | P0 | E2E | high |
| RTL | Switch to `ar` | `dir=rtl` | P1 | E2E | medium |

## Per role (E2E)

| Role | Flow | Priority | Auto |
|------|------|----------|------|
| Admin | Login → dashboard → users list loads | P0 | high |
| Org | Login → staff page → table | P0 | high |
| Specialist | Login → children → open plan | P0 | high |

## Feature pages (from `FEATURE_INVENTORY.md`)

For each: load page with valid token (mock API or test backend), assert table/chart visible, mutation shows toast or updated row.

| Feature | Key scenario | Priority |
|---------|--------------|----------|
| Admin fraud | Pending list, open analyses | P0 |
| Admin families | Create/patch family | P1 |
| Org import | Upload xlsx preview (**use fixture**) | P1 |
| PECS creator | Save plan → redirect | P1 |
| Behavior analytics | Consent + dashboard load | P1 |

## Security / edge

| Check | Notes |
|-------|--------|
| Logout clears storage | `localStorage` keys removed |
| 403 from API | UI shows error, no infinite spinner |
| Wrong role token | **Inferred:** API 403 — UI should not show data |

## Performance

| Check | Notes |
|-------|--------|
| Lazy chunks | First load < budget **define** |
| authGet cache | Stale data after mutation **verify** |

## Biggest gaps

- No `npm test` script.
- No CI E2E.
- Reliance on live API for manual QA.

**Automate first:** Playwright: three logins + one mutation per role against staging API.

---

## Verification status (release-hardening)

**Canonical cross-workspace matrix:** [`../../project-architecture/TEST_PLAN.md`](../../project-architecture/TEST_PLAN.md) (repo root `project-architecture/`).

**Web-specific evidence (manual / MCP):**

| When | What | Doc |
|------|------|-----|
| 2026-03-27 | Credentialed smoke: admin, org leader, specialist → dashboards (Vite proxy to Render) | [`../architecture/bilan/2026-03-27-mcp-web-credentialed-smoke.md`](../architecture/bilan/2026-03-27-mcp-web-credentialed-smoke.md) |
| 2026-03-27 | Deep routes: specialist children/plans/PECS create, admin users, org staff | same bilan |
| 2026-03-27 | Credentialed MCP rerun on local stack (`localhost:5174` + backend `localhost:3001`): admin/org/specialist logins all reached dashboards after correcting dev API origin mismatch | same bilan (continuation) |

**Still gaps for this repo:** no Playwright/Cypress in `package.json`; org signup + PDF/approval path needs dedicated QA; token-refresh and logout-storage checks remain E2E candidates.

**Dev against staging API:** set `VITE_BACKEND_ORIGIN` to the deployed API origin (see `vite.config.js`); do not commit secrets or real `.env` values.
