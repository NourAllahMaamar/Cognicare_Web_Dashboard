# Agent Guidance - CogniCare Web Dashboard

**Strict adherence required.** This guide maximizes agent efficiency for the CogniCare React web dashboard.

## Project Context

The CogniCare Web Dashboard is a **React-based admin/specialist interface** for the CogniCare healthcare platform:
- **React 19** with Vite build system
- **TailwindCSS** for styling
- **i18next** for internationalization (English/French/Arabic)
- **Role-based dashboards**: Admin, Specialist, Organization Leader, Family
- **Real-time features**: Appointments, analytics, fraud detection
- **AI integration**: Progress recommendations, training courses, gaze analysis

## Critical Rules (Non-Negotiable)

### 1. API Integration
- **Base URL**: Use `API_BASE_URL` from `src/config.js`
- **Authentication**: Use `useAuth(role)` hook for role-specific API calls
- **Error handling**: Always catch 401 and redirect to appropriate login

### 2. Healthcare Data Privacy
- **Never** log PII (personally identifiable information)
- **Always** verify user has permission before displaying child/family data
- Use `useAuth()` hooks to enforce role-based access

### 3. Role-Based Access Control
```
admin → organization_leader → specialist → family
```
**Rule**: Each page/component must check the correct role before rendering sensitive data.

### 4. Component Patterns
```jsx
// ✅ Good: Proper error handling and loading states
export default function AdminUsers() {
  const { authGet } = useAuth('admin');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await authGet('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  // ...
}

// ❌ Bad: Missing error handling, no loading state
function BadComponent() {
  const [data, setData] = useState([]);
  useEffect(() => {
    fetch('/api/data').then(r => r.json()).then(setData);
  }, []);
  return <div>{data.map(...)}</div>;
}
```

## Task Routing

| Request Type | Start Here |
|--------------|-----------|
| Admin dashboard changes | `src/pages/admin/` |
| Specialist features | `src/pages/specialist/` |
| Organization leader views | `src/pages/organization/` |
| Family portal | `src/pages/family/` |
| Shared components | `src/components/` |
| API integration | `src/apiClient.js`, `src/hooks/useAuth.js` |
| Internationalization | `src/locales/`, `src/i18n.js` |

## Code Quality Standards

### React Patterns
```jsx
// ✅ Good: useCallback for stable references
const handleUnauthorized = useCallback(() => {
  localStorage.removeItem('token');
  navigate('/login');
}, [navigate]);

// ✅ Good: useEffect with cleanup
useEffect(() => {
  const interval = setInterval(fetchData, 30000);
  return () => clearInterval(interval);
}, [fetchData]);
```

### Error Handling
```jsx
// ✅ Good
const loadData = async () => {
  try {
    const data = await authGet('/endpoint');
    setData(Array.isArray(data) ? data : []);
  } catch (err) {
    if (err.status === 401) {
      handleUnauthorized();
      return;
    }
    setError(err.message || 'Failed to load data');
  }
};
```

### Type Safety
```jsx
// ✅ Good: Type-safe array checks
const items = Array.isArray(data) ? data : [];

// ✅ Good: Safe property access
const name = user?.fullName ?? 'Unknown';

// ❌ Bad: Unchecked array operations
const first = data[0]; // May fail if data is not array
```

## ESLint Rules (Important)

```javascript
// eslint.config.js
{
  'no-unused-vars': ['warn', { varsIgnorePattern: '^(_|[A-Z])' }],
  'react-hooks/rules-of-hooks': 'warn',
  'react-hooks/exhaustive-deps': 'off', // Disabled for flexibility
  'react-refresh/only-export-components': ['warn'],
}
```

**Note**: `exhaustive-deps` is intentionally disabled - be careful with `useEffect` dependencies.

## High-Value Files to Inspect First

### Core
- `src/App.jsx` - Main routing and layout
- `src/config.js` - Environment configuration
- `src/apiClient.js` - API request utilities
- `src/i18n.js` - Translation setup

### Hooks
- `src/hooks/useAuth.js` - Authentication hook
- `src/hooks/useTheme.js` - Theme/dark mode

### Components
- `src/components/ui/StatCard.jsx`
- `src/components/ui/StatusBadge.jsx`

### Pages
- `src/pages/admin/AdminDashboard.jsx`
- `src/pages/specialist/SpecialistOverview.jsx`
- `src/pages/family/FamilyDashboard.jsx`

## Validation Commands

```bash
# Lint check
cd /Users/mac/pim/cognicareweb && npm run lint

# Build check
cd /Users/mac/pim/cognicareweb && npm run build

# Dev server
cd /Users/mac/pim/cognicareweb && npm run dev
```

## Documentation Updates

When changing behavior, update:
- `README.md` if user-facing feature
- `AGENTS.md` if changing agent guidance
- Component JSDoc comments for complex logic

## Cross-Surface Consistency

When backend API changes:
1. Update the corresponding page in `src/pages/`
2. Check `src/apiClient.js` for request/response handling
3. Verify role-based access matches backend guards

## Git Workflow

```bash
# Check status
git status --short

# Stage changes
git add src/pages/specific/file.jsx

# Commit
git commit -m "feat(admin): add user filtering

- Add search by name/email
- Add role filter dropdown
- Update AdminUsers component"

git push origin main
```

## Security Checklist

- [ ] No hardcoded API keys in source
- [ ] Token stored securely in localStorage only
- [ ] 401 errors handled with redirect to login
- [ ] No PII in console logs
- [ ] Role checks before rendering admin features

## Pitfalls to Avoid

### ❌ Don't
- Skip error handling for API calls
- Use `any` types without eslint-disable
- Log sensitive user data
- Forget to handle 401 unauthorized
- Modify unrelated files "while you're there"

### ✅ Do
- Test with `npm run lint` before committing
- Use `useAuth()` for all authenticated requests
- Handle loading and error states
- Keep components focused and single-purpose
- Use translation keys for all user-facing text

## Decision Hierarchy

When uncertain:
1. **Source code** (what actually runs)
2. **This AGENTS.md** (project-specific rules)
3. **Backend API docs** (`cognicare/project-architecture/API_MAP.md`)
4. **User request** (clarify if contradictory)

---

**Remember**: Healthcare dashboard. Data privacy and reliability > feature velocity.
