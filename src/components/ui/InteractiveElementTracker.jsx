import { useEffect, useRef } from 'react';

const INTERACTIVE_SELECTOR =
  'button, a, [role="button"], input, textarea, select, summary, [data-cogni-focus], [data-cogni-interactive], [tabindex]:not([tabindex="-1"]), [onclick], .feature-card, .glass-card';

function getElementLabel(element) {
  if (!element) return '';

  return (
    element.getAttribute('aria-label') ||
    element.getAttribute('data-cogni-label') ||
    element.textContent?.replace(/\s+/g, ' ').trim() ||
    element.tagName.toLowerCase()
  );
}

function buildTargetPayload(element) {
  if (!element) return null;

  const rect = element.getBoundingClientRect();
  if (rect.width < 24 || rect.height < 24) return null;
  return {
    rect: {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    },
    label: getElementLabel(element).slice(0, 64),
    kind: element.getAttribute('data-cogni-focus') || element.tagName.toLowerCase(),
    tagName: element.tagName.toLowerCase(),
  };
}

export default function InteractiveElementTracker({ onTargetChange }) {
  const activeElementRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const emitCurrentTarget = (element) => {
      activeElementRef.current = element;
      onTargetChange?.(buildTargetPayload(element));
    };

    const resolveInteractiveElement = (target) => {
      if (!(target instanceof Element)) return null;
      return target.closest(INTERACTIVE_SELECTOR);
    };

    const refreshTargetFromPoint = (x, y) => {
      pointerRef.current = { x, y };
      const raw = document.elementFromPoint(x, y);
      const interactiveElement = resolveInteractiveElement(raw);
      if (interactiveElement !== activeElementRef.current) {
        emitCurrentTarget(interactiveElement);
      }
    };

    const handlePointerMove = (event) => {
      refreshTargetFromPoint(event.clientX, event.clientY);
    };

    const handleFocusIn = (event) => {
      const interactiveElement = resolveInteractiveElement(event.target);
      if (interactiveElement && interactiveElement !== activeElementRef.current) {
        emitCurrentTarget(interactiveElement);
      }
    };

    const handleScrollOrResize = () => {
      refreshTargetFromPoint(pointerRef.current.x, pointerRef.current.y);
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('scroll', handleScrollOrResize, { passive: true });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('scroll', handleScrollOrResize);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [onTargetChange]);

  return null;
}