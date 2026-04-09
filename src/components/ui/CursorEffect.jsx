import { useEffect, useRef } from 'react';

/**
 * CursorEffect — A subtle, elegant glowing trailing cursor effect
 * that blends cleanly with the website without being distracting.
 */
export default function CursorEffect() {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -200, y: -200, currentX: -200, currentY: -200 });
  const trailRef = useRef([]);
  const rafRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const handleMouseMove = (e) => {
      mouseRef.current.x = e.clientX;
      mouseRef.current.y = e.clientY;
    };

    window.addEventListener('mousemove', handleMouseMove);

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mouse = mouseRef.current;

      // Smooth trailing effect
      mouse.currentX += (mouse.x - mouse.currentX) * 0.15;
      mouse.currentY += (mouse.y - mouse.currentY) * 0.15;

      // Draw subtle glow
      const glowRadius = 24;
      const gradient = ctx.createRadialGradient(
        mouse.currentX, mouse.currentY, 0,
        mouse.currentX, mouse.currentY, glowRadius
      );
      gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
      gradient.addColorStop(0.5, 'rgba(139, 92, 246, 0.1)');
      gradient.addColorStop(1, 'rgba(139, 92, 246, 0)');
      
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(mouse.currentX, mouse.currentY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      trailRef.current.unshift({
        x: mouse.currentX,
        y: mouse.currentY,
        life: 1,
      });
      trailRef.current = trailRef.current.slice(0, 14);
      trailRef.current.forEach((particle, index) => {
        particle.life *= 0.92;
        const radius = 7 * particle.life;
        const alpha = Math.max(0, 0.22 * particle.life * (1 - index / 14));
        ctx.fillStyle = `rgba(59, 130, 246, ${alpha})`;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw tiny core dot
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(mouse.currentX, mouse.currentY, 2, 0, Math.PI * 2);
      ctx.fill();

      rafRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', resize);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
        width: '100vw',
        height: '100vh',
      }}
    />
  );
}
