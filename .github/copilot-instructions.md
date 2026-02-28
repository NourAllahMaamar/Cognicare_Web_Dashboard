# CogniCare Web Dashboard - AI Agent Instructions

## Project Overview

React-based public marketing website and multi-role admin portal for CogniCare platform:
- **Public Landing Page**: Marketing site with animated hero carousel, scroll-reveal animations, and brain network SVG
- **Admin Dashboard**: JWT-authenticated modular dashboard (7 pages) for system-wide user/org management
- **Organization Leader Dashboard**: JWT-authenticated modular dashboard (5 pages) for staff & family management
- **Specialist Dashboard**: JWT-authenticated modular dashboard (3 pages + 4 plan creators) for clinical tools

**Critical**: See root [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) for workspace-wide architecture, backend integration, and multi-tenancy model.

## Technology Stack

- **React**: 19.2.0 (new JSX transform — no `import React` needed)
- **Vite**: 7.2.4 (dev server, HMR, production build, proxy)
- **Tailwind CSS**: 4.2.1 (CSS-first config via `@theme` in index.css — **no tailwind.config.js**)
- **Routing**: react-router-dom 7.13.0 (BrowserRouter, nested `<Outlet>` layouts)
- **i18n**: react-i18next 16.5.4 + i18next 25.8.4 + i18next-browser-languagedetector 8.2.0
- **WebGL**: OGL 1.0.11 (Grainient shader background, lighter than Three.js)
- **Excel**: xlsx 0.18.5 (staff import via Excel upload in org portal)

**No state management library**: Uses React hooks (`useState`, `useEffect`, `useCallback`) and component-level state.

**No validation library**: Inline validation before API calls.

## Architecture Patterns

### Project Structure

```
src/
├── main.jsx                  # Entry point, ThemeProvider + i18n init
├── App.jsx                   # Router setup, React.lazy code-splitting, RTL handling
├── App.css                   # Minimal app-level styles
├── config.js                 # API base URL + getUploadUrl (single source of truth)
├── i18n.js                   # i18next configuration
├── apiClient.js              # Unauthenticated API utility (cachedGet)
├── index.css                 # Tailwind v4 @theme tokens, glass utilities, scrollbar
│
├── context/
│   └── ThemeContext.jsx       # Dark/light mode with localStorage persistence
│
├── hooks/
│   └── useAuth.js             # Role-based auth: token refresh, authGet (cached), authMutate
│
├── components/
│   ├── Grainient.jsx + .css   # OGL WebGL animated gradient background
│   ├── LanguageSwitcher.jsx   # Tailwind click-based language dropdown (EN/FR/AR)
│   ├── layouts/
│   │   └── SidebarLayout.jsx  # Shared sidebar layout for all 3 dashboards
│   └── ui/
│       ├── ThemeToggle.jsx    # Dark/light toggle button
│       ├── StatCard.jsx       # Reusable stat card component
│       └── StatusBadge.jsx    # Status badge component
│
├── pages/
│   ├── home/
│   │   └── LandingPage.jsx    # Public landing page with carousel + scroll reveals
│   │
│   ├── admin/                 # Admin portal (JWT-protected, role: admin)
│   │   ├── AdminLogin.jsx
│   │   ├── AdminLayout.jsx    # Sidebar + <Outlet> wrapper
│   │   ├── AdminOverview.jsx  # Dashboard home / stats
│   │   ├── AdminUsers.jsx     # User management CRUD
│   │   ├── AdminOrganizations.jsx  # Org management + approval
│   │   ├── AdminFamilies.jsx  # Family management
│   │   ├── AdminFraudReview.jsx    # Fraud/AI review queue
│   │   ├── AdminAnalytics.jsx      # Analytics charts
│   │   └── AdminSystemHealth.jsx   # System health monitoring
│   │
│   ├── org-leader/            # Org leader auth + specialist detail
│   │   ├── OrgLeaderLogin.jsx # Login + signup with certificate upload
│   │   └── OrgSpecialistDetail.jsx  # Individual specialist profile
│   │
│   ├── org/                   # Org leader dashboard pages
│   │   ├── OrgLayout.jsx      # Sidebar + <Outlet> wrapper
│   │   ├── OrgOverview.jsx    # Dashboard home / stats
│   │   ├── OrgStaff.jsx       # Staff management + Excel import
│   │   ├── OrgFamilies.jsx    # Family management
│   │   ├── OrgChildren.jsx    # Children overview
│   │   └── OrgInvitations.jsx # Invitation management
│   │
│   ├── specialist/            # Specialist dashboard + plan creators
│   │   ├── SpecialistLogin.jsx
│   │   ├── SpecialistLayout.jsx    # Sidebar + <Outlet> wrapper
│   │   ├── SpecialistOverview.jsx  # Dashboard home
│   │   ├── SpecialistChildren.jsx  # Assigned children list
│   │   ├── SpecialistPlans.jsx     # Plans overview
│   │   ├── PECSBoardCreator.jsx    # PECS board creation tool
│   │   ├── TEACCHTrackerCreator.jsx # TEACCH tracker creation tool
│   │   ├── SkillTrackerCreator.jsx  # Skill assessment creation
│   │   ├── ActivitiesCreator.jsx    # Activities creation
│   │   └── ProgressAIRecommendations.jsx # AI-driven progress insights
│   │
│   ├── shared/
│   │   ├── SettingsPage.jsx   # Settings page (used by all 3 dashboards)
│   │   └── NotFound.jsx       # 404 page
│   │
│   └── ConfirmAccount.jsx     # Email confirmation page
│
├── assets/
│   └── app_logo_withoutbackground.png  # App logo (used in header, sidebar, login, footer)
│
└── locales/                   # Translation files
    ├── en.json
    ├── fr.json
    └── ar.json
```

