import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  Columns, 
  SlidersHorizontal, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Download,
  Sparkles,
  FileCheck
} from 'lucide-react';

export default function ComparisonSlider({
  originalUrl,
  restoredUrl,
  originalLabel = "ORIGINAL DEGRADED (1987)",
  restoredLabel = "IDRESTORE ENHANCED (CV + AI)",
  metrics = null,
  downloadName = "restored_document.jpg"
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' or 'side-by-side'
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showScanner, setShowScanner] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });

  const containerRef = useRef(null);
  const imageWrapperRef = useRef(null);
  const baseImgRef = useRef(null);

  const updateImgSize = useCallback(() => {
    if (baseImgRef.current) {
      const rect = baseImgRef.current.getBoundingClientRect();
      setImgSize({
        width: baseImgRef.current.clientWidth,
        height: baseImgRef.current.clientHeight
      });
    }
  }, []);

  useEffect(() => {
    updateImgSize();
    window.addEventListener('resize', updateImgSize);
    return () => window.removeEventListener('resize', updateImgSize);
  }, [updateImgSize, zoomLevel, originalUrl, restoredUrl]);

  // Global mouse & touch dragging handlers
  const updatePosition = useCallback((clientX) => {
    if (!imageWrapperRef.current) return;
    const rect = imageWrapperRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = Math.max(0, Math.min((x / rect.width) * 100, 100));
    setSliderPosition(percent);
  }, []);

  useEffect(() => {
    if (!isDragging) return;

    const onMouseMove = (e) => updatePosition(e.clientX);
    const onMouseUp = () => setIsDragging(false);
    const onTouchMove = (e) => {
      if (e.touches.length > 0) updatePosition(e.touches[0].clientX);
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
  }, [isDragging, updatePosition]);

  const handleZoom = (delta) => {
    setZoomLevel((prev) => Math.min(Math.max(0.75, prev + delta), 2.5));
  };

  const resetControls = () => {
    setSliderPosition(50);
    setZoomLevel(1);
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
    <div className="w-full flex flex-col items-center">
      {/* Control Bar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 mb-3 bg-[#101820]/80 border border-[#22323D] rounded-xl backdrop-blur-md">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setViewMode(viewMode === 'slider' ? 'side-by-side' : 'slider')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
              viewMode === 'slider'
                ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/40'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Interactive Split</span>
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'side-by-side' ? 'slider' : 'side-by-side')}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
              viewMode === 'side-by-side'
                ? 'bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/40'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            onClick={() => setShowScanner(!showScanner)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all ${
              showScanner
                ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/40'
                : 'text-[#94A3B8] hover:text-[#F8FAFC]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Laser Beam</span>
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          <button
            onClick={() => handleZoom(0.25)}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#17232C] transition-all"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[#94A3B8] w-12 text-center">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={() => handleZoom(-0.25)}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#17232C] transition-all"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetControls}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#17232C] transition-all"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#17232C] transition-all"
            title="Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {restoredUrl && (
            <a
              href={restoredUrl}
              download={downloadName}
              className="ml-2 px-3 py-1.5 rounded-lg bg-[#00E5FF] text-black font-semibold text-xs flex items-center gap-1.5 hover:bg-[#33EBFF] transition-all shadow-cyan-glow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </a>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        ref={containerRef}
        className="w-full relative overflow-hidden rounded-2xl bg-[#0B1117] border border-[#22323D] select-none shadow-2xl flex items-center justify-center min-h-[460px] max-h-[640px]"
      >
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 scanline-grid opacity-30 pointer-events-none"></div>

        {viewMode === 'slider' ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            <div 
              ref={imageWrapperRef}
              className="relative inline-block max-w-full max-h-[560px] rounded-lg overflow-hidden border border-[#22323D] shadow-2xl"
              style={{ transform: `scale(${zoomLevel})`, transition: 'transform 0.15s ease-out' }}
            >
              {/* Restored Layer (Bottom) */}
              <img
                ref={baseImgRef}
                src={restoredUrl || originalUrl}
                alt="Enhanced Restored"
                onLoad={updateImgSize}
                onError={(e) => {
                  if (!e.target.src.includes('/samples/demo_restored_clean.jpg')) {
                    e.target.src = '/samples/demo_restored_clean.jpg';
                  }
                }}
                className="block max-h-[540px] max-w-full w-auto object-contain pointer-events-none select-none"
              />

              {/* Original Layer (Top, clipped with pixel-perfect matched width) */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none select-none"
                style={{ width: `${sliderPosition}%` }}
              >
                <img
                  src={originalUrl}
                  alt="Original Degraded"
                  onError={(e) => {
                    if (!e.target.src.includes('/samples/demo_original_degraded.jpg')) {
                      e.target.src = '/samples/demo_original_degraded.jpg';
                    }
                  }}
                  style={{
                    width: imgSize.width > 0 ? `${imgSize.width}px` : '100%',
                    height: imgSize.height > 0 ? `${imgSize.height}px` : '100%',
                    maxWidth: 'none',
                    maxHeight: 'none',
                  }}
                  className="block object-cover pointer-events-none select-none"
                />
              </div>

              {/* Animated Cyan Laser Beam */}
              {showScanner && (
                <div 
                  className="absolute left-0 right-0 h-1 bg-[#00E5FF] shadow-[0_0_15px_#00E5FF] opacity-75 pointer-events-none animate-laser"
                />
              )}

              {/* Vertical Slider Handle */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-[#00E5FF] cursor-ew-resize z-20 shadow-[0_0_12px_#00E5FF]"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onTouchStart={() => setIsDragging(true)}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#050709] border-2 border-[#00E5FF] shadow-cyan-strong flex items-center justify-center cursor-ew-resize">
                  <div className="flex gap-0.5">
                    <span className="w-0.5 h-3 bg-[#00E5FF]"></span>
                    <span className="w-0.5 h-3 bg-[#00FFA3]"></span>
                  </div>
                </div>
              </div>

              {/* Original Badge (Left) */}
              <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded bg-[#050709]/85 border border-[#22323D] text-[10px] font-mono text-[#FFB547] backdrop-blur-md">
                {originalLabel}
              </div>

              {/* Restored Badge (Right) */}
              <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded bg-[#050709]/85 border border-[#00FFA3]/40 text-[10px] font-mono text-[#00FFA3] flex items-center gap-1.5 backdrop-blur-md shadow-mint-glow">
                <FileCheck className="w-3 h-3 text-[#00FFA3]" />
                {restoredLabel}
              </div>
            </div>
          </div>
        ) : (
          /* Side-by-Side Mode */
          <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            <div className="relative rounded-lg overflow-hidden border border-[#22323D] bg-[#050709] flex flex-col items-center justify-center p-2">
              <span className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded bg-[#050709]/85 border border-[#22323D] text-[10px] font-mono text-[#FFB547]">
                {originalLabel}
              </span>
              <img
                src={originalUrl}
                alt="Original Degraded"
                onError={(e) => {
                  if (!e.target.src.includes('/samples/demo_original_degraded.jpg')) {
                    e.target.src = '/samples/demo_original_degraded.jpg';
                  }
                }}
                className="max-h-[500px] w-auto object-contain rounded select-none"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>
            <div className="relative rounded-lg overflow-hidden border border-[#00FFA3]/30 bg-[#050709] flex flex-col items-center justify-center p-2 shadow-mint-glow">
              <span className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded bg-[#050709]/85 border border-[#00FFA3]/40 text-[10px] font-mono text-[#00FFA3] flex items-center gap-1">
                <FileCheck className="w-3 h-3 text-[#00FFA3]" />
                {restoredLabel}
              </span>
              <img
                src={restoredUrl || originalUrl}
                alt="Enhanced Restored"
                onError={(e) => {
                  if (!e.target.src.includes('/samples/demo_restored_clean.jpg')) {
                    e.target.src = '/samples/demo_restored_clean.jpg';
                  }
                }}
                className="max-h-[500px] w-auto object-contain rounded select-none"
                style={{ transform: `scale(${zoomLevel})` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quantitative Metric Delta Strip */}
      {metrics && (
        <div className="w-full mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="px-3.5 py-2.5 rounded-xl bg-[#101820]/90 border border-[#22323D] flex flex-col">
            <span className="text-[10px] font-mono text-[#94A3B8]">SHARPNESS GAIN</span>
            <span className="text-base font-mono font-bold text-[#00FFA3]">
              +{metrics.sharpness_gain_percent || 0}%
            </span>
          </div>
          <div className="px-3.5 py-2.5 rounded-xl bg-[#101820]/90 border border-[#22323D] flex flex-col">
            <span className="text-[10px] font-mono text-[#94A3B8]">PROCESSING TIME</span>
            <span className="text-base font-mono font-bold text-[#00E5FF]">
              {metrics.processing_time_ms || 0} ms
            </span>
          </div>
          <div className="px-3.5 py-2.5 rounded-xl bg-[#101820]/90 border border-[#22323D] flex flex-col">
            <span className="text-[10px] font-mono text-[#94A3B8]">ESTIMATED NOISE</span>
            <span className="text-base font-mono font-bold text-[#DCE7EC]">
              {metrics.noise_before || 0} &rarr; {metrics.noise_after || 0}
            </span>
          </div>
          <div className="px-3.5 py-2.5 rounded-xl bg-[#101820]/90 border border-[#22323D] flex flex-col">
            <span className="text-[10px] font-mono text-[#94A3B8]">DYNAMIC CONTRAST</span>
            <span className="text-base font-mono font-bold text-[#00E5FF]">
              {metrics.contrast_before || 0} &rarr; {metrics.contrast_after || 0}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
