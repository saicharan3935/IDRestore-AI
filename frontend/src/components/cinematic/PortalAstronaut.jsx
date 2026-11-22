import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useAstronautMotion } from '../../hooks/useAstronautMotion';

// ==============================================================
// TINY SCI-FI JETPACK EXHAUST PARTICLES
// ==============================================================
function JetpackExhaustParticles({ count = 16, flameIntensityRef }) {
  const pointsRef = useRef();

  const [positions, scales, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sc = new Float32Array(count);
    const sp = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.08;
      pos[i * 3 + 1] = -Math.random() * 0.25;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
      sc[i] = Math.random() * 0.03 + 0.015;
      sp[i] = Math.random() * 0.8 + 0.5;
    }
    return [pos, sc, sp];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const intensity = flameIntensityRef.current;

    if (intensity < 0.05) {
      pointsRef.current.visible = false;
      return;
    }

    pointsRef.current.visible = true;
    const array = pointsRef.current.geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
      // Stream particles downward
      array[i * 3 + 1] -= delta * speeds[i] * 1.5;

      // Reset when faded out
      if (array[i * 3 + 1] < -0.35) {
        array[i * 3] = (Math.random() - 0.5) * 0.08;
        array[i * 3 + 1] = -0.05;
        array[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.material.opacity = intensity * 0.65;
  });

  return (
    <points ref={pointsRef} position={[0, -0.16, -0.16]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#00FFA3"
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ==============================================================
// MASTER COMPONENT: PORTAL ASTRONAUT
// ==============================================================
export default function PortalAstronaut({
  basePosition = [2.45, 0.75, 0.35],
  reducedMotion = false,
  isMobile = false,
}) {
  const rootRef = useRef();
  const leftFlameRef = useRef();
  const rightFlameRef = useRef();
  const leftOuterFlameRef = useRef();
  const rightOuterFlameRef = useRef();
  const flameIntensityRef = useRef(0);

  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();

  const { motionRef, update } = useAstronautMotion({
    basePosition,
    reducedMotion,
    isMobile,
  });

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const m = update(delta, time);
    flameIntensityRef.current = m.flameIntensity;

    if (!rootRef.current) return;

    // Apply smooth positions & rotations to root character group
    rootRef.current.position.set(m.x, m.y, m.z);
    rootRef.current.rotation.set(m.rotX, m.rotY, m.rotZ);

    // Jetpack Flame dynamics (only active when scrolling up / rising)
    const flameActive = m.flameIntensity > 0.03;
    const flicker = 1.0 + Math.sin(time * 36) * 0.18;
    const flameScaleY = m.flameIntensity * flicker;
    const flameScaleXZ = m.flameIntensity * (0.8 + Math.cos(time * 28) * 0.12);

    if (leftFlameRef.current && rightFlameRef.current) {
      leftFlameRef.current.visible = flameActive;
      rightFlameRef.current.visible = flameActive;
      leftFlameRef.current.scale.set(flameScaleXZ, flameScaleY, flameScaleXZ);
      rightFlameRef.current.scale.set(flameScaleXZ, flameScaleY, flameScaleXZ);
    }

    if (leftOuterFlameRef.current && rightOuterFlameRef.current) {
      leftOuterFlameRef.current.visible = flameActive;
      rightOuterFlameRef.current.visible = flameActive;
      leftOuterFlameRef.current.scale.set(flameScaleXZ * 1.3, flameScaleY * 1.25, flameScaleXZ * 1.3);
      rightOuterFlameRef.current.scale.set(flameScaleXZ * 1.3, flameScaleY * 1.25, flameScaleXZ * 1.3);
    }

    // Limb micro-motion
    if (leftLegRef.current) {
      leftLegRef.current.rotation.x = m.legSwing;
    }
    if (rightLegRef.current) {
      rightLegRef.current.rotation.x = -m.legSwing * 0.8;
    }
    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = m.armSwing;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = -m.armSwing * 0.85;
    }
  });

  // Scale: Micro-character proportions (total height ~0.65)
  const charScale = isMobile ? 0.34 : 0.42;

  return (
    <group
      ref={rootRef}
      scale={[charScale, charScale, charScale]}
      // Disables pointer raycasting so astronaut never steals clicks or divider drags
      raycast={() => null}
    >
      {/* ============================================================== */}
      {/* 1. HELMET & VISOR                                              */}
      {/* ============================================================== */}
      <group position={[0, 0.38, 0]}>
        {/* Platinum White Helmet Shell */}
        <mesh>
          <sphereGeometry args={[0.22, 24, 24]} />
          <meshStandardMaterial
            color="#DCE7EC"
            roughness={0.32}
            metalness={0.4}
          />
        </mesh>

        {/* High-Gloss Obsidian Visor with Subtle Cyan Glow */}
        <mesh position={[0, 0.01, 0.08]} rotation={[-0.1, 0, 0]}>
          <sphereGeometry args={[0.18, 24, 16, 0, Math.PI, 0, Math.PI * 0.65]} />
          <meshStandardMaterial
            color="#050709"
            roughness={0.06}
            metalness={0.96}
          />
        </mesh>

        {/* Visor Cyan Neon Rim */}
        <mesh position={[0, 0.02, 0.17]} rotation={[0.4, 0, 0]}>
          <torusGeometry args={[0.12, 0.006, 12, 32, Math.PI]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.8} />
        </mesh>

        {/* Side Comms / Audio Ear Pods */}
        <mesh position={[-0.21, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.04, 12]} />
          <meshStandardMaterial color="#101820" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0.21, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.035, 0.035, 0.04, 12]} />
          <meshStandardMaterial color="#101820" roughness={0.3} metalness={0.8} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 2. SPACESUIT TORSO & LIFE-SUPPORT HARNESS                      */}
      {/* ============================================================== */}
      <group position={[0, 0.06, 0]}>
        {/* Main Suit Torso Pod */}
        <mesh>
          <capsuleGeometry args={[0.16, 0.22, 16, 16]} />
          <meshStandardMaterial
            color="#DCE7EC"
            roughness={0.35}
            metalness={0.3}
          />
        </mesh>

        {/* Chest Cyber-Badge / Life Support Display */}
        <mesh position={[0, 0.06, 0.165]}>
          <boxGeometry args={[0.09, 0.06, 0.01]} />
          <meshStandardMaterial
            color="#00FFA3"
            emissive="#00FFA3"
            emissiveIntensity={1.8}
            roughness={0.2}
          />
        </mesh>

        {/* Graphite Utility Belt */}
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.165, 0.165, 0.04, 20]} />
          <meshStandardMaterial color="#101820" roughness={0.4} metalness={0.8} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 3. SCI-FI DUAL THRUSTER JETPACK & JETS                         */}
      {/* ============================================================== */}
      <group position={[0, 0.1, -0.15]}>
        {/* Jetpack Main Pack Body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.22, 0.24, 0.08]} />
          <meshStandardMaterial color="#101820" roughness={0.25} metalness={0.85} />
        </mesh>

        {/* Twin Fuel Cannisters */}
        <mesh position={[-0.08, 0, 0.01]}>
          <cylinderGeometry args={[0.042, 0.042, 0.26, 16]} />
          <meshStandardMaterial color="#17232C" roughness={0.3} metalness={0.8} />
        </mesh>
        <mesh position={[0.08, 0, 0.01]}>
          <cylinderGeometry args={[0.042, 0.042, 0.26, 16]} />
          <meshStandardMaterial color="#17232C" roughness={0.3} metalness={0.8} />
        </mesh>

        {/* Thruster Nozzle Left */}
        <mesh position={[-0.08, -0.15, 0.01]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.042, 0.06, 16]} />
          <meshStandardMaterial color="#0B1117" roughness={0.2} metalness={0.9} />
        </mesh>
        {/* Thruster Nozzle Right */}
        <mesh position={[0.08, -0.15, 0.01]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.042, 0.06, 16]} />
          <meshStandardMaterial color="#0B1117" roughness={0.2} metalness={0.9} />
        </mesh>

        {/* LEFT JETPACK FLAME (Electric Cyan Core) */}
        <mesh ref={leftFlameRef} visible={false} position={[-0.08, -0.27, 0.01]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.038, 0.22, 12]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={3.2}
            roughness={0.1}
          />
        </mesh>

        {/* LEFT OUTER GLOW (Laser Mint Halo) */}
        <mesh ref={leftOuterFlameRef} visible={false} position={[-0.08, -0.29, 0.01]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.065, 0.28, 12]} />
          <meshBasicMaterial
            color="#00FFA3"
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* RIGHT JETPACK FLAME (Electric Cyan Core) */}
        <mesh ref={rightFlameRef} visible={false} position={[0.08, -0.27, 0.01]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.038, 0.22, 12]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={3.2}
            roughness={0.1}
          />
        </mesh>

        {/* RIGHT OUTER GLOW (Laser Mint Halo) */}
        <mesh ref={rightOuterFlameRef} visible={false} position={[0.08, -0.29, 0.01]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.065, 0.28, 12]} />
          <meshBasicMaterial
            color="#00FFA3"
            transparent
            opacity={0.45}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Tiny Particle Exhaust Stream */}
      <JetpackExhaustParticles count={14} flameIntensityRef={flameIntensityRef} />

      {/* ============================================================== */}
      {/* 4. ARMS & MITTEN GLOVES                                         */}
      {/* ============================================================== */}
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.2, 0.12, 0]}>
        <mesh position={[-0.04, -0.1, 0.02]} rotation={[0.2, 0, 0.3]}>
          <capsuleGeometry args={[0.038, 0.14, 10, 10]} />
          <meshStandardMaterial color="#DCE7EC" roughness={0.35} metalness={0.3} />
        </mesh>
        {/* Glove */}
        <mesh position={[-0.08, -0.2, 0.04]}>
          <sphereGeometry args={[0.046, 12, 12]} />
          <meshStandardMaterial color="#101820" roughness={0.4} metalness={0.7} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.2, 0.12, 0]}>
        <mesh position={[0.04, -0.1, 0.02]} rotation={[0.2, 0, -0.3]}>
          <capsuleGeometry args={[0.038, 0.14, 10, 10]} />
          <meshStandardMaterial color="#DCE7EC" roughness={0.35} metalness={0.3} />
        </mesh>
        {/* Glove */}
        <mesh position={[0.08, -0.2, 0.04]}>
          <sphereGeometry args={[0.046, 12, 12]} />
          <meshStandardMaterial color="#101820" roughness={0.4} metalness={0.7} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 5. LEGS & MAGNETIC BOOTS                                       */}
      {/* ============================================================== */}
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.09, -0.16, 0]}>
        <mesh position={[0, -0.1, 0.02]}>
          <capsuleGeometry args={[0.045, 0.14, 10, 10]} />
          <meshStandardMaterial color="#DCE7EC" roughness={0.35} metalness={0.3} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.2, 0.04]}>
          <boxGeometry args={[0.065, 0.05, 0.1]} />
          <meshStandardMaterial color="#101820" roughness={0.4} metalness={0.8} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.09, -0.16, 0]}>
        <mesh position={[0, -0.1, 0.02]}>
          <capsuleGeometry args={[0.045, 0.14, 10, 10]} />
          <meshStandardMaterial color="#DCE7EC" roughness={0.35} metalness={0.3} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.2, 0.04]}>
          <boxGeometry args={[0.065, 0.05, 0.1]} />
          <meshStandardMaterial color="#101820" roughness={0.4} metalness={0.8} />
        </mesh>
      </group>
    </group>
  );
}
