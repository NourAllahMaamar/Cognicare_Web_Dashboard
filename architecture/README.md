# Cognicare web — architecture documentation

This folder holds **stable reference** for developers and agents working on `cognicareweb`. Session-specific test reports and bilans live in [`bilan/`](bilan/).

## Quick start

```bash
cd cognicareweb
npm install
npm run dev
```

Default dev URL: `http://localhost:5173` (Vite). The API is proxied — see [API-AND-ENV.md](API-AND-ENV.md).

## Documents

| File | Contents |
|------|----------|
| [STACK-AND-CONVENTIONS.md](STACK-AND-CONVENTIONS.md) | Stack, scripts, lazy loading, i18n/RTL |
| [ROUTES-AND-ROLES.md](ROUTES-AND-ROLES.md) | URL map and role → pages |
| [API-AND-ENV.md](API-AND-ENV.md) | `API_BASE_URL`, Vite proxy, env vars |
| **Mobile (Flutter)** | API origin is **not** in this repo — see [`../../project-architecture/MOBILE_API_ORIGINS.md`](../../project-architecture/MOBILE_API_ORIGINS.md) |
| [bilan/](bilan/) | Dated QA / action reports (bilan); e.g. [2026-03-24-mcp-smoke.md](bilan/2026-03-24-mcp-smoke.md), [2026-03-24-mcp-full-regression.md](bilan/2026-03-24-mcp-full-regression.md) (authenticated full pass) |

## Related code

- Routes: [`../src/App.jsx`](../src/App.jsx)
- API config: [`../src/config.js`](../src/config.js)
- Vite proxy: [`../vite.config.js`](../vite.config.js)
