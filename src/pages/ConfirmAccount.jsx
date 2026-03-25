import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../config';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ui/ThemeToggle';
import logo from '../assets/app_logo_withoutbackground.png';

const ConfirmAccount = () => {
    const [searchParams] = useSearchParams();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loginPath, setLoginPath] = useState('/org/login');
    const navigate = useNavigate();
    const { t } = useTranslation();

    const resolveLoginPath = (role) => {
        const specialistRoles = [
            'careProvider',
            'doctor',
            'psychologist',
            'speech_therapist',
            'occupational_therapist',
            'volunteer',
            'other',
        ];
        if (role === 'admin') return '/admin/login';
        if (role === 'organization_leader') return '/org/login';
        if (specialistRoles.includes(role)) return '/specialist/login';
        return '/org/login';
    };

    useEffect(() => {
        const t = searchParams.get('token');
        if (t) {
            setToken(t);
        } else {
            setError('Invalid or missing activation token.');
        }
    }, [searchParams]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch(`${API_BASE_URL}/auth/activate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to activate account. The link may have expired.');
            }

            const nextLoginPath = resolveLoginPath(data?.role);
            setLoginPath(nextLoginPath);
            setSuccess(true);
            setTimeout(() => {
                navigate(nextLoginPath);
            }, 3000);
        } catch (err) {
            setError(err.message || 'Failed to activate account.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-blue-600 to-indigo-700 dark:from-slate-900 dark:via-slate-800 dark:to-primary/30 px-4">
                <div className="w-full max-w-md">
                    <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl p-8 sm:p-10 text-center">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-4xl text-success">check_circle</span>
                        </div>
                        <h1 className="text-2xl font-black mb-3 text-slate-900 dark:text-white">
                            {t('confirmAccount.successTitle', 'Account Activated!')}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                            {t('confirmAccount.successMessage', 'Your account has been successfully confirmed. You will be redirected to the login page in a few seconds...')}
                        </p>
                        <button 
                            onClick={() => navigate(loginPath)}
                            className="w-full px-6 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.97]"
                        >
                            {t('confirmAccount.goToLogin', 'Go to Login Now')}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6">
                <button 
                    onClick={() => navigate('/')} 
                    className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors font-medium"
                >
                    <span className="material-symbols-outlined text-lg">arrow_back</span>
                    {t('confirmAccount.backToHome', 'Back to Home')}
                </button>
                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex items-center justify-center px-4 pb-16">
                <div className="w-full max-w-md">
                    {/* Logo */}
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                            <img src={logo} alt="CogniCare" className="w-8 h-8 object-contain" />
                        </div>
                        <span className="text-xl font-bold tracking-tight">CogniCare</span>
                    </div>

                    {/* Card */}
                    <div className="bg-white dark:bg-surface-dark rounded-2xl border border-slate-300 dark:border-slate-800 shadow-xl p-6 sm:p-8">
                        <h1 className="text-2xl font-black tracking-tight mb-2 text-slate-900 dark:text-white">
                            {t('confirmAccount.title', 'Activate Your Account')}
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            {t('confirmAccount.subtitle', 'Please set a password for your new CogniCare account.')}
                        </p>

                        {error && (
                            <div className="mb-6 p-4 bg-error/10 border border-error/20 text-error rounded-xl flex items-start gap-3">
                                <span className="material-symbols-outlined text-lg shrink-0">error</span>
                                <p className="text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
                                    {t('confirmAccount.newPassword', 'New Password')}
                                </label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder={t('confirmAccount.passwordPlaceholder', 'Min 6 characters')}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold mb-2 text-slate-700 dark:text-slate-300">
                                    {t('confirmAccount.confirmPassword', 'Confirm Password')}
                                </label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder={t('confirmAccount.confirmPlaceholder', 'Repeat your password')}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400"
                                    required
                                />
                            </div>
                            <button 
                                type="submit"
                                disabled={loading || !token}
                                className="w-full px-6 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary disabled:active:scale-100"
                            >
                                {loading ? t('confirmAccount.activating', 'Activating...') : t('confirmAccount.activate', 'Activate Account')}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConfirmAccount;


