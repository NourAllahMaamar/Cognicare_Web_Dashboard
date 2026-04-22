/**
 * Early font detection — loaded as a blocking script BEFORE React.
 * Adds the `fonts-loaded` class to <html> as soon as Material Symbols
 * Outlined is available, enabling the CSS to reveal icon characters.
 *
 * Kept as a separate file (not inline) so the Nginx Content-Security-Policy
 * (`script-src 'self'`) allows it without requiring `unsafe-inline`.
 */
(function () {
  if (typeof document === 'undefined' || !document.fonts) return;

  var checkFont = function () {
    try {
      if (document.fonts.check('24px "Material Symbols Outlined"')) {
        document.documentElement.classList.add('fonts-loaded');
        return true;
      }
    } catch {}
    return false;
  };

  // Immediate check — serves cached fonts instantly
  if (checkFont()) return;

  // Async path: wait for the font to load
  document.fonts
    .load('24px "Material Symbols Outlined"')
    .then(function () {
      setTimeout(function () {
        if (!checkFont()) setTimeout(checkFont, 100);
      }, 50);
    })
    .catch(function () {
      // Font failed to load — leave class absent; CSS shows placeholder dots
    });

  // Hard fallback: reveal icons after 3 s regardless so the UI is usable
  // even if the Font Loading API is unreliable (older Android WebViews).
  setTimeout(function () {
    if (!document.documentElement.classList.contains('fonts-loaded')) {
      checkFont();
    }
  }, 3000);
})();
