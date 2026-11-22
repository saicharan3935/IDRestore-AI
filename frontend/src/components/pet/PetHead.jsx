import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import PetEyes from './PetEyes';

/**
 * PetHead
 * Rounded black chrome head, dark glossy cyber visor, and articulated mechanical ears.
 */
export default function PetHead({ animState, isSuccess = false }) {
  const headGroupRef = useRef();
  const leftEarRef = useRef();
  const rightEarRef = useRef();

  useFrame(() => {
    if (!animState?.current || !headGroupRef.current) return;
    const s = animState.current;

    // Apply damped head rotations
    headGroupRef.current.rotation.x = s.headRotX;
    headGroupRef.current.rotation.y = s.headRotY;
    headGroupRef.current.rotation.z = s.headRotZ;

    // Ear twitching / wiggling on typing
    if (leftEarRef.current) {
      leftEarRef.current.rotation.z = 0.35 + s.earTwitch;
    }
    if (rightEarRef.current) {
      rightEarRef.current.rotation.z = -0.35 - s.earTwitch;
    }
  });

  return (
    <group ref={headGroupRef} position={[0, 0.45, 0]}>
      {/* 1. Main Skull: Black Chrome Metallic Dome */}
      <mesh castShadow receiveShadow>
        <sphereGeometry args={[0.54, 32, 32]} />
        <meshStandardMaterial
          color="#0B1117"
          roughness={0.22}
          metalness={0.92}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* 2. Cyber Visor Faceplate (Deep glossy obsidian black) */}
      <mesh position={[0, 0, 0.04]}>
        <sphereGeometry args={[0.52, 32, 24, 0, Math.PI, 0, Math.PI * 0.7]} rotation={[-0.2, 0, 0]} />
        <meshStandardMaterial
          color="#050709"
          roughness={0.08}
          metalness={0.96}
        />
      </mesh>

      {/* 3. Visor Rim Seam Glow (Cyan neon accent) */}
      <mesh position={[0, 0.05, 0.44]} rotation={[0.4, 0, 0]}>
        <torusGeometry args={[0.34, 0.007, 16, 48, Math.PI]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.65} />
      </mesh>

      {/* 4. Expressive Digital Eyes mounted inside the Visor */}
      <PetEyes animState={animState} isSuccess={isSuccess} />

      {/* 5. Left Mechanical Ear / Antenna */}
      <group position={[-0.48, 0.28, -0.05]}>
        {/* Ear Base Cup */}
        <mesh rotation={[0, 0, 0.4]}>
          <cylinderGeometry args={[0.07, 0.09, 0.08, 16]} />
          <meshStandardMaterial color="#101820" roughness={0.3} metalness={0.85} />
        </mesh>
        {/* Articulated Fin */}
        <group ref={leftEarRef} position={[0, 0.04, 0]}>
          <mesh position={[-0.08, 0.14, 0]} rotation={[0, 0, 0.35]}>
            <capsuleGeometry args={[0.038, 0.22, 12, 12]} />
            <meshStandardMaterial color="#0B1117" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Cyan Glow Fin Tip */}
          <mesh position={[-0.14, 0.26, 0]}>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshBasicMaterial color="#00E5FF" />
          </mesh>
        </group>
      </group>

      {/* 6. Right Mechanical Ear / Antenna */}
      <group position={[0.48, 0.28, -0.05]}>
        {/* Ear Base Cup */}
        <mesh rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.07, 0.09, 0.08, 16]} />
          <meshStandardMaterial color="#101820" roughness={0.3} metalness={0.85} />
        </mesh>
        {/* Articulated Fin */}
        <group ref={rightEarRef} position={[0, 0.04, 0]}>
          <mesh position={[0.08, 0.14, 0]} rotation={[0, 0, -0.35]}>
            <capsuleGeometry args={[0.038, 0.22, 12, 12]} />
            <meshStandardMaterial color="#0B1117" roughness={0.2} metalness={0.9} />
          </mesh>
          {/* Cyan Glow Fin Tip */}
          <mesh position={[0.14, 0.26, 0]}>
            <sphereGeometry args={[0.032, 12, 12]} />
            <meshBasicMaterial color="#00E5FF" />
          </mesh>
        </group>
      </group>
    </group>
  );
}
