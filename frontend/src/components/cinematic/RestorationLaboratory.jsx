import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UploadCloud,
  Cpu,
  Wand2,
  FileCheck,
  Download,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Activity,
  Layers,
  Sparkles,
  Maximize2
} from 'lucide-react';

const STAGES = [
  {
    num: '01',
    title: 'Upload Document',
    tag: 'SECURE INGESTION',
    desc: 'Securely import degraded historical employee records for analysis and restoration. Supports TIFF, JPEG, PNG, and PDF archives.',
    badge: 'STAGE 01 • DOCUMENT RECOGNITION',
    accent: '#00E5FF'
  },
  {
    num: '02',
    title: 'Gemini AI Analysis',
    tag: 'MULTIMODAL VISION',
    desc: 'Multimodal vision evaluation pinpoints degradation types: optical defocus blur, sensor grain noise, paper yellowing, and ink fading.',
    badge: 'STAGE 02 • MULTIMODAL SPECTRAL SCAN (DEMONSTRATION)',
    accent: '#00FFA3'
  },
  {
    num: '03',
    title: 'Intelligent Restoration',
    tag: 'OPENCV PIPELINE',
    desc: 'Deterministic pixel-level reconstruction: LAB color-space CLAHE contrast recovery, Bilateral edge-preserving denoising, and unsharp masking.',
    badge: 'STAGE 03 • DETERMINISTIC CV RECONSTRUCTION',
    accent: '#00E5FF'
  },
  {
    num: '04',
    title: 'Quality Evaluation',
    tag: 'MATHEMATICAL AUDIT',
    desc: 'Mathematical delta calculation verifies sharpness (Laplacian variance), contrast gain, SSIM (0.774), and PSNR (12.09 dB) objective metrics.',
    badge: 'STAGE 04 • QUANTITATIVE DELTA VERIFICATION',
    accent: '#00FFA3'
  },
  {
    num: '05',
    title: 'Export Enhanced Document',
    tag: 'ENTERPRISE ARCHIVE',
    desc: 'Export restored high-resolution document alongside PDF audit certificate and cryptographic provenance record for HRMS migration.',
    badge: 'STAGE 05 • AUDIT PACKAGING & MIGRATION READY',
    accent: '#00E5FF'
  }
];

