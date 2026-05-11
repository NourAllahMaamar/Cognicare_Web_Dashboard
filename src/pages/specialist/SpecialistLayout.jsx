import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '../../components/layouts/SidebarLayout';
import SEOHead from '../../components/SEOHead';
import DashboardAssistant from '../../components/assistant/DashboardAssistant';
import { DashboardAssistantProvider } from '../../assistant/DashboardAssistantContext';
import { useAuth } from '../../hooks/useAuth';

const specialistRoles = [
  'psychologist',
  'speech_therapist',
  'occupational_therapist',
  'doctor',
  'volunteer',
  'careProvider',
];

export default function SpecialistLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { ensureSession, logout } = useAuth('specialist');
  const [user, setUser] = useState(null);

  useEffect(() => {
    let cancelled = false;
    ensureSession().then((session) => {
      if (cancelled) return;
      const u = session?.user;
      if (!u || !specialistRoles.includes(u.role)) {
        navigate('/specialist/login');
        return;
      }
      setUser(u);
    });
    return () => {
      cancelled = true;
    };
  }, [ensureSession, navigate]);

  const navItems = [
    { to: '/specialist/dashboard', icon: 'dashboard', label: t('specialistDashboard.tabs.overview', 'Overview'), end: true },
    { to: '/specialist/dashboard/children', icon: 'child_care', label: t('specialistDashboard.tabs.children', 'Children') },
    { to: '/specialist/dashboard/plans', icon: 'assignment', label: t('specialistDashboard.tabs.myPlans', 'My Plans') },
    { to: '/specialist/dashboard/support', icon: 'support_agent', label: t('specialistDashboard.tabs.support', 'Support') },
  ];

  const bottomItems = [
    { to: '/specialist/dashboard/settings', icon: 'settings', label: t('common.settings', 'Settings') },
  ];

  if (!user) return null;

  return (
    <DashboardAssistantProvider>
      <SidebarLayout
        title={t('specialistDashboard.title', 'Specialist Dashboard')}
        subtitle={t('specialistDashboard.subtitle', 'Professional Suite')}
        brandName={t('specialistDashboard.brand', 'Specialist')}
        brandIcon="stethoscope"
        navItems={navItems}
        bottomItems={bottomItems}
        user={user}
        onLogout={logout}
        headerActions={<DashboardAssistant role="specialist" />}
        seoHead={<SEOHead title="Specialist Dashboard" path="/specialist/dashboard" noindex />}
      >
        <Outlet />
      </SidebarLayout>
    </DashboardAssistantProvider>
  );
}
