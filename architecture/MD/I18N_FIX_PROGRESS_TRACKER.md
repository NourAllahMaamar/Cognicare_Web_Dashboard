# 📋 I18N FIX PROGRESS TRACKER
**Start Date:** April 29, 2026  
**Target Completion:** See phase deadlines below

---

## 🎯 PHASE 1: URGENT (24 Hours) - Public Facing

### Landing Page (~100 keys)
- [ ] Create `landing` namespace in en.json
- [ ] Add SLIDES array translations (lines 27-75)
  - [ ] 'Admin Dashboard' slide (title, subtitle, stats)
  - [ ] 'PECS Board' slide (title, subtitle, phase info)
  - [ ] 'Organization Portal' slide (title, subtitle, stats)
  - [ ] 'AI Insights' slide (title, subtitle, features)
- [ ] Add DEFAULT_RELEASE_INFO translations (lines 77-89)
  - [ ] Android status text
  - [ ] iOS status text
- [ ] Add section content translations
  - [ ] 'Pilot Access' section (line 328-330)
  - [ ] Platform cards (Android, Web, iOS)
  - [ ] Login section labels
  - [ ] Footer links and copyright
- [ ] Translate to French in fr.json
- [ ] Translate to Arabic in ar.json
- [ ] Replace ALL hardcoded strings in LandingPage.jsx
- [ ] Test landing page in en/fr/ar
- [ ] Verify Arabic RTL layout

**Estimated Time:** 4-6 hours

---

## 🔴 PHASE 2: CRITICAL (1 Week) - Core Functionality

### OrgFamilies.jsx (~25 keys)
- [ ] Add validation errors to en.json
  - [ ] 'Email is required' (line 105)
  - [ ] 'Name, email, and password are required' (line 117)
  - [ ] Age validation message (lines 222, 229)
- [ ] Add Excel export headers
  - [ ] Parent info headers (line 158)
  - [ ] Family+children headers (line 165)
  - [ ] Template headers (line 179)
  - [ ] Filename texts (line 181)
- [ ] Add dropdown menu items
  - [ ] 'Export Families' (line 306)
  - [ ] 'Import Families' (line 306)
  - [ ] 'Import Families + Children' (line 306)
  - [ ] 'Download Template' (line 306)
  - [ ] 'Download Families+Children Template' (line 306)
- [ ] Translate to fr/ar
- [ ] Replace all hardcoded strings
- [ ] Test import/export in all languages

**Estimated Time:** 2-3 hours

---

### OrgStaff.jsx (~15 keys)
- [ ] Add validation errors to en.json
  - [ ] 'Email is required' (line 74)
  - [ ] 'Name, email, and password are required' (line 80)
- [ ] Add action menu items
  - [ ] 'Export Staff' (line 175)
  - [ ] 'Import Staff' (line 176)
  - [ ] 'Download Template' (line 177)
- [ ] Add Excel headers
  - [ ] Column headers (line 143)
  - [ ] Filenames (lines 145, 151)
- [ ] Add import result labels
  - [ ] 'Created', 'Updated', 'Failed' (line 258)
- [ ] Translate to fr/ar
- [ ] Replace all hardcoded strings
- [ ] Test staff management in all languages

**Estimated Time:** 1.5-2 hours

---

### SpecialistLogin.jsx (~12 keys)
- [ ] Add access denied messages
  - [ ] 'Access denied. This login is for specialists only.' (lines 94, 159)
- [ ] Add Google SDK messages
  - [ ] 'Google Client ID not configured' (line 149)
  - [ ] 'Waiting for Google SDK to load...' (line 152)
  - [ ] 'Google SDK loaded successfully' (line 155)
- [ ] Add error messages
  - [ ] 'Google login failed' (line 92)
  - [ ] 'Failed to send verification code' (line 179)
  - [ ] 'Signup failed' (line 206)
  - [ ] 'Profile completion failed' (line 231)
  - [ ] 'Session expired, please login again' (line 235)
  - [ ] 'Failed to login after profile completion' (line 246)
- [ ] Translate to fr/ar
- [ ] Replace all hardcoded strings
- [ ] Test login flow in all languages

**Estimated Time:** 1.5-2 hours

---

## ⚠️ PHASE 3: HIGH PRIORITY (2 Weeks) - User Experience

