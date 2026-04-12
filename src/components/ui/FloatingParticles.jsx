import { useEffect, useRef } from 'react';

/**
 * FloatingParticles — ambient Canvas2D background particles
 * that create depth and react subtly to cursor proximity.
 */
export default function FloatingParticles({ count = 50 }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;

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

    // ─── Create particles ───
    const particles = [];
    const COLORS = [
      { r: 139, g: 92,  b: 246, a: 0.12 },
      { r: 59,  g: 130, b: 246, a: 0.10 },
      { r: 6,   g: 182, b: 212, a: 0.08 },
      { r: 236, g: 72,  b: 153, a: 0.06 },
      { r: 129, g: 140, b: 248, a: 0.10 },
    ];

    for (let i = 0; i < count; i++) {
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        baseX: 0,
        baseY: 0,
        size: 2 + Math.random() * 6,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.2 - 0.1,
        ...color,
        pulseSpeed: 0.5 + Math.random() * 1.5,
        pulseOffset: Math.random() * Math.PI * 2,
        layer: Math.random(), // 0 = back, 1 = front (for parallax)
      });
    }

    // Set base positions
    particles.forEach((p) => {
      p.baseX = p.x;
      p.baseY = p.y;
    });

    // ─── Animation loop ───
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const time = performance.now() / 1000;
      const mouse = mouseRef.current;

      for (const p of particles) {
        // Base movement
        p.x += p.speedX;
        p.y += p.speedY;

        // Wrap around edges
        if (p.x < -20) p.x = canvas.width + 20;
        if (p.x > canvas.width + 20) p.x = -20;
        if (p.y < -20) p.y = canvas.height + 20;
        if (p.y > canvas.height + 20) p.y = -20;

        // Cursor proximity reaction (push away gently)
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pushRadius = 150;
        
        if (dist < pushRadius && dist > 0) {
          const force = (1 - dist / pushRadius) * 0.8;
          p.x += (dx / dist) * force;
          p.y += (dy / dist) * force;
        }

        // Pulse
        const pulse = 1 + Math.sin(time * p.pulseSpeed + p.pulseOffset) * 0.3;
        const size = p.size * pulse;
        const alpha = p.a * (0.6 + pulse * 0.4);

        // Draw glow
        const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 4);
        glow.addColorStop(0, `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha})`);
        glow.addColorStop(0.5, `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha * 0.3})`);
        glow.addColorStop(1, `rgba(${p.r}, ${p.g}, ${p.b}, 0)`);
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 4, 0, Math.PI * 2);
        ctx.fill();

        // Draw core
        ctx.fillStyle = `rgba(${p.r}, ${p.g}, ${p.b}, ${alpha * 2.5})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw subtle connection lines between close particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            const alpha = (1 - dist / 120) * 0.04;
            ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 1,
        width: '100vw',
        height: '100vh',
        opacity: 0.8,
      }}
    />
  );
}
