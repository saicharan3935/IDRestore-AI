import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { motion, AnimatePresence } from 'framer-motion';
import * as THREE from 'three';
import {
  Cpu,
  Layers,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronRight,
  ExternalLink,
  RotateCcw
} from 'lucide-react';

// 3D Metallic Core with Rotating Gimbal Rings & Energy Beams
function ReactorCore3D({ activeIndex = 0, scrollProgress = 0, dragAngle = 0 }) {
  const coreRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = time * 0.4 + dragAngle;
      coreRef.current.rotation.x = Math.sin(time * 0.3) * 0.15;
    }
    if (ring1Ref.current) ring1Ref.current.rotation.z = time * 0.6 + dragAngle * 0.5;
    if (ring2Ref.current) ring2Ref.current.rotation.x = -time * 0.45;
    if (ring3Ref.current) ring3Ref.current.rotation.y = time * 0.35 + dragAngle * 0.8;
  });

  // Calculate 4 satellite positions
  const satelliteRadius = 2.4;
  const satellites = useMemo(() => {
    return [0, 1, 2, 3].map((idx) => {
      const angle = (idx / 4) * Math.PI * 2;
      return {
        idx,
        x: Math.cos(angle) * satelliteRadius,
        z: Math.sin(angle) * satelliteRadius,
      };
    });
  }, [satelliteRadius]);

  return (
    <group position={[0, 0, 0]} rotation={[0.25, 0, 0]}>
      {/* Central Metallic Chrome Core */}
      <mesh ref={coreRef}>
        <icosahedronGeometry args={[0.95, 2]} />
        <meshStandardMaterial
          color="#101820"
          roughness={0.25}
          metalness={0.95}
          flatShading
        />
      </mesh>

      {/* Glowing Inner Energy Fissures */}
      <mesh>
        <sphereGeometry args={[0.65, 32, 32]} />
        <meshBasicMaterial
          color="#00E5FF"
          wireframe
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Concentric Gimbal Mechanical Rings */}
      <group ref={ring1Ref}>
        <mesh>
          <torusGeometry args={[1.35, 0.025, 16, 64]} />
          <meshBasicMaterial color="#00E5FF" transparent opacity={0.8} />
        </mesh>
      </group>

      <group ref={ring2Ref} rotation={[Math.PI / 3, 0, 0]}>
        <mesh>
          <torusGeometry args={[1.65, 0.022, 16, 64]} />
          <meshBasicMaterial color="#00FFA3" transparent opacity={0.65} />
        </mesh>
      </group>

      <group ref={ring3Ref} rotation={[-Math.PI / 4, Math.PI / 4, 0]}>
        <mesh>
          <torusGeometry args={[1.95, 0.02, 16, 64]} />
          <meshBasicMaterial color="#DCE7EC" transparent opacity={0.5} />
        </mesh>
      </group>

      {/* 4 Satellite Nodes representing the 4 modules */}
      {satellites.map((sat) => {
        const isActive = sat.idx === activeIndex;
        return (
          <group key={sat.idx} position={[sat.x, 0, sat.z]}>
            {/* Satellite Node Sphere */}
            <mesh>
              <sphereGeometry args={[0.18, 16, 16]} />
              <meshBasicMaterial
                color={isActive ? '#00FFA3' : '#00E5FF'}
                transparent
                opacity={isActive ? 1.0 : 0.6}
              />
            </mesh>

            {/* Connecting Energy Line to Central Core */}
            <line>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([0, 0, 0, -sat.x, 0, -sat.z])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={isActive ? '#00FFA3' : '#00E5FF'}
                transparent
                opacity={isActive ? 0.85 : 0.3}
                blending={THREE.AdditiveBlending}
              />
            </line>
          </group>
        );
      })}
    </group>
  );
}

