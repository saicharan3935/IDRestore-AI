import React, { useRef } from 'react';
import ZeroGravityLaboratory3D from '../components/cinematic/ZeroGravityLaboratory3D';
import useSectionScrollProgress from '../hooks/useSectionScrollProgress';

export default function HowItWorksSection({ onLaunchWorkspace }) {
  const sectionRef = useRef(null);
  const scrollProgress = useSectionScrollProgress(sectionRef, {
    offsetTop: 100,
    offsetBottom: 100,
    lerpFactor: 0.12,
  });

  return (
    <section
      id="how-it-works"
      ref={sectionRef}
      className="py-24 bg-transparent border-t border-[#22323D]/40 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Retained Required Section Headers */}
        <div className="text-center space-y-4 mb-10">
          <span className="text-xs font-mono tracking-widest text-[#00FFA3] uppercase font-bold">
            EXECUTION PIPELINE
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-sans uppercase">
            FIVE-STAGE RESTORATION WORKFLOW
          </h2>
          <p className="text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            Every document follows an auditable, deterministic lifecycle from initial optical inspection to verified digital asset packaging.
          </p>
        </div>

        {/* Zero-Gravity 3D Restoration Laboratory */}
        <ZeroGravityLaboratory3D
          onLaunchWorkspace={onLaunchWorkspace}
          scrollProgress={scrollProgress}
        />
      </div>
    </section>
  );
}
