# 2026-03-26 — V1 web + API release check

## Scope

Release-readiness verification for `cognicareweb` routes and shared backend role/permission contracts consumed by web.

## MCP execution method

- Web UI testing executed through `user-cursor-ide-browser` MCP tools.
- Login and route checks were performed with credentialed sessions and direct protected-route navigation assertions.

## Web validation status

- `npm run lint` passed.
- `npm run build` passed.
- Specialist route guards remain enforced for specialist tool routes.
- Org and specialist layout role checks remain present.

## Web role-route checks completed with MCP

- Admin:
  - login success
  - dashboard + users + reviews + system-health routes reachable with admin session
  - unauthorized access redirect to `/admin/login` when admin token removed
- Organization leader:
  - login success
  - `/org/dashboard`, `/org/dashboard/children`, `/org/dashboard/invitations` reachable
- Specialist:
  - login success
  - specialist tool routes reachable with specialist session
  - direct access to specialist tool routes redirects to `/specialist/login` when specialist token removed
- Cross-role boundary continuation:
  - with active org leader session and cleared admin keys, `/admin/dashboard` redirects to `/admin/login` (guard still enforced)
  - role sessions are namespace-separated in localStorage; parallel role sessions in one browser profile are possible by design unless cleared

Detailed per-route button/function coverage is recorded in:

- `architecture/bilan/2026-03-26-v1-web-role-button-matrix.md`

## Cross-surface API contract checks (web-critical)

- Admin endpoints:
  - pending org requests: success with admin token
  - reviewed org requests: success with admin token
- Org leader endpoints:
  - `my-organization`: success with org leader token
  - `my-organization/staff`: success with org leader token
- Role boundary:
  - family token denied on admin pending endpoint (403 expected)

### Same-day scripted API rerun (credentialed)

Using direct backend calls (`/api/v1`) with known admin/org/specialist credentials:

- Auth login returned `200` with access tokens for admin, org leader, and specialist users.
- Guard/role contract checks:
  - `/organization/admin/pending-requests`:
    - admin token -> `200`
    - org token -> `403`
    - specialist token -> `403`
  - `/organization/my-organization` (org token) -> `200`
  - `/organization/my-organization/staff` (org token) -> `200`
  - `/children/specialist/my-children`:
    - specialist token -> `200`
    - no token -> `401`
- Discovery endpoints consumed by clients:
  - `/users/healthcare` (specialist token) -> `200`
  - `/users/volunteers` (specialist token) -> `200`

## Communication checks

- Family-specialist conversation path verified:
  - get/create thread by participant
  - send messages both directions
  - read message list success

## Data exposure checks

- Healthcare discovery endpoint returns data without sensitive fields (`email`, `phone`, `password`, `passwordHash`).
- Caregiver discovery endpoint returns successful list for family flow.

## Notes

- Account role mapping remains as currently stored in DB for this cycle by explicit owner instruction.
- Remaining release risk is primarily manual acceptance breadth (extended browser session aging and full invitation email lifecycle), not current lint/build or role-guard breakage.
