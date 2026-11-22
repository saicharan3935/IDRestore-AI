import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  UploadCloud,
  Cpu,
  Layers,
  FileCheck,
  ShieldCheck,
  ArrowRight,
  Maximize2,
  Scan,
  Compass,
  CheckCircle2
} from 'lucide-react';

// Holographic scanning rings rotating around the zero-gravity document
function ScanningGimbalRings({ activeStage }) {
  const ring1 = useRef();
  const ring2 = useRef();
  const ring3 = useRef();

  useFrame((state, delta) => {
    if (ring1.current) ring1.current.rotation.z += delta * 0.45;
    if (ring2.current) ring2.current.rotation.x += delta * 0.35;
    if (ring3.current) ring3.current.rotation.y += delta * 0.25;
  });

  const isScanning = activeStage === 1 || activeStage === 2;

  return (
    <group position={[0, 0, -0.2]}>
      {/* Outer Cyan Ring */}
      <mesh ref={ring1}>
        <torusGeometry args={[2.4, 0.015, 16, 64]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={isScanning ? 0.65 : 0.3}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Mid Laser-Mint Ring */}
      <mesh ref={ring2} rotation={[Math.PI / 4, 0, 0]}>
        <torusGeometry args={[2.7, 0.012, 16, 64]} />
        <meshBasicMaterial
          color="#00FFA3"
          transparent
          opacity={isScanning ? 0.5 : 0.22}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Inner Platinum Alignment Track */}
      <mesh ref={ring3} rotation={[-Math.PI / 3, Math.PI / 6, 0]}>
        <torusGeometry args={[3.0, 0.01, 16, 64]} />
        <meshBasicMaterial
          color="#DCE7EC"
          transparent
          opacity={0.18}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Cyan laser scanning beam that sweeps across the document in Stage 2
function LaserScanBeam({ activeStage }) {
  const beamRef = useRef();

  useFrame((state) => {
    if (!beamRef.current) return;
    const time = state.clock.getElapsedTime();
    // Sweeps vertically across document height [-1.2 to 1.2]
    beamRef.current.position.y = Math.sin(time * 2.5) * 1.15;
  });

  if (activeStage !== 1) return null;

  return (
    <group ref={beamRef} position={[0, 0, 0.12]}>
      {/* Horizontal Laser Line */}
      <mesh>
        <planeGeometry args={[3.2, 0.04]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Emissive Laser Glow */}
      <mesh>
        <planeGeometry args={[3.3, 0.22]} />
        <meshBasicMaterial
          color="#00FFA3"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// 5 Separate Floating Visual Layers for Stage 3 (Intelligent Restoration)
function FloatingLayersExplosion({ progress = 0 }) {
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Gentle floating rotation to emphasize 3D separation
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, 0.32, delta * 3);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, 0.12, delta * 3);
    }
  });

  const layers = [
    { name: 'Layer 1: Base Optical Luminance', z: -0.65, color: '#17232C', borderColor: '#22323D', label: 'LUMINANCE' },
    { name: 'Layer 2: Bilateral Denoising Pass', z: -0.32, color: '#101820', borderColor: '#00E5FF', label: 'DENOISE' },
    { name: 'Layer 3: LAB CLAHE Contrast Curve', z: 0.0, color: '#0B1117', borderColor: '#00FFA3', label: 'CLAHE' },
    { name: 'Layer 4: High-Pass Unsharp Mask', z: 0.32, color: '#101820', borderColor: '#00E5FF', label: 'UNSHARP' },
    { name: 'Layer 5: Restored Master Composite', z: 0.65, color: '#17232C', borderColor: '#DCE7EC', label: 'RESTORED' },
  ];

  return (
    <group ref={groupRef}>
      {layers.map((l, i) => (
        <group key={i} position={[0, 0, l.z]}>
          {/* Layer Panel Surface */}
          <mesh>
            <planeGeometry args={[2.5, 1.7]} />
            <meshStandardMaterial
              color={l.color}
              roughness={0.2}
              metalness={0.8}
              transparent
              opacity={0.82}
            />
          </mesh>

          {/* Glowing Cybernetic Border */}
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(2.5, 1.7)]} />
            <lineBasicMaterial
              color={l.borderColor}
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>
        </group>
      ))}
    </group>
  );
}

