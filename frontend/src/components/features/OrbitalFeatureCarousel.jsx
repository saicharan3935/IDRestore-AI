import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import OrbitalPlatform3D from './OrbitalPlatform3D';
import OrbitalFeatureCard from './OrbitalFeatureCard';
import CarouselControls from './CarouselControls';

export default function OrbitalFeatureCarousel({ features = [] }) {
  const total = features.length || 8;
  const stepAngle = (2 * Math.PI) / total;

  const [activeIndex, setActiveIndex] = useState(0);
  const [displayAngle, setDisplayAngle] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [radii, setRadii] = useState({ radiusX: 380, radiusZ: 150 });

  const containerRef = useRef(null);
  const currentAngleRef = useRef(0);
  const targetAngleRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, time: 0 });
  const lastXRef = useRef(0);
  const animFrameIdRef = useRef(null);
  const isAnimatingRef = useRef(false);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Update responsive orbit radii
  useEffect(() => {
    const updateRadii = () => {
      const width = containerRef.current ? containerRef.current.offsetWidth : window.innerWidth;
      if (width < 640) {
        // Mobile
        setRadii({ radiusX: 180, radiusZ: 85 });
      } else if (width < 1024) {
        // Tablet
        setRadii({ radiusX: 280, radiusZ: 120 });
      } else {
        // Desktop
        setRadii({ radiusX: Math.min(420, Math.max(340, width * 0.32)), radiusZ: 160 });
      }
    };

    updateRadii();
    window.addEventListener('resize', updateRadii, { passive: true });
    return () => window.removeEventListener('resize', updateRadii);
  }, []);

  // Smooth animation loop using spring-like damping
  const startAnimationLoop = useCallback(() => {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const animate = () => {
      const current = currentAngleRef.current;
      const target = targetAngleRef.current;
      const diff = target - current;

      if (!isDraggingRef.current && Math.abs(diff) < 0.0008) {
        currentAngleRef.current = target;
        setDisplayAngle(target);
        isAnimatingRef.current = false;
        return;
      }

      const lerpSpeed = prefersReducedMotion ? 0.3 : 0.09;
      currentAngleRef.current += diff * lerpSpeed;
      setDisplayAngle(currentAngleRef.current);

      animFrameIdRef.current = requestAnimationFrame(animate);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);
  }, [prefersReducedMotion]);

  // Set target index with shortest circular rotation path
  const setTargetIndex = useCallback(
    (newIndex) => {
      const safeIndex = ((newIndex % total) + total) % total;
      const fullCircle = Math.PI * 2;
      const currentTarget = targetAngleRef.current;

      // Base target angle for safeIndex
      const desiredBase = -safeIndex * stepAngle;

      // Compute shortest delta to avoid multi-spin wrap
      const diff = ((desiredBase - currentTarget) % fullCircle + fullCircle * 1.5) % fullCircle - Math.PI;
      targetAngleRef.current = currentTarget + diff;

      setActiveIndex(safeIndex);
      startAnimationLoop();
    },
    [total, stepAngle, startAnimationLoop]
  );

  const handleNext = useCallback(() => {
    setTargetIndex(activeIndex + 1);
  }, [activeIndex, setTargetIndex]);

  const handlePrev = useCallback(() => {
    setTargetIndex(activeIndex - 1);
  }, [activeIndex, setTargetIndex]);

  // Keyboard navigation when carousel is focused
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Home') {
        e.preventDefault();
        setTargetIndex(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        setTargetIndex(total - 1);
      }
    },
    [handleNext, handlePrev, setTargetIndex, total]
  );

  // Pointer / Drag interactions
  const handlePointerDown = useCallback((e) => {
    // Only drag with primary mouse button or touch
    if (e.button !== undefined && e.button !== 0) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, time: performance.now() };
    lastXRef.current = e.clientX;

    if (e.currentTarget.setPointerCapture) {
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        // ignore fallback
      }
    }
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      if (!isDraggingRef.current) return;

      const deltaX = e.clientX - lastXRef.current;
      lastXRef.current = e.clientX;

      const containerWidth = containerRef.current ? containerRef.current.offsetWidth : 900;
      // Drag sensitivity: dragging across width rotates by approx 1 full circle
      const sensitivity = (Math.PI * 1.85) / containerWidth;

      targetAngleRef.current += deltaX * sensitivity;
      currentAngleRef.current = targetAngleRef.current;
      setDisplayAngle(targetAngleRef.current);
    },
    []
  );

  const handlePointerUp = useCallback(
    (e) => {
      if (!isDraggingRef.current) return;
      isDraggingRef.current = false;
      setIsDragging(false);

      if (e.currentTarget.releasePointerCapture) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          // ignore fallback
        }
      }

      // Calculate nearest card index from current rotation angle
      const normalized = -targetAngleRef.current / stepAngle;
      const nearestIndex = ((Math.round(normalized) % total) + total) % total;
      setTargetIndex(nearestIndex);
    },
    [stepAngle, total, setTargetIndex]
  );

  // Controlled trackpad / horizontal wheel rotation
  const handleWheel = useCallback(
    (e) => {
      // If user is doing horizontal gesture (trackpad swipe)
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 15) {
        e.preventDefault();
        if (e.deltaX > 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    },
    [handleNext, handlePrev]
  );

  // Natural scroll integration: as user scrolls down the page through features, gently advance carousel
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let accumulatedDelta = 0;

    const handleWindowScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const inView = rect.top < window.innerHeight && rect.bottom > 0;
      if (!inView) return;

      const currentScrollY = window.scrollY;
      const deltaY = currentScrollY - lastScrollY;
      lastScrollY = currentScrollY;

      accumulatedDelta += deltaY;
      // Every 180px of page scroll nudges 1 card forward/backward smoothly
      if (Math.abs(accumulatedDelta) > 190) {
        if (accumulatedDelta > 0) {
          setActiveIndex((prev) => {
            const next = (prev + 1) % total;
            setTargetIndex(next);
            return next;
          });
        } else {
          setActiveIndex((prev) => {
            const next = ((prev - 1) % total + total) % total;
            setTargetIndex(next);
            return next;
          });
        }
        accumulatedDelta = 0;
      }
    };

    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, [total, setTargetIndex]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Features Orbital Carousel"
      onKeyDown={handleKeyDown}
      onWheel={handleWheel}
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 focus:outline-none focus:ring-1 focus:ring-[#00E5FF]/40 rounded-3xl"
    >
      {/* 1. Main 3D Stage Viewport (560px - 660px on desktop) */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className={`relative w-full h-[520px] sm:h-[580px] md:h-[620px] select-none touch-pan-y overflow-hidden flex items-center justify-center ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{
          perspective: '1200px',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Holographic 3D Platform (Three.js WebGL Canvas) */}
        <OrbitalPlatform3D
          rotationAngle={displayAngle}
          activeIndex={activeIndex}
        />

        {/* 3D Cylindrical Orbital Feature Cards */}
        <div
          className="relative w-full h-full pointer-events-none"
          style={{
            transformStyle: 'preserve-3d',
          }}
        >
          {features.map((feature, idx) => {
            // Card angular position relative to camera front
            const cardAngle = (idx / total) * Math.PI * 2 + displayAngle;
            const phi = ((cardAngle % (Math.PI * 2)) + Math.PI * 3) % (Math.PI * 2) - Math.PI;

            return (
              <OrbitalFeatureCard
                key={idx}
                feature={feature}
                index={idx}
                total={total}
                phi={phi}
                radiusX={radii.radiusX}
                radiusZ={radii.radiusZ}
                isActive={idx === activeIndex}
                onSelect={setTargetIndex}
              />
            );
          })}
        </div>

        {/* Ambient Left/Right Vignette gradients for cinematic depth */}
        <div className="absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-[#050709] to-transparent pointer-events-none z-30" />
        <div className="absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-[#050709] to-transparent pointer-events-none z-30" />
      </div>

      {/* 2. HUD Carousel Navigation Controls */}
      <div className="relative z-40 mt-4">
        <CarouselControls
          activeIndex={activeIndex}
          total={total}
          onPrev={handlePrev}
          onNext={handleNext}
          onSelectIndex={setTargetIndex}
          isDragging={isDragging}
        />
      </div>
    </div>
  );
}
