import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';

import ThemeToggle from '../../components/ui/ThemeToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import SEOHead from '../../components/SEOHead';
import logo from '../../assets/app_logo_withoutbackground.png';
import CogniCompanion from '../../components/3d/CogniCompanion';
import CursorEffect from '../../components/ui/CursorEffect';
import FloatingParticles from '../../components/ui/FloatingParticles';
import InteractiveZones from '../../components/ui/InteractiveZones';
import InteractiveElementTracker from '../../components/ui/InteractiveElementTracker';
import ParticleBurst from '../../components/ui/ParticleBurst';

/* â”€â”€ Hero slides â”€â”€ */
const SLIDES = [
  {
    id: 'admin',
    title: 'Admin Dashboard',
    sub: 'System-wide analytics & control',
    icon: 'admin_panel_settings',
    gradient: 'from-slate-800/80 to-slate-900/80',
    accent: '#2563EB',
    rows: [
      { type: 'stats', items: [{ v: '2.4K', l: 'Users', c: 'bg-blue-500' }, { v: '120', l: 'Orgs', c: 'bg-purple-500' }, { v: '98%', l: 'Uptime', c: 'bg-emerald-500' }] },
      { type: 'chart' },
      { type: 'list', count: 3 },
    ],
  },
  {
    id: 'pecs',
    title: 'PECS Board',
    sub: 'Picture-exchange communication',
    icon: 'grid_view',
    gradient: 'from-blue-700/80 to-blue-900/80',
    accent: '#3B82F6',
    rows: [
      { type: 'badges', items: ['Phase III', '6 Cards', 'đźŹ† 2 Mastered'] },
      { type: 'cards', count: 6 },
      { type: 'trials' },
    ],
  },
  {
    id: 'org',
    title: 'Organization Portal',
    sub: 'Staff & family management',
    icon: 'corporate_fare',
    gradient: 'from-purple-800/80 to-indigo-900/80',
    accent: '#8B5CF6',
    rows: [
      { type: 'stats', items: [{ v: '48', l: 'Staff', c: 'bg-purple-500' }, { v: '86', l: 'Families', c: 'bg-pink-500' }, { v: '152', l: 'Children', c: 'bg-amber-500' }] },
      { type: 'team' },
      { type: 'list', count: 2 },
    ],
  },
  {
    id: 'ai',
    title: 'AI Insights',
    sub: 'Smart pattern analysis',
    icon: 'psychology',
    gradient: 'from-cyan-700/80 to-blue-900/80',
    accent: '#06B6D4',
    rows: [
      { type: 'badges', items: ['Pattern Analysis', 'Early Detection', 'Smart Alerts'] },
      { type: 'progress', items: [85, 62, 94] },
      { type: 'list', count: 3 },
    ],
  },
];

const DEFAULT_RELEASE_INFO = {
  android: {
    available: false,
    version: 'Coming soon',
    downloadUrl: '',
    notes: 'The Android pilot build is being prepared.',
  },
  ios: {
    available: false,
    version: 'Coming soon',
    notes: 'iOS distribution will follow after App Store setup.',
  },
};

