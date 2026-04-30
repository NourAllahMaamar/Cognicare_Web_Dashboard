/**
 * Font load failure detection — loaded as a blocking script BEFORE React.
 * `fonts-loaded` is set directly on the <html> element in index.html so icons
 * are always visible. This script only activates `material-icons-fallback-active`
 * if Material Symbols genuinely fails to download (e.g. network offline).
 *
 * Kept as a separate file (not inline) so the Nginx Content-Security-Policy
 * (`script-src 'self'`) allows it without requiring `unsafe-inline`.
 */
(function () {
  if (typeof document === 'undefined' || !document.fonts) return;

  function checkFont() {
    try { return document.fonts.check('24px "Material Symbols Outlined"'); } catch { return false; }
  }

  // Font already cached — nothing to do.
  if (checkFont()) return;

  // Wait for the font to load; only activate fallback on real failure.
  document.fonts
    .load('24px "Material Symbols Outlined"')
    .catch(function () {
      // Network failure: replace icon ligatures with readable text labels.
      document.documentElement.classList.add('material-icons-fallback-active');
    });
})();