**Key conventions**:
- Components follow PascalCase naming
- Styling is done entirely with **Tailwind CSS utility classes** — no component-scoped CSS files for new pages
- No TypeScript — pure JavaScript with JSDoc comments where needed
- All page imports use `React.lazy()` for code-splitting
- Logo uses `import logo from '../../assets/app_logo_withoutbackground.png'` (not Material Icons)

### Routing Pattern

**Nested routing with layouts** (from [App.jsx](../src/App.jsx)):
```javascript
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
// ...

function App() {
  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<LandingPage />} />

          {/* Admin — nested under layout */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="/admin/dashboard" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="organizations" element={<AdminOrganizations />} />
            {/* ... */}
          </Route>

          {/* Same pattern for /org/dashboard and /specialist/dashboard */}
        </Routes>
      </Suspense>
    </Router>
  );
}
```

**Layout components** render `<SidebarLayout>` with an `<Outlet />` for child routes:
```javascript
// AdminLayout.jsx
export default function AdminLayout() {
  const { getUser, logout } = useAuth('admin');
  return (
    <SidebarLayout
      title="Admin Dashboard"
      navItems={[
        { to: '/admin/dashboard', icon: 'dashboard', label: 'Overview', end: true },
        { to: '/admin/dashboard/users', icon: 'group', label: 'Users' },
        // ...
      ]}
      onLogout={logout}
      user={getUser()}
    >
      <Outlet />
    </SidebarLayout>
  );
}
```

**Auth guard pattern** — each Layout checks auth in `useEffect`, redirects if no token:
```javascript
useEffect(() => {
  const token = localStorage.getItem('adminToken');
  if (!token) navigate('/admin/login');
}, [navigate]);
```

### API Integration Pattern

