import React, { useRef } from 'react';
import TechnologyReactor from '../components/cinematic/TechnologyReactor';
import useSectionScrollProgress from '../hooks/useSectionScrollProgress';

export default function TechnologySection({ modelStatus }) {
  const sectionRef = useRef(null);
  const scrollProgress = useSectionScrollProgress(sectionRef, {
    offsetTop: 100,
    offsetBottom: 100,
    lerpFactor: 0.12,
  });

  return (
    <section
      id="technology"
      ref={sectionRef}
      className="py-24 bg-transparent border-t border-[#22323D]/40 relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Retained Required Section Headers */}
        <div className="text-center space-y-4 mb-10">
          <span className="text-xs font-mono tracking-widest text-[#00E5FF] uppercase font-bold">
            TRANSPARENT ARCHITECTURE
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold font-sans uppercase">
            TECHNOLOGY & MODEL REGISTRY
          </h2>
          <p className="text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
            Honest operational tracking. In compliance with enterprise engineering standards, we report actual model availability and active OpenCV fallbacks.
          </p>
        </div>

        {/* Interactive 3D AI Reactor */}
        <TechnologyReactor
          modelStatus={modelStatus}
          scrollProgress={scrollProgress}
        />
      </div>
    </section>
  );
}
