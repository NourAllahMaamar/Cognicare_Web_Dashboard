# Next steps — `cognicareweb/`

## Immediate

1. Set `VITE_BACKEND_ORIGIN` to a **reachable** API (see `vite.config.js` comments).
2. Run `npm run lint && npm run build` before deploy.

## Short term

1. Add **Playwright** with three auth fixtures (admin, org, specialist) against staging.
2. Add `.env.example` at repo root.
3. Remove or quarantine `*_OLD.jsx` after confirming no imports.

## Longer term

1. Introduce **Vitest** + RTL for complex forms (families, import wizard).
2. Optional **React Query** for server state and cache invalidation.
3. Storybook for shared UI (**optional**).

## Cursor / agent workflow

1. Read `../AGENTS.md` and `API_MAP.md` (this folder; consumer paths).
2. Use `useAuth` helpers for API calls; avoid duplicate `fetch` without 401 retry.
3. Validate: `npm run lint`, `npm run build`; manual login smoke on changed flows.

## Cross-surface — API origin

- **Web (this repo):** `VITE_BACKEND_ORIGIN` + Vite proxy — [`../architecture/API-AND-ENV.md`](../architecture/API-AND-ENV.md).
- **Flutter:** not configured here — [`../../project-architecture/MOBILE_API_ORIGINS.md`](../../project-architecture/MOBILE_API_ORIGINS.md) and [`../../cognicare/frontend/architecture/MOBILE_API_BASE_URL.md`](../../cognicare/frontend/architecture/MOBILE_API_BASE_URL.md).
