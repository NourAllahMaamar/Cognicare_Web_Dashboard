# Remaining Internationalization Work

**Date**: April 3, 2026  
**Status**: 7/38 pages fully internationalized, 8 pages need work

---

## ✅ COMPLETED (7 Pages)

1. ✅ **ActivitiesCreator.jsx** - Specialist activity creator
2. ✅ **PECSBoardCreator.jsx** - PECS board creator with 6 phases
3. ✅ **SkillTrackerCreator.jsx** - DTT skill tracker with 10-trial system
4. ✅ **TEACCHTrackerCreator.jsx** - TEACCH tracker with work system
5. ✅ **ProgressAIRecommendations.jsx** - AI recommendations with feedback
6. ✅ **AdminAnalytics.jsx** - Analytics dashboard with charts
7. ✅ **AdminOverview.jsx** - Admin overview with quick actions

---

## 🔴 NEEDS WORK (8 Pages - ~350 Translation Keys)

### 1. **AdminLayout.jsx** (65 lines)
**Translation keys needed: 14**
- Navigation items (11): Dashboard, Organizations, Users, Families, Org Reviews, Training Courses, Applications, Analytics, System Health, Settings, Refresh
- Header/Branding (3): System Oversight, Admin Console

### 2. **AdminFraudReview.jsx** (276 lines)
**Translation keys needed: 58**
- Page header, tabs (pending/reviewed with counts)
- AI fraud detection labels, risk levels (High/Medium/Low)
- Organization info labels, certificate viewer
- Buttons: Review, Approve, Reject, Re-scan, Skip, Revoke
- Form inputs, toast messages
- Modal titles with dynamic org names

### 3. **AdminFamilies.jsx** (451 lines)
**Translation keys needed: 89**
- Page header, search, buttons
- Family CRUD forms (name, email, phone, password, org)
- Children management (DOB, gender, diagnosis, medical history, allergies, meds, notes)
- Assign organization modal
- Toast messages, confirmation dialogs
- Empty states, status badges
- Dynamic counts (X children, X families)

### 4. **AdminUsers.jsx** (209 lines)
**Translation keys needed: 41**
- Page header with user count
- Search/filter controls
- User CRUD forms (name, email, phone, password, role)
- Role selector with 10 roles (formatted display)
- Status badges, action buttons
- Toast messages, delete confirmations

### 5. **AdminTrainingCourses.jsx** (196 lines)
**Translation keys needed: 24**
- Page header and description
- Review modal with course details
- Professional comments form
- Approve/reject actions
- Status badges (approved/pending)
- Toast messages, empty states

### 6. **AdminSystemHealth.jsx** (281 lines)
**Translation keys needed: 48**
- Page header, system status indicators
- Component latency table (headers, metrics)
- Audit log section (timestamp, method, endpoint, latency, status)
- Service health cards (Online/Error)
- Probe components (5 services)
- CSV export functionality
- Route-to-component mapping (11 components)

### 7. **AdminOrganizations.jsx** (268 lines)
**Translation keys needed: 47**
- Page header with org count
- Search, pending invitations section
- Invite leader form (org name, leader details, password)
- View members modal (staff/families with counts)
- Change leader functionality
- Delete confirmations, toast messages
- Empty states, status badges

### 8. **OrgSpecialistDetail.jsx** (167 lines)
**Translation keys needed: 41**
- Page header, back button
- AI progress summary section
- Stat cards (Total Plans, Children Followed, Approval Rate, Improvement Rate)
- Plans by type breakdown
- Feedback details section
- Empty states, loading states
- Role display with formatting

---

## 📊 Translation Key Breakdown

### By Category:
- **Page Headers & Titles**: ~35 keys
- **Buttons & Actions**: ~45 keys
- **Form Labels & Placeholders**: ~55 keys
- **Table/Card Headers**: ~30 keys
- **Status Badges**: ~15 keys
- **Empty States**: ~20 keys
- **Toast/Alert Messages**: ~50 keys
- **Modal Titles**: ~20 keys
- **Navigation Items**: ~15 keys
- **Dynamic Templates**: ~40 keys (use `{{variable}}` placeholders)
- **Units & Formatting**: ~10 keys (ms, %, of, etc.)
- **Role/Status Labels**: ~25 keys

### Special Cases:

#### 1. Dynamic String Templates (~40 instances)
Need parameterized translations with placeholders:
```javascript
// Example patterns
t('admin.reviewTitle', { organizationName: org.name })
t('admin.familyCount', { count: families.length })
t('admin.pendingCount', { count: pending.length })
```

#### 2. Role Name Formatting (10+ roles)
All currently use `.replace(/_/g, ' ')` - need dedicated keys:
- `organization_leader` → `t('roles.organizationLeader')`
- `speech_therapist` → `t('roles.speechTherapist')`
- `occupational_therapist` → `t('roles.occupationalTherapist')`
- `psychologist` → `t('roles.psychologist')`
- `doctor` → `t('roles.doctor')`
- `volunteer` → `t('roles.volunteer')`
- `family` → `t('roles.family')`
- `admin` → `t('roles.admin')`
- `other` → `t('roles.other')`

#### 3. Pluralization
Need support for singular/plural forms:
- `"{{count}} child"` vs `"{{count}} children"`
- `"{{count}} family"` vs `"{{count}} families"`
- `"{{count}} staff"` (already plural)