**Centralized API URL** (from [config.js](../src/config.js)):
```javascript
const isDev = import.meta.env.DEV;
const BACKEND_ORIGIN = 'https://cognicare-mobile-h4ct.onrender.com';
export const API_BASE_URL = isDev ? '/api/v1' : `${BACKEND_ORIGIN}/api/v1`;

// For uploaded images: relative path in dev (proxy), full URL in prod
export const getUploadUrl = (pathOrUrl) =>
  !pathOrUrl ? '' : pathOrUrl.startsWith('http') ? pathOrUrl : (isDev ? pathOrUrl : `${BACKEND_ORIGIN}${pathOrUrl}`);
```

**In development**, Vite proxies `/api` and `/uploads` to the backend (configured in `vite.config.js`). No CORS issues.

**useAuth hook** (from [useAuth.js](../src/hooks/useAuth.js)) — **primary API pattern for all dashboard pages**:
```javascript
import { useAuth } from '../../hooks/useAuth';

function MyDashboardPage() {
  const { authGet, authMutate, getUser, logout } = useAuth('admin'); // or 'orgLeader' or 'specialist'

  // GET with auto-retry on 401 + in-memory TTL cache (60s default)
  const data = await authGet('/users');

  // Bypass cache
  const fresh = await authGet('/users', { skipCache: true });

  // Custom TTL
  const data = await authGet('/stats', { ttl: 30_000 });

  // POST/PATCH/DELETE
  await authMutate('/users', { method: 'POST', body: { name: 'John' } });
  await authMutate('/users/123', { method: 'PATCH', body: { name: 'Jane' } });
  await authMutate('/users/123', { method: 'DELETE' });

  // FormData upload
  const formData = new FormData();
  formData.append('file', file);
  await authMutate('/upload', { body: formData, isFormData: true });
}
```

**Cache behavior**:
- `authGet` caches by `role:path` key with 60s TTL
- `authMutate` **clears all cache** after successful mutation
- Use `clearCache()` to manually invalidate

**Token storage keys per role**:
| Role | Token | Refresh | User |
|------|-------|---------|------|
| admin | `adminToken` | `adminRefreshToken` | `adminUser` |
| orgLeader | `orgLeaderToken` | `orgLeaderRefreshToken` | `orgLeaderUser` |
| specialist | `specialistToken` | `specialistRefreshToken` | `specialistUser` |

**Login pages** use raw `fetch` directly (no useAuth — not yet authenticated):
```javascript
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
const data = await response.json();
localStorage.setItem('adminToken', data.accessToken);
localStorage.setItem('adminRefreshToken', data.refreshToken);
localStorage.setItem('adminUser', JSON.stringify(data.user));
navigate('/admin/dashboard');
```

### Theme System

**ThemeContext** (from [ThemeContext.jsx](../src/context/ThemeContext.jsx)):
```javascript
import { useTheme } from '../../context/ThemeContext';

const { theme, toggleTheme } = useTheme(); // 'light' | 'dark'
```

- Persists to `cognicare-theme` in localStorage
- Defaults to `prefers-color-scheme` media query
- Adds/removes `dark` class on `<html>` element
- All Tailwind `dark:` variants respond to this

### Internationalization (i18n)

**Configuration** (from [i18n.js](../src/i18n.js)):
- Languages: English (`en`), French (`fr`), Arabic (`ar`)
- Auto-detection: `['localStorage', 'navigator']` — detects browser language, persists to localStorage
- Fallback: `en`

**Using translations**:
```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  return <h1>{t('hero.title')}</h1>;
}
```

**RTL Support** — `App.jsx` listens to `i18n.on('languageChanged')` and sets `dir="rtl"` on `<html>` for Arabic.

**LanguageSwitcher** — Tailwind click-based dropdown with flag emojis, animated transitions, RTL-aware positioning, active checkmark.

## Styling Patterns

### Tailwind CSS v4 Design System

