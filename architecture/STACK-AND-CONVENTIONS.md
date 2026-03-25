# Stack and conventions

## Stack

| Layer | Technology |
|-------|------------|
| Build | Vite 7 |
| UI | React 19, Tailwind CSS 4 (`@tailwindcss/vite`) |
| Routing | React Router DOM 7 (`BrowserRouter`, nested routes) |
| i18n | i18next, react-i18next, browser language detector |
| Charts | Recharts |
| 3D / visuals | Three.js, `@react-three/fiber`, ogl (where used) |
| Spreadsheets | xlsx (client-side export/import where used) |

## NPM scripts

- `npm run dev` — Vite dev server with HMR
- `npm run build` — production bundle to `dist/`
- `npm run preview` — serve `dist/` locally
- `npm run lint` — ESLint

## Code layout

- `src/pages/` — route-level components by area: `admin/`, `org/`, `org-leader/`, `specialist/`, `home/`, `shared/`
- `src/components/` — reusable UI (e.g. `LanguageSwitcher`, `ThemeToggle`)
- `src/hooks/` — `useAuth`, `useTheme`, etc.
- `src/context/` — e.g. theme
- `src/locales/` — `en.json`, `fr.json`, `ar.json`
- `src/utils/` — helpers (e.g. `planUtils`, `performanceMonitor`)

## Lazy loading

Routes import pages with `React.lazy()` and wrap the tree in `<Suspense>` with a shared `PageLoader` in [`App.jsx`](../src/App.jsx). Each major page becomes its own JS chunk.

## Internationalization and RTL

- Languages: **en**, **fr**, **ar** — see [`src/i18n.js`](../src/i18n.js).
- When the active language is **ar**, `document.documentElement` gets `dir="rtl"` and `lang="ar"`; otherwise LTR. Logic lives in `App.jsx` `useEffect` + `i18n.on('languageChanged', ...)`.

## Legacy / unused files

Several `*_OLD.jsx` (and matching `.css`) files exist under `src/pages/` (e.g. `AdminDashboard_OLD`, `OrgLeaderDashboard_OLD`, `SpecialistDashboard_OLD`, `Home_OLD`). They are **not** wired in [`App.jsx`](../src/App.jsx); treat them as archive/reference unless reconnected.
