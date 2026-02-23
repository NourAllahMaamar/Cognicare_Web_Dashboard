import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/home/Home';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import OrgLeaderLogin from './pages/org-leader/OrgLeaderLogin';
import OrgLeaderDashboard from './pages/org-leader/OrgLeaderDashboard';
import ConfirmAccount from './pages/ConfirmAccount';
import SpecialistLogin from './pages/specialist/SpecialistLogin';
import SpecialistDashboard from './pages/specialist/SpecialistDashboard';
import PECSBoardCreator from './pages/specialist/PECSBoardCreator';
import TEACCHTrackerCreator from './pages/specialist/TEACCHTrackerCreator';
import ActivitiesCreator from './pages/specialist/ActivitiesCreator';
import SkillTrackerCreator from './pages/specialist/SkillTrackerCreator';
import ProgressAIRecommendations from './pages/specialist/ProgressAIRecommendations';
import OrgSpecialistDetail from './pages/org-leader/OrgSpecialistDetail';
import './App.css'

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
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/org/login" element={<OrgLeaderLogin />} />
        <Route path="/org/dashboard" element={<OrgLeaderDashboard />} />
        <Route path="/org/specialist/:specialistId" element={<OrgSpecialistDetail />} />
        <Route path="/confirm-account" element={<ConfirmAccount />} />
        <Route path="/specialist/login" element={<SpecialistLogin />} />
        <Route path="/specialist/dashboard" element={<SpecialistDashboard />} />
        <Route path="/specialist/pecs/create" element={<PECSBoardCreator />} />
        <Route path="/specialist/teacch/create" element={<TEACCHTrackerCreator />} />
        <Route path="/specialist/activities" element={<ActivitiesCreator />} />
        <Route path="/specialist/skill-tracker" element={<SkillTrackerCreator />} />
        <Route path="/specialist/ai-recommendations/:childId" element={<ProgressAIRecommendations />} />
        {/* Healthcare routes: same as specialist dashboard (so /healthcare/dashboard is not blank) */}
        <Route path="/healthcare" element={<Navigate to="/specialist/dashboard" replace />} />
        <Route path="/healthcare/dashboard" element={<SpecialistDashboard />} />
      </Routes>
    </Router>
  )
}

export default App
