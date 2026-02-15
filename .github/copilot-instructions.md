# CogniCare Web Dashboard - AI Agent Instructions

## Project Overview

React-based public marketing website and admin portal for CogniCare platform:
- **Public Landing Page**: Marketing site with WebGL animated gradient background
- **Admin Dashboard**: JWT-authenticated CRUD interface for user management
- **Organization Leader Dashboard**: JWT-authenticated staff management interface

**Critical**: See root [`.github/copilot-instructions.md`](../../.github/copilot-instructions.md) for workspace-wide architecture, backend integration, and multi-tenancy model.

## Technology Stack

- **React**: 19.2.0 (new JSX transform - no `import React` needed)
- **Vite**: 7.2.4 (dev server, HMR, production build)
- **Routing**: react-router-dom 7.13.0 (BrowserRouter)
- **i18n**: react-i18next 16.5.4 + i18next-browser-languagedetector
- **WebGL**: OGL 1.0.11 (lighter than Three.js)
- **Styling**: Pure CSS with CSS variables, glass-morphism effects

**No state management library**: Uses React hooks (useState, useEffect) and component-level state.

**No validation library**: Inline validation before API calls.

## Architecture Patterns

### Project Structure

```
src/
├── main.jsx                 # Entry point, i18n init
├── App.jsx                  # Router setup, RTL handling
├── config.js                # API base URL (single source of truth)
├── i18n.js                  # i18next configuration
├── components/              # Reusable components
│   ├── Grainient.jsx        # WebGL animated gradient (OGL)
│   └── LanguageSwitcher.jsx # Multi-language dropdown
├── pages/                   # Route components
│   ├── home/Home.jsx        # Public landing page
│   ├── admin/               # Admin portal (JWT-protected)
│   │   ├── AdminLogin.jsx
│   │   └── AdminDashboard.jsx
│   └── org-leader/          # Org leader portal (JWT-protected)
│       ├── OrgLeaderLogin.jsx
│       └── OrgLeaderDashboard.jsx
└── locales/                 # Translation files (en, fr, ar)
    ├── en.json
    ├── fr.json
    └── ar.json
```

**Key conventions**:
- Each page has its own directory with `.jsx` and `.css` files
- Components follow PascalCase naming
- CSS files match component names (e.g., `Home.jsx` → `Home.css`)
- No TypeScript - pure JavaScript with JSDoc comments where needed

### Routing Pattern

**Simple BrowserRouter** (from [App.jsx](../src/App.jsx)):
```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/org/login" element={<OrgLeaderLogin />} />
        <Route path="/org/dashboard" element={<OrgLeaderDashboard />} />
      </Routes>
    </Router>
  );
}
```

**Navigation**:
```javascript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/admin/dashboard');
```

**No route guards**: Protected routes handle auth check in `useEffect`:
```javascript
useEffect(() => {
  const token = localStorage.getItem('adminToken');
  if (!token) {
    navigate('/admin/login');
  }
}, [navigate]);
```

### API Integration Pattern

**Centralized API URL** (from [config.js](../src/config.js)):
```javascript
export const API_BASE_URL = 'https://cognicare-mobile-h4ct.onrender.com/api/v1';
```

**For local development**: Change to `http://localhost:3000/api/v1`

