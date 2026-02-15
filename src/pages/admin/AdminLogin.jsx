import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Grainient from '../../components/Grainient';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import { API_BASE_URL } from '../../config';
import './AdminLogin.css';

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t('dashboard.messages.loginFailed'));
      }

      // Check if user is admin
      if (data.user.role !== 'admin') {
        throw new Error(t('adminLogin.accessDenied'));
      }

      // Store tokens and user data
      localStorage.setItem('adminToken', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('adminRefreshToken', data.refreshToken);
      }
      localStorage.setItem('adminUser', JSON.stringify(data.user));

      // Navigate to dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
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
            <h1>{t('adminLogin.title')}</h1>
            <p>{t('adminLogin.subtitle')}</p>
          </div>

          <form className="login-form" onSubmit={handleLogin}>
            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">{t('adminLogin.email')}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cognicare.com"
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('adminLogin.password')}</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('adminLogin.password')}
                required
                autoComplete="current-password"
              />
            </div>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  {t('adminLogin.signing')}
                </>
              ) : (
                t('adminLogin.signIn')
              )}
            </button>
          </form>

          <div className="login-footer">
            <a href="/" className="back-link">← {t('adminLogin.backToHome')}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