// Stage 4: Dual Split Panels (Original vs Enhanced) in 3D
function DualSplitPanels() {
  const leftRef = useRef();
  const rightRef = useRef();

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (leftRef.current) {
      leftRef.current.position.y = Math.sin(time * 1.5) * 0.04;
      leftRef.current.rotation.y = -0.15;
    }
    if (rightRef.current) {
      rightRef.current.position.y = Math.cos(time * 1.5) * 0.04;
      rightRef.current.rotation.y = 0.15;
    }
  });

  return (
    <group>
      {/* Left Panel: Original Degraded */}
      <group ref={leftRef} position={[-1.4, 0, 0]}>
        <mesh>
          <planeGeometry args={[2.1, 1.5]} />
          <meshStandardMaterial color="#17232C" roughness={0.4} metalness={0.6} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(2.1, 1.5)]} />
          <lineBasicMaterial color="#FFB547" transparent opacity={0.7} />
        </lineSegments>
      </group>

      {/* Right Panel: Restored Clean */}
      <group ref={rightRef} position={[1.4, 0, 0]}>
        <mesh>
          <planeGeometry args={[2.1, 1.5]} />
          <meshStandardMaterial color="#101820" roughness={0.1} metalness={0.9} />
        </mesh>
        <lineSegments>
          <edgesGeometry args={[new THREE.PlaneGeometry(2.1, 1.5)]} />
          <lineBasicMaterial color="#00FFA3" transparent opacity={0.9} />
        </lineSegments>
      </group>

      {/* Connecting Holographic Caliper Line */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([-0.3, 0, 0, 0.3, 0, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#00E5FF" transparent opacity={0.8} />
      </line>
    </group>
  );
}

// Master 3D Document Orchestrator in Zero-Gravity
function ZeroGravityDocument({ activeStage, pointer = { x: 0, y: 0 } }) {
  const docGroupRef = useRef();

  useFrame((state, delta) => {
    if (!docGroupRef.current) return;
    const time = state.clock.getElapsedTime();

    // Gentle float in zero-gravity
    const floatY = Math.sin(time * 1.2) * 0.06;
    const floatRotX = Math.sin(time * 0.8) * 0.03;
    const floatRotY = Math.cos(time * 0.9) * 0.04;

    // Mouse parallax
    const parallaxX = pointer.x * 0.25;
    const parallaxY = pointer.y * 0.18;

    // Target position and rotation based on active stage
    let targetX = parallaxX;
    let targetY = floatY + parallaxY;
    let targetZ = 0;
    let targetRotX = floatRotX;
    let targetRotY = floatRotY;
    let targetScale = 1.0;

    if (activeStage === 0) {
      // Stage 1: Document enters from distance and aligns
      targetZ = -0.4;
      targetScale = 0.95;
    } else if (activeStage === 1) {
      // Stage 2: Scanning alignment
      targetZ = 0.2;
      targetScale = 1.05;
    } else if (activeStage === 2) {
      // Stage 3: Layer separation handles its own transform
      targetZ = 0.0;
      targetScale = 0.95;
    } else if (activeStage === 3) {
      // Stage 4: Dual panel split
      targetScale = 0.9;
    } else if (activeStage === 4) {
      // Stage 5: Enters archive bay
      targetY = -0.3;
      targetZ = -0.8;
      targetScale = 0.78;
    }

    docGroupRef.current.position.x = THREE.MathUtils.lerp(docGroupRef.current.position.x, targetX, delta * 4);
    docGroupRef.current.position.y = THREE.MathUtils.lerp(docGroupRef.current.position.y, targetY, delta * 4);
    docGroupRef.current.position.z = THREE.MathUtils.lerp(docGroupRef.current.position.z, targetZ, delta * 4);
    docGroupRef.current.rotation.x = THREE.MathUtils.lerp(docGroupRef.current.rotation.x, targetRotX, delta * 4);
    docGroupRef.current.rotation.y = THREE.MathUtils.lerp(docGroupRef.current.rotation.y, targetRotY, delta * 4);
    docGroupRef.current.scale.setScalar(THREE.MathUtils.lerp(docGroupRef.current.scale.x, targetScale, delta * 4));
  });

  return (
    <group ref={docGroupRef}>
      {activeStage === 2 ? (
        /* Stage 3: 5 Separated Floating Visual Layers */
        <FloatingLayersExplosion />
      ) : activeStage === 3 ? (
        /* Stage 4: Dual Split Panels */
        <DualSplitPanels />
      ) : (
        /* Stages 1, 2, 5: Single Document Plate with Cyber Frame */
        <group>
          {/* Main Floating Document Plate */}
          <mesh>
            <planeGeometry args={[2.7, 1.8]} />
            <meshStandardMaterial
              color="#101820"
              roughness={0.25}
              metalness={0.85}
              transparent
              opacity={0.92}
            />
          </mesh>

          {/* Cyber Framing Rim */}
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(2.7, 1.8)]} />
            <lineBasicMaterial
              color={activeStage === 4 ? '#00FFA3' : '#00E5FF'}
              transparent
              opacity={0.85}
              blending={THREE.AdditiveBlending}
            />
          </lineSegments>

          {/* Corner Alignment Calipers */}
          {[-1.35, 1.35].map((cx, i) =>
            [-0.9, 0.9].map((cy, j) => (
              <mesh key={`${i}-${j}`} position={[cx, cy, 0.02]}>
                <ringGeometry args={[0.04, 0.08, 8]} />
                <meshBasicMaterial color="#00FFA3" transparent opacity={0.7} />
              </mesh>
            ))
          )}

          {/* Stage 2 Laser Scanning Sweep */}
          <LaserScanBeam activeStage={activeStage} />
        </group>
      )}

      {/* Rotating Concentric Scanning Gimbal */}
      <ScanningGimbalRings activeStage={activeStage} />
    </group>
  );
}