**Standard fetch pattern** (no service layer):
```javascript
import { API_BASE_URL } from '../../config';

// GET with JWT
const response = await fetch(`${API_BASE_URL}/users`, {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
    'Content-Type': 'application/json',
  },
});

if (response.ok) {
  const data = await response.json();
  setUsers(data);  // Backend wraps in { data: ... }
} else if (response.status === 401) {
  // Token expired - try refresh
  const newToken = await refreshAccessToken();
  // Retry request...
} else {
  const error = await response.json();
  setError(error.message || 'Request failed');
}

// POST with body
const response = await fetch(`${API_BASE_URL}/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});
```

**Token refresh pattern** (from [AdminDashboard.jsx](../src/pages/admin/AdminDashboard.jsx)):
```javascript
const refreshAccessToken = async () => {
  const refreshToken = localStorage.getItem('adminRefreshToken');
  if (!refreshToken) {
    handleSessionExpired();
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (response.ok) {
    const data = await response.json();
    localStorage.setItem('adminToken', data.accessToken);
    if (data.refreshToken) {
      localStorage.setItem('adminRefreshToken', data.refreshToken);
    }
    return data.accessToken;
  } else {
    handleSessionExpired();  // Clear tokens, redirect to login
    return null;
  }
};
```

**Security note**: Tokens stored in `localStorage` (XSS vulnerable). For production, consider migrating to `httpOnly` cookies.

### Internationalization (i18n)

**Configuration** (from [i18n.js](../src/i18n.js)):
```javascript
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)  // Auto-detect from browser/localStorage
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      fr: { translation: fr },
      ar: { translation: ar }
    },
    fallbackLng: 'en',
    detection: {
      order: ['localStorage', 'navigator'],  // Check localStorage first
      caches: ['localStorage']               // Persist selection
    }
  });
```

**Translation files** (JSON, dot notation keys):
```json
// locales/en.json
{
  "nav": {
    "home": "Home",
    "about": "About Us",
    "contact": "Contact"
  },
  "hero": {
    "title": "Welcome to CogniCare",
    "subtitle": "Supporting cognitive health together"
  }
}
```

**Using translations**:
```javascript
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('hero.title')}</h1>
      <p>{t('hero.subtitle')}</p>
    </div>
  );
}
```

**RTL Support** (from [App.jsx](../src/App.jsx)):
```javascript
useEffect(() => {
  const handleLanguageChange = (lng) => {
    if (lng === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', lng);
    }
  };

  i18n.on('languageChanged', handleLanguageChange);
  return () => i18n.off('languageChanged', handleLanguageChange);
}, [i18n]);
```

**RTL CSS patterns**:
```css
/* Default LTR */
.element {
  margin-left: 20px;
  text-align: left;
}

/* RTL override */
[dir="rtl"] .element {
  margin-left: 0;
  margin-right: 20px;
  text-align: right;
}
```

**Language switcher component** (from [LanguageSwitcher.jsx](../src/components/LanguageSwitcher.jsx)):
```javascript
const changeLanguage = (lng) => {
  i18n.changeLanguage(lng);  // i18next handles localStorage persistence
  
  // Manually update HTML attributes for RTL
  if (lng === 'ar') {
    document.documentElement.setAttribute('dir', 'rtl');
    document.documentElement.setAttribute('lang', 'ar');
  } else {
    document.documentElement.setAttribute('dir', 'ltr');
    document.documentElement.setAttribute('lang', lng);
  }
};
```

### WebGL Background Pattern (OGL)

**Grainient component** (from [Grainient.jsx](../src/components/Grainient.jsx)):
```javascript
import { Renderer, Program, Mesh, Triangle } from 'ogl';

