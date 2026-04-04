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

## Internationalization (i18n) Status

### Completed (April 2026)
- **Framework**: react-i18next with EN/FR/AR support + RTL for Arabic
- **Translation files**: `src/locales/en.json`, `src/locales/fr.json`, `src/locales/ar.json` (~1200 lines each, 500+ keys)
- **Fully internationalized pages (7)**:
  - `ActivitiesCreator.jsx` - Specialist activity creator
  - `PECSBoardCreator.jsx` - PECS board creator (6 phases)
  - `SkillTrackerCreator.jsx` - DTT skill tracker (10-trial system)
  - `TEACCHTrackerCreator.jsx` - TEACCH tracker with work system
  - `ProgressAIRecommendations.jsx` - AI recommendations with feedback
  - `AdminAnalytics.jsx` - Analytics dashboard with charts
  - `AdminOverview.jsx` - Admin overview with quick actions

### Remaining Work (8 admin pages - ~350 translation keys needed)
See `I18N_REMAINING_WORK.md` for detailed inventory:
- `AdminLayout.jsx` - Navigation sidebar (14 keys)
- `AdminFraudReview.jsx` - Org fraud detection (58 keys)
- `AdminFamilies.jsx` - Family management (89 keys)
- `AdminUsers.jsx` - User CRUD (41 keys)
- `AdminTrainingCourses.jsx` - Training review (24 keys)
- `AdminSystemHealth.jsx` - System monitoring (48 keys)
- `AdminOrganizations.jsx` - Org management (47 keys)
- `OrgSpecialistDetail.jsx` - Specialist summary (41 keys)

### i18n Conventions
- Import: `import { useTranslation } from 'react-i18next'`
- Hook: `const { t } = useTranslation()`
- Usage: `{t('section.key')}` for static strings, `t('section.key', { variable })` for interpolation
- Keys organized by page/component (e.g., `activitiesCreator.*`, `pecsCreator.*`, `adminAnalytics.*`)
- Common keys in `common.*` section (save, cancel, delete, loading, error, etc.)
- Role labels in `roles.*` section (admin, family, organization_leader, psychologist, etc.)
- RTL handled automatically via `i18n.dir()` in `App.jsx`

## When editing this app
- **For auth changes**: Update all three surfaces together: login page(s), `useAuth`, and backend contract assumptions.
- **For uploads/media URLs**: Use `getUploadUrl` from `src/config.js` (do not hardcode backend host).
- **For dashboard navigation changes**: Update both route tree (`App.jsx`) and sidebar nav configuration in layout pages.
- **For new UI text**: Add translation keys to all 3 locale files (en.json, fr.json, ar.json) and use `t()` function, never hardcode English strings.
- **For role display**: Use `t('roles.{roleName}')` instead of string manipulation (e.g., `replace(/_/g, ' ')`).