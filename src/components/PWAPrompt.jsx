import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

export default function PWAPrompt() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(!navigator.onLine);

  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Check for updates every hour
      if (r) {
        setInterval(() => r.update(), 60 * 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error:', error);
    },
  });

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <>
      {/* Offline banner */}
      {offline && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-warning text-white text-center py-2 text-sm font-medium shadow-lg">
          <span className="material-symbols-outlined text-sm align-middle mr-1">cloud_off</span>
          {t('pwa.offline', 'You are currently offline. Some features may be unavailable.')}
        </div>
      )}

      {/* Update available prompt */}
      {needRefresh && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl p-5 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">
              <span className="material-symbols-outlined">system_update</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{t('pwa.updateAvailable', 'Update Available')}</p>
              <p className="text-xs text-slate-500 dark:text-text-muted mt-1">
                {t('pwa.updateDesc', 'A new version of CogniCare is ready. Reload to get the latest features.')}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setNeedRefresh(false)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('pwa.later', 'Later')}
                </button>
                <button
                  onClick={() => updateServiceWorker(true)}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
                >
                  {t('pwa.reload', 'Reload')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
