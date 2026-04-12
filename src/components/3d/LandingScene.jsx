import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera } from '@react-three/drei';
import CogniCharacter from './CogniCharacter';

export default function LandingScene() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0">
      <Canvas>
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        
        {/* We place Cogni slightly to the right for Hero view */}
        <CogniCharacter position={[2, 0, 0]} />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
