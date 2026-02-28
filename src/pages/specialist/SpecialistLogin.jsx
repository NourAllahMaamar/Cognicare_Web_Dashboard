import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { API_BASE_URL } from '../../config';
import logo from '../../assets/app_logo_withoutbackground.png';

function SpecialistLogin() {
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

            const specialistRoles = ['psychologist', 'speech_therapist', 'occupational_therapist', 'doctor', 'volunteer'];
            if (!specialistRoles.includes(data.user.role)) {
                throw new Error('Access denied. This login is for specialists only.');
            }

            localStorage.setItem('specialistToken', data.accessToken);
            localStorage.setItem('specialistRefreshToken', data.refreshToken);
            localStorage.setItem('specialistUser', JSON.stringify(data.user));
            navigate('/specialist/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-bg-light dark:bg-bg-dark font-display">
            {/* Left Branding Panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-600/40 relative overflow-hidden flex-col items-center justify-center p-12">
                <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-cyan-400/20 rounded-full blur-3xl" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/5 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-white/5 rounded-full" />
                </div>
                <div className="relative z-10 text-center max-w-md">
                    <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white shadow-2xl mx-auto mb-8">
                        <span className="material-symbols-outlined text-3xl">medical_services</span>
                    </div>
                    <h2 className="text-3xl font-black text-white mb-4">Professional Suite</h2>
                    <p className="text-blue-100/80 text-sm leading-relaxed">Access your clinical tools — manage children, create specialized plans (PECS, TEACCH), track progress, and collaborate with your organization.</p>
                    <div className="flex gap-4 justify-center mt-10">
                        {['psychology', 'assignment', 'insights'].map(icon => (
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

                <div className="flex-1 flex items-center justify-center px-4 sm:px-8">
                    <div className="w-full max-w-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                                <img src={logo} alt="CogniCare" className="w-8 h-8 object-contain" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">CogniCare</span>
                        </div>

                        <h1 className="text-2xl font-black tracking-tight mb-1">Specialist Login</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">Access your professional dashboard</p>

                        <form onSubmit={handleLogin} className="flex flex-col gap-5">
                            {error && (
                                <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium">
                                    <span className="material-symbols-outlined text-lg shrink-0">error</span>
                                    {error}
                                </div>
                            )}

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.email', 'Email')}</label>
                                <input
                                    type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                    placeholder={t('orgLeaderLogin.emailPlaceholder', 'specialist@cognicare.com')} required autoComplete="email"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.password', 'Password')}</label>
                                <input
                                    type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••" required autoComplete="current-password"
                                    className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400"
                                />
                            </div>

                            <button type="submit" disabled={loading}
                                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2">
                                {loading ? (
                                    <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('orgLeaderLogin.loggingIn', 'Signing in...')}</>
                                ) : t('orgLeaderLogin.loginButton', 'Sign In')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SpecialistLogin;
