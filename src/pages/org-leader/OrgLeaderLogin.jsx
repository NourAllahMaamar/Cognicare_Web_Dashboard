import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { API_BASE_URL } from '../../config';
import { parseJsonResponse } from '../../utils/parseJsonResponse';
import logo from '../../assets/app_logo_withoutbackground.png';

function OrgLeaderLogin() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [certificatePdf, setCertificatePdf] = useState(null);
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const initialMode = params.get('mode');
    if (initialMode === 'signup' || initialMode === 'login') setMode(initialMode);
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password }) });
      const data = await parseJsonResponse(response, t('dashboard.messages.loginFailed'));
      if (!response.ok) throw new Error(data.message || t('dashboard.messages.loginFailed'));
      if (data.user.role !== 'organization_leader') throw new Error(t('orgLeaderLogin.accessDenied'));
      localStorage.setItem('orgLeaderToken', data.accessToken);
      localStorage.setItem('orgLeaderRefreshToken', data.refreshToken);
      localStorage.setItem('orgLeaderUser', JSON.stringify(data.user));
      navigate('/org/dashboard');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (!certificatePdf) { setError(t('orgLeaderLogin.certificateRequired', 'Organization certificate (PDF) is required')); setLoading(false); return; }
      const response = await fetch(`${API_BASE_URL}/auth/send-verification-code`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      const data = await parseJsonResponse(response, t('dashboard.messages.verificationCodeFailed'));
      if (!response.ok) throw new Error(data.message || t('dashboard.messages.verificationCodeFailed'));
      setCodeSent(true);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('password', password);
      formData.append('fullName', fullName);
      formData.append('phone', phone);
      formData.append('role', 'organization_leader');
      formData.append('organizationName', organizationName);
      formData.append('verificationCode', verificationCode);
      if (certificatePdf) formData.append('certificate', certificatePdf);
      const response = await fetch(`${API_BASE_URL}/auth/signup`, { method: 'POST', body: formData });
      const data = await parseJsonResponse(response, t('dashboard.messages.signupFailed'));
      if (!response.ok) throw new Error(data.message || t('dashboard.messages.signupFailed'));
      if (data.requiresApproval) {
        setSuccess(data.message || t('dashboard.messages.orgCreatedPending'));
        setCodeSent(false); setVerificationCode(''); setEmail(''); setPassword(''); setFullName(''); setPhone(''); setOrganizationName(''); setCertificatePdf(null);
        return;
      }
      localStorage.setItem('orgLeaderToken', data.accessToken);
      localStorage.setItem('orgLeaderRefreshToken', data.refreshToken);
      localStorage.setItem('orgLeaderUser', JSON.stringify(data.user));
      navigate('/org/dashboard');
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400";

  return (
    <div className="min-h-screen flex bg-bg-light dark:bg-bg-dark font-display">
      {/* Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-purple-900 via-indigo-800 to-primary/30 relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-20 w-72 h-72 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/5 rounded-full" />
        </div>
        <div className="relative z-10 text-center max-w-md">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl mx-auto mb-8">
            <span className="material-symbols-outlined text-3xl">leaderboard</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-4">Organization Portal</h2>
          <p className="text-purple-100/80 text-sm leading-relaxed">Manage your organization "” oversee staff, families, children, and track progress with AI-powered insights across your care network.</p>
          <div className="flex gap-4 justify-center mt-10">
            {['groups', 'family_restroom', 'trending_up'].map(icon => (
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
            {t('orgLeaderLogin.backToHome', 'Back to Home')}
          </button>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-4">
          <div className="w-full max-w-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                <img src={logo} alt="CogniCare" className="w-8 h-8 object-contain" />
              </div>
              <span className="text-xl font-bold tracking-tight">CogniCare</span>
            </div>

            <h1 className="text-2xl font-black tracking-tight mb-1">
              {mode === 'login' ? t('orgLeaderLogin.title', 'Org Leader Login') : t('orgLeaderLogin.signupTitle', 'Create Organization')}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
              {mode === 'login' ? t('orgLeaderLogin.subtitle', 'Sign in to manage your organization') : t('orgLeaderLogin.signupSubtitle', 'Register a new organization')}
            </p>

            {/* Alerts */}
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium mb-5">
                <span className="material-symbols-outlined text-lg shrink-0">error</span>{error}
              </div>
            )}
            {success && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-success/10 border border-success/20 text-success text-sm font-medium mb-5">
                <span className="material-symbols-outlined text-lg shrink-0">check_circle</span>{success}
              </div>
            )}

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="flex flex-col gap-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.email', 'Email')}</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('orgLeaderLogin.emailPlaceholder', 'leader@organization.com')} required autoComplete="email" className={inputCls} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.password', 'Password')}</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" className={inputCls} />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2">
                  {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('orgLeaderLogin.loggingIn', 'Signing in...')}</> : t('orgLeaderLogin.loginButton', 'Sign In')}
                </button>

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs text-slate-400 font-medium">{t('orgLeaderLogin.or', 'or')}</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>

                <button type="button" onClick={() => { setMode('signup'); setError(''); }}
                  className="w-full py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  {t('orgLeaderLogin.createOrganization', 'Create Organization')}
                </button>
              </form>
            ) : (
              <form onSubmit={codeSent ? handleSignup : handleSendCode} className="flex flex-col gap-4">
                {!codeSent ? (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.fullName', 'Full Name')}</label>
                      <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('orgLeaderLogin.fullNamePlaceholder', 'Your full name')} required className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.organizationName', 'Organization Name')}</label>
                      <input type="text" value={organizationName} onChange={(e) => setOrganizationName(e.target.value)} placeholder={t('orgLeaderLogin.organizationNamePlaceholder', 'Your organization')} required className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.email', 'Email')}</label>
                      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('orgLeaderLogin.emailPlaceholder', 'leader@organization.com')} required autoComplete="email" className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.phone', 'Phone')}</label>
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t('orgLeaderLogin.phonePlaceholder', '+1 234 567 890')} className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.password', 'Password')}</label>
                      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="new-password" minLength={6} className={inputCls} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {t('orgLeaderLogin.certificatePdf', 'Certificate (PDF)')} <span className="text-error">*</span>
                      </label>
                      <input
                        type="file" id="certificatePdf" accept=".pdf" required
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type !== 'application/pdf') { setError(t('orgLeaderLogin.pdfOnly', 'Only PDF files are accepted')); e.target.value = ''; return; }
                            if (file.size > 10 * 1024 * 1024) { setError(t('orgLeaderLogin.fileTooLarge', 'File too large (max 10MB)')); e.target.value = ''; return; }
                            setCertificatePdf(file); setError('');
                          }
                        }}
                        className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-primary/10 file:text-primary file:font-semibold file:text-xs hover:file:bg-primary/20 file:cursor-pointer cursor-pointer"
                      />
                      {certificatePdf && (
                        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 rounded-lg p-2.5">
                          <span className="material-symbols-outlined text-base text-primary">description</span>
                          <span className="truncate flex-1">{certificatePdf.name}</span>
                          <button type="button" onClick={() => { setCertificatePdf(null); document.getElementById('certificatePdf').value = ''; }}
                            className="text-slate-400 hover:text-error shrink-0"><span className="material-symbols-outlined text-base">close</span></button>
                        </div>
                      )}
                      <p className="text-xs text-slate-400">{t('orgLeaderLogin.certificateHint', 'Upload your organization registration certificate')}</p>
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2">
                      {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('orgLeaderLogin.sendingCode', 'Sending...')}</> : t('orgLeaderLogin.sendVerificationCode', 'Send Verification Code')}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                      <span className="material-symbols-outlined text-lg shrink-0">mail</span>
                      {t('orgLeaderLogin.codeSentMessage', 'Verification code sent to your email')}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.verificationCode', 'Verification Code')}</label>
                      <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder={t('orgLeaderLogin.verificationCodePlaceholder', '000000')} required maxLength={6}
                        className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-center tracking-[0.3em] font-mono text-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400 placeholder:tracking-[0.3em]" />
                    </div>
                    <button type="submit" disabled={loading} className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2">
                      {loading ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('orgLeaderLogin.creatingOrganization', 'Creating...')}</> : t('orgLeaderLogin.createAccount', 'Create Account')}
                    </button>
                    <button type="button" onClick={() => { setCodeSent(false); setVerificationCode(''); }}
                      className="text-sm text-primary font-medium hover:underline text-center">
                      {t('orgLeaderLogin.resendCode', 'â† Resend code')}
                    </button>
                  </>
                )}

                <div className="flex items-center gap-3 my-1">
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                  <span className="text-xs text-slate-400 font-medium">{t('orgLeaderLogin.or', 'or')}</span>
                  <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                </div>

                <button type="button" onClick={() => { setMode('login'); setCodeSent(false); setError(''); }}
                  className="w-full py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                  {t('orgLeaderLogin.backToLogin', 'Back to Login')}
                </button>
              </form>
            )}

            {/* Footer links */}
            <div className="flex items-center justify-center gap-3 mt-6 text-xs text-slate-400">
              <button onClick={() => navigate('/admin/login')} className="hover:text-primary transition-colors">{t('orgLeaderLogin.adminLink', 'Admin Login')}</button>
              <span>•</span>
              <button onClick={() => navigate('/specialist/login')} className="hover:text-primary transition-colors">Specialist Login</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrgLeaderLogin;

