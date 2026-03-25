# CogniCare Web (staff dashboard)

`cognicareweb` is the React dashboard for admin, organization leader, and specialist roles.
There is no backend implementation in this folder; it consumes the active API in `cognicare/backend`.

## Stack

- Vite 7
- React 19 + React Router 7
- Tailwind 4
- i18next (`en`, `fr`, `ar` with RTL handling)

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Useful commands:

- `npm run lint`
- `npm run build`
- `npm run preview`

## API integration

- Dev API base: `/api/v1` (proxied by Vite)
- Prod API base: `${VITE_BACKEND_ORIGIN}/api/v1`
- Default local backend expectation: `http://localhost:3000`

Main integration files:

- `src/config.js`
- `src/hooks/useAuth.js`
- `src/apiClient.js`

## Route structure

- Public: `/`, `/confirm-account`
- Admin: `/admin/login`, `/admin/dashboard/*`
- Org leader: `/org/login`, `/org/dashboard/*`
- Specialist: `/specialist/login`, `/specialist/dashboard/*`, specialist tool routes

Full route map: `architecture/ROUTES-AND-ROLES.md`

## Current risks / gaps (v1)

- No dedicated web E2E suite yet (Playwright/Cypress missing).
- Some `_OLD` pages still exist in `src/pages/` and should be archived/removed after verification.
- Reliability still depends on correct `VITE_BACKEND_ORIGIN` alignment with the active backend.

## Related docs

- App-level agent rules: `AGENTS.md`
- Architecture docs: `architecture/`
- Web-focused project architecture notes: `project-architecture/`