const Grainient = ({ color1, color2, color3, /* ...props */ }) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const renderer = new Renderer({
      webgl: 2,
      alpha: true,
      antialias: false,
      dpr: Math.min(window.devicePixelRatio || 1, 2)  // Limit pixel ratio for performance
    });

    const gl = renderer.gl;
    const canvas = gl.canvas;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    containerRef.current.appendChild(canvas);

    // Create fullscreen triangle geometry
    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        iResolution: { value: [0, 0] },
        iTime: { value: 0 },
        uColor1: { value: hexToRgb(color1) },
        uColor2: { value: hexToRgb(color2) },
        uColor3: { value: hexToRgb(color3) },
        // ...other uniforms
      }
    });

    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      renderer.setSize(container.offsetWidth, container.offsetHeight);
      program.uniforms.iResolution.value = [gl.canvas.width, gl.canvas.height];
    };

    window.addEventListener('resize', resize);
    resize();

    // Animation loop
    let startTime = Date.now();
    const animate = () => {
      requestAnimationFrame(animate);
      const elapsed = (Date.now() - startTime) / 1000;
      program.uniforms.iTime.value = elapsed;
      renderer.render({ scene: mesh });
    };
    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resize);
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      geometry.gl = null;
      program.gl = null;
      renderer.gl = null;
    };
  }, [color1, color2, color3]);  // Re-initialize on color changes

  return <div ref={containerRef} className="grainient-container" />;
};
```

**Why OGL over Three.js**: Lighter bundle size (~50KB vs ~600KB), WebGL2-first API, perfect for shader-based effects.

**Critical**: Always cleanup WebGL resources in `useEffect` return function to prevent memory leaks.

## Styling Patterns

### CSS Variables (Glass-morphism theme)

**Global variables** (from [index.css](../src/index.css)):
```css
:root {
  /* Glass-morphism colors */
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-border: rgba(255, 255, 255, 0.2);
  --glass-shadow: rgba(0, 0, 0, 0.1);
  
  /* Accent colors */
  --primary: #5227FF;
  --secondary: #FF9FFC;
  
  /* Text */
  --text-primary: #333;
  --text-secondary: #666;
}

/* Dark mode override (if needed) */
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #fff;
    --text-secondary: #ccc;
  }
}
```

**Glass-morphism card pattern**:
```css
.glass-card {
  background: var(--glass-bg);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);  /* Safari support */
  border: 1px solid var(--glass-border);
  border-radius: 16px;
  box-shadow: 0 8px 32px var(--glass-shadow);
}
```

**RTL-aware spacing**:
```css
.card {
  padding: 20px;
  margin-inline-start: 10px;  /* Auto-flips for RTL */
  margin-inline-end: 20px;
}

/* Or use logical properties */
.element {
  padding-inline: 20px;  /* left + right in LTR, flips in RTL */
  padding-block: 10px;   /* top + bottom */
}
```

### Component-Scoped CSS

**Each component has its own CSS file**:
```
Home.jsx → Home.css
AdminDashboard.jsx → AdminDashboard.css
```

**Import pattern**:
```javascript
import './Home.css';  // Relative path from component
```

**Avoiding CSS conflicts**: Use descriptive class names:
```css
/* ❌ Too generic */
.card { }
.button { }

/* ✅ Component-prefixed */
.home-hero-card { }
.admin-dashboard-table { }
```

## Critical Development Workflows

### Starting Development

```bash
cd Cognicare_Web_Dashboard
npm install
npm run dev  # Starts Vite dev server at http://localhost:5173
```

**With backend** (for admin/org leader dashboards):
```bash
# Terminal 1: Backend
cd ../cognicare-mobile/backend
npm run start:dev

# Terminal 2: Web Dashboard
cd Cognicare_Web_Dashboard
npm run dev
```

**Update config for local dev**:
```javascript
// src/config.js
export const API_BASE_URL = 'http://localhost:3000/api/v1';
```

### Building for Production

```bash
npm run build       # Outputs to dist/
npm run preview     # Preview production build locally
```

**Deploy**: Upload `dist/` folder to static host (Netlify, Vercel, GitHub Pages, etc.)

**Environment-specific API URL**: Use Vite env vars:
```javascript
// src/config.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://cognicare-mobile-h4ct.onrender.com/api/v1';
```

```bash
# .env.production
VITE_API_URL=https://cognicare-mobile-h4ct.onrender.com/api/v1

# .env.development
VITE_API_URL=http://localhost:3000/api/v1
```

### Debugging

**Browser DevTools**:
- React DevTools extension for component inspection
- Network tab for API calls (check Authorization header)
- Console for i18next debug logs (`debug: true` in i18n.js)

**Common issues**:
- CORS errors → Backend must include web dashboard origin in CORS config
- 401 Unauthorized → Token expired, check refresh token flow
- Translation missing → Check key exists in all locale files (en, fr, ar)
- RTL layout broken → Ensure `[dir="rtl"]` CSS rules defined

## Common Tasks

### Adding a New Translation

1. Add key to all locale files:
```json
// locales/en.json
{ "newSection": { "title": "New Title" } }

