import React, { useRef, useState, useEffect, useCallback, Suspense, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Scan, Sparkles, Activity, ShieldCheck, Cpu } from 'lucide-react';

/**
 * Procedural Archival Document Texture
 * Generates an enterprise holographic schematic with header, text lines, and security watermark
 */
function useDocumentCanvasTexture() {
  return useMemo(() => {
    if (typeof document === 'undefined') return null;
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 724;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    // Dark Obsidian Blueprint Background
    ctx.fillStyle = '#0B1117';
    ctx.fillRect(0, 0, 512, 724);

    // Subtle Grid
    ctx.strokeStyle = '#17232C';
    ctx.lineWidth = 1;
    for (let x = 0; x < 512; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 724);
      ctx.stroke();
    }
    for (let y = 0; y < 724; y += 32) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    // Outer Border
    ctx.strokeStyle = '#00E5FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, 472, 684);

    // Corner Accents
    ctx.fillStyle = '#00FFA3';
    ctx.fillRect(16, 16, 12, 12);
    ctx.fillRect(484, 16, 12, 12);
    ctx.fillRect(16, 696, 12, 12);
    ctx.fillRect(484, 696, 12, 12);

    // Header Title
    ctx.fillStyle = '#00E5FF';
    ctx.font = 'bold 20px monospace';
    ctx.fillText('HISTORICAL PERSONNEL ARCHIVE', 40, 60);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px monospace';
    ctx.fillText('RECORD ID: HRMS-EMP-1987-0429 // LEVEL 3 CLEARANCE', 40, 80);

    // Simulated Biometric / Photo Box
    ctx.strokeStyle = '#00FFA3';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(40, 110, 110, 140);
    ctx.fillStyle = '#101820';
    ctx.fillRect(41, 111, 108, 138);

    // Silhouette in box
    ctx.fillStyle = '#00E5FF';
    ctx.beginPath();
    ctx.arc(95, 160, 28, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(95, 230, 44, Math.PI, 0);
    ctx.fill();

    // Data Fields (Simulated typed historical records)
    ctx.fillStyle = '#DCE7EC';
    ctx.font = '12px monospace';
    ctx.fillText('LEGAL NAME:   VANCE, MARCUS E.', 170, 130);
    ctx.fillText('DESIGNATION:  SENIOR ARCHIVAL SPECIALIST', 170, 155);
    ctx.fillText('DEPARTMENT:   HR MIGRATION LOGISTICS', 170, 180);
    ctx.fillText('STATUS:       VERIFIED ARCHIVAL INTEGRITY', 170, 205);
    ctx.fillText('RESOLUTION:   4096 x 3072 PIXELS • 600 DPI', 170, 230);

    // Simulated Document Lines
    ctx.fillStyle = '#94A3B8';
    for (let row = 0; row < 12; row++) {
      const y = 285 + row * 24;
      const lineWidth = 432 - (row % 3) * 60;
      ctx.fillRect(40, y, lineWidth, 4);
    }

    // Security Seal / Watermark Stamp
    ctx.strokeStyle = '#00FFA3';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(380, 580, 50, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#00FFA3';
    ctx.textAlign = 'center';
    ctx.fillText('IDRESTORE AI', 380, 575);
    ctx.fillText('CERTIFIED 2026', 380, 592);

    // Barcode at bottom
    ctx.fillStyle = '#00E5FF';
    for (let b = 0; b < 40; b++) {
      const bx = 40 + b * 11;
      const bw = (b % 3 === 0 || b % 5 === 0) ? 6 : 2;
      ctx.fillRect(bx, 640, bw, 32);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    texture.magFilter = THREE.LinearFilter;
    return texture;
  }, []);
}

/**
 * 3D Holographic Document with Vertical Scanning Laser & Orbital Rings
 */
function HolographicScene({ pointerRef, reducedMotion }) {
  const docGroupRef = useRef();
  const laserBeamRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const particlesRef = useRef();

  const docTexture = useDocumentCanvasTexture();

  // Floating Ascending Particles
  const particleCount = 45;
  const particlePositions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3.5;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 3.5;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.0;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const motionScale = reducedMotion ? 0.1 : 1.0;

    // Smooth idle bobbing and rotation
    if (docGroupRef.current) {
      const px = pointerRef.current?.x || 0;
      const py = pointerRef.current?.y || 0;

      // Subtle zero-G floating
      const floatY = Math.sin(time * 1.6) * 0.08 * motionScale;
      docGroupRef.current.position.y = floatY;

      // Damped interactive tilt towards mouse
      docGroupRef.current.rotation.x = THREE.MathUtils.damp(
        docGroupRef.current.rotation.x,
        0.2 + (-py * 0.25 * motionScale),
        5.0,
        delta
      );
      docGroupRef.current.rotation.y = THREE.MathUtils.damp(
        docGroupRef.current.rotation.y,
        -0.35 + (px * 0.35 * motionScale),
        5.0,
        delta
      );
    }

    // Laser Beam Sweep: moves smoothly from -1.1 to 1.1 on Y
    if (laserBeamRef.current) {
      const laserY = Math.sin(time * 2.2) * 1.15 * motionScale;
      laserBeamRef.current.position.y = laserY;
    }

    // Concentric Orbital Ring Rotations
    if (ring1Ref.current) {
      ring1Ref.current.rotation.z += delta * 0.45 * motionScale;
      ring1Ref.current.rotation.x = Math.sin(time * 0.5) * 0.2;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.z -= delta * 0.35 * motionScale;
      ring2Ref.current.rotation.y = Math.cos(time * 0.6) * 0.25;
    }

    // Particles Drift
    if (particlesRef.current) {
      const positions = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < particleCount; i++) {
        positions[i * 3 + 1] += delta * 0.25 * motionScale;
        if (positions[i * 3 + 1] > 2.0) {
          positions[i * 3 + 1] = -2.0;
        }
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* 1. DOCUMENT MESH GROUP */}
      <group ref={docGroupRef}>
        {/* Archival Document Slate */}
        <mesh position={[0, 0, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.7, 2.4, 0.04]} />
          <meshStandardMaterial
            map={docTexture || undefined}
            color={docTexture ? '#FFFFFF' : '#0B1117'}
            roughness={0.25}
            metalness={0.85}
            emissive="#00E5FF"
            emissiveIntensity={0.15}
          />
        </mesh>

        {/* Outer Glow Border Plane */}
        <mesh position={[0, 0, 0.025]}>
          <planeGeometry args={[1.74, 2.44]} />
          <meshBasicMaterial color="#00E5FF" wireframe transparent opacity={0.3} />
        </mesh>

        {/* Laser Scanner Assembly */}
        <group ref={laserBeamRef} position={[0, 0, 0.035]}>
          {/* Intense Laser Line */}
          <mesh>
            <boxGeometry args={[1.85, 0.025, 0.02]} />
            <meshBasicMaterial color="#00E5FF" />
          </mesh>
          {/* Laser Glow Sheet */}
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[1.82, 0.18]} />
            <meshBasicMaterial
              color="#00FFA3"
              transparent
              opacity={0.35}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          {/* Edge Emitter Beads */}
          <mesh position={[-0.93, 0, 0]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color="#00FFA3" />
          </mesh>
          <mesh position={[0.93, 0, 0]}>
            <sphereGeometry args={[0.04, 12, 12]} />
            <meshBasicMaterial color="#00FFA3" />
          </mesh>
        </group>
      </group>

      {/* 2. CONCENTRIC ORBITAL TELEMETRY RINGS */}
      {/* Outer Cyan Ring */}
      <group ref={ring1Ref} position={[0, 0, -0.2]} rotation={[Math.PI / 4, 0, 0]}>
        <mesh>
          <ringGeometry args={[1.8, 1.83, 64]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.4} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* Inner Mint Ring */}
      <group ref={ring2Ref} position={[0, 0, -0.2]} rotation={[-Math.PI / 4, 0, 0]}>
        <mesh>
          <ringGeometry args={[1.45, 1.48, 48]} />
          <meshBasicMaterial color="#00FFA3" transparent opacity={0.35} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>

      {/* 3. ASCENDING QUANTUM PARTICLES */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#00E5FF"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/**
 * 2D Fallback Card if WebGL is unavailable
 */
function Scanner2DFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none font-mono">
      <div className="w-28 h-36 rounded-xl bg-[#0B1117] border-2 border-[#00E5FF]/40 flex flex-col items-center justify-center p-3 shadow-cyan-glow relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-[#00E5FF] animate-pulse" />
        <Scan className="w-8 h-8 text-[#00E5FF] mb-2" />
        <span className="text-[9px] text-[#00FFA3] tracking-widest uppercase">SCANNER ACTIVE</span>
        <span className="text-[8px] text-[#94A3B8] mt-1">4096px MATRIX</span>
      </div>
      <div className="text-xs font-bold text-[#F8FAFC] mt-3">HOLOGRAPHIC SCANNER</div>
      <div className="text-[10px] text-[#94A3B8]">2D TELEMETRY MODE</div>
    </div>
  );
}

// Dedicated Error Boundary protecting the 3D Scanner
class ScannerCanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('[HolographicDocScanner3D] WebGL error caught:', error?.message);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function checkWebGLSupport() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2'))
    );
  } catch {
    return false;
  }
}