/* â”€â”€ Mini renderers for slide content â”€â”€ */
function SlideContent({ slide }) {
  return (
    <div className="space-y-2.5">
      {slide.rows.map((row, ri) => {
        if (row.type === 'stats')
          return (
            <div key={ri} className="grid grid-cols-3 gap-1.5">
              {row.items.map((s, i) => (
                <div key={i} className="bg-white/10 rounded-lg p-2 backdrop-blur-sm">
                  <div className={`w-4 h-4 rounded ${s.c} mb-1 opacity-80`} />
                  <p className="text-white text-xs font-black">{s.v}</p>
                  <p className="text-white/50 text-[8px]">{s.l}</p>
                </div>
              ))}
            </div>
          );
        if (row.type === 'chart')
          return (
            <div key={ri} className="bg-white/5 rounded-lg p-2.5 backdrop-blur-sm">
              <svg viewBox="0 0 200 50" className="w-full">
                <defs><linearGradient id={`sg${slide.id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={slide.accent} stopOpacity="0.3" /><stop offset="100%" stopColor={slide.accent} stopOpacity="0" /></linearGradient></defs>
                <path d="M0,40 C30,35 50,20 80,22 C110,24 130,15 160,8 C180,3 195,6 200,5 L200,50 L0,50Z" fill={`url(#sg${slide.id})`} />
                <path d="M0,40 C30,35 50,20 80,22 C110,24 130,15 160,8 C180,3 195,6 200,5" fill="none" stroke={slide.accent} strokeWidth="1.5" />
              </svg>
            </div>
          );
        if (row.type === 'cards')
          return (
            <div key={ri} className="grid grid-cols-3 gap-1.5">
              {Array.from({ length: row.count }).map((_, i) => (
                <div key={i} className="bg-white/10 rounded-lg p-1.5 flex flex-col items-center gap-1 backdrop-blur-sm">
                  <div className="w-8 h-8 rounded bg-white/20" />
                  <div className="h-1 w-6 bg-white/30 rounded-full" />
                </div>
              ))}
            </div>
          );
        if (row.type === 'badges')
          return (
            <div key={ri} className="flex gap-1.5 flex-wrap">
              {row.items.map((b, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full bg-white/10 backdrop-blur-sm text-white/80 text-[9px] font-semibold">{b}</span>
              ))}
            </div>
          );
        if (row.type === 'trials')
          return (
            <div key={ri} className="grid grid-cols-10 gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`aspect-square rounded text-[7px] font-bold flex items-center justify-center backdrop-blur-sm ${i < 6 ? 'bg-emerald-400/40 text-emerald-200' : i < 8 ? 'bg-red-400/40 text-red-200' : 'bg-white/10 text-white/30'}`}>
                  {i < 6 ? 'âœ“' : i < 8 ? 'âœ—' : ''}
                </div>
              ))}
            </div>
          );
        if (row.type === 'team')
          return (
            <div key={ri} className="flex -space-x-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white/20 bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-white/60 text-[9px] font-bold backdrop-blur-sm">
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              <div className="w-7 h-7 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center text-white/50 text-[8px] backdrop-blur-sm">+12</div>
            </div>
          );
        if (row.type === 'progress')
          return (
            <div key={ri} className="space-y-1.5">
              {row.items.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                    <div className="h-full rounded-full bg-white/40" style={{ width: `${v}%` }} />
                  </div>
                  <span className="text-[9px] text-white/50 w-7 text-right">{v}%</span>
                </div>
              ))}
            </div>
          );
        if (row.type === 'list')
          return (
            <div key={ri} className="space-y-1">
              {Array.from({ length: row.count }).map((_, i) => (
                <div key={i} className="flex items-center gap-2 py-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/30" />
                  <div className="h-1.5 flex-1 bg-white/10 rounded-full backdrop-blur-sm" />
                  <div className="h-1.5 w-8 bg-white/10 rounded-full backdrop-blur-sm" />
                </div>
              ))}
            </div>
          );
        return null;
      })}
    </div>
  );
}

