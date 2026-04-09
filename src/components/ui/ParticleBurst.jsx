import { useEffect, useRef } from 'react';

/**
 * ParticleBurst — Creates animated particle effects on click or interaction
 * Integrates with the landing page for visual feedback
 */

const ParticleBurst = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e) => {
      // Create burst at click location
      const x = e.clientX;
      const y = e.clientY;

      const particleCount = 12 + Math.random() * 8;
      const colors = [
        '#8B5CF6', '#06B6D4', '#3B82F6', '#EC4899', '#F59E0B', 
        '#10B981', '#14B8A6', '#F43F5E', '#8DD3FC', '#A78BFA',
      ];

      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = 4 + Math.random() * 8;
        const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
        const velocity = 4 + Math.random() * 6;
        const duration = 0.8 + Math.random() * 0.6;

        particle.style.cssText = `
          position: fixed;
          left: ${x}px;
          top: ${y}px;
          width: ${size}px;
          height: ${size}px;
          background: ${color};
          border-radius: 50%;
          pointer-events: none;
          box-shadow: 0 0 ${size * 2}px ${color};
          z-index: 1000;
          animation: burstParticle ${duration}s ease-out forwards;
        `;

        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;

        particle.style.setProperty('--tx', `${vx * 100}px`);
        particle.style.setProperty('--ty', `${vy * 100}px`);

        container.appendChild(particle);

        setTimeout(() => particle.remove(), duration * 1000);
      }
    };

    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 999,
      }}
    >
      <style>{`
        @keyframes burstParticle {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translate(var(--tx), var(--ty)) scale(0.1);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

export default ParticleBurst;
