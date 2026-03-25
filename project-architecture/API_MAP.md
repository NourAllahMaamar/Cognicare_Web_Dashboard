# API map — paths used by `cognicareweb/`

All paths are appended to **`API_BASE_URL`** (`/api/v1` in dev via proxy; `${VITE_BACKEND_ORIGIN}/api/v1` in prod — `src/config.js`).

**Auth:** `Bearer` from `useAuth(role)` unless marked **public** (no token).

---

## Auth (mixed public / JWT)

| Method | Path (after `/api/v1`) | Used in | Auth |
|--------|-------------------------|---------|------|
| POST | `/auth/login` | `AdminLogin`, `OrgLeaderLogin`, `SpecialistLogin` | Public |
| POST | `/auth/refresh` | `useAuth.js` | Public (body) |
| POST | `/auth/send-verification-code` | `OrgLeaderLogin` | Public |
| POST | `/auth/signup` | `OrgLeaderLogin` (FormData) | Public |
| POST | `/auth/activate` | `ConfirmAccount` (uses returned `role` to route user to the correct login page) | Public |
| PATCH | `/auth/profile` | `SettingsPage` | JWT |
| PATCH | `/auth/change-password` | `SettingsPage` | JWT |

---

## Users

| Method | Path | Used in | Auth |
|--------|------|---------|------|
| GET | `/users` | Admin overview, analytics, users, system health | JWT |
| POST | `/users` | `AdminUsers` | JWT |
| PATCH | `/users/:id` | `AdminUsers` | JWT |
| DELETE | `/users/:id` | `AdminUsers` | JWT |

---

## Organization (admin)

| Method | Path | Used in | Auth |
|--------|------|---------|------|
| GET | `/organization/all` | Admin orgs, families, analytics, system health | JWT |
| DELETE | `/organization/:id` | `AdminOrganizations` | JWT |
| PATCH | `/organization/:id/change-leader` | `AdminOrganizations` | JWT |
| GET | `/organization/:orgId/staff` | `AdminOrganizations` | JWT |
| GET | `/organization/:orgId/families` | `AdminOrganizations` | JWT |
| GET | `/organization/admin/pending-requests` | Overview, fraud, analytics | JWT |
| GET | `/organization/admin/reviewed-requests` | `AdminFraudReview` | JWT |
| POST | `/organization/admin/review/:orgId` | `AdminFraudReview` | JWT |
| POST | `/organization/admin/re-review/:orgId` | `AdminFraudReview` | JWT |
| GET | `/organization/admin/pending-invitations` | `AdminOrganizations` | JWT |
| DELETE | `/organization/admin/invitations/:id` | `AdminOrganizations` | JWT |
| POST | `/organization/admin/invite-leader` | `AdminOrganizations` | JWT |
| GET | `/organization/admin/families` | Overview, families, analytics | JWT |
| POST | `/organization/admin/families` | `AdminFamilies` | JWT |
| PATCH | `/organization/admin/families/:id` | `AdminFamilies` | JWT |
| DELETE | `/organization/admin/families/:id` | `AdminFamilies` | JWT |
| PATCH | `/organization/admin/families/:id/organization` | `AdminFamilies` | JWT |
| DELETE | `/organization/admin/families/:id/organization` | `AdminFamilies` | JWT |
| GET | `/organization/admin/families/:id/children` | `AdminFamilies` | JWT |
| POST | `/organization/admin/families/:id/children` | `AdminFamilies` | JWT |
| PATCH | `/organization/admin/families/:famId/children/:childId` | `AdminFamilies` | JWT |
| DELETE | `/organization/admin/families/:famId/children/:childId` | `AdminFamilies` | JWT |
| GET | `/organization/admin/all-children` | `AdminFamilies` | JWT |

---

## Organization (org leader — my-organization)