#### 4. Confirmation Dialogs (~5 instances)
Currently use `confirm()` and `prompt()` - need translation:
- `window.confirm(t('admin.confirmDeleteFamily'))`
- `window.prompt(t('admin.modifyPrompt'), defaultValue)`

---

## 🎯 Recommended Approach

### Option 1: Complete Implementation (Recommended)
**Estimated effort**: 6-8 hours
1. Create all ~350 translation keys in `en.json`, `fr.json`, `ar.json`
2. Add i18n imports and hooks to all 8 files
3. Replace all hardcoded strings with `t()` calls
4. Test language switching and RTL for Arabic
5. Verify no errors in all updated files

### Option 2: Prioritized Implementation
**Phase 1** (2-3 hours): Core admin pages (highest usage)
- AdminLayout.jsx - Navigation (14 keys)
- AdminUsers.jsx - User management (41 keys)
- AdminOrganizations.jsx - Org management (47 keys)

**Phase 2** (2-3 hours): Secondary admin pages
- AdminFraudReview.jsx - Fraud detection (58 keys)
- AdminSystemHealth.jsx - System monitoring (48 keys)

**Phase 3** (2-3 hours): Remaining pages
- AdminFamilies.jsx - Family management (89 keys)
- AdminTrainingCourses.jsx - Training review (24 keys)
- OrgSpecialistDetail.jsx - Specialist summary (41 keys)

### Option 3: Basic Implementation (Quick Fix)
**Estimated effort**: 1-2 hours
- Add i18n support to AdminLayout.jsx only (navigation)
- Keep other pages in English for now
- Add TODO comments for future translation

---

## 🚀 Next Steps

### If Proceeding with Full Implementation:

1. **Create Translation Keys Structure** (1-2 hours)
   ```json
   {
     "adminLayout": { /* 14 keys */ },
     "adminFraud": { /* 58 keys */ },
     "adminFamilies": { /* 89 keys */ },
     "adminUsers": { /* 41 keys */ },
     "adminTraining": { /* 24 keys */ },
     "adminSystemHealth": { /* 48 keys */ },
     "adminOrgs": { /* 47 keys */ },
     "orgSpecialist": { /* 41 keys */ },
     "roles": { /* 10 role labels */ },
     "common": {
       "save": "Save",
       "cancel": "Cancel",
       "delete": "Delete",
       "edit": "Edit",
       "create": "Create",
       "update": "Update",
       "search": "Search",
       "loading": "Loading...",
       "noData": "No data available",
       "error": "An error occurred"
     }
   }
   ```

2. **Update JSX Files** (4-5 hours)
   - Add `import { useTranslation } from 'react-i18next'`
   - Add `const { t } = useTranslation()` hook
   - Replace all hardcoded strings
   - Update dynamic templates with parameterized translations
   - Fix role display with translation keys

3. **Testing & Validation** (~1 hour)
   - Switch between EN/FR/AR languages
   - Test all navigation items
   - Verify forms, modals, and toasts translate correctly
   - Check RTL layout for Arabic
   - Run error checks on all files

---

## 📝 Implementation Template

For each file, follow this pattern:

```javascript
// 1. Add imports
import { useTranslation } from 'react-i18next';

// 2. Add hook in component
export default function ComponentName() {
  const { t } = useTranslation();
  
  // 3. Replace strings
  // Before: <h2>User Management</h2>
  // After:  <h2>{t('adminUsers.title')}</h2>
  
  // 4. For dynamic strings with interpolation
  // Before: `${count} users`
  // After:  t('adminUsers.userCount', { count })
  
  // 5. For role formatting
  // Before: user.role.replace(/_/g, ' ')
  // After:  t(`roles.${user.role}`)
}
```

---

## ✅ Current Status Summary

- **Total Pages in Dashboard**: 38
- **Fully Internationalized**: 7 (18%)
- **Partially Internationalized**: 0
- **Needs Work**: 8 (21%)
- **Already Internationalized**: 23 (61% - these use i18n already)

---

## 🌍 Translation Files Status

- **en.json**: ~1200 lines, has keys for 7 completed pages
- **fr.json**: ~1200 lines, synchronized with en.json
- **ar.json**: ~1200 lines, synchronized with en.json, RTL configured

**Missing**: Translation keys for the 8 admin pages listed above (~350 new keys needed)

---

## 📞 Questions to Consider

Before proceeding with full implementation:

1. **Priority**: Which pages are most frequently used by admins?
2. **Timeline**: When does this need to be completed?
3. **Resources**: Are French and Arabic translations available or need to be created?
4. **Testing**: Who will test the translations for accuracy?
5. **Scope**: Should we also internationalize the remaining 23 pages that already have i18n hooks but may have missed strings?

---

## 💡 Recommendations

1. **Start with AdminLayout.jsx** - It affects all admin pages (navigation)
2. **Prioritize core CRUD pages** - AdminUsers, AdminOrganizations, AdminFamilies
3. **Use translation management tool** - Consider using i18next-parser to extract strings automatically
4. **Add pluralization support** - Configure i18next for proper plural forms in FR/AR
5. **Implement fallback strategy** - Ensure English text shows if translations are missing

---

**Report Generated**: April 3, 2026  
**Files Analyzed**: 8 admin pages  
**Total Translation Keys Needed**: ~350  
**Estimated Implementation Time**: 6-8 hours (complete), 1-2 hours (basic)
