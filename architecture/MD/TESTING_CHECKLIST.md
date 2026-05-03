# Specialist Dashboard – Testing Checklist

Use this checklist to verify all specialist flows work and data persists to MongoDB Atlas.

## Use Cases Covered (ready for testing)

| Use case | Auth | Child required | Save → MongoDB | 401 handling | Org + private children |
|----------|------|----------------|----------------|--------------|-------------------------|
| PECS Board | ✅ | ✅ | ✅ | ✅ | N/A (childId from URL) |
| TEACCH Tracker | ✅ | ✅ | ✅ | ✅ | N/A |
| Skill Mastery Tracker | ✅ | ✅ | ✅ | ✅ | ✅ |
| Assign Activities | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dashboard (children, plans, delete) | ✅ | — | — | ✅ | ✅ |

- **Auth:** Redirect to login when no token; session check on load.
- **401:** All create/save and dashboard fetches clear token and redirect to login on Unauthorized.
- **Child required:** All four creators validate `childId` and show an error if missing.
- **Persistence:** All plans POST to `/specialized-plans` and are stored in MongoDB Atlas.
- **Org + private:** Activities and Skill Tracker load child from both org and specialist private list.

## Prerequisites
- **Login:** `hsan.cheker@esprit.tn` / `cheker123`
- **Dev server:** `npm run dev` (uses Vite proxy to Render API)
- **Backend:** Render API at `cognicare-mobile-h4ct.onrender.com`

---

## 1. PECS Board Creator

| Step | Action | Expected |
|------|--------|----------|
| 1.1 | Select a child (e.g., Adam) → Click **Create PECS Board** | Opens PECS creator with header image |
| 1.2 | Enter board title, select phase, add picture cards (label + upload or URL) | Cards appear in preview |
| 1.3 | Click trial cells to set Pass/Fail | Success count updates |
| 1.4 | Click **Save Board** | Redirects to dashboard; plan appears under child |
| 1.5 | Refresh page | Plan still visible (MongoDB persistence) |

---

## 2. TEACCH Tracker Creator

| Step | Action | Expected |
|------|--------|----------|
| 2.1 | Select child → Click **Start TEACCH Tracker** | Opens TEACCH creator with header image |
| 2.2 | Enter title, fill work system, add goals (templates or custom) | Goals appear in preview |
| 2.3 | Click **Save Tracker** | Redirects to dashboard; plan appears |
| 2.4 | Refresh page | Plan persists |

---

## 3. Skill Mastery Tracker

| Step | Action | Expected |
|------|--------|----------|
| 3.1 | Select child → Click **Skill Mastery Tracker** | Opens skill tracker page |
| 3.2 | Enter skill/target, set trials (Pass/Fail) | Mastery status updates |
| 3.3 | Click **Save Tracker** | Redirects to dashboard; plan appears |
| 3.4 | Refresh page | Plan persists |

---

## 4. Assign Activities

| Step | Action | Expected |
|------|--------|----------|
| 4.1 | Select child → Click **Assign Activities** | Opens activity creator |
| 4.2 | Enter title and description | Form accepts input |
| 4.3 | Click **Save Activity** | Redirects to dashboard; plan appears |
| 4.4 | Refresh page | Plan persists |

---

## 5. Data Persistence & Display

| Step | Action | Expected |
|------|--------|----------|
| 5.1 | Create plans for a child | Plans appear in **Active Plans** for that child |
| 5.2 | Go to **My Plans** tab | All your plans listed with child name |
| 5.3 | Delete a plan | Plan removed; confirms before delete |
| 5.4 | Log out, log back in | Plans still visible |

---

## 6. Edge Cases

| Scenario | Expected |
|----------|----------|
| No child selected, open PECS/TEACCH/Skill/Activity | Error: "Please select a child from the dashboard first" |
| Save without title or cards | Error message; no API call |
| Session expired (401) | "Session expired" message → redirect to login |
| Image upload (PECS card) | Upload from computer or paste URL; image shows in card |

---

## 7. Quick API Verification

Run the test script:
```bash
cd cognicareweb && node test_specialist_plans.js
```
All four plan types (PECS, TEACCH, SkillTracker, Activity) should create successfully.