**Design tokens** defined in [index.css](../src/index.css) via `@theme`:
```css
@import "tailwindcss";

@theme {
  --color-primary: #2563EB;
  --color-primary-dark: #1E40AF;
  --color-primary-light: #3B82F6;
  --color-primary-content: #ffffff;

  --color-bg-light: #F8FAFC;
  --color-bg-dark: #0F172A;
  --color-surface-light: #ffffff;
  --color-surface-dark: #1E293B;

  --color-text-main: #F1F5F9;
  --color-text-muted: #94A3B8;

  --color-success: #10B981;
  --color-warning: #F97316;
  --color-error: #EF4444;

  --font-display: "Inter", sans-serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

**Usage** — these are available as Tailwind utilities: `bg-primary`, `text-error`, `bg-bg-dark`, `font-display`, etc.

**Glass-morphism utilities** defined in index.css:
```css
.glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); }
.dark .glass { background: rgba(30,41,59,0.8); }
.glass-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); }
```

**All new components use Tailwind classes exclusively** — no component-scoped CSS files:
```javascript
// ✅ Correct — Tailwind classes
<div className="p-6 rounded-2xl bg-white dark:bg-surface-dark border border-slate-200 dark:border-slate-800">

// ❌ Wrong — separate CSS file
import './MyComponent.css';
```

**Dark mode**: Every light class should have a `dark:` counterpart:
```javascript
<div className="bg-white dark:bg-surface-dark text-slate-900 dark:text-slate-100 border-slate-200 dark:border-slate-800">
```

## Critical Development Workflows

### Starting Development

```bash
cd cognicareweb
npm install
npm run dev  # Starts Vite dev server at http://localhost:5173
```

**Vite proxy** — In dev, `/api/*` and `/uploads/*` are proxied to the backend. Set `VITE_BACKEND_ORIGIN` in `.env` to point at your backend:
```bash
# .env (local dev)
VITE_BACKEND_ORIGIN=http://localhost:3000
```

**With backend** (for dashboards):
```bash
# Terminal 1: Backend
cd ../cognicare/backend && npm run start:dev

# Terminal 2: Web Dashboard
cd cognicareweb && npm run dev
```

### Building for Production

```bash
npm run build       # Outputs to dist/ with code-split chunks
npm run preview     # Preview production build locally
```

**Build output**: ~50 chunks thanks to React.lazy code-splitting + manual vendor chunks:
- `vendor-react` — react, react-dom, react-router-dom
- `vendor-i18n` — i18next, react-i18next
- Each page is its own lazy-loaded chunk

### Debugging

**Browser DevTools**:
- React DevTools extension for component inspection
- Network tab for API calls (check Authorization header)
- Console for i18next debug logs (set `debug: true` in i18n.js)

**Common issues**:
- CORS errors → Should not happen in dev (Vite proxy). In prod, backend must include web dashboard origin
- 401 Unauthorized → Token expired, useAuth auto-refreshes but check refresh token
- Translation missing → Check key exists in all locale files (en, fr, ar)
- RTL layout broken → Ensure `dark:` and directional classes correct

## Common Tasks

### Adding a New Dashboard Page

1. Create page component:
```javascript
// src/pages/admin/AdminNewFeature.jsx
export default function AdminNewFeature() {
  const { authGet, authMutate } = useAuth('admin');
  const [data, setData] = useState(null);

  useEffect(() => {
    authGet('/new-endpoint').then(setData).catch(console.error);
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">New Feature</h2>
      {/* content */}
    </div>
  );
}
```

2. Add lazy import in App.jsx:
```javascript
const AdminNewFeature = lazy(() => import('./pages/admin/AdminNewFeature'));
```

3. Add nested route under the layout:
```javascript
<Route path="/admin/dashboard" element={<AdminLayout />}>
  {/* existing routes */}
  <Route path="new-feature" element={<AdminNewFeature />} />