/* â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â• â•  */
export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);
  const [cogniFocusTarget, setCogniFocusTarget] = useState(null);
  const [cogniZone, setCogniZone] = useState(null);
  const [releaseInfo, setReleaseInfo] = useState(DEFAULT_RELEASE_INFO);
  const [releaseLoading, setReleaseLoading] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;

    const loadReleaseInfo = async () => {
      setReleaseLoading(true);
      try {
        const response = await fetch('/mobile-release.json', { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        const data = await response.json();
        if (active && data && typeof data === 'object') {
          setReleaseInfo({
            android: {
              ...DEFAULT_RELEASE_INFO.android,
              ...(typeof data.android === 'object' && data.android ? data.android : {}),
            },
            ios: {
              ...DEFAULT_RELEASE_INFO.ios,
              ...(typeof data.ios === 'object' && data.ios ? data.ios : {}),
            },
          });
        } 
      } catch {
        if (active) {
          setReleaseInfo(DEFAULT_RELEASE_INFO);
        }
      } finally {
        if (active) {
          setReleaseLoading(false);
        }
      }
    };

    void loadReleaseInfo();
    return () => {
      active = false;
    };
  }, []);

  const navItems = [
    { label: t('landing.nav.orgLeaders', 'Organizations'), to: '/org/login' },
    { label: t('landing.nav.professionals', 'Professionals'), to: '/specialist/login' },
    { label: t('landing.nav.admins', 'Admins'), to: '/admin/login' },
  ];

  const androidRelease = releaseInfo.android || DEFAULT_RELEASE_INFO.android;
  const iosRelease = releaseInfo.ios || DEFAULT_RELEASE_INFO.ios;
  const androidDownloadReady = Boolean(
    androidRelease.available && androidRelease.downloadUrl,
  );
  const landingJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'CogniCare',
    applicationCategory: 'HealthApplication',
    operatingSystem: 'Android, Web',
    description:
      'CogniCare connects organizations, specialists, admins, and families through one cognitive care platform.',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    ...(androidDownloadReady
      ? { downloadUrl: `https://cognicare.app${androidRelease.downloadUrl}` }
      : {}),
  };

  return (
    <div className="relative min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] text-slate-900 dark:text-slate-100 font-display overflow-x-hidden selection:bg-primary/30">
      <SEOHead
        title="Connected Cognitive Care Platform"
        path="/"
        description="CogniCare brings organizations, specialists, admins, and families together through one connected cognitive care platform with a public Android pilot download."
        jsonLd={landingJsonLd}
      />
      <CursorEffect />
      <FloatingParticles count={45} />
      <ParticleBurst />
      <CogniCompanion focusTarget={cogniFocusTarget} activeZone={cogniZone} />
      <InteractiveElementTracker onTargetChange={setCogniFocusTarget} />
      <InteractiveZones 
        onZoneChange={setCogniZone}
        onMousePos={() => {}}
      />
      
      {/* Background radial gradient overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_70%)] dark:bg-[radial-gradient(circle_at_50%_0%,rgba(37,99,235,0.05),transparent_70%)]"></div>

      {/* Main UI layer */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* â”€â”€ Header â”€â”€ */}
        <header id="section-header" className="sticky top-0 z-50 border-b border-white/20 dark:border-slate-800/40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
                <img src={logo} alt="CogniCare" className="h-10 w-10 rounded-xl object-contain shadow-sm" />
                <span className="text-lg font-black tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">CogniCare</span>
              </div>
              <nav className="hidden md:flex items-center gap-8">
                {navItems.map(n => (
                  <button data-cogni-interactive key={n.to} onClick={() => navigate(n.to)} className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">{n.label}</button>
                ))}
              </nav>
              <div className="flex items-center gap-1.5">
                <LanguageSwitcher />
                <ThemeToggle />
                <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100/50 dark:hover:bg-slate-800/50 transition-colors backdrop-blur-sm">
                  <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
                </button>
              </div>
            </div>
          </div>
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="md:hidden border-t border-slate-200/50 dark:border-slate-800/50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl overflow-hidden"
              >
                <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
                  {navItems.map(n => (
                    <button key={n.to} onClick={() => { navigate(n.to); setMobileMenuOpen(false); }} className="text-left px-3 py-2.5 rounded-lg text-sm font-semibold hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-primary transition-colors">{n.label}</button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        <main className="flex-1 pb-32">
          {/* â”€â”€ Hero â”€â”€ */}
          <section id="section-hero" className="relative pt-16 pb-20 sm:pt-24 lg:pt-32">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
                {/* Left */}
                <motion.div 
                  initial={{ opacity: 0, x: -30 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  transition={{ duration: 0.8, ease: "easeOut" }}
                  className="flex flex-col gap-6"
                >
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md text-primary text-xs font-bold uppercase tracking-wider w-fit shadow-sm">
                    <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>
                    {t('landing.hero.badge', 'Trusted by 120+ Clinical Partners')}
                  </div>

                  <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-[1.1] tracking-tight">
                    {t('landing.hero.title1', 'Supporting')}{' '}
                    <span className="relative inline-block">
                      <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-primary via-blue-500 to-purple-600">
                        {t('landing.hero.titleHighlight', 'Cognitive Health')}
                      </span>
                      <motion.svg 
                        initial={{ pathLength: 0 }} 
                        animate={{ pathLength: 1 }} 
                        transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                        className="absolute -bottom-2 left-0 w-full h-3 text-purple-500/40" viewBox="0 0 200 8" preserveAspectRatio="none"
                      >
                        <path d="M0,5 Q50,0 100,5 T200,5" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                      </motion.svg>
                    </span>{' '}
                    {t('landing.hero.title2', 'Together')}
                  </h1>

                  <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-lg leading-relaxed font-medium">
                    {t('landing.hero.subtitle', 'Empowering families and healthcare professionals with advanced AI tools for seamless cognitive care management and real-time insights.')}
                  </p>

                  <div className="flex flex-wrap gap-4 pt-4">
                    <motion.button 
                      data-cogni-interactive
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/org/login')} 
                      className="group relative px-8 py-4 bg-primary text-white font-bold rounded-2xl shadow-[0_0_40px_-10px_rgba(37,99,235,0.6)] hover:shadow-[0_0_60px_-15px_rgba(37,99,235,0.8)] overflow-hidden transition-all text-sm sm:text-base flex items-center gap-2"
                    >
                      <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                      <span className="relative z-10">{t('landing.hero.cta', 'Get Started Free')}</span>
                      <span className="material-symbols-outlined text-xl relative z-10 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </motion.button>
                    <motion.button 
                      data-cogni-interactive
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-8 py-4 bg-white/60 dark:bg-slate-800/60 backdrop-blur-md border border-white/50 dark:border-slate-700/50 font-bold rounded-2xl hover:bg-white/80 dark:hover:bg-slate-800/80 transition-all flex items-center gap-2 text-sm sm:text-base shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
                    >
                      <span className="material-symbols-outlined text-xl text-primary">play_circle</span>
                      <span className="relative z-10">{t('landing.hero.demo', 'Watch Demo')}</span>
                    </motion.button>
                  </div>

                  {/* Mobile App Download */}
                  <div className="flex items-center gap-4 pt-6">
                    {androidDownloadReady ? (
                      <a
                        data-cogni-interactive
                        href={androidRelease.downloadUrl}
                        download
                        className="flex items-center gap-3 px-5 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 transition-all group"
                      >
                        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.523 15.3414c-.5 0-.909.409-.909.909 0 .5.409.909.909.909.5 0 .909-.409.909-.909 0-.5-.409-.909-.909-.909zm-11.046 0c-.5 0-.909.409-.909.909 0 .5.409.909.909.909.5 0 .909-.409.909-.909 0-.5-.409-.909-.909-.909zm11.4-6.117l2.033-3.521c.111-.192.045-.438-.147-.549-.192-.111-.438-.045-.549.147L17.153 8.89c-1.428-.655-3.031-1.024-4.653-1.024s-3.225.369-4.653 1.024L6.787 5.301c-.111-.192-.357-.258-.549-.147-.192.111-.258.357-.147.549l2.033 3.521C5.717 10.595 3.75 13.562 3.75 17.041h16.5c0-3.479-1.967-6.446-4.923-7.817z"/>
                        </svg>
                        <div className="flex flex-col items-start">
                          <span className="text-xs opacity-75">
                            {t('landing.download.get', 'Get the app')}
                          </span>
                          <span className="text-sm font-bold">
                            {t('landing.download.android', 'Download APK')} {androidRelease.version}
                          </span>
                        </div>
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="flex items-center gap-3 px-5 py-3 bg-slate-300/70 text-slate-600 rounded-xl cursor-not-allowed dark:bg-slate-700/70 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined">android</span>
                        <div className="flex flex-col items-start">
                          <span className="text-xs opacity-75">
                            {releaseLoading ? 'Checking release' : 'Android pilot'}
                          </span>
                          <span className="text-sm font-bold">
                            {releaseLoading ? 'Preparing download…' : 'Download coming soon'}
                          </span>
                        </div>
                      </button>
                    )}
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-[200px]">
                      {androidDownloadReady
                        ? `Android ${androidRelease.version} is ready. ${androidRelease.notes || 'iOS is coming soon.'}`
                        : t('landing.download.desc', 'Available for Android soon. iOS version coming later.')}
                    </p>
                  </div>
                </motion.div>

                {/* Right "” Rotating Showcase card floating in 3D-light background */}
                <motion.div 
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 1, delay: 0.2 }}
                  className="hidden lg:block relative z-10 pointer-events-auto"
                >
                  <div className="relative">
                    <div className="absolute -inset-10 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl rounded-full" />
                    <div className="relative rounded-3xl border border-white/40 dark:border-slate-700/40 shadow-2xl overflow-hidden bg-white/30 dark:bg-slate-900/40 backdrop-blur-2xl">
                      {/* Slide container */}
                      <div className="relative h-[380px]">
                        <AnimatePresence mode="wait">
                          <motion.div 
                            key={activeSlide}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.02 }}
                            transition={{ duration: 0.5 }}
                            className="absolute inset-0"
                          >
                            <div className={`h-full bg-gradient-to-br ${SLIDES[activeSlide].gradient} p-6 flex flex-col`}>
                              {/* Header */}
                              <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-inner">
                                  <span className="material-symbols-outlined text-white text-2xl">{SLIDES[activeSlide].icon}</span>
                                </div>
                                <div>
                                  <p className="text-white text-base font-bold tracking-wide">{SLIDES[activeSlide].title}</p>
                                  <p className="text-white/70 text-xs font-medium">{SLIDES[activeSlide].sub}</p>
                                </div>
                                <div className="ml-auto flex gap-1.5 bg-black/20 px-2 py-1.5 rounded-full">
                                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                                  <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                                </div>
                              </div>
                              <div className="flex-1"><SlideContent slide={SLIDES[activeSlide]} /></div>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      </div>
                      {/* Dots + label */}
                      <div className="flex items-center justify-between px-6 py-4 border-t border-white/20 dark:border-slate-700/50 bg-white/20 dark:bg-slate-900/50 backdrop-blur-xl">
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{SLIDES[activeSlide].title}</p>
                        <div className="flex gap-2">
                          {SLIDES.map((_, i) => (
                            <button data-cogni-interactive key={i} onClick={() => setActiveSlide(i)} className={`h-2 rounded-full transition-all duration-500 shadow-sm ${i === activeSlide ? 'w-8 bg-primary' : 'w-2 bg-slate-400/50 dark:bg-slate-500/50 hover:bg-primary/50'}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* â”€â”€ Glass Features â”€â”€ */}
          <section id="section-features" className="py-20 sm:py-32 relative z-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="text-center mb-16"
              >
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
                  {t('landing.platform.title', 'One Platform, Three Dashboards')}
                </h2>
                <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-base sm:text-lg font-medium">
                  {t('landing.platform.subtitle', 'Seamlessly connected experiences tailored for every stakeholder in the cognitive care journey.')}
                </p>
              </motion.div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                  { icon: 'leaderboard', title: t('landing.roles.org', 'Org Leader Portal'), desc: t('landing.roles.orgDesc', 'High-level strategic oversight, resource allocation, and organizational performance management.'), link: '/org/login', gradient: 'from-purple-500/20 to-indigo-600/20', iconColor: 'text-purple-500' },
                  { icon: 'medical_services', title: t('landing.roles.pro', 'Professional Suite'), desc: t('landing.roles.proDesc', 'Specialized clinical tools for deep patient care, automated assessments, and therapy planning.'), link: '/specialist/login', gradient: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-500' },
                  { icon: 'admin_panel_settings', title: t('landing.roles.admin', 'Admin Console'), desc: t('landing.roles.adminDesc', 'Robust system controls, granular security monitoring, and user permission management.'), link: '/admin/login', gradient: 'from-slate-500/20 to-slate-700/20', iconColor: 'text-slate-500' },
                ].map((card, idx) => (
                  <motion.div 
                    data-cogni-interactive
                    key={card.title} 
                    onClick={() => navigate(card.link)}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6, delay: idx * 0.15 }}
                    whileHover={{ y: -10, scale: 1.02 }}
                    className="group relative p-8 rounded-3xl bg-white/40 dark:bg-slate-900/40 border border-white/50 dark:border-slate-700/50 hover:border-white dark:hover:border-slate-600 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.1)] backdrop-blur-xl transition-all cursor-pointer overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl -z-10`} />
                    <div className="h-14 w-14 rounded-2xl bg-white dark:bg-slate-800 shadow-md flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg transition-transform duration-300">
                      <span className={`material-symbols-outlined text-3xl ${card.iconColor}`}>{card.icon}</span>
                    </div>
                    <h3 className="text-xl font-black mb-3">{card.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6 font-medium">{card.desc}</p>
                    <div className="inline-flex items-center gap-2 text-primary font-bold group-hover:gap-3 transition-all">
                      {t('landing.learnMore', 'Get Started')}
                      <span className="material-symbols-outlined text-lg">arrow_forward</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <section id="section-download" className="py-20 relative z-10">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="mb-14 text-center"
              >
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                  Pilot Access for Web and Android
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-base sm:text-lg font-medium text-slate-600 dark:text-slate-400">
                  Organizations, specialists, and admins can access CogniCare directly from this website, while families can install the current Android pilot build from the same public entrypoint.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5 }}
                  className="rounded-[2rem] border border-white/40 bg-white/50 p-7 shadow-[0_20px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600">
                      <span className="material-symbols-outlined">android</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-emerald-600">
                        Android
                      </p>
                      <h3 className="text-xl font-black">Mobile pilot build</h3>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {androidDownloadReady
                      ? `Version ${androidRelease.version} is published and ready for direct download. ${androidRelease.notes || ''}`
                      : releaseLoading
                        ? 'Checking the latest Android release manifest now.'
                        : androidRelease.notes}
                  </p>
                  <div className="mt-6">
                    {androidDownloadReady ? (
                      <a
                        href={androidRelease.downloadUrl}
                        download
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
                      >
                        <span className="material-symbols-outlined text-[18px]">download</span>
                        <span>Download Android {androidRelease.version}</span>
                      </a>
                    ) : (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-2 rounded-2xl bg-slate-300/80 px-5 py-3 text-sm font-bold text-slate-600 cursor-not-allowed dark:bg-slate-700 dark:text-slate-300"
                      >
                        <span className="material-symbols-outlined text-[18px]">hourglass_top</span>
                        <span>Android build pending</span>
                      </button>
                    )}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: 0.08 }}
                  className="rounded-[2rem] border border-white/40 bg-white/50 p-7 shadow-[0_20px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                      <span className="material-symbols-outlined">language</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-primary">
                        Web
                      </p>
                      <h3 className="text-xl font-black">Role-based dashboards</h3>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    The same public website is the pilot access point for organization leaders, specialists, and admins. Choose the role entry that matches your test account and sign in directly here.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/org/login')}
                      className="rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/15"
                    >
                      Organization login
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/specialist/login')}
                      className="rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    >
                      Specialist login
                    </button>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: 0.16 }}
                  className="rounded-[2rem] border border-white/40 bg-white/50 p-7 shadow-[0_20px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-slate-700/50 dark:bg-slate-900/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900/10 text-slate-700 dark:bg-white/10 dark:text-slate-100">
                      <span className="material-symbols-outlined">phone_iphone</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">
                        iOS
                      </p>
                      <h3 className="text-xl font-black">Coming later</h3>
                    </div>
                  </div>
                  <p className="mt-5 text-sm leading-6 text-slate-600 dark:text-slate-300">
                    {iosRelease.notes}
                  </p>
                  <div className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <span className="material-symbols-outlined text-[18px]">schedule</span>
                    <span>{iosRelease.version}</span>
                  </div>
                </motion.div>
              </div>
            </div>
          </section>

          {/* â”€â”€ Interactive CTA â”€â”€ */}
          <section id="section-cta" className="py-20 relative z-10">
            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="relative rounded-[2.5rem] bg-gradient-to-br from-primary via-blue-600 to-indigo-800 p-12 sm:p-20 text-center overflow-hidden shadow-2xl shadow-primary/30"
              >
                <div className="absolute inset-0 pointer-events-none opacity-50 mix-blend-overlay" style={{backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'60\\' height=\\'60\\' viewBox=\\'0 0 60 60\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cg fill=\\'none\\' fill-rule=\\'evenodd\\'%3E%3Cg fill=\\'%23ffffff\\' fill-opacity=\\'0.4\\'%3E%3Cpath d=\\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')"}}></div>
                <div className="absolute flex -inset-20 opacity-30 animate-spin-slow pointer-events-none">
                   <div className="w-full h-full bg-gradient-to-t from-white/20 to-transparent blur-3xl"></div>
                </div>
                
                <div className="relative z-10 flex flex-col items-center">
                  <div className="h-20 w-20 bg-white/20 backdrop-blur-xl rounded-3xl p-4 shadow-2xl mb-8 border border-white/30">
                    <img src={logo} alt="CogniCare" className="h-full w-full object-contain filter drop-shadow-md" />
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black text-white mb-6 leading-tight">
                    {t('landing.cta.title', 'Ready to Transform Care?')}
                  </h2>
                  <p className="text-white/90 max-w-xl mx-auto mb-10 text-lg font-medium leading-relaxed">
                    {t('landing.cta.subtitle', 'Join hundreds of organizations already using CogniCare to improve cognitive health outcomes and provide exceptional support.')}
                  </p>
                  <div className="flex flex-wrap gap-4 justify-center">
                    <motion.button 
                      data-cogni-interactive
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/org/login?mode=signup')} 
                      className="px-10 py-4 bg-white text-primary font-black rounded-2xl hover:bg-slate-50 transition-all shadow-xl shadow-white/20 text-lg"
                    >
                      {t('landing.cta.signup', 'Create Free Account')}
                    </motion.button>
                    <motion.button 
                      data-cogni-interactive
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/admin/login')} 
                      className="px-10 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-2xl hover:bg-white/20 border border-white/30 transition-all text-lg"
                    >
                      {t('landing.cta.contact', 'Contact Sales')}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        {/* â”€â”€ Footer â”€â”€ */}
        <footer id="section-footer" className="relative z-10 border-t border-white/20 dark:border-slate-800/50 bg-white/60 dark:bg-slate-950/60 backdrop-blur-xl mt-auto">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-3">
                <img src={logo} alt="CogniCare" className="h-8 w-8 rounded-lg object-contain" />
                <span className="font-bold text-lg">CogniCare Systems</span>
              </div>
              <div className="flex gap-6 text-sm font-semibold text-slate-500 dark:text-slate-400">
                <a className="hover:text-primary transition-colors" href="#">Privacy</a>
                <a className="hover:text-primary transition-colors" href="#">Terms</a>
                <a className="hover:text-primary transition-colors" href="#">Contact</a>
              </div>
              <p className="text-sm font-medium text-slate-400">&copy; 2026 CogniCare. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
