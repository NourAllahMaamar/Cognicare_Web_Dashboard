# CogniCare Web Dashboard - AI Agent Instructions

## Scope and relation to other projects
- This project is the React/Vite web app for public pages + admin/org/specialist dashboards.
- API/data source is `cognicare-mobile/backend` (NestJS v1).
- Read root workspace instructions first: `../.github/copilot-instructions.md`.
- Ignore `cognicare-mobile/backend-v2` unless the user explicitly asks to work on v2.

## Stack and runtime
- React 19 + Vite 7 + React Router 7 + Tailwind v4 (`@tailwindcss/vite`, CSS-first theme in `src/index.css`).
- Commands:
  - `npm run dev`
  - `npm run build`
  - `npm run lint`
  - `npm run preview`

## Architecture patterns used in code
- Routes are centralized in `src/App.jsx` with `React.lazy` + `Suspense` code splitting.
- Role dashboards use layout routes:
  - `/admin/dashboard/*`
  - `/org/dashboard/*`
  - `/specialist/dashboard/*`
- Shared sidebar shell is `src/components/layouts/SidebarLayout.jsx`.
- Shared auth/network logic is `src/hooks/useAuth.js`.

## API integration conventions
- `src/config.js` is the API base source of truth:
  - Dev requests use relative `/api/v1`.
  - Production uses `${BACKEND_ORIGIN}/api/v1`.
- Dev proxy in `vite.config.js` forwards `/api` and `/uploads` to `VITE_BACKEND_ORIGIN`.
- `useAuth` handles:
  - role-based localStorage keys (`admin*`, `orgLeader*`, `specialist*`)
  - refresh flow via `POST /auth/refresh`
  - automatic retry on 401
  - in-memory GET cache (`60s`) + global invalidation on mutation
  - correlation ID header `X-Correlation-Id`

## Important current project gotchas
- `src/config.js` dev fallback is `http://localhost:3001`, while `vite.config.js` fallback is `http://localhost:3000`.
- If backend host is unreachable, login appears to fail silently from UI perspective.
- Keep API base/proxy assumptions aligned when editing auth/network code.

## UI and code conventions
- JavaScript only (no TypeScript).
- Prefer existing UI primitives/components before introducing new ones.
- Keep role-specific behavior explicit by route namespace and role key passed to `useAuth`.
- Keep i18n/RTL behavior intact (`src/i18n.js`, direction handling in `src/App.jsx`).

## When editing this app
- For auth changes, update all three surfaces together: login page(s), `useAuth`, and backend contract assumptions.
- For uploads/media URLs, use `getUploadUrl` from `src/config.js` (do not hardcode backend host).
- For dashboard navigation changes, update both route tree (`App.jsx`) and sidebar nav configuration in layout pages.