import React from 'react';
import { ChevronLeft, ChevronRight, Compass } from 'lucide-react';

export default function CarouselControls({
  activeIndex,
  total,
  onPrev,
  onNext,
  onSelectIndex,
  isDragging = false,
}) {
  return (
    <div className="w-full flex flex-col items-center space-y-5 select-none pt-2">
      {/* 1. Main Navigation Row: Prev Button, 8-Dot Interactive Pagination, Next Button */}
      <div className="flex items-center space-x-4 sm:space-x-6">
        {/* Previous Button */}
        <button
          onClick={onPrev}
          type="button"
          aria-label="Previous feature"
          className="group relative p-3 sm:p-3.5 rounded-xl bg-[#101820]/90 backdrop-blur-md border border-[#22323D] hover:border-[#00E5FF] hover:bg-[#17232C] text-[#DCE7EC] hover:text-[#00E5FF] transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        >
          <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
          <span className="sr-only">Previous Feature</span>
        </button>

        {/* 8 Holographic Pagination Dots / Track */}
        <div
          role="tablist"
          aria-label="Feature navigation track"
          className="flex items-center space-x-2 sm:space-x-2.5 px-4 py-2 rounded-full bg-[#101820]/80 backdrop-blur-md border border-[#22323D]/80"
        >
          {Array.from({ length: total }).map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={`Jump to feature ${idx + 1}`}
                onClick={() => onSelectIndex(idx)}
                className={`relative transition-all duration-300 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] ${
                  isActive
                    ? 'w-7 sm:w-8 h-2.5 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#00FFA3] shadow-[0_0_12px_rgba(0,229,255,0.7)]'
                    : 'w-2 sm:w-2.5 h-2.5 rounded-full bg-[#17232C] hover:bg-[#00E5FF]/50 border border-[#22323D]'
                }`}
              />
            );
          })}
        </div>

        {/* Next Button */}
        <button
          onClick={onNext}
          type="button"
          aria-label="Next feature"
          className="group relative p-3 sm:p-3.5 rounded-xl bg-[#101820]/90 backdrop-blur-md border border-[#22323D] hover:border-[#00E5FF] hover:bg-[#17232C] text-[#DCE7EC] hover:text-[#00E5FF] transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/60 shadow-[0_4px_20px_rgba(0,0,0,0.5)]"
        >
          <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
          <span className="sr-only">Next Feature</span>
        </button>
      </div>

      {/* 2. Interactive Navigation Hints Strip */}
      <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] font-mono text-[#94A3B8]">
        <div className="flex items-center space-x-1.5 px-3 py-1 rounded-md bg-[#0B1117]/80 border border-[#22323D]/60">
          <Compass className="w-3.5 h-3.5 text-[#00E5FF]" />
          <span>DRAG / SWIPE TO ORBIT</span>
        </div>
        <div className="hidden sm:flex items-center space-x-1.5 px-3 py-1 rounded-md bg-[#0B1117]/80 border border-[#22323D]/60">
          <span className="text-[#00FFA3]">SCROLL / [← / →]</span>
          <span>KEYBOARD NAV</span>
        </div>
        <div className="text-[10px] text-[#DCE7EC]/60">
          NODE {String(activeIndex + 1).padStart(2, '0')} OF {String(total).padStart(2, '0')} IN FOCUS
        </div>
      </div>
    </div>
  );
}
