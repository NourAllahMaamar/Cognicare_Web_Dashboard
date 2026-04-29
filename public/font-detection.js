/**
 * Early font detection — loaded as a blocking script BEFORE React.
 * Adds the `fonts-loaded` class to <html> as soon as Material Symbols
 * Outlined is available, enabling the CSS to reveal icon characters.
 *
 * Kept as a separate file (not inline) so the Nginx Content-Security-Policy
 * (`script-src 'self'`) allows it without requiring `unsafe-inline`.
 */
(function () {
  if (typeof document === 'undefined' || !document.fonts) {
    // Fallback for browsers without Font Loading API
    document.documentElement.classList.add('fonts-loaded');
    return;
  }

  var fontsLoaded = false;
  var loadStartTime = Date.now();
  
  // Check if fonts loaded quickly on previous visit (cached)
  var wasCached = false;
  try {
    wasCached = localStorage.getItem('cognicare-fonts-cached') === 'true';
  } catch {}

  var checkFont = function () {
    try {
      if (document.fonts.check('24px "Material Symbols Outlined"')) {
        if (!fontsLoaded) {
          fontsLoaded = true;
          document.documentElement.classList.add('fonts-loaded');
          
          // Cache flag if fonts loaded within 500ms (indicates browser cache)
          var loadTime = Date.now() - loadStartTime;
          if (loadTime < 500) {
            try {
              localStorage.setItem('cognicare-fonts-cached', 'true');
            } catch {}
          }
        }
        return true;
      }
    } catch {}
    return false;
  };

  // Immediate check — serves cached fonts instantly
  if (checkFont()) return;

  // If fonts were previously cached, be more aggressive with checks
  var maxRetries = wasCached ? 20 : 40;
  var retryDelay = wasCached ? 50 : 150;
  var retryCount = 0;

  var retryCheck = function () {
    if (fontsLoaded) return;
    
    if (checkFont()) return;
    
    retryCount++;
    if (retryCount < maxRetries) {
      setTimeout(retryCheck, retryDelay);
    }
  };

  // Async path: wait for the font to load
  document.fonts
    .load('24px "Material Symbols Outlined"')
    .then(function () {
      setTimeout(function () {
        if (!checkFont()) {
          retryCheck();
        }
      }, 30);
    })
    .catch(function () {
      // Font failed to load — show fallback
      console.warn('Material Symbols font failed to load');
      setTimeout(function () {
        if (!fontsLoaded) {
          document.documentElement.classList.add('material-icons-fallback-active');
        }
      }, 500);
    });

  // Extended fallback: if font still not loaded after 6s, show styled text labels.
  // We deliberately do NOT add 'fonts-loaded' here without the font actually being
  // present — that would render raw ligature text like "menu" or "home" instead of icons.
  setTimeout(function () {
    if (!fontsLoaded && !checkFont()) {
      document.documentElement.classList.add('material-icons-fallback-active');
      console.warn('Material Symbols font not available after 6s — activating text fallback');
    }
  }, 6000);
})();
