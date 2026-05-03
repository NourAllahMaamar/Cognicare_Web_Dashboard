# 🔧 I18N IMPLEMENTATION GUIDE
**Quick Reference for Fixing Hardcoded Text**

---

## 📚 Table of Contents
1. [Basic Patterns](#basic-patterns)
2. [Step-by-Step Example](#step-by-step-example)
3. [Common Scenarios](#common-scenarios)
4. [Translation Key Naming](#translation-key-naming)
5. [Testing Your Changes](#testing-your-changes)

---

## 🎯 Basic Patterns

### ✅ DO: Use Translation Hook

```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('myComponent.title')}</h1>
      <p>{t('myComponent.description')}</p>
      <button>{t('common.actions.save')}</button>
    </div>
  );
}
```

### ❌ DON'T: Hardcode Text

```jsx
// ❌ BAD - Hardcoded text
function MyComponent() {
  return (
    <div>
      <h1>Welcome to CogniCare</h1>
      <p>This is a description</p>
      <button>Save</button>
    </div>
  );
}
```

---

## 📝 Step-by-Step Example

Let's fix a real example from **LandingPage.jsx**:

### BEFORE (Lines 27-45):
```jsx
const SLIDES = [
  {
    icon: '⚡',
    title: 'Admin Dashboard',
    subtitle: 'System-wide analytics & control',
    bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    stats: [
      { v: '2.4K', l: 'Users', c: 'bg-blue-500' },
      { v: '120', l: 'Orgs', c: 'bg-purple-500' },
      { v: '98%', l: 'Uptime', c: 'bg-emerald-500' }
    ]
  },
  // ... more slides
];
```

### STEP 1: Add Translation Keys to en.json

```json
{
  "landing": {
    "slides": {
      "admin": {
        "title": "Admin Dashboard",
        "subtitle": "System-wide analytics & control",
        "stats": {
          "users": {
            "value": "2.4K",
            "label": "Users"
          },
          "orgs": {
            "value": "120",
            "label": "Orgs"
          },
          "uptime": {
            "value": "98%",
            "label": "Uptime"
          }
        }
      }
    }
  }
}
```

### STEP 2: Add French Translations to fr.json

```json
{
  "landing": {
    "slides": {
      "admin": {
        "title": "Tableau de bord Admin",
        "subtitle": "Analyses et contrôle à l'échelle du système",
        "stats": {
          "users": {
            "value": "2,4K",
            "label": "Utilisateurs"
          },
          "orgs": {
            "value": "120",
            "label": "Organisations"
          },
          "uptime": {
            "value": "98%",
            "label": "Disponibilité"
          }
        }
      }
    }
  }
}
```

### STEP 3: Add Arabic Translations to ar.json

```json
{
  "landing": {
    "slides": {
      "admin": {
        "title": "لوحة تحكم المسؤول",
        "subtitle": "تحليلات ومراقبة على مستوى النظام",
        "stats": {
          "users": {
            "value": "2.4K",
            "label": "المستخدمين"
          },
          "orgs": {
            "value": "120",
            "label": "المؤسسات"
          },
          "uptime": {
            "value": "98%",
            "label": "وقت التشغيل"
          }
        }
      }
    }
  }
}
```

### STEP 4: Update Component Code

```jsx
import { useTranslation } from 'react-i18next';

function LandingPage() {
  const { t } = useTranslation();
  
  const SLIDES = [
    {
      icon: '⚡',
      title: t('landing.slides.admin.title'),
      subtitle: t('landing.slides.admin.subtitle'),
      bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      stats: [
        { 
          v: t('landing.slides.admin.stats.users.value'), 
          l: t('landing.slides.admin.stats.users.label'), 
          c: 'bg-blue-500' 
        },
        { 
          v: t('landing.slides.admin.stats.orgs.value'), 
          l: t('landing.slides.admin.stats.orgs.label'), 
          c: 'bg-purple-500' 
        },
        { 
          v: t('landing.slides.admin.stats.uptime.value'), 
          l: t('landing.slides.admin.stats.uptime.label'), 
          c: 'bg-emerald-500' 
        }
      ]
    },
    // ... more slides
  ];
  
  return (
    // ... rest of component
  );
}
```

### STEP 5: Test in All Languages

1. Open the page in browser
2. Use language switcher to change to French - verify text changes
3. Change to Arabic - verify text changes AND RTL layout
4. Change back to English - verify everything looks correct

---

## 🎨 Common Scenarios

### Scenario 1: Simple Text

**Before:**
```jsx
<h1>Welcome to CogniCare</h1>
```

**After:**
```jsx
const { t } = useTranslation();
<h1>{t('landing.welcome.title')}</h1>
```

**en.json:**
```json
{ "landing": { "welcome": { "title": "Welcome to CogniCare" } } }
```

---

### Scenario 2: Text with Variables (Interpolation)

**Before:**
```jsx
<p>Hello, {userName}! You have {count} messages.</p>
```

**After:**
```jsx
const { t } = useTranslation();
<p>{t('dashboard.greeting', { userName, count })}</p>
```

**en.json:**
```json
{ "dashboard": { "greeting": "Hello, {{userName}}! You have {{count}} messages." } }
```

**fr.json:**
```json
{ "dashboard": { "greeting": "Bonjour, {{userName}}! Vous avez {{count}} messages." } }
```

---

### Scenario 3: Button Labels

**Before:**
```jsx
<button>Save</button>
<button>Cancel</button>
<button>Delete</button>
```

**After:**
```jsx
const { t } = useTranslation();
<button>{t('common.actions.save')}</button>
<button>{t('common.actions.cancel')}</button>
<button>{t('common.actions.delete')}</button>
```

**en.json:**
```json
{
  "common": {
    "actions": {
      "save": "Save",
      "cancel": "Cancel",
      "delete": "Delete"
    }
  }
}
```

---

### Scenario 4: Form Placeholders

**Before:**
```jsx
<input placeholder="Enter your email" />
<input placeholder="Enter your password" />
```

**After:**
```jsx
const { t } = useTranslation();
<input placeholder={t('forms.placeholders.email')} />
<input placeholder={t('forms.placeholders.password')} />
```

**en.json:**
```json
{
  "forms": {
    "placeholders": {
      "email": "Enter your email",
      "password": "Enter your password"
    }
  }
}
```

---

### Scenario 5: Error Messages

**Before:**
```jsx
throw new Error('Invalid email address');
```

**After:**
```jsx
const { t } = useTranslation();
throw new Error(t('errors.validation.invalidEmail'));
```

**en.json:**
```json
{
  "errors": {
    "validation": {
      "invalidEmail": "Invalid email address",
      "required": "This field is required",
      "passwordTooShort": "Password must be at least 6 characters"
    }
  }
}
```

---

### Scenario 6: Confirm Dialogs

**Before:**
```jsx
if (!confirm('Delete this user?')) return;
```

**After:**
```jsx
const { t } = useTranslation();
if (!confirm(t('confirms.deleteUser'))) return;
```

**en.json:**
```json
{
  "confirms": {
    "deleteUser": "Delete this user?",
    "cancelInvitation": "Cancel this invitation?",
    "removeStaff": "Remove this staff member?"
  }
}
```

---

### Scenario 7: Empty States

**Before:**
```jsx
{children.length === 0 && <p>No children found</p>}
```

**After:**
```jsx
const { t } = useTranslation();
{children.length === 0 && <p>{t('empty.noChildren')}</p>}
```

**en.json:**
```json
{
  "empty": {
    "noChildren": "No children found",
    "noData": "No data available",
    "noResults": "No results found"
  }
}
```

---

### Scenario 8: Excel Export Headers

**Before:**
```jsx
const headers = ['Full Name', 'Email', 'Phone', 'Role'];
const filename = 'staff_export.xlsx';
```

**After:**
```jsx
const { t } = useTranslation();
const headers = [
  t('export.headers.fullName'),
  t('export.headers.email'),
  t('export.headers.phone'),
  t('export.headers.role')
];
const filename = t('export.filenames.staff');
```

**en.json:**
```json
{
  "export": {
    "headers": {
      "fullName": "Full Name",
      "email": "Email",
      "phone": "Phone",
      "role": "Role"
    },
    "filenames": {
      "staff": "staff_export.xlsx",
      "families": "families_export.xlsx"
    }
  }
}
```

---

### Scenario 9: Dropdown Menu Items

**Before:**
```jsx
<MenuItem>Export Staff</MenuItem>
<MenuItem>Import Staff</MenuItem>
<MenuItem>Download Template</MenuItem>
```

**After:**
```jsx
const { t } = useTranslation();
<MenuItem>{t('orgDashboard.staff.actions.export')}</MenuItem>
<MenuItem>{t('orgDashboard.staff.actions.import')}</MenuItem>
<MenuItem>{t('orgDashboard.staff.actions.downloadTemplate')}</MenuItem>
```

---

### Scenario 10: Status Labels

**Before:**
```jsx
<span>{status === 'pending' ? 'Pending' : status === 'approved' ? 'Approved' : 'Rejected'}</span>
```

**After:**
```jsx
const { t } = useTranslation();
<span>{t(`status.${status}`)}</span>
```

**en.json:**
```json
{
  "status": {
    "pending": "Pending",
    "approved": "Approved",
    "rejected": "Rejected"
  }
}
```

---

## 🏷️ Translation Key Naming Conventions

### Structure
```
namespace.category.subcategory.key
```

### Examples

| Type | Pattern | Example |
|------|---------|---------|
| **Page Title** | `[page].title` | `adminUsers.title` |
| **Section Header** | `[page].[section].title` | `dashboard.stats.title` |
| **Button** | `common.actions.[action]` | `common.actions.save` |
| **Form Label** | `forms.labels.[field]` | `forms.labels.email` |
| **Placeholder** | `forms.placeholders.[field]` | `forms.placeholders.email` |
| **Validation** | `validation.[rule]` | `validation.required` |
| **Error** | `errors.[category].[type]` | `errors.auth.invalidCredentials` |
| **Confirm** | `confirms.[action]` | `confirms.deleteUser` |
| **Empty State** | `empty.[context]` | `empty.noChildren` |
| **Status** | `status.[value]` | `status.pending` |

### Best Practices

✅ **DO:**
- Use camelCase for keys: `invalidEmail` not `invalid_email`
- Be specific: `adminUsers.deleteConfirm` not `deleteConfirm`
- Group related keys in namespaces
- Use consistent naming patterns
- Keep keys short but descriptive

❌ **DON'T:**
- Use spaces in keys
- Use special characters (except dots)
- Make keys too long: `this.is.way.too.many.levels.deep`
- Duplicate keys across namespaces unnecessarily

---

## 🧪 Testing Your Changes

### Step 1: Visual Test
1. Start dev server: `npm run dev`
2. Open page in browser
3. Click language switcher (top right)
4. Change to French - all text should change
5. Change to Arabic - text should change + RTL layout
6. Change back to English

### Step 2: Missing Keys Test
Open browser console (F12) and look for:
```
Missing translation: "some.key.name"
```
If you see this, you forgot to add that key to the translation files.

### Step 3: RTL Layout Test
When testing Arabic:
- Text should be right-aligned
- Menus should open from left
- Icons should be mirrored (where appropriate)
- Flex/Grid layouts should reverse
- Padding/Margins should reverse

### Step 4: Interpolation Test
If using variables:
```jsx
t('message', { userName: 'John', count: 5 })
```
Verify the variables are replaced correctly in all languages.

### Step 5: Fallback Test
Use a translation with fallback:
```jsx
t('some.key', 'Fallback text')
```
Temporarily remove the key from en.json and verify the fallback displays.

---

## 🔍 Common Mistakes to Avoid

### Mistake 1: Forgetting to Import useTranslation
```jsx
❌ function MyComponent() {
  return <h1>{t('title')}</h1>; // Error: t is not defined
}

✅ import { useTranslation } from 'react-i18next';
   function MyComponent() {
     const { t } = useTranslation();
     return <h1>{t('title')}</h1>;
   }
```

### Mistake 2: Using t() Outside Component
```jsx
❌ const TITLE = t('title'); // Error: Invalid hook call
   function MyComponent() {
     return <h1>{TITLE}</h1>;
   }

✅ function MyComponent() {
     const { t } = useTranslation();
     const TITLE = t('title');
     return <h1>{TITLE}</h1>;
   }
```

### Mistake 3: Hardcoding in Constants
```jsx
❌ const TABS = ['All', 'PECS', 'TEACCH']; // Outside component

✅ function MyComponent() {
     const { t } = useTranslation();
     const TABS = [
       t('plans.filters.all'),
       t('plans.filters.pecs'),
       t('plans.filters.teacch')
     ];
   }
```

### Mistake 4: Forgetting Translation Files
```jsx
✅ en.json - Added key
❌ fr.json - Forgot to add
❌ ar.json - Forgot to add
```
Always add keys to ALL THREE files!

### Mistake 5: Wrong Interpolation Syntax
```jsx
❌ t('message', { name }) // en.json: "Hello, {name}!"
✅ t('message', { name }) // en.json: "Hello, {{name}}!"
```
Use double curly braces `{{variable}}` in JSON!

---

## 🚀 Quick Start Checklist

For each hardcoded text you find:

1. [ ] Identify the text and its context
2. [ ] Choose appropriate namespace and key name
3. [ ] Add key to `en.json` with English text
4. [ ] Add key to `fr.json` with French translation
5. [ ] Add key to `ar.json` with Arabic translation
6. [ ] Import `useTranslation` in component (if not already)
7. [ ] Replace hardcoded text with `t('namespace.key')`
8. [ ] Test in browser (en/fr/ar)
9. [ ] Check browser console for errors
10. [ ] Verify RTL layout for Arabic

---

## 📚 Resources

- **React i18next Docs:** https://react.i18next.com/
- **Translation Files:** `src/locales/en.json`, `fr.json`, `ar.json`
- **Complete Audit Report:** `COMPLETE_I18N_AUDIT_REPORT.md`
- **Progress Tracker:** `I18N_FIX_PROGRESS_TRACKER.md`

---

**Last Updated:** April 29, 2026  
**Need Help?** Check the audit report for specific examples from your codebase!
