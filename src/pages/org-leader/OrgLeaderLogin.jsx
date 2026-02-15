import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Grainient from '../../components/Grainient';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { API_BASE_URL } from '../../config';
import './OrgLeaderLogin.css';

function OrgLeaderLogin() {
  const [mode, setMode] = useState('login'); // 'login' or 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [organizationName, setOrganizationName] = useState('');
  const [phone, setPhone] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
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
    if (initialMode === 'signup' || initialMode === 'login') {
      setMode(initialMode);
    }
  }, [location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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

      // Check if user is organization_leader
      if (data.user.role !== 'organization_leader') {
        throw new Error(t('orgLeaderLogin.accessDenied'));
      }

      // Store tokens and user data
      localStorage.setItem('orgLeaderToken', data.accessToken);
      localStorage.setItem('orgLeaderRefreshToken', data.refreshToken);
      localStorage.setItem('orgLeaderUser', JSON.stringify(data.user));

      // Navigate to dashboard
      navigate('/org/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/send-verification-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('dashboard.messages.verificationCodeFailed'));
      }

      setCodeSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone,
          role: 'organization_leader',
          organizationName,
          verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('dashboard.messages.signupFailed'));
      }

      // Check if organization needs approval
      if (data.requiresApproval) {
        setSuccess(data.message || t('dashboard.messages.orgCreatedPending'));
        // Reset form but stay on signup page
        setCodeSent(false);
        setVerificationCode('');
        setEmail('');
        setPassword('');
        setFullName('');
        setPhone('');
        setOrganizationName('');
        return;
      }

      // Store tokens and user data (for non-organization_leader roles)
      localStorage.setItem('orgLeaderToken', data.accessToken);
      localStorage.setItem('orgLeaderRefreshToken', data.refreshToken);
      localStorage.setItem('orgLeaderUser', JSON.stringify(data.user));

      // Navigate to dashboard
      navigate('/org/dashboard');
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
            <h1>{mode === 'login' ? t('orgLeaderLogin.title') : t('orgLeaderLogin.signupTitle')}</h1>
            <p>{mode === 'login' ? t('orgLeaderLogin.subtitle') : t('orgLeaderLogin.signupSubtitle')}</p>
          </div>

          {mode === 'login' ? (
            <form className="login-form" onSubmit={handleLogin}>
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}
              {success && (
                <div className="success-message">
                  <span className="success-icon">✅</span>
                  {success}
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

              <div className="form-divider">
                <span>{t('orgLeaderLogin.or')}</span>
              </div>

              <button
                type="button"
                className="switch-mode-btn"
                onClick={() => {
                  setMode('signup');
                  setError('');
                }}
              >
                {t('orgLeaderLogin.createOrganization')}
              </button>
            </form>
          ) : (
            <form className="login-form" onSubmit={codeSent ? handleSignup : handleSendCode}>
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}
              {success && (
                <div className="success-message">
                  <span className="success-icon">✅</span>
                  {success}
                </div>
              )}

              {!codeSent ? (
                <>
                  <div className="form-group">
                    <label htmlFor="fullName">{t('orgLeaderLogin.fullName')}</label>
                    <input
                      type="text"
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={t('orgLeaderLogin.fullNamePlaceholder')}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="organizationName">{t('orgLeaderLogin.organizationName')}</label>
                    <input
                      type="text"
                      id="organizationName"
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder={t('orgLeaderLogin.organizationNamePlaceholder')}
                      required
                    />
                  </div>

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
                    <label htmlFor="phone">{t('orgLeaderLogin.phone')}</label>
                    <input
                      type="tel"
                      id="phone"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('orgLeaderLogin.phonePlaceholder')}
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
                      autoComplete="new-password"
                      minLength={6}
                    />
                  </div>

                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        {t('orgLeaderLogin.sendingCode')}
                      </>
                    ) : (
                      t('orgLeaderLogin.sendVerificationCode')
                    )}
                  </button>
                </>
              ) : (
                <>
                  <div className="info-message">
                    <span className="info-icon">✉️</span>
                    {t('orgLeaderLogin.codeSentMessage')}
                  </div>

                  <div className="form-group">
                    <label htmlFor="verificationCode">{t('orgLeaderLogin.verificationCode')}</label>
                    <input
                      type="text"
                      id="verificationCode"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      placeholder={t('orgLeaderLogin.verificationCodePlaceholder')}
                      required
                      maxLength={6}
                    />
                  </div>

                  <button type="submit" className="login-btn" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner"></span>
                        {t('orgLeaderLogin.creatingOrganization')}
                      </>
                    ) : (
                      t('orgLeaderLogin.createAccount')
                    )}
                  </button>

                  <button
                    type="button"
                    className="resend-code-btn"
                    onClick={() => {
                      setCodeSent(false);
                      setVerificationCode('');
                    }}
                  >
                    {t('orgLeaderLogin.resendCode')}
                  </button>
                </>
              )}

              <div className="form-divider">
                <span>{t('orgLeaderLogin.or')}</span>
              </div>

              <button
                type="button"
                className="switch-mode-btn"
                onClick={() => {
                  setMode('login');
                  setCodeSent(false);
                  setError('');
                }}
              >
                {t('orgLeaderLogin.backToLogin')}
              </button>
            </form>
          )}

          <div className="login-footer">
            <a href="/" className="back-link">← {t('orgLeaderLogin.backToHome')}</a>
            <span className="divider">•</span>
            <a href="/admin/login" className="admin-link">{t('orgLeaderLogin.adminLink')}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrgLeaderLogin;
