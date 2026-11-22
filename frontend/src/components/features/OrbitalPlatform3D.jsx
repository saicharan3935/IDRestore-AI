import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Holographic concentric rings and segmented orbital track
function HolographicRings({ rotationAngle = 0, activeIndex = 0 }) {
  const outerTrackRef = useRef();
  const ticksRef = useRef();
  const pipsRef = useRef();
  const particlesRef = useRef();

  // Pre-generate static 8 orbital node positions
  const nodeCount = 8;
  const radiusX = 3.8;
  const radiusZ = 1.9;

  // Concentric ring geometries
  const { innerRingGeo, midRingGeo, outerRingGeo } = useMemo(() => {
    return {
      innerRingGeo: new THREE.RingGeometry(1.4, 1.42, 64),
      midRingGeo: new THREE.RingGeometry(2.5, 2.53, 64),
      outerRingGeo: new THREE.RingGeometry(3.78, 3.82, 64),
    };
  }, []);

  // Tick marks around the perimeter (48 ticks)
  const tickSegments = useMemo(() => {
    const points = [];
    const count = 48;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const isMajor = i % 6 === 0;
      const r1 = 3.6;
      const r2 = isMajor ? 3.9 : 3.75;
      points.push(
        new THREE.Vector3(Math.cos(angle) * r1, 0, Math.sin(angle) * (r1 * (radiusZ / radiusX))),
        new THREE.Vector3(Math.cos(angle) * r2, 0, Math.sin(angle) * (r2 * (radiusZ / radiusX)))
      );
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return geometry;
  }, [radiusX, radiusZ]);

  // Atmospheric hovering particles (Cyan & Laser-Mint)
  const [particleGeo, particleColors] = useMemo(() => {
    const pCount = 75;
    const positions = new Float32Array(pCount * 3);
    const colors = new Float32Array(pCount * 3);
    const cyan = new THREE.Color('#00E5FF');
    const mint = new THREE.Color('#00FFA3');
    const platinum = new THREE.Color('#DCE7EC');

    for (let i = 0; i < pCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 1.6 + Math.random() * 2.4;
      positions[i * 3] = Math.cos(angle) * r;
      positions[i * 3 + 1] = (Math.random() - 0.2) * 1.5;
      positions[i * 3 + 2] = Math.sin(angle) * (r * (radiusZ / radiusX));

      const colChoice = Math.random();
      const col = colChoice > 0.6 ? cyan : colChoice > 0.25 ? mint : platinum;
      colors[i * 3] = col.r;
      colors[i * 3 + 1] = col.g;
      colors[i * 3 + 2] = col.b;
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return [geo, colors];
  }, [radiusX, radiusZ]);

  // Animation loop: smooth synchronization with rotation + subtle ambient pulsation
  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Rotate ticks smoothly with carousel orientation
    if (ticksRef.current) {
      ticksRef.current.rotation.y = -rotationAngle * 0.4 + time * 0.03;
    }

    // Outer track pulse
    if (outerTrackRef.current) {
      outerTrackRef.current.rotation.y = -rotationAngle + time * 0.05;
    }

    // Hovering particles wave
    if (particlesRef.current) {
      particlesRef.current.rotation.y = -rotationAngle * 0.2 + time * 0.02;
      const pos = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < 75; i++) {
        pos[i * 3 + 1] += Math.sin(time * 1.8 + i) * 0.0015;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={[0, -1.35, 0]} rotation={[0.18, 0, 0]}>
      {/* 1. Floor Glow Disc (Ground Reflection) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[9, 5]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.045}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 2. Concentric Holographic Ring Surfaces */}
      <mesh geometry={outerRingGeo} rotation={[-Math.PI / 2, 0, 0]} scale={[1, radiusZ / radiusX, 1]}>
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.4}
          wireframe={false}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh geometry={midRingGeo} rotation={[-Math.PI / 2, 0, 0]} scale={[1, radiusZ / radiusX, 1]}>
        <meshBasicMaterial
          color="#00FFA3"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      <mesh geometry={innerRingGeo} rotation={[-Math.PI / 2, 0, 0]} scale={[1, radiusZ / radiusX, 1]}>
        <meshBasicMaterial
          color="#DCE7EC"
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Perimeter Technical Tick Marks */}
      <lineSegments ref={ticksRef} geometry={tickSegments}>
        <lineBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.45}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>

      {/* 4. Eight Orbital Anchor Nodes (Synchronized with 8 feature positions) */}
      <group>
        {Array.from({ length: nodeCount }).map((_, i) => {
          const baseAngle = (i / nodeCount) * Math.PI * 2;
          const currentAngle = baseAngle + rotationAngle;
          const x = Math.cos(currentAngle) * radiusX;
          const z = Math.sin(currentAngle) * radiusZ;
          const isFront = z > 0;
          const isCenterActive = i === activeIndex;

          return (
            <group key={i} position={[x, 0, z]}>
              {/* Ground Anchor Disc */}
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.07, 0.14, 16]} />
                <meshBasicMaterial
                  color={isCenterActive ? '#00FFA3' : isFront ? '#00E5FF' : '#22323D'}
                  transparent
                  opacity={isCenterActive ? 0.9 : isFront ? 0.6 : 0.25}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                />
              </mesh>

              {/* Active pedestal vertical energy beam indicator */}
              {isCenterActive && (
                <mesh position={[0, 0.4, 0]}>
                  <cylinderGeometry args={[0.08, 0.16, 0.8, 16, 1, true]} />
                  <meshBasicMaterial
                    color="#00E5FF"
                    transparent
                    opacity={0.35}
                    blending={THREE.AdditiveBlending}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                  />
                </mesh>
              )}
            </group>
          );
        })}
      </group>

      {/* 5. Atmospheric Floating Cyber Particles */}
      <points ref={particlesRef} geometry={particleGeo}>
        <pointsMaterial
          size={0.065}
          vertexColors
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export default function OrbitalPlatform3D({ rotationAngle = 0, activeIndex = 0 }) {
  return (
    <div className="absolute inset-0 pointer-events-none w-full h-full overflow-hidden select-none">
      <Canvas
        camera={{ position: [0, 1.8, 5.2], fov: 45 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 1.5]}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[0, 2, 2]} intensity={1.2} color="#00E5FF" distance={8} />
        <pointLight position={[0, -1, 3]} intensity={0.8} color="#00FFA3" distance={6} />
        <HolographicRings rotationAngle={rotationAngle} activeIndex={activeIndex} />
      </Canvas>
    </div>
  );
}
