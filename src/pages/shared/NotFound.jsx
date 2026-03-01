import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark px-4">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-5xl">search_off</span>
        </div>
        <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-2xl font-bold mb-3">{t('notFound.title', 'Page Not Found')}</h2>
        <p className="text-slate-500 dark:text-text-muted mb-8">
          {t('notFound.desc', "The page you're looking for doesn't exist or has been moved.")}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <span className="material-symbols-outlined text-sm align-middle mr-1">arrow_back</span>
            {t('notFound.goBack', 'Go Back')}
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
          >
            <span className="material-symbols-outlined text-sm align-middle mr-1">home</span>
            {t('notFound.home', 'Home')}
          </button>
        </div>
      </div>
    </div>
  );
}

