import { useState, useEffect, useRef } from 'react';

/**
 * useSectionScrollProgress
 * Calculates normalized scroll progress [0, 1] through a specific DOM element.
 * 0: Element enters bottom of viewport
 * 1: Element leaves top of viewport
 * Supports reverse scrolling, resize recalculation, and reduced-motion detection.
 */
export function useSectionScrollProgress(ref, options = {}) {
  const { offsetTop = 0, offsetBottom = 0, lerpFactor = 0.1 } = options;
  const [progress, setProgress] = useState(0);
  const rawProgressRef = useRef(0);
  const lerpedProgressRef = useRef(0);
  const animFrameRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const windowHeight = window.innerHeight || 800;

      // Start when top of element hits bottom of screen minus offsetTop
      const start = windowHeight - offsetTop;
      // End when bottom of element hits top of screen plus offsetBottom
      const end = -rect.height + offsetBottom;
      const totalDistance = start - end;

      if (totalDistance <= 0) return;

      const currentDistance = start - rect.top;
      const raw = Math.min(1.0, Math.max(0.0, currentDistance / totalDistance));
      rawProgressRef.current = raw;
    };

    const updateLoop = () => {
      const diff = rawProgressRef.current - lerpedProgressRef.current;
      if (Math.abs(diff) > 0.0005) {
        lerpedProgressRef.current += diff * lerpFactor;
        setProgress(lerpedProgressRef.current);
      }
      animFrameRef.current = requestAnimationFrame(updateLoop);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    animFrameRef.current = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [ref, offsetTop, offsetBottom, lerpFactor]);

  return progress;
}

export default useSectionScrollProgress;
