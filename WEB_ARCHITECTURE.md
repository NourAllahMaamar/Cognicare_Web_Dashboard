# CogniCare Web Dashboard — Architecture & API Reference

> **Last updated:** April 2026  
> **Project path:** `Cognicare_Web_Dashboard/`  
> **Backend base URL:** `https://<backend-host>/api/v1` (dev proxy: `http://localhost:3000/api/v1`)

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Progressive Web App (PWA)](#3-progressive-web-app-pwa)
4. [Routing Architecture](#4-routing-architecture)
5. [Authentication System](#5-authentication-system)
6. [API Client & Data Fetching](#6-api-client--data-fetching)
7. [API Reference by Module](#7-api-reference-by-module)
8. [Internationalization (i18n)](#8-internationalization-i18n)
9. [SEO Architecture](#9-seo-architecture)
10. [Performance Monitoring](#10-performance-monitoring)
11. [Environment Variables](#11-environment-variables)

---

## 1. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| UI Framework | React | 19.x |
| Build Tool | Vite | 7.x |
| Styling | Tailwind CSS (v4, CSS-first) | 4.x |
| Routing | React Router DOM | 7.x |
| Data Visualization | Recharts | 3.x |
| 3D / WebGL | @react-three/fiber + three.js | latest |
| i18n | i18next + react-i18next | 25.x / 16.x |
| PWA | vite-plugin-pwa + Workbox | 1.2.0 / 7.x |
| SEO | react-helmet-async | latest |
| Excel Export | xlsx | 0.18.x |

---

## 2. Project Structure

```
Cognicare_Web_Dashboard/
├── public/                     # Static assets (icons, sitemap, robots)
│   ├── pwa-*.png               # PWA icons (72–512 px)
│   ├── pwa-maskable-512x512.png
│   ├── apple-touch-icon.png
│   ├── logo.svg
│   ├── sitemap.xml
│   └── robots.txt
├── scripts/
│   └── prerender-routes.mjs    # Post-build SEO pre-renderer
├── src/
│   ├── App.jsx                 # Root router, lazy-loaded routes
│   ├── main.jsx                # Entry point (HelmetProvider + ThemeProvider)
│   ├── config.js               # API_BASE_URL + getUploadUrl()
│   ├── apiClient.js            # Standalone cachedGet() helper
│   ├── i18n.js                 # i18next setup (EN/FR/AR)
│   ├── index.css               # Tailwind CSS entry
│   ├── hooks/
│   │   ├── useAuth.js          # Auth hook (token mgmt, authFetch/authGet/authMutate)
│   │   └── useTheme.js
│   ├── components/
│   │   ├── SEOHead.jsx         # Per-page meta/OG/JSON-LD component
│   │   ├── PWAPrompt.jsx       # Offline banner + SW update prompt
│   │   ├── LanguageSwitcher.jsx
│   │   ├── layouts/
│   │   │   └── SidebarLayout.jsx  # Shared dashboard shell (all roles)
│   │   └── ui/                 # ThemeToggle, StatCard, StatusBadge, etc.
│   ├── context/
│   │   └── ThemeContext.jsx    # Dark / light mode state
│   ├── locales/
│   │   ├── en.json             # ~1625 translation keys
│   │   ├── fr.json
│   │   └── ar.json
│   ├── pages/
│   │   ├── home/               # LandingPage (public)
│   │   ├── admin/              # 9 admin dashboard pages + login
│   │   ├── org/                # 7 org-leader dashboard pages
│   │   ├── org-leader/         # OrgLeaderLogin + OrgSpecialistDetail
│   │   ├── specialist/         # 8 specialist dashboard pages + login
│   │   ├── shared/             # SettingsPage, NotFound
│   │   └── ConfirmAccount.jsx  # Account activation via email link
│   └── utils/
│       ├── performanceMonitor.js  # In-memory API latency tracker
│       └── planUtils.js
├── index.html                  # App shell with PWA meta tags
├── vite.config.js              # Build config (Vite + Tailwind + VitePWA)
└── package.json
```

---

## 3. Progressive Web App (PWA)

The web dashboard is a fully offline-capable PWA built with **vite-plugin-pwa v1.2.0** and **Workbox**.

### Configuration (`vite.config.js`)

| Setting | Value |
|---|---|
| `registerType` | `'prompt'` — user explicitly chooses to reload for updates |
| `precached entries` | 75 entries (≈ 2744 KB) — all JS/CSS/HTML/SVG/PNG/WOFF2 |
| `navigateFallback` | `index.html` (SPA fallback for all non-API routes) |

### Web App Manifest

| Field | Value |
|---|---|
| `name` | CogniCare – Cognitive Health Platform |
| `short_name` | CogniCare |
| `display` | `standalone` |
| `theme_color` | `#2563EB` (blue) |
| `background_color` | `#0f172a` (dark navy) |
| `start_url` | `/` |
| `categories` | `health`, `medical`, `education` |

### Icon Sizes

| File | Size | Purpose |
|---|---|---|
| `pwa-72x72.png` | 72×72 | Android legacy |
| `pwa-96x96.png` | 96×96 | Android |
| `pwa-128x128.png` | 128×128 | Chrome Web Store |
| `pwa-144x144.png` | 144×144 | IE11 tile |
| `pwa-152x152.png` | 152×152 | iPad |
| `pwa-192x192.png` | 192×192 | Android home screen |
| `pwa-384x384.png` | 384×384 | Android splash |
| `pwa-512x512.png` | 512×512 | Play Store + OG image |
| `pwa-maskable-512x512.png` | 512×512 | Adaptive icon (blue bg + padding) |
| `apple-touch-icon.png` | 180×180 | iOS home screen |

### Workbox Runtime Caching Strategies

| Cache name | URL pattern | Strategy | TTL |
|---|---|---|---|
| `google-fonts-stylesheets` | `fonts.googleapis.com/*` | CacheFirst | 1 year |
| `google-fonts-webfonts` | `fonts.gstatic.com/*` | CacheFirst | 1 year |
| `api-cache` | `/api/v1/*` | NetworkFirst | 1 hour (10s network timeout) |
| `image-cache` | `/uploads/*`, `res.cloudinary.com/*` | CacheFirst | 30 days |

> 2026-04-10 audit note: authenticated `/api/v1/*` runtime caching is a data-isolation risk in shared-browser scenarios and should be removed or restricted to explicitly public endpoints before broader production rollout.

### PWA User Experience Components

**`src/components/PWAPrompt.jsx`**
- **Offline banner** (top of screen, yellow): Appears automatically when `navigator.onLine` is false; dismisses on reconnect.
- **Update prompt** (bottom-right card): Appears when a new service worker is available (checks every 60 minutes via `setInterval`). User can dismiss ("Later") or reload ("Reload") to activate the new version.
- Fully translated via `pwa.*` i18n keys (EN/FR/AR).

---

## 4. Routing Architecture

All routing is client-side via React Router v7 with `BrowserRouter`. Every page component is **lazy-loaded** (`React.lazy` + `Suspense`) for optimal code splitting.

### Route Tree

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

### Auth Guards

Each dashboard layout (`AdminLayout`, `OrgLayout`, `SpecialistLayout`) reads session state from `localStorage` on mount.

- `AdminLayout` currently validates role explicitly.
- `OrgLayout` and `SpecialistLayout` currently validate presence of stored user data, then rely on backend guards for sensitive API operations.

2026-04-10 hardening requirement: introduce a unified protected-route wrapper with strict role validation for every role dashboard and creator route.

---

## 5. Authentication System

**Pattern:** JWT access token (15 min) + refresh token (7 days), stored per-role in `localStorage`.

### localStorage Keys

| Role | Access token key | Refresh token key | User object key |
|---|---|---|---|
| Admin | `adminToken` | `adminRefreshToken` | `adminUser` |
| Org Leader | `orgLeaderToken` | `orgLeaderRefreshToken` | `orgLeaderUser` |
| Specialist | `specialistToken` | `specialistRefreshToken` | `specialistUser` |

### `useAuth(role)` Hook (`src/hooks/useAuth.js`)

The central auth primitive. Returns:

| Method | Description |
|---|---|
| `authFetch(path, options)` | Authenticated `fetch` with auto-retry on 401 (silent token refresh). Attaches `Authorization: Bearer <token>` and `X-Correlation-Id` headers. Records API metrics. |
| `authGet(path, { ttl, skipCache })` | Wraps `authFetch`, parses JSON, maintains a shared in-memory TTL cache (60s default). Cache is currently keyed by `role:path` and must be user/session-scoped for production. |
| `authMutate(path, { method, body, isFormData })` | POST/PATCH/DELETE helper. Automatically clears the entire GET cache after any mutation. |
| `logout()` | Clears all 3 localStorage keys and redirects to login. |
| `refreshAccessToken()` | Called internally on 401. Calls `POST /auth/refresh` and saves the new access token. |
| `clearCache()` | Manually clears the shared In-memory GET cache. |

### Token Refresh Flow

```
authFetch() → 401 response
  → refreshAccessToken() → POST /auth/refresh { refreshToken }
    → success: save new accessToken, retry original request
    → failure: logout() → redirect to /role/login
```

### Login Endpoints Used

| Page | Endpoint | Body |
|---|---|---|
| Admin login | `POST /auth/login` | `{ email, password }` |
| Org leader login | `POST /auth/login` | `{ email, password }` |
| Org leader signup | `POST /auth/signup` | `multipart/form-data` (profile + certificate PDF) |
| Specialist login | `POST /auth/login` | `{ email, password }` |
| Account activation | `POST /auth/activate` | `{ token, password }` |
| Token refresh | `POST /auth/refresh` | `{ refreshToken }` |
| Update profile | `PATCH /auth/profile` | `{ fullName, phone }` |
| Change password | `PATCH /auth/change-password` | `{ currentPassword, newPassword }` |

---

## 6. API Client & Data Fetching

### `src/config.js`

```js
const API_BASE_URL = isDev ? '/api/v1' : `${BACKEND_ORIGIN}/api/v1`
```

- In **development**: relative `/api/v1` → proxied by Vite to `http://localhost:3000`
- In **production**: absolute URL using `VITE_BACKEND_ORIGIN` env var

```js
getUploadUrl(pathOrUrl)  // Resolves relative /uploads paths to absolute in production
```

### Vite Dev Proxy (`vite.config.js`)

```
/api   → VITE_BACKEND_ORIGIN (default: http://localhost:3000)
/uploads → VITE_BACKEND_ORIGIN
```

### `src/apiClient.js` — `cachedGet(path, { ttlMs, token })`

A standalone (non-hook) cached GET helper used by pages that manage their own tokens directly (e.g., `ProgressAIRecommendations`). Cache key includes a token prefix slice to prevent cross-session cache sharing.

### In-Memory GET Cache

Both `useAuth.authGet` and `apiClient.cachedGet` maintain their own in-memory caches:

| Cache | Location | Default TTL | Invalidation |
|---|---|---|---|
| `useAuth` GET cache | Module-level `Map` in `useAuth.js` | 60 seconds | `authMutate()` clears all entries |
| `apiClient` GET cache | Module-level `Map` in `apiClient.js` | 60 seconds (configurable) | Not auto-cleared |

---

## 7. API Reference by Module

All endpoints are relative to `/api/v1`. Role column indicates which dashboard makes the call.

### Auth (`/auth`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/auth/login` | Email/password login | All |
| POST | `/auth/signup` | Org leader registration + certificate upload | Org Leader |
| POST | `/auth/refresh` | Refresh access token | All |
| POST | `/auth/activate` | Activate account from email link | Public |
| PATCH | `/auth/profile` | Update name + phone | All |
| PATCH | `/auth/change-password` | Change password | All |

### Users (`/users`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/users` | List all platform users | Admin |
| POST | `/users` | Create a user | Admin |
| PATCH | `/users/:id` | Update user by ID | Admin |
| DELETE | `/users/:id` | Delete user by ID | Admin |

### Organization (`/organization`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/organization/all` | List all organizations | Admin |
| DELETE | `/organization/:id` | Delete an organization | Admin |
| PATCH | `/organization/:id/change-leader` | Change org leader | Admin |
| GET | `/organization/admin/pending-requests` | Orgs awaiting AI fraud review | Admin |
| GET | `/organization/admin/reviewed-requests` | Orgs already reviewed | Admin |
| GET | `/organization/admin/pending-invitations` | Pending org leader invites | Admin |
| GET | `/organization/admin/families` | All families across platform | Admin |
| GET | `/organization/admin/all-children` | All children across platform | Admin |
| POST | `/organization/admin/invite-leader` | Invite a new org leader | Admin |
| PATCH | `/organization/admin/review/:orgId` | Approve/reject org after fraud review | Admin |
| PATCH | `/organization/admin/re-review/:orgId` | Re-open review decision | Admin |
| DELETE | `/organization/admin/invitations/:id` | Cancel a pending invitation | Admin |
| POST | `/organization/admin/families` | Create a family (admin) | Admin |
| PATCH | `/organization/admin/families/:id` | Update family (admin) | Admin |
| DELETE | `/organization/admin/families/:id` | Delete family (admin) | Admin |
| PATCH | `/organization/admin/families/:id/organization` | Assign/remove family from org | Admin |
| GET | `/organization/admin/families/:id/children` | List children of a family | Admin |
| POST | `/organization/admin/families/:id/children` | Add child to family | Admin |
| PATCH | `/organization/admin/families/:id/children/:cid` | Update child | Admin |
| DELETE | `/organization/admin/families/:id/children/:cid` | Delete child | Admin |
| GET | `/organization/my-organization/staff` | List staff of current org | Org Leader, Specialist |
| GET | `/organization/my-organization/families` | List families of current org | Org Leader |
| GET | `/organization/my-organization/children` | List all children in current org | Org Leader, Specialist |
| GET | `/organization/my-organization/invitations` | List pending invitations | Org Leader |
| POST | `/organization/my-organization/staff/invite` | Invite specialist by email | Org Leader |
| POST | `/organization/my-organization/staff/create` | Create specialist account directly | Org Leader |
| PATCH | `/organization/my-organization/staff/:id` | Update staff member | Org Leader |
| DELETE | `/organization/my-organization/staff/:id` | Remove staff member | Org Leader |
| POST | `/organization/my-organization/families/invite` | Invite family by email | Org Leader |
| POST | `/organization/my-organization/families/create` | Create family account directly | Org Leader |
| PATCH | `/organization/my-organization/families/:id` | Update family | Org Leader |
| DELETE | `/organization/my-organization/families/:id` | Delete family | Org Leader |
| PATCH | `/organization/my-organization/families/:id/children/:cid` | Update child | Org Leader |
| DELETE | `/organization/my-organization/families/:id/children/:cid` | Delete child | Org Leader |
| DELETE | `/organization/my-organization/invitations/:id` | Cancel invitation | Org Leader |
| POST | `/organization/rne/verify` | Submit RNE cert PDF for AI verification | Org Leader |
| POST | `/organization/rne/verify/initiate-call` | Start a Jitsi verification call | Org Leader |

### Children (`/children`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/children/specialist/my-children` | Children assigned to current specialist | Specialist |
| POST | `/children/specialist/add-family` | Link a child/family to specialist | Specialist |

### Specialized Plans (`/specialized-plans`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/specialized-plans/my-plans` | Plans created by current specialist | Specialist |
| POST | `/specialized-plans` | Create a plan (PECS/TEACCH/Activity/Skill) | Specialist |
| DELETE | `/specialized-plans/:id` | Delete a plan | Specialist |
| POST | `/specialized-plans/upload-image` | Upload a PECS card image to Cloudinary | Specialist |

### Progress AI (`/progress-ai`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/progress-ai/activity-suggestions` | AI activity suggestions for specialist | Specialist |
| GET | `/progress-ai/child/:childId/recommendations` | AI recommendations for a child (Gemini 1.5) | Specialist |
| POST | `/progress-ai/recommendations/:id/feedback` | Submit thumbs-up/down feedback on a recommendation | Specialist |
| GET | `/progress-ai/org/specialist/:id/summary` | Specialist performance summary for org leader | Org Leader |

### OrgScan AI (`/org-scan-ai`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/org-scan-ai/health` | Check AI fraud detection service health | Admin |
| POST | `/org-scan-ai/rescan/:orgId` | Re-run AI certificate fraud scan for an org | Admin |

### Training Courses (`/training`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/training/admin/courses` | List all training courses | Admin |
| PATCH | `/training/admin/courses/:id/approve` | Approve/reject a training course | Admin |

### Volunteers (`/volunteers`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | `/volunteers/applications?status=...` | List caregiver volunteer applications | Admin |
| PATCH | `/volunteers/applications/:id/review` | Approve or deny a volunteer application | Admin |

### Bulk Import (`/import`)

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | `/import/preview/:orgId/:type` | Preview a CSV/XLSX import (families or staff) | Org Leader |
| POST | `/import/execute/:orgId/:type` | Execute a validated bulk import | Org Leader |

### System Health Probes

`AdminSystemHealth` probes multiple backend endpoints to display real-time uptime status. Any endpoint can be called unauthenticated (for health checks) or authenticated (for secured probes).

---

## 8. Internationalization (i18n)

**Framework:** `i18next` + `react-i18next`  
**Languages:** English (`en`), French (`fr`), Arabic (`ar`)  
**RTL support:** Full — Arabic triggers `dir="rtl"` on `<html>` via `App.jsx` language listener

### Translation Files

Located in `src/locales/`. Each file has ~1625 lines / ~500+ keys organized by section:

```
common.*          Shared labels (logout, save, cancel, loading…)
landing.*         Landing page (nav, hero, stats, features, steps)
adminLayout.*     Admin sidebar navigation labels
adminOverview.*   Overview page cards and stats
adminUsers.*      User management table + forms
adminOrganizations.*  Org management
adminFamilies.*   Family and child management
adminFraudReview.*  Certificate fraud review UI
adminTrainingCourses.* Training course approval
adminCaregiverApplications.* Volunteer review
adminAnalytics.*  Charts, filters, role labels
adminSystemHealth.* Health dashboard
orgDashboard.*    Org leader dashboard
specialistDashboard.* Specialist dashboard
pecsCreator.*     PECS board creator
teachCreator.*    TEACCH tracker creator
skillTracker.*    Skill tracker creator
progressAI.*      AI recommendations page
orgSpecialist.*   Specialist detail page (org leader view)
settings.*        Settings page (profile + password)
notFound.*        404 page
pwa.*             PWA offline banner and update prompt
roles.*           User role display names
dashboard.*       Generic dashboard labels
```

### Language Detection

`i18next-browser-languagedetector` auto-detects language from browser settings on first visit and stores preference in `localStorage`. Manual switching via `<LanguageSwitcher />` updates both i18next and the HTML `dir`/`lang` attributes instantly.

---

## 9. SEO Architecture

Since CogniCare is a React SPA (not server-side rendered), SEO is achieved through two complementary layers:

### Layer 1: Dynamic Meta Tags (Client-side, via react-helmet-async)

**`src/components/SEOHead.jsx`** — Renders to `<head>` via `HelmetProvider`:

- `<title>Page Name | CogniCare</title>`
- `<meta name="description" …>`
- `<link rel="canonical" …>`
- **Open Graph** (12 tags: site_name, title, description, type, url, image + dimensions, locale with alternates)
- **Twitter Card** (4 tags: card type, title, description, image)
- **Schema.org JSON-LD** (optional, injected as `<script type="application/ld+json">`)
- `<meta name="robots" content="noindex,nofollow">` on protected dashboard pages

| Route | noindex | JSON-LD Schema |
|---|---|---|
| `/` (LandingPage) | No | `Organization` + `WebApplication` |
| `/admin/login` | No | — |
| `/org/login` | No | — |
| `/specialist/login` | No | — |
| `/confirm-account` | Yes | — |
| `*` (NotFound) | Yes | — |
| `/admin/dashboard/*` | Yes | — |
| `/org/dashboard/*` | Yes | — |
| `/specialist/dashboard/*` | Yes | — |

### Layer 2: Build-time Pre-rendering (`scripts/prerender-routes.mjs`)

Runs automatically after `vite build`. For each public route, copies `dist/index.html` and injects:
- Correct `<title>` and `<meta description>`
- All Open Graph + Twitter Card tags
- Canonical URL
- Schema.org JSON-LD (for the landing page)
- `<noscript>` fallback text for crawlers that don't execute JavaScript

Output directories (static HTML for bots):
```
dist/index.html             → https://cognicare.app/
dist/admin/login/index.html → https://cognicare.app/admin/login
dist/org/login/index.html   → https://cognicare.app/org/login
dist/specialist/login/index.html → https://cognicare.app/specialist/login
```

### Crawler Files

| File | Purpose |
|---|---|
| `public/robots.txt` | Allows `/`, `/*/login`; blocks all dashboard routes and `/api/` |
| `public/sitemap.xml` | Lists 4 public URLs with priority weights |

### Performance Hints (index.html)

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="dns-prefetch" href="https://fonts.googleapis.com" />
<link rel="dns-prefetch" href="https://fonts.gstatic.com" />
```

---

## 10. Performance Monitoring

**`src/utils/performanceMonitor.js`** — Tracks every API call made through `authFetch`.

### Recorded Metrics (per request)

| Field | Description |
|---|---|
| `role` | Which dashboard role made the request |
| `method` | HTTP method (GET, POST, etc.) |
| `path` | API path called |
| `status` | HTTP response status code |
| `ok` | Whether the request succeeded |
| `retried` | Whether automatic token refresh was triggered |
| `durationMs` | End-to-end latency in milliseconds |
| `route` | Browser URL at time of request |
| `correlationId` | UUID for request tracing (`X-Correlation-Id` header) |
| `error` | Error message if request threw |

- **Ring buffer:** Last 500 requests kept (oldest dropped automatically)
- **Subscribers:** `AdminSystemHealth` subscribes to live metric updates via `subscribeToApiMetrics()`
- **Display:** The Admin System Health page shows real-time P50/P95 latency percentiles, error rates, retry rates, and component-level breakdowns across a configurable time window (1 min, 5 min, 30 min, 1 hour)

---

## 11. Environment Variables

Create a `.env` file in `Cognicare_Web_Dashboard/` (never commit to git):

```env
# URL of the NestJS backend (no trailing slash)
VITE_BACKEND_ORIGIN=http://localhost:3000
```

### How the URL is resolved

| Environment | `VITE_BACKEND_ORIGIN` set? | API calls go to |
|---|---|---|
| Dev (`npm run dev`) | Any | `/api/v1/*` → proxied by Vite to `:3000` |
| Production build | Yes | `https://<your-backend>/api/v1/*` |
| Production build | No | Falls back to `http://localhost:3000/api/v1/*` ⚠️ |

### Build Commands

```bash
npm run dev               # Start dev server on :5173
npm run build             # Vite build + PWA generation + SEO pre-rendering
npm run build:no-prerender  # Vite + PWA only (skip pre-render)
npm run preview           # Serve dist/ locally (test PWA)
npm run lint              # ESLint
```
