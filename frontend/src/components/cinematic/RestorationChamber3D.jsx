import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  Sliders,
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
  Compass
} from 'lucide-react';

// Subtle 3D Ambient Cybernetic Platform & Gimbal in Background (Non-blocking)
function ChamberBackgroundStage({ scrollProgress = 0 }) {
  const ring1 = useRef();
  const ring2 = useRef();

  useFrame((state, delta) => {
    if (ring1.current) ring1.current.rotation.z += delta * 0.2;
    if (ring2.current) ring2.current.rotation.y += delta * 0.15;
  });

  return (
    <group position={[0, 0, -2.5]} rotation={[0.15, 0, 0]}>
      {/* Concentric Cyan Ring */}
      <mesh ref={ring1}>
        <torusGeometry args={[3.8, 0.012, 16, 64]} />
        <meshBasicMaterial
          color="#00E5FF"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Laser Mint Secondary Ring */}
      <mesh ref={ring2} rotation={[Math.PI / 3, 0, 0]}>
        <torusGeometry args={[4.2, 0.01, 16, 64]} />
        <meshBasicMaterial
          color="#00FFA3"
          transparent
          opacity={0.25}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

// Atmospheric Chamber Floating Cyber Particles
function AmbientChamberParticles({ count = 60 }) {
  const pointsRef = useRef();

  const [coords, colors] = React.useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const c1 = new THREE.Color('#00E5FF');
    const c2 = new THREE.Color('#00FFA3');

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
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
      array[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 1.2 + i) * 0.0018;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y += delta * 0.03;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={coords} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.055}
        vertexColors
        transparent
        opacity={0.65}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

export default function RestorationChamber3D({
  demoData,
  demoLoading,
  loadLiveDemo,
  scrollProgress = 0,
}) {
  // ==============================================================
  // STEP 2: INDEPENDENT COMPARISON STATE (SEPARATED FROM SCROLL)
  // ==============================================================
  const [mode, setMode] = useState('split'); // 'split' | 'side-by-side' | 'laser-reveal' | 'inspector'
  const [splitPos, setSplitPos] = useState(50); // 0% to 100%
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Laser Reveal state (independent play/pause & position)
  const [laserPos, setLaserPos] = useState(50);
  const [laserPlaying, setLaserPlaying] = useState(true);

  // Detail Inspector coordinates: normalized [0, 1]
  const [inspectorCoords, setInspectorCoords] = useState({ x: 0.5, y: 0.5 });

  const containerRef = useRef(null);
  const splitViewportRef = useRef(null);

  const originalUrl = demoData?.original_url || '/samples/demo_original_degraded.jpg';
  const restoredUrl = demoData?.restored_url || '/samples/demo_restored_clean.jpg';

  // ==============================================================
  // STEP 4: INTERACTIVE SPLIT DRAGGING (DIRECT INPUT ONLY)
  // ==============================================================
  const handleSplitDrag = useCallback((clientX) => {
    if (!splitViewportRef.current) return;
    const rect = splitViewportRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSplitPos(percent);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onPointerMove = (e) => {
      e.preventDefault();
      handleSplitDrag(e.clientX);
    };
    const onPointerUp = () => setIsDragging(false);

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };
  }, [isDragging, handleSplitDrag]);

  // Keyboard controls for split divider
  const handleKeyDown = (e) => {
    if (mode === 'split') {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setSplitPos((p) => Math.max(0, p - 4));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setSplitPos((p) => Math.min(100, p + 4));
      }
    }
  };

  // ==============================================================
  // STEP 6: LASER REVEAL AUTOMATION (INDEPENDENT PLAY/PAUSE)
  // ==============================================================
  useEffect(() => {
    if (mode !== 'laser-reveal' || !laserPlaying) return;
    let animId;
    let start = performance.now();
    const initialPos = laserPos;

    const sweepLoop = (now) => {
      const elapsed = (now - start) / 1000;
      // Oscillate smoothly across 0% to 100% every 3.5 seconds
      const current = (Math.sin(elapsed * 1.8 - Math.PI / 2) * 0.5 + 0.5) * 100;
      setLaserPos(current);
      animId = requestAnimationFrame(sweepLoop);
    };

    animId = requestAnimationFrame(sweepLoop);
    return () => cancelAnimationFrame(animId);
  }, [mode, laserPlaying]);

  // ==============================================================
  // STEP 7: DETAIL INSPECTOR MOUSE & TOUCH TRACKING
  // ==============================================================
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

  // Zoom and Tools
  const handleZoom = (delta) => {
    setZoomLevel((z) => Math.min(2.5, Math.max(0.75, z + delta)));
  };

  const handleReset = () => {
    setSplitPos(50);
    setZoomLevel(1);
    setLaserPos(50);
    setLaserPlaying(true);
    setInspectorCoords({ x: 0.5, y: 0.5 });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = restoredUrl;
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
      onKeyDown={handleKeyDown}
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 select-none focus:outline-none"
    >
      {/* Main 3D Restoration Chamber Container */}
      <div className="relative w-full rounded-3xl bg-[#0B1117]/90 backdrop-blur-2xl border border-[#22323D] overflow-hidden p-4 sm:p-7 shadow-[0_20px_70px_rgba(0,0,0,0.85)]">
        
        {/* Holographic Scanlines & Corner Laser Guides */}
        <div className="absolute inset-0 scanline-grid opacity-15 pointer-events-none" />
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#00E5FF] z-40 pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#00E5FF] z-40 pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#00FFA3] z-40 pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#00FFA3] z-40 pointer-events-none" />

        {/* Ambient 3D Three.js Backdrop (Non-blocking, pointer-events-none) */}
        <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
          <Canvas
            camera={{ position: [0, 0, 5.0], fov: 45 }}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
            dpr={[1, 1.5]}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.6} />
            <pointLight position={[0, 3, 3]} intensity={1.8} color="#00E5FF" />
            <pointLight position={[0, -3, 2]} intensity={1.2} color="#00FFA3" />
            <ChamberBackgroundStage scrollProgress={scrollProgress} />
            <AmbientChamberParticles count={65} />
          </Canvas>
        </div>

        {/* ============================================================== */}
        {/* TOP HUD: STATUS BAR, MODE SELECTOR & TOOLS                     */}
        {/* ============================================================== */}
        <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#22323D]/80 text-xs font-mono">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="text-[#00E5FF] font-bold tracking-wider">
              3D RESTORATION PORTAL
            </span>
            <span className="hidden sm:inline text-[#94A3B8]">| BIOMETRIC PRESERVATION VERIFIED</span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-[#94A3B8]">
            <span className="px-2.5 py-0.5 rounded bg-[#101820] border border-[#22323D] text-[#00FFA3]">
              ACTIVE MODE: {mode.toUpperCase()}
            </span>
            <span className="hidden sm:inline text-[#DCE7EC]">900 &times; 600 PX</span>
          </div>
        </div>

        {/* Mode Switcher Tabs & Inspection Controls Toolbar */}
        <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* The 4 Independent Comparison Mode Buttons */}
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-[#101820] border border-[#22323D] text-xs font-mono">
            {[
              { id: 'split', label: 'Interactive Split', icon: Sliders },
              { id: 'side-by-side', label: 'Side-by-Side', icon: Columns },
              { id: 'laser-reveal', label: 'Laser Reveal', icon: Scan },
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

          {/* Action Tools: Zoom, Reset, Fullscreen, Download */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleZoom(0.25)}
              title="Zoom In"
              className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00E5FF] border border-[#22323D] hover:border-[#00E5FF]/40 transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-0.25)}
              title="Zoom Out"
              className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00E5FF] border border-[#22323D] hover:border-[#00E5FF]/40 transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              title="Reset Controls"
              className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00FFA3] border border-[#22323D] hover:border-[#00FFA3]/40 transition-colors"
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
        {/* MAIN VISIBLE COMPARISON STAGE (LARGE, PROMINENT & FUNCTIONAL)   */}
        {/* ============================================================== */}
        <div className="relative z-20 w-full min-h-[460px] sm:min-h-[520px] md:min-h-[560px] rounded-2xl overflow-hidden border border-[#22323D] bg-[#050709] flex items-center justify-center p-3 sm:p-5">
          
          {/* MODE 1: INTERACTIVE SPLIT (DRAGGABLE CYAN DIVIDER) */}
          {mode === 'split' && (
            <div
              ref={splitViewportRef}
              className="relative w-full max-w-4xl h-[420px] sm:h-[480px] md:h-[500px] rounded-xl overflow-hidden border border-[#22323D] bg-[#0B1117] flex items-center justify-center cursor-ew-resize select-none"
              style={{ touchAction: 'none' }}
              onPointerDown={(e) => {
                e.stopPropagation();
                setIsDragging(true);
                handleSplitDrag(e.clientX);
              }}
            >
              {/* Layer 1 (Underneath): Restored Digital Asset */}
              <div
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              >
                <img
                  src={restoredUrl}
                  alt="Restored Digital Asset"
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>

              {/* Layer 2 (Clipped Overlay): Original Degraded Document */}
              <div
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{
                  clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)`,
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'center center',
                }}
              >
                <img
                  src={originalUrl}
                  alt="Original Degraded Scan"
                  className="w-full h-full object-contain pointer-events-none"
                />
              </div>

              {/* Draggable Vertical Cyan Divider & Handle */}
              <div
                className="absolute top-0 bottom-0 z-30 flex items-center justify-center pointer-events-none"
                style={{ left: `${splitPos}%`, transform: 'translateX(-50%)' }}
              >
                <div className="w-1 h-full bg-[#00E5FF] shadow-[0_0_18px_#00E5FF]" />
                <div className="absolute w-10 h-10 rounded-full bg-[#101820] border-2 border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.4)] flex items-center justify-center text-[#00E5FF]">
                  <Sliders className="w-4 h-4" />
                </div>
              </div>

              {/* Floating Corner Badges */}
              <div className="absolute top-3 left-3 z-20 px-3 py-1 rounded bg-[#050709]/85 border border-[#FFB547]/40 text-[10px] font-mono text-[#FFB547]">
                ORIGINAL (1987)
              </div>
              <div className="absolute top-3 right-3 z-20 px-3 py-1 rounded bg-[#050709]/85 border border-[#00FFA3]/50 text-[10px] font-mono text-[#00FFA3] font-bold">
                RESTORED (IDRESTORE AI)
              </div>
            </div>
          )}

          {/* MODE 2: SIDE-BY-SIDE (INSTANT DUAL DOCUMENT INSPECTION) */}
          {mode === 'side-by-side' && (
            <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-5 p-2">
              {/* Left Column: Original Degraded */}
              <div className="relative rounded-xl overflow-hidden border border-[#22323D] bg-[#0B1117] h-[380px] sm:h-[440px] flex items-center justify-center">
                <div
                  className="w-full h-full flex items-center justify-center overflow-hidden"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                >
                  <img
                    src={originalUrl}
                    alt="Original Degraded Document"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute top-3 left-3 px-3 py-1 rounded bg-[#050709]/85 border border-[#FFB547]/40 text-[10px] font-mono text-[#FFB547]">
                  ORIGINAL DEGRADED (1987)
                </div>
              </div>

              {/* Right Column: Restored Digital Asset */}
              <div className="relative rounded-xl overflow-hidden border border-[#00FFA3]/50 bg-[#0B1117] h-[380px] sm:h-[440px] flex items-center justify-center shadow-[0_0_25px_rgba(0,255,163,0.15)]">
                <div
                  className="w-full h-full flex items-center justify-center overflow-hidden"
                  style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
                >
                  <img
                    src={restoredUrl}
                    alt="Restored Clean Asset"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="absolute top-3 right-3 px-3 py-1 rounded bg-[#050709]/85 border border-[#00FFA3]/50 text-[10px] font-mono text-[#00FFA3] font-bold">
                  ENHANCED DIGITAL ASSET
                </div>
              </div>
            </div>
          )}

          {/* MODE 3: LASER REVEAL (AUTOMATED / MANUAL SCANNING SWEEP) */}
          {mode === 'laser-reveal' && (
            <div className="w-full max-w-4xl space-y-4">
              <div
                className="relative w-full h-[400px] sm:h-[460px] rounded-xl overflow-hidden border border-[#22323D] bg-[#0B1117] flex items-center justify-center"
                style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
              >
                {/* Original Base Image */}
                <img
                  src={originalUrl}
                  alt="Original Base"
                  className="w-full h-full object-contain pointer-events-none"
                />

                {/* Restored Clipped Image */}
                <div
                  className="absolute inset-0 flex items-center justify-center overflow-hidden"
                  style={{ clipPath: `polygon(0 0, ${laserPos}% 0, ${laserPos}% 100%, 0 100%)` }}
                >
                  <img
                    src={restoredUrl}
                    alt="Restored Overlay"
                    className="w-full h-full object-contain pointer-events-none"
                  />
                </div>

                {/* Laser Sweep Beam */}
                <div
                  className="absolute top-0 bottom-0 w-1 bg-[#00E5FF] shadow-[0_0_20px_#00E5FF] pointer-events-none"
                  style={{ left: `${laserPos}%` }}
                >
                  <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#00FFA3] animate-ping" />
                </div>
              </div>

              {/* Laser Controls: Play/Pause, Scrub Slider, Reset */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#101820] border border-[#22323D] text-xs font-mono">
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

                {/* Manual Scrub Bar */}
                <div className="flex items-center space-x-3 w-full sm:w-64">
                  <span className="text-[#94A3B8] text-[10px]">SWEEP: {laserPos.toFixed(0)}%</span>
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

          {/* MODE 4: DETAIL INSPECTOR (SYNCHRONIZED DUAL MAGNIFICATION) */}
          {mode === 'inspector' && (
            <div className="w-full max-w-5xl space-y-4">
              {/* Dual Paired Magnification Loupes */}
              <div
                onMouseMove={handleInspectorMove}
                onTouchMove={handleInspectorMove}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 cursor-crosshair"
              >
                {/* Left Loupe: Original Degraded */}
                <div className="relative rounded-xl overflow-hidden border border-[#22323D] bg-[#0B1117] h-[340px] sm:h-[380px]">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${originalUrl})`,
                      backgroundPosition: `${inspectorCoords.x * 100}% ${inspectorCoords.y * 100}%`,
                      backgroundSize: `${280 * zoomLevel}%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-[#050709]/85 text-[10px] font-mono text-[#FFB547] border border-[#FFB547]/40">
                    ORIGINAL (2.8&times; LOUPE)
                  </div>
                  {/* Crosshair Guide */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 border border-[#00E5FF]/60 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                    </div>
                  </div>
                </div>

                {/* Right Loupe: Restored Clean */}
                <div className="relative rounded-xl overflow-hidden border border-[#00FFA3]/60 bg-[#0B1117] h-[340px] sm:h-[380px] shadow-[0_0_25px_rgba(0,255,163,0.15)]">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${restoredUrl})`,
                      backgroundPosition: `${inspectorCoords.x * 100}% ${inspectorCoords.y * 100}%`,
                      backgroundSize: `${280 * zoomLevel}%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <div className="absolute top-2 right-2 px-2.5 py-1 rounded bg-[#050709]/85 text-[10px] font-mono text-[#00FFA3] border border-[#00FFA3]/40 font-bold">
                    RESTORED (2.8&times; LOUPE)
                  </div>
                  {/* Crosshair Guide */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-12 border border-[#00FFA3]/70 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-[#00FFA3]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Inspector Coordinate Presets (Non-Hover Accessible Method) */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#101820] border border-[#22323D] text-[11px] font-mono">
                <div className="flex items-center space-x-2 text-[#94A3B8]">
                  <span>COORDINATES:</span>
                  <span className="text-[#00E5FF]">X: {(inspectorCoords.x * 100).toFixed(0)}%</span>
                  <span className="text-[#00FFA3]">Y: {(inspectorCoords.y * 100).toFixed(0)}%</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-[#94A3B8]">PRESET REGIONS:</span>
                  {[
                    { label: 'PORTRAIT FOCUS', x: 0.22, y: 0.35 },
                    { label: 'MICROTEXT FOCUS', x: 0.50, y: 0.50 },
                    { label: 'SIGNATURE & SEAL', x: 0.78, y: 0.82 },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setInspectorCoords({ x: preset.x, y: preset.y })}
                      className="px-2.5 py-1 rounded bg-[#17232C] hover:bg-[#22323D] text-[#DCE7EC] hover:text-[#00FFA3] border border-[#22323D] transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* ============================================================== */}
        {/* BOTTOM QUANTITATIVE VERIFICATION METRICS STRIP                 */}
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
