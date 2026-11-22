import React, { useRef, useMemo } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useGlobalAstronautMotion } from '../../hooks/useGlobalAstronautMotion';

// ==============================================================
// 1. JETPACK EXHAUST PARTICLES (ACTIVE DURING UPWARD THRUST & LIFTOFF)
// ==============================================================
function JetpackExhaustParticles({ count = 24, flameIntensityRef }) {
  const pointsRef = useRef();

  const [positions, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const sp = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 0.14;
      pos[i * 3 + 1] = -Math.random() * 0.40;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.14;
      sp[i] = Math.random() * 1.5 + 0.9;
    }
    return [pos, sp];
  }, [count]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const intensity = flameIntensityRef.current;

    if (intensity < 0.04) {
      pointsRef.current.visible = false;
      return;
    }

    pointsRef.current.visible = true;
    const array = pointsRef.current.geometry.attributes.position.array;

    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] -= delta * speeds[i] * 2.2;

      if (array[i * 3 + 1] < -0.55) {
        array[i * 3] = (Math.random() - 0.5) * 0.14;
        array[i * 3 + 1] = -0.05;
        array[i * 3 + 2] = (Math.random() - 0.5) * 0.14;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.material.opacity = intensity * 0.85;
  });

  return (
    <points ref={pointsRef} position={[0, -0.22, -0.16]}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.048}
        color="#00FFA3"
        transparent
        opacity={0.8}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ==============================================================
