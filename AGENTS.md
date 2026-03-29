# Agent guidance — `cognicareweb`

Use this file when working inside `/Users/mac/pim/cognicareweb`.

This repo is the React/Vite staff dashboard for:
- admins
- organization leaders
- specialists

Backend logic lives in [`../cognicare/backend`](../cognicare/backend), which is the **active** API. Do not treat `../cognicare/backend-v2` as the live backend.

## Hard rules

1. **Active backend is `../cognicare/backend`.**
   Verify backend behavior there before changing frontend assumptions.
2. **Do not implement backend behavior in this repo.**
   If the bug is really an API/auth/permission issue, fix it in the backend and then align the web client.
3. **Preserve role-route discipline.**
   Keep admin, org, and specialist flows aligned with real role guards and login behavior.
4. **Do not build symmetry for its own sake.**
   If mobile owns a feature and web does not need a full implementation, do not create one just because the backend supports it.
5. **Keep user-facing flows stable and explicit.**
   For invitations, activation, approval, and role redirects, clarity beats cleverness.

## What this repo owns

- Staff dashboard routes and navigation
- Admin/org/specialist login UX
- Role-based session persistence and refresh behavior
- Web-facing onboarding flows like confirm-account and org signup/login
- Org staff/family management screens
- Environment-driven API origin handling

## Fast routing guide

- **Route/redirect/login storage issue**:
  start in `src/hooks/useAuth.js` and `src/App.jsx`
- **API origin or upload URL issue**:
  start in `src/config.js`
- **Admin/org/specialist page behavior**:
  start in the relevant page under `src/pages/`
- **If the data or permission looks wrong**:
  verify `../cognicare/backend` before patching UI assumptions

## Source-of-truth order

When signals conflict inside this repo, use this order:

1. real backend behavior in `../cognicare/backend`
2. this repo's source code
3. this file
4. `architecture/` and `project-architecture/`
5. root README or older notes

If the UI and backend disagree, fix the product issue at the right owner, then update docs.

## High-value files to inspect first

- `src/App.jsx`
- `src/hooks/useAuth.js`
- `src/config.js`
- `src/pages/admin/`
- `src/pages/org/`
- `src/pages/org-leader/`
- `src/pages/specialist/`
- `src/pages/ConfirmAccount.jsx`

## Release priorities for this repo

Unless the user explicitly asks otherwise, prioritize:

1. login and refresh correctness
2. role-based redirects and protected routes
3. org leader signup / pending-approval flow
4. invitation + activation flow clarity
5. org staff/family management reliability
6. lint/build stability and explicit env handling

Lower priority unless explicitly requested:
- major visual redesign
- large route tree refactors
- speculative abstractions
- new feature surfaces not needed for release readiness

## Web-to-backend contract discipline

High-risk areas where you must verify the backend before or after editing:
- login payloads and returned role data
- refresh-token behavior
- activation and invitation responses
- role names accepted by login flows
- org approval states
- profile/discovery payloads
- env-driven API/upload URL assumptions

Do not “fix” a backend mismatch by hardcoding around it in the UI unless the user explicitly wants a temporary workaround.

## Working style in this repo

- Use existing auth helpers like `authFetch`, `authGet`, and `authMutate` for authenticated requests.
- Keep API paths relative to `API_BASE_URL`.
- Preserve the current route families:
  - `/admin`
  - `/org`
  - `/specialist`
- Prefer small, explicit fixes over broad rewrites.
- Keep localized/content changes consistent across the route flow they affect.

## When to involve `../cognicare`

Inspect or update the backend when the issue involves:
- rejected login despite valid credentials
- unexpected role denial
- refresh/session failure
- invitation/activation token behavior
- org leader approval status logic
- broken payload shape or missing fields
- permission/privacy behavior

If you change a frontend assumption that depends on backend behavior, verify the backend source first.

## QA / v1 verification pointers

Cross-surface and release status live outside this repo’s root:

- **Workspace test matrix:** [`../project-architecture/TEST_PLAN.md`](../project-architecture/TEST_PLAN.md)
- **Web-focused checklist (this app):** [`project-architecture/TEST_PLAN.md`](project-architecture/TEST_PLAN.md)
- **MCP / manual web evidence:** [`architecture/bilan/`](architecture/bilan/) (e.g. `2026-03-27-mcp-web-credentialed-smoke.md`)
- **Ad-hoc full-app QA notes:** [`../full-app-qa-workspace/`](../full-app-qa-workspace/) (regression checklist, execution report)
- **Flutter API origin (local vs Render):** [`../project-architecture/MOBILE_API_ORIGINS.md`](../project-architecture/MOBILE_API_ORIGINS.md) — this web app uses `VITE_BACKEND_ORIGIN` only; mobile uses `cognicare/frontend` `AppConstants.baseUrl`.

`cognicare-web/` at the workspace root is a **symlink** to this directory; edit here only.

## Docs to update when behavior changes

Choose the closest relevant docs:

- repo docs:
  - [`README.md`](README.md)
  - [`architecture/`](architecture/)
  - [`project-architecture/API_MAP.md`](project-architecture/API_MAP.md)
- shared docs when contract/security changes:
  - [`../project-architecture/API_MAP.md`](../project-architecture/API_MAP.md)
  - [`../project-architecture/AUTH_AND_SECURITY.md`](../project-architecture/AUTH_AND_SECURITY.md)

Prefer app-local docs for app-local behavior. Update shared docs only when the shared contract or workflow changed.

## Mandatory doc sync protocol

For this workspace, documentation updates are mandatory, not optional.

When you touch behavior, routing, auth/session flow, permissions, validation outcomes, or release readiness in `cognicareweb/`:

1. Update the closest `.md` files in this repo in the same task.
2. Also inspect `../cognicare/` and shared docs for cross-surface impact and update those when affected.
3. Create a new `.md` file when existing docs do not clearly cover the new flow/checklist.
4. Do not close web changes as code-only when user-visible behavior or contracts changed.

Minimum expectation per substantial task:
- document what changed
- document what was validated
- document what remains manual QA or product decision

## Validation baseline

- `cd /Users/mac/pim/cognicareweb && npm run lint`
- `cd /Users/mac/pim/cognicareweb && npm run build`

For auth/onboarding changes, also do a manual smoke check against a running `../cognicare/backend` when feasible.

## CI expectations

This repo has its own CI in [`./.github/workflows/ci.yml`](./.github/workflows/ci.yml).

That workflow should stay focused on:
- web lint
- web build

Do not add deployment behavior here unless explicitly requested.

If CI fails:
- fix workflow/tool mismatch first if CI is wrong
- fix code/build/lint issues if the repo is actually broken
- do not weaken meaningful checks just to get green

## Git and worktree discipline

- This repo may be dirty; assume local changes are intentional.
- Never revert unrelated edits.
- Never use destructive git commands unless explicitly requested.
- Check status before major edits:
  - `cd /Users/mac/pim/cognicareweb && git status --short`
- If the change also depends on backend behavior, inspect `../cognicare` too before patching.

## Done means

Before calling a task complete in this repo, make sure:
- the backend contract was verified where relevant
- role and auth assumptions were confirmed from source
- lint/build still pass for the dashboard
- docs were updated if user-facing flow or env behavior changed
- any remaining issue is clearly labeled as:
  - backend/code blocker
  - product decision
  - manual QA follow-up
