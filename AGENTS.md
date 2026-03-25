# Agent guidance — `cognicareweb`

## Scope

Work on the React web dashboard only.
Backend logic must be implemented in `../cognicare/backend`.

## Hard constraints

- Active backend is `../cognicare/backend`.
- Ignore `../cognicare/backend-v2` for implementation decisions.
- Keep web behavior aligned with backend contracts and role guards.

## Important files

- `src/App.jsx` — route tree, lazy page loading, redirects
- `src/hooks/useAuth.js` — role-based session storage, refresh, auth fetch wrappers
- `src/config.js` — API base and upload URL behavior
- `architecture/` — stack/routes/env documentation
- `project-architecture/API_MAP.md` — consumed API surface map

## Conventions

- Use `authFetch`/`authGet`/`authMutate` for authenticated requests.
- Keep API paths relative to `API_BASE_URL`.
- Preserve existing role-route patterns (`/admin`, `/org`, `/specialist`).
- Update docs when routes, env behavior, or API integrations change.

## Production-readiness priorities

1. Prevent auth regressions (token refresh + role redirects).
2. Keep API origin/env handling explicit and testable.
3. Add/maintain smoke coverage (lint/build now; Playwright next).
4. Reduce dead/legacy code safely (`*_OLD.jsx` cleanup).

## Validation

- `npm run lint`
- `npm run build`
- Manual role login smoke against a running `../cognicare/backend`
