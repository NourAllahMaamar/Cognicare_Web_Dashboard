import { useEffect, useState, useCallback, useRef } from 'react';
import { COGNI_POSES } from '../3d/cogniPoseConfig';

/**
 * InteractiveZones — Defines invisible regions on the page where Cogni reacts
 * 
 * This component tracks cursor position and emits events when entering/leaving zones.
 * It's used by CogniCompanion to trigger different animations and poses.
 */

const ZONES = [
  {
    id: 'header',
    sectionId: 'section-header',
    reaction: COGNI_POSES.WAVING,
    tipKey: 'cogniCompanion.zoneHeader',
  },
  {
    id: 'features',
    sectionId: 'section-features',
    reaction: COGNI_POSES.THINKING,
    tipKey: 'cogniCompanion.zoneFeatures',
  },
  {
    id: 'cta',
    sectionId: 'section-cta',
    reaction: COGNI_POSES.CELEBRATING,
    tipKey: 'cogniCompanion.zoneCta',
  },
  {
    id: 'footer',
    sectionId: 'section-footer',
    reaction: COGNI_POSES.INTERACTION_B,
    tipKey: 'cogniCompanion.zoneFooter',
  },
];

export default function InteractiveZones({ onZoneChange, onMousePos }) {
  const containerRef = useRef(null);
  const [currentZone, setCurrentZone] = useState(null);
  const cursorPosRef = useRef({ x: 0, y: 0 });
  const sectionRectsRef = useRef([]);

  const measureSections = useCallback(() => {
    sectionRectsRef.current = ZONES.map((zone) => {
      const sectionNode = document.getElementById(zone.sectionId);
      if (!sectionNode) return null;
      const rect = sectionNode.getBoundingClientRect();
      return {
        zone,
        top: rect.top,
        bottom: rect.bottom,
        left: rect.left,
        right: rect.right,
      };
    }).filter(Boolean);
  }, []);

  const getZoneAtPosition = useCallback((x, y) => {
    const zonesByPoint = sectionRectsRef.current.filter((entry) => (
      x >= entry.left &&
      x <= entry.right &&
      y >= entry.top &&
      y <= entry.bottom
    ));

    if (zonesByPoint.length > 0) return zonesByPoint[0].zone;

    // Fallback to nearest section center for playful continuity.
    let nearest = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    sectionRectsRef.current.forEach((entry) => {
      const centerY = (entry.top + entry.bottom) / 2;
      const distance = Math.abs(centerY - y);
      if (distance < nearestDistance) {
        nearest = entry.zone;
        nearestDistance = distance;
      }
    });
    return nearest;
  }, []);

  useEffect(() => {
    measureSections();

    const handleMouseMove = (e) => {
      cursorPosRef.current = { x: e.clientX, y: e.clientY };

      // Emit cursor position for Cogni to follow
      onMousePos?.({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: -(e.clientY / window.innerHeight) * 2 + 1,
      });

      const zone = getZoneAtPosition(e.clientX, e.clientY);

      if (zone?.id !== currentZone?.id) {
        setCurrentZone(zone);
        onZoneChange?.(zone);
      }
    };

    const handleLayoutChange = () => {
      measureSections();
      const zone = getZoneAtPosition(cursorPosRef.current.x, cursorPosRef.current.y);
      if (zone?.id !== currentZone?.id) {
        setCurrentZone(zone);
        onZoneChange?.(zone);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('resize', handleLayoutChange, { passive: true });
    window.addEventListener('scroll', handleLayoutChange, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleLayoutChange);
      window.removeEventListener('scroll', handleLayoutChange);
    };
  }, [currentZone, getZoneAtPosition, measureSections, onZoneChange, onMousePos]);

  // Invisible zone overlay — for debugging (hidden in production)
  const DEBUG = false;

  return (
    <div ref={containerRef} style={{ pointerEvents: 'none' }}>
      {DEBUG && (
        <>
          {ZONES.map((zone) => (
            <div
              key={zone.id}
              style={{
                position: 'fixed',
                left: `${zone.bounds.x * 100}%`,
                top: `${zone.bounds.y * 100}%`,
                width: `${zone.bounds.width * 100}%`,
                height: `${zone.bounds.height * 100}%`,
                border: '2px dashed rgba(147, 112, 219, 0.5)',
                backgroundColor: 'rgba(147, 112, 219, 0.05)',
                zIndex: 999,
                pointerEvents: 'none',
              }}
            >
              <div style={{ color: 'rgba(147, 112, 219, 0.7)', fontSize: '12px', padding: '4px' }}>
                {zone.id}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export { ZONES };
