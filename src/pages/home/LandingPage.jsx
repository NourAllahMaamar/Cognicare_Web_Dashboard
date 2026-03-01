import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ui/ThemeToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import logo from '../../assets/app_logo_withoutbackground.png';

/* â”€â”€ Scroll reveal hook â”€â”€ */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* â”€â”€ Animated counter â”€â”€ */
function CountUp({ target, suffix = '', visible, duration = 1800 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!visible) return;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration]);
  return <>{val}{suffix}</>;
}

/* â”€â”€ Hero slides â”€â”€ */
const SLIDES = [
  {
    id: 'admin',
    title: 'Admin Dashboard',
    sub: 'System-wide analytics & control',
    icon: 'admin_panel_settings',
    gradient: 'from-slate-800 to-slate-900',
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
    gradient: 'from-blue-700 to-blue-900',
    accent: '#3B82F6',
    rows: [
      { type: 'badges', items: ['Phase III', '6 Cards', 'ðŸ† 2 Mastered'] },
      { type: 'cards', count: 6 },
      { type: 'trials' },
    ],
  },
  {
    id: 'org',
    title: 'Organization Portal',
    sub: 'Staff & family management',
    icon: 'corporate_fare',
    gradient: 'from-purple-800 to-indigo-900',
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
    gradient: 'from-cyan-700 to-blue-900',
    accent: '#06B6D4',
    rows: [
      { type: 'badges', items: ['Pattern Analysis', 'Early Detection', 'Smart Alerts'] },
      { type: 'progress', items: [85, 62, 94] },
      { type: 'list', count: 3 },
    ],
  },
];

/* â”€â”€ Mini renderers for slide content â”€â”€ */
function SlideContent({ slide }) {
  return (
    <div className="space-y-2.5">
      {slide.rows.map((row, ri) => {
        if (row.type === 'stats')
          return (
            <div key={ri} className="grid grid-cols-3 gap-1.5">
              {row.items.map((s, i) => (
                <div key={i} className="bg-white/10 rounded-lg p-2">
                  <div className={`w-4 h-4 rounded ${s.c} mb-1 opacity-80`} />
                  <p className="text-white text-xs font-black">{s.v}</p>
                  <p className="text-white/50 text-[8px]">{s.l}</p>
                </div>
              ))}
            </div>
          );
        if (row.type === 'chart')
          return (
            <div key={ri} className="bg-white/5 rounded-lg p-2.5">
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
                <div key={i} className="bg-white/10 rounded-lg p-1.5 flex flex-col items-center gap-1">
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
                <span key={i} className="px-2 py-0.5 rounded-full bg-white/10 text-white/80 text-[9px] font-semibold">{b}</span>
              ))}
            </div>
          );
        if (row.type === 'trials')
          return (
            <div key={ri} className="grid grid-cols-10 gap-0.5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className={`aspect-square rounded text-[7px] font-bold flex items-center justify-center ${i < 6 ? 'bg-emerald-400/40 text-emerald-200' : i < 8 ? 'bg-red-400/40 text-red-200' : 'bg-white/10 text-white/30'}`}>
                  {i < 6 ? 'âœ“' : i < 8 ? 'âœ—' : ''}
                </div>
              ))}
            </div>
          );
        if (row.type === 'team')
          return (
            <div key={ri} className="flex -space-x-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-full border-2 border-white/20 bg-gradient-to-br from-white/20 to-white/5 flex items-center justify-center text-white/60 text-[9px] font-bold">
                  {String.fromCharCode(65 + i)}
                </div>
              ))}
              <div className="w-7 h-7 rounded-full border-2 border-white/20 bg-white/10 flex items-center justify-center text-white/50 text-[8px]">+12</div>
            </div>
          );
        if (row.type === 'progress')
          return (
            <div key={ri} className="space-y-1.5">
              {row.items.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
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
                  <div className="h-1.5 flex-1 bg-white/10 rounded-full" />
                  <div className="h-1.5 w-8 bg-white/10 rounded-full" />
                </div>
              ))}
            </div>
          );
        return null;
      })}
    </div>
  );
}

