import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧', dir: 'ltr' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇹🇳', dir: 'rtl' },
];

export default function LanguageSwitcher({ variant = 'default' }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [animating, setAnimating] = useState(false);
  const ref = useRef(null);

  const activeCode = (i18n.language || 'en').split('-')[0];
  const current = languages.find(l => l.code === activeCode) || languages[0];

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const changeLanguage = (code) => {
    if (code === current.code) { setOpen(false); return; }
    setAnimating(true);
    const lang = languages.find(l => l.code === code);
    i18n.changeLanguage(code);
    document.documentElement.setAttribute('dir', lang?.dir || 'ltr');
    document.documentElement.setAttribute('lang', code);
    setTimeout(() => { setAnimating(false); setOpen(false); }, 300);
  };

  const isLanding = variant === 'landing';

  return (
    <div ref={ref} className="relative z-[100]">
      <button
        onClick={() => setOpen(!open)}
        className={`group flex items-center gap-2 rounded-xl transition-all duration-200 ${
          isLanding
            ? 'px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-800'
            : 'px-2.5 py-2 hover:bg-slate-100 dark:hover:bg-slate-800'
        }`}
        aria-label="Change language"
      >
        <span className={`transition-transform duration-300 ${animating ? 'scale-125' : 'scale-100'}`}>
          <span className="text-xl leading-none">{current.flag}</span>
        </span>
        <span className="hidden sm:inline text-xs font-bold text-slate-600 dark:text-slate-300 tracking-wide">
          {current.code.toUpperCase()}
        </span>
        <span className={`material-symbols-outlined text-sm text-slate-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          expand_more
        </span>
      </button>

      {/* Dropdown */}
      <div className={`absolute top-full mt-2 w-52 bg-white dark:bg-surface-dark rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl shadow-black/10 overflow-hidden transition-all duration-200 origin-top-right ${
        open
          ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
          : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
      } ${i18n.dir() === 'rtl' ? 'left-0' : 'right-0'}`}>
        <div className="p-1.5">
          <p className="px-3 pt-2 pb-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {t('language.select')}
          </p>
          {languages.map((lang) => {
            const isActive = current.code === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 ${
                  isActive
                    ? 'bg-primary/10 text-primary font-bold'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-300'
                }`}
              >
                <span className="text-xl leading-none">{lang.flag}</span>
                <div className="flex-1 text-left">
                  <span className="block text-sm">{lang.native}</span>
                  <span className="block text-[10px] text-slate-400 font-normal">{lang.name}</span>
                </div>
                {isActive && (
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <span className="material-symbols-outlined text-white text-xs" style={{ fontSize: '14px' }}>check</span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
