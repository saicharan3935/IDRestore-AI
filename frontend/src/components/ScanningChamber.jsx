import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Eye, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export default function ScanningChamber({
  imageUrl,
  currentStage = 'ANALYZING', // 'SCANNING', 'ANALYZING', 'ENHANCING', 'VERIFYING', 'COMPLETED'
  stageText = 'Evaluating Optical Degradation Patterns...',
  detectedIssues = [],
  activeOperations = []
}) {
  const stages = [
    { id: 'SCANNING', label: '01 Chamber Ingestion', icon: Eye },
    { id: 'ANALYZING', label: '02 AI Damage Intelligence', icon: Cpu },
    { id: 'ENHANCING', label: '03 Pixel Restoration', icon: Sparkles },
    { id: 'VERIFYING', label: '04 Metric Audit', icon: ShieldCheck },
    { id: 'COMPLETED', label: '05 Artifact Ready', icon: CheckCircle2 }
  ];

  return (
    <div className="relative w-full max-w-4xl mx-auto rounded-2xl bg-[#0B1117] border border-[#00E5FF]/30 p-6 shadow-cyan-strong overflow-hidden">
      {/* Chamber Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#22323D] mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00E5FF] animate-ping" />
          <span className="font-mono text-xs uppercase tracking-widest text-[#00E5FF] font-bold">
            NEURAL SCANNING CHAMBER &bull; ACTIVE RECONSTRUCTION
          </span>
        </div>
        <div className="text-xs font-mono text-[#00FFA3] flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00FFA3]" />
          TELEMETRY SYNCHRONIZED
        </div>
      </div>

      {/* Main Chamber Stage View */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Document In Chamber with Laser Sweep */}
        <div className="md:col-span-7 relative rounded-xl overflow-hidden border border-[#00E5FF]/40 bg-[#050709] flex items-center justify-center min-h-[320px]">
          {/* Futuristic Corner Reticles */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#00E5FF] z-20" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#00E5FF] z-20" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#00E5FF] z-20" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#00E5FF] z-20" />

          {/* Document Preview */}
          <img
            src={imageUrl}
            alt="Scanning target"
            className="max-h-[300px] w-auto object-contain opacity-85 select-none"
          />

          {/* Sweeping Cyan Scanning Laser */}
          <div className="absolute inset-0 pointer-events-none">
            <motion.div
              initial={{ top: '0%' }}
              animate={{ top: ['0%', '100%', '0%'] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute left-0 right-0 h-1 bg-[#00E5FF] shadow-[0_0_20px_#00E5FF]"
            >
              <div className="absolute -top-6 left-4 text-[9px] font-mono text-[#00E5FF] font-bold">
                SPECTRAL SCAN ACTIVE &bull; SIGMA 2.1
              </div>
            </motion.div>
          </div>

          {/* Holographic Grid overlay */}
          <div className="absolute inset-0 scanline-grid opacity-25 pointer-events-none" />
        </div>

        {/* Live Status Telemetry Column */}
        <div className="md:col-span-5 flex flex-col justify-between h-full space-y-4">
          {/* Progress Timeline */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono tracking-widest text-[#94A3B8] uppercase">
              PIPELINE PROGRESSION
            </span>
            <div className="space-y-1.5">
              {stages.map((stg, i) => {
                const IconComponent = stg.icon;
                const isActive = stg.id === currentStage;
                return (
                  <div
                    key={stg.id}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs font-mono transition-all ${
                      isActive
                        ? 'bg-[#00E5FF]/15 border border-[#00E5FF]/50 text-[#00E5FF]'
                        : 'text-[#94A3B8] bg-[#101820]/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <IconComponent className="w-3.5 h-3.5" />
                      <span>{stg.label}</span>
                    </div>
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-pulse" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current Execution Message */}
          <div className="p-3.5 rounded-xl bg-[#101820] border border-[#22323D]">
            <span className="text-[10px] font-mono text-[#00FFA3] uppercase tracking-wider block mb-1">
              CURRENT OPERATION
            </span>
            <p className="text-xs font-mono text-[#F8FAFC] leading-relaxed">
              {stageText}
            </p>
          </div>

          {/* Detected Issues Pill List */}
          {detectedIssues.length > 0 && (
            <div className="p-3 rounded-xl bg-[#050709] border border-[#22323D]">
              <span className="text-[10px] font-mono text-[#FFB547] uppercase tracking-wider block mb-1.5">
                DETECTED ARTIFACTS
              </span>
              <div className="flex flex-wrap gap-1.5">
                {detectedIssues.map((iss, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FFB547]/10 text-[#FFB547] border border-[#FFB547]/30"
                  >
                    {iss.issue || iss}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
