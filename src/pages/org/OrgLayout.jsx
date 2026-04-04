import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SidebarLayout from '../../components/layouts/SidebarLayout';
import SEOHead from '../../components/SEOHead';

export default function OrgLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('orgLeaderUser');
    if (!stored) { navigate('/org/login'); return; }
    try { setUser(JSON.parse(stored)); } catch { navigate('/org/login'); }
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
    { to: '/org/dashboard/invitations', icon: 'mail', label: t('orgDashboard.tabs.invitations', 'Invitations') },
    { to: '/org/dashboard/rne-verification', icon: 'fact_check', label: t('orgDashboard.tabs.rneVerification', 'RNE Verification') },
  ];

  const bottomItems = [
    { to: '/org/dashboard/settings', icon: 'settings', label: t('common.settings', 'Settings') },
  ];

  if (!user) return null;

  return (
    <SidebarLayout
      title={t('orgDashboard.title', 'Organization Dashboard')}
      subtitle={t('orgDashboard.subtitle', 'Org Leader Console')}
      brandName={t('orgDashboard.brand', 'Org Console')}
      brandIcon="corporate_fare"
      navItems={navItems}
      bottomItems={bottomItems}
      user={user}
      onLogout={handleLogout}
      headerActions={null}
      seoHead={<SEOHead title="Organization Dashboard" path="/org/dashboard" noindex />}
    >
      <Outlet />
    </SidebarLayout>
  );
}
