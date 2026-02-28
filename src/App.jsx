import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './App.css';

// Lazy-loaded pages — each becomes its own chunk
const LandingPage = lazy(() => import('./pages/home/LandingPage'));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout'));
const AdminOverview = lazy(() => import('./pages/admin/AdminOverview'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminOrganizations = lazy(() => import('./pages/admin/AdminOrganizations'));
const AdminFamilies = lazy(() => import('./pages/admin/AdminFamilies'));
const AdminFraudReview = lazy(() => import('./pages/admin/AdminFraudReview'));
const AdminSystemHealth = lazy(() => import('./pages/admin/AdminSystemHealth'));
const AdminAnalytics = lazy(() => import('./pages/admin/AdminAnalytics'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const OrgLayout = lazy(() => import('./pages/org/OrgLayout'));
const OrgOverview = lazy(() => import('./pages/org/OrgOverview'));
const OrgStaff = lazy(() => import('./pages/org/OrgStaff'));
const OrgFamilies = lazy(() => import('./pages/org/OrgFamilies'));
const OrgChildren = lazy(() => import('./pages/org/OrgChildren'));
const OrgInvitations = lazy(() => import('./pages/org/OrgInvitations'));
const OrgLeaderLogin = lazy(() => import('./pages/org-leader/OrgLeaderLogin'));
const OrgSpecialistDetail = lazy(() => import('./pages/org-leader/OrgSpecialistDetail'));
const SpecialistLayout = lazy(() => import('./pages/specialist/SpecialistLayout'));
const SpecialistOverview = lazy(() => import('./pages/specialist/SpecialistOverview'));
const SpecialistChildren = lazy(() => import('./pages/specialist/SpecialistChildren'));
const SpecialistPlans = lazy(() => import('./pages/specialist/SpecialistPlans'));
const SpecialistLogin = lazy(() => import('./pages/specialist/SpecialistLogin'));
const PECSBoardCreator = lazy(() => import('./pages/specialist/PECSBoardCreator'));
const TEACCHTrackerCreator = lazy(() => import('./pages/specialist/TEACCHTrackerCreator'));
const ActivitiesCreator = lazy(() => import('./pages/specialist/ActivitiesCreator'));
const SkillTrackerCreator = lazy(() => import('./pages/specialist/SkillTrackerCreator'));
const ProgressAIRecommendations = lazy(() => import('./pages/specialist/ProgressAIRecommendations'));
const SettingsPage = lazy(() => import('./pages/shared/SettingsPage'));
const NotFound = lazy(() => import('./pages/shared/NotFound'));
const ConfirmAccount = lazy(() => import('./pages/ConfirmAccount'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-bg-dark">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-400 font-medium">Loading…</p>
      </div>
    </div>
  );
}

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Set initial direction based on saved language
    const currentLang = i18n.language;
    if (currentLang === 'ar') {
      document.documentElement.setAttribute('dir', 'rtl');
      document.documentElement.setAttribute('lang', 'ar');
    } else {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', currentLang);
    }

    // Listen for language changes
    const handleLanguageChange = (lng) => {
      if (lng === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', lng);
      }
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return (
    <Router>
      <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Landing */}
        <Route path="/" element={<LandingPage />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin/dashboard" element={<AdminLayout />}>
          <Route index element={<AdminOverview />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="organizations" element={<AdminOrganizations />} />
          <Route path="families" element={<AdminFamilies />} />
          <Route path="reviews" element={<AdminFraudReview />} />
          <Route path="analytics" element={<AdminAnalytics />} />
          <Route path="system-health" element={<AdminSystemHealth />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Org Leader */}
        <Route path="/org/login" element={<OrgLeaderLogin />} />
        <Route path="/org" element={<Navigate to="/org/dashboard" replace />} />
        <Route path="/org-leader/*" element={<Navigate to="/org/dashboard" replace />} />
        <Route path="/org/dashboard" element={<OrgLayout />}>
          <Route index element={<OrgOverview />} />
          <Route path="staff" element={<OrgStaff />} />
          <Route path="families" element={<OrgFamilies />} />
          <Route path="children" element={<OrgChildren />} />
          <Route path="invitations" element={<OrgInvitations />} />
          <Route path="specialist/:specialistId" element={<OrgSpecialistDetail />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Specialist */}
        <Route path="/specialist/login" element={<SpecialistLogin />} />
        <Route path="/specialist" element={<Navigate to="/specialist/dashboard" replace />} />
        <Route path="/specialist/dashboard" element={<SpecialistLayout />}>
          <Route index element={<SpecialistOverview />} />
          <Route path="children" element={<SpecialistChildren />} />
          <Route path="plans" element={<SpecialistPlans />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>
        <Route path="/specialist/pecs/create" element={<PECSBoardCreator />} />
        <Route path="/specialist/teacch/create" element={<TEACCHTrackerCreator />} />
        <Route path="/specialist/activities" element={<ActivitiesCreator />} />
        <Route path="/specialist/skill-tracker" element={<SkillTrackerCreator />} />
        <Route path="/specialist/ai-recommendations/:childId" element={<ProgressAIRecommendations />} />

        {/* Misc */}
        <Route path="/confirm-account" element={<ConfirmAccount />} />

        {/* Legacy redirects */}
        <Route path="/healthcare" element={<Navigate to="/specialist/dashboard" replace />} />
        <Route path="/healthcare/dashboard" element={<Navigate to="/specialist/dashboard" replace />} />

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
    </Router>
  )
}

export default App