</Route>
```

4. Add nav item in AdminLayout.jsx:
```javascript
{ to: '/admin/dashboard/new-feature', icon: 'new_releases', label: 'New Feature' },
```

### Adding a New Translation

1. Add key to all 3 locale files (`en.json`, `fr.json`, `ar.json`):
```json
{ "newSection": { "title": "New Title" } }
```

2. Use in component:
```javascript
const { t } = useTranslation();
<h1>{t('newSection.title')}</h1>
```

### Making an API Call (Dashboard Pages)

**Always use `useAuth`** — never raw `fetch` in dashboard pages:
```javascript
const { authGet, authMutate } = useAuth('admin');

// Load data
const users = await authGet('/users');

// Create
await authMutate('/users', { method: 'POST', body: { name: 'John' } });

// Update
await authMutate(`/users/${id}`, { method: 'PATCH', body: { name: 'Jane' } });

// Delete
await authMutate(`/users/${id}`, { method: 'DELETE' });

// File upload
const fd = new FormData();
fd.append('file', file);
await authMutate('/upload', { body: fd, isFormData: true });
```

## Key Files Reference

**Infrastructure**:
- [main.jsx](../src/main.jsx) — Entry point, ThemeProvider + i18n init
- [App.jsx](../src/App.jsx) — Router, React.lazy code-splitting, RTL listener
- [config.js](../src/config.js) — **API base URL (single source of truth)**, getUploadUrl
- [vite.config.js](../vite.config.js) — Vite config, proxy, manual chunks
- [index.css](../src/index.css) — Tailwind v4 `@theme` tokens, glass utilities
- [i18n.js](../src/i18n.js) — i18next configuration, language detection

**Shared Components**:
- [SidebarLayout.jsx](../src/components/layouts/SidebarLayout.jsx) — Responsive sidebar layout for all dashboards
- [ThemeToggle.jsx](../src/components/ui/ThemeToggle.jsx) — Dark/light mode toggle
- [ThemeContext.jsx](../src/context/ThemeContext.jsx) — Theme state management
- [LanguageSwitcher.jsx](../src/components/LanguageSwitcher.jsx) — Language dropdown (EN/FR/AR)
- [useAuth.js](../src/hooks/useAuth.js) — **Auth hook with token refresh, cached GET, mutations**
- [StatCard.jsx](../src/components/ui/StatCard.jsx) — Reusable stat card
- [Grainient.jsx](../src/components/Grainient.jsx) — OGL WebGL animated gradient

**Landing & Auth**:
- [LandingPage.jsx](../src/pages/home/LandingPage.jsx) — Public landing page with carousel
- [AdminLogin.jsx](../src/pages/admin/AdminLogin.jsx) — Admin login
- [OrgLeaderLogin.jsx](../src/pages/org-leader/OrgLeaderLogin.jsx) — Org leader login + signup
- [SpecialistLogin.jsx](../src/pages/specialist/SpecialistLogin.jsx) — Specialist login

**Admin Dashboard** (7 pages under `/admin/dashboard`):
- [AdminLayout.jsx](../src/pages/admin/AdminLayout.jsx) — Layout wrapper
- [AdminOverview.jsx](../src/pages/admin/AdminOverview.jsx), [AdminUsers.jsx](../src/pages/admin/AdminUsers.jsx), [AdminOrganizations.jsx](../src/pages/admin/AdminOrganizations.jsx), [AdminFamilies.jsx](../src/pages/admin/AdminFamilies.jsx), [AdminFraudReview.jsx](../src/pages/admin/AdminFraudReview.jsx), [AdminAnalytics.jsx](../src/pages/admin/AdminAnalytics.jsx), [AdminSystemHealth.jsx](../src/pages/admin/AdminSystemHealth.jsx)

**Org Leader Dashboard** (5 pages under `/org/dashboard`):
- [OrgLayout.jsx](../src/pages/org/OrgLayout.jsx) — Layout wrapper
- [OrgOverview.jsx](../src/pages/org/OrgOverview.jsx), [OrgStaff.jsx](../src/pages/org/OrgStaff.jsx), [OrgFamilies.jsx](../src/pages/org/OrgFamilies.jsx), [OrgChildren.jsx](../src/pages/org/OrgChildren.jsx), [OrgInvitations.jsx](../src/pages/org/OrgInvitations.jsx)
- [OrgSpecialistDetail.jsx](../src/pages/org-leader/OrgSpecialistDetail.jsx) — Specialist profile page

**Specialist Dashboard** (3 pages + 4 creators under `/specialist/dashboard`):
- [SpecialistLayout.jsx](../src/pages/specialist/SpecialistLayout.jsx) — Layout wrapper
- [SpecialistOverview.jsx](../src/pages/specialist/SpecialistOverview.jsx), [SpecialistChildren.jsx](../src/pages/specialist/SpecialistChildren.jsx), [SpecialistPlans.jsx](../src/pages/specialist/SpecialistPlans.jsx)
- [PECSBoardCreator.jsx](../src/pages/specialist/PECSBoardCreator.jsx), [TEACCHTrackerCreator.jsx](../src/pages/specialist/TEACCHTrackerCreator.jsx), [SkillTrackerCreator.jsx](../src/pages/specialist/SkillTrackerCreator.jsx), [ActivitiesCreator.jsx](../src/pages/specialist/ActivitiesCreator.jsx)
- [ProgressAIRecommendations.jsx](../src/pages/specialist/ProgressAIRecommendations.jsx) — AI insights per child

**Shared Pages**:
- [SettingsPage.jsx](../src/pages/shared/SettingsPage.jsx) — Settings (used by all dashboards)
- [NotFound.jsx](../src/pages/shared/NotFound.jsx) — 404 page
- [ConfirmAccount.jsx](../src/pages/ConfirmAccount.jsx) — Email confirmation

## Gotchas & Anti-Patterns

1. **React 19 — No React import needed**: Modern JSX transform handles it automatically. Do NOT add `import React from 'react'`.

2. **Always use `useAuth` for API calls** in dashboard pages. Never use raw `fetch` with manual token handling — that's the old pattern. Only login pages use raw `fetch`.

3. **Tailwind only — no component CSS files**: All new components must use Tailwind utility classes. The old `*.css` companion files are legacy.

4. **Logo**: Import from `../../assets/app_logo_withoutbackground.png` and use as `<img>`. Do NOT use Material Symbols `neurology` icon for branding.

5. **localStorage JWT storage**: XSS vulnerable. For production, consider migrating to `httpOnly` cookies.

6. **Code-splitting**: All page components must be imported via `React.lazy()` in App.jsx. Never use static imports for page components.

7. **Nested routes**: Dashboard pages render inside Layout components via `<Outlet />`. Page components should NOT include their own sidebar/header — that's handled by the Layout.

8. **API URL**: Always use `API_BASE_URL` from config.js. In dev, this is `/api/v1` (Vite proxy). In prod, this is the full Render URL. Never hardcode URLs.

9. **Cache invalidation**: `authGet` caches for 60s. After mutations, cache is auto-cleared. If you need fresh data immediately after a GET, pass `{ skipCache: true }`.

10. **RTL CSS**: Always test with Arabic. Use Tailwind logical properties where available. Common issues: fixed `left/right` instead of `start/end`.

11. **Dark mode**: Every light-mode class needs a `dark:` counterpart. Test both themes. Use `bg-white dark:bg-surface-dark` pattern consistently.

12. **WebGL memory leaks**: Always cleanup OGL resources in `useEffect` return function. Watch for orphaned canvas elements.

13. **Translation keys**: Use dot notation (`landing.hero.title`). Add keys to all 3 locale files (en, fr, ar).

14. **`_OLD` files**: Files suffixed with `_OLD` are legacy backups of the pre-migration monolithic dashboards. Do not import or reference them. They exist for rollback reference only.