### SpecialistChildren.jsx (~10 keys)
- [ ] Add empty state messages
  - [ ] 'No organization children' (line 127)
  - [ ] 'No private patients' (line 145)
  - [ ] 'Select a child to view details' (line 228)
  - [ ] 'No plans found' (line 246)
- [ ] Add validation messages
  - [ ] Age validation (line 212)
- [ ] Add confirm dialogs
  - [ ] 'Delete this plan?' (line 313)
- [ ] Replace empty placeholders '""' (line 244)
- [ ] Translate to fr/ar
- [ ] Replace all hardcoded strings
- [ ] Test in all languages

**Estimated Time:** 1 hour

---

### SpecialistPlans.jsx (~15 keys)
- [ ] Add action labels
  - [ ] 'Refresh' (line 29)
- [ ] Add filter options
  - [ ] 'All', 'PECS', 'TEACCH', 'SkillTracker', 'Activity' (line 39)
- [ ] Add empty state
  - [ ] 'No plans found' (line 44)
- [ ] Add confirm dialog
  - [ ] 'Delete this plan?' (line 51)
- [ ] Add plan section labels
  - [ ] 'PECS Board Items' (line 75)
  - [ ] 'Work System' (line 99)
  - [ ] 'Goals' (line 117)
  - [ ] 'Skill Tracker' (line 137)
  - [ ] 'trials' (line 138)
  - [ ] 'Progress' (line 139)
  - [ ] 'Activity Plan' (line 152)
- [ ] Translate to fr/ar
- [ ] Replace all hardcoded strings
- [ ] Test in all languages

**Estimated Time:** 1.5 hours

---

### SettingsPage.jsx (~8 keys)
- [ ] Add validation errors
  - [ ] 'Name is required' (line 31)
  - [ ] 'Failed to update profile' (line 48)
  - [ ] 'New password must be at least 6 characters' (line 56)
  - [ ] 'Passwords do not match' (line 57)
  - [ ] 'Failed to change password' (line 64)
- [ ] Add info messages
  - [ ] 'Contact support to change your email' (line 95)
- [ ] Update placeholder phone number (line 97)
- [ ] Translate to fr/ar
- [ ] Replace all hardcoded strings
- [ ] Test in all languages

**Estimated Time:** 1 hour

---

### OrgRNEVerification.jsx (~20 keys)
- [ ] Move PROCESSING_MESSAGES to i18n (lines 8-35)
  - [ ] 'Scanning document structure and layout...'
  - [ ] 'Extracting registration details with OCR...'
  - [ ] 'Cross-referencing with national registry...'
  - [ ] 'Running fraud detection algorithms...'
  - [ ] 'Generating validation score and report...'
- [ ] Move PROCESSING_STEPS to i18n
  - [ ] 'Document upload verified'
  - [ ] 'OCR & text extraction'
  - [ ] 'Entity recognition & extraction'
  - [ ] 'Format & signature validation'
  - [ ] 'National registry cross-check'
  - [ ] 'Fraud pattern detection'
  - [ ] 'Generating validation report'
- [ ] Move CALL_TRANSCRIPT fallback strings to i18n
- [ ] Translate to fr/ar
- [ ] Replace all constant arrays
- [ ] Test verification flow in all languages

**Estimated Time:** 2 hours

---

### OrgChildren.jsx (~10 keys)
- [ ] Add column headers (line 28)
  - [ ] 'Child Name', 'DOB', 'Gender', 'Parent Email', etc.
- [ ] Add age units (line 47)
  - [ ] 'yrs', 'months'
- [ ] Add action menu items (lines 60-61)
  - [ ] 'Export Children'
  - [ ] 'Download Template'
- [ ] Replace empty placeholders '""' (line 82)
- [ ] Translate to fr/ar
- [ ] Replace all hardcoded strings
- [ ] Test in all languages

**Estimated Time:** 1 hour

---

### AdminLogin.jsx (~5 keys)
- [ ] Add loading messages
  - [ ] 'Checking release' (line 49)
  - [ ] 'Android pilot' (line 51)
  - [ ] 'Preparing download…' (line 53)
  - [ ] 'Download coming soon' (line 53)
- [ ] Translate to fr/ar
- [ ] Replace all hardcoded strings
- [ ] Test in all languages

**Estimated Time:** 30 minutes

---

## ⚠️ PHASE 4: MEDIUM PRIORITY (1 Month) - Polish

