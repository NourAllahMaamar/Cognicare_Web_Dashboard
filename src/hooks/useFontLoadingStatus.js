import { useEffect, useState } from 'react';

/**
 * Hook to detect Material Symbols font loading status
 * Returns: { fontsLoaded: boolean, usingFallback: boolean }
 */
export default function useFontLoadingStatus() {
  const [fontsLoaded, setFontsLoaded] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('fonts-loaded')
  );
  const [usingFallback, setUsingFallback] = useState(
    typeof document !== 'undefined' && document.documentElement.classList.contains('material-icons-fallback-active')
  );

  useEffect(() => {
    const checkStatus = () => {
      setFontsLoaded(document.documentElement.classList.contains('fonts-loaded'));
      setUsingFallback(document.documentElement.classList.contains('material-icons-fallback-active'));
    };

    // Initial check
    checkStatus();

    // Watch for class changes on <html>
    const observer = new MutationObserver(checkStatus);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    return () => observer.disconnect();
  }, []);

  return { fontsLoaded, usingFallback };
}
