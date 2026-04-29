import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from 'react-i18next';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <button
      onClick={toggleTheme}
      className={`flex items-center justify-center rounded-lg size-10 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-all ${className}`}
      aria-label={theme === 'dark' ? t('common.switchToLight') : t('common.switchToDark')}
    >
      <span className="material-symbols-outlined text-xl">
        {theme === 'dark' ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
