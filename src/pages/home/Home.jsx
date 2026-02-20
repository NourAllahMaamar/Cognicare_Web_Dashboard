import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Grainient from '../../components/Grainient';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import './Home.css';

function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const dropdownRef = useRef(null);

  const toggleAccountMenu = () => {
    setShowAccountMenu(!showAccountMenu);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAccountMenu(false);
      }
    };

    if (showAccountMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAccountMenu]);

  return (
    <div className="home-page">
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

      <div className="home-content">
        <header className="home-header">
          <div className="logo-container">
            <img src="/src/assets/logo.png" alt="CogniCare Logo" className="header-logo" onError={(e) => { e.target.style.display = 'none'; }} />
            <span className="logo-text">CogniCare</span>
          </div>
          <nav className="nav-menu">
            <a href="#home">{t('nav.home')}</a>
            <a href="#features">{t('nav.features')}</a>
            <a href="#about">{t('nav.about')}</a>
            <a href="#download">{t('nav.download')}</a>

            <div className="auth-dropdown" ref={dropdownRef}>
              <a className="auth-trigger-link" onClick={toggleAccountMenu}>
                {t('nav.account')} <span className={`chevron ${showAccountMenu ? 'open' : ''}`}>▼</span>
              </a>
              {showAccountMenu && (
                <div className="dropdown-menu">
                  <button onClick={() => navigate('/org/login')}>{t('nav.orgLeader')}</button>
                  <button onClick={() => navigate('/specialist/login')}>Professional Specialist</button>
                  <button onClick={() => navigate('/admin/login')}>{t('nav.admin')}</button>
                </div>
              )}
            </div>
          </nav>
          <LanguageSwitcher />
        </header>

        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">{t('hero.title')}</h1>
            <p className="hero-subtitle">
              {t('hero.subtitle')}
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary">{t('hero.downloadApp')}</button>
              <button className="btn btn-secondary">{t('hero.learnMore')}</button>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <h2 className="section-title">{t('features.title')}</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>{t('features.multiLanguage.title')}</h3>
              <p>{t('features.multiLanguage.description')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>{t('features.crossPlatform.title')}</h3>
              <p>{t('features.crossPlatform.description')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>{t('features.secure.title')}</h3>
              <p>{t('features.secure.description')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>{t('features.modernDesign.title')}</h3>
              <p>{t('features.modernDesign.description')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍👩‍👧‍👦</div>
              <h3>{t('features.familyFriendly.title')}</h3>
              <p>{t('features.familyFriendly.description')}</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>{t('features.tracking.title')}</h3>
              <p>{t('features.tracking.description')}</p>
            </div>
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="about-content">
            <h2 className="section-title">{t('about.title')}</h2>
            <p className="about-text">
              {t('about.text1')}
            </p>
            <p className="about-text">
              {t('about.text2')}
            </p>
          </div>
        </section>

        <section className="download-section" id="download">
          <div className="download-content">
            <h2 className="section-title">{t('download.title')}</h2>
            <p className="download-subtitle">{t('download.subtitle')}</p>
            <div className="download-buttons">
              <button className="download-btn app-store">
                <span className="download-icon">📱</span>
                <div className="download-text">
                  <span className="download-small">{t('download.appStore.small')}</span>
                  <span className="download-large">{t('download.appStore.large')}</span>
                </div>
              </button>
              <button className="download-btn google-play">
                <span className="download-icon">🤖</span>
                <div className="download-text">
                  <span className="download-small">{t('download.googlePlay.small')}</span>
                  <span className="download-large">{t('download.googlePlay.large')}</span>
                </div>
              </button>
            </div>
          </div>
        </section>

        <footer className="home-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo-container">
                <img src="/src/assets/logo.png" alt="CogniCare Logo" className="footer-logo-img" onError={(e) => { e.target.style.display = 'none'; }} />
                <span className="footer-logo-text">CogniCare</span>
              </div>
              <p className="footer-tagline">{t('footer.tagline')}</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>{t('footer.product')}</h4>
                <a href="#features">{t('nav.features')}</a>
                <a href="#about">{t('nav.about')}</a>
                <a href="#download">{t('nav.download')}</a>
              </div>
              <div className="footer-column">
                <h4>{t('footer.support')}</h4>
                <a href="#help">{t('footer.helpCenter')}</a>
                <a href="#contact">{t('footer.contact')}</a>
                <a href="#privacy">{t('footer.privacy')}</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>{t('footer.copyright')}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Home;
