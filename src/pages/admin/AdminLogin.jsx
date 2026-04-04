import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { API_BASE_URL } from '../../config';
import logo from '../../assets/app_logo_withoutbackground.png';

function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('dashboard.messages.loginFailed'));
      }

      if (data.user.role !== 'admin') {
        throw new Error(t('adminLogin.accessDenied'));
      }

      localStorage.setItem('adminToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('adminRefreshToken', data.refreshToken);
      }
      localStorage.setItem('adminUser', JSON.stringify(data.user));
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-bg-light dark:bg-bg-dark font-display">
      <SEOHead
        title="Admin Login"
        description="Sign in to the CogniCare admin dashboard to manage users, organizations, and platform analytics."
        path="/admin/login"
      />
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-slate-800 to-primary/30 relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/5 rounded-full" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-white shadow-2xl shadow-primary/40 mx-auto mb-8">
            <span className="material-symbols-outlined text-3xl">admin_panel_settings</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-4">System Administration</h2>
          <p className="text-slate-300 text-sm leading-relaxed">Full platform oversight "” manage organizations, users, fraud review, and system health from a single powerful console.</p>
          <div className="flex gap-4 justify-center mt-10">
            {['shield', 'monitoring', 'analytics'].map(icon => (
              <div key={icon} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/70">
                <span className="material-symbols-outlined text-lg">{icon}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 sm:p-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium">
            <span className="material-symbols-outlined text-lg">arrow_back</span>
            {t('adminLogin.backToHome', 'Back to Home')}
          </button>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                <img src={logo} alt="CogniCare" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight">CogniCare</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight mb-1">{t('adminLogin.title', 'Admin Login')}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">{t('adminLogin.subtitle', 'Sign in to the administration console')}</p>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              {error && (
                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium">
                  <span className="material-symbols-outlined text-lg shrink-0">error</span>
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('adminLogin.email', 'Email')}</label>
                <input
                  type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@cognicare.com" required autoComplete="email"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('adminLogin.password', 'Password')}</label>
                <input
                  type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required autoComplete="current-password"
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <button type="submit" disabled={loading}
                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2">
                {loading ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('adminLogin.signing', 'Signing in...')}</>
                ) : t('adminLogin.signIn', 'Sign In')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;

