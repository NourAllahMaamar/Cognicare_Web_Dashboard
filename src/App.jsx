import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Home from './pages/home/Home';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import OrgLeaderLogin from './pages/org-leader/OrgLeaderLogin';
import OrgLeaderDashboard from './pages/org-leader/OrgLeaderDashboard';
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
      </Routes>
    </Router>
  )
}

export default App
