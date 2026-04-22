import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRegisterSW } from 'virtual:pwa-register/react';

// How long (ms) before we show the install banner again after it's dismissed.
const INSTALL_DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function isInstallDismissed() {
  try {
    const ts = parseInt(localStorage.getItem('pwa-install-dismissed') || '0', 10);
    return ts > 0 && Date.now() - ts < INSTALL_DISMISS_TTL_MS;
  } catch {
    return false;
  }
}

function isRunningAsApp() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

function detectIOS() {
  return (
    typeof navigator !== 'undefined' &&
    /iphone|ipad|ipod/i.test(navigator.userAgent) &&
    !window.MSStream
  );
}

export default function PWAPrompt() {
  const { t } = useTranslation();
  const [offline, setOffline] = useState(!navigator.onLine);

  // ── Install prompt — Android / Desktop Chrome (beforeinstallprompt) ──
  const [installEvent, setInstallEvent] = useState(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
    if (isRunningAsApp()) return;

    const handler = (e) => {
      e.preventDefault(); // Block the mini-infobar
      setInstallEvent(e);
      if (!isInstallDismissed()) setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => setShowInstall(false);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') {
      setShowInstall(false);
      setInstallEvent(null);
    }
  };

  const dismissInstall = () => {
    try { localStorage.setItem('pwa-install-dismissed', String(Date.now())); } catch {}
    setShowInstall(false);
  };

  // ── iOS Safari install instructions ──────────────────────────────────
  // iOS does not fire beforeinstallprompt. We show a manual instruction banner
  // after a short delay so it doesn't interrupt the initial page load.
  const [showIOSInstall, setShowIOSInstall] = useState(false);

  useEffect(() => {
    if (!detectIOS() || isRunningAsApp() || isInstallDismissed()) return;
    const timer = setTimeout(() => setShowIOSInstall(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  const dismissIOSInstall = () => {
    try { localStorage.setItem('pwa-install-dismissed', String(Date.now())); } catch {}
    setShowIOSInstall(false);
  };

  // ── Service-worker update prompt ──────────────────────────────────────
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, r) {
      // Poll for updates every hour
      if (r) setInterval(() => r.update(), 60 * 60 * 1000);
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
        <div className="fixed top-0 start-0 end-0 z-[9999] bg-warning text-white text-center py-2 text-sm font-medium shadow-lg">
          <span className="material-symbols-outlined text-sm align-middle me-1">cloud_off</span>
          {t('pwa.offline', 'You are currently offline. Some features may be unavailable.')}
        </div>
      )}

      {/* Install banner — Android Chrome / Desktop */}
      {showInstall && !needRefresh && (
        <div className="fixed bottom-6 end-6 z-[9999] max-w-sm bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl p-5 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">
              <span className="material-symbols-outlined">install_mobile</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{t('pwa.installTitle', 'Install CogniCare')}</p>
              <p className="text-xs text-slate-500 dark:text-text-muted mt-1">
                {t('pwa.installDesc', 'Add to your home screen for faster access and offline support.')}
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={dismissInstall}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  {t('pwa.notNow', 'Not now')}
                </button>
                <button
                  onClick={handleInstall}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors shadow-md shadow-primary/20"
                >
                  {t('pwa.install', 'Install')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* iOS Safari install instructions */}
      {showIOSInstall && !needRefresh && !showInstall && (
        <div className="fixed bottom-6 start-4 end-4 z-[9999] bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl p-4 animate-slide-up">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-primary/10 text-primary flex-shrink-0">
              <span className="material-symbols-outlined">ios_share</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">{t('pwa.iosInstallTitle', 'Install CogniCare')}</p>
              <p className="text-xs text-slate-500 dark:text-text-muted mt-1">
                {t(
                  'pwa.iosInstallDesc',
                  'Tap the Share button below, then "Add to Home Screen" to install.',
                )}
              </p>
              {/* Visual cue pointing to the Safari share button at the bottom */}
              <div className="flex items-center gap-1 mt-2 text-xs text-primary font-medium">
                <span className="material-symbols-outlined text-base">ios_share</span>
                <span>→</span>
                <span className="material-symbols-outlined text-base">add_box</span>
                <span>{t('pwa.addToHomeScreen', 'Add to Home Screen')}</span>
              </div>
            </div>
            <button
              onClick={dismissIOSInstall}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
              aria-label={t('pwa.dismiss', 'Dismiss')}
            >
              <span className="material-symbols-outlined text-base text-slate-400">close</span>
            </button>
          </div>
        </div>
      )}

      {/* Update available prompt */}
      {needRefresh && (
        <div className="fixed bottom-6 end-6 z-[9999] max-w-sm bg-white dark:bg-surface-dark border border-slate-300 dark:border-slate-700 rounded-2xl shadow-2xl p-5 animate-slide-up">
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
