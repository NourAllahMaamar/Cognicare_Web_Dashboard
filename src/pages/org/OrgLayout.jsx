import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '../../components/layouts/SidebarLayout';
import SEOHead from '../../components/SEOHead';
import DashboardAssistant from '../../components/assistant/DashboardAssistant';
import { DashboardAssistantProvider } from '../../assistant/DashboardAssistantContext';
import OrgOnboardingModal from '../../components/onboarding/OrgOnboardingModal';

export default function OrgLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('orgLeaderUser');
    if (!stored) { navigate('/org/login'); return; }
    try { 
      setUser(JSON.parse(stored)); 
      
      // Check if onboarding has been completed
      const onboardingComplete = localStorage.getItem('orgLeaderOnboardingComplete');
      if (!onboardingComplete) {
        setShowOnboarding(true);
      }
    } catch { navigate('/org/login'); }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('orgLeaderToken');
    localStorage.removeItem('orgLeaderRefreshToken');
    localStorage.removeItem('orgLeaderUser');
    navigate('/org/login');
  };

  const navItems = [
    { to: '/org/dashboard', icon: 'dashboard', label: t('orgDashboard.tabs.overview', 'Overview'), end: true },
    { to: '/org/dashboard/staff', icon: 'groups', label: t('orgDashboard.tabs.staff', 'Staff') },
    { to: '/org/dashboard/families', icon: 'family_restroom', label: t('orgDashboard.tabs.families', 'Families') },
    { to: '/org/dashboard/children', icon: 'child_care', label: t('orgDashboard.tabs.children', 'Children') },
    { to: '/org/dashboard/community', icon: 'forum', label: t('orgDashboard.tabs.community', 'Community') },
    { to: '/org/dashboard/marketplace', icon: 'shopping_bag', label: t('orgDashboard.tabs.marketplace', 'Marketplace') },
    { to: '/org/dashboard/invitations', icon: 'mail', label: t('orgDashboard.tabs.invitations', 'Invitations') },
    { to: '/org/dashboard/rne-verification', icon: 'fact_check', label: t('orgDashboard.tabs.rneVerification', 'RNE Verification') },
    { to: '/org/dashboard/support', icon: 'support_agent', label: t('orgDashboard.tabs.support', 'Support') },
  ];

  const bottomItems = [
    { to: '/org/dashboard/settings', icon: 'settings', label: t('common.settings', 'Settings') },
  ];

  if (!user) return null;

  return (
    <DashboardAssistantProvider>
      {showOnboarding && <OrgOnboardingModal onComplete={() => setShowOnboarding(false)} />}
      <SidebarLayout
        title={t('orgDashboard.title', 'Organization Dashboard')}
        subtitle={t('orgDashboard.subtitle', 'Org Leader Console')}
        brandName={t('orgDashboard.brand', 'Org Console')}
        brandIcon="corporate_fare"
        navItems={navItems}
        bottomItems={bottomItems}
        user={user}
        onLogout={handleLogout}
        headerActions={<DashboardAssistant role="orgLeader" />}
        seoHead={<SEOHead title="Organization Dashboard" path="/org/dashboard" noindex />}
      >
        <Outlet />
      </SidebarLayout>
    </DashboardAssistantProvider>
  );
}
