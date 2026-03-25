import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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

  const statsItems = [
    { label: t('landing.stats.families', 'Families Supported'), target: 500, suffix: '+', trend: '+15%', icon: 'family_restroom' },
    { label: t('landing.stats.partners', 'Clinical Partners'), target: 120, suffix: '+', trend: '+8%', icon: 'handshake' },
    { label: t('landing.stats.accuracy', 'Success Rate'), target: 98, suffix: '%', trend: '+2%', icon: 'verified' },
  ];

  const portalItems = [
    {
      icon: 'corporate_fare',
      title: t('landing.platform.portals.org.title', 'For Organizations'),
      desc: t('landing.platform.portals.org.desc', 'Manage staff, oversee family progress, and get AI-driven insights on organizational performance.'),
      to: '/org/login',
    },
    {
      icon: 'school',
      title: t('landing.platform.portals.specialist.title', 'For Specialists'),
      desc: t('landing.platform.portals.specialist.desc', 'Create PECS & TEACCH plans, track child development, and collaborate with families in a secure environment.'),
      to: '/specialist/login',
    },
    {
      icon: 'family_restroom',
      title: t('landing.platform.portals.family.title', 'For Families'),
      desc: t('landing.platform.portals.family.desc', 'Access care plans, communicate with specialists, and stay engaged in your child’s cognitive health journey.'),
      to: '/login',
    },
  ];

  const featureItems = [
    {
      icon: 'neurology',
      title: t('landing.features.ai.title', 'AI-Powered Insights'),
      desc: t('landing.features.ai.desc', 'Leverage advanced analytics to track progress, identify patterns, and receive actionable recommendations for better outcomes.'),
    },
    {
      icon: 'wysiwyg',
      title: t('landing.features.pecs.title', 'PECS & TEACCH Tools'),
      desc: t('landing.features.pecs.desc', 'Utilize industry-standard frameworks like Picture Exchange Communication System and TEACCH for structured, visual learning.'),
    },
    {
      icon: 'security',
      title: t('landing.features.secure.title', 'Secure & Compliant'),
      desc: t('landing.features.secure.desc', 'Built with data privacy at its core, ensuring all patient and organizational data is encrypted and handled with the utmost care.'),
    },
    {
      icon: 'hub',
      title: t('landing.features.collaboration.title', 'Collaborative Hub'),
      desc: t('landing.features.collaboration.desc', 'A unified platform connecting organization leaders, specialists, and families for seamless communication and care coordination.'),
    },
  ];

  const stepItems = [
    {
      icon: 'person_add',
      title: t('landing.steps.step1.title', '1. Create Your Account'),
      desc: t('landing.steps.step1.desc', 'Sign up as an organization, specialist, or family member to get started.'),
    },
    {
      icon: 'group',
      title: t('landing.steps.step2.title', '2. Build Your Network'),
      desc: t('landing.steps.step2.desc', 'Invite staff, connect with families, and establish your care ecosystem.'),
    },
    {
      icon: 'checklist',
      title: t('landing.steps.step3.title', '3. Create & Manage Plans'),
      desc: t('landing.steps.step3.desc', 'Develop personalized PECS and TEACCH plans tailored to individual needs.'),
    },
    {
      icon: 'monitoring',
      title: t('landing.steps.step4.title', '4. Track & Analyze'),
      desc: t('landing.steps.step4.desc', 'Monitor progress in real-time and use AI insights to optimize care strategies.'),
    },
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
              <LanguageSwitcher variant="landing" />
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
                    <span className="font-bold text-slate-700 dark:text-slate-200">500+</span> {t('landing.hero.trust', 'professionals trust CogniCare')}
                  </div>
                </div>
              </div>

              {/* Right "” Rotating Showcase */}
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
              {statsItems.map((stat, idx) => (
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
              {portalItems.map((portal, idx) => (
                <div key={portal.title} className={`p-8 rounded-3xl border border-slate-200 dark:border-slate-800 transition-all duration-700 ${portalVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${idx * 100}ms` }}>
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-5">
                    <span className="material-symbols-outlined text-2xl">{portal.icon}</span>
                  </div>
                  <h3 className="text-lg font-bold mb-2">{portal.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 leading-relaxed">{portal.desc}</p>
                  <button onClick={() => navigate(portal.to)} className="group font-bold text-primary text-sm flex items-center gap-2">
                    {t('landing.platform.cta', 'Learn More')}
                    <span className="material-symbols-outlined text-lg group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* â”€â”€ Features â”€â”€ */}
        <section ref={featRef} className="py-16 sm:py-24 bg-slate-50 dark:bg-slate-900/50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={`text-center mb-12 sm:mb-16 transition-all duration-700 ${featVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-3">
                {t('landing.features.title', 'Comprehensive Care, Simplified')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
                {t('landing.features.subtitle', 'CogniCare provides a robust suite of tools designed to support every aspect of cognitive health management.')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featureItems.map((feat, idx) => (
                <div key={feat.title} className={`p-6 rounded-2xl transition-all duration-700 ${featVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${idx * 100}ms` }}>
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                    <span className="material-symbols-outlined">{feat.icon}</span>
                  </div>
                  <h3 className="text-base font-bold mb-1.5">{feat.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* â”€â”€ How it works â”€â”€ */}
        <section ref={stepsRef} className="py-16 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className={`text-center mb-12 sm:mb-16 transition-all duration-700 ${stepsVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-3">
                {t('landing.steps.title', 'Get Started in Minutes')}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto text-sm sm:text-base">
                {t('landing.steps.subtitle', 'Our streamlined onboarding process makes it easy to get your entire organization up and running.')}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
              {stepItems.map((step, idx) => (
                <div key={step.title} className={`relative transition-all duration-700 ${stepsVis ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: `${idx * 100}ms` }}>
                  {idx < 3 && <div className="hidden lg:block absolute top-7 left-full w-full border-t-2 border-dashed border-slate-300 dark:border-slate-700" />}
                  <div className="w-14 h-14 rounded-2xl bg-white dark:bg-surface-dark border-2 border-slate-200 dark:border-slate-800 flex items-center justify-center text-primary mb-4">
                    <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                  </div>
                  <h3 className="text-base font-bold mb-1.5">{step.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* â”€â”€ CTA â”€â”€ */}
        <section className="py-16 sm:py-24">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-3xl bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30 p-10 sm:p-16 text-center overflow-hidden">
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-primary/20 rounded-full blur-2xl" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-primary/20 rounded-full blur-2xl" />
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight mb-4">
                {t('landing.cta.title', 'Ready to Transform Cognitive Care?')}
              </h2>
              <p className="text-primary/80 dark:text-primary/90 max-w-xl mx-auto mb-8">
                {t('landing.cta.subtitle', 'Join hundreds of organizations and professionals who are leveraging CogniCare to provide better, more efficient cognitive health services.')}
              </p>
              <button onClick={() => navigate('/org/login')} className="group px-7 py-3.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:bg-primary-dark hover:shadow-xl hover:shadow-primary/30 transition-all active:scale-[0.97] text-sm flex items-center gap-2 mx-auto">
                {t('landing.hero.cta', 'Get Started Free')}
                <span className="material-symbols-outlined text-lg group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* â”€â”€ Footer â”€â”€ */}
      <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-surface-dark">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              &copy; {new Date().getFullYear()} CogniCare. {t('footer.copyright', 'All rights reserved.')}
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary">{t('footer.privacy', 'Privacy Policy')}</a>
              <a href="#" className="text-xs text-slate-500 dark:text-slate-400 hover:text-primary">{t('footer.contact', 'Contact Us')}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}


