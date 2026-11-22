import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Float, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

// 1. ORBITAL ENERGY RINGS (HERO PHASE)
function OrbitalEnergyRings({ opacity = 1.0 }) {
  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();

  useFrame((state, delta) => {
    if (ring1.current) ring1.current.rotation.z += delta * 0.9;
    if (ring2.current) ring2.current.rotation.z -= delta * 0.7;
    if (ring3.current) ring3.current.rotation.z += delta * 0.5;
  });

  if (opacity <= 0.01) return null;

  return (
    <group>
      <group rotation={[Math.PI / 4, Math.PI / 6, 0]}>
        <mesh ref={ring1}>
          <torusGeometry args={[1.75, 0.022, 16, 100]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={opacity * 0.75} />
        </mesh>
      </group>
      <group rotation={[-Math.PI / 3, Math.PI / 4, 0]}>
        <mesh ref={ring2}>
          <torusGeometry args={[2.05, 0.022, 16, 100]} />
          <meshBasicMaterial color="#00FFA3" transparent opacity={opacity * 0.65} />
        </mesh>
      </group>
      <group rotation={[Math.PI / 2.3, -Math.PI / 5, 0]}>
        <mesh ref={ring3}>
          <torusGeometry args={[2.35, 0.022, 16, 100]} />
          <meshBasicMaterial color="#DCE7EC" transparent opacity={opacity * 0.5} />
        </mesh>
      </group>
    </group>
  );
}

// 2. SMOOTH CHROME & REFLECTIVE GLASS AI SPHERE (STAGE 1)
function AICoreSphere({ opacity = 1.0 }) {
  const coreRef = useRef();
  const glassRef = useRef();

  useFrame((state, delta) => {
    if (coreRef.current) {
      coreRef.current.rotation.y += delta * 0.4;
      coreRef.current.rotation.x += delta * 0.2;
    }
    if (glassRef.current) {
      glassRef.current.rotation.y -= delta * 0.25;
      glassRef.current.rotation.z += delta * 0.15;
    }
  });

  if (opacity <= 0.01) return null;

  return (
    <group>
      {/* Inner Distorted Energy Core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[1.15, 64, 64]} />
        <MeshDistortMaterial
          color="#0B1117"
          emissive="#00E5FF"
          emissiveIntensity={0.65 * opacity}
          roughness={0.15}
          metalness={0.95}
          distort={0.28}
          speed={2.2}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Outer Chrome-Glass Physical Shell */}
      <mesh ref={glassRef}>
        <sphereGeometry args={[1.44, 64, 64]} />
        <meshPhysicalMaterial
          color="#050709"
          roughness={0.05}
          metalness={0.4}
          transmission={0.88}
          thickness={1.3}
          reflectivity={0.95}
          clearcoat={1.0}
          clearcoatRoughness={0.1}
          transparent
          opacity={opacity * 0.85}
        />
      </mesh>

      {/* Surrounding Orbital Rings */}
      <OrbitalEnergyRings opacity={opacity} />
    </group>
  );
}

// 3. REAL IRREGULAR METALLIC ASTEROID WITH GLOWING CYAN VEINS (STAGES 2 & 3)
function MetallicAsteroid3D({ opacity = 1.0, isFalling = false }) {
  const asteroidRef = useRef();

  // Create highly irregular, faceted, organic 3D asteroid geometry
  const asteroidGeometry = useMemo(() => {
    const geo = new THREE.IcosahedronGeometry(1.35, 3);
    const pos = geo.attributes.position;
    const v = new THREE.Vector3();

    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      // Multi-frequency noise displacement for realistic rocky craters & ridges
      const noise =
        Math.sin(v.x * 2.8 + v.y * 2.1) * 0.22 +
        Math.cos(v.y * 3.4 + v.z * 2.7) * 0.18 +
        Math.sin(v.z * 2.2 + v.x * 3.8) * 0.15 +
        Math.cos(v.x * 5.5 + v.z * 5.2) * 0.08;
      v.multiplyScalar(1.0 + noise);
      pos.setXYZ(i, v.x, v.y, v.z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  // Fissure wireframe edges
  const fissureWireframe = useMemo(() => {
    return new THREE.WireframeGeometry(asteroidGeometry);
  }, [asteroidGeometry]);

  useFrame((state, delta) => {
    if (asteroidRef.current) {
      // Dynamic tumbling rotation
      const tumbleSpeed = isFalling ? 1.8 : 0.8;
      asteroidRef.current.rotation.x += delta * 0.35 * tumbleSpeed;
      asteroidRef.current.rotation.y += delta * 0.55 * tumbleSpeed;
      asteroidRef.current.rotation.z += delta * 0.25 * tumbleSpeed;
    }
  });

  if (opacity <= 0.01) return null;

  return (
    <group ref={asteroidRef}>
      {/* 1. Main Metallic Dark Chrome Asteroid Body */}
      <mesh geometry={asteroidGeometry}>
        <meshStandardMaterial
          color="#17232C"
          roughness={0.35}
          metalness={0.92}
          flatShading={true}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* 2. Glowing Electric Cyan Fissures & Veins */}
      <lineSegments geometry={fissureWireframe}>
        <lineBasicMaterial
          color="#00E5FF"
          transparent
          opacity={opacity * 0.75}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* 3. Inner Pulsing Core beneath fissures */}
      <mesh>
        <sphereGeometry args={[1.0, 32, 32]} />
        <meshBasicMaterial
          color="#00FFA3"
          wireframe
          transparent
          opacity={opacity * 0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Local Spotlight on the Asteroid so it shines regardless of world coordinates */}
      <pointLight color="#00E5FF" intensity={4.5 * opacity} distance={8} />
      <pointLight color="#DCE7EC" intensity={2.5 * opacity} distance={6} position={[2, 2, 2]} />
    </group>
  );
}

// 4. HOLOGRAPHIC NEURAL SPHERE WITH NODES & CONNECTIONS (STAGES 4 & 5)
function HolographicNeuralSphere({ opacity = 1.0 }) {
  const groupRef = useRef();

  const { nodePositions, linePositions } = useMemo(() => {
    const nodeCount = 72;
    const radius = 1.38;
    const positions = [];
    const posArray = new Float32Array(nodeCount * 3);

    for (let i = 0; i < nodeCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / nodeCount);
      const theta = Math.sqrt(nodeCount * Math.PI) * phi;
      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);
      positions.push(new THREE.Vector3(x, y, z));
      posArray[i * 3] = x;
      posArray[i * 3 + 1] = y;
      posArray[i * 3 + 2] = z;
    }

    const lines = [];
    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        if (positions[i].distanceTo(positions[j]) < 0.78) {
          lines.push(positions[i].x, positions[i].y, positions[i].z);
          lines.push(positions[j].x, positions[j].y, positions[j].z);
        }
      }
    }

    return {
      nodePositions: posArray,
      linePositions: new Float32Array(lines)
    };
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3;
      groupRef.current.rotation.x += delta * 0.15;
    }
  });

  if (opacity <= 0.01) return null;

  return (
    <group ref={groupRef}>
      {/* Cyan Neural Nodes */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={nodePositions.length / 3}
            array={nodePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.065}
          color="#00FFA3"
          transparent
          opacity={Math.min(1.0, opacity * 1.3)}
          blending={THREE.AdditiveBlending}
        />
      </points>

      {/* Electric Synapse Lines */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={linePositions.length / 3}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00E5FF"
          transparent
          opacity={opacity * 0.7}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Inner Hologram Sphere */}
      <mesh>
        <sphereGeometry args={[0.95, 32, 32]} />
        <meshBasicMaterial
          color="#00E5FF"
          wireframe
          transparent
          opacity={opacity * 0.28}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// 5. ASTEROID EMITTED PARTICLE TRAIL (STAGE 3)
function AsteroidParticleTrail({ opacity = 0.0, asteroidPosition = [0, 0, 0] }) {
  const trailRef = useRef();
  const particleCount = 200;

  const [initialData] = useMemo(() => {
    const coords = new Float32Array(particleCount * 3);
    const velocities = [];
    for (let i = 0; i < particleCount; i++) {
      coords[i * 3] = (Math.random() - 0.5) * 2.5;
      coords[i * 3 + 1] = Math.random() * 3.0; // trailing upward/behind descent
      coords[i * 3 + 2] = (Math.random() - 0.5) * 2.5;
      velocities.push({
        y: 0.8 + Math.random() * 1.5,
        theta: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.6
      });
    }
    return [{ coords, velocities }];
  }, []);

  useFrame((state, delta) => {
    if (!trailRef.current || opacity <= 0.01) return;
    const positions = trailRef.current.geometry.attributes.position.array;
    for (let i = 0; i < particleCount; i++) {
      // Trail particles drift upward behind the falling asteroid
      positions[i * 3 + 1] += delta * initialData.velocities[i].y;
      if (positions[i * 3 + 1] > 4.5) {
        positions[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
        positions[i * 3] = (Math.random() - 0.5) * 1.5;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 1.5;
      }
    }
    trailRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (opacity <= 0.01) return null;

  return (
    <group position={asteroidPosition}>
      <points ref={trailRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={initialData.coords}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.045}
          color="#00FFA3"
          transparent
          opacity={opacity * 0.8}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

// 6. GLOBAL COSMIC PARTICLE FIELD (PERSISTENT BEHIND ENTIRE PAGE)
function PersistentCosmicField({ count = 650, progress = 0 }) {
  const pointsRef = useRef();

  const [coords, speeds] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const spd = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 18;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
      spd[i] = 0.2 + Math.random() * 0.6;
    }
    return [pos, spd];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const array = pointsRef.current.geometry.attributes.position.array;
    const descentSpeed = 0.4 + progress * 2.2;

    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] -= delta * speeds[i] * descentSpeed;
      if (array[i * 3 + 1] < -9) {
        array[i * 3 + 1] = 9;
      }
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y += delta * 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={coords}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.038}
        color="#00E5FF"
        transparent
        opacity={0.7}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

// 7. MASTER SCENE CONTROLLER — DRIVES TRANSFORMATION & FALLING MOTION
function MasterSceneDirector({ scrollProgress = 0, pointer = { x: 0, y: 0 } }) {
  const groupRef = useRef();
  const currentP = useRef(0);
  const { viewport } = useThree();

  // Smooth lerped progress for silky reverse-scrolling & forward motion
  useFrame((state, delta) => {
    currentP.current = THREE.MathUtils.lerp(
      currentP.current,
      scrollProgress,
      Math.min(delta * 5.0, 1.0)
    );
    const p = currentP.current;

    if (!groupRef.current) return;

    // Responsive scaling based on viewport width
    const isMobile = viewport.width < 5.5;

    // CAMERA VISIBLE BOUNDS at z=0:
    // Vertical: Top = +2.4, Bottom = -2.4.
    // Horizontal: Right = +3.5, Left = -3.5.

    let targetX = 0;
    let targetY = 0;
    let targetZ = 0;
    let targetScale = 1.0;

    if (p < 0.20) {
      // 0–20%: AI Sphere visible behind Hero (Right side on desktop, center-back on mobile)
      const t = p / 0.20;
      targetX = isMobile ? 0 : THREE.MathUtils.lerp(1.8, 1.4, t);
      targetY = THREE.MathUtils.lerp(0.1, 0.4, t);
      targetZ = 0;
      targetScale = isMobile ? 0.85 : 1.0;
    } else if (p < 0.40) {
      // 20–40%: Transformation from Sphere into Asteroid (Prepares for descent at top-center)
      const t = (p - 0.20) / 0.20;
      targetX = isMobile ? 0 : THREE.MathUtils.lerp(1.4, 0.6, t);
      targetY = THREE.MathUtils.lerp(0.4, 1.3, t); // Moves to near top of viewport
      targetZ = THREE.MathUtils.lerp(0, 0.2, t);
      targetScale = isMobile ? 0.95 : 1.15;
    } else if (p < 0.70) {
      // 40–70%: Asteroid VISIBLY DESCENDS from top (+1.3) down across screen to lower-left (-1.4)
      const t = (p - 0.40) / 0.30;
      targetX = isMobile ? THREE.MathUtils.lerp(0.3, -0.3, t) : THREE.MathUtils.lerp(0.6, -1.2, t);
      targetY = THREE.MathUtils.lerp(1.3, -1.35, t); // Fully visible across whole screen!
      targetZ = THREE.MathUtils.lerp(0.2, -0.2, t);
      targetScale = isMobile ? 1.0 : 1.25;
    } else if (p < 0.90) {
      // 70–90%: Transitions into Neural Network (Re-centers in features/tech)
      const t = (p - 0.70) / 0.20;
      targetX = isMobile ? 0 : THREE.MathUtils.lerp(-1.2, 0.0, t);
      targetY = THREE.MathUtils.lerp(-1.35, 0.1, t);
      targetZ = THREE.MathUtils.lerp(-0.2, 0.5, t);
      targetScale = isMobile ? 0.95 : 1.15;
    } else {
      // 90–100%: Neural Sphere recedes into deep cosmic distance
      const t = (p - 0.90) / 0.10;
      targetX = 0.0;
      targetY = THREE.MathUtils.lerp(0.1, 0.3, t);
      targetZ = THREE.MathUtils.lerp(0.5, -4.5, t);
      targetScale = THREE.MathUtils.lerp(1.15, 0.45, t);
    }

    // Subtle pointer parallax
    const parallaxX = pointer.x * (isMobile ? 0.15 : 0.4);
    const parallaxY = pointer.y * (isMobile ? 0.1 : 0.25);

    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetX + parallaxX,
      delta * 4
    );
    groupRef.current.position.y = THREE.MathUtils.lerp(
      groupRef.current.position.y,
      targetY + parallaxY,
      delta * 4
    );
    groupRef.current.position.z = THREE.MathUtils.lerp(
      groupRef.current.position.z,
      targetZ,
      delta * 4
    );
    groupRef.current.scale.setScalar(targetScale);

    // Multi-axis dynamic tumbling rotation driven by scroll progress + continuous time
    groupRef.current.rotation.y += delta * 0.25 + p * 0.04;
    groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.4) * 0.15 + p * 2.5;
    groupRef.current.rotation.z = pointer.x * 0.15 + p * 1.5;
  });

  const p = scrollProgress;

  // OPACITIES FOR SEAMLESS STAGE MORPHING:
  // 1. AI Core Sphere: 100% visible [0 - 0.20], crossfades out [0.20 - 0.38]
  const sphereOpacity = p < 0.20 ? 1.0 : p > 0.38 ? 0.0 : 1.0 - (p - 0.20) / 0.18;

  // 2. Asteroid: fades in [0.20 - 0.35], FULLY VISIBLE & FALLING [0.35 - 0.68], fades out [0.68 - 0.78]
  let asteroidOpacity = 0.0;
  if (p >= 0.20 && p <= 0.35) {
    asteroidOpacity = (p - 0.20) / 0.15;
  } else if (p > 0.35 && p < 0.68) {
    asteroidOpacity = 1.0;
  } else if (p >= 0.68 && p <= 0.78) {
    asteroidOpacity = 1.0 - (p - 0.68) / 0.10;
  }

  // 3. Neural Sphere: fades in [0.70 - 0.82], stays [0.82 - 0.92], moves into distance [0.92 - 1.0]
  let neuralOpacity = 0.0;
  if (p >= 0.70 && p <= 0.82) {
    neuralOpacity = (p - 0.70) / 0.12;
  } else if (p > 0.82 && p < 0.92) {
    neuralOpacity = 1.0;
  } else if (p >= 0.92) {
    neuralOpacity = Math.max(0.2, 1.0 - (p - 0.92) / 0.08);
  }

  const isAsteroidFalling = p >= 0.38 && p <= 0.72;
  const trailOpacity = isAsteroidFalling ? Math.min(1.0, asteroidOpacity) : 0.0;

  return (
    <group ref={groupRef} position={[1.8, 0.1, 0]}>
      {/* STAGE 1: AI CORE SPHERE */}
      <AICoreSphere opacity={sphereOpacity} />

      {/* STAGES 2 & 3: REAL METALLIC ASTEROID */}
      <MetallicAsteroid3D opacity={asteroidOpacity} isFalling={isAsteroidFalling} />

      {/* STAGE 3: FALLING PARTICLE TRAIL */}
      <AsteroidParticleTrail opacity={trailOpacity} />

      {/* STAGES 4 & 5: HOLOGRAPHIC NEURAL SPHERE */}
      <HolographicNeuralSphere opacity={neuralOpacity} />
    </group>
  );
}

// 8. MASTER PERSISTENT FIXED CANVAS COMPONENT
export default function CinematicBackground3D({ scrollProgress = 0, pointer = { x: 0, y: 0 } }) {
  const isReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div
      className="fixed inset-0 w-screen h-screen pointer-events-none z-0 overflow-hidden"
      style={{
        background: 'radial-gradient(circle at 50% 25%, #0B1117 0%, #050709 85%)'
      }}
    >
      <Canvas
        camera={{ position: [0, 0, 5.8], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
          depth: true,
          stencil: false
        }}
      >
        <ambientLight intensity={0.65} />
        {/* Platinum Silver key lights */}
        <directionalLight position={[6, 9, 6]} intensity={2.8} color="#DCE7EC" />
        {/* Electric Cyan rim light */}
        <directionalLight position={[-6, -4, -5]} intensity={1.8} color="#00E5FF" />
        <pointLight position={[0, -2, 2]} intensity={1.5} color="#00FFA3" distance={10} />

        {/* Global Persistent Cosmic Particles visible across complete scroll */}
        <PersistentCosmicField
          count={650}
          progress={isReducedMotion ? 0 : scrollProgress}
        />

        {/* Multi-Stage Morphing & Falling 3D Intelligence */}
        <MasterSceneDirector
          scrollProgress={isReducedMotion ? 0 : scrollProgress}
          pointer={pointer}
        />
      </Canvas>
    </div>
  );
}
