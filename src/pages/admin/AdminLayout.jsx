import { useState, useEffect, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import SidebarLayout from '../../components/layouts/SidebarLayout';
import { useAuth } from '../../hooks/useAuth';

export default function AdminLayout() {
  const { getUser, logout } = useAuth('admin');
  const navigate = useNavigate();
  const location = useLocation();
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
    { path: '/admin/dashboard', icon: 'dashboard', label: 'Dashboard', end: true },
    { path: '/admin/dashboard/organizations', icon: 'corporate_fare', label: 'Organizations' },
    { path: '/admin/dashboard/users', icon: 'group', label: 'Users' },
    { path: '/admin/dashboard/families', icon: 'family_restroom', label: 'Families' },
    { path: '/admin/dashboard/reviews', icon: 'shield', label: 'Org Reviews' },
    { path: '/admin/dashboard/analytics', icon: 'bar_chart', label: 'Analytics' },
    { path: '/admin/dashboard/system-health', icon: 'monitor_heart', label: 'System Health' },
  ];

  const bottomItems = [
    { path: '/admin/dashboard/settings', icon: 'settings', label: 'Settings' },
  ];

  const headerActions = (
    <button
      onClick={() => window.location.reload()}
      className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-primary transition-colors"
    >
      <span className="material-symbols-outlined text-lg">refresh</span>
      Refresh
    </button>
  );

  if (!user) return null;

  return (
    <SidebarLayout
      title="System Oversight"
      subtitle="Admin Console"
      brandName="Admin Console"
      brandIcon="admin_panel_settings"
      navItems={navItems}
      bottomItems={bottomItems}
      user={user}
      onLogout={logout}
      headerActions={headerActions}
    >
      <Outlet />
    </SidebarLayout>
  );
}