export default function TechnologyReactor({ modelStatus = null, scrollProgress = 0 }) {
  const [activeModule, setActiveModule] = useState(0);
  const [dragAngle, setDragAngle] = useState(0);
  const isDraggingRef = useRef(false);
  const lastXRef = useRef(0);

  // Derive honest live availability from backend modelStatus
  const geminiAvailable = Boolean(modelStatus?.Gemini?.available);
  const gfpganAvailable = Boolean(modelStatus?.GFPGAN?.available);
  const realesrganAvailable = Boolean(modelStatus?.['Real-ESRGAN']?.available);
  const lamaAvailable = Boolean(modelStatus?.LaMa?.available);

  // Synchronize active module with section scroll progress
  useEffect(() => {
    if (scrollProgress > 0.05 && scrollProgress < 0.95) {
      const idx = Math.min(3, Math.max(0, Math.floor(scrollProgress * 4)));
      setActiveModule(idx);
    }
  }, [scrollProgress]);

  // Drag interaction to rotate reactor
  const handlePointerDown = (e) => {
    isDraggingRef.current = true;
    lastXRef.current = e.clientX;
    if (e.currentTarget.setPointerCapture) {
      try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
    }
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - lastXRef.current;
    lastXRef.current = e.clientX;
    setDragAngle((prev) => prev + deltaX * 0.008);
  };

  const handlePointerUp = (e) => {
    isDraggingRef.current = false;
    if (e.currentTarget.releasePointerCapture) {
      try { e.currentTarget.releasePointerCapture(e.pointerId); } catch {}
    }
  };

  const MODULES = [
    {
      id: 'gemini',
      title: 'Google Gemini Multimodal Intelligence',
      badge: 'MULTIMODAL VISION CORE',
      icon: Cpu,
      isLive: geminiAvailable,
      statusLabel: geminiAvailable ? 'CONNECTED & ACTIVE' : 'NOT CONFIGURED (FALLBACK ACTIVE)',
      statusColor: geminiAvailable ? '#00FFA3' : '#FFB547',
      description:
        'Analyzes degraded historical employee records with multimodal vision understanding. Classifies degradation patterns (defocus blur, sensor grain, paper yellowing, faded ink) and produces structured restoration guidance.',
      techStack: 'Gemini 2.5 Flash Multimodal Vision API & Structured Prompts',
      fallbackText: geminiAvailable
        ? 'Live Gemini connection established. Operating with structured JSON degradation schema.'
        : 'GEMINI_API_KEY is not configured in backend environment. System is operating safely with internal OpenCV heuristic optical quality assessment without crashing.',
      capabilities: [
        'Structured degradation classification (Defocus, Noise, Sepia, Ink Fading)',
        'Per-region bounding box telemetry and severity rating',
        'Parameter recommendation for OpenCV pipeline calibration',
        'Zero prompt hallucination disclaimer on employee identity records'
      ]
    },
    {
      id: 'opencv',
      title: 'OpenCV Deterministic Image Engine',
      badge: 'DETERMINISTIC CV PIPELINE',
      icon: Layers,
      isLive: true,
      statusLabel: '100% OPERATIONAL & EMBEDDED',
      statusColor: '#00FFA3',
      description:
        'The primary mathematical image restoration engine executing in pure C++ backed OpenCV-Python. Operates deterministically without unpredictable neural artifacts or hallucinations.',
      techStack: 'OpenCV 4.9.0 & NumPy Mathematical Array Pipeline',
      fallbackText: 'Embedded in core backend. Zero cloud dependencies, zero external licensing requirements.',
      capabilities: [
        'LAB Color-Space CLAHE (Contrast-Limited Adaptive Histogram Equalization)',
        'Bilateral Edge-Preserving Denoising (film/scanner grain removal)',
        'Unsharp Masking (high-pass microtext Laplacian enhancement)',
        'Adaptive Gamma Tone Curve (neutralizes paper yellowing & sepia decay)'
      ]
    },
    {
      id: 'neural',
      title: 'Neural Restoration Registry',
      badge: 'ADVANCED MODEL REGISTRY',
      icon: Sparkles,
      isLive: gfpganAvailable && realesrganAvailable,
      statusLabel: (gfpganAvailable && realesrganAvailable) ? 'NEURAL WEIGHTS LOADED' : 'MODEL UNAVAILABLE — FALLBACK ACTIVE',
      statusColor: (gfpganAvailable && realesrganAvailable) ? '#00FFA3' : '#FFB547',
      description:
        'Honest tracking of optional heavy deep-learning model weights (GFPGAN, Real-ESRGAN, LaMa). In adherence with enterprise verification standards, missing weights automatically trigger deterministic OpenCV equivalents.',
      techStack: 'PyTorch / ONNX Runtime (Optional GPU Acceleration)',
      fallbackText: 'Neural weights not detected in local directory. High-fidelity OpenCV Lanczos-4 sinc interpolation and Haar-Cascade filtering are actively serving requests without degradation simulation.',
      capabilities: [
        `GFPGAN v1.4: ${gfpganAvailable ? 'Pretrained Weights Active' : 'Fallback: OpenCV Bilateral Portrait Filter'}`,
        `Real-ESRGAN x4+: ${realesrganAvailable ? 'Neural Weights Active' : 'Fallback: Lanczos-4 Sinc Interpolation (4x)'}`,
        `LaMa Inpainting: ${lamaAvailable ? 'Loaded' : 'Fallback: OpenCV Navier-Stokes & Telea Inpainting'}`
      ]
    },
    {
      id: 'audit',
      title: 'Quality & Integrity Engine',
      badge: 'MATHEMATICAL AUDIT & SSIM',
      icon: ShieldCheck,
      isLive: true,
      statusLabel: 'CALIBRATED & SECURE',
      statusColor: '#00FFA3',
      description:
        'Objective mathematical quality verification pipeline. Calculates Laplacian blur variance, Structural Similarity Index (SSIM), and Peak Signal-to-Noise Ratio (PSNR) before generating cryptographically signed audit manifests.',
      techStack: 'scikit-image & ReportLab Enterprise PDF Signer',
      fallbackText: 'Fully implemented in backend. Generates verifiable audit certificates with SHA-256 provenance hashes.',
      capabilities: [
        'Laplacian Variance delta calculation (objective sharpness gain verification)',
        'SSIM (Structural Similarity) & PSNR (Signal-to-Noise) fidelity metrics',
        'Cryptographic SHA-256 document fingerprinting for audit trail',
        'Automated enterprise PDF restoration certificate and CSV/JSON manifest export'
      ]
    }
  ];

  const currentMod = MODULES[activeModule];

  return (
    <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 select-none">
      {/* 1. Master Reactor Chamber Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Side: Interactive 3D Reactor Viewport */}
        <div
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="lg:col-span-6 relative h-[420px] sm:h-[480px] rounded-3xl bg-[#0B1117]/85 backdrop-blur-xl border border-[#22323D] overflow-hidden cursor-grab active:cursor-grabbing flex items-center justify-center shadow-[0_12px_48px_rgba(0,0,0,0.7)]"
        >
          {/* Cyber Scanline Grid */}
          <div className="absolute inset-0 scanline-grid opacity-15 pointer-events-none" />

          {/* 3D Reactor Canvas */}
          <Canvas
            camera={{ position: [0, 0, 5.2], fov: 45 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            dpr={[1, 1.5]}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.6} />
            <pointLight position={[0, 3, 3]} intensity={2.0} color="#00E5FF" />
            <pointLight position={[-3, -2, -2]} intensity={1.5} color="#00FFA3" />
            <ReactorCore3D
              activeIndex={activeModule}
              scrollProgress={scrollProgress}
              dragAngle={dragAngle}
            />
          </Canvas>

          {/* Floating Reactor Status Pill */}
          <div className="absolute top-4 left-4 z-10 flex items-center space-x-2 px-3 py-1 rounded-full bg-[#101820]/90 border border-[#00E5FF]/40 text-[10px] font-mono text-[#00E5FF]">
            <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
            <span>AI REACTOR CORE • 4 NODES ONLINE</span>
          </div>

          <div className="absolute bottom-4 inset-x-4 z-10 flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
            <span>DRAG TO ROTATE REACTOR</span>
            <span className="text-[#00FFA3]">NODE {activeModule + 1} OF 4</span>
          </div>
        </div>

        {/* Right Side: Active Module Detailed Telemetry & Tabs */}
        <div className="lg:col-span-6 space-y-6 text-left">
          {/* 4 Interactive Module Selector Tabs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MODULES.map((mod, idx) => {
              const isActive = idx === activeModule;
              const IconComp = mod.icon;
              return (
                <button
                  key={mod.id}
                  type="button"
                  onClick={() => setActiveModule(idx)}
                  className={`p-3 rounded-xl border text-left transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] ${
                    isActive
                      ? 'bg-[#17232C] border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.25)]'
                      : 'bg-[#101820]/80 border-[#22323D] hover:border-[#00FFA3]/40'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <IconComp className={`w-4 h-4 ${isActive ? 'text-[#00E5FF]' : 'text-[#94A3B8]'}`} />
                    <span className="text-[10px] font-mono font-bold text-[#94A3B8]">0{idx + 1}</span>
                  </div>
                  <div className={`text-xs font-mono font-bold line-clamp-1 ${isActive ? 'text-[#F8FAFC]' : 'text-[#94A3B8]'}`}>
                    {mod.title.split(' ')[0]}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Module Glassmorphic Detail Panel */}
          <div className="p-6 sm:p-7 rounded-2xl bg-[#101820]/90 backdrop-blur-xl border border-[#00E5FF]/40 shadow-cyan-glow space-y-5">
            {/* Header: Title, Badge & Live Operational Status */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-[11px] font-mono tracking-widest text-[#00E5FF] font-bold">
                  {currentMod.badge}
                </span>

                {/* Honest Status Badge */}
                <div
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border flex items-center space-x-1.5"
                  style={{
                    backgroundColor: `${currentMod.statusColor}15`,
                    borderColor: `${currentMod.statusColor}40`,
                    color: currentMod.statusColor,
                  }}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: currentMod.statusColor }}
                  />
                  <span>{currentMod.statusLabel}</span>
                </div>
              </div>

              <h3 className="text-xl sm:text-2xl font-bold font-sans text-[#F8FAFC]">
                {currentMod.title}
              </h3>
            </div>

            {/* Description */}
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              {currentMod.description}
            </p>

            {/* Implemented Capabilities Checklist */}
            <div className="space-y-2 pt-2 border-t border-[#22323D]/60">
              <span className="text-[10px] font-mono tracking-wider text-[#DCE7EC] font-semibold uppercase">
                ENGINEERED OPERATIONAL CAPABILITIES
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {currentMod.capabilities.map((cap, i) => (
                  <div key={i} className="flex items-start space-x-2 text-[11px] font-mono text-[#94A3B8]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#00FFA3] shrink-0 mt-0.5" />
                    <span className="leading-tight">{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Architecture Fallback Notice */}
            <div className="p-3 rounded-xl bg-[#0B1117] border border-[#22323D] flex items-start space-x-2.5 text-[11px] font-mono">
              <Info className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />
              <div className="text-[#94A3B8] leading-relaxed">
                <span className="text-[#DCE7EC] font-semibold">Architecture Notice: </span>
                {currentMod.fallbackText}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
