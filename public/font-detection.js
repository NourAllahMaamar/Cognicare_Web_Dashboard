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
  var maxRetries = wasCached ? 10 : 5;
  var retryDelay = wasCached ? 50 : 100;
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

  // Hard fallback: reveal icons after 1.5s regardless so the UI is usable
  // Reduced from 3s for better UX on slow connections
  setTimeout(function () {
    if (!fontsLoaded) {
      if (!checkFont()) {
        // Font still not loaded, force show with fallback
        document.documentElement.classList.add('fonts-loaded');
        console.warn('Material Symbols font timeout - forced display after 1.5s');
      }
    }
  }, 1500);
})();