/* â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */
export default function LandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* Carousel */
  const [activeSlide, setActiveSlide] = useState(0);
  const slideTimer = useRef(null);
  const resetTimer = useCallback(() => {
    clearInterval(slideTimer.current);
    slideTimer.current = setInterval(() => setActiveSlide(p => (p + 1) % SLIDES.length), 4500);
  }, []);
  useEffect(() => { resetTimer(); return () => clearInterval(slideTimer.current); }, [resetTimer]);
  const goSlide = (i) => { setActiveSlide(i); resetTimer(); };

  /* Scroll reveals */
  const [statsRef, statsVis] = useReveal(0.3);
  const [portalRef, portalVis] = useReveal();
  const [featRef, featVis] = useReveal();
  const [stepsRef, stepsVis] = useReveal();

  const navItems = [
    { label: t('landing.nav.orgLeaders', 'Organizations'), to: '/org/login' },
    { label: t('landing.nav.professionals', 'Professionals'), to: '/specialist/login' },
    { label: t('landing.nav.admins', 'Admins'), to: '/admin/login' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-bg-light dark:bg-bg-dark text-slate-900 dark:text-slate-100 font-display overflow-x-hidden">

      {/* â”€â”€ Header â”€â”€ */}
      <header className="sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-surface-dark/80 backdrop-blur-lg">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2.5 shrink-0">
              <img src={logo} alt="CogniCare" className="h-10 w-10 rounded-xl object-contain" />
              <span className="text-lg font-bold tracking-tight">CogniCare</span>
            </div>
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map(n => (
                <button key={n.to} onClick={() => navigate(n.to)} className="text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-primary transition-colors">{n.label}</button>
              ))}
            </nav>
            <div className="flex items-center gap-1.5">
              <LanguageSwitcher />
              <ThemeToggle />
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
              </button>
            </div>
          </div>
        </div>
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark">
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navItems.map(n => (
                <button key={n.to} onClick={() => { navigate(n.to); setMobileMenuOpen(false); }} className="text-left px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-primary transition-colors">{n.label}</button>
              ))}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">

        {/* â”€â”€ Hero â”€â”€ */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 animate-pulse" style={{ animationDuration: '8s' }} />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 dark:bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4 animate-pulse" style={{ animationDuration: '10s' }} />
          </div>

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              {/* Left */}
              <div className="flex flex-col gap-6">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider w-fit">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-primary" /></span>
                  {t('landing.hero.badge', 'Trusted by 120+ Clinical Partners')}
                </div>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.08] tracking-tight">
                  {t('landing.hero.title1', 'Supporting')}{' '}
                  <span className="text-primary relative">
                    {t('landing.hero.titleHighlight', 'Cognitive Health')}
                    <svg className="absolute -bottom-1 left-0 w-full h-2 text-primary/30" viewBox="0 0 200 8" preserveAspectRatio="none"><path d="M0,5 Q50,0 100,5 T200,5" fill="none" stroke="currentColor" strokeWidth="3" /></svg>
                  </span>{' '}
                  {t('landing.hero.title2', 'Together')}
                </h1>

                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-lg leading-relaxed">
                  {t('landing.hero.subtitle', 'Empowering families and healthcare professionals with advanced AI tools for seamless cognitive care management and real-time insights.')}
                </p>

                <div className="flex flex-wrap gap-3 pt-2">
                  <button onClick={() => navigate('/org/login')} className="group px-7 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.97] text-sm flex items-center gap-2">
                    {t('landing.hero.cta', 'Get Started Free')}
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                  </button>
                  <button className="px-7 py-3.5 bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2 text-sm shadow-sm">
                    <span className="material-symbols-outlined text-lg text-primary">play_circle</span>
                    {t('landing.hero.demo', 'Watch Demo')}
                  </button>
                </div>

                {/* Trust row */}
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex -space-x-2">
                    {['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'].map((c, i) => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-surface-dark flex items-center justify-center text-white text-xs font-bold" style={{ background: c }}>{String.fromCharCode(65 + i)}</div>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-700 dark:text-slate-200">500+</span> professionals trust CogniCare
                  </div>
                </div>
              </div>

              {/* Right â€” Rotating Showcase */}
              <div className="hidden lg:block">
                <div className="relative">
                  <div className="absolute -inset-6 bg-primary/10 dark:bg-primary/5 blur-3xl rounded-full" />
                  <div className="relative rounded-2xl border border-slate-300 dark:border-slate-800 shadow-2xl shadow-primary/5 overflow-hidden bg-white dark:bg-surface-dark">
                    {/* Slide container */}
                    <div className="relative h-[340px]">
                      {SLIDES.map((slide, i) => (
                        <div key={slide.id} className={`absolute inset-0 transition-all duration-700 ease-in-out ${i === activeSlide ? 'opacity-100 translate-x-0' : i < activeSlide ? 'opacity-0 -translate-x-8' : 'opacity-0 translate-x-8'}`}>
                          <div className={`h-full bg-gradient-to-br ${slide.gradient} p-5 flex flex-col`}>
                            {/* Header */}
                            <div className="flex items-center gap-3 mb-4">
                              <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
                                <span className="material-symbols-outlined text-white text-lg">{slide.icon}</span>
                              </div>
                              <div>
                                <p className="text-white text-sm font-bold">{slide.title}</p>
                                <p className="text-white/50 text-[10px]">{slide.sub}</p>
                              </div>
                              <div className="ml-auto flex gap-1">
                                <div className="w-2 h-2 rounded-full bg-red-400/60" />
                                <div className="w-2 h-2 rounded-full bg-amber-400/60" />
                                <div className="w-2 h-2 rounded-full bg-green-400/60" />
                              </div>
                            </div>
                            <div className="flex-1"><SlideContent slide={slide} /></div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Dots + label */}
                    <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800">
                      <p className="text-xs font-medium text-slate-500">{SLIDES[activeSlide].title}</p>
                      <div className="flex gap-1.5">
                        {SLIDES.map((_, i) => (
                          <button key={i} onClick={() => goSlide(i)} className={`h-1.5 rounded-full transition-all duration-300 ${i === activeSlide ? 'w-6 bg-primary' : 'w-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-primary/50'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* â”€â”€ Stats â”€â”€ */}
        <section ref={statsRef} className="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className={`grid grid-cols-1 sm:grid-cols-3 gap-6 transition-all duration-700 ${statsVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              {[
                { label: t('landing.stats.families', 'Families Supported'), target: 500, suffix: '+', trend: '+15%', icon: 'family_restroom' },
                { label: t('landing.stats.partners', 'Clinical Partners'), target: 120, suffix: '+', trend: '+8%', icon: 'handshake' },
                { label: t('landing.stats.accuracy', 'Success Rate'), target: 98, suffix: '%', trend: '+2%', icon: 'verified' },
              ].map((stat, idx) => (
                <div key={stat.label} className="flex items-center gap-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40" style={{ transitionDelay: `${idx * 100}ms` }}>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <span className="material-symbols-outlined text-xl">{stat.icon}</span>
                  </div>
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black"><CountUp target={stat.target} suffix={stat.suffix} visible={statsVis} /></span>
                      <span className="text-success text-xs font-bold flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-xs">trending_up</span>{stat.trend}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-0.5">{stat.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* â”€â”€ Three Portals â”€â”€ */}
        <section ref={portalRef} className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={`text-center mb-12 sm:mb-16 transition-all duration-700 ${portalVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-3">
                {t('landing.platform.title', 'One Platform, Three Dashboards')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
                {t('landing.platform.subtitle', 'Seamlessly connected experiences tailored for every stakeholder in the cognitive care journey.')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { icon: 'leaderboard', title: t('landing.roles.org', 'Org Leader Portal'), desc: t('landing.roles.orgDesc', 'High-level strategic oversight, resource allocation, and organizational performance management.'), link: '/org/login', gradient: 'from-purple-500 to-indigo-600' },
                { icon: 'medical_services', title: t('landing.roles.pro', 'Professional Suite'), desc: t('landing.roles.proDesc', 'Specialized clinical tools for deep patient care, automated assessments, and therapy planning.'), link: '/specialist/login', gradient: 'from-blue-500 to-cyan-500' },
                { icon: 'admin_panel_settings', title: t('landing.roles.admin', 'Admin Console'), desc: t('landing.roles.adminDesc', 'Robust system controls, granular security monitoring, and user permission management.'), link: '/admin/login', gradient: 'from-slate-700 to-slate-900' },
              ].map((card, idx) => (
                <div key={card.title} onClick={() => navigate(card.link)}
                  className={`group p-6 sm:p-8 rounded-2xl bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-800 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer ${portalVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${200 + idx * 100}ms` }}>
                  <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white mb-5 group-hover:scale-110 group-hover:shadow-lg transition-all`}>
                    <span className="material-symbols-outlined text-2xl">{card.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{card.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">{card.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-primary text-sm font-semibold group-hover:gap-2.5 transition-all">
                    {t('landing.learnMore', 'Get Started')}
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* â”€â”€ Features â”€â”€ */}
        <section ref={featRef} className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              {/* Features list */}
              <div className={`flex flex-col gap-8 transition-all duration-700 ${featVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                <div>
                  <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-3">
                    {t('landing.features.title', 'Advanced Features')}
                  </h2>
                  <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
                    {t('landing.features.subtitle', 'Pioneering tools designed to improve outcomes and simplify cognitive health tracking.')}
                  </p>
                </div>
                <div className="flex flex-col gap-5">
                  {[
                    { icon: 'psychology', title: t('landing.features.ai', 'AI-Driven Insights'), desc: t('landing.features.aiDesc', 'Our algorithms analyze behavior patterns to predict cognitive trends and enable early intervention.'), color: 'from-blue-500 to-primary' },
                    { icon: 'monitoring', title: t('landing.features.tracking', 'Real-time Tracking'), desc: t('landing.features.trackingDesc', 'Monitor patient progress and cognitive markers in real-time with instant alerts for families and care teams.'), color: 'from-emerald-500 to-teal-600' },
                    { icon: 'shield', title: t('landing.features.security', 'Secure & Compliant'), desc: t('landing.features.securityDesc', 'Enterprise-grade security ensuring all data is encrypted and managed with the highest standards.'), color: 'from-purple-500 to-indigo-600' },
                  ].map((f, idx) => (
                    <div key={f.title} className="group flex gap-4 p-4 rounded-xl hover:bg-white dark:hover:bg-surface-dark hover:shadow-md transition-all" style={{ transitionDelay: `${idx * 80}ms` }}>
                      <div className={`h-11 w-11 shrink-0 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform`}>
                        <span className="material-symbols-outlined text-xl">{f.icon}</span>
                      </div>
                      <div>
                        <h4 className="font-bold mb-1">{f.title}</h4>
                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right â€” Large brain network */}
              <div className={`order-first lg:order-last transition-all duration-700 delay-200 ${featVis ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                <div className="aspect-square bg-white dark:bg-surface-dark rounded-3xl border border-slate-300 dark:border-slate-800 flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-purple-500/10" />
                  <div className="relative z-10 w-full h-full flex flex-col items-center justify-center p-6 gap-6">
                    {/* Full-size brain network */}
                    <svg viewBox="0 0 200 200" className="w-full h-full max-w-[320px] max-h-[320px] opacity-90">
                      <defs>
                        <radialGradient id="nodeGlow2" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
                        </radialGradient>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2" />
                        </linearGradient>
                      </defs>
                      {/* Lines */}
                      {[[100,40,50,85],[100,40,150,85],[100,40,100,100],[50,85,100,100],[150,85,100,100],[50,85,25,130],[150,85,175,130],[100,100,70,150],[100,100,130,150],[25,130,70,150],[175,130,130,150],[70,150,100,175],[130,150,100,175],[25,130,50,85],[175,130,150,85]].map(([x1,y1,x2,y2],i) => (
                        <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="url(#lineGrad)" strokeWidth="1.5" />
                      ))}
                      {/* Nodes */}
                      {[{x:100,y:40,r:10,p:true},{x:50,y:85,r:7},{x:150,y:85,r:7},{x:100,y:100,r:9,p:true},{x:25,y:130,r:6},{x:175,y:130,r:6},{x:70,y:150,r:6},{x:130,y:150,r:6},{x:100,y:175,r:7,p:true}].map((n,i) => (
                        <g key={i}>
                          <circle cx={n.x} cy={n.y} r={n.r*3} fill="url(#nodeGlow2)" />
                          <circle cx={n.x} cy={n.y} r={n.r} fill={n.p ? '#2563EB' : '#93c5fd'} opacity={n.p ? 1 : 0.7} />
                          <circle cx={n.x} cy={n.y} r={n.r-2.5} fill="white" opacity="0.25" />
                        </g>
                      ))}
                      {/* Pulse on primary nodes */}
                      {[[100,40,3],[100,100,2.5],[100,175,3.5]].map(([cx,cy,dur],i) => (
                        <circle key={`p${i}`} cx={cx} cy={cy} r="10" fill="none" stroke="#2563EB" strokeWidth="1.5" opacity="0.15">
                          <animate attributeName="r" values="10;25;10" dur={`${dur}s`} repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.25;0;0.25" dur={`${dur}s`} repeatCount="indefinite" />
                        </circle>
                      ))}
                      {/* Floating data particles */}
                      {[{cx:30,cy:60,dur:'4s'},{cx:170,cy:55,dur:'3.5s'},{cx:55,cy:165,dur:'5s'},{cx:145,cy:170,dur:'4.5s'}].map((p,i) => (
                        <circle key={`d${i}`} cx={p.cx} cy={p.cy} r="2" fill="#2563EB" opacity="0.3">
                          <animate attributeName="cy" values={`${p.cy};${p.cy-15};${p.cy}`} dur={p.dur} repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.3;0.6;0.3" dur={p.dur} repeatCount="indefinite" />
                        </circle>
                      ))}
                    </svg>
                    {/* Labels */}
                    <div className="flex gap-2 flex-wrap justify-center">
                      {[
                        t('landing.features.ai_label1', 'Pattern Analysis'),
                        t('landing.features.ai_label2', 'Early Detection'),
                        t('landing.features.ai_label3', 'Smart Alerts'),
                        t('landing.features.ai_label4', 'Predictive Care'),
                      ].map(label => (
                        <span key={label} className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-semibold">{label}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* â”€â”€ How It Works â”€â”€ */}
        <section ref={stepsRef} className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={`text-center mb-12 transition-all duration-700 ${stepsVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-3">
                {t('landing.howItWorks.title', 'How It Works')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-xl mx-auto text-sm sm:text-base">
                {t('landing.howItWorks.subtitle', 'Get started in four simple steps and transform your care workflow.')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
              {/* Connecting line (desktop) */}
              <div className="hidden lg:block absolute top-12 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
              {[
                { icon: 'corporate_fare', title: t('landing.steps.s1', 'Create Organization'), desc: t('landing.steps.s1d', 'Register your org with a certificate and get verified within 24 hours.') },
                { icon: 'group_add', title: t('landing.steps.s2', 'Add Your Team'), desc: t('landing.steps.s2d', 'Invite specialists, import staff via Excel, and manage family enrollments.') },
                { icon: 'monitoring', title: t('landing.steps.s3', 'Start Tracking'), desc: t('landing.steps.s3d', 'Create PECS boards, TEACCH trackers, and skill assessments for each child.') },
                { icon: 'auto_awesome', title: t('landing.steps.s4', 'AI-Powered Insights'), desc: t('landing.steps.s4d', 'Get AI-driven recommendations, progress reports, and early intervention alerts.') },
              ].map((step, idx) => (
                <div key={step.title} className={`relative flex flex-col items-center text-center transition-all duration-700 ${stepsVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${200 + idx * 120}ms` }}>
                  <div className="w-14 h-14 rounded-2xl bg-primary text-white flex items-center justify-center text-2xl font-black mb-4 shadow-lg shadow-primary/20 relative z-10">
                    <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                  </div>
                  <span className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-2 text-[10px] font-black text-primary bg-primary/10 w-5 h-5 rounded-full flex items-center justify-center">{idx + 1}</span>
                  <h4 className="font-bold mb-1.5">{step.title}</h4>
                  <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed max-w-[220px]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* â”€â”€ CTA â”€â”€ */}
        <section className="py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-indigo-700 p-10 sm:p-16 text-center overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
                <div className="absolute bottom-0 left-0 w-60 h-60 bg-white/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3" />
              </div>
              <div className="relative z-10">
                <img src={logo} alt="CogniCare" className="h-16 w-16 mx-auto mb-6 rounded-2xl object-contain bg-white/10 p-2" />
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white mb-4">
                  {t('landing.cta.title', 'Ready to Transform Care?')}
                </h2>
                <p className="text-white/80 max-w-lg mx-auto mb-8 text-sm sm:text-base">
                  {t('landing.cta.subtitle', 'Join hundreds of organizations already using CogniCare to improve cognitive health outcomes.')}
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <button onClick={() => navigate('/org/login?mode=signup')} className="px-8 py-3.5 bg-white text-primary font-bold rounded-xl hover:bg-slate-50 transition-all shadow-lg text-sm">
                    {t('landing.cta.signup', 'Create Free Account')}
                  </button>
                  <button onClick={() => navigate('/admin/login')} className="px-8 py-3.5 bg-white/15 text-white font-bold rounded-xl hover:bg-white/25 border border-white/20 transition-all text-sm">
                    {t('landing.cta.contact', 'Contact Sales')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* â”€â”€ Footer â”€â”€ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 sm:gap-12 mb-12">
            <div className="col-span-2 sm:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <img src={logo} alt="CogniCare" className="h-9 w-9 rounded-lg object-contain" />
                <span className="font-bold">CogniCare</span>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('landing.footer.desc', 'Leading the way in collaborative cognitive health management through technology and empathy.')}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4">{t('landing.footer.product', 'Product')}</h4>
              <ul className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400">
                <li><button onClick={() => navigate('/org/login')} className="hover:text-primary transition-colors">{t('landing.nav.orgLeaders', 'Organizations')}</button></li>
                <li><button onClick={() => navigate('/specialist/login')} className="hover:text-primary transition-colors">{t('landing.nav.professionals', 'Professionals')}</button></li>
                <li><button onClick={() => navigate('/admin/login')} className="hover:text-primary transition-colors">{t('landing.nav.admins', 'Admins')}</button></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4">{t('landing.footer.resources', 'Resources')}</h4>
              <ul className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400">
                <li><a className="hover:text-primary transition-colors" href="#">{t('landing.footer.docs', 'Documentation')}</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">{t('landing.footer.help', 'Help Center')}</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">{t('landing.footer.security', 'Security')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-bold mb-4">{t('landing.footer.contact', 'Contact')}</h4>
              <ul className="flex flex-col gap-3 text-sm text-slate-500 dark:text-slate-400">
                <li><a className="hover:text-primary transition-colors" href="#">{t('landing.footer.support', 'Support')}</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">{t('landing.footer.sales', 'Sales')}</a></li>
                <li><a className="hover:text-primary transition-colors" href="#">{t('landing.footer.press', 'Press')}</a></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center pt-8 border-t border-slate-200 dark:border-slate-800 gap-4">
            <p className="text-xs text-slate-400">&copy; 2026 CogniCare Systems. All rights reserved.</p>
            <div className="flex gap-4 text-slate-400">
              <a className="hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">public</span></a>
              <a className="hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">mail</span></a>
              <a className="hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-xl">share</span></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