export default function RestorationLaboratory({ onLaunchWorkspace, scrollProgress = 0 }) {
  const [activeStage, setActiveStage] = useState(0);
  const containerRef = useRef(null);

  // Synchronize stage from scroll progress or allow interactive override
  useEffect(() => {
    // When scrollProgress is between 0 and 1, map smoothly to 5 stages
    if (scrollProgress > 0.05 && scrollProgress < 0.95) {
      const computedStage = Math.min(4, Math.max(0, Math.floor(scrollProgress * 5)));
      setActiveStage(computedStage);
    }
  }, [scrollProgress]);

  // Keyboard navigation
  const handleKeyDown = useCallback((e) => {
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
  }, []);

  const currentStageInfo = STAGES[activeStage];

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="3D Restoration Laboratory"
      onKeyDown={handleKeyDown}
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 focus:outline-none select-none"
    >
      {/* 1. Laboratory Chamber Viewport */}
      <div className="relative w-full min-h-[520px] lg:min-h-[580px] rounded-3xl bg-[#0B1117]/80 backdrop-blur-xl border border-[#22323D] overflow-hidden p-6 sm:p-8 flex flex-col justify-between shadow-[0_12px_48px_rgba(0,0,0,0.7)]">
        
        {/* Futuristic Background Scanning Grid & Circular Stage Pedestal */}
        <div className="absolute inset-0 scanline-grid opacity-20 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[360px] rounded-full border border-[#00E5FF]/20 bg-gradient-radial from-[#00E5FF]/5 via-transparent to-transparent pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[240px] rounded-full border border-[#00FFA3]/15 pointer-events-none" />

        {/* Top Chamber Telemetry Header */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-4 border-b border-[#22323D]/60 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="text-xs font-mono tracking-widest text-[#00E5FF] font-bold">
              {currentStageInfo.badge}
            </span>
          </div>

          <div className="flex items-center space-x-4 text-[11px] font-mono text-[#94A3B8]">
            <span className="hidden sm:inline">OPTICAL ENCLAVE: SECURE</span>
            <span className="px-2 py-0.5 rounded bg-[#17232C] text-[#00FFA3] border border-[#00FFA3]/30">
              SYNTHETIC BENCHMARK #1987
            </span>
          </div>
        </div>

        {/* Center 3D Document Restoration Stage */}
        <div className="relative z-10 my-8 flex items-center justify-center">
          <div className="relative w-full max-w-2xl min-h-[300px] sm:min-h-[340px] flex items-center justify-center">
            
            {/* STAGE 1: UPLOAD DOCUMENT */}
            {activeStage === 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.88, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.5 }}
                className="relative max-w-md w-full p-4 rounded-2xl bg-[#101820]/90 border border-[#00E5FF]/40 shadow-cyan-strong text-center"
              >
                {/* Holographic alignment brackets */}
                <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-[#00E5FF]" />
                <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#00E5FF]" />
                <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#00FFA3]" />
                <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-[#00FFA3]" />

                <div className="relative overflow-hidden rounded-xl border border-[#22323D] mb-4">
                  <img
                    src="/samples/demo_original_degraded.jpg"
                    alt="Degraded historical employee record"
                    className="w-full h-48 sm:h-56 object-cover filter contrast-90 sepia-[0.35]"
                  />
                  <div className="absolute inset-0 bg-[#050709]/30" />
                  <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-[#050709]/80 text-[10px] font-mono text-[#FFB547] border border-[#FFB547]/40">
                    DEGRADATION DETECTED: SEPIA / GRAIN / DEFOCUS
                  </div>
                </div>

                <div className="flex items-center justify-center space-x-2 text-xs font-mono text-[#00E5FF]">
                  <UploadCloud className="w-4 h-4 animate-bounce" />
                  <span>DOCUMENT INGESTED • ALIGNING RETINAL PLANE</span>
                </div>
              </motion.div>
            )}

            {/* STAGE 2: GEMINI AI ANALYSIS */}
            {activeStage === 1 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative max-w-lg w-full p-4 rounded-2xl bg-[#101820]/90 border border-[#00FFA3]/50 shadow-[0_0_30px_rgba(0,255,163,0.2)]"
              >
                <div className="relative overflow-hidden rounded-xl border border-[#22323D]">
                  <img
                    src="/samples/demo_original_degraded.jpg"
                    alt="Gemini AI Analysis Scanning"
                    className="w-full h-48 sm:h-56 object-cover"
                  />

                  {/* Laser Sweeping Scan Line */}
                  <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#00FFA3] to-transparent shadow-[0_0_15px_#00FFA3] animate-laser" />

                  {/* Holographic Bounding Boxes */}
                  <div className="absolute top-4 left-6 w-32 h-14 border border-[#00E5FF] bg-[#00E5FF]/10 rounded flex flex-col justify-between p-1 text-[9px] font-mono text-[#00E5FF]">
                    <span>DEFOCUS BLUR σ: 1.8</span>
                    <span className="text-[8px] opacity-75">CONFIDENCE: 99.4%</span>
                  </div>

                  <div className="absolute bottom-6 right-6 w-36 h-12 border border-[#FFB547] bg-[#FFB547]/10 rounded flex flex-col justify-between p-1 text-[9px] font-mono text-[#FFB547]">
                    <span>INK FADING / SEPIA</span>
                    <span className="text-[8px] opacity-75">LAB ADAPTIVE TARGET</span>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#00FFA3] flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4" />
                    <span>GEMINI MULTIMODAL SPECTRAL AUDIT</span>
                  </span>
                  <span className="text-[#94A3B8] text-[10px]">DEMONSTRATION TELEMETRY</span>
                </div>
              </motion.div>
            )}

            {/* STAGE 3: INTELLIGENT RESTORATION */}
            {activeStage === 2 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative max-w-lg w-full p-4 rounded-2xl bg-[#101820]/90 border border-[#00E5FF]/60 shadow-cyan-strong"
              >
                <div className="relative overflow-hidden rounded-xl border border-[#22323D] h-48 sm:h-56">
                  {/* Underneath: Original degraded scan */}
                  <img
                    src="/samples/demo_original_degraded.jpg"
                    alt="Original Degraded"
                    className="absolute inset-0 w-full h-full object-cover filter sepia-[0.3]"
                  />

                  {/* Overlaid: Restored image with dynamic 50% split reveal */}
                  <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ clipPath: 'polygon(0 0, 62% 0, 52% 100%, 0 100%)' }}
                  >
                    <img
                      src="/samples/demo_restored_clean.jpg"
                      alt="Restored Asset"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Moving Cyan Reconstruction Dividing Beam */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-[#00E5FF] shadow-[0_0_16px_#00E5FF]"
                    style={{ left: '57%', transform: 'rotate(-5deg) scaleY(1.2)' }}
                  />

                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-[#050709]/80 text-[10px] font-mono text-[#00FFA3] border border-[#00FFA3]/40">
                    OPENCV CLAHE + BILATERAL RESTORING
                  </div>
                  <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-[#050709]/80 text-[10px] font-mono text-[#00E5FF] border border-[#00E5FF]/40">
                    PIXEL RECONSTRUCTION ACTIVE
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs font-mono">
                  <span className="text-[#00E5FF] flex items-center space-x-1.5">
                    <Wand2 className="w-4 h-4" />
                    <span>DETERMINISTIC NOISE & CONTRAST INVERSION</span>
                  </span>
                  <span className="text-[#00FFA3] text-[10px]">TIME: ~254 ms</span>
                </div>
              </motion.div>
            )}

            {/* STAGE 4: QUALITY EVALUATION */}
            {activeStage === 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative w-full max-w-xl p-4 rounded-2xl bg-[#101820]/90 border border-[#00FFA3]/50 shadow-[0_0_30px_rgba(0,255,163,0.2)]"
              >
                {/* Dual Floating Split Panels */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="relative rounded-xl overflow-hidden border border-[#22323D]">
                    <img
                      src="/samples/demo_original_degraded.jpg"
                      alt="Original 1987"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded bg-[#050709]/80 text-[9px] font-mono text-[#94A3B8]">
                      BEFORE: 1,953 VAR
                    </div>
                  </div>

                  <div className="relative rounded-xl overflow-hidden border border-[#00FFA3]/60 shadow-[0_0_15px_rgba(0,255,163,0.2)]">
                    <img
                      src="/samples/demo_restored_clean.jpg"
                      alt="Restored 2026"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute bottom-1.5 right-1.5 px-2 py-0.5 rounded bg-[#050709]/80 text-[9px] font-mono text-[#00FFA3] font-bold">
                      AFTER: 5,116 VAR (+161%)
                    </div>
                  </div>
                </div>

                {/* Mathematical Verified Measurements */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                  <div className="p-2 rounded-lg bg-[#17232C] border border-[#22323D]">
                    <div className="text-[10px] text-[#94A3B8]">SHARPNESS GAIN</div>
                    <div className="text-sm font-bold text-[#00FFA3]">+161.9%</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#17232C] border border-[#22323D]">
                    <div className="text-[10px] text-[#94A3B8]">STRUCTURAL SSIM</div>
                    <div className="text-sm font-bold text-[#00E5FF]">0.774</div>
                  </div>
                  <div className="p-2 rounded-lg bg-[#17232C] border border-[#22323D]">
                    <div className="text-[10px] text-[#94A3B8]">FIDELITY PSNR</div>
                    <div className="text-sm font-bold text-[#DCE7EC]">12.09 dB</div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STAGE 5: EXPORT ENHANCED DOCUMENT */}
            {activeStage === 4 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
                className="relative max-w-md w-full p-6 rounded-2xl bg-[#101820]/95 border border-[#00E5FF] shadow-[0_0_40px_rgba(0,229,255,0.3)] text-center"
              >
                <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-[#00E5FF]/10 border border-[#00E5FF] flex items-center justify-center text-[#00E5FF] shadow-cyan-glow">
                  <ShieldCheck className="w-8 h-8" />
                </div>

                <h4 className="text-lg font-bold font-sans text-[#F8FAFC] mb-1">
                  DIGITAL ASSET ARCHIVED
                </h4>
                <p className="text-xs font-mono text-[#94A3B8] mb-5">
                  SHA-256 Provenance Ledger Signed &bull; Ready for Migration
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => onLaunchWorkspace('restore')}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl font-mono text-xs font-bold bg-[#00E5FF] text-black hover:bg-[#33EBFF] transition-all flex items-center justify-center space-x-2 shadow-cyan-strong active:scale-95"
                  >
                    <span>OPEN RESTORATION WORKSPACE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

          </div>
        </div>

        {/* Bottom Information & Interactive 5-Stage Stepper Controls */}
        <div className="relative z-20 space-y-5 pt-4 border-t border-[#22323D]/60">
          {/* Active Stage Explanatory Prose Panel */}
          <div className="max-w-2xl mx-auto text-center">
            <h3 className="text-xl font-bold font-sans text-[#F8FAFC] mb-1 flex items-center justify-center space-x-2">
              <span className="text-[#00E5FF] font-mono text-lg">{currentStageInfo.num}.</span>
              <span>{currentStageInfo.title}</span>
            </h3>
            <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
              {currentStageInfo.desc}
            </p>
          </div>

          {/* 5 Selectable Stage Indicator Strip */}
          <div className="flex items-center justify-center gap-2 sm:gap-3">
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

          {/* Keyboard & Scroll Guide Pill */}
          <div className="text-center text-[10px] font-mono text-[#94A3B8]/80">
            USE [← / →] ARROW KEYS OR CLICK STAGES 01–05 TO EXPLORE THE PIPELINE
          </div>
        </div>

      </div>
    </div>
  );
}