const STAGES = [
  {
    num: '01',
    title: 'Upload Document',
    badge: 'STAGE 01 • DOCUMENT RECOGNITION',
    desc: 'Securely import degraded historical employee records for analysis and restoration. Supports TIFF, JPEG, PNG, and PDF archives.',
    status: 'INGESTED • CALIBRATING SCAN PLANE'
  },
  {
    num: '02',
    title: 'Gemini AI Analysis',
    badge: 'STAGE 02 • MULTIMODAL SPECTRAL SCAN (DEMONSTRATION)',
    desc: 'Multimodal vision evaluation pinpoints degradation types: optical defocus blur, sensor grain noise, paper yellowing, and ink fading.',
    status: 'DEFOCUS BLUR σ=1.8 • CONFIDENCE: 99.4%'
  },
  {
    num: '03',
    title: 'Intelligent Restoration',
    badge: 'STAGE 03 • 5-LAYER PIXEL RECONSTRUCTION',
    desc: 'The document separates into five floating visual layers representing discrete image processing steps: Luminance, Bilateral Denoising, LAB CLAHE, Unsharp Masking, and Master Restored Composite.',
    status: '5 CV STAGES SEPARATED & RECONSTRUCTING'
  },
  {
    num: '04',
    title: 'Quality Evaluation',
    badge: 'STAGE 04 • QUANTITATIVE DELTA VERIFICATION',
    desc: 'Original and enhanced image panels separate in 3D space, verifying Laplacian sharpness gain (+161.9%), SSIM (0.774), and PSNR (12.09 dB).',
    status: 'SHARPNESS +161.9% • SSIM: 0.774 • PSNR: 12.09 dB'
  },
  {
    num: '05',
    title: 'Export Enhanced Document',
    badge: 'STAGE 05 • ARCHIVE PACKAGING & MIGRATION READY',
    desc: 'Export restored high-resolution document alongside PDF audit certificate and cryptographic provenance record for HRMS migration.',
    status: 'ASSET ARCHIVED • SIGNED WITH SHA-256 LEDGER'
  }
];

