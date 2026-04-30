import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import SidebarLayout from '../../components/layouts/SidebarLayout';
import SEOHead from '../../components/SEOHead';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';
import DashboardAssistant from '../../components/assistant/DashboardAssistant';
import { DashboardAssistantProvider } from '../../assistant/DashboardAssistantContext';

export default function AdminLayout() {
  const { getUser, logout } = useAuth('admin');
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = getUser();
    if (!u || u.role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    setUser(u);
  }, []);

  const navItems = [
    { path: '/admin/dashboard', icon: 'dashboard', label: t('adminLayout.dashboard'), end: true },
    { path: '/admin/dashboard/organizations', icon: 'corporate_fare', label: t('adminLayout.organizations') },
    { path: '/admin/dashboard/users', icon: 'group', label: t('adminLayout.users') },
    { path: '/admin/dashboard/families', icon: 'family_restroom', label: t('adminLayout.families') },
    { path: '/admin/dashboard/reviews', icon: 'shield', label: t('adminLayout.orgReviews') },
    { path: '/admin/dashboard/training', icon: 'school', label: t('adminLayout.trainingCourses') },
    { path: '/admin/dashboard/caregiver-applications', icon: 'how_to_reg', label: t('adminLayout.applications') },
    { path: '/admin/dashboard/analytics', icon: 'bar_chart', label: t('adminLayout.analytics') },
    { path: '/admin/dashboard/system-health', icon: 'monitor_heart', label: t('adminLayout.systemHealth') },
    { path: '/admin/dashboard/support', icon: 'support_agent', label: t('adminLayout.support', 'Support Tickets') },
  ];

  const bottomItems = [
    { path: '/admin/dashboard/settings', icon: 'settings', label: t('adminLayout.settings') },
  ];

  const headerActions = (
    <>
      <DashboardAssistant role="admin" />
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
      >
        <span className="material-symbols-outlined text-lg">refresh</span>
        {t('adminLayout.refresh')}
      </button>
    </>
  );

  if (!user) return null;

  return (
    <DashboardAssistantProvider>
      <SidebarLayout
        title={t('adminLayout.title')}
        subtitle={t('adminLayout.subtitle')}
        brandName={t('adminLayout.brandName')}
        brandIcon="admin_panel_settings"
        navItems={navItems}
        bottomItems={bottomItems}
        user={user}
        onLogout={logout}
        headerActions={headerActions}
        seoHead={<SEOHead title={t('adminLayout.seoTitle')} path="/admin/dashboard" noindex />}
      >
        <Outlet />
      </SidebarLayout>
    </DashboardAssistantProvider>
  );
}
