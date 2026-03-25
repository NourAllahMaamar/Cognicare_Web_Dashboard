# Data flow — `cognicareweb/`

## User input → React → API

```mermaid
sequenceDiagram
  participant U as User
  participant P as Page component
  participant H as useAuth
  participant V as Vite proxy (dev)
  participant A as CogniCare API

  U->>P: click / submit
  P->>H: authGet / authMutate / authFetch
  H->>H: read token from localStorage
  alt dev
    H->>V: fetch /api/v1/...
    V->>A: forward to VITE_BACKEND_ORIGIN
  else prod
    H->>A: fetch BACKEND_ORIGIN/api/v1/...
  end
  A-->>H: JSON
  H-->>P: data or throw
  P-->>U: UI update
```

## Login / refresh

1. User submits credentials → `fetch(API_BASE_URL + '/auth/login')`.
2. Store `accessToken`, `refreshToken`, user JSON in **role-specific** keys (`useAuth.js`).
3. On **401**, `authFetch` calls `POST /auth/refresh`, updates tokens, retries once.

## Uploads / images

`getUploadUrl()` in `config.js` prefixes relative paths with `BACKEND_ORIGIN` in production so `<img src>` loads from API host.

## No local database

All reads/writes persist only after API calls succeed.

## Caching

- `authGet` uses in-memory Map + TTL (`useAuth.js`).
- `cachedGet` in `apiClient.js` — used by **legacy** `*_OLD` pages **inferred**; current pages prefer `authGet`.

## External services

This SPA does not call PayPal/Cloudinary directly for server operations — those are API-side. Browser may open PayPal in flows initiated from **Flutter**; web admin flows **needs verification**.