### Fix All Confirm Dialogs (21 instances)
- [ ] SpecialistChildren.jsx line 51
- [ ] SpecialistPlans.jsx line 28
- [ ] OrgLeaderDashboard_OLD.jsx line 821
- [ ] AdminDashboard_OLD.jsx lines 564, 684, 1229, 1287
- [ ] Verify all others use t() with fallbacks
- [ ] Test all confirm dialogs in all languages

**Estimated Time:** 2 hours

---

### Fix All Error Messages (30+ instances)
- [ ] Review all `throw new Error()` statements
- [ ] Add error keys to appropriate namespaces
- [ ] Replace hardcoded error messages
- [ ] Test error scenarios in all languages

**Estimated Time:** 3 hours

---

### Fix Empty Placeholders
- [ ] Find all instances of '""' empty strings
- [ ] Create translation keys for placeholders
- [ ] Replace with proper translations
- [ ] Test in all languages

**Estimated Time:** 1 hour

---

### Minor Page Fixes
- [ ] AdminOrganizations.jsx
  - [ ] 'Invitation cancelled' (line 63)
  - [ ] Empty quotes (line 183)
- [ ] AdminSystemHealth.jsx
  - [ ] Console log text (line 379)
- [ ] AdminTrainingCourses.jsx
  - [ ] 'Update failed' (line 53)
- [ ] AdminUsers.jsx
  - [ ] Empty string display (line 163)
- [ ] OrgCommunity.jsx
  - [ ] Console error messages (lines 26, 38)
- [ ] OrgInvitations.jsx
  - [ ] Empty placeholders (line 26)
  - [ ] Date labels (line 53)
- [ ] OrgLeaderLogin.jsx
  - [ ] Access denied messages (line 37)
  - [ ] File validation messages (lines 71-72)
- [ ] OrgSpecialistDetail.jsx
  - [ ] Empty placeholders

**Estimated Time:** 2-3 hours

---

## 📊 PHASE 5: FINAL POLISH (6 Weeks) - 100% Coverage

### Automated Testing
- [ ] Install i18n coverage testing tool
- [ ] Run automated scan for hardcoded strings
- [ ] Fix any remaining issues
- [ ] Generate coverage report

**Estimated Time:** 2 hours

---

### Manual Testing
- [ ] Test landing page in all languages
- [ ] Test all admin pages in all languages
- [ ] Test all org pages in all languages
- [ ] Test all specialist pages in all languages
- [ ] Test all shared pages in all languages
- [ ] Test all error scenarios
- [ ] Test all confirm dialogs
- [ ] Test all form validations
- [ ] Test all empty states
- [ ] Test all Excel exports

**Estimated Time:** 4-6 hours

---

### RTL Testing
- [ ] Test landing page RTL layout
- [ ] Test all admin pages RTL
- [ ] Test all org pages RTL
- [ ] Test all specialist pages RTL
- [ ] Test modals and popups RTL
- [ ] Test tables and grids RTL
- [ ] Fix any RTL layout issues

**Estimated Time:** 3-4 hours

---

### Documentation
- [ ] Document i18n best practices
- [ ] Create i18n contribution guide
- [ ] Update README with i18n info
- [ ] Create translation key naming guide
- [ ] Document testing procedures

**Estimated Time:** 2 hours

---

## 📈 PROGRESS SUMMARY

### Overall Progress
- **Phase 1 (URGENT):** ⬜ 0/1 pages
- **Phase 2 (CRITICAL):** ⬜ 0/3 pages
- **Phase 3 (HIGH):** ⬜ 0/6 pages
- **Phase 4 (MEDIUM):** ⬜ 0/4 tasks
- **Phase 5 (POLISH):** ⬜ 0/4 tasks

### Total Estimated Time
- **Phase 1:** 4-6 hours
- **Phase 2:** 5-7 hours
- **Phase 3:** 7-8 hours
- **Phase 4:** 8-9 hours
- **Phase 5:** 11-14 hours
- **TOTAL:** 35-44 hours (approximately 1 full work week)

---

## 🎉 COMPLETION CRITERIA

You're done when:
1. ✅ No grep search finds hardcoded user-facing text
2. ✅ All pages work perfectly in en/fr/ar
3. ✅ Arabic RTL layout is perfect
4. ✅ All error messages are translated
5. ✅ All confirm dialogs are translated
6. ✅ All Excel exports have translated headers
7. ✅ All empty states are translated
8. ✅ Coverage report shows 100%

---

**Last Updated:** April 29, 2026  
**Track your progress by checking off items as you complete them!**
