import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Grainient from '../../components/Grainient';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { API_BASE_URL } from '../../config';
import '../org-leader/OrgLeaderLogin.css'; // Reuse styles

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
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || t('dashboard.messages.loginFailed'));
            }

            // Allowed specialist roles
            const specialistRoles = ['psychologist', 'speech_therapist', 'occupational_therapist', 'doctor', 'volunteer'];

            if (!specialistRoles.includes(data.user.role)) {
                throw new Error('Access denied. This login is for specialists only.');
            }

            // Store tokens and user data
            localStorage.setItem('specialistToken', data.accessToken);
            localStorage.setItem('specialistRefreshToken', data.refreshToken);
            localStorage.setItem('specialistUser', JSON.stringify(data.user));

            // Navigate to specialist dashboard
            navigate('/specialist/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="org-leader-login-page">
            <Grainient
                color1="#FF9FFC"
                color2="#5227FF"
                color3="#B19EEF"
                timeSpeed={0.25}
                colorBalance={0}
                warpStrength={1}
                warpFrequency={5}
                warpSpeed={2}
                warpAmplitude={50}
                blendAngle={0}
                blendSoftness={0.05}
                rotationAmount={500}
                noiseScale={2}
                grainAmount={0.1}
                grainScale={2}
                grainAnimated={false}
                contrast={1.5}
                gamma={1}
                saturation={1}
                centerX={0}
                centerY={0}
                zoom={0.9}
            />

            <div className="login-content">
                <div className="login-container">
                    <div className="login-logo-container">
                        <img src="/src/assets/logo.png" alt="CogniCare Logo" className="login-logo" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="login-header">
                        <LanguageSwitcher />
                        <h1>Specialist Login</h1>
                        <p>Access your professional dashboard</p>
                    </div>

                    <form className="login-form" onSubmit={handleLogin}>
                        {error && (
                            <div className="error-message">
                                <span className="error-icon">⚠️</span>
                                {error}
                            </div>
                        )}

                        <div className="form-group">
                            <label htmlFor="email">{t('orgLeaderLogin.email')}</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t('orgLeaderLogin.emailPlaceholder')}
                                required
                                autoComplete="email"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">{t('orgLeaderLogin.password')}</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('orgLeaderLogin.passwordPlaceholder')}
                                required
                                autoComplete="current-password"
                            />
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? (
                                <>
                                    <span className="spinner"></span>
                                    {t('orgLeaderLogin.loggingIn')}
                                </>
                            ) : (
                                t('orgLeaderLogin.loginButton')
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <a href="/" className="back-link">← {t('orgLeaderLogin.backToHome')}</a>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SpecialistLogin;
