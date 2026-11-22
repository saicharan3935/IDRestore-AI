import React, { memo } from 'react';
import { ArrowUpRight } from 'lucide-react';

const OrbitalFeatureCard = memo(function OrbitalFeatureCard({
  feature,
  index,
  total,
  phi,
  radiusX,
  radiusZ,
  isActive,
  onSelect,
}) {
  const IconComp = feature.icon;

  // Normalized depth factor: d in [0, 1], where 1 is closest to camera, 0 is furthest back
  const cosVal = Math.cos(phi);
  const sinVal = Math.sin(phi);
  const d = Math.max(0, Math.min(1, (cosVal + 1) / 2));

  // 3D positioning
  const x = sinVal * radiusX;
  const z = cosVal * radiusZ;
  const y = (1 - d) * -16; // subtle depth elevation

  // Scale, rotation, opacity, and layering
  const scale = 0.72 + 0.28 * d;
  const opacity = Math.max(0.2, 0.25 + 0.75 * Math.pow(d, 1.4));
  const rotateY = -sinVal * 34; // tangent angle in degrees
  const zIndex = Math.round(d * 100) + 10;
  const isClickable = d > 0.45;

  // Formatted index badge (e.g., "01 / 08")
  const formattedIndex = `${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <div
      onClick={() => {
        if (!isActive && isClickable) {
          onSelect(index);
        }
      }}
      role="button"
      tabIndex={isActive ? 0 : -1}
      aria-label={`Feature ${index + 1}: ${feature.title}`}
      aria-current={isActive ? 'true' : 'false'}
      className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[310px] sm:w-[360px] md:w-[380px] select-none transition-[box-shadow,border-color] duration-300 ${
        isClickable ? 'cursor-pointer' : 'pointer-events-none'
      }`}
      style={{
        transform: `translate3d(calc(-50% + ${x.toFixed(2)}px), calc(-50% + ${y.toFixed(2)}px), ${z.toFixed(2)}px) rotateY(${rotateY.toFixed(2)}deg) scale(${scale.toFixed(3)})`,
        transformOrigin: 'center center',
        opacity: opacity.toFixed(3),
        zIndex,
        willChange: 'transform, opacity',
      }}
    >
      <div
        className={`relative p-6 sm:p-7 rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
          isActive
            ? 'bg-[#101820]/95 border-[#00E5FF] shadow-[0_0_35px_rgba(0,229,255,0.28)] ring-1 ring-[#00E5FF]/40'
            : 'bg-[#101820]/80 border-[#22323D] hover:border-[#00FFA3]/50 hover:shadow-[0_0_20px_rgba(0,255,163,0.15)]'
        }`}
      >
        {/* Top Header Strip: Index Badge & Status Pill */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <span
              className={`text-xs font-mono font-bold tracking-wider px-2.5 py-1 rounded-md border ${
                isActive
                  ? 'bg-[#17232C] text-[#00E5FF] border-[#00E5FF]/40'
                  : 'bg-[#0B1117] text-[#94A3B8] border-[#22323D]'
              }`}
            >
              {formattedIndex}
            </span>
            {feature.tag && (
              <span className="text-[10px] font-mono tracking-widest text-[#94A3B8] uppercase">
                {feature.tag}
              </span>
            )}
          </div>

          {/* Active status pulse or click indicator */}
          {isActive ? (
            <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[10px] font-mono text-[#00FFA3]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
              <span>ACTIVE STAGE</span>
            </div>
          ) : (
            <div className="text-[10px] font-mono text-[#94A3B8] opacity-70 flex items-center space-x-1 group-hover:text-[#00FFA3]">
              <span>ORBIT</span>
              <ArrowUpRight className="w-3 h-3" />
            </div>
          )}
        </div>

        {/* Feature Icon in Cybernetic Container */}
        <div className="mb-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors duration-300 border ${
              isActive
                ? 'bg-[#00E5FF] text-black border-[#00E5FF] shadow-cyan-glow'
                : 'bg-[#17232C] text-[#00E5FF] border-[#00E5FF]/30'
            }`}
          >
            <IconComp className="w-6 h-6" />
          </div>
        </div>

        {/* Feature Title */}
        <h3
          className={`text-xl font-bold font-sans tracking-tight mb-2.5 transition-colors ${
            isActive ? 'text-[#F8FAFC]' : 'text-[#DCE7EC]'
          }`}
        >
          {feature.title}
        </h3>

        {/* Feature Description (Preserves 100% original text) */}
        <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed mb-4 min-h-[48px]">
          {feature.description}
        </p>

        {/* Bottom Technical Spec Pill */}
        <div className="pt-3 border-t border-[#22323D]/60 flex items-center justify-between text-[11px] font-mono">
          <span className="text-[#94A3B8]">
            {feature.metric ? feature.metric : 'ENTERPRISE RESTORATION'}
          </span>
          <span className={isActive ? 'text-[#00FFA3] font-semibold' : 'text-[#DCE7EC]'}>
            {isActive ? 'READY FOR EXECUTION' : 'STANDBY'}
          </span>
        </div>

        {/* Corner Neon Accents for Active Card */}
        {isActive && (
          <>
            <div className="absolute -top-1 -left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-[#00E5FF]" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-[#00E5FF]" />
            <div className="absolute -bottom-1 -left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-[#00FFA3]" />
            <div className="absolute -bottom-1 -right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-[#00FFA3]" />
          </>
        )}
      </div>
    </div>
  );
});

export default OrbitalFeatureCard;
