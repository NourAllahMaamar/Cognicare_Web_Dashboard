// src/hooks/useAssistantResize.js
import { useCallback, useEffect, useRef, useState } from 'react';
import { MIN_ASSISTANT_PANEL_WIDTH, MAX_ASSISTANT_PANEL_WIDTH } from '../assistant/constants';

export function useAssistantResize(panelWidth, setAssistantPanelWidth) {
  const [isResizing, setIsResizing] = useState(false);
  const resizeSessionRef = useRef(null);

  const startResize = useCallback((event) => {
    event.preventDefault();
    event.stopPropagation();
    resizeSessionRef.current = {
      startX: event.clientX,
      startWidth: panelWidth,
    };
    setIsResizing(true);
  }, [panelWidth]);

  useEffect(() => {
    if (!isResizing) return;

    const handleMove = (event) => {
      const session = resizeSessionRef.current;
      if (!session) return;
      const deltaX = session.startX - event.clientX;
      const nextWidth = Math.min(
        MAX_ASSISTANT_PANEL_WIDTH,
        Math.max(MIN_ASSISTANT_PANEL_WIDTH, session.startWidth + deltaX),
      );
      setAssistantPanelWidth(nextWidth);
    };

    const handleEnd = () => {
      setIsResizing(false);
      resizeSessionRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleEnd);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
    };
  }, [isResizing, setAssistantPanelWidth]);

  return { isResizing, startResize };
}
