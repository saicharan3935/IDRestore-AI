import { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * KEYFRAME SECTIONS & DYNAMIC SIDE LANES
 * lane: 'left' | 'right' | 'transit-left-to-right' | 'transit-right-to-left' | 'sky-center'
 * yRatio: vertical viewport fraction (0 = top, 0.5 = center, 1 = bottom)
 * rotY: baseline body orientation (facing slightly inward toward content)
 */
const SECTION_KEYFRAMES = [
  // 0. Hero (Top): RIGHT LANE (away from headline, buttons, and AI Orb)
  {
    p: 0.00,
    lane: 'right',
    yRatio: 0.32,
    rotX: 0.05,
    rotY: -0.42,
    rotZ: 0.02,
    pose: 'hero-wave',
  },
  // 1. Transition: Hero to Features Gutter (crosses Right to Left in deep Z behind content)
  {
    p: 0.14,
    lane: 'transit-right-to-left',
    yRatio: 0.52,
    rotX: 0.02,
    rotY: -0.15,
    rotZ: -0.02,
    pose: 'glide',
  },
  // 2. Features (Orbital Carousel): LEFT LANE (outside revolving cards)
  {
    p: 0.25,
    lane: 'left',
    yRatio: 0.38,
    rotX: 0.06,
    rotY: 0.45,
    rotZ: 0.04,
    pose: 'observe',
  },
  // 3. Transition: Features to How It Works Gutter (crosses Left to Right in deep Z)
  {
    p: 0.35,
    lane: 'transit-left-to-right',
    yRatio: 0.54,
    rotX: 0.08,
    rotY: 0.15,
    rotZ: 0.00,
    pose: 'descend',
  },
  // 4. How It Works (Restoration Laboratory): RIGHT LANE (outside scanning laboratory)
  {
    p: 0.45,
    lane: 'right',
    yRatio: 0.46,
    rotX: 0.10,
    rotY: -0.42,
    rotZ: -0.04,
    pose: 'inspect',
  },
  // 5. Transition: Laboratory to Before/After Gutter (crosses Right to Left in deep Z)
  {
    p: 0.54,
    lane: 'transit-right-to-left',
    yRatio: 0.52,
    rotX: 0.04,
    rotY: -0.15,
    rotZ: 0.00,
    pose: 'glide',
  },
  // 6. Before & After (Restoration Chamber): LEFT LANE (completely outside comparison box)
  {
    p: 0.64,
    lane: 'left',
    yRatio: 0.36,
    rotX: -0.04,
    rotY: 0.40,
    rotZ: 0.02,
    pose: 'portal-observe',
  },
  // 7. Transition: Before/After to Technology Gutter (crosses Left to Right in deep Z)
  {
    p: 0.73,
    lane: 'transit-left-to-right',
    yRatio: 0.50,
    rotX: 0.00,
    rotY: 0.12,
    rotZ: 0.00,
    pose: 'glide',
  },
  // 8. Technology & Model Registry: RIGHT LANE (outside 3D reactor)
  {
    p: 0.82,
    lane: 'right',
    yRatio: 0.40,
    rotX: 0.04,
    rotY: -0.42,
    rotZ: -0.02,
    pose: 'glance',
  },
  // 9. Enterprise HRMS (max-w-4xl CTA): LEFT LANE (generous margin)
  {
    p: 0.91,
    lane: 'left',
    yRatio: 0.42,
    rotX: -0.08,
    rotY: 0.30,
    rotZ: 0.02,
    pose: 'pre-liftoff',
  },
  // 10. Footer Liftoff: CENTER SKY (soars into cosmic space)
  {
    p: 1.00,
    lane: 'sky-center',
    yRatio: -0.22,
    rotX: -0.55,
    rotY: 0.00,
    rotZ: 0.00,
    pose: 'liftoff',
  },
];

/**
 * Dynamically computes safe LEFT and RIGHT lane screen coordinates
 * based on actual DOM content container bounds and viewport dimensions.
 */
function computeDynamicSafeLanes(screenWidth, screenHeight) {
  const maxContentWidth = Math.min(screenWidth - 48, 1280);
  let contentLeft = Math.max(24, (screenWidth - maxContentWidth) / 2);
  let contentRight = screenWidth - contentLeft;

  if (typeof document !== 'undefined') {
    const containerEl = document.querySelector('.max-w-7xl') || document.querySelector('section > div');
    if (containerEl) {
      const rect = containerEl.getBoundingClientRect();
      if (rect.width > 100) {
        contentLeft = rect.left;
        contentRight = rect.right;
      }
    }
  }

  const leftMargin = Math.max(0, contentLeft);
  const rightMargin = Math.max(0, screenWidth - contentRight);

  // Responsive scale factor
  let baseScale = 0.74;
  if (screenWidth >= 1400) {
    baseScale = 0.76;
  } else if (screenWidth >= 1024) {
    baseScale = 0.62;
  } else if (screenWidth >= 640) {
    baseScale = 0.48;
  } else {
    baseScale = 0.36;
  }

  // LEFT LANE (Screen X in pixels) — strictly outside contentLeft
  let leftLaneX;
  if (leftMargin >= 100) {
    leftLaneX = leftMargin * 0.5;
  } else {
    leftLaneX = Math.max(12, leftMargin * 0.5);
  }

  // RIGHT LANE (Screen X in pixels) — strictly outside contentRight
  let rightLaneX;
  if (rightMargin >= 100) {
    rightLaneX = contentRight + rightMargin * 0.5;
  } else {
    rightLaneX = Math.min(screenWidth - 12, contentRight + rightMargin * 0.5);
  }

  return {
    leftLaneX,
    rightLaneX,
    contentLeft,
    contentRight,
    baseScale,
    isMobile: screenWidth < 640,
    isTablet: screenWidth >= 640 && screenWidth < 1024,
  };
}

/**
 * Projects Screen Pixel (X, Y) into Three.js World Coordinates at given Depth Z.
 * Camera FOV: 45, Position: [0, 0, 5.8].
 */
function projectScreenToWorld(screenX, screenY, targetZ, screenWidth, screenHeight) {
  const distToCamera = 5.8 - targetZ;
  // visibleHeight = 2 * dist * tan(22.5 deg)
  const visibleHeightAtZ = distToCamera * 0.82842712;
  const visibleWidthAtZ = visibleHeightAtZ * (screenWidth / screenHeight);

  const worldX = (screenX / screenWidth - 0.5) * visibleWidthAtZ;
  const worldY = -(screenY / screenHeight - 0.5) * visibleHeightAtZ;

  return { worldX, worldY, visibleWidthAtZ, visibleHeightAtZ };
}

/**
 * Interpolates keyframes with dynamic side-lane projection and orbital deep-Z transit arcs.
 */
function evaluateFlightTrajectory(p, screenWidth, screenHeight) {
  const clampedP = Math.max(0, Math.min(1, p));
  const lanes = computeDynamicSafeLanes(screenWidth, screenHeight);

  let i = 0;
  for (let idx = 0; idx < SECTION_KEYFRAMES.length - 1; idx++) {
    if (clampedP >= SECTION_KEYFRAMES[idx].p && clampedP <= SECTION_KEYFRAMES[idx + 1].p) {
      i = idx;
      break;
    }
  }

  const k0 = SECTION_KEYFRAMES[i];
  const k1 = SECTION_KEYFRAMES[i + 1];
  const segmentRange = k1.p - k0.p;
  const t = segmentRange > 0.0001 ? (clampedP - k0.p) / segmentRange : 0;
  // Smooth Hermite curve: 3t^2 - 2t^3
  const smoothT = t * t * (3 - 2 * t);

  // Helper to determine screen X for a given lane
  const getScreenXForLane = (laneType) => {
    if (laneType === 'left') return lanes.leftLaneX;
    if (laneType === 'right') return lanes.rightLaneX;
    if (laneType === 'sky-center') return screenWidth * 0.5;
    if (laneType === 'transit-right-to-left') return screenWidth * 0.5;
    if (laneType === 'transit-left-to-right') return screenWidth * 0.5;
    return lanes.rightLaneX;
  };

  // Base depths: lanes are close to camera (Z = 0.60)
  // Cross-over transitions arc deep behind content (Z dips to -1.60)
  const isTransitionSegment =
    k0.lane.startsWith('transit') ||
    k1.lane.startsWith('transit') ||
    (k0.lane === 'left' && k1.lane === 'right') ||
    (k0.lane === 'right' && k1.lane === 'left');

  let targetScreenX;
  let targetDepthZ = 0.60;
  let transitOpacity = 1.0;

  if (k1.lane === 'sky-center') {
    // Footer Liftoff: smoothly moves from left lane to center sky and accelerates deep into space
    targetScreenX = THREE.MathUtils.lerp(lanes.leftLaneX, screenWidth * 0.5, smoothT);
    targetDepthZ = THREE.MathUtils.lerp(0.60, -5.50, smoothT);
    transitOpacity = 1.0;
  } else if (isTransitionSegment) {
    const fromX = getScreenXForLane(k0.lane);
    const toX = getScreenXForLane(k1.lane);
    targetScreenX = THREE.MathUtils.lerp(fromX, toX, smoothT);

    // Deep orbital slingshot arc: Z dips to -1.60 at midpoint
    const arc = Math.sin(smoothT * Math.PI);
    targetDepthZ = 0.60 - arc * 2.2;

    // Graceful opacity attenuation: fades down to 0.28 while crossing center behind content
    transitOpacity = 1.0 - arc * 0.72;
  } else {
    // Stable lane flight
    const fromX = getScreenXForLane(k0.lane);
    const toX = getScreenXForLane(k1.lane);
    targetScreenX = THREE.MathUtils.lerp(fromX, toX, smoothT);
    targetDepthZ = 0.60;
    transitOpacity = 1.0;
  }

  // Screen Y interpolation
  const targetYRatio = THREE.MathUtils.lerp(k0.yRatio, k1.yRatio, smoothT);
  const targetScreenY = screenHeight * targetYRatio;

  // Project screen coordinates to Three.js world space
  const { worldX, worldY } = projectScreenToWorld(
    targetScreenX,
    targetScreenY,
    targetDepthZ,
    screenWidth,
    screenHeight
  );

  // Rotation interpolation
  const rotX = THREE.MathUtils.lerp(k0.rotX, k1.rotX, smoothT);
  const rotY = THREE.MathUtils.lerp(k0.rotY, k1.rotY, smoothT);
  const rotZ = THREE.MathUtils.lerp(k0.rotZ, k1.rotZ, smoothT);

  // Mobile special safe mode: if mobile and in Before/After section, tuck neatly into upper corner
  if (lanes.isMobile && clampedP >= 0.55 && clampedP <= 0.70) {
    transitOpacity = Math.min(transitOpacity, 0.45);
  }

  return {
    worldX,
    worldY,
    worldZ: targetDepthZ,
    rotX,
    rotY,
    rotZ,
    pose: t > 0.5 ? k1.pose : k0.pose,
    isLiftoff: clampedP >= 0.93,
    baseScale: lanes.baseScale,
    opacity: transitOpacity,
    isMobile: lanes.isMobile,
  };
}

/**
 * useGlobalAstronautMotion
 * Main responsive motion hook ensuring the astronaut navigates exclusively
 * through the safe LEFT and RIGHT margins of the website.
 */
export function useGlobalAstronautMotion({
  scrollProgress = 0,
  pointer = { x: 0, y: 0 },
  reducedMotion = false,
  viewportWidth = 8.0,
}) {
  const currentPRef = useRef(scrollProgress);
  const scrollDeltaRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());

  // Mutable animation state (Zero React re-renders)
  const stateRef = useRef({
    x: 2.8,
    y: 0.8,
    z: 0.6,
    rotX: 0.05,
    rotY: -0.42,
    rotZ: 0.02,
    scale: 0.76,
    opacity: 1.0,
    velocity: 0,
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
    let lastY = typeof window !== 'undefined' ? window.scrollY : 0;

    const onScroll = () => {
      const now = Date.now();
      const currentY = window.scrollY;
      const delta = currentY - lastY;
      lastY = currentY;

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

    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 900;

    // Evaluate dynamic trajectory with safe side-lane projection
    const traj = evaluateFlightTrajectory(p, screenWidth, screenHeight);

    s.pose = traj.pose;
    s.isLiftoff = traj.isLiftoff;

    let targetRotX = traj.rotX;
    let targetRotY = traj.rotY;
    let targetRotZ = traj.rotZ;
    let targetY = traj.worldY;

    // Reduced motion mode: gentle stationary floating in safe margin
    if (reducedMotion) {
      s.x = THREE.MathUtils.lerp(s.x, traj.worldX, delta * 3);
      s.y = THREE.MathUtils.lerp(s.y, traj.worldY + Math.sin(time * 1.5) * 0.04, delta * 3);
      s.z = THREE.MathUtils.lerp(s.z, traj.worldZ, delta * 3);
      s.rotX = THREE.MathUtils.lerp(s.rotX, targetRotX, delta * 3);
      s.rotY = THREE.MathUtils.lerp(s.rotY, targetRotY, delta * 3);
      s.rotZ = THREE.MathUtils.lerp(s.rotZ, targetRotZ, delta * 3);
      s.scale = traj.baseScale;
      s.opacity = traj.opacity;
      s.flameIntensity = 0;
      s.legSwing = 0;
      s.armSwing = 0;
      return s;
    }

    // Scroll Direction & Jetpack Thrust Logic:
    if (traj.isLiftoff) {
      // Footer Liftoff: Thrusters full power into deep space
      s.flameIntensity = THREE.MathUtils.damp(s.flameIntensity, 1.0, 12.0, delta);
      targetRotX = -0.55;
      s.legSwing = THREE.MathUtils.damp(s.legSwing, 0.45, 6.0, delta);
      s.armSwing = THREE.MathUtils.damp(s.armSwing, 0.65, 6.0, delta);
    } else if (s.velocity < -0.25) {
      // 1. SCROLLING UP: Jetpack ignites, character rises, tilts upward
      s.flameIntensity = THREE.MathUtils.damp(s.flameIntensity, 1.0, 15.0, delta);
      targetRotX -= 0.22;
      targetY += 0.08;
      s.legSwing = Math.sin(time * 6.5) * 0.28;
      s.armSwing = Math.cos(time * 6.0) * 0.22;
    } else if (s.velocity > 0.25) {
      // 2. SCROLLING DOWN: Thrusters off, weightless descent, body leans forward
      s.flameIntensity = THREE.MathUtils.damp(s.flameIntensity, 0.0, 18.0, delta);
      targetRotX += 0.18;
      targetY -= 0.08;
      s.legSwing = Math.sin(time * 4.2) * 0.24;
      s.armSwing = Math.cos(time * 3.8) * 0.18;
    } else {
      // 3. SCROLLING STOPPED / IDLE: Zero-G gentle hover bobbing in the safe lane
      s.flameIntensity = THREE.MathUtils.damp(s.flameIntensity, 0.0, 8.0, delta);
      const hover = Math.sin(time * 2.2) * 0.055;
      targetY += hover;
      targetRotZ += Math.sin(time * 1.6) * 0.03;
      s.legSwing = Math.sin(time * 1.8) * 0.05;
      s.armSwing = Math.cos(time * 1.8) * 0.05;
    }

    // Subtle pointer parallax constrained strictly to avoid pulling him into content
    const mouseParallaxX = (pointer.x || 0) * (traj.isMobile ? 0.04 : 0.09);
    const mouseParallaxY = (pointer.y || 0) * (traj.isMobile ? 0.04 : 0.08);
    const mouseTiltX = -(pointer.y || 0) * 0.06;
    const mouseTiltY = (pointer.x || 0) * 0.10;

    s.helmetLookX = THREE.MathUtils.damp(s.helmetLookX, (pointer.x || 0) * 0.35, 6, delta);
    s.helmetLookY = THREE.MathUtils.damp(s.helmetLookY, -(pointer.y || 0) * 0.25, 6, delta);

    // Apply smooth damping to world coordinates
    s.x = THREE.MathUtils.damp(s.x, traj.worldX + mouseParallaxX, 4.5, delta);
    s.y = THREE.MathUtils.damp(s.y, targetY + mouseParallaxY, 4.5, delta);
    s.z = THREE.MathUtils.damp(s.z, traj.worldZ, 4.5, delta);
    s.rotX = THREE.MathUtils.damp(s.rotX, targetRotX + mouseTiltX, 4.5, delta);
    s.rotY = THREE.MathUtils.damp(s.rotY, targetRotY + mouseTiltY, 4.5, delta);
    s.rotZ = THREE.MathUtils.damp(s.rotZ, targetRotZ, 4.5, delta);
    s.opacity = THREE.MathUtils.damp(s.opacity, traj.opacity, 6.0, delta);

    // Perspective depth scale in footer liftoff
    const depthScale = traj.isLiftoff ? Math.max(0.18, 1.0 + (s.z - 0.6) * 0.12) : 1.0;
    s.scale = traj.baseScale * depthScale;

    return s;
  };

  return { stateRef, update };
}