export default function ZeroGravityLaboratory3D({ onLaunchWorkspace, scrollProgress = 0 }) {
  const [activeStage, setActiveStage] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const containerRef = useRef(null);

  // Synchronize stage from scroll progress
  useEffect(() => {
    if (scrollProgress > 0.05 && scrollProgress < 0.95) {
      const idx = Math.min(4, Math.max(0, Math.floor(scrollProgress * 5)));
      setActiveStage(idx);
    }
  }, [scrollProgress]);

  // Pointer move for mouse parallax
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setPointer({ x, y });
  };

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveStage((prev) => Math.min(4, prev + 1));
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveStage((prev) => Math.max(0, prev - 1));
    } else if (['1', '2', '3', '4', '5'].includes(e.key)) {
      e.preventDefault();
      setActiveStage(parseInt(e.key, 10) - 1);
    }
  };

  const currentStageInfo = STAGES[activeStage];

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Zero-Gravity 3D Restoration Laboratory"
      onMouseMove={handleMouseMove}
      onKeyDown={handleKeyDown}
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 select-none focus:outline-none"
    >
      {/* 1. Main Zero-Gravity 3D Chamber Container */}
      <div className="relative w-full min-h-[560px] sm:min-h-[620px] rounded-3xl bg-[#0B1117]/85 backdrop-blur-xl border border-[#22323D] overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-[0_16px_64px_rgba(0,0,0,0.8)]">
        
        {/* Subtle Cyber Grid Background */}
        <div className="absolute inset-0 scanline-grid opacity-15 pointer-events-none" />

        {/* Top Laboratory Status & Telemetry Header */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#22323D]/60 text-xs font-mono">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="text-[#00E5FF] font-bold tracking-wider">
              ZERO-GRAVITY OPTICAL LABORATORY
            </span>
            <span className="text-[#94A3B8] hidden sm:inline">| BIOMETRIC INTEGRITY ENCLAVE</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-[#94A3B8]">
            <span className="px-2.5 py-0.5 rounded bg-[#101820] border border-[#22323D] text-[#00FFA3]">
              {currentStageInfo.badge}
            </span>
          </div>
        </div>

        {/* Center: Real 3D React Three Fiber Zero-Gravity Canvas */}
        <div className="relative z-10 w-full h-[320px] sm:h-[360px] my-4 flex items-center justify-center">
          <Canvas
            camera={{ position: [0, 0, 4.8], fov: 45 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            dpr={[1, 1.5]}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[4, 5, 4]} intensity={2.2} color="#DCE7EC" />
            <directionalLight position={[-4, -3, -3]} intensity={1.5} color="#00E5FF" />
            <pointLight position={[0, 0, 2]} intensity={1.2} color="#00FFA3" distance={6} />

            <ZeroGravityDocument activeStage={activeStage} pointer={pointer} />
          </Canvas>

          {/* Stage Status Telemetry Overlay (Bottom Left of 3D Scene) */}
          <div className="absolute bottom-2 left-2 z-20 flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-[#050709]/85 backdrop-blur-md border border-[#22323D] text-[10px] font-mono text-[#00FFA3]">
            <Scan className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>TELEMETRY: {currentStageInfo.status}</span>
          </div>
        </div>

        {/* Bottom: Stage Explanatory Information & Interactive 5-Step Stepper */}
        <div className="relative z-20 pt-4 border-t border-[#22323D]/60 space-y-4">
          <div className="max-w-2xl mx-auto text-center space-y-1">
            <h3 className="text-xl font-bold font-sans text-[#F8FAFC] flex items-center justify-center space-x-2">
              <span className="text-[#00E5FF] font-mono">{currentStageInfo.num}.</span>
              <span>{currentStageInfo.title}</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              {currentStageInfo.desc}
            </p>
          </div>

          {/* Interactive 5 Stage Indicators */}
          <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
            {STAGES.map((s, idx) => {
              const isActive = idx === activeStage;
              return (
                <button
                  key={s.num}
                  type="button"
                  onClick={() => setActiveStage(idx)}
                  className={`group relative px-3 sm:px-4 py-2 rounded-xl font-mono text-xs transition-all duration-200 border flex items-center space-x-2 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] ${
                    isActive
                      ? 'bg-[#17232C] text-[#00E5FF] border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                      : 'bg-[#101820]/80 text-[#94A3B8] border-[#22323D] hover:border-[#00FFA3]/50 hover:text-[#DCE7EC]'
                  }`}
                >
                  <span className={`font-bold ${isActive ? 'text-[#00E5FF]' : 'text-[#94A3B8]'}`}>
                    {s.num}
                  </span>
                  <span className="hidden md:inline text-[11px]">
                    {s.title}
                  </span>
                </button>
              );
            })}
          </div>

          {/* CTA Button in Stage 5 */}
          {activeStage === 4 && (
            <div className="text-center pt-1">
              <button
                onClick={() => onLaunchWorkspace('restore')}
                className="px-6 py-2.5 rounded-xl font-mono text-xs font-bold bg-[#00E5FF] text-black hover:bg-[#33EBFF] transition-all inline-flex items-center space-x-2 shadow-cyan-strong active:scale-95"
              >
                <span>OPEN RESTORATION WORKSPACE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Navigation Guide Pill */}
          <div className="text-center text-[10px] font-mono text-[#94A3B8]/70">
            DRAG MOUSE FOR 3D PARALLAX &bull; USE [← / →] KEYS OR CLICK 01–05 TO ORCHESTRATE
          </div>
        </div>

      </div>
    </div>
  );
}