/**
 * MASTER EXPORT: HolographicDocScanner3D
 */
export default function HolographicDocScanner3D({ className = '' }) {
  const containerRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const [hasWebGlError, setHasWebGlError] = useState(() => !checkWebGLSupport());
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const handler = (e) => setReducedMotion(e.matches);
    if (query.addEventListener) query.addEventListener('change', handler);
    return () => {
      if (query.removeEventListener) query.removeEventListener('change', handler);
    };
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = Math.max(-1.5, Math.min(1.5, (e.clientX - centerX) / (rect.width * 0.5)));
    const y = Math.max(-1.5, Math.min(1.5, (e.clientY - centerY) / (rect.height * 0.5)));

    pointerRef.current.x = x;
    pointerRef.current.y = y;
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseMove={handlePointerMove}
      className={`relative w-full h-[320px] sm:h-[380px] lg:h-[420px] rounded-3xl bg-[#0B1117]/80 backdrop-blur-2xl border border-[#22323D] hover:border-[#00E5FF]/40 overflow-hidden flex items-center justify-center select-none shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all ${className}`}
    >
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 scanline-grid opacity-20 pointer-events-none" />
      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#00E5FF] z-20 pointer-events-none" />
      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#00FFA3] z-20 pointer-events-none" />

      {/* Floating Holographic Telemetry Badges */}
      <div className="absolute top-4 left-4 z-20 flex items-center space-x-2 px-3 py-1 rounded-full bg-[#101820]/90 border border-[#22323D] text-[10px] font-mono text-[#00E5FF] backdrop-blur-md">
        <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />
        <span>OPTICAL RESOLUTION // 4096px MATRIX</span>
      </div>

      <div className="absolute top-4 right-4 z-20 flex items-center space-x-2 px-3 py-1 rounded-full bg-[#101820]/90 border border-[#22323D] text-[10px] font-mono text-[#00FFA3] backdrop-blur-md">
        <ShieldCheck className="w-3 h-3 text-[#00FFA3]" />
        <span>RESTORE FIDELITY 99.4%</span>
      </div>

      <div className="absolute bottom-4 left-4 z-20 hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full bg-[#101820]/90 border border-[#22323D] text-[10px] font-mono text-[#94A3B8] backdrop-blur-md">
        <Cpu className="w-3 h-3 text-[#00E5FF]" />
        <span>OPENCV DETERMINISTIC CORE</span>
      </div>

      <div className="absolute bottom-4 right-4 z-20 flex items-center space-x-1.5 px-3 py-1 rounded-full bg-[#101820]/90 border border-[#22323D] text-[10px] font-mono text-[#DCE7EC] backdrop-blur-md">
        <Activity className="w-3 h-3 text-[#00FFA3] animate-pulse" />
        <span>SPECTRAL SCANNING</span>
      </div>

      {/* 3D Canvas Viewport */}
      {hasWebGlError ? (
        <Scanner2DFallback />
      ) : (
        <ScannerCanvasErrorBoundary
          onError={() => setHasWebGlError(true)}
          fallback={<Scanner2DFallback />}
        >
          <Canvas
            camera={{ position: [0, 0, 3.8], fov: 45 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
            }}
            dpr={[1, 1.5]}
            style={{ background: 'transparent' }}
            onCreated={({ gl }) => {
              try {
                gl.setClearColor(0x000000, 0);
              } catch (e) {
                console.warn('[HolographicDocScanner3D] gl error:', e);
              }
            }}
          >
            <ambientLight intensity={1.2} color="#101820" />
            <directionalLight position={[4, 5, 4]} intensity={2.5} color="#DCE7EC" />
            <directionalLight position={[-4, -2, -2]} intensity={2.2} color="#00E5FF" />
            <pointLight position={[0, 0, 2]} intensity={1.0} color="#00FFA3" distance={6} />

            <Suspense fallback={null}>
              <HolographicScene
                pointerRef={pointerRef}
                reducedMotion={reducedMotion}
              />
            </Suspense>
          </Canvas>
        </ScannerCanvasErrorBoundary>
      )}
    </div>
  );
}
