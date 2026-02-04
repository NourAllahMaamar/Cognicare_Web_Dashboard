import Grainient from '../components/Grainient';
import './Home.css';

function Home() {
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
          <div className="logo">🧠 CogniCare</div>
          <nav className="nav-menu">
            <a href="#home">Home</a>
            <a href="#features">Features</a>
            <a href="#about">About</a>
            <a href="#download">Download</a>
            <a href="/admin/login" className="admin-link">Admin</a>
          </nav>
        </header>

        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">Empower Your Cognitive Health</h1>
            <p className="hero-subtitle">
              A comprehensive platform for personalized cognitive development and healthcare management
            </p>
            <div className="hero-buttons">
              <button className="btn btn-primary">Download App</button>
              <button className="btn btn-secondary">Learn More</button>
            </div>
          </div>
        </section>

        <section className="features-section" id="features">
          <h2 className="section-title">Why Choose CogniCare?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>Multi-Language Support</h3>
              <p>Available in English, French, and Arabic with RTL support for seamless accessibility</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Cross-Platform</h3>
              <p>Access on iOS, Android, and Web - your cognitive health journey anywhere, anytime</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>JWT-based authentication with encrypted storage to keep your data safe</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🎨</div>
              <h3>Modern Design</h3>
              <p>Beautiful Material Design 3 interface for an intuitive user experience</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍👩‍👧‍👦</div>
              <h3>Family-Friendly</h3>
              <p>Manage cognitive health for your entire family from a single platform</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Personalized Tracking</h3>
              <p>Track progress with detailed insights and personalized cognitive development plans</p>
            </div>
          </div>
        </section>

        <section className="about-section" id="about">
          <div className="about-content">
            <h2 className="section-title">About CogniCare</h2>
            <p className="about-text">
              CogniCare is your trusted companion in cognitive health management. Our platform combines 
              cutting-edge technology with healthcare expertise to deliver personalized cognitive development 
              programs tailored to your unique needs.
            </p>
            <p className="about-text">
              Whether you're looking to improve memory, enhance focus, or maintain cognitive wellness, 
              CogniCare provides the tools and support you need on your journey to better brain health.
            </p>
          </div>
        </section>

        <section className="download-section" id="download">
          <div className="download-content">
            <h2 className="section-title">Get Started Today</h2>
            <p className="download-subtitle">Download CogniCare and begin your cognitive health journey</p>
            <div className="download-buttons">
              <button className="download-btn app-store">
                <span className="download-icon">📱</span>
                <div className="download-text">
                  <span className="download-small">Download on the</span>
                  <span className="download-large">App Store</span>
                </div>
              </button>
              <button className="download-btn google-play">
                <span className="download-icon">🤖</span>
                <div className="download-text">
                  <span className="download-small">Get it on</span>
                  <span className="download-large">Google Play</span>
                </div>
              </button>
            </div>
          </div>
        </section>

        <footer className="home-footer">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="footer-logo">🧠 CogniCare</div>
              <p className="footer-tagline">Empowering cognitive health through technology</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#about">About</a>
                <a href="#download">Download</a>
              </div>
              <div className="footer-column">
                <h4>Support</h4>
                <a href="#help">Help Center</a>
                <a href="#contact">Contact Us</a>
                <a href="#privacy">Privacy Policy</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2026 CogniCare. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default Home;
