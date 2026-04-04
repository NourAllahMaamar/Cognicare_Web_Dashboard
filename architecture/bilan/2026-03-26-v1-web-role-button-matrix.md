# 2026-03-26 — Web role button/function matrix

## Scope

Deep UI pass beyond login for web roles using `user-cursor-ide-browser` MCP:

- admin
- organization_leader
- specialist

No user-account deletion actions were executed.

## Admin matrix

| Route | Buttons/functions exercised | Result |
|------|------------------------------|--------|
| `/admin/dashboard` | Sidebar navigation, refresh card actions | Pass |
| `/admin/dashboard/users` | `Add User` modal open/close, table action buttons visibility | Pass |
| `/admin/dashboard/organizations` | `Invite Org Leader` modal open/close, `View Members` open/close | Pass |
| `/admin/dashboard/families` | family actions visibility (edit/children/org controls) | Pass |
| `/admin/dashboard/reviews` | reviews screen/tab visibility | Pass |
| `/admin/dashboard/training` | review actions visibility | Pass |
| `/admin/dashboard/caregiver-applications` | status filters/tabs visibility | Pass |
| `/admin/dashboard/analytics` | period + export controls and chart page rendering | Pass |
| `/admin/dashboard/system-health` | system health page rendering | Pass |
| `/admin/dashboard/settings` | profile/password/language controls visibility | Pass |

Guard check:
- Removing admin token and opening `/admin/dashboard` redirects to `/admin/login` (Pass).

## Organization leader matrix

| Route | Buttons/functions exercised | Result |
|------|------------------------------|--------|
| `/org/dashboard` | Sidebar + header controls | Pass |
| `/org/dashboard/staff` | `Add Staff` modal open/close, staff action visibility | Pass |
| `/org/dashboard/families` | `Add Family` modal open/close | Pass |
| `/org/dashboard/children` | children page controls/import-export visibility | Pass |
| `/org/dashboard/invitations` | invitation page rendering/navigation | Pass |
| `/org/dashboard/settings` | profile/password/language settings controls | Pass |

Guard check:
- Opening `/org/dashboard` without org token redirects to `/org/login` (Pass).

## Specialist matrix

| Route | Buttons/functions exercised | Result |
|------|------------------------------|--------|
| `/specialist/dashboard` | cards/navigation controls | Pass |
| `/specialist/dashboard/children` | `Add Private Family` modal open/close | Pass |
| `/specialist/dashboard/plans` | plan filters/tabs | Pass |
| `/specialist/pecs/create` | creator page + save action availability | Pass |
| `/specialist/teacch/create` | tracker page + save action availability | Pass |
| `/specialist/activities` | activity page + save action availability | Pass |
| `/specialist/skill-tracker` | skill tracker page + save action availability | Pass |
| `/specialist/dashboard/settings` | profile/password/language settings controls | Pass |

Guard check:
- Opening specialist tool routes without specialist token redirects to `/specialist/login` (Pass).

## Additional MCP continuation pass (same day)

| Focus | Checks executed | Result |
|------|------------------|--------|
| Specialist deep action | `/specialist/dashboard/children` + `Add Private Family` form open (parent/email/password/child fields visible) | Pass |
| Specialist guard re-check | Removed specialist session keys then opened `/specialist/activities` | Pass (redirected to `/specialist/login`) |
| Admin deep action | `/admin/dashboard/organizations` + `Invite Org Leader` flow controls (`Send Invitation`, `Cancel`) | Pass |
| Org leader deep action | `/org/dashboard/staff` (`Add Staff`) and `/org/dashboard/families` (`Add Family` with invite/create controls) | Pass |
| Cross-role route boundary | With org leader session and no admin token, opened `/admin/dashboard` | Pass (redirected to `/admin/login`) |

## Additional MCP continuation pass (route-controls + auth UX)

| Focus | Checks executed | Result |
|------|------------------|--------|
| Admin analytics controls | `/admin/dashboard/analytics` (`Export Report`, period control, charts render) | Pass |
| Admin system-health controls | `/admin/dashboard/system-health` + refresh actions visible | Pass |
| Admin training queue | `/admin/dashboard/training` review actions visible | Pass |
| Admin caregiver applications | `/admin/dashboard/caregiver-applications` status-filter controls visible | Pass |
| Org settings controls | `/org/dashboard/settings` profile + change-password + language/theme controls visible | Pass |
| Org children controls | `/org/dashboard/children` import/export control visible | Pass |
| Specialist creator tooling | `/specialist/pecs/create`, `/specialist/teacch/create`, `/specialist/skill-tracker` save controls visible | Pass |
| Specialist logout flow | Clicked `Log Out` from specialist dashboard | Pass (redirected to `/specialist/login`) |
| Login error UX | Invalid admin password stays on `/admin/login` and shows `Invalid credentials` feedback | Pass |

## Notes

- This pass was intentionally button/function heavy and route-complete for staff-facing web roles.
- Role sessions are stored under separate localStorage namespaces (`admin*`, `orgLeader*`, `specialist*`), so multiple role sessions can coexist in one browser profile until each namespace is cleared or explicit logout is run.
- Remaining web risk is low and mostly data-setup dependent (for pages where specific table actions require specific seeded rows).
