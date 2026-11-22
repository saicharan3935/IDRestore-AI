import React, { useRef } from 'react';
import RestorationChamber from '../components/cinematic/RestorationChamber';
import useSectionScrollProgress from '../hooks/useSectionScrollProgress';
import { CheckCircle } from 'lucide-react';

export default function BeforeAfterSection({
  demoData,
  demoLoading,
  loadLiveDemo,
}) {
  const sectionRef = useRef(null);
  const scrollProgress = useSectionScrollProgress(sectionRef, {
    offsetTop: 100,
    offsetBottom: 100,
    lerpFactor: 0.12,
  });

  return (
    <section
      id="showcase"
      ref={sectionRef}
      className="py-24 bg-transparent relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        {/* Retained Required Section Headers */}
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#101820]/90 backdrop-blur-md border border-[#00FFA3]/40 text-xs font-mono text-[#00FFA3]">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>REAL OPTICAL BENCHMARK</span>
        </div>

        <h2 className="text-3xl sm:text-5xl font-extrabold font-sans uppercase">
          BEFORE & AFTER RESTORATION
        </h2>

        <p className="text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed bg-[#050709]/40 backdrop-blur-xs rounded-lg p-1">
          Drag the cyan comparison beam below to observe how our OpenCV algorithms neutralize sepia aging, reverse ink fading, eliminate fluid stains, and sharpen microtext fonts on synthetic historical personnel records.
        </p>

        {/* Futuristic 3D Holographic Restoration Chamber */}
        <div className="mt-10">
          <RestorationChamber
            demoData={demoData}
            demoLoading={demoLoading}
            loadLiveDemo={loadLiveDemo}
            scrollProgress={scrollProgress}
          />
        </div>
      </div>
    </section>
  );
}
