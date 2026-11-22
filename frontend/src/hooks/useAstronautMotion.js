import { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * useAstronautMotion
 * Tracks window scroll velocity, scroll direction, and zero-gravity drift.
 * All math runs inside useFrame with zero React component re-renders.
 */
export function useAstronautMotion({
  basePosition = [2.4, 0.8, 0.4],
  reducedMotion = false,
  isMobile = false,
}) {
  const scrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const scrollDeltaRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());

  // Frame-by-frame animated state
  const motionRef = useRef({
    // Positions
    x: basePosition[0],
    y: basePosition[1],
    z: basePosition[2],
    // Rotations (Euler angles)
    rotX: 0,
    rotY: 0,
    rotZ: 0,
    // Dynamics
    velocity: 0, // Negative = scrolling UP (rising), Positive = scrolling DOWN (falling)
    direction: 'idle', // 'up' | 'down' | 'idle'
    flameIntensity: 0, // 0 = off, 1 = max thruster flame
    legSwing: 0,
    armSwing: 0,
  });

  // Track window scroll events with high precision
  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      const now = Date.now();
      const currentY = window.scrollY;
      const delta = currentY - scrollYRef.current;

      scrollYRef.current = currentY;
      scrollDeltaRef.current = delta;
      lastScrollTimeRef.current = now;

      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          ticking = false;
        });
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /**
   * update
   * Called every frame in useFrame((state, delta) => update(delta, time))
   */
  const update = (delta, time) => {
    const m = motionRef.current;
    const now = Date.now();

    // If no scroll event received in 120ms, scroll has halted
    if (now - lastScrollTimeRef.current > 120) {
      scrollDeltaRef.current = 0;
    }

    // Dampen raw scroll delta into smooth velocity
    const lerpRate = 7.0;
    m.velocity = THREE.MathUtils.damp(m.velocity, scrollDeltaRef.current, lerpRate, delta);

    // Responsive horizontal offset (closer on mobile/tablet)
    const targetBaseX = isMobile ? 1.6 : basePosition[0];
    const targetBaseY = isMobile ? 0.9 : basePosition[1];
    const targetBaseZ = isMobile ? 0.2 : basePosition[2];

    const motionScale = reducedMotion ? 0.15 : 1.0;

    // Determine motion mode from velocity
    // Note: scrolling UP means scrollY is decreasing -> velocity < 0
    // Scrolling DOWN means scrollY is increasing -> velocity > 0
    if (m.velocity < -0.8 && !reducedMotion) {
      // 1. SCROLLING UP: RISING WITH JETPACK
      m.direction = 'up';

      // Flames ignite and ramp to full intensity
      m.flameIntensity = THREE.MathUtils.damp(m.flameIntensity, 1.0, 14.0, delta);

      // Body tilts slightly upward (pitch negative, facing up)
      const targetRotX = -0.22 * motionScale;
      const targetRotZ = -0.12 * motionScale;
      m.rotX = THREE.MathUtils.damp(m.rotX, targetRotX, 8.0, delta);
      m.rotZ = THREE.MathUtils.damp(m.rotZ, targetRotZ, 8.0, delta);
      m.rotY = THREE.MathUtils.damp(m.rotY, -0.35, 6.0, delta);

      // Controlled rise upward
      const upwardDisplacement = Math.min(0.65, Math.abs(m.velocity) * 0.018) * motionScale;
      const targetY = targetBaseY + upwardDisplacement;
      m.y = THREE.MathUtils.damp(m.y, targetY, 6.5, delta);
      m.x = THREE.MathUtils.damp(m.x, targetBaseX - 0.05, 5.0, delta);

      // Stabilized legs during rocket thrust
      m.legSwing = THREE.MathUtils.damp(m.legSwing, 0.12, 10.0, delta);
      m.armSwing = THREE.MathUtils.damp(m.armSwing, -0.2, 10.0, delta);

    } else if (m.velocity > 0.8 && !reducedMotion) {
      // 2. SCROLLING DOWN: DRIFTING / FALLING WEIGHTLESSLY
      m.direction = 'down';

      // Thruster flames extinguish smoothly
      m.flameIntensity = THREE.MathUtils.damp(m.flameIntensity, 0.0, 16.0, delta);

      // Body leans downward (pitch positive, leaning forward/down)
      const targetRotX = 0.25 * motionScale;
      // Weightless roll wobble
      const targetRotZ = (Math.sin(time * 3.2) * 0.14 + 0.1) * motionScale;
      m.rotX = THREE.MathUtils.damp(m.rotX, targetRotX, 6.0, delta);
      m.rotZ = THREE.MathUtils.damp(m.rotZ, targetRotZ, 6.0, delta);
      m.rotY = THREE.MathUtils.damp(m.rotY, 0.2, 5.0, delta);

      // Drifts downward through the portal
      const downwardDisplacement = Math.min(0.8, m.velocity * 0.02) * motionScale;
      const targetY = targetBaseY - downwardDisplacement;
      m.y = THREE.MathUtils.damp(m.y, targetY, 5.0, delta);
      m.x = THREE.MathUtils.damp(m.x, targetBaseX + 0.08, 4.0, delta);

      // Loose legs drifting weightlessly in zero-g
      m.legSwing = Math.sin(time * 4.5) * 0.22 * motionScale;
      m.armSwing = Math.cos(time * 3.8) * 0.18 * motionScale;

    } else {
      // 3. SCROLL STOPPED: GENTLE IDLE HOVERING
      m.direction = 'idle';

      // Extinguish flames
      m.flameIntensity = THREE.MathUtils.damp(m.flameIntensity, 0.0, 10.0, delta);

      // Subtle zero-gravity breathing / hover oscillation
      const hoverY = Math.sin(time * 1.8) * 0.045 * motionScale;
      const hoverRotZ = Math.sin(time * 1.2) * 0.05 * motionScale;
      const hoverRotX = Math.cos(time * 1.0) * 0.04 * motionScale;

      m.rotX = THREE.MathUtils.damp(m.rotX, hoverRotX, 4.0, delta);
      m.rotZ = THREE.MathUtils.damp(m.rotZ, hoverRotZ, 4.0, delta);
      m.rotY = THREE.MathUtils.damp(m.rotY, -0.15, 4.0, delta);

      m.y = THREE.MathUtils.damp(m.y, targetBaseY + hoverY, 4.5, delta);
      m.x = THREE.MathUtils.damp(m.x, targetBaseX, 4.0, delta);
      m.z = THREE.MathUtils.damp(m.z, targetBaseZ, 4.0, delta);

      // Gentle limb drift
      m.legSwing = Math.sin(time * 2.0) * 0.06 * motionScale;
      m.armSwing = Math.cos(time * 1.6) * 0.05 * motionScale;
    }

    return m;
  };

  return { motionRef, update };
}
