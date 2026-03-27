import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '../../components/layouts/SidebarLayout';

export default function SpecialistLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  const isAllowedRole = (role) => {
    const normalized = String(role ?? '').toLowerCase();
    return (
      normalized === 'careprovider' ||
      normalized === 'volunteer' ||
      normalized === 'psychologist' ||
      normalized === 'speech_therapist' ||
      normalized === 'occupational_therapist' ||
      normalized === 'doctor' ||
      normalized === 'other'
    );
  };

  useEffect(() => {
    const stored = localStorage.getItem('specialistUser');
    if (!stored) { navigate('/specialist/login'); return; }
    try {
      const parsed = JSON.parse(stored);
      if (!isAllowedRole(parsed?.role)) {
        navigate('/specialist/login');
        return;
      }
      setUser(parsed);
    } catch {
      navigate('/specialist/login');
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('specialistToken');
    localStorage.removeItem('specialistRefreshToken');
    localStorage.removeItem('specialistUser');
    navigate('/specialist/login');
  };

  const navItems = [
    { to: '/specialist/dashboard', icon: 'dashboard', label: t('specialistDashboard.tabs.overview', 'Overview'), end: true },
    { to: '/specialist/dashboard/children', icon: 'child_care', label: t('specialistDashboard.tabs.children', 'Children') },
    { to: '/specialist/dashboard/plans', icon: 'assignment', label: t('specialistDashboard.tabs.myPlans', 'My Plans') },
  ];

  const bottomItems = [
    { to: '/specialist/dashboard/settings', icon: 'settings', label: t('common.settings', 'Settings') },
  ];

  if (!user) return null;

  return (
    <SidebarLayout
      title={t('specialistDashboard.title', 'Specialist Dashboard')}
      subtitle={t('specialistDashboard.subtitle', 'Professional Suite')}
      brandName={t('specialistDashboard.brand', 'Specialist')}
      brandIcon="stethoscope"
      navItems={navItems}
      bottomItems={bottomItems}
      user={user}
      onLogout={handleLogout}
    >
      <Outlet />
    </SidebarLayout>
  );
}
