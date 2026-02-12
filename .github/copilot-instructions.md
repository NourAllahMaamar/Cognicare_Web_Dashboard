# CogniCare Web Dashboard AI Agent Instructions

## Project Overview

React + Vite landing page for CogniCare - a cognitive health platform. This web app serves multiple purposes:
1. **Marketing/introduction site** for normal users (families)
2. **Admin dashboard** for platform administrators (full user CRUD)
3. **Organization leader dashboard** for managing staff within an organization

The Flutter mobile app and NestJS backend live in sibling `cognicare-mobile/` directory.

## Architecture & Structure

- **Framework**: React 19 + Vite 7 (ES modules, hot reload)
- **Entry**: [index.html](../index.html) → [src/main.jsx](../src/main.jsx) → [src/App.jsx](../src/App.jsx)
- **Routes**:
  - `/` - Marketing home page ([Home.jsx](../src/pages/Home.jsx))
  - `/admin/login` - Admin login ([AdminLogin.jsx](../src/pages/AdminLogin.jsx))
  - `/admin/dashboard` - Admin dashboard ([AdminDashboard.jsx](../src/pages/AdminDashboard.jsx))
  - `/org/login` - Organization leader login ([OrgLeaderLogin.jsx](../src/pages/OrgLeaderLogin.jsx))
  - `/org/dashboard` - Organization leader dashboard ([OrgLeaderDashboard.jsx](../src/pages/OrgLeaderDashboard.jsx))
- **Components**: `src/components/Grainient.jsx` - WebGL animated gradient background using OGL library
- **Styling**: CSS per-component (e.g., `Home.css`, `Grainient.css`) + global `App.css`, `index.css`

### Key Architectural Decisions

**Why OGL instead of Three.js?** Grainient uses OGL (lightweight WebGL library) for performance - it's ~10x smaller than Three.js for shader-based effects. The component renders a fullscreen triangle with GLSL fragment shader for animated gradient.

**Fixed background pattern**: Grainient is positioned `fixed` with `z-index: -1` in Home.css, allowing content to scroll over it. This differs from typical component composition - the background is part of the page, not a separate layout layer.

## Critical Developer Workflows

### Starting Development
```bash
npm install       # Install dependencies (React, Vite, OGL)
npm run dev       # Start Vite dev server at http://localhost:5173
npm run build     # Production build to dist/
npm run preview   # Preview production build
```

**Important**: OGL dependency (`^1.0.11`) must be installed before running dev server - Grainient will fail without it.

### Environment Setup

No `.env` file required for marketing pages. For dashboard features (admin/org leader), backend must be running.

**Backend connection** (for dashboards):
- Base URL: `http://localhost:3000/api/v1`
- Admin endpoints: `/users`, `/auth/login`
- Organization endpoints: `/organization/:orgId/staff`

If adding environment variables:
```env
VITE_API_URL=http://localhost:3000/api/v1  # CogniCare backend
```

Vite exposes env vars via `import.meta.env.VITE_*` pattern.

## Project-Specific Conventions

### Component Patterns

