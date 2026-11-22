import { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * WAYPOINTS: Continuous flight path mapped across all public landing-page sections.
 * p: normalized scroll progress [0.0 to 1.0]
 * x, y, z: 3D world coordinates in CinematicBackground3D camera space (FOV 45, cam at z=5.8)
 * rotX, rotY, rotZ: orientation angles (Euler radians)
 * pose: special character pose for that section
 */
const WAYPOINTS = [
  // 0. Hero (Top): Floats beside AI Orb in upper-right
  { p: 0.00, x: 2.60, y: 0.65, z: 0.60, rotX: 0.05, rotY: -0.38, rotZ: 0.02, pose: 'hero-wave' },
  // 1. Hero transition to Features
  { p: 0.12, x: 2.10, y: 0.85, z: 0.55, rotX: 0.02, rotY: -0.20, rotZ: -0.02, pose: 'glide' },
  // 2. Features (Orbital Carousel): Glides to upper-left margin outside carousel cards
  { p: 0.25, x: -2.60, y: 0.55, z: 0.65, rotX: 0.06, rotY: 0.45, rotZ: 0.04, pose: 'observe' },
  // 3. Features to Laboratory transition
  { p: 0.34, x: -1.30, y: 0.15, z: 0.70, rotX: 0.10, rotY: 0.15, rotZ: 0.00, pose: 'descend' },
  // 4. How It Works (Zero-Gravity Laboratory): Descends to right side, inspects scan beam
  { p: 0.43, x: 2.50, y: -0.25, z: 0.70, rotX: 0.12, rotY: -0.42, rotZ: -0.04, pose: 'inspect' },
  // 5. Laboratory to Before/After transition
  { p: 0.52, x: 1.00, y: 0.30, z: 0.65, rotX: 0.04, rotY: -0.15, rotZ: 0.00, pose: 'glide' },
  // 6. Before & After (Restoration Chamber): Floats in upper-left open quadrant above chamber
  { p: 0.63, x: -2.55, y: 0.70, z: 0.65, rotX: -0.04, rotY: 0.38, rotZ: 0.02, pose: 'portal-observe' },
  // 7. Before/After to Technology transition
  { p: 0.72, x: -0.75, y: 0.45, z: 0.60, rotX: 0.00, rotY: 0.10, rotZ: 0.00, pose: 'glide' },
  // 8. Technology & Model Registry (3D AI Reactor): Right flank, glancing toward reactor
  { p: 0.80, x: 2.55, y: 0.35, z: 0.60, rotX: 0.04, rotY: -0.40, rotZ: -0.02, pose: 'glance' },
  // 9. Enterprise HRMS / About CTA: Floats in left flank, preparing for liftoff
  { p: 0.90, x: -2.15, y: 0.20, z: 0.60, rotX: -0.08, rotY: 0.25, rotZ: 0.02, pose: 'pre-liftoff' },
  // 10. Footer Liftoff: Thrusters full blast, ascends deep into cosmic starfield
  { p: 1.00, x: 0.35, y: 3.20, z: -5.50, rotX: -0.55, rotY: 0.00, rotZ: 0.00, pose: 'liftoff' }
];

/**
 * Hermite smooth interpolation between waypoints
 */
function interpolateWaypoints(p) {
  const clampedP = Math.max(0, Math.min(1, p));
  let i = 0;
  for (let idx = 0; idx < WAYPOINTS.length - 1; idx++) {
    if (clampedP >= WAYPOINTS[idx].p && clampedP <= WAYPOINTS[idx + 1].p) {
      i = idx;
      break;
    }
  }

  const w0 = WAYPOINTS[i];
  const w1 = WAYPOINTS[i + 1];
  const segmentRange = w1.p - w0.p;
  const t = segmentRange > 0.0001 ? (clampedP - w0.p) / segmentRange : 0;
  // Smoothstep curve: 3t^2 - 2t^3
  const smoothT = t * t * (3 - 2 * t);

  return {
    x: THREE.MathUtils.lerp(w0.x, w1.x, smoothT),
    y: THREE.MathUtils.lerp(w0.y, w1.y, smoothT),
    z: THREE.MathUtils.lerp(w0.z, w1.z, smoothT),
    rotX: THREE.MathUtils.lerp(w0.rotX, w1.rotX, smoothT),
    rotY: THREE.MathUtils.lerp(w0.rotY, w1.rotY, smoothT),
    rotZ: THREE.MathUtils.lerp(w0.rotZ, w1.rotZ, smoothT),
    pose: t > 0.5 ? w1.pose : w0.pose,
    isLiftoff: clampedP >= 0.93,
  };
}

/**
 * useGlobalAstronautMotion
 * High-performance motion engine calculating flight path, velocity physics,
 * scroll direction detection, and character poses with 0 React re-renders.
 */
export function useGlobalAstronautMotion({
  scrollProgress = 0,
  pointer = { x: 0, y: 0 },
  reducedMotion = false,
  viewportWidth = 8.0,
}) {
  const currentPRef = useRef(scrollProgress);
  const scrollDeltaRef = useRef(0);
  const lastScrollYRef = useRef(typeof window !== 'undefined' ? window.scrollY : 0);
  const lastScrollTimeRef = useRef(Date.now());

  // Mutable animation state
  const stateRef = useRef({
    x: WAYPOINTS[0].x,
    y: WAYPOINTS[0].y,
    z: WAYPOINTS[0].z,
    rotX: WAYPOINTS[0].rotX,
    rotY: WAYPOINTS[0].rotY,
    rotZ: WAYPOINTS[0].rotZ,
    scale: 0.76,
    velocity: 0, // < 0: UP (rising), > 0: DOWN (falling)
    flameIntensity: 0,
    legSwing: 0,
    armSwing: 0,
    pose: 'hero-wave',
    isLiftoff: false,
    helmetLookX: 0,
    helmetLookY: 0,
  });

  // Track window scroll delta with high responsiveness
  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const now = Date.now();
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      lastY = currentY;

      lastScrollYRef.current = currentY;
      scrollDeltaRef.current = delta;
      lastScrollTimeRef.current = now;
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  /**
   * update
   * Called every frame inside useFrame((state, delta) => update(delta, time))
   */
  const update = (delta, time) => {
    const s = stateRef.current;
    const now = Date.now();

    // Reset delta when scroll stops (120ms debounce)
    if (now - lastScrollTimeRef.current > 120) {
      scrollDeltaRef.current = 0;
    }

    // Dampen raw scroll delta into smooth velocity
    s.velocity = THREE.MathUtils.damp(s.velocity, scrollDeltaRef.current, 7.5, delta);

    // Smoothly lerp global scroll progress for silky camera/waypoint travel
    currentPRef.current = THREE.MathUtils.lerp(
      currentPRef.current,
      scrollProgress,
      Math.min(delta * 5.0, 1.0)
    );
    const p = currentPRef.current;

    // Viewport responsiveness
    const isMobile = viewportWidth < 5.5;
    const isTablet = viewportWidth >= 5.5 && viewportWidth < 8.5;

    // Base scale
    const targetScale = isMobile ? 0.52 : isTablet ? 0.65 : 0.76;

    // Evaluate waypoint flight path
    const wp = interpolateWaypoints(p);
    s.pose = wp.pose;
    s.isLiftoff = wp.isLiftoff;

    // Responsive X-compression to guarantee character stays inside viewport bounds
    let adjustedX = wp.x;
    if (isMobile) {
      // Narrower screen: clamp and compress horizontal movement
      adjustedX = Math.sign(wp.x) * Math.min(Math.abs(wp.x) * 0.45, 1.25);
    } else if (isTablet) {
      adjustedX = wp.x * 0.82;
    }

    let targetY = wp.y;
    let targetZ = wp.z;
    let targetRotX = wp.rotX;
    let targetRotY = wp.rotY;
    let targetRotZ = wp.rotZ;

    // Reduced motion mode: gentle stationary floating
    if (reducedMotion) {
      s.x = THREE.MathUtils.lerp(s.x, adjustedX * 0.5, delta * 3);
      s.y = THREE.MathUtils.lerp(s.y, targetY + Math.sin(time * 1.5) * 0.05, delta * 3);
      s.z = THREE.MathUtils.lerp(s.z, targetZ, delta * 3);
      s.rotX = THREE.MathUtils.lerp(s.rotX, targetRotX, delta * 3);
      s.rotY = THREE.MathUtils.lerp(s.rotY, targetRotY, delta * 3);
      s.rotZ = THREE.MathUtils.lerp(s.rotZ, targetRotZ, delta * 3);
      s.scale = targetScale;
      s.flameIntensity = 0;
      s.legSwing = 0;
      s.armSwing = 0;
      return s;
    }

    // Scroll Direction & Jetpack Thrust Logic:
    // Footer Liftoff: Thrusters always ignite full power as he escapes into cosmic space
    if (wp.isLiftoff) {
      s.flameIntensity = THREE.MathUtils.damp(s.flameIntensity, 1.0, 12.0, delta);
      targetRotX = -0.55; // Pitch upward
      s.legSwing = THREE.MathUtils.damp(s.legSwing, 0.45, 6.0, delta);
      s.armSwing = THREE.MathUtils.damp(s.armSwing, 0.65, 6.0, delta);
    } else if (s.velocity < -0.25) {
      // 1. SCROLLING UP: Jetpack ignites, character rises, tilts upward
      s.flameIntensity = THREE.MathUtils.damp(s.flameIntensity, 1.0, 15.0, delta);
      targetRotX -= 0.22; // Pitch slightly upward
      targetY += 0.08;
      s.legSwing = Math.sin(time * 6.5) * 0.28;
      s.armSwing = Math.cos(time * 6.0) * 0.22;
    } else if (s.velocity > 0.25) {
      // 2. SCROLLING DOWN: Thrusters off, weightless descent, body leans forward
      s.flameIntensity = THREE.MathUtils.damp(s.flameIntensity, 0.0, 18.0, delta);
      targetRotX += 0.18; // Pitch forward/downward
      targetY -= 0.08;
      s.legSwing = Math.sin(time * 4.2) * 0.24;
      s.armSwing = Math.cos(time * 3.8) * 0.18;
    } else {
      // 3. SCROLLING STOPPED / IDLE: Zero-G gentle hover bobbing
      s.flameIntensity = THREE.MathUtils.damp(s.flameIntensity, 0.0, 8.0, delta);
      const hover = Math.sin(time * 2.2) * 0.065;
      targetY += hover;
      targetRotZ += Math.sin(time * 1.6) * 0.035;
      s.legSwing = Math.sin(time * 1.8) * 0.06;
      s.armSwing = Math.cos(time * 1.8) * 0.06;
    }

    // Mouse pointer subtle parallax & helmet tracking
    const mouseParallaxX = (pointer.x || 0) * (isMobile ? 0.08 : 0.18);
    const mouseParallaxY = (pointer.y || 0) * (isMobile ? 0.06 : 0.12);
    const mouseTiltX = -(pointer.y || 0) * 0.08;
    const mouseTiltY = (pointer.x || 0) * 0.12;

    s.helmetLookX = THREE.MathUtils.damp(s.helmetLookX, (pointer.x || 0) * 0.35, 6, delta);
    s.helmetLookY = THREE.MathUtils.damp(s.helmetLookY, -(pointer.y || 0) * 0.25, 6, delta);

    // Apply smooth damping to world coordinates
    s.x = THREE.MathUtils.damp(s.x, adjustedX + mouseParallaxX, 4.5, delta);
    s.y = THREE.MathUtils.damp(s.y, targetY + mouseParallaxY, 4.5, delta);
    s.z = THREE.MathUtils.damp(s.z, targetZ, 4.5, delta);
    s.rotX = THREE.MathUtils.damp(s.rotX, targetRotX + mouseTiltX, 4.5, delta);
    s.rotY = THREE.MathUtils.damp(s.rotY, targetRotY + mouseTiltY, 4.5, delta);
    s.rotZ = THREE.MathUtils.damp(s.rotZ, targetRotZ, 4.5, delta);

    // Depth scale in footer liftoff
    const depthScale = wp.isLiftoff ? Math.max(0.2, 1.0 + (s.z - 0.6) * 0.12) : 1.0;
    s.scale = targetScale * depthScale;

    return s;
  };

  return { stateRef, update };
}
