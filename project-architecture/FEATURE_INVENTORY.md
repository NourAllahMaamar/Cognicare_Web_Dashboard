# Feature inventory — `cognicareweb/`

UI features implemented as routes/pages. Backend = external Nest API.

| Feature | Purpose | Main files | Entry points | Dependencies | Status | Risks / gaps |
|---------|---------|------------|--------------|--------------|--------|--------------|
| Landing | Marketing, role entry | `pages/home/LandingPage.jsx` | `/` | i18n | Implemented | — |
| Confirm account | Activate invited user | `pages/ConfirmAccount.jsx` | `/confirm-account` | `POST /auth/activate` | Implemented | — |
| Admin overview | KPIs, shortcuts | `pages/admin/AdminOverview.jsx` | `/admin/dashboard` | `authGet` users, orgs, pending, families | Implemented | — |
| Admin users | User CRUD | `pages/admin/AdminUsers.jsx` | `/admin/dashboard/users` | `/users` | Implemented | — |
| Admin organizations | Orgs, invitations, staff/families drill-down | `pages/admin/AdminOrganizations.jsx` | `/admin/dashboard/organizations` | `/organization/*` | Implemented | — |
| Admin families | Families + children admin | `pages/admin/AdminFamilies.jsx` | `/admin/dashboard/families` | `/organization/admin/families/*` | Implemented | — |
| Admin fraud review | Pending/reviewed org requests, AI analyses, rescan | `pages/admin/AdminFraudReview.jsx` | `/admin/dashboard/reviews` | `/organization/admin/*`, `/org-scan-ai/*` | Implemented | — |
| Admin training | Approve training courses | `pages/admin/AdminTrainingCourses.jsx` | `/admin/dashboard/training` | `/training/admin/*` | Implemented | — |
| Admin caregiver apps | Review volunteer applications | `pages/admin/AdminCaregiverApplications.jsx` | `/admin/dashboard/caregiver-applications` | `/volunteers/applications` | Implemented | — |
| Admin analytics | Charts over users/orgs/families | `pages/admin/AdminAnalytics.jsx` | `/admin/dashboard/analytics` | `/users`, `/organization/*` | Implemented | Client-side aggregation |
| Admin system health | Probe key GETs + AI health | `pages/admin/AdminSystemHealth.jsx` | `/admin/dashboard/system-health` | `/users`, `/organization/all`, `/org-scan-ai/health` | Implemented | Partial public fetch for AI health |
| Admin settings | Profile/password | `pages/shared/SettingsPage.jsx` | `/admin/dashboard/settings` | `/auth/profile`, `/auth/change-password` | Implemented | Shared with org/specialist |
| Org overview | Staff/families/children/invites + specialist summaries | `pages/org/OrgOverview.jsx` | `/org/dashboard` | `/organization/my-organization/*`, `/progress-ai/org/specialist/...` | Implemented | — |
| Org staff | Staff CRUD, invite, import | `pages/org/OrgStaff.jsx` | `/org/dashboard/staff` | same + `/import/*` | Implemented | — |
| Org families | Families CRUD, children, import | `pages/org/OrgFamilies.jsx` | `/org/dashboard/families` | same + `/import/*` | Implemented | — |
| Org children | Read org children | `pages/org/OrgChildren.jsx` | `/org/dashboard/children` | `/organization/my-organization/children` | Implemented | — |
| Org invitations | List/delete invitations | `pages/org/OrgInvitations.jsx` | `/org/dashboard/invitations` | `/organization/my-organization/invitations` | Implemented | — |
| Org specialist detail | Specialist Progress AI summary | `pages/org-leader/OrgSpecialistDetail.jsx` | `/org/dashboard/specialist/:id` | `/progress-ai/org/specialist/:id/summary` | Implemented | — |
| Specialist overview | Dashboard tiles | `pages/specialist/SpecialistOverview.jsx` | `/specialist/dashboard` | org children, my children, plans, activity-suggestions | Implemented | — |
| Specialist children | Children, plans, add family | `pages/specialist/SpecialistChildren.jsx` | `/specialist/dashboard/children` | `/children/*`, `/specialized-plans/*` | Implemented | — |
| Specialist plans | List/delete plans | `pages/specialist/SpecialistPlans.jsx` | `/specialist/dashboard/plans` | `/specialized-plans/my-plans` | Implemented | — |
| PECS creator | Upload + create plan | `pages/specialist/PECSBoardCreator.jsx` | `/specialist/pecs/create` | `/specialized-plans` | Implemented | — |
| TEACCH creator | Create plan | `pages/specialist/TEACCHTrackerCreator.jsx` | `/specialist/teacch/create` | `/specialized-plans` | Implemented | — |
| Activities creator | Create plan | `pages/specialist/ActivitiesCreator.jsx` | `/specialist/activities` | `/specialized-plans` | Implemented | — |
| Skill tracker creator | Create plan | `pages/specialist/SkillTrackerCreator.jsx` | `/specialist/skill-tracker` | `/specialized-plans` | Implemented | — |
| Progress AI UI | Recommendations + feedback | `pages/specialist/ProgressAIRecommendations.jsx` | `/specialist/ai-recommendations/:childId` | `/progress-ai/child/:id/recommendations`, feedback POST | Implemented | Raw `fetch` for feedback |
| Behavior analytics | Dashboard, insights, consent | `pages/specialist/SpecialistBehaviorAnalytics.jsx` | `/specialist/behavior-analytics/:childId` | `/behavior-analytics/*` | Implemented | — |
| Org leader login/signup | Auth + org signup flow | `pages/org-leader/OrgLeaderLogin.jsx` | `/org/login` | `/auth/login`, `/auth/signup`, verify | Implemented | — |
| Admin/specialist login | Auth | `AdminLogin.jsx`, `SpecialistLogin.jsx` | `/admin/login`, `/specialist/login` | `/auth/login` | Implemented | — |
| 404 | Not found | `pages/shared/NotFound.jsx` | `*` | — | Implemented | — |
| Legacy / unused | Old dashboards | `*_OLD.jsx`, `Home_OLD.jsx` | **unclear** | — | Unclear | Remove or document |
