/**
 * Enhanced Landing Scene with Interactive Cogni
 * 
 * Features:
 * - Cogni follows cursor movement
 * - Orbital particles with dynamic behavior
 * - Click-to-celebrate animations
 * - Proximity-based reactions
 */

import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls } from '@react-three/drei';
import { useEffect, useRef, useState } from 'react';
import CogniCharacter from './CogniCharacter';

export default function EnhancedLandingScene({ onCogniClick }) {
  const [animationState, setAnimationState] = useState('idle');
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVelocity, setCursorVelocity] = useState({ x: 0, y: 0 });
  const prevCursorRef = useRef({ x: 0, y: 0 });
  const clickTimeoutRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;

      setCursorVelocity({
        x: x - prevCursorRef.current.x,
        y: y - prevCursorRef.current.y,
      });

      setCursorPos({ x, y });
      prevCursorRef.current = { x, y };
    };

    const handleClick = (e) => {
      // Only trigger if click is not on an interactive element
      if (e.target.closest('button, a, input')) return;

      setAnimationState('celebrating');
      onCogniClick?.();

      // Return to idle after celebration
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = setTimeout(() => {
        setAnimationState('idle');
      }, 2000);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
      if (clickTimeoutRef.current) clearTimeout(clickTimeoutRef.current);
    };
  }, [onCogniClick]);

  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
    }}>
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0.5, 5]} fov={50} />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 15, 8]} intensity={2} />
        
        {/* Interactive Cogni positioned to follow cursor subtly */}
        <CogniCharacter 
          position={[cursorPos.x * 0.3, 0.2, 0.5]}
          animationState={animationState}
          onClick={() => {
            setAnimationState('jumping');
            setTimeout(() => setAnimationState('idle'), 1200);
          }}
          cursorPos={cursorPos}
          cursorVelocity={cursorVelocity}
        />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