1. **Grainient component** ([src/components/Grainient.jsx](../src/components/Grainient.jsx)):
   - WebGL2 context required (won't run on old browsers)
   - All shader uniforms passed as props (23 customizable parameters)
   - Uses `useEffect` with cleanup to manage WebGL context lifecycle
   - ResizeObserver for responsive canvas sizing
   - Color props are hex strings (`#FF9FFC`) converted to RGB via `hexToRgb` helper
   - Animation loop runs via `requestAnimationFrame` - **never** use `setInterval` for WebGL

2. **Page component pattern** ([src/pages/Home.jsx](../src/pages/Home.jsx)):
   - Wraps entire page in `.home-page` container
   - Grainient background first, then `.home-content` wrapper
   - All sections use glass-morphism: `background: rgba(255,255,255,0.08)`, `backdrop-filter: blur(10px)`
   - Semantic HTML5 sections: `<header>`, `<section>`, `<footer>`

3. **Dashboard authentication pattern** ([AdminLogin.jsx](../src/pages/AdminLogin.jsx), [OrgLeaderLogin.jsx](../src/pages/OrgLeaderLogin.jsx)):
   - POST to `/api/v1/auth/login` with email/password
   - Validate user role (`'admin'` or `'organization_leader'`)
   - Store JWT in `localStorage` (`adminToken` or `orgLeaderToken`)
   - Store user object in `localStorage` (`adminUser` or `orgLeaderUser`)
   - Redirect to respective dashboard

4. **Organization staff management pattern** ([OrgLeaderDashboard.jsx](../src/pages/org-leader/OrgLeaderDashboard.jsx)):
   - Fetch staff: `GET /api/v1/organization/:orgId/staff`
   - Add staff: `POST /api/v1/organization/:orgId/staff` with `{ email }`
   - Create staff: `POST /api/v1/organization/my-organization/staff/create` with full user data
   - Update staff: `PATCH /api/v1/organization/my-organization/staff/:staffId` with `{ fullName, email, phone, role }`
   - Remove staff: `DELETE /api/v1/organization/my-organization/staff/:staffId`
   - **Family management**:
     - Fetch: `GET /api/v1/organization/:orgId/families`
     - Add: `POST /api/v1/organization/:orgId/families` with `{ email }`
     - Create: `POST /api/v1/organization/my-organization/families/create` with full user data + optional children array
     - Update: `PATCH /api/v1/organization/my-organization/families/:familyId` with `{ fullName, email, phone }`
     - Remove: `DELETE /api/v1/organization/my-organization/families/:familyId`
   - **Children management**:
     - Fetch: `GET /api/v1/organization/:orgId/children`
     - Add to family: `POST /api/v1/organization/my-organization/families/:familyId/children`
     - Update: `PATCH /api/v1/organization/my-organization/families/:familyId/children/:childId`
     - Delete: `DELETE /api/v1/organization/my-organization/families/:familyId/children/:childId`
   - All endpoints require `Authorization: Bearer <token>` header
   - **Modal modes**: Three states (`'add'`, `'create'`, `'edit'`) managed via `staffModalMode` / `familyModalMode`
   - **Edit pattern**: Click edit button → Modal opens with pre-filled data → Password field optional → Submit calls PATCH endpoint
   - **CSS**: Edit buttons use `.action-button.edit` with blue hover color (`rgba(59, 130, 246, 0.2)`)

### Styling Conventions

1. **Glass-morphism theme**:
   - Semi-transparent white overlays on gradient background
   - Standard pattern: `background: rgba(255,255,255,0.08)`, `border: 1px solid rgba(255,255,255,0.1)`, `backdrop-filter: blur(10px)`
   - Hover states increase opacity to `0.12` and add `translateY(-5px)`

2. **Responsive design**:
   - Mobile-first grid with `grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))`
   - Media query breakpoint at `768px` for mobile
   - Flexbox switches to `flex-direction: column` on mobile

3. **Color palette** (from Grainient defaults):
   - Primary gradient: `#FF9FFC` (lavender), `#5227FF` (purple), `#B19EEF` (light purple)
   - Text: White with varying opacity (`rgba(255,255,255,0.9)` for body, `1` for headings)

### Content & Messaging

**Target audiences**: 
1. Normal users (families seeking cognitive health tools) - Marketing pages
2. Platform admins - Full user management
3. Organization leaders - Staff management within their organization

Key messaging points from [src/about_our_app](../src/about_our_app):
- Multi-language support (English, French, Arabic with RTL)
- Cross-platform availability (iOS, Android, Web)
- Secure JWT authentication
- Family-friendly health management
- Material Design 3 UI

**Download section**: Currently placeholder buttons - integrate with actual app store links when mobile apps are published.

## Integration Points

### Backend Integration

**Marketing pages**: No backend required (static content).

**Dashboards**: Integrate with `cognicare-mobile/backend`:
- Base URL: `http://localhost:3000/api/v1` (development)
- Authentication: JWT Bearer tokens
- **Admin endpoints**:
  - `POST /auth/login` - Login (validate `role === 'admin'`)
  - `GET /users` - List all users
  - `POST /users` - Create user
  - `PATCH /users/:id` - Update user
  - `DELETE /users/:id` - Delete user
- **Organization leader endpoints**:
  - `POST /auth/login` - Login (validate `role === 'organization_leader'`)
  - `GET /organization/:orgId/staff` - List staff members
  - `POST /organization/:orgId/staff` - Add staff member (body: `{ email }`)
  - `DELETE /organization/:orgId/staff/:staffId` - Remove staff member

### Related Projects

- **Mobile app**: `cognicare-mobile/frontend/` - Flutter app (see [cognicare-mobile/.github/copilot-instructions.md](../cognicare-mobile/.github/copilot-instructions.md))
- **Backend API**: `cognicare-mobile/backend/` - NestJS REST API with MongoDB

## Common Tasks & Examples

### Adding a new section to Home page
```jsx
<section className="new-section" id="section-name">
  <div className="section-content">
    <h2 className="section-title">Section Title</h2>
    {/* Content */}
  </div>
</section>
```

Corresponding CSS:
```css
.new-section {
  padding: 5rem 3rem;
  max-width: 1200px;
  margin: 0 auto;
}

.section-content {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  padding: 3rem;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Customizing Grainient colors

Edit props in [src/pages/Home.jsx](../src/pages/Home.jsx#L7-L29):
```jsx
<Grainient
  color1="#your-hex"  // Lavender
  color2="#your-hex"  // Purple
  color3="#your-hex"  // Light purple
  // ... other props
/>
```

### Building for production

```bash
npm run build          # Outputs to dist/
npm run preview        # Test production build locally
```

Deployment: Upload `dist/` folder to static hosting (Netlify, Vercel, GitHub Pages). No server-side rendering required.
