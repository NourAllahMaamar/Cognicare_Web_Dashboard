import { useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../ui/ThemeToggle';
import logo from '../../assets/app_logo_withoutbackground.png';

export default function SidebarLayout({
  children,
  title,
  subtitle,
  brandName = 'CogniCare',
  // brandIcon = 'neurology', // unused
  navItems = [],
  bottomItems = [],
  user = null,
  onLogout,
  headerActions = null,
}) {
  const { t } = useTranslation();
  const _navigate = useNavigate();
  const _location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change
  const handleNavClick = () => setMobileOpen(false);

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 p-6">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
            <img src={logo} alt="CogniCare" className="w-8 h-8 object-contain" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold leading-none">{brandName}</h1>
            <p className="text-xs text-slate-500 dark:text-text-muted mt-1">{subtitle}</p>
          </div>
          {/* Close button - mobile only */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1 px-4">
          {navItems.map((item) => (
            <NavLink
              key={item.to || item.path}
              to={item.to || item.path}
              end={item.end}
              onClick={handleNavClick}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white shadow-md shadow-primary/20'
                    : 'text-slate-600 dark:text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800/50'
                }`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && (
                <span className="ml-auto text-xs bg-error text-white px-1.5 py-0.5 rounded-full font-bold">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Bottom */}
      <div className="flex flex-col gap-1 p-4 border-t border-slate-300 dark:border-slate-800">
        {bottomItems.map((item) => (
          <NavLink
            key={item.to || item.path}
            to={item.to || item.path}
            onClick={handleNavClick}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-600 dark:text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
        {onLogout && (
          <button
            onClick={() => { onLogout(); handleNavClick(); }}
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-error hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors w-full"
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            <span>{t('common.logout', 'Log Out')}</span>
          </button>
        )}
        {user && (
          <div className="flex items-center gap-3 px-2 py-3 mt-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
              {(user.fullName || user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-xs font-bold truncate">{user.fullName || user.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 dark:text-text-muted truncate">{user.role || ''}</p>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-bg-light dark:bg-bg-dark">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col justify-between border-r border-slate-300 dark:border-slate-800 bg-white dark:bg-surface-dark md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-72 flex flex-col justify-between bg-white dark:bg-surface-dark shadow-2xl animate-slide-in">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 border-b border-slate-300 dark:border-slate-800 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-md px-4 md:px-6 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            {/* Hamburger - mobile only */}
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 md:hidden"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h2 className="text-lg md:text-xl font-bold tracking-tight">{title}</h2>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {headerActions}
            <ThemeToggle />
            <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
