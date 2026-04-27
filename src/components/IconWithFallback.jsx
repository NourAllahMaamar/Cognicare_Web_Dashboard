import { useEffect, useState } from 'react';

/**
 * Material Symbol icon with text fallback for critical navigation items
 * Shows icon when loaded, text label during loading or as permanent fallback
 * 
 * @param {string} icon - Material Symbols icon name (e.g., 'dashboard', 'groups')
 * @param {string} label - Human-readable text fallback (e.g., 'Dashboard', 'Staff')
 * @param {boolean} alwaysShowLabel - If true, always shows label next to icon
 * @param {string} className - Additional CSS classes
 */
export default function IconWithFallback({ 
  icon, 
  label, 
  alwaysShowLabel = false,
  className = '' 
}) {
  const [fontsLoaded, setFontsLoaded] = useState(false);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    // Check if fonts are already loaded
    const checkFontsLoaded = () => {
      const hasClass = document.documentElement.classList.contains('fonts-loaded');
      const hasFallback = document.documentElement.classList.contains('material-icons-fallback-active');
      
      setFontsLoaded(hasClass);
      setUseFallback(hasFallback);
    };

    checkFontsLoaded();

    // Watch for class changes
    const observer = new MutationObserver(checkFontsLoaded);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  // For critical navigation, show text label during loading or as fallback
  const showLabel = alwaysShowLabel || !fontsLoaded || useFallback;

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span 
        className="material-symbols-outlined"
        aria-hidden="true"
      >
        {icon}
      </span>
      {showLabel && (
        <span className="font-medium text-sm">
          {label}
        </span>
      )}
      {!showLabel && (
        <span className="sr-only">{label}</span>
      )}
    </span>
  );
}
