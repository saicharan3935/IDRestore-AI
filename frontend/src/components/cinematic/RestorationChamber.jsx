import React, { useState, useEffect, useRef } from 'react';
import ComparisonSlider from '../ComparisonSlider';
import {
  Sparkles,
  Maximize2,
  Scan,
  ShieldCheck,
  CheckCircle,
  RefreshCw,
  Sliders,
  Layers
} from 'lucide-react';

export default function RestorationChamber({
  demoData,
  demoLoading,
  loadLiveDemo,
  scrollProgress = 0,
}) {
  const [chamberLaserActive, setChamberLaserActive] = useState(false);
  const containerRef = useRef(null);

  // Trigger brief holographic optical sweep when user scrolls into the chamber
  useEffect(() => {
    if (scrollProgress > 0.15 && scrollProgress < 0.45) {
      setChamberLaserActive(true);
    } else {
      setChamberLaserActive(false);
    }
  }, [scrollProgress]);

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-6xl mx-auto rounded-3xl bg-[#0B1117]/85 backdrop-blur-xl border border-[#22323D] overflow-hidden p-4 sm:p-7 shadow-[0_16px_64px_rgba(0,0,0,0.8)]"
    >
      {/* 1. Holographic Chamber Scanlines & Corner Brackets */}
      <div className="absolute inset-0 scanline-grid opacity-15 pointer-events-none" />
      <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#00E5FF] z-20 pointer-events-none" />
      <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#00E5FF] z-20 pointer-events-none" />
      <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#00FFA3] z-20 pointer-events-none" />
      <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#00FFA3] z-20 pointer-events-none" />

      {/* 2. Top Holographic Chamber Telemetry Bar */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-[#22323D]/70 text-xs font-mono">
        <div className="flex items-center space-x-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00FFA3] animate-pulse" />
          <span className="text-[#00E5FF] font-bold tracking-wider">
            OPTICAL RESTORATION CHAMBER #01
          </span>
          <span className="hidden sm:inline text-[#94A3B8]">| BIOMETRIC PRESERVATION VERIFIED</span>
        </div>

        <div className="flex items-center space-x-3 text-[11px] text-[#94A3B8]">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-[#101820] border border-[#22323D]">
            <Scan className="w-3.5 h-3.5 text-[#00E5FF]" />
            <span>INTERACTIVE SCANNER BEAM</span>
          </div>
          <span className="text-[#00FFA3]">900 &times; 600 PX</span>
        </div>
      </div>

      {/* 3. Real Interactive Comparison Slider Presentation */}
      <div className="relative z-10 w-full">
        {/* Holographic Laser Sweep Effect (Active on scroll enter) */}
        {chamberLaserActive && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent shadow-[0_0_20px_#00E5FF] animate-laser z-30 pointer-events-none" />
        )}

        {demoData ? (
          <ComparisonSlider
            originalUrl={demoData.original_url}
            restoredUrl={demoData.restored_url}
            originalLabel="ORIGINAL DEGRADED (1987 ARCHIVE)"
            restoredLabel="RESTORED DIGITAL ASSET (IDRESTORE AI)"
            metrics={demoData.metrics}
            downloadName="Restored_Employee_Record_1987.jpg"
          />
        ) : (
          <div className="w-full h-96 rounded-2xl bg-[#101820]/80 backdrop-blur-md border border-[#22323D] flex flex-col items-center justify-center space-y-4 font-mono text-sm text-[#94A3B8]">
            {demoLoading ? (
              <div className="flex items-center space-x-2 text-[#00E5FF]">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Calibrating chamber optics and benchmark files...</span>
              </div>
            ) : (
              <>
                <span>Benchmark demonstration data unavailable.</span>
                <button
                  onClick={loadLiveDemo}
                  className="px-4 py-2 rounded-lg bg-[#17232C] hover:bg-[#22323D] border border-[#00E5FF]/40 text-xs font-mono text-[#00E5FF] flex items-center space-x-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry Connection</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* 4. Bottom Chamber Guidance & Verification Strip */}
      <div className="relative z-10 mt-5 pt-3 border-t border-[#22323D]/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#94A3B8]">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#00FFA3]" />
          <span>ZERO FACIAL SYNTHESIS HALLUCINATION &bull; STRICT REVERSIBLE CV FILTERS</span>
        </div>
        <div className="text-[#00E5FF]">
          DRAG CYAN DIVIDER HORIZONTALLY TO COMPARE RESTORATION
        </div>
      </div>
    </div>
  );
}
