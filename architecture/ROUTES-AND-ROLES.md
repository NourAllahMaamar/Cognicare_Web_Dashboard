# Routes and roles

Source of truth: [`src/App.jsx`](../src/App.jsx).

## Public

| Path | Component | Notes |
|------|-----------|--------|
| `/` | `LandingPage` | Marketing / entry |
| `/confirm-account` | `ConfirmAccount` | Account confirmation flow |

## Admin (platform)

Login: **`/admin/login`**. Dashboard layout: **`/admin/dashboard`** (nested routes).

| Path | Component |
|------|-----------|
| `/admin` | Redirect → `/admin/dashboard` |
| `/admin/dashboard` | `AdminOverview` (index) |
| `/admin/dashboard/users` | `AdminUsers` |
| `/admin/dashboard/organizations` | `AdminOrganizations` |
| `/admin/dashboard/families` | `AdminFamilies` |
| `/admin/dashboard/reviews` | `AdminFraudReview` |
| `/admin/dashboard/training` | `AdminTrainingCourses` |
| `/admin/dashboard/caregiver-applications` | `AdminCaregiverApplications` |
| `/admin/dashboard/analytics` | `AdminAnalytics` |
| `/admin/dashboard/system-health` | `AdminSystemHealth` |
| `/admin/dashboard/settings` | `SettingsPage` (shared) |

## Org leader (organization)

Login: **`/org/login`**. Dashboard layout: **`/org/dashboard`** (nested routes).

| Path | Component |
|------|-----------|
| `/org` | Redirect → `/org/dashboard` |
| `/org-leader/*` | Redirect → `/org/dashboard` (legacy path cleanup) |
| `/org/dashboard` | `OrgOverview` (index) |
| `/org/dashboard/staff` | `OrgStaff` |
| `/org/dashboard/families` | `OrgFamilies` |
| `/org/dashboard/children` | `OrgChildren` |
| `/org/dashboard/invitations` | `OrgInvitations` |
| `/org/dashboard/specialist/:specialistId` | `OrgSpecialistDetail` |
| `/org/dashboard/settings` | `SettingsPage` (shared) |

## Specialist (healthcare / educator)

Login: **`/specialist/login`**. Main layout: **`/specialist/dashboard`** (nested routes). Additional full-page tools:

| Path | Component |
|------|-----------|
| `/specialist` | Redirect → `/specialist/dashboard` |
| `/specialist/dashboard` | `SpecialistOverview` (index) |
| `/specialist/dashboard/children` | `SpecialistChildren` |
| `/specialist/dashboard/plans` | `SpecialistPlans` |
| `/specialist/dashboard/settings` | `SettingsPage` (shared) |
| `/specialist/pecs/create` | `PECSBoardCreator` |
| `/specialist/teacch/create` | `TEACCHTrackerCreator` |
| `/specialist/activities` | `ActivitiesCreator` |
| `/specialist/skill-tracker` | `SkillTrackerCreator` |
| `/specialist/ai-recommendations/:childId` | `ProgressAIRecommendations` |
| `/specialist/behavior-analytics/:childId` | `SpecialistBehaviorAnalytics` |

## Legacy redirects

| Path | Target |
|------|--------|
| `/healthcare` | `/specialist/dashboard` |
| `/healthcare/dashboard` | `/specialist/dashboard` |

## Fallback

| Path | Component |
|------|-----------|
| `*` (no match) | `NotFound` |