// locales/fr.json
{ "newSection": { "title": "Nouveau titre" } }

// locales/ar.json
{ "newSection": { "title": "عنوان جديد" } }
```

2. Use in component:
```javascript
const { t } = useTranslation();
<h1>{t('newSection.title')}</h1>
```

### Adding a New Route

1. Create page component:
```javascript
// src/pages/new-feature/NewFeature.jsx
export default function NewFeature() {
  return <div>New Feature</div>;
}
```

2. Add route in App.jsx:
```javascript
<Route path="/new-feature" element={<NewFeature />} />
```

### Adding a New Admin API Call

**Pattern** (inline in component, no service layer):
```javascript
const fetchNewData = async () => {
  const token = localStorage.getItem('adminToken');
  try {
    const response = await fetch(`${API_BASE_URL}/new-endpoint`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      setData(data);
    } else if (response.status === 401) {
      const newToken = await refreshAccessToken();
      if (newToken) {
        // Retry with new token...
      }
    }
  } catch (error) {
    console.error('Fetch error:', error);
    setError(error.message);
  }
};
```

### Customizing WebGL Background

**Adjust colors** (in Home.jsx or wherever Grainient is used):
```javascript
<Grainient
  color1="#FF9FFC"  // Lavender
  color2="#5227FF"  // Purple
  color3="#B19EEF"  // Light purple
  timeSpeed={0.25}  // Animation speed
  warpStrength={1.0}
  contrast={1.5}
  saturation={1.0}
/>
```

**Performance tuning**:
- Reduce `dpr` (device pixel ratio) for lower-end devices
- Increase `grainScale` to reduce grain density
- Set `grainAnimated={false}` to disable grain animation

## Key Files Reference

- [main.jsx](../src/main.jsx) - Entry point, i18n initialization
- [App.jsx](../src/App.jsx) - Router, RTL handling, language change listener
- [config.js](../src/config.js) - **API base URL (single source of truth)**
- [i18n.js](../src/i18n.js) - i18next configuration, language detection
- [Grainient.jsx](../src/components/Grainient.jsx) - OGL WebGL animated background
- [LanguageSwitcher.jsx](../src/components/LanguageSwitcher.jsx) - Language dropdown with RTL support
- [AdminDashboard.jsx](../src/pages/admin/AdminDashboard.jsx) - Admin portal, token refresh pattern
- [OrgLeaderDashboard.jsx](../src/pages/org-leader/OrgLeaderDashboard.jsx) - Org leader staff management
- [Home.jsx](../src/pages/home/Home.jsx) - Public landing page

## Gotchas & Anti-Patterns

1. **React 19 - No React import needed**: Modern JSX transform handles it automatically. Remove `import React from 'react'` from new files.

2. **localStorage JWT storage**: XSS vulnerable. For production, migrate to `httpOnly` cookies or consider IndexedDB for refresh tokens.

3. **No service layer**: API calls directly in components. For larger projects, consider extracting to `src/services/api.js`.

4. **Token refresh timing**: Implement proactive refresh before expiration rather than reactive (on 401). Access tokens expire in 15 minutes.

5. **RTL CSS**: Always test with Arabic language. Common issues: fixed `left/right` instead of logical properties, absolute positioning, flexbox direction.

6. **Translation key naming**: Use dot notation (`nav.home`), not nested objects. Easier to search and refactor.

7. **WebGL memory leaks**: Always cleanup OGL resources in `useEffect` return function. Watch for orphaned canvas elements.

8. **CORS in development**: Backend allows `localhost:5173` (Vite default). If changing dev port, update backend CORS config.

9. **API URL hardcoding**: Always use `API_BASE_URL` from config.js. Never hardcode `localhost:3000` in components.

10. **Production build verification**: Test `npm run build && npm run preview` before deploying. Vite production mode may expose issues not visible in dev.