| Method | Path | Used in | Auth |
|--------|------|---------|------|
| GET | `/organization/my-organization/staff` | Org overview, staff, specialist detail | JWT |
| POST | `/organization/my-organization/staff/create` | `OrgStaff` | JWT |
| POST | `/organization/my-organization/staff/invite` | `OrgStaff` (existing-account invite path; create flow is used for net-new staff) | JWT |
| PATCH | `/organization/my-organization/staff/:id` | `OrgStaff` | JWT |
| DELETE | `/organization/my-organization/staff/:id` | `OrgStaff` | JWT |
| GET | `/organization/my-organization/families` | Org overview, families | JWT |
| POST | `/organization/my-organization/families/create` | `OrgFamilies` | JWT |
| POST | `/organization/my-organization/families/invite` | `OrgFamilies` (existing-account invite path; create flow is used for net-new family accounts) | JWT |
| PATCH | `/organization/my-organization/families/:id` | `OrgFamilies` | JWT |
| DELETE | `/organization/my-organization/families/:id` | `OrgFamilies` | JWT |
| PATCH | `/organization/my-organization/families/:famId/children/:childId` | `OrgFamilies` | JWT |
| POST | `/organization/my-organization/families/:famId/children` | `OrgFamilies` | JWT |
| GET | `/organization/my-organization/children` | Org overview, families, children, specialist | JWT |
| GET | `/organization/my-organization/invitations` | Org overview, invitations | JWT |
| DELETE | `/organization/my-organization/invitations/:id` | `OrgInvitations` | JWT |

---

## Import

| Method | Path | Used in | Auth |
|--------|------|---------|------|
| POST | `/import/preview/:orgId/staff` | `OrgStaff` | JWT |
| POST | `/import/execute/:orgId/staff?...` | `OrgStaff` | JWT |
| POST | `/import/preview/:orgId/:type` | `OrgFamilies` | JWT |
| POST | `/import/execute/:orgId/:type?...` | `OrgFamilies` | JWT |

---

## Org scan AI

| Method | Path | Used in | Auth |
|--------|------|---------|------|
| GET | `/org-scan-ai/health` | `AdminOverview`, `AdminFraudReview`, `AdminSystemHealth` | **Public** in some calls |
| GET | `/org-scan-ai/organization/:orgId/analyses` | `AdminFraudReview` | JWT |
| POST | `/org-scan-ai/rescan/:orgId` | `AdminFraudReview` | JWT |

---

## Training (admin)

| Method | Path | Used in | Auth |
|--------|------|---------|------|
| GET | `/training/admin/courses` | `AdminTrainingCourses` | JWT |
| PATCH | `/training/admin/courses/:id/approve` | `AdminTrainingCourses` | JWT |

---

## Volunteers (admin)

| Method | Path | Used in | Auth |
|--------|------|---------|------|
| GET | `/volunteers/applications?status=` | `AdminCaregiverApplications` | JWT |
| PATCH | `/volunteers/applications/:id/review` | `AdminCaregiverApplications` | JWT |

---

## Specialist / org — children & plans

| Method | Path | Used in | Auth |
|--------|------|---------|------|
| GET | `/children/specialist/my-children` | Specialist overview, children | JWT |
| POST | `/children/specialist/add-family` | `SpecialistChildren` | JWT |
| GET | `/specialized-plans/my-plans` | Overview, plans | JWT |
| GET | `/specialized-plans/child/:childId` | `SpecialistChildren` | JWT |
| DELETE | `/specialized-plans/:id` | Children, plans | JWT |
| POST | `/specialized-plans/upload-image` | `PECSBoardCreator` (multipart) | JWT |
| POST | `/specialized-plans` | All creators | JWT |

---

## Progress AI

| Method | Path | Used in | Auth |
|--------|------|---------|------|
| GET | `/progress-ai/activity-suggestions` | `SpecialistOverview` | JWT |
| GET | `/progress-ai/child/:childId/recommendations` | `ProgressAIRecommendations` | JWT |
| POST | `/progress-ai/recommendations/:id/feedback` | `ProgressAIRecommendations` (raw fetch) | JWT |
| GET | `/progress-ai/org/specialist/:specialistId/summary` | `OrgOverview`, `OrgSpecialistDetail` | JWT |

---

## Behavior analytics

| Method | Path | Used in | Auth |
|--------|------|---------|------|
| GET | `/behavior-analytics/child/:childId/dashboard` | `SpecialistBehaviorAnalytics` | JWT |
| GET | `/behavior-analytics/child/:childId/insights` | same | JWT |
| GET | `/behavior-analytics/child/:childId/consent` | same | JWT |

---

## Gaps / notes

- **`AdminDashboard_OLD.jsx`**, **`OrgLeaderDashboard_OLD.jsx`**, **`SpecialistDashboard_OLD.jsx`** call many of the same paths; prefer current `pages/admin|org|specialist` for accurate map.
- **Server-side** validation and exact response shapes: see **`cognicare/backend`** Swagger.
- Specialist web login accepts specialist-compatible roles (`careProvider`, specialist role set, `volunteer`, `other`) and uses `/auth/login`.
