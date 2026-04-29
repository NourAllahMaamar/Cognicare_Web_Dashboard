import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Float, useTexture } from '@react-three/drei';
import * as THREE from 'three';
import {
  COGNI_FALLBACK_POSE,
  COGNI_POSES,
  COGNI_POSE_TEXTURES,
  normalizePose,
} from './cogniPoseConfig';

export default function CogniCharacter({
  animationState = COGNI_FALLBACK_POSE,
  onClick,
  onReady,
  cursorPos = { x: 0, y: 0 },
  cursorVelocity = { x: 0, y: 0 },
}) {
  const groupRef = useRef();
  const frontSpriteRef = useRef();
  const midSpriteRef = useRef();
  const backSpriteRef = useRef();
  const particlesRef = useRef();
  const clickFlashRef = useRef(0);

  const normalizedPose = normalizePose(animationState);
  const texturePaths = useMemo(() => Object.values(COGNI_POSE_TEXTURES), []);
  const textures = useTexture(texturePaths);
  const textureMap = useMemo(() => {
    const map = {};
    texturePaths.forEach((path, index) => {
      map[path] = textures[index];
    });
    Object.values(map).forEach((tex) => {
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = 16;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
      tex.magFilter = THREE.LinearFilter;
      tex.generateMipmaps = true;
      tex.premultiplyAlpha = true;
      tex.needsUpdate = true;
    });
    return map;
  }, [texturePaths, textures]);
  const currentTexture =
    textureMap[COGNI_POSE_TEXTURES[normalizedPose]] ||
    textureMap[COGNI_POSE_TEXTURES[COGNI_FALLBACK_POSE]];
  const displacementTexture = currentTexture;

  const handleClick = (e) => {
    e.stopPropagation();
    clickFlashRef.current = 1;
    onClick?.();
  };

  // Setup 3D floating particles
  // Notify parent that textures are loaded and the character is ready to display.
  // useTexture suspends above, so this fires only after all textures have loaded.
  useEffect(() => { onReady?.(); }, []);  

  // Setup 3D floating particles
  const particles = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 15; i++) {
      pts.push({
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
        z: (Math.random() - 0.5) * 2 - 0.5,
        speed: 0.5 + Math.random(),
        offset: Math.random() * Math.PI * 2,
        scale: 0.05 + Math.random() * 0.05,
      });
    }
    return pts;
  }, []);

  useFrame((state) => {
    if (!groupRef.current) return;
    const time = state.clock.elapsedTime;
    const dt = Math.min(0.05, state.clock.getDelta());

    // Per-frame flash decay without React state churn.
    if (clickFlashRef.current > 0) {
      clickFlashRef.current = Math.max(0, clickFlashRef.current - dt * 2.75);
    }
    const clickFlash = clickFlashRef.current;
    const burstScale = 1 + clickFlash * 0.14;
    groupRef.current.scale.set(burstScale, burstScale, burstScale);

    // Cursor-driven orientation and motion.
    const targetRotX = cursorPos.y * 0.22 + Math.sin(time * 1.5) * 0.04;
    const targetRotY = cursorPos.x * 0.34 + Math.cos(time) * 0.03;
    const targetRotZ = THREE.MathUtils.clamp(cursorVelocity.x * 0.65, -0.18, 0.18);
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotX, 7.5, dt);
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotY, 7.5, dt);
    groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, targetRotZ, 6.5, dt);

    const isJumpingPose =
      normalizedPose === COGNI_POSES.JUMPING ||
      normalizedPose === COGNI_POSES.CELEBRATING;
    if (isJumpingPose) {
      groupRef.current.position.y = Math.abs(Math.sin(time * 5)) * 0.4;
    } else if (normalizedPose === COGNI_POSES.DANCING) {
      groupRef.current.rotation.z = THREE.MathUtils.damp(
        groupRef.current.rotation.z,
        Math.sin(time * 6) * 0.15,
        5.5,
        dt
      );
      groupRef.current.position.y = Math.sin(time * 8) * 0.1;
    } else {
      groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, 0, 6, dt);
    }

    if (frontSpriteRef.current) {
      frontSpriteRef.current.material.emissiveIntensity =
        0.24 + clickFlash * 0.55 + Math.abs(cursorVelocity.y) * 0.28;
      frontSpriteRef.current.position.x = THREE.MathUtils.damp(frontSpriteRef.current.position.x, cursorPos.x * 0.06, 10, dt);
      frontSpriteRef.current.position.y = THREE.MathUtils.damp(frontSpriteRef.current.position.y, cursorPos.y * 0.06, 10, dt);
    }
    if (midSpriteRef.current) {
      midSpriteRef.current.position.x = THREE.MathUtils.damp(midSpriteRef.current.position.x, cursorPos.x * 0.03, 10, dt);
      midSpriteRef.current.position.y = THREE.MathUtils.damp(midSpriteRef.current.position.y, cursorPos.y * 0.03, 10, dt);
    }
    if (backSpriteRef.current) {
      backSpriteRef.current.position.x = THREE.MathUtils.damp(backSpriteRef.current.position.x, -cursorPos.x * 0.03, 10, dt);
      backSpriteRef.current.position.y = THREE.MathUtils.damp(backSpriteRef.current.position.y, -cursorPos.y * 0.03, 10, dt);
    }
    // Animate ambient particles.
    if (particlesRef.current) {
      particlesRef.current.children.forEach((child, i) => {
        const p = particles[i];
        child.position.y = p.y + Math.sin(time * p.speed + p.offset) * 0.3;
        child.rotation.z += dt * p.speed;
        child.rotation.y += dt * p.speed * 0.5;
        child.scale.setScalar(p.scale * (1 + clickFlash * 2));
      });
    }

  });

  return (
    <group>
      <group ref={groupRef} onClick={handleClick}>
        <Float speed={2.4} rotationIntensity={0.16} floatIntensity={0.34}>
          <mesh ref={backSpriteRef} position={[0, 0.14, -0.08]}>
            <planeGeometry args={[2.28, 2.28, 42, 42]} />
            <meshBasicMaterial
              map={currentTexture}
              transparent
              alphaTest={0.001}
              opacity={0.18}
              depthWrite={false}
              side={THREE.DoubleSide}
              color="#93c5fd"
            />
          </mesh>
          <mesh ref={midSpriteRef} position={[0, 0.2, 0.03]}>
            <planeGeometry args={[2.16, 2.16, 84, 84]} />
            <meshStandardMaterial
              map={currentTexture}
              displacementMap={displacementTexture}
              displacementScale={0.02}
              transparent
              alphaTest={0.001}
              opacity={0.42}
              depthWrite={false}
              side={THREE.DoubleSide}
              color="#bfdbfe"
              emissive="#60a5fa"
              emissiveIntensity={0.05}
            />
          </mesh>
          <mesh ref={frontSpriteRef} position={[0, 0.24, 0.11]}>
            <planeGeometry args={[2.1, 2.1, 120, 120]} />
            <meshBasicMaterial
              map={currentTexture}
              transparent
              alphaTest={0.001}
              depthWrite={false}
              side={THREE.DoubleSide}
              toneMapped={false}
              color="#ffffff"
            />
          </mesh>
        </Float>
      </group>

      <group ref={particlesRef}>
        {particles.map((p, i) => (
          <mesh key={i} position={[p.x, p.y, p.z]}>
            <octahedronGeometry args={[1, 0]} />
            <meshStandardMaterial 
              color="#8B5CF6" 
              emissive="#3B82F6" 
              emissiveIntensity={1.5}
              transparent
              opacity={0.6}
            />
          </mesh>
        ))}
      </group>

    </group>
  );
}
