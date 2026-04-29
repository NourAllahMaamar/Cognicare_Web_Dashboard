import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import SEOHead from '../../components/SEOHead';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import ThemeToggle from '../../components/ui/ThemeToggle';
import { API_BASE_URL, GOOGLE_CLIENT_ID } from '../../config';
import logo from '../../assets/app_logo_withoutbackground.png';

const specialistRoles = ['psychologist', 'speech_therapist', 'occupational_therapist', 'doctor', 'volunteer', 'careProvider'];

function SpecialistLogin() {
    const [mode, setMode] = useState('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Profile completion state
    const [showProfileCompletion, setShowProfileCompletion] = useState(false);
    const [profileCompletionToken, setProfileCompletionToken] = useState('');
    const [careProviderType, setCareProviderType] = useState('');
    const [profilePassword, setProfilePassword] = useState('');
    
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation();
    const googleBtnLoginRef = useRef(null);
    const googleBtnSignupRef = useRef(null);
    const [googleSDKLoaded, setGoogleSDKLoaded] = useState(false);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const initialMode = params.get('mode');
        if (initialMode === 'signup' || initialMode === 'login') setMode(initialMode);
    }, [location]);

    // Check if Google SDK is loaded
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID) {
            console.log('Google Client ID not configured');
            return;
        }
        
        console.log('Waiting for Google SDK to load...');
        const checkGoogleSDK = () => {
            if (window.google?.accounts?.id) {
                console.log('Google SDK loaded successfully');
                setGoogleSDKLoaded(true);
            } else {
                setTimeout(checkGoogleSDK, 100);
            }
        };
        checkGoogleSDK();
    }, []);

   const storeTokensAndRedirect = useCallback((data) => {
        // Check if profile completion is required
        if (data.user?.requiresProfileCompletion) {
            setProfileCompletionToken(data.accessToken);
            setShowProfileCompletion(true);
            // Store email for later login
            sessionStorage.setItem('tempUserEmail', data.user.email);
            return;
        }
        
        localStorage.setItem('specialistToken', data.accessToken);
        localStorage.setItem('specialistRefreshToken', data.refreshToken);
        localStorage.setItem('specialistUser', JSON.stringify(data.user));
        navigate('/specialist/dashboard');
    }, [navigate]);

    // Google Sign-In callback
    const handleGoogleResponse = useCallback(async (response) => {
        setError(''); setSuccess(''); setLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/auth/social-login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'google',
                    idToken: response.credential,
                    role: 'careProvider',
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Google login failed');
            if (!specialistRoles.includes(data.user.role)) {
                throw new Error('Access denied. This login is for specialists only.');
            }
            storeTokensAndRedirect(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [storeTokensAndRedirect]);

    // Initialize Google Sign-In button
    useEffect(() => {
        if (!GOOGLE_CLIENT_ID || !googleSDKLoaded) {
            console.log('Google button not ready:', { GOOGLE_CLIENT_ID: !!GOOGLE_CLIENT_ID, googleSDKLoaded });
            return;
        }
        
        console.log('Initializing Google Sign-In buttons...');
        try {
            window.google.accounts.id.initialize({
                client_id: GOOGLE_CLIENT_ID,
                callback: handleGoogleResponse,
            });

            // Render login button
            if (mode === 'login' && googleBtnLoginRef.current) {
                console.log('Rendering login button');
                googleBtnLoginRef.current.innerHTML = '';
                window.google.accounts.id.renderButton(googleBtnLoginRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: 400,
                    text: 'signin_with',
                    shape: 'rectangular',
                });
            }

            // Render signup button (if not in codeSent state)
            if (mode === 'signup' && !codeSent && googleBtnSignupRef.current) {
                googleBtnSignupRef.current.innerHTML = '';
                window.google.accounts.id.renderButton(googleBtnSignupRef.current, {
                    theme: 'outline',
                    size: 'large',
                    width: googleBtnSignupRef.current.offsetWidth || 400,
                    text: 'signup_with',
                    shape: 'rectangular',
                });
            }
        } catch (error) {
            console.error('Google Sign-In initialization error:', error);
        }
    }, [handleGoogleResponse, mode, codeSent, googleSDKLoaded]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || t('dashboard.messages.loginFailed'));
            if (!specialistRoles.includes(data.user.role)) {
                throw new Error('Access denied. This login is for specialists only.');
            }
            storeTokensAndRedirect(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendCode = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-verification-code`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to send verification code');
            setCodeSent(true);
            setSuccess(t('specialistLogin.codeSentSuccess'));
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignup = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName,
                    email,
                    password,
                    phone: phone || undefined,
                    role: 'careProvider',
                    verificationCode,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Signup failed');
            storeTokensAndRedirect(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCompleteProfile = async (e) => {
        e.preventDefault();
        setError(''); setSuccess(''); setLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/auth/complete-profile`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${profileCompletionToken}`
                },
                body: JSON.stringify({
                    careProviderType,
                    password: profilePassword,
                }),
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Profile completion failed');
            
            // Now perform proper login with the new password
            const tempEmail = sessionStorage.getItem('tempUserEmail');
            if (!tempEmail) throw new Error('Session expired, please login again');
            
            const loginResponse = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: tempEmail,
                    password: profilePassword,
                }),
            });
            const loginData = await loginResponse.json();
            if (!loginResponse.ok) throw new Error('Failed to login after profile completion');
            
            sessionStorage.removeItem('tempUserEmail');
            localStorage.setItem('specialistToken', loginData.accessToken);
            localStorage.setItem('specialistRefreshToken', loginData.refreshToken);
            localStorage.setItem('specialistUser', JSON.stringify(loginData.user));
            navigate('/specialist/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const inputCls = "w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400";

    return (
        <div className="min-h-screen flex bg-bg-light dark:bg-bg-dark font-display">
            <SEOHead
              title={mode === 'login' ? t('specialistLogin.title', 'Specialist Login') : t('specialistLogin.signupTitle', 'Specialist Sign Up')}
              description="Sign in or register on the CogniCare specialist portal to manage PECS & TEACCH plans, track child progress, and collaborate with families."
              path="/specialist/login"
            />
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
                    <h2 className="text-3xl font-black text-white mb-4">{t('specialistLogin.branding.title', 'Professional Suite')}</h2>
                    <p className="text-blue-100/80 text-sm leading-relaxed">{t('specialistLogin.branding.description', 'Access your clinical tools - manage children, create specialized plans (PECS, TEACCH), track progress, and collaborate with your organization.')}</p>
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

                <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-4">
                    <div className="w-full max-w-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/20 overflow-hidden">
                                <img src={logo} alt="CogniCare" className="w-8 h-8 object-contain" />
                            </div>
                            <span className="text-xl font-bold tracking-tight">CogniCare</span>
                        </div>

                        <h1 className="text-2xl font-black tracking-tight mb-1">
                            {mode === 'login' ? t('specialistLogin.title', 'Specialist Login') : t('specialistLogin.signupTitle', 'Specialist Sign Up')}
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            {mode === 'login' ? t('specialistLogin.subtitle', 'Access your professional dashboard') : t('specialistLogin.signupSubtitle', 'Create your specialist account')}
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
                                    <label htmlFor="email" className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.email', 'Email')}</label>
                                    <input
                                        type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)}
                                        placeholder={t('specialistLogin.emailPlaceholder')} required autoComplete="email"
                                        className={inputCls}
                                    />
                                </div>

                                <div className="flex flex-col gap-1.5">
                                    <label htmlFor="password" className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.password', 'Password')}</label>
                                    <input
                                        type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••" required autoComplete="current-password"
                                        className={inputCls}
                                    />
                                </div>

                                <button type="submit" disabled={loading}
                                    className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2">
                                    {loading ? (
                                        <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('orgLeaderLogin.loggingIn', 'Signing in...')}</>
                                    ) : t('orgLeaderLogin.loginButton', 'Sign In')}
                                </button>

                                {/* Google Sign-In */}
                                {GOOGLE_CLIENT_ID ? (
                                    googleSDKLoaded ? (
                                        <>
                                            <div className="flex items-center gap-3 my-1">
                                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                                <span className="text-xs text-slate-400 font-medium">{t('orgLeaderLogin.or', 'or')}</span>
                                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                            </div>
                                            <div ref={googleBtnLoginRef} className="w-full min-h-[44px]" />
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 my-1">
                                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                                <span className="text-xs text-slate-400 font-medium">{t('orgLeaderLogin.or', 'or')}</span>
                                                <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                            </div>
                                            <div className="text-center text-sm text-slate-400 py-3">{t('specialistLogin.loadingGoogle', 'Loading Google Sign-In...')}</div>
                                        </>
                                    )
                                ) : (
                                    <div className="text-center text-xs text-slate-400 py-2">{t('specialistLogin.googleUnavailable', 'Google login unavailable (client ID not configured)')}</div>
                                )}

                                <div className="flex items-center gap-3 my-1">
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                    <span className="text-xs text-slate-400 font-medium">{t('orgLeaderLogin.or', 'or')}</span>
                                    <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                </div>

                                <button type="button" onClick={() => { setMode('signup'); setError(''); setSuccess(''); }}
                                    className="w-full py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                    {t('specialistLogin.createAccount', 'Create Specialist Account')}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={codeSent ? handleSignup : handleSendCode} className="flex flex-col gap-4">
                                {!codeSent ? (
                                    <>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.fullName', 'Full Name')}</label>
                                            <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t('specialistLogin.fullNamePlaceholder')} required className={inputCls} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.email', 'Email')}</label>
                                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('specialistLogin.emailPlaceholder')} required autoComplete="email" className={inputCls} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.phone', 'Phone')} <span className="text-slate-400 font-normal">(optional)</span></label>
                                            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 234 567 890" className={inputCls} />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('orgLeaderLogin.password', 'Password')}</label>
                                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="new-password" minLength={6} className={inputCls} />
                                        </div>
                                        <button type="submit" disabled={loading}
                                            className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2">
                                            {loading ? (
                                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Sending...</>
                                            ) : 'Send Verification Code'}
                                        </button>

                                        {/* Google Sign-Up */}
                                        {GOOGLE_CLIENT_ID ? (
                                            googleSDKLoaded ? (
                                                <>
                                                    <div className="flex items-center gap-3 my-1">
                                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                                        <span className="text-xs text-slate-400 font-medium">{t('orgLeaderLogin.or', 'or')}</span>
                                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                                    </div>
                                                    <div ref={googleBtnSignupRef} className="w-full min-h-[44px]" />
                                                </>
                                            ) : (
                                                <>
                                                    <div className="flex items-center gap-3 my-1">
                                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                                        <span className="text-xs text-slate-400 font-medium">{t('orgLeaderLogin.or', 'or')}</span>
                                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                                    </div>
                                                    <div className="text-center text-sm text-slate-400 py-3">{t('specialistLogin.loadingGoogle', 'Loading Google Sign-In...')}</div>
                                                </>
                                            )
                                        ) : (
                                            <div className="text-center text-xs text-slate-400 py-2">{t('specialistLogin.googleUnavailable', 'Google sign-up unavailable (client ID not configured)')}</div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                                            <span className="material-symbols-outlined text-lg shrink-0">mail</span>
                                            {t('specialistLogin.verificationCodeSent')}
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">{t('specialistLogin.verificationCode')}</label>
                                            <input type="text" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} placeholder={t('specialistLogin.verificationCodePlaceholder')} required maxLength={6}
                                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-center tracking-[0.3em] font-mono text-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-slate-400 placeholder:tracking-[0.3em]" />
                                        </div>
                                        <button type="submit" disabled={loading}
                                            className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2">
                                            {loading ? (
                                                <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creating account...</>
                                            ) : 'Create Account'}
                                        </button>
                                        <button type="button" onClick={() => { setCodeSent(false); setVerificationCode(''); }}
                                            className="text-sm text-primary font-medium hover:underline text-center">
                                            {t('specialistLogin.backToForm')}
                                        </button>
                                    </>
                                )}

                                {!codeSent && (
                                    <div className="flex items-center gap-3 my-1">
                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                        <span className="text-xs text-slate-400 font-medium">{t('orgLeaderLogin.or', 'or')}</span>
                                        <div className="flex-1 h-px bg-slate-200 dark:bg-slate-700" />
                                    </div>
                                )}

                                <button type="button" onClick={() => { setMode('login'); setCodeSent(false); setError(''); setSuccess(''); }}
                                    className="w-full py-3 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                                    {t('orgLeaderLogin.backToLogin', 'Back to Login')}
                                </button>
                            </form>
                        )}

                        {/* Footer links */}
                        <div className="flex items-center justify-center gap-3 mt-6 text-xs text-slate-400">
                            <button onClick={() => navigate('/admin/login')} className="hover:text-primary transition-colors">{t('orgLeaderLogin.adminLink', 'Admin Login')}</button>
                            <span>•</span>
                            <button onClick={() => navigate('/org/login')} className="hover:text-primary transition-colors">{t('specialistLogin.organizationLogin')}</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Profile Completion Modal */}
            {showProfileCompletion && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-[fadeIn_0.2s_ease]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                                <span className="material-symbols-outlined text-2xl text-primary">person_add</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold">{t('specialistLogin.profileComplete.title', 'Complete Your Profile')}</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{t('specialistLogin.profileComplete.subtitle', 'Set up your specialist account')}</p>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-sm font-medium mb-4">
                                <span className="material-symbols-outlined text-lg shrink-0">error</span>{error}
                            </div>
                        )}

                        <form onSubmit={handleCompleteProfile} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {t('specialistLogin.profileComplete.specialistType', 'Specialist Type')} <span className="text-error">{t('specialistLogin.profileComplete.required', '*')}</span>
                                </label>
                                <select
                                    value={careProviderType}
                                    onChange={(e) => setCareProviderType(e.target.value)}
                                    required
                                    className={inputCls}
                                >
                                    <option value="">{t('specialistLogin.profileComplete.selectSpecialty', 'Select your specialty')}</option>
                                    <option value="speech_therapist">{t('specialistLogin.specialistTypes.speech_therapist', 'Speech Therapist')}</option>
                                    <option value="occupational_therapist">{t('specialistLogin.specialistTypes.occupational_therapist', 'Occupational Therapist')}</option>
                                    <option value="psychologist">{t('specialistLogin.specialistTypes.psychologist', 'Psychologist')}</option>
                                    <option value="doctor">{t('specialistLogin.specialistTypes.doctor', 'Doctor')}</option>
                                    <option value="ergotherapist">{t('specialistLogin.specialistTypes.ergotherapist', 'Ergotherapist')}</option>
                                    <option value="caregiver">{t('specialistLogin.specialistTypes.caregiver', 'Caregiver')}</option>
                                    <option value="organization_leader">{t('specialistLogin.specialistTypes.organization_leader', 'Organization Leader')}</option>
                                    <option value="other">{t('specialistLogin.specialistTypes.other', 'Other')}</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    {t('specialistLogin.profileComplete.setPassword', 'Set a Password')} <span className="text-error">{t('specialistLogin.profileComplete.required', '*')}</span>
                                </label>
                                <input
                                    type="password"
                                    value={profilePassword}
                                    onChange={(e) => setProfilePassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    minLength={6}
                                    className={inputCls}
                                />
                                <p className="text-xs text-slate-500 dark:text-slate-400">{t('specialistLogin.profileComplete.passwordHint', 'Minimum 6 characters')}</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-primary-dark disabled:opacity-60 disabled:cursor-not-allowed transition-all text-sm flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        {t('specialistLogin.profileComplete.completing', 'Completing...')}
                                    </>
                                ) : (
                                    <>
                                        <span className="material-symbols-outlined text-lg">check</span>
                                        {t('specialistLogin.profileComplete.completeSetup', 'Complete Setup')}
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default SpecialistLogin;
