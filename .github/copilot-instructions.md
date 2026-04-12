# CogniCare Web Dashboard - AI Agent Instructions

> **Last updated:** April 12, 2026  
> **Read root instructions first:** `../.github/copilot-instructions.md`

---

## Scope and Relation to Other Projects
- This project is the **React/Vite web app** for:
  - Public landing page with SEO optimization
  - Admin dashboard (user mgmt, org approval, fraud review, analytics, system health)
  - Organization leader dashboard (staff mgmt, family invites, children, RNE verification)
  - Specialist dashboard (children, plans, PECS/TEACCH/Activity creators, AI recommendations)
- **API source:** `cognicare-mobile/backend` (NestJS v1)
- **DO NOT edit:** `cognicare-mobile/backend-v2` unless user explicitly requests v2 work

---

## Tech Stack

| Layer | Technology | Version | Notes |
|-------|------------|---------|-------|
| **UI Framework** | React | 19.2.0 | Function components, hooks only |
| **Build Tool** | Vite | 7.2.4 | Dev server, build, code splitting |
| **Routing** | React Router DOM | 7.13.0 | Client-side, lazy-loaded routes |
| **Styling** | Tailwind CSS | 4.2.1 | CSS-first config in `src/index.css` |
| **i18n** | i18next + react-i18next | 25.8.4 / 16.5.4 | EN/FR/AR with RTL support |
| **3D/Graphics** | three.js + @react-three/fiber | 0.182.0 / 9.5.0 | Landing page 3D effects |
| **Charts** | recharts | 3.7.0 | Analytics dashboard |
| **PWA** | vite-plugin-pwa + workbox | 1.2.0 / 7.4.0 | Offline support, update prompts |
| **SEO** | react-helmet-async | 3.0.0 | Per-page meta tags |
| **Excel Export** | xlsx | 0.18.5 | System health CSV export |

