# 2026-04-04 — Dashboard assistant v1

## Scope

- Added a shared Cogni dashboard assistant drawer to the admin, organization leader, and specialist layouts.
- The drawer sends the current route plus sanitized page context to `POST /api/v1/chatbot/chat`.
- Web assistant behavior is intentionally read-only in V1. If the backend ever returns a `pendingAction`, the UI shows that writes are disabled on web for this release.
- Added explicit refresh controls in the drawer header/footer.
- The drawer now triggers a fresh assistant summary each time it opens or when the active dashboard route changes.

## Context provided in V1

- Admin overview: total users, organizations, pending reviews, families, and AI configuration state.
- Organization overview: staff, families, children, invitations, plus selected specialist summary when available.
- Specialist overview: child counts, plan counts, board/tracker counts, and top activity suggestions.

## Cost / routing behavior

- Entry refreshes use a synthetic refresh prompt so the backend can answer with cheap deterministic summaries instead of always calling a full model.
- Repeated simple questions can be served from the backend assistant cache unless the user explicitly refreshes.
- Manual refresh bypasses cached answers and asks the backend to recompute from the current route and context.

## Validation

- `cd /Users/mac/pim/cognicareweb && npm run lint`
- `cd /Users/mac/pim/cognicareweb && npm run build`

Both commands passed during the 2026-04-04 assistant expansion validation run.
