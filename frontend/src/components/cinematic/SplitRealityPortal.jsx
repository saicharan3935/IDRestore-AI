import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Sliders,
  Columns,
  Scan,
  Search,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
  Crosshair
} from 'lucide-react';

export default function SplitRealityPortal({
  originalUrl = '/samples/demo_original_degraded.jpg',
  restoredUrl = '/samples/demo_restored_clean.jpg',
  originalLabel = 'ORIGINAL DEGRADED (1987 ARCHIVE)',
  restoredLabel = 'ENHANCED DIGITAL ASSET (IDRESTORE AI)',
  metrics = null,
  downloadName = 'restored_personnel_record.jpg',
  scrollProgress = 0,
}) {
  // 4 Working Comparison Modes: 'split' | 'side-by-side' | 'laser-reveal' | 'inspector'
  const [mode, setMode] = useState('split');
  const [splitPos, setSplitPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Detail Inspector coordinates: normalized [0, 1] across image
  const [inspectorCoords, setInspectorCoords] = useState({ x: 0.5, y: 0.5 });
  const [inspectorActive, setInspectorActive] = useState(false);

  // Laser reveal animation progress [0, 100]
  const [laserPos, setLaserPos] = useState(50);

  const containerRef = useRef(null);
  const imageFrameRef = useRef(null);

  // Global Dragging handler for Interactive Split
  const handleDrag = useCallback((clientX) => {
    if (!imageFrameRef.current) return;
    const rect = imageFrameRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSplitPos(percent);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => handleDrag(e.clientX);
    const onMouseUp = () => setIsDragging(false);
    const onTouchMove = (e) => {
      if (e.touches.length > 0) handleDrag(e.touches[0].clientX);
    };
    const onTouchEnd = () => setIsDragging(false);

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove);
    window.addEventListener('touchend', onTouchEnd);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [isDragging, handleDrag]);

  // Laser Reveal Auto-Sweep loop
  useEffect(() => {
    if (mode !== 'laser-reveal') return;
    let animId;
    let start = performance.now();

    const animateLaser = (time) => {
      const elapsed = (time - start) / 1000;
      // 0 to 100 back and forth in 4 seconds
      const pos = (Math.sin(elapsed * 1.5) * 0.5 + 0.5) * 100;
      setLaserPos(pos);
      animId = requestAnimationFrame(animateLaser);
    };

    animId = requestAnimationFrame(animateLaser);
    return () => cancelAnimationFrame(animId);
  }, [mode]);

  // Synchronized Detail Inspector mouse/touch tracking
  const handleInspectorMove = (e) => {
    if (mode !== 'inspector' && !inspectorActive) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    setInspectorCoords({ x: normX, y: normY });
  };

  const handleZoom = (delta) => {
    setZoomLevel((prev) => Math.min(Math.max(0.75, prev + delta), 2.5));
  };

  const resetAll = () => {
    setSplitPos(50);
    setZoomLevel(1);
    setInspectorCoords({ x: 0.5, y: 0.5 });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = restoredUrl;
    link.download = downloadName;
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
      className="relative w-full max-w-6xl mx-auto rounded-3xl bg-[#0B1117]/85 backdrop-blur-xl border border-[#22323D] overflow-hidden p-4 sm:p-7 shadow-[0_16px_64px_rgba(0,0,0,0.8)] select-none text-left"
    >
      {/* 1. Holographic Stacking Grid & Caliper Accents */}
      <div className="absolute inset-0 scanline-grid opacity-15 pointer-events-none" />
      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#00E5FF] z-30 pointer-events-none" />
      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#00E5FF] z-30 pointer-events-none" />
      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#00FFA3] z-30 pointer-events-none" />
      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#00FFA3] z-30 pointer-events-none" />

      {/* 2. Top Header HUD: Mode Switcher & Tools Bar */}
      <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 pb-4 mb-4 border-b border-[#22323D]/70 text-xs font-mono">
        {/* Mode Selector Tabs (All 4 Functional Modes) */}
        <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-[#101820] border border-[#22323D]">
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
                className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all focus:outline-none ${
                  isActive
                    ? 'bg-[#17232C] text-[#00E5FF] border border-[#00E5FF]/40 shadow-[0_0_12px_rgba(0,229,255,0.25)] font-bold'
                    : 'text-[#94A3B8] hover:text-[#DCE7EC] hover:bg-[#17232C]/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{m.label}</span>
              </button>
            );
          })}
        </div>

        {/* Action Tools: Zoom In/Out, Reset, Fullscreen, Download */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleZoom(0.25)}
            title="Zoom In"
            className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00E5FF] border border-[#22323D] hover:border-[#00E5FF]/40"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.25)}
            title="Zoom Out"
            className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00E5FF] border border-[#22323D] hover:border-[#00E5FF]/40"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetAll}
            title="Reset Controls"
            className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00FFA3] border border-[#22323D] hover:border-[#00FFA3]/40"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00E5FF] border border-[#22323D]"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={handleDownload}
            className="px-3.5 py-1.5 rounded-lg bg-[#00E5FF] text-black font-bold font-mono hover:bg-[#33EBFF] transition-all flex items-center space-x-1.5 shadow-cyan-glow"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">DOWNLOAD</span>
          </button>
        </div>
      </div>

      {/* 3. Main Comparison Viewport */}
      <div
        ref={imageFrameRef}
        className="relative w-full rounded-2xl overflow-hidden border border-[#22323D] bg-[#050709] min-h-[360px] sm:min-h-[460px] flex items-center justify-center select-none"
        style={{ touchAction: mode === 'split' ? 'none' : 'auto' }}
      >
        {/* MODE 1: INTERACTIVE SPLIT */}
        {mode === 'split' && (
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            {/* Background: Restored image */}
            <img
              src={restoredUrl}
              alt={restoredLabel}
              className="w-full h-auto max-h-[580px] object-contain pointer-events-none"
            />

            {/* Foreground: Original image clipped to splitPos */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)` }}
            >
              <img
                src={originalUrl}
                alt={originalLabel}
                className="w-full h-auto max-h-[580px] object-contain pointer-events-none"
              />
            </div>

            {/* Cyan Dividing Beam & Circular Handle */}
            <div
              className="absolute top-0 bottom-0 z-30 cursor-ew-resize flex items-center justify-center"
              style={{ left: `${splitPos}%`, transform: 'translateX(-50%)' }}
              onPointerDown={(e) => {
                setIsDragging(true);
                handleDrag(e.clientX);
              }}
            >
              <div className="w-0.5 h-full bg-[#00E5FF] shadow-[0_0_12px_#00E5FF]" />
              <div className="absolute w-8 h-8 rounded-full bg-[#101820] border-2 border-[#00E5FF] shadow-cyan-strong flex items-center justify-center text-[#00E5FF] hover:scale-110 transition-transform">
                <Sliders className="w-4 h-4" />
              </div>
            </div>

            {/* Corner Labels */}
            <div className="absolute top-3 left-3 z-20 px-2.5 py-1 rounded-md bg-[#050709]/80 border border-[#22323D] text-[10px] font-mono text-[#FFB547]">
              {originalLabel}
            </div>
            <div className="absolute top-3 right-3 z-20 px-2.5 py-1 rounded-md bg-[#050709]/80 border border-[#00FFA3]/40 text-[10px] font-mono text-[#00FFA3] font-bold">
              {restoredLabel}
            </div>
          </div>
        )}

        {/* MODE 2: SIDE-BY-SIDE */}
        {mode === 'side-by-side' && (
          <div
            className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            {/* Left Column: Original */}
            <div className="relative rounded-xl overflow-hidden border border-[#22323D] bg-[#0B1117]">
              <img src={originalUrl} alt={originalLabel} className="w-full h-auto object-contain" />
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-[#050709]/85 text-[10px] font-mono text-[#FFB547] border border-[#FFB547]/30">
                {originalLabel}
              </div>
            </div>

            {/* Right Column: Restored */}
            <div className="relative rounded-xl overflow-hidden border border-[#00FFA3]/50 bg-[#0B1117] shadow-[0_0_20px_rgba(0,255,163,0.15)]">
              <img src={restoredUrl} alt={restoredLabel} className="w-full h-auto object-contain" />
              <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-[#050709]/85 text-[10px] font-mono text-[#00FFA3] border border-[#00FFA3]/40 font-bold">
                {restoredLabel}
              </div>
            </div>
          </div>
        )}

        {/* MODE 3: LASER REVEAL */}
        {mode === 'laser-reveal' && (
          <div
            className="relative w-full h-full flex items-center justify-center overflow-hidden"
            style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'center center' }}
          >
            {/* Base Image: Degraded */}
            <img src={originalUrl} alt={originalLabel} className="w-full h-auto max-h-[580px] object-contain pointer-events-none" />

            {/* Revealed Restored Layer */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `polygon(0 0, ${laserPos}% 0, ${laserPos}% 100%, 0 100%)` }}
            >
              <img src={restoredUrl} alt={restoredLabel} className="w-full h-auto max-h-[580px] object-contain pointer-events-none" />
            </div>

            {/* Glowing Laser Sweep Beam */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-[#00E5FF] shadow-[0_0_20px_#00E5FF] pointer-events-none"
              style={{ left: `${laserPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#00FFA3] animate-ping" />
            </div>

            <div className="absolute bottom-3 inset-x-0 text-center z-20 pointer-events-none">
              <span className="px-3 py-1 rounded-full bg-[#050709]/85 border border-[#00E5FF]/40 text-[10px] font-mono text-[#00E5FF]">
                CONTINUOUS OPTICAL SWEEP ACTIVE &bull; {laserPos.toFixed(0)}% REVEAL
              </span>
            </div>
          </div>
        )}

        {/* MODE 4: DETAIL INSPECTOR (SYNCHRONIZED DUAL MAGNIFICATION) */}
        {mode === 'inspector' && (
          <div className="w-full p-4 space-y-4">
            {/* Split Inspection Viewports */}
            <div
              onMouseMove={handleInspectorMove}
              onTouchMove={handleInspectorMove}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 cursor-crosshair"
            >
              {/* Left Panel: Original with Crosshair Loupe */}
              <div className="relative rounded-xl overflow-hidden border border-[#22323D] bg-[#0B1117] h-[280px] sm:h-[320px]">
                {/* Scaled/Zoomed Image Centered on inspectorCoords */}
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${originalUrl})`,
                    backgroundPosition: `${inspectorCoords.x * 100}% ${inspectorCoords.y * 100}%`,
                    backgroundSize: `${260 * zoomLevel}%`,
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded bg-[#050709]/85 text-[10px] font-mono text-[#FFB547] border border-[#FFB547]/40">
                  {originalLabel} (2.6&times; LOUPE)
                </div>
                {/* Target Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 border border-[#00E5FF]/70 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
                  </div>
                </div>
              </div>

              {/* Right Panel: Restored with Synchronized Crosshair Loupe */}
              <div className="relative rounded-xl overflow-hidden border border-[#00FFA3]/60 bg-[#0B1117] h-[280px] sm:h-[320px] shadow-[0_0_20px_rgba(0,255,163,0.15)]">
                {/* Scaled/Zoomed Image Centered on matching inspectorCoords */}
                <div
                  className="w-full h-full"
                  style={{
                    backgroundImage: `url(${restoredUrl})`,
                    backgroundPosition: `${inspectorCoords.x * 100}% ${inspectorCoords.y * 100}%`,
                    backgroundSize: `${260 * zoomLevel}%`,
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <div className="absolute top-2 right-2 px-2.5 py-1 rounded bg-[#050709]/85 text-[10px] font-mono text-[#00FFA3] border border-[#00FFA3]/40 font-bold">
                  {restoredLabel} (2.6&times; LOUPE)
                </div>
                {/* Target Crosshair */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-10 h-10 border border-[#00FFA3]/80 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00FFA3]" />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Coordinate Presets (Accessible Non-Hover Method) */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 text-[11px] font-mono">
              <div className="flex items-center space-x-2 text-[#94A3B8]">
                <span>COORDINATES:</span>
                <span className="text-[#00E5FF]">X: {(inspectorCoords.x * 100).toFixed(1)}%</span>
                <span className="text-[#00FFA3]">Y: {(inspectorCoords.y * 100).toFixed(1)}%</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-[#94A3B8]">PRESET TARGETS:</span>
                {[
                  { label: 'HEADSHOT PORTRAIT', x: 0.22, y: 0.35 },
                  { label: 'CENTER MICROTEXT', x: 0.50, y: 0.50 },
                  { label: 'SEAL / SIGNATURE', x: 0.78, y: 0.82 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setInspectorCoords({ x: preset.x, y: preset.y })}
                    className="px-2 py-0.5 rounded bg-[#101820] hover:bg-[#17232C] text-[#DCE7EC] hover:text-[#00FFA3] border border-[#22323D] text-[10px]"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Metrics & Verification Bar */}
      {metrics && (
        <div className="relative z-20 mt-4 pt-4 border-t border-[#22323D]/60 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center font-mono">
          <div className="p-2.5 rounded-xl bg-[#101820] border border-[#22323D]">
            <div className="text-[10px] text-[#94A3B8]">SHARPNESS GAIN</div>
            <div className="text-sm font-bold text-[#00FFA3]">+{metrics.sharpness_gain_percent || 161.9}%</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#101820] border border-[#22323D]">
            <div className="text-[10px] text-[#94A3B8]">STRUCTURAL SSIM</div>
            <div className="text-sm font-bold text-[#00E5FF]">{metrics.ssim || 0.7736}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#101820] border border-[#22323D]">
            <div className="text-[10px] text-[#94A3B8]">FIDELITY PSNR</div>
            <div className="text-sm font-bold text-[#DCE7EC]">{metrics.psnr_db || 12.09} dB</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#101820] border border-[#22323D]">
            <div className="text-[10px] text-[#94A3B8]">EXECUTION TIME</div>
            <div className="text-sm font-bold text-[#00FFA3]">{metrics.processing_time_ms || 254.2} ms</div>
          </div>
        </div>
      )}
    </div>
  );
}