---

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (http://localhost:5173)
npm run build        # Production build + SEO pre-rendering
npm run build:no-prerender  # Build without pre-rendering
npm run lint         # ESLint check
npm run preview      # Preview production build
```

---

## Architecture Patterns

### Routing Structure ([src/App.jsx](src/App.jsx))
All routes use **React.lazy + Suspense** for code splitting:

```
/                              LandingPage             [public]
/admin/login                   AdminLogin              [public]
/admin/dashboard               AdminLayout (shell)     [protected: role=admin]
  /admin/dashboard/            AdminOverview
  /admin/dashboard/users       AdminUsers
  /admin/dashboard/organizations AdminOrganizations
  /admin/dashboard/families    AdminFamilies
  /admin/dashboard/reviews     AdminFraudReview
  /admin/dashboard/training    AdminTrainingCourses
  /admin/dashboard/caregiver-applications AdminCaregiverApplications
  /admin/dashboard/analytics   AdminAnalytics
  /admin/dashboard/system-health AdminSystemHealth
  /admin/dashboard/settings    SettingsPage
/org/login                     OrgLeaderLogin          [public]
/org/dashboard                 OrgLayout (shell)       [protected: role=orgLeader]
  /org/dashboard/              OrgOverview
  /org/dashboard/staff         OrgStaff
  /org/dashboard/families      OrgFamilies
  /org/dashboard/children      OrgChildren
  /org/dashboard/invitations   OrgInvitations
  /org/dashboard/rne-verification OrgRNEVerification
  /org/dashboard/specialist/:id OrgSpecialistDetail
  /org/dashboard/settings      SettingsPage
/specialist/login              SpecialistLogin         [public]
/specialist/dashboard          SpecialistLayout (shell) [protected: role=specialist]
  /specialist/dashboard/       SpecialistOverview
  /specialist/dashboard/children SpecialistChildren
  /specialist/dashboard/plans  SpecialistPlans
  /specialist/dashboard/settings SettingsPage
/specialist/pecs/create        PECSBoardCreator        [protected]
/specialist/teacch/create      TEACCHTrackerCreator    [protected]
/specialist/activities         ActivitiesCreator       [protected]
/specialist/skill-tracker      SkillTrackerCreator     [protected]
/specialist/ai-recommendations/:childId ProgressAIRecommendations [protected]
/confirm-account               ConfirmAccount          [public]
*                              NotFound (404)          [public]
```

**Legacy Redirect:** `/healthcare/*` → `/specialist/dashboard`

### Component Structure

**Layout Components** ([src/components/layouts](src/components/layouts)):
- **SidebarLayout.jsx** — Shared dashboard shell for all roles
  - Props: `title`, `subtitle`, `brandName`, `navItems`, `bottomItems`, `user`, `onLogout`, `headerActions`, `seoHead`
  - Features: Mobile hamburger menu, role-specific navigation, theme toggle
  - Integrates with `DashboardAssistantContext` for resizable AI assistant panel

**UI Components** ([src/components/ui](src/components/ui)):
- **StatCard.jsx** — Reusable stat display cards
- **StatusBadge.jsx** — Role/status badges
- **ThemeToggle.jsx** — Dark/light mode switcher
- **CursorEffect.jsx**, **FloatingParticles.jsx**, **ParticleBurst.jsx** — 3D/animation effects

**Shared Components** ([src/components](src/components)):
- **SEOHead.jsx** — Per-page SEO meta tags (title, OG, Twitter Card, JSON-LD)
- **PWAPrompt.jsx** — Offline banner + service worker update prompt
- **LanguageSwitcher.jsx** — EN/FR/AR language selector with flag emojis
- **ProtectedRoute.jsx** — Role-based route protection
- **Grainient.jsx** — Animated gradient background

---

## API Integration

### Configuration ([src/config.js](src/config.js))
```javascript
const isDev = import.meta.env.MODE === 'development';
const BACKEND_ORIGIN = import.meta.env.VITE_BACKEND_ORIGIN || 'https://cognicare-mobile-h4ct.onrender.com';
const API_BASE_URL = isDev ? '/api/v1' : `${BACKEND_ORIGIN}/api/v1`;

export const getUploadUrl = (pathOrUrl) => {
  if (!pathOrUrl || pathOrUrl.startsWith('http')) return pathOrUrl;
  return isDev ? pathOrUrl : `${BACKEND_ORIGIN}${pathOrUrl}`;
};
```

**⚠️ Config Mismatch:**
- `config.js` dev fallback: `localhost:3001`
- `vite.config.js` proxy fallback: `localhost:3000`
- **Keep these aligned!**

### Vite Dev Proxy ([vite.config.js](vite.config.js))
```javascript
proxy: {
  '/api': {
    target: process.env.VITE_BACKEND_ORIGIN || 'http://localhost:3000',
    changeOrigin: true,
  },
  '/uploads': {
    target: process.env.VITE_BACKEND_ORIGIN || 'http://localhost:3000',
    changeOrigin: true,
  },
}
```

### useAuth Hook ([src/hooks/useAuth.js](src/hooks/useAuth.js))
Central authentication primitive for role-based sessions:

```javascript
const { authFetch, authGet, authMutate, logout, getUser, clearCache } = useAuth('admin' | 'orgLeader' | 'specialist');
```

**Features:**
- Automatic token injection (`Authorization: Bearer <token>`)
- Auto-retry on 401 with silent token refresh via `POST /auth/refresh`
- Correlation ID header (`X-Correlation-Id: <timestamp>-<random>`)
- In-memory GET cache (60s TTL, scoped by `role:userId:tokenSlice:path`)
- Global cache invalidation on mutations (`authMutate()` clears all cache)
- Performance metrics tracking via `recordApiMetric(path, status, duration, correlationId)`

**localStorage Keys:**
| Role | Token | Refresh | User |
|------|-------|---------|------|
| admin | `adminToken` | `adminRefreshToken` | `adminUser` |
| orgLeader | `orgLeaderToken` | `orgLeaderRefreshToken` | `orgLeaderUser` |
| specialist | `specialistToken` | `specialistRefreshToken` | `specialistUser` |

**Methods:**
- `authFetch(path, options)` — Authenticated fetch with auto-refresh on 401
- `authGet(path, { ttl, skipCache })` — GET with in-memory cache (default 60s TTL)
- `authMutate(path, { method, body, isFormData })` — POST/PATCH/DELETE with auto cache invalidation
- `logout()` — Clears tokens, user, cache; redirects to login
- `getUser()` — Returns current user object from localStorage
- `clearCache()` — Manually clears GET cache

**Cache Scoping (2026-04-12 security fix):**
- Cache key includes `userId` and first 8 chars of access token
- Prevents cross-account cache leaks in shared browsers
- Auto-invalidates on token refresh

### Standalone API Client ([src/apiClient.js](src/apiClient.js))
```javascript
cachedGet(path, { ttlMs = 60_000, signal, token })
```
- Used by pages managing their own tokens (e.g., `ProgressAIRecommendations`)
- Separate in-memory cache from `useAuth`
- Cache key includes token prefix slice (first 8 chars)

---

## State Management

### No Global State Library
- Each page manages its own local state with `useState`
- Shared data fetched via `useAuth` hooks with TTL caching
- Cache invalidation on mutations

### Context Providers

**ThemeProvider** ([src/context/ThemeContext.jsx](src/context/ThemeContext.jsx)):
- Dark/light mode state
- Syncs with localStorage (`'cognicare-theme'`)
- Adds `.dark` class to `<html>` element

**DashboardAssistantProvider** ([src/assistant/DashboardAssistantContext.jsx](src/assistant/DashboardAssistantContext.jsx)):
- Manages AI assistant panel state
- Collapsible/resizable panel (min 300px, max 800px, default 380px)
- Per-route UI context

### Common Data Fetching Pattern
```javascript
const [data, setData] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

const loadData = async () => {
  setLoading(true);
  setError('');
  try {
    const res = await authGet('/endpoint');
    setData(Array.isArray(res) ? res : []);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

useEffect(() => { loadData(); }, []);
```

---

## Internationalization (i18n)

### Setup ([src/i18n.js](src/i18n.js))
- **Library:** i18next + react-i18next + i18next-browser-languagedetector
- **Languages:** English (en), French (fr), Arabic (ar)
- **RTL Support:** Arabic automatically applies `dir="rtl"` to `<html>`
- **Detection:** localStorage first (`'i18nextLng'`), then navigator language
- **Fallback:** English

### Translation Files ([src/locales/](src/locales))
- ~1625 translation keys per file
- Structure: `{ "section.key": "value" }`
- Sections: `common.*`, `roles.*`, `pwa.*`, `adminAnalytics.*`, `pecsCreator.*`, etc.

### Usage Pattern
```javascript
import { useTranslation } from 'react-i18next';

const { t, i18n } = useTranslation();

// Static strings
<button>{t('common.save')}</button>

// Interpolation
<p>{t('adminUsers.userCount', { count: users.length })}</p>

// Role display (ALWAYS use this pattern)
<span>{t(`roles.${user.role}`)}</span>
```

### RTL Handling ([src/App.jsx](src/App.jsx))
```javascript
useEffect(() => {
  const handleLanguageChange = (lng) => {
    document.documentElement.setAttribute('dir', lng === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lng);
  };
  i18n.on('languageChanged', handleLanguageChange);
  handleLanguageChange(i18n.language);
  return () => i18n.off('languageChanged', handleLanguageChange);
}, [i18n]);
```

### i18n Status
**Completed (7 pages):**
- ActivitiesCreator, PECSBoardCreator, SkillTrackerCreator, TEACCHTrackerCreator
- ProgressAIRecommendations, AdminAnalytics, AdminOverview

**Remaining (8 admin pages, ~350 keys):**
- AdminLayout, AdminFraudReview, AdminFamilies, AdminUsers, AdminTrainingCourses
- AdminSystemHealth, AdminOrganizations, OrgSpecialistDetail

See [I18N_REMAINING_WORK.md](I18N_REMAINING_WORK.md) for detailed inventory.

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

See [I18N_REMAINING_WORK.md](I18N_REMAINING_WORK.md) for detailed inventory.

**Conventions:**
- **Always use `t()` function** for all user-visible text
- **Never hardcode English strings**
- **Use `t('roles.{roleName}')` pattern** for role display (not string manipulation)
- Add keys to all 3 locale files (en.json, fr.json, ar.json) simultaneously

---

## Progressive Web App (PWA)

### Configuration ([vite.config.js](vite.config.js))
- **Plugin:** vite-plugin-pwa 1.2.0
- **Register Type:** `'prompt'` (user explicitly chooses to reload for updates)
- **Precache:** ~75 entries (≈ 2744 KB) — all JS/CSS/HTML/SVG/PNG/WOFF2
- **Navigate Fallback:** `index.html` (SPA routing)

### Web App Manifest
```json
{
  "name": "CogniCare – Cognitive Health Platform",
  "short_name": "CogniCare",
  "theme_color": "#2563EB",
  "background_color": "#0f172a",
  "display": "standalone",
  "categories": ["health", "medical", "education"]
}
```

### Icon Sizes
- 72×72, 96×96, 128×128, 144×144, 152×152, 192×192, 384×384, 512×512
- Maskable icon: 512×512 (blue bg + padding for Android)
- Apple touch icon: 180×180

### Workbox Runtime Caching ([src/sw.js](src/sw.js))
| Cache | Pattern | Strategy | TTL |
|-------|---------|----------|-----|
| google-fonts-stylesheets | `fonts.googleapis.com/*` | CacheFirst | 1 year |
| google-fonts-webfonts | `fonts.gstatic.com/*` | CacheFirst | 1 year |
| image-cache | `res.cloudinary.com/*` | CacheFirst | 30 days |

**⚠️ Security Note:** API caching removed in 2026-04-12 hardening to prevent authenticated data leaks in shared browsers.

### User Experience ([src/components/PWAPrompt.jsx](src/components/PWAPrompt.jsx))
- **Offline banner:** Yellow top banner when `navigator.onLine` is false
- **Update prompt:** Bottom-right card with "Later" or "Reload" options
- Auto-checks for updates every 60 minutes
- Fully translated via `pwa.*` i18n keys

---

## Performance Monitoring

### API Metrics ([src/utils/performanceMonitor.js](src/utils/performanceMonitor.js))
In-memory tracking for system health dashboard:
- Records: role, method, path, status, duration, correlation ID, errors
- Max 500 entries in memory
- Accessed via `getApiMetricsSnapshot()`

---

## Environment Variables

### Development (.env.development)
```env
VITE_BACKEND_ORIGIN=http://localhost:3000
VITE_PUBLIC_SITE_ORIGIN=http://localhost:5173
```

### Production (.env.production)
```env
VITE_BACKEND_ORIGIN=https://cognicare-mobile-h4ct.onrender.com
VITE_PUBLIC_SITE_ORIGIN=https://cognicare.app
```

---

## Key Features by Dashboard

### Admin Dashboard
- **User Management:** CRUD for all platform users, role assignment
- **Organization Approval:** AI fraud detection review (RNE certificate scanning)
- **Family Management:** Platform-wide family CRUD, child records, org assignment
- **Training Courses:** Review/approve submissions
- **Caregiver Applications:** Review applications
- **Analytics:** Platform-wide usage stats with Recharts visualizations (users by role, children by diagnosis, posts/products/donations over time, top organizations)
- **System Health:** API latency monitoring, service probes, audit logs with CSV export

### Organization Leader Dashboard
- **Staff Management:** Invite/create specialists, view performance summaries
- **Family Management:** Invite/create families within org
- **Children:** View all children in org
- **Invitations:** Track pending invites (staff + families)
- **RNE Verification:** AI-powered certificate validation + Jitsi video calls

### Specialist Dashboard
- **Overview:** Quick stats (children count, plans by type, AI suggestions)
- **Children:** View assigned children (org + private practice)
- **Plans:** Manage treatment plans (PECS, TEACCH, Activities, Skill Trackers)
- **Creator Tools:**
  - **PECSBoardCreator:** 6-phase PECS board builder with Cloudinary image upload
  - **TEACCHTrackerCreator:** Work system tracker
  - **ActivitiesCreator:** Custom activity plans
  - **SkillTrackerCreator:** 10-trial DTT tracker
- **AI Recommendations:** Gemini 1.5-powered progress suggestions with thumbs-up/down feedback

---

## Critical Quirks & Patterns

### Auth/Network Quirks
1. **Config mismatch:** `config.js` dev fallback = `localhost:3001`, `vite.config.js` proxy = `localhost:3000`
2. **Silent login failures:** If backend host unreachable, login appears to succeed but redirect fails
3. **Cache scoping:** `useAuth` GET cache is user/session-scoped (2026-04-12 fix) to prevent cross-account leaks
4. **Role parity:** Specialist role accepts both `specialist` and `careProvider` (backend inconsistency)

### Component Patterns
- **Deduplication:** Child lists use `dedupeChildren()` to handle duplicate IDs from multiple API sources
- **Safe array handling:** Always check `Array.isArray()` before array operations
- **Date formatting:** Use `dateFmt(date, lang)` from [src/utils/planUtils.js](src/utils/planUtils.js) for locale-aware dates
- **Plan type colors:** Use `getTypeColor()` and `getTypeBg()` from planUtils for consistent styling

### SEO Pre-rendering
- Post-build script: [scripts/prerender-routes.mjs](scripts/prerender-routes.mjs)
- Generates static HTML for key routes (landing page, login pages)
- Run via `npm run build` (not `build:no-prerender`)

### Material Icons Fallback
- `bootstrapMaterialIconFallback()` in [src/main.jsx](src/main.jsx) ensures icon fonts load

---

## When Editing This App

### For Auth Changes
- Update all three surfaces together: login page(s), `useAuth`, and backend contract assumptions
- Test token refresh flow (wait 15min or mock expired token)
- Verify localStorage keys are consistent across all role flows

### For Uploads/Media URLs
- Use `getUploadUrl()` from `src/config.js` (do not hardcode backend host)
- Remember backend serves `/uploads` statically with custom `.m4a` MIME type

### For Dashboard Navigation Changes
- Update route tree in `App.jsx`
- Update sidebar nav configuration in layout pages (`AdminLayout`, `OrgLayout`, `SpecialistLayout`)
- Ensure `ProtectedRoute` wrapper validates role correctly

### For New UI Text
- Add translation keys to all 3 locale files (en.json, fr.json, ar.json)
- Use `t()` function consistently
- Never hardcode English strings
- Organize keys by page/component (e.g., `newPage.title`, `newPage.saveButton`)

### For Role Display
- **Always use:** `{t('roles.' + user.role)}`
- **Never use:** `user.role.replace(/_/g, ' ')` or similar

### For Data Fetching
- Use `authGet()` for read operations (benefits from cache)
- Use `authMutate()` for write operations (auto-invalidates cache)
- Handle loading + error states explicitly
- Safe-guard array responses: `setData(Array.isArray(res) ? res : [])`

### For API Changes
- Verify endpoint exists in backend Swagger docs (`http://localhost:3000/api`)
- Check required auth (JWT, role guards)
- Update both dev and prod environment variables if base URL changes
- Test with backend running locally first

---

## Code Conventions

### JavaScript Only
- No TypeScript in this project
- Use JSDoc comments for complex functions
- Prefer `const` over `let`, avoid `var`

### Component Style
- Function components only (no class components)
- Hooks for state/effects
- Prefer existing UI primitives before creating new ones
- Keep role-specific behavior explicit by route namespace

### File Naming
- Components: PascalCase (e.g., `AdminOverview.jsx`)
- Utilities: camelCase (e.g., `planUtils.js`)
- Hooks: camelCase with `use` prefix (e.g., `useAuth.js`)
- Pages: PascalCase in `pages/{role}/` folders

### Import Order (Convention)
1. React + React libraries
2. Third-party libraries
3. Hooks
4. Components
5. Utils/config
6. Styles/assets

---

## Build and Deployment

### Docker Build ([Dockerfile](Dockerfile))
- Multi-stage: Node 20 Alpine → Nginx Alpine
- Build args: `VITE_BACKEND_ORIGIN`, `VITE_PUBLIC_SITE_ORIGIN`
- Port: 80

### Nginx Config ([nginx.conf](nginx.conf))
- Client-side routing fallback: `try_files $uri /index.html`
- APK download support with proper MIME type
- Security headers (CSP, HSTS, X-Frame-Options, etc.)
- Static asset caching (1 year for JS/CSS/fonts)
- Gzip compression enabled

### Deployment (Render)
- Service: `cognicare-webapp`
- Region: Frankfurt
- Plan: Free tier
- Health check: `/`

### Vite Build Configuration
**Code Splitting Strategy:**
```javascript
manualChunks: {
  'vendor-react': ['react', 'react-dom', 'react-router-dom'],
  'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
  'vendor-three': ['three', '@react-three/fiber', '@react-three/drei'],
  'vendor-motion': ['framer-motion'],
  'vendor-charts': ['recharts'],
  'vendor-xlsx': ['xlsx'],
}
```

**Security Headers (Dev Server):**
```javascript
headers: {
  'Content-Security-Policy': "default-src 'self'; ...",
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}
```

---

## Testing Checklist

**Before Deploying:**
- [ ] Run `npm run lint` and fix all errors
- [ ] Test all three role dashboards (admin, org leader, specialist)
- [ ] Test login/logout flows for each role
- [ ] Verify token refresh works (wait 15 min or mock expired token)
- [ ] Test offline mode (disable network, check PWA banner)
- [ ] Test service worker update prompt
- [ ] Verify all new UI text has translations in all 3 languages
- [ ] Check RTL layout for Arabic
- [ ] Test on mobile viewport (responsive design)
- [ ] Verify SEO meta tags (`view-source:` on landing page)

**After Backend Changes:**
- [ ] Check Swagger docs for new/changed endpoints
- [ ] Update API calls in web dashboard
- [ ] Test with backend running locally
- [ ] Verify CORS settings allow web dashboard origin

---

## Common Pitfalls to Avoid

1. **❌ Hardcoding backend URL** — Always use `API_BASE_URL` from `config.js` or `getUploadUrl()`
2. **❌ Mixing role localStorage keys** — Each role has its own token/refresh/user keys
3. **❌ Ignoring cache scope** — Cache keys must include user/session identifiers
4. **❌ Direct array mutation** — Array responses may be objects; always check `Array.isArray()`
5. **❌ English-only strings** — All user-facing text must use `t()` function
6. **❌ Skipping error handling** — Always catch fetch errors and show user-friendly messages
7. **❌ Forgetting RTL** — Test Arabic layout; icons/alignment may need `rtl:` Tailwind classes
8. **❌ Uncached mutations** — Use `authMutate()` to auto-invalidate GET cache
9. **❌ Missing SEO** — New public pages need `<SEOHead>` component
10. **❌ Editing backend-v2** — Always edit `backend/` (v1), not `backend-v2/`

---

## Useful Snippets

### Standard Page Template
```javascript
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import useAuth from '../../hooks/useAuth';

export default function MyPage() {
  const { t } = useTranslation();
  const { authGet, authMutate } = useAuth('admin'); // or 'orgLeader', 'specialist'
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await authGet('/endpoint');
      setData(Array.isArray(res) ? res : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) return <div className="p-8">{t('common.loading')}</div>;
  if (error) return <div className="p-8 text-red-600">{error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">{t('myPage.title')}</h1>
      {/* Content */}
    </div>
  );
}
```

### Mutation with Cache Invalidation
```javascript
const handleCreate = async (formData) => {
  try {
    await authMutate('/endpoint', {
      method: 'POST',
      body: formData,
    });
    // Cache auto-invalidated, reload data
    loadData();
  } catch (err) {
    setError(err.message);
  }
};
```

### File Upload
```javascript
const handleUpload = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  await authMutate('/upload', {
    method: 'POST',
    body: formData,
    isFormData: true, // Important: tells authMutate not to JSON-stringify
  });
};
```

---

**For more details, see:**
- [WEB_ARCHITECTURE.md](WEB_ARCHITECTURE.md) — Full API reference
- [I18N_REMAINING_WORK.md](I18N_REMAINING_WORK.md) — Translation status
- [TESTING_GUIDE.md](architecture/TESTING_GUIDE.md) — Testing strategies
- Root workspace instructions: `../.github/copilot-instructions.md`