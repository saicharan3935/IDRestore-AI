import React, { useState, useEffect, useRef } from 'react';
import { HelpCircle, TrendingUp, TrendingDown } from 'lucide-react';

/**
 * EnhancedKpiCard
 * 
 * Futuristic 3D tilt KPI card with:
 * - Animated number counter
 * - 3D mouse tracking tilt effect
 * - Mini SVG sparkline trend
 * - High-tech HUD borders and glowing accents
 * - Informative contextual tooltip
 */
export default function EnhancedKpiCard({
  title,
  numericValue,
  unit = '',
  icon: Icon,
  accentColor = '#00E5FF',
  glowColor = 'rgba(0, 229, 255, 0.25)',
  borderColor = 'border-[#22323D]',
  subtitle,
  tooltip,
  sparklineData = [12, 19, 15, 25, 22, 30, 28],
  trendLabel = '+14.2% vs last week',
  isPositiveTrend = true,
  delayMs = 0
}) {
  const cardRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(0);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, px: 50, py: 50 });
  const [isHovered, setIsHovered] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Animated counter
  useEffect(() => {
    let startTime = null;
    let animFrame = null;
    const duration = 1200; // ms
    const target = typeof numericValue === 'number' ? numericValue : parseFloat(numericValue) || 0;

    const timeout = setTimeout(() => {
      const step = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        // easeOutExpo
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = target * easeProgress;
        setDisplayValue(target % 1 === 0 ? Math.round(current) : Number(current.toFixed(1)));

        if (progress < 1) {
          animFrame = requestAnimationFrame(step);
        }
      };
      animFrame = requestAnimationFrame(step);
    }, delayMs);

    return () => {
      clearTimeout(timeout);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [numericValue, delayMs]);

  // 3D Tilt calculation
  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const px = (x / rect.width) * 100;
    const py = (y / rect.height) * 100;

    // Max tilt angles: +/- 8 degrees
    const rx = ((y - rect.height / 2) / (rect.height / 2)) * -7;
    const ry = ((x - rect.width / 2) / (rect.width / 2)) * 7;

    setTilt({ rx, ry, px, py });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setTilt({ rx: 0, ry: 0, px: 50, py: 50 });
  };

  // Sparkline SVG path generation
  const generateSparkline = () => {
    if (!sparklineData || sparklineData.length < 2) return null;
    const min = Math.min(...sparklineData);
    const max = Math.max(...sparklineData);
    const range = max - min || 1;
    const width = 100;
    const height = 32;
    const padding = 2;

    const points = sparklineData.map((val, idx) => {
      const x = (idx / (sparklineData.length - 1)) * (width - 2 * padding) + padding;
      const y = height - padding - ((val - min) / range) * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });

    const linePath = `M ${points.join(' L ')}`;
    const areaPath = `${linePath} L ${width - padding},${height} L ${padding},${height} Z`;

    return { linePath, areaPath };
  };

  const sparkline = generateSparkline();

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: '1000px',
        transformStyle: 'preserve-3d'
      }}
      className="relative select-none group"
    >
      <div
        style={{
          transform: isHovered
            ? `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(12px) scale3d(1.02, 1.02, 1.02)`
            : 'rotateX(0deg) rotateY(0deg) translateZ(0px) scale3d(1, 1, 1)',
          transition: isHovered
            ? 'transform 0.1s ease-out'
            : 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1), box-shadow 0.5s ease',
          boxShadow: isHovered
            ? `0 16px 32px -8px ${glowColor}, 0 0 0 1px ${accentColor}40`
            : '0 4px 16px rgba(0, 0, 0, 0.4)'
        }}
        className={`relative p-5 rounded-2xl bg-gradient-to-b from-[#101820]/95 to-[#0B1117]/95 backdrop-blur-md border ${borderColor} flex flex-col justify-between overflow-hidden`}
      >
        {/* Dynamic Light Sheen on Hover */}
        {isHovered && (
          <div
            className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-300"
            style={{
              background: `radial-gradient(circle 180px at ${tilt.px}% ${tilt.py}%, ${accentColor}25, transparent 80%)`
            }}
          />
        )}

        {/* Top Decorative Tech Accent Line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] opacity-75"
          style={{
            background: `linear-gradient(90deg, transparent 0%, ${accentColor} 50%, transparent 100%)`
          }}
        />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-3 relative z-10">
          <div className="flex items-center space-x-1.5">
            <span className="text-[10px] font-mono tracking-wider text-[#94A3B8] uppercase">
              {title}
            </span>
            {tooltip && (
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onClick={() => setShowTooltip(!showTooltip)}
                  className="text-[#94A3B8] hover:text-[#00E5FF] transition-colors focus:outline-none"
                >
                  <HelpCircle className="w-3 h-3" />
                </button>
                {showTooltip && (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 rounded-lg bg-[#050709] border border-[#00E5FF]/40 text-[10px] font-mono text-[#DCE7EC] shadow-xl z-50 pointer-events-none">
                    {tooltip}
                  </div>
                )}
              </div>
            )}
          </div>
          <div
            className="p-2 rounded-xl transition-transform duration-300 group-hover:scale-110"
            style={{
              background: `${accentColor}15`,
              border: `1px solid ${accentColor}30`
            }}
          >
            {Icon && <Icon className="w-4 h-4" style={{ color: accentColor }} />}
          </div>
        </div>

        {/* Main Metric Value & Unit */}
        <div className="relative z-10 flex items-baseline space-x-1 mb-2">
          <span
            className="text-3xl font-mono font-extrabold tracking-tight"
            style={{ color: accentColor }}
          >
            {displayValue.toLocaleString()}
          </span>
          {unit && (
            <span className="text-sm font-mono font-bold text-[#94A3B8]">{unit}</span>
          )}
        </div>

        {/* Sparkline & Trend Section */}
        {sparkline && (
          <div className="relative z-10 flex items-center justify-between pt-2 mt-1 border-t border-[#22323D]/40">
            <div className="flex items-center space-x-1">
              {isPositiveTrend ? (
                <TrendingUp className="w-3 h-3 text-[#00FFA3]" />
              ) : (
                <TrendingDown className="w-3 h-3 text-[#FFB547]" />
              )}
              <span
                className={`text-[10px] font-mono font-semibold ${
                  isPositiveTrend ? 'text-[#00FFA3]' : 'text-[#FFB547]'
                }`}
              >
                {trendLabel}
              </span>
            </div>

            {/* Mini SVG Sparkline */}
            <div className="w-20 h-7 overflow-hidden">
              <svg viewBox="0 0 100 32" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id={`grad-${title.replace(/\s+/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accentColor} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={accentColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <path
                  d={sparkline.areaPath}
                  fill={`url(#grad-${title.replace(/\s+/g, '')})`}
                />
                <path
                  d={sparkline.linePath}
                  fill="none"
                  stroke={accentColor}
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        )}

        {/* Subtitle Telemetry */}
        <div className="relative z-10 text-[10px] font-mono text-[#94A3B8] mt-2 flex items-center justify-between">
          <span className="truncate">{subtitle}</span>
          <span
            className="w-1.5 h-1.5 rounded-full flex-shrink-0 ml-1.5 animate-pulse"
            style={{ backgroundColor: accentColor }}
          />
        </div>
      </div>
    </div>
  );
}
