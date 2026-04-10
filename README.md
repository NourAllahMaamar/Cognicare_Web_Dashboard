# CogniCare Web Dashboard

A React-based admin and specialist dashboard for the CogniCare healthcare platform.

## Overview

The CogniCare Web Dashboard provides role-based interfaces for managing healthcare operations:

- **Admin Dashboard**: User management, organization approval, fraud detection, analytics
- **Specialist Portal**: Child progress tracking, AI recommendations, treatment plans
- **Organization Leader**: Staff management, family invitations, reporting
- **Family Portal**: Child profiles, appointments, progress viewing

## Tech Stack

- **React 19** with Vite build system
- **TailwindCSS** for styling
- **i18next** for internationalization (English/French/Arabic)
- **React Router** for navigation
- **Lucide React** for icons

## Project Structure

```
cognicareweb/
├── src/
│   ├── components/        # Reusable UI components
│   ├── pages/            # Role-based page components
│   │   ├── admin/        # Admin dashboard pages
│   │   ├── specialist/   # Specialist portal pages
│   │   ├── organization/ # Organization leader pages
│   │   └── family/       # Family portal pages
│   ├── hooks/            # Custom React hooks
│   ├── locales/          # Translation files
│   ├── apiClient.js      # API request utilities
│   ├── config.js         # Environment configuration
│   └── i18n.js           # i18n setup
├── public/               # Static assets
├── index.html
├── package.json
├── vite.config.js
├── eslint.config.js
├── tailwind.config.js
└── AGENTS.md             # AI agent guidance
```

## Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn

### Setup

```bash
cd cognicareweb
cp .env.example .env      # Configure API base URL
npm install
npm run dev               # Start development server
```

### Build for Production

```bash
npm run build
npm run preview           # Preview production build
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Environment Variables

Create a `.env` file:

```env
VITE_BACKEND_ORIGIN=http://localhost:3000
VITE_PUBLIC_SITE_ORIGIN=https://cognicare.app
```

`VITE_BACKEND_ORIGIN` is compiled into the production build and powers all dashboard API calls. The public Android release card on `/` reads `public/mobile-release.json`, so updating the downloadable APK/version does not require editing JSX.

## Role-Based Routing

The dashboard automatically routes users based on their role:

- `/admin/*` - Admin users
- `/specialist/*` - Healthcare specialists
- `/organization/*` - Organization leaders
- `/family/*` - Family members

## API Integration

All API calls use the `useAuth(role)` hook which provides:
- Automatic token injection
- Role-specific base URL handling
- 401 error handling with redirect

Example:
```javascript
const { authGet, authPost } = useAuth('admin');
const users = await authGet('/users');
```

## Internationalization

Translations are in `src/locales/`:
- `en/translation.json` - English
- `fr/translation.json` - French
- `ar/translation.json` - Arabic

## Related Documentation

- [Project Architecture](../project-architecture/) - API docs, security, architecture
- [Full App QA](../full-app-qa-workspace/) - QA reports, test matrices
- [Main CogniCare README](../README.md) - Overall platform overview

## Security Notes

- No PII in console logs
- Token stored in localStorage only
- 401 errors redirect to appropriate login
- Role checks before rendering sensitive data

## License

[LICENSE](../LICENSE)
