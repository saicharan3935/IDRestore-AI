import { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * useAstronautMotion
 * High-sensitivity scroll velocity and zero-gravity drift physics for the Portal Astronaut.
 * Detects both window scroll events and section scrollProgress changes.
 */
export function useAstronautMotion({
  basePosition = [-2.15, 0.75, 0.65],
  reducedMotion = false,
  isMobile = false,
  scrollProgress = 0,
}) {
  const scrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const scrollDeltaRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());
  const prevProgressRef = useRef(scrollProgress);

  // Mutable animation state (Zero React re-renders)
  const motionRef = useRef({
    // World transforms
    x: basePosition[0],
    y: basePosition[1],
    z: basePosition[2],
    rotX: 0,
    rotY: 0.35, // Angled slightly toward the center document cards
    rotZ: 0,
    // Dynamics
    velocity: 0, // < 0 means scrolling UP (rising), > 0 means scrolling DOWN (falling)
    direction: 'idle', // 'up' | 'down' | 'idle'
    flameIntensity: 0, // 0 to 1
    legSwing: 0,
    armSwing: 0,
  });

  // Track window scroll
  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const now = Date.now();
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      lastY = currentY;

      scrollYRef.current = currentY;
      scrollDeltaRef.current = delta;
      lastScrollTimeRef.current = now;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /**
   * update
   * Evaluated inside useFrame((state, delta) => update(delta, time))
   */
  const update = (delta, time) => {
    const m = motionRef.current;
    const now = Date.now();

    // Check if scroll stopped (decay to 0 if no scroll event in 100ms)
    if (now - lastScrollTimeRef.current > 100) {
      scrollDeltaRef.current = 0;
    }

    // Also factor in section scrollProgress delta as backup
    const progressDelta = (scrollProgress - prevProgressRef.current) * 1200;
    prevProgressRef.current = scrollProgress;

    // Use whichever scroll delta is currently active
    const rawDelta = Math.abs(scrollDeltaRef.current) > 0.1
      ? scrollDeltaRef.current
      : progressDelta;

    // Smoothly dampen velocity
    m.velocity = THREE.MathUtils.damp(m.velocity, rawDelta, 8.0, delta);

    // Responsive positioning: keep within safe visible bounds
    const targetBaseX = isMobile ? -1.45 : basePosition[0];
    const targetBaseY = isMobile ? 0.85 : basePosition[1];
    const targetBaseZ = isMobile ? 0.45 : basePosition[2];

    const motionScale = reducedMotion ? 0.15 : 1.0;

    // Trigger thresholds:
    // velocity < -0.2 => Scrolling UP (user scrolling toward top of page)
    // velocity > 0.2  => Scrolling DOWN (user scrolling toward bottom)
    if (m.velocity < -0.2 && !reducedMotion) {
      // 1. SCROLLING UP: JETPACK THRUST ACTIVE (RISING)
      m.direction = 'up';

      // Flames ignite immediately and flare up
      m.flameIntensity = THREE.MathUtils.damp(m.flameIntensity, 1.0, 16.0, delta);

      // Body tilts slightly upward (pitch negative, facing upward)
      const targetRotX = -0.28 * motionScale;
      const targetRotZ = -0.15 * motionScale;
      m.rotX = THREE.MathUtils.damp(m.rotX, targetRotX, 9.0, delta);
      m.rotZ = THREE.MathUtils.damp(m.rotZ, targetRotZ, 9.0, delta);
      m.rotY = THREE.MathUtils.damp(m.rotY, 0.45, 7.0, delta);

      // Controlled rise upward
      const upwardOffset = Math.min(0.55, Math.abs(m.velocity) * 0.015) * motionScale;
      const targetY = targetBaseY + upwardOffset;
      m.y = THREE.MathUtils.damp(m.y, targetY, 7.0, delta);
      m.x = THREE.MathUtils.damp(m.x, targetBaseX - 0.04, 5.0, delta);

      // Stabilized legs during rocket thrust
      m.legSwing = THREE.MathUtils.damp(m.legSwing, 0.1, 10.0, delta);
      m.armSwing = THREE.MathUtils.damp(m.armSwing, -0.22, 10.0, delta);

    } else if (m.velocity > 0.2 && !reducedMotion) {
      // 2. SCROLLING DOWN: ZERO-G DESCENT (FALLING/DRIFTING)
      m.direction = 'down';

      // Thruster flames extinguish
      m.flameIntensity = THREE.MathUtils.damp(m.flameIntensity, 0.0, 14.0, delta);

      // Body pitches forward/downward
      const targetRotX = 0.3 * motionScale;
      // Gentle weightless roll wobble
      const targetRotZ = (Math.sin(time * 3.5) * 0.16 + 0.1) * motionScale;
      m.rotX = THREE.MathUtils.damp(m.rotX, targetRotX, 7.0, delta);
      m.rotZ = THREE.MathUtils.damp(m.rotZ, targetRotZ, 7.0, delta);
      m.rotY = THREE.MathUtils.damp(m.rotY, 0.2, 5.0, delta);

      // Drifts downward
      const downwardOffset = Math.min(0.7, m.velocity * 0.018) * motionScale;
      const targetY = targetBaseY - downwardOffset;
      m.y = THREE.MathUtils.damp(m.y, targetY, 6.0, delta);
      m.x = THREE.MathUtils.damp(m.x, targetBaseX + 0.05, 5.0, delta);

      // Legs drift loosely in zero-g
      m.legSwing = Math.sin(time * 4.8) * 0.25 * motionScale;
      m.armSwing = Math.cos(time * 4.0) * 0.2 * motionScale;

    } else {
      // 3. SCROLL STOPPED: GENTLE IDLE ZERO-G HOVER
      m.direction = 'idle';

      // Flames extinguish smoothly
      m.flameIntensity = THREE.MathUtils.damp(m.flameIntensity, 0.0, 10.0, delta);

      // Natural floating hover oscillation
      const hoverY = Math.sin(time * 2.0) * 0.05 * motionScale;
      const hoverRotZ = Math.sin(time * 1.4) * 0.06 * motionScale;
      const hoverRotX = Math.cos(time * 1.2) * 0.05 * motionScale;

      m.rotX = THREE.MathUtils.damp(m.rotX, hoverRotX, 5.0, delta);
      m.rotZ = THREE.MathUtils.damp(m.rotZ, hoverRotZ, 5.0, delta);
      m.rotY = THREE.MathUtils.damp(m.rotY, 0.35, 4.0, delta);

      m.y = THREE.MathUtils.damp(m.y, targetBaseY + hoverY, 5.0, delta);
      m.x = THREE.MathUtils.damp(m.x, targetBaseX, 4.0, delta);
      m.z = THREE.MathUtils.damp(m.z, targetBaseZ, 4.0, delta);

      // Gentle floating limb drift
      m.legSwing = Math.sin(time * 2.2) * 0.08 * motionScale;
      m.armSwing = Math.cos(time * 1.8) * 0.06 * motionScale;
    }

    return m;
  };

  return { motionRef, update };
}