// 2. MASTER GLOBAL ASTRONAUT COMPONENT
// ==============================================================
export default function GlobalAstronaut({
  scrollProgress = 0,
  pointer = { x: 0, y: 0 },
  reducedMotion = false,
}) {
  const rootRef = useRef();
  const helmetRef = useRef();
  const leftFlameRef = useRef();
  const rightFlameRef = useRef();
  const leftOuterFlameRef = useRef();
  const rightOuterFlameRef = useRef();
  const flameIntensityRef = useRef(0);

  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const haloRingRef = useRef();

  const { viewport } = useThree();

  const { update } = useGlobalAstronautMotion({
    scrollProgress,
    pointer,
    reducedMotion,
    viewportWidth: viewport.width,
  });

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const m = update(delta, time);
    flameIntensityRef.current = m.flameIntensity;

    if (!rootRef.current) return;

    // Apply global world position & rotation
    rootRef.current.position.set(m.x, m.y, m.z);
    rootRef.current.rotation.set(m.rotX, m.rotY, m.rotZ);
    rootRef.current.scale.set(m.scale, m.scale, m.scale);

    // Subtle helmet glance toward user cursor
    if (helmetRef.current) {
      helmetRef.current.rotation.y = m.helmetLookX;
      helmetRef.current.rotation.x = m.helmetLookY;
    }

    // Jetpack Flame dynamics (active when scrolling up or liftoff)
    const flameActive = m.flameIntensity > 0.03;
    const flicker = 1.0 + Math.sin(time * 38) * 0.22;
    const flameScaleY = m.flameIntensity * flicker * (m.isLiftoff ? 1.5 : 1.0);
    const flameScaleXZ = m.flameIntensity * (0.85 + Math.cos(time * 30) * 0.15) * (m.isLiftoff ? 1.3 : 1.0);

    if (leftFlameRef.current && rightFlameRef.current) {
      leftFlameRef.current.visible = flameActive;
      rightFlameRef.current.visible = flameActive;
      leftFlameRef.current.scale.set(flameScaleXZ, flameScaleY, flameScaleXZ);
      rightFlameRef.current.scale.set(flameScaleXZ, flameScaleY, flameScaleXZ);
    }

    if (leftOuterFlameRef.current && rightOuterFlameRef.current) {
      leftOuterFlameRef.current.visible = flameActive;
      rightOuterFlameRef.current.visible = flameActive;
      leftOuterFlameRef.current.scale.set(flameScaleXZ * 1.35, flameScaleY * 1.3, flameScaleXZ * 1.35);
      rightOuterFlameRef.current.scale.set(flameScaleXZ * 1.35, flameScaleY * 1.3, flameScaleXZ * 1.35);
    }

    // Specialized character expressions based on active section pose
    if (m.pose === 'hero-wave') {
      // Hero: Friendly wave with right arm
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -1.8 + Math.sin(time * 6) * 0.35;
        rightArmRef.current.rotation.z = -0.45 + Math.cos(time * 6) * 0.25;
      }
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = m.armSwing;
        leftArmRef.current.rotation.z = 0;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = m.legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -m.legSwing * 0.85;
    } else if (m.pose === 'inspect') {
      // How It Works / Laboratory: Analytical inspection pose near chin
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = -1.35 + Math.sin(time * 2) * 0.08;
        leftArmRef.current.rotation.y = 0.45;
        leftArmRef.current.rotation.z = 0.2;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0.15 + m.armSwing;
        rightArmRef.current.rotation.z = 0;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = m.legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -m.legSwing * 0.85;
    } else if (m.isLiftoff) {
      // Footer Liftoff: Aerodynamic backward swept limbs
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = 0.85;
        leftArmRef.current.rotation.y = 0;
        leftArmRef.current.rotation.z = 0.15;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = 0.85;
        rightArmRef.current.rotation.y = 0;
        rightArmRef.current.rotation.z = -0.15;
      }
      if (leftLegRef.current) leftLegRef.current.rotation.x = 0.55;
      if (rightLegRef.current) rightLegRef.current.rotation.x = 0.55;
    } else {
      // Standard zero-gravity floating limbs
      if (leftLegRef.current) leftLegRef.current.rotation.x = m.legSwing;
      if (rightLegRef.current) rightLegRef.current.rotation.x = -m.legSwing * 0.85;
      if (leftArmRef.current) {
        leftArmRef.current.rotation.x = m.armSwing;
        leftArmRef.current.rotation.y = 0;
        leftArmRef.current.rotation.z = 0;
      }
      if (rightArmRef.current) {
        rightArmRef.current.rotation.x = -m.armSwing * 0.9;
        rightArmRef.current.rotation.y = 0;
        rightArmRef.current.rotation.z = 0;
      }
    }

    // Halo micro-rotation
    if (haloRingRef.current) {
      haloRingRef.current.rotation.z += delta * 0.65;
    }
  });

  return (
    <group
      ref={rootRef}
      // Disable pointer raycasting completely so astronaut never steals clicks or slider drags
      raycast={() => null}
    >
      {/* Dedicated Local Point Light to Guarantee High Contrast & Crisp Visibility */}
      <pointLight position={[0, 0.4, 0.6]} intensity={2.6} color="#00E5FF" distance={4.5} />

      {/* Floating Holographic Cyber Halo above Helmet */}
      <group position={[0, 0.64, 0]} rotation={[Math.PI / 2.5, 0, 0]}>
        <mesh ref={haloRingRef}>
          <ringGeometry args={[0.16, 0.175, 24]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.7} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 1. HELMET & VISOR (INTERACTIVE CURSOR LOOK-AT)                 */}
      {/* ============================================================== */}
      <group ref={helmetRef} position={[0, 0.38, 0]}>
        {/* Platinum White Helmet Shell */}
        <mesh castShadow>
          <sphereGeometry args={[0.22, 28, 28]} />
          <meshStandardMaterial
            color="#F1F5F9"
            roughness={0.2}
            metalness={0.6}
            envMapIntensity={1.5}
          />
        </mesh>

        {/* Glossy Obsidian Visor with Vibrant Electric Cyan Glow */}
        <mesh position={[0, 0.01, 0.08]} rotation={[-0.1, 0, 0]}>
          <sphereGeometry args={[0.185, 24, 16, 0, Math.PI, 0, Math.PI * 0.68]} />
          <meshStandardMaterial
            color="#050709"
            roughness={0.05}
            metalness={0.98}
            emissive="#00E5FF"
            emissiveIntensity={0.65}
          />
        </mesh>

        {/* Visor Cyan Neon Rim */}
        <mesh position={[0, 0.02, 0.175]} rotation={[0.4, 0, 0]}>
          <torusGeometry args={[0.125, 0.008, 12, 32, Math.PI]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.95} blending={THREE.AdditiveBlending} />
        </mesh>

        {/* Side Comms / Audio Ear Pods */}
        <mesh position={[-0.21, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.038, 0.038, 0.045, 16]} />
          <meshStandardMaterial color="#101820" roughness={0.3} metalness={0.85} />
        </mesh>
        <mesh position={[0.21, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.038, 0.038, 0.045, 16]} />
          <meshStandardMaterial color="#101820" roughness={0.3} metalness={0.85} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 2. SPACESUIT TORSO & LIFE-SUPPORT HARNESS                      */}
      {/* ============================================================== */}
      <group position={[0, 0.06, 0]}>
        {/* Main Suit Torso Pod */}
        <mesh castShadow>
          <capsuleGeometry args={[0.165, 0.22, 16, 16]} />
          <meshStandardMaterial
            color="#E2E8F0"
            roughness={0.28}
            metalness={0.4}
          />
        </mesh>

        {/* Chest Cyber-Badge / Telemetry Display */}
        <mesh position={[0, 0.06, 0.17]}>
          <boxGeometry args={[0.095, 0.065, 0.015]} />
          <meshStandardMaterial
            color="#00FFA3"
            emissive="#00FFA3"
            emissiveIntensity={2.5}
            roughness={0.2}
          />
        </mesh>

        {/* Graphite Utility Belt */}
        <mesh position={[0, -0.1, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 0.045, 20]} />
          <meshStandardMaterial color="#101820" roughness={0.35} metalness={0.85} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 3. SCI-FI DUAL THRUSTER JETPACK & JETS                         */}
      {/* ============================================================== */}
      <group position={[0, 0.1, -0.16]}>
        {/* Jetpack Main Pack Body */}
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[0.23, 0.25, 0.085]} />
          <meshStandardMaterial color="#101820" roughness={0.25} metalness={0.88} />
        </mesh>

        {/* Twin Fuel Canisters */}
        <mesh position={[-0.085, 0, 0.01]}>
          <cylinderGeometry args={[0.044, 0.044, 0.27, 16]} />
          <meshStandardMaterial color="#17232C" roughness={0.3} metalness={0.85} />
        </mesh>
        <mesh position={[0.085, 0, 0.01]}>
          <cylinderGeometry args={[0.044, 0.044, 0.27, 16]} />
          <meshStandardMaterial color="#17232C" roughness={0.3} metalness={0.85} />
        </mesh>

        {/* Thruster Nozzle Left */}
        <mesh position={[-0.085, -0.155, 0.01]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.044, 0.065, 16]} />
          <meshStandardMaterial color="#0B1117" roughness={0.2} metalness={0.92} />
        </mesh>
        {/* Thruster Pilot Ring Left (Idle Glow) */}
        <mesh position={[-0.085, -0.185, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.02, 0.038, 16]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.65} />
        </mesh>

        {/* Thruster Nozzle Right */}
        <mesh position={[0.085, -0.155, 0.01]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.044, 0.065, 16]} />
          <meshStandardMaterial color="#0B1117" roughness={0.2} metalness={0.92} />
        </mesh>
        {/* Thruster Pilot Ring Right (Idle Glow) */}
        <mesh position={[0.085, -0.185, 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.02, 0.038, 16]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.65} />
        </mesh>

        {/* LEFT JETPACK FLAME (Electric Cyan Core) */}
        <mesh ref={leftFlameRef} visible={false} position={[-0.085, -0.3, 0.01]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.042, 0.26, 16]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={3.8}
            roughness={0.1}
          />
        </mesh>

        {/* LEFT OUTER GLOW (Laser Mint Halo) */}
        <mesh ref={leftOuterFlameRef} visible={false} position={[-0.085, -0.32, 0.01]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.075, 0.32, 16]} />
          <meshBasicMaterial
            color="#00FFA3"
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* RIGHT JETPACK FLAME (Electric Cyan Core) */}
        <mesh ref={rightFlameRef} visible={false} position={[0.085, -0.3, 0.01]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.042, 0.26, 16]} />
          <meshStandardMaterial
            color="#00E5FF"
            emissive="#00E5FF"
            emissiveIntensity={3.8}
            roughness={0.1}
          />
        </mesh>

        {/* RIGHT OUTER GLOW (Laser Mint Halo) */}
        <mesh ref={rightOuterFlameRef} visible={false} position={[0.085, -0.32, 0.01]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.075, 0.32, 16]} />
          <meshBasicMaterial
            color="#00FFA3"
            transparent
            opacity={0.5}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Particle Exhaust Stream */}
      <JetpackExhaustParticles count={24} flameIntensityRef={flameIntensityRef} />

      {/* ============================================================== */}
      {/* 4. ARMS & MITTEN GLOVES                                         */}
      {/* ============================================================== */}
      {/* Left Arm */}
      <group ref={leftArmRef} position={[-0.2, 0.12, 0]}>
        <mesh position={[-0.04, -0.1, 0.02]} rotation={[0.2, 0, 0.3]}>
          <capsuleGeometry args={[0.04, 0.15, 10, 10]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.35} />
        </mesh>
        {/* Glove */}
        <mesh position={[-0.08, -0.21, 0.04]}>
          <sphereGeometry args={[0.048, 12, 12]} />
          <meshStandardMaterial color="#101820" roughness={0.35} metalness={0.75} />
        </mesh>
      </group>

      {/* Right Arm */}
      <group ref={rightArmRef} position={[0.2, 0.12, 0]}>
        <mesh position={[0.04, -0.1, 0.02]} rotation={[0.2, 0, -0.3]}>
          <capsuleGeometry args={[0.04, 0.15, 10, 10]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.35} />
        </mesh>
        {/* Glove */}
        <mesh position={[0.08, -0.21, 0.04]}>
          <sphereGeometry args={[0.048, 12, 12]} />
          <meshStandardMaterial color="#101820" roughness={0.35} metalness={0.75} />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 5. LEGS & MAGNETIC BOOTS                                       */}
      {/* ============================================================== */}
      {/* Left Leg */}
      <group ref={leftLegRef} position={[-0.09, -0.16, 0]}>
        <mesh position={[0, -0.11, 0.02]}>
          <capsuleGeometry args={[0.048, 0.15, 10, 10]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.35} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.21, 0.04]}>
          <boxGeometry args={[0.07, 0.055, 0.11]} />
          <meshStandardMaterial color="#101820" roughness={0.35} metalness={0.85} />
        </mesh>
      </group>

      {/* Right Leg */}
      <group ref={rightLegRef} position={[0.09, -0.16, 0]}>
        <mesh position={[0, -0.11, 0.02]}>
          <capsuleGeometry args={[0.048, 0.15, 10, 10]} />
          <meshStandardMaterial color="#E2E8F0" roughness={0.3} metalness={0.35} />
        </mesh>
        {/* Boot */}
        <mesh position={[0, -0.21, 0.04]}>
          <boxGeometry args={[0.07, 0.055, 0.11]} />
          <meshStandardMaterial color="#101820" roughness={0.35} metalness={0.85} />
        </mesh>
      </group>
    </group>
  );
}
