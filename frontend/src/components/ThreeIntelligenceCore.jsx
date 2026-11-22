import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, OrbitControls, Sphere, Ring, MeshDistortMaterial, Html } from '@react-three/drei';
import * as THREE from 'three';

// Orbiting Energy Ring Component
function EnergyRing({ radius, rotationSpeed, tiltX, tiltY, color = '#00E5FF' }) {
  const ringRef = useRef();
  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * rotationSpeed;
    }
  });

  return (
    <group rotation={[tiltX, tiltY, 0]}>
      <mesh ref={ringRef}>
        <torusGeometry args={[radius, 0.025, 16, 100]} />
        <meshBasicMaterial color={color} transparent opacity={0.65} />
      </mesh>
    </group>
  );
}

// Floating Holographic Document Card in 3D
function HologramDocPanel({ position, label, status, subtext }) {
  return (
    <Float speed={2.5} rotationIntensity={0.4} floatIntensity={0.8} position={position}>
      <mesh>
        <planeGeometry args={[1.5, 1.0]} />
        <meshPhysicalMaterial
          color="#101820"
          transparent
          opacity={0.35}
          roughness={0.1}
          metalness={0.8}
          transmission={0.6}
          thickness={0.5}
          clearcoat={1}
          side={THREE.DoubleSide}
        />
        {/* Border edges */}
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(1.5, 1.0)]} />
          <lineBasicMaterial color="#00E5FF" transparent opacity={0.6} />
        </lineSegments>
      </mesh>
      
      {/* 3D HTML Content */}
      <Html transform distanceFactor={4} position={[0, 0, 0.05]} pointerEvents="none">
        <div className="w-52 p-3 rounded-lg bg-[#0B1117]/85 backdrop-blur-md border border-[#00E5FF]/40 text-left select-none pointer-events-none shadow-cyan-glow">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[9px] font-mono tracking-widest text-[#00E5FF] font-semibold">{label}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse"></span>
          </div>
          <div className="text-[11px] font-mono text-[#DCE7EC] font-bold">{status}</div>
          <div className="text-[8px] font-mono text-[#94A3B8] mt-1 flex items-center justify-between">
            <span>{subtext}</span>
            <span className="text-[#00E5FF]">99.8%</span>
          </div>
          {/* Scanning line animation */}
          <div className="w-full h-0.5 bg-[#17232C] rounded-full overflow-hidden mt-1.5">
            <div className="h-full bg-[#00E5FF] w-2/3 animate-pulse"></div>
          </div>
        </div>
      </Html>
    </Float>
  );
}

// Atmospheric Particles
function CyanParticleField({ count = 800 }) {
  const points = useMemo(() => {
    const coords = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const radius = 3.5 + Math.random() * 5.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      coords[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
      coords[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
      coords[i * 3 + 2] = radius * Math.cos(phi);
    }
    return coords;
  }, [count]);

  const pointsRef = useRef();
  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.05;
      pointsRef.current.rotation.x += delta * 0.02;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={points.length / 3}
          array={points}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.035}
        color="#00E5FF"
        transparent
        opacity={0.65}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// Main 3D AI Core Sphere
function AICoreSphere() {
  const coreRef = useRef();
  const outerGlassRef = useRef();

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.3;
      coreRef.current.rotation.x += delta * 0.15;
    }
    if (outerGlassRef.current) {
      outerGlassRef.current.rotation.y -= delta * 0.15;
      outerGlassRef.current.rotation.z += delta * 0.1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Internal Pulsing Energy Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.15, 64, 64]} />
        <MeshDistortMaterial
          color="#0B1117"
          emissive="#00E5FF"
          emissiveIntensity={0.25}
          roughness={0.15}
          metalness={0.95}
          distort={0.2}
          speed={2}
        />
      </mesh>

      {/* Transparent Outer Chrome-Glass Shell */}
      <mesh ref={outerGlassRef}>
        <sphereGeometry args={[1.45, 64, 64]} />
        <meshPhysicalMaterial
          color="#050709"
          roughness={0.05}
          metalness={0.3}
          transmission={0.88}
          thickness={1.2}
          reflectivity={0.9}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* Rotating Energy Rings */}
      <EnergyRing radius={1.75} rotationSpeed={0.8} tiltX={Math.PI / 4} tiltY={Math.PI / 6} color="#00E5FF" />
      <EnergyRing radius={2.05} rotationSpeed={-0.6} tiltX={-Math.PI / 3} tiltY={Math.PI / 4} color="#00FFA3" />
      <EnergyRing radius={2.35} rotationSpeed={0.4} tiltX={Math.PI / 2.5} tiltY={-Math.PI / 5} color="#DCE7EC" />

      {/* Subtle Central Lighting */}
      <pointLight color="#00E5FF" intensity={4} distance={6} />
      <pointLight color="#00FFA3" intensity={2} distance={4} position={[0, 1, 0]} />
    </group>
  );
}

// Master Scene
export default function ThreeIntelligenceCore({ isInteractive = true }) {
  return (
    <div className="w-full h-full relative cursor-grab active:cursor-grabbing">
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 45 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={2.5} color="#DCE7EC" />
        <directionalLight position={[-5, -4, -5]} intensity={1.5} color="#00E5FF" />

        <AICoreSphere />
        <CyanParticleField count={650} />

        {/* Orbiting Hologram Panels */}
        <HologramDocPanel
          position={[-2.4, 1.4, -0.5]}
          label="AI ANALYSIS ACTIVE"
          status="SPECTRAL DEGRADATION SCAN"
          subtext="DEFOCUS SIGMA 1.8"
        />
        <HologramDocPanel
          position={[2.3, 1.2, 0.2]}
          label="RESTORATION ENGINE READY"
          status="CLAHE & UNMASK FILTER"
          subtext="CONTRAST GAIN +162%"
        />
        <HologramDocPanel
          position={[-2.2, -1.3, 0.6]}
          label="IMAGE QUALITY IMPROVING"
          status="SSIM INDEX RESTORATION"
          subtext="PSNR 34.2 dB VERIFIED"
        />
        <HologramDocPanel
          position={[2.4, -1.1, -0.8]}
          label="GEMINI INTELLIGENCE READY"
          status="MULTIMODAL HRMS AUDIT"
          subtext="ENTERPRISE PRIVACY SAFE"
        />

        {isInteractive && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            autoRotate
            autoRotateSpeed={0.7}
            maxPolarAngle={Math.PI / 1.7}
            minPolarAngle={Math.PI / 2.3}
          />
        )}
      </Canvas>
    </div>
  );
}
