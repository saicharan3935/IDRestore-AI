import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  Columns,
  Scan,
  Crosshair,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Play,
  Pause,
  ShieldCheck,
  CheckCircle,
  Eye,
  RefreshCw,
  Compass,
  Layers
} from 'lucide-react';

// ==============================================================
// 3D CARDS SCENE: SEPARATE, OVERLAP & INSPECT IN REAL 3D
// ==============================================================
function Physical3DDocumentCards({
  mode = 'side-by-side',
  laserPos = 50,
  zoomLevel = 1.0,
  textures,
  pointer = { x: 0, y: 0 },
  inspectorCoords = { x: 0.5, y: 0.5 },
  isMobile = false,
}) {
  const leftCardRef = useRef();
  const rightCardRef = useRef();
  const laserBeamRef = useRef();

  const docW = isMobile ? 3.2 : 4.0;
  const docH = isMobile ? 2.2 : 2.7;

  // Local clipping plane for Laser Reveal mode
  const laserClipPlane = useMemo(() => {
    return new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    // Gentle floating zero-gravity motion
    const floatY = Math.sin(time * 1.3) * 0.035;
    const floatRotX = Math.sin(time * 0.9) * 0.015;
    const floatRotY = Math.cos(time * 1.1) * 0.02;

    const px = pointer.x * 0.15;
    const py = pointer.y * 0.12;

    // TARGET TRANSFORMS BASED ON SELECTED MODE:
    // -------------------------------------------------------------
    // MODE 1: 'side-by-side' -> Left card flies to -2.35, Right to +2.35, rotate outward
    // MODE 2: 'laser-reveal' -> Left card slightly behind (Z = -0.12), Right card in front (Z = +0.12)
    // MODE 3: 'inspector'    -> Cards separate to -2.35 and +2.35 with flat inspection angle
    // -------------------------------------------------------------
    let targetLeftX = 0;
    let targetLeftY = floatY + py;
    let targetLeftZ = 0;
    let targetLeftRotY = floatRotY;

    let targetRightX = 0;
    let targetRightY = floatY + py;
    let targetRightZ = 0.02;
    let targetRightRotY = floatRotY;

    const sepX = isMobile ? 1.8 : 2.35;

    if (mode === 'side-by-side') {
      // Physically separate into two independent 3D cards rotating outward
      targetLeftX = -sepX + px;
      targetLeftZ = -0.15;
      targetLeftRotY = isMobile ? 0 : 0.18 + floatRotY;

      targetRightX = sepX + px;
      targetRightZ = -0.15;
      targetRightRotY = isMobile ? 0 : -0.18 + floatRotY;
    } else if (mode === 'laser-reveal') {
      // Overlapping 3D arrangement: Original behind, Restored in front
      targetLeftX = px;
      targetLeftZ = -0.12;
      targetRightX = px;
      targetRightZ = 0.12;
      targetLeftRotY = floatRotY;
      targetRightRotY = floatRotY;
    } else if (mode === 'inspector') {
      // Separated for synchronized dual magnification inspection
      targetLeftX = -sepX + px;
      targetLeftZ = 0;
      targetLeftRotY = isMobile ? 0 : 0.08 + floatRotY;

      targetRightX = sepX + px;
      targetRightZ = 0;
      targetRightRotY = isMobile ? 0 : -0.08 + floatRotY;
    }

    const finalScale = zoomLevel * (isMobile ? 0.85 : 1.0);

    // Smoothly animate Left Card (Original)
    if (leftCardRef.current) {
      leftCardRef.current.position.x = THREE.MathUtils.damp(leftCardRef.current.position.x, targetLeftX, 6, delta);
      leftCardRef.current.position.y = THREE.MathUtils.damp(leftCardRef.current.position.y, targetLeftY, 6, delta);
      leftCardRef.current.position.z = THREE.MathUtils.damp(leftCardRef.current.position.z, targetLeftZ, 6, delta);
      leftCardRef.current.rotation.x = THREE.MathUtils.damp(leftCardRef.current.rotation.x, floatRotX, 6, delta);
      leftCardRef.current.rotation.y = THREE.MathUtils.damp(leftCardRef.current.rotation.y, targetLeftRotY, 6, delta);
      leftCardRef.current.scale.setScalar(THREE.MathUtils.damp(leftCardRef.current.scale.x, finalScale, 6, delta));
    }

    // Smoothly animate Right Card (Restored)
    if (rightCardRef.current) {
      rightCardRef.current.position.x = THREE.MathUtils.damp(rightCardRef.current.position.x, targetRightX, 6, delta);
      rightCardRef.current.position.y = THREE.MathUtils.damp(rightCardRef.current.position.y, targetRightY, 6, delta);
      rightCardRef.current.position.z = THREE.MathUtils.damp(rightCardRef.current.position.z, targetRightZ, 6, delta);
      rightCardRef.current.rotation.x = THREE.MathUtils.damp(rightCardRef.current.rotation.x, floatRotX, 6, delta);
      rightCardRef.current.rotation.y = THREE.MathUtils.damp(rightCardRef.current.rotation.y, targetRightRotY, 6, delta);
      rightCardRef.current.scale.setScalar(THREE.MathUtils.damp(rightCardRef.current.scale.x, finalScale, 6, delta));
    }

    // Dynamic 3D Laser Reveal clipping plane & beam
    const laserOffset = ((laserPos / 100) - 0.5) * docW;
    laserClipPlane.constant = (mode === 'laser-reveal' ? laserOffset : 100);

    if (laserBeamRef.current) {
      laserBeamRef.current.position.x = laserOffset;
      laserBeamRef.current.visible = (mode === 'laser-reveal');
    }
  });

  return (
    <group>
      {/* ============================================================== */}
      {/* 3D DOCUMENT CARD 1: ORIGINAL DEGRADED (1987 ARCHIVE)           */}
      {/* ============================================================== */}
      <group ref={leftCardRef} position={[-2.35, 0, 0]}>
        {/* Physical Shallow Card Slab */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[docW, docH, 0.03]} />
          <meshStandardMaterial
            color="#0B1117"
            roughness={0.4}
            metalness={0.7}
          />
        </mesh>

        {/* Front Textured Surface */}
        <mesh position={[0, 0, 0.018]}>
          <planeGeometry args={[docW * 0.98, docH * 0.98]} />
          {textures.original ? (
            <meshStandardMaterial
              map={textures.original}
              roughness={0.35}
              metalness={0.15}
            />
          ) : (
            <meshStandardMaterial color="#17232C" />
          )}
        </mesh>

        {/* Amber / Platinum Precision Edge Rim */}
        <lineSegments position={[0, 0, 0.02]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(docW, docH)]} />
          <lineBasicMaterial
            color="#FFB547"
            transparent
            opacity={0.85}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>

        {/* Holographic Corner Alignment Markers */}
        {[-docW / 2, docW / 2].map((cx, i) =>
          [-docH / 2, docH / 2].map((cy, j) => (
            <mesh key={`l-${i}-${j}`} position={[cx, cy, 0.022]}>
              <ringGeometry args={[0.035, 0.075, 12]} />
              <meshBasicMaterial color="#FFB547" transparent opacity={0.8} />
            </mesh>
          ))
        )}
      </group>

      {/* ============================================================== */}
      {/* 3D DOCUMENT CARD 2: RESTORED DIGITAL ASSET (IDRESTORE AI)       */}
      {/* ============================================================== */}
      <group ref={rightCardRef} position={[2.35, 0, 0.02]}>
        {/* Physical Shallow Card Slab */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[docW, docH, 0.03]} />
          <meshStandardMaterial
            color="#0B1117"
            roughness={0.25}
            metalness={0.85}
          />
        </mesh>

        {/* Front Textured Surface with Clipping Plane for Laser */}
        <mesh position={[0, 0, 0.018]}>
          <planeGeometry args={[docW * 0.98, docH * 0.98]} />
          {textures.restored ? (
            <meshStandardMaterial
              map={textures.restored}
              roughness={0.15}
              metalness={0.25}
              clippingPlanes={mode === 'laser-reveal' ? [laserClipPlane] : []}
              clipShadows
            />
          ) : (
            <meshStandardMaterial color="#101820" />
          )}
        </mesh>

        {/* Electric Cyan / Laser Mint Glow Rim */}
        <lineSegments position={[0, 0, 0.02]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(docW, docH)]} />
          <lineBasicMaterial
            color="#00FFA3"
            transparent
            opacity={0.9}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>

        {/* Holographic Corner Alignment Markers */}
        {[-docW / 2, docW / 2].map((cx, i) =>
          [-docH / 2, docH / 2].map((cy, j) => (
            <mesh key={`r-${i}-${j}`} position={[cx, cy, 0.022]}>
              <ringGeometry args={[0.035, 0.075, 12]} />
              <meshBasicMaterial color="#00E5FF" transparent opacity={0.9} />
            </mesh>
          ))
        )}

        {/* 3D Cyan Laser Sweep Line (Laser Reveal Mode) */}
        <group ref={laserBeamRef} visible={mode === 'laser-reveal'} position={[0, 0, 0.035]}>
          <mesh>
            <planeGeometry args={[0.07, docH * 1.04]} />
            <meshBasicMaterial
              color="#00E5FF"
              transparent
              opacity={0.95}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh>
            <planeGeometry args={[0.3, docH * 1.04]} />
            <meshBasicMaterial
              color="#00FFA3"
              transparent
              opacity={0.35}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// Background Holographic Gimbal Rings
function ChamberGimbalRings() {
  const g1 = useRef();
  const g2 = useRef();

  useFrame((state, delta) => {
    if (g1.current) g1.current.rotation.z += delta * 0.25;
    if (g2.current) g2.current.rotation.y += delta * 0.18;
  });

  return (
    <group position={[0, 0, -2.8]} rotation={[0.12, 0, 0]}>
      <mesh ref={g1}>
        <torusGeometry args={[4.2, 0.014, 16, 64]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={g2} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[4.8, 0.012, 16, 64]} />
        <meshBasicMaterial color="#00FFA3" transparent opacity={0.2} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// Atmospheric Cyber Particles
function ChamberAtmosphericDust({ count = 50 }) {
  const pointsRef = useRef();

  const [coords, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const c1 = new THREE.Color('#00E5FF');
    const c2 = new THREE.Color('#00FFA3');

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 14;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 8;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 4;

      const pick = Math.random();
      const c = pick > 0.5 ? c1 : c2;
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return [pos, cols];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const array = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 1.5 + i) * 0.0018;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y += delta * 0.02;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={coords} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// ==============================================================
// MASTER EXPORT COMPONENT: RESTORATION CHAMBER 3D
// ==============================================================
export default function RestorationChamber3D({
  demoData,
  demoLoading,
  loadLiveDemo,
  scrollProgress = 0,
}) {
  // Independent comparison state (Side-by-Side is the primary default)
  const [mode, setMode] = useState('side-by-side'); // 'side-by-side' | 'laser-reveal' | 'inspector'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Laser Reveal state
  const [laserPos, setLaserPos] = useState(50);
  const [laserPlaying, setLaserPlaying] = useState(true);

  // Detail Inspector coordinates
  const [inspectorCoords, setInspectorCoords] = useState({ x: 0.5, y: 0.5 });
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const [textures, setTextures] = useState({ original: null, restored: null });

  // Load Three.js Textures
  useEffect(() => {
    const loader = new THREE.TextureLoader();
    const origUrl = demoData?.original_url || '/samples/demo_original_degraded.jpg';
    const restUrl = demoData?.restored_url || '/samples/demo_restored_clean.jpg';

    loader.load(origUrl, (origTex) => {
      origTex.colorSpace = THREE.SRGBColorSpace;
      origTex.minFilter = THREE.LinearFilter;
      origTex.generateMipmaps = false;

      loader.load(restUrl, (restTex) => {
        restTex.colorSpace = THREE.SRGBColorSpace;
        restTex.minFilter = THREE.LinearFilter;
        restTex.generateMipmaps = false;
        setTextures({ original: origTex, restored: restTex });
      });
    });
  }, [demoData]);

  // Pointer move for 3D parallax
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    setPointer({ x, y });
  };

  // Laser Reveal Auto-Sweep
  useEffect(() => {
    if (mode !== 'laser-reveal' || !laserPlaying) return;
    let animId;
    let start = performance.now();

    const sweepLoop = (now) => {
      const elapsed = (now - start) / 1000;
      // Oscillate across 0% to 100% every 3.5s
      const current = (Math.sin(elapsed * 1.8 - Math.PI / 2) * 0.5 + 0.5) * 100;
      setLaserPos(current);
      animId = requestAnimationFrame(sweepLoop);
    };

    animId = requestAnimationFrame(sweepLoop);
    return () => cancelAnimationFrame(animId);
  }, [mode, laserPlaying]);

  // Detail Inspector tracking
  const handleInspectorMove = (e) => {
    if (mode !== 'inspector') return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    setInspectorCoords({ x: normX, y: normY });
  };

  const handleZoom = (delta) => {
    setZoomLevel((z) => Math.min(2.0, Math.max(0.75, z + delta)));
  };

  const handleReset = () => {
    setZoomLevel(1);
    setLaserPos(50);
    setLaserPlaying(true);
    setInspectorCoords({ x: 0.5, y: 0.5 });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = demoData?.restored_url || '/samples/demo_restored_clean.jpg';
    link.download = 'Restored_Employee_Record_1987.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="3D Restoration Chamber Comparison Portal"
      onMouseMove={handleMouseMove}
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 select-none focus:outline-none"
    >
      <div className="relative w-full rounded-3xl bg-[#0B1117]/90 backdrop-blur-2xl border border-[#22323D] overflow-hidden p-4 sm:p-7 shadow-[0_20px_70px_rgba(0,0,0,0.85)]">
        
        {/* Holographic Scanline Overlay & Corner Laser Guides */}
        <div className="absolute inset-0 scanline-grid opacity-15 pointer-events-none" />
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#00E5FF] z-40 pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#00E5FF] z-40 pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#00FFA3] z-40 pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#00FFA3] z-40 pointer-events-none" />

        {/* ============================================================== */}
        {/* TOP HUD: STATUS BAR, MODE BUTTONS & TOOLS                      */}
        {/* ============================================================== */}
        <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#22323D]/80 text-xs font-mono">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="text-[#00E5FF] font-bold tracking-wider">
              3D RESTORATION PORTAL &bull; CLICK TO ANIMATE
            </span>
            <span className="hidden sm:inline text-[#94A3B8]">| ZERO-GRAVITY CARD RECONFIGURATION</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-[#94A3B8]">
            <span className="px-2.5 py-0.5 rounded bg-[#101820] border border-[#22323D] text-[#00FFA3]">
              MODE: {mode.toUpperCase().replace('-', ' ')}
            </span>
            <span className="hidden sm:inline text-[#DCE7EC]">900 &times; 600 PX</span>
          </div>
        </div>

        {/* 3 Mode Buttons & Tools Toolbar */}
        <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* THE 3 CLICK-TO-TRANSFORM MODE BUTTONS */}
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-[#101820] border border-[#22323D] text-xs font-mono">
            {[
              { id: 'side-by-side', label: 'Side-by-Side (3D Separation)', icon: Columns },
              { id: 'laser-reveal', label: 'Laser Reveal (3D Overlap)', icon: Scan },
              { id: 'inspector', label: 'Detail Inspector', icon: Crosshair },
            ].map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] ${
                    isActive
                      ? 'bg-[#17232C] text-[#00E5FF] border border-[#00E5FF]/50 shadow-[0_0_14px_rgba(0,229,255,0.3)] font-bold'
                      : 'text-[#94A3B8] hover:text-[#DCE7EC] hover:bg-[#17232C]/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleZoom(0.2)}
              title="Zoom In"
              className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00E5FF] border border-[#22323D] transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-0.2)}
              title="Zoom Out"
              className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00E5FF] border border-[#22323D] transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              title="Reset Controls"
              className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00FFA3] border border-[#22323D] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00E5FF] border border-[#22323D] transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-[#00E5FF] text-black font-bold font-mono hover:bg-[#33EBFF] transition-all flex items-center space-x-1.5 shadow-cyan-strong active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DOWNLOAD</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* REAL 3D CANVAS VIEWPORT: CARDS SEPARATE, OVERLAP & ROTATE      */}
        {/* ============================================================== */}
        <div
          ref={canvasWrapperRef}
          className="relative w-full h-[460px] sm:h-[520px] md:h-[580px] rounded-2xl overflow-hidden border border-[#22323D] bg-[#050709] flex items-center justify-center"
        >
          {/* Real Three.js Canvas with Local Clipping Enabled */}
          <Canvas
            camera={{ position: [0, 0, 5.8], fov: 46 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              localClippingEnabled: true,
            }}
            dpr={[1, 1.5]}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.7} />
            <directionalLight position={[5, 6, 6]} intensity={2.2} color="#DCE7EC" />
            <directionalLight position={[-5, -4, -4]} intensity={1.5} color="#00E5FF" />
            <pointLight position={[0, 0, 3.2]} intensity={1.6} color="#00FFA3" distance={8} />

            {/* Background Gimbal Rings & Ambient Dust */}
            <ChamberGimbalRings />
            <ChamberAtmosphericDust count={45} />

            {/* The Physical 3D Document Cards that Animate on Click! */}
            <Physical3DDocumentCards
              mode={mode}
              laserPos={laserPos}
              zoomLevel={zoomLevel}
              textures={textures}
              pointer={pointer}
              inspectorCoords={inspectorCoords}
            />
          </Canvas>

          {/* ============================================================== */}
          {/* HTML ACCESSIBLE INTERACTION OVERLAYS                           */}
          {/* ============================================================== */}

          {/* 1. Side-by-Side Floating Labels Overlay (When mode === 'side-by-side') */}
          {mode === 'side-by-side' && (
            <div className="absolute inset-x-0 top-4 z-30 flex justify-between px-8 sm:px-16 pointer-events-none text-xs font-mono">
              <div className="px-3.5 py-1.5 rounded-lg bg-[#050709]/85 border border-[#FFB547]/50 text-[#FFB547] shadow-[0_0_15px_rgba(255,181,71,0.2)]">
                ORIGINAL DEGRADED (1987 ARCHIVE)
              </div>
              <div className="px-3.5 py-1.5 rounded-lg bg-[#050709]/85 border border-[#00FFA3]/60 text-[#00FFA3] font-bold shadow-[0_0_20px_rgba(0,255,163,0.25)]">
                ENHANCED DIGITAL ASSET (IDRESTORE AI)
              </div>
            </div>
          )}

          {/* 2. Laser Reveal Controls Overlay (When mode === 'laser-reveal') */}
          {mode === 'laser-reveal' && (
            <div className="absolute inset-x-0 bottom-4 z-30 px-6 pointer-events-auto">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0B1117]/95 backdrop-blur-md border border-[#22323D] text-xs font-mono max-w-xl mx-auto shadow-[0_8px_30px_rgba(0,0,0,0.8)]">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setLaserPlaying((p) => !p)}
                    className="px-3 py-1.5 rounded-lg bg-[#17232C] hover:bg-[#22323D] text-[#00E5FF] border border-[#00E5FF]/40 flex items-center space-x-1.5"
                  >
                    {laserPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{laserPlaying ? 'PAUSE SWEEP' : 'RESUME SWEEP'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setLaserPos(0);
                      setLaserPlaying(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#17232C] hover:bg-[#22323D] text-[#DCE7EC] border border-[#22323D] flex items-center space-x-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESTART</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-56">
                  <span className="text-[#94A3B8] text-[10px]">REVEAL: {laserPos.toFixed(0)}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={laserPos}
                    onChange={(e) => {
                      setLaserPlaying(false);
                      setLaserPos(parseFloat(e.target.value));
                    }}
                    className="w-full accent-[#00E5FF] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 3. Detail Inspector Loupes Overlay (When mode === 'inspector') */}
          {mode === 'inspector' && (
            <div
              onMouseMove={handleInspectorMove}
              onTouchMove={handleInspectorMove}
              className="absolute inset-0 z-30 p-4 pointer-events-auto flex flex-col justify-between"
            >
              <div className="grid grid-cols-2 gap-4 h-44 sm:h-48 pointer-events-none">
                {/* Left Loupe: Original */}
                <div className="relative rounded-xl overflow-hidden border border-[#22323D] bg-[#050709]/95">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${demoData?.original_url || '/samples/demo_original_degraded.jpg'})`,
                      backgroundPosition: `${inspectorCoords.x * 100}% ${inspectorCoords.y * 100}%`,
                      backgroundSize: '300%',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded bg-[#050709]/85 text-[10px] font-mono text-[#FFB547]">
                    ORIGINAL (2.8&times; LOUPE)
                  </div>
                </div>

                {/* Right Loupe: Restored */}
                <div className="relative rounded-xl overflow-hidden border border-[#00FFA3]/60 bg-[#050709]/95 shadow-[0_0_20px_rgba(0,255,163,0.2)]">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${demoData?.restored_url || '/samples/demo_restored_clean.jpg'})`,
                      backgroundPosition: `${inspectorCoords.x * 100}% ${inspectorCoords.y * 100}%`,
                      backgroundSize: '300%',
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded bg-[#050709]/85 text-[10px] font-mono text-[#00FFA3] font-bold">
                    RESTORED (2.8&times; LOUPE)
                  </div>
                </div>
              </div>

              {/* Inspector Presets Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0B1117]/95 border border-[#22323D] text-[11px] font-mono">
                <div className="flex items-center space-x-2 text-[#94A3B8]">
                  <span>COORDINATES:</span>
                  <span className="text-[#00E5FF]">X: {(inspectorCoords.x * 100).toFixed(0)}%</span>
                  <span className="text-[#00FFA3]">Y: {(inspectorCoords.y * 100).toFixed(0)}%</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[#94A3B8]">FOCUS TARGETS:</span>
                  {[
                    { label: 'PORTRAIT', x: 0.22, y: 0.35 },
                    { label: 'MICROTEXT', x: 0.50, y: 0.50 },
                    { label: 'SIGNATURE', x: 0.78, y: 0.82 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setInspectorCoords({ x: p.x, y: p.y })}
                      className="px-2.5 py-1 rounded bg-[#17232C] hover:bg-[#22323D] text-[#DCE7EC] hover:text-[#00FFA3] border border-[#22323D] transition-colors"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Telemetry Badge (Bottom Left) */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#050709]/85 backdrop-blur-md border border-[#22323D] text-[10px] font-mono text-[#00E5FF]">
            <Layers className="w-3.5 h-3.5 text-[#00FFA3]" />
            <span>3D PHYSICAL CARD MESHES &bull; CLICK BUTTONS TO SEPARATE OR OVERLAP</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* BOTTOM QUANTITATIVE AUDIT METRICS STRIP                        */}
        {/* ============================================================== */}
        <div className="relative z-30 mt-4 pt-4 border-t border-[#22323D]/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
          <div className="p-2.5 rounded-xl bg-[#101820] border border-[#22323D]">
            <div className="text-[10px] text-[#94A3B8]">SHARPNESS GAIN</div>
            <div className="text-sm font-bold text-[#00FFA3]">+{demoData?.metrics?.sharpness_gain_percent || 161.9}%</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#101820] border border-[#22323D]">
            <div className="text-[10px] text-[#94A3B8]">STRUCTURAL SSIM</div>
            <div className="text-sm font-bold text-[#00E5FF]">{demoData?.metrics?.ssim || 0.774}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#101820] border border-[#22323D]">
            <div className="text-[10px] text-[#94A3B8]">FIDELITY PSNR</div>
            <div className="text-sm font-bold text-[#DCE7EC]">{demoData?.metrics?.psnr_db || 12.09} dB</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#101820] border border-[#22323D]">
            <div className="text-[10px] text-[#94A3B8]">PROCESSING LATENCY</div>
            <div className="text-sm font-bold text-[#00FFA3]">{demoData?.metrics?.processing_time_ms || 254.2} ms</div>
          </div>
        </div>

      </div>
    </div>
  );
}
