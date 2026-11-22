import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  SlidersHorizontal,
  Columns,
  Scan,
  Crosshair,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Download,
  Play,
  Pause,
  Layers,
  Info,
  CheckCircle2
} from 'lucide-react';
import PortalAstronaut from './PortalAstronaut';

// ==============================================================
// 3D CARDS MESH SCENE: SPLIT, SEPARATE, OVERLAP & INSPECT
// ==============================================================
function Physical3DDocumentCards({
  mode = 'split',
  splitPos = 50,
  laserPos = 50,
  zoomLevel = 1.0,
  textures,
  pointerRef,
  inspectorCoords = { x: 0.5, y: 0.5 },
  isMobile = false,
  aspectRatio = 1.5,
  reducedMotion = false,
  viewportWidth = 1200,
}) {
  const leftCardRef = useRef();
  const rightCardRef = useRef();
  const divider3DRef = useRef();
  const laserBeamRef = useRef();

  // Dynamic responsive document sizing based on viewport and aspect ratio
  const { docW, docH, sepX } = useMemo(() => {
    let w = 4.2;
    if (viewportWidth < 640) {
      w = 2.7;
    } else if (viewportWidth < 1024) {
      w = 3.4;
    } else if (viewportWidth < 1440) {
      w = 4.1;
    } else {
      w = 4.6;
    }

    // In side-by-side or inspector mode, scale slightly so both cards comfortably fit
    if (mode === 'side-by-side' || mode === 'inspector') {
      w = w * 0.82;
    }

    const h = w / (aspectRatio || 1.5);
    const separation = isMobile ? w * 0.58 : w * 0.62;

    return { docW: w, docH: h, sepX: separation };
  }, [viewportWidth, aspectRatio, mode, isMobile]);

  // Three.js Local Clipping Planes:
  // 1. Split mode clipping plane: Keeps points on the restored card where x >= splitOffset
  const splitClipPlane = useMemo(() => {
    return new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  }, []);

  // 2. Laser Reveal mode clipping plane: Keeps points where x <= laserOffset
  const laserClipPlane = useMemo(() => {
    return new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  }, []);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    // Gentle floating zero-gravity motion (disabled if prefers-reduced-motion)
    const floatFactor = reducedMotion ? 0 : 1;
    const floatY = Math.sin(time * 1.2) * 0.02 * floatFactor;
    const floatRotX = Math.sin(time * 0.8) * 0.01 * floatFactor;
    const floatRotY = Math.cos(time * 1.0) * 0.012 * floatFactor;

    // Natural 3D mouse tilt:
    // Cursor UP (pointer.y > 0) -> Card tilts upward (+0.08 rad)
    // Cursor DOWN (pointer.y < 0) -> Card tilts downward (-0.08 rad)
    // Cursor RIGHT (pointer.x > 0) -> Card tilts right (+0.12 rad)
    // Cursor LEFT (pointer.x < 0) -> Card tilts left (-0.12 rad)
    const tiltX = (pointerRef?.current?.y || 0) * (reducedMotion ? 0 : 0.08);
    const tiltY = (pointerRef?.current?.x || 0) * (reducedMotion ? 0 : 0.12);

    // Subtle translation parallax
    const px = (pointerRef?.current?.x || 0) * (reducedMotion ? 0 : 0.08);
    const py = (pointerRef?.current?.y || 0) * (reducedMotion ? 0 : 0.06);

    // ==============================================================
    // TARGET 3D TRANSFORMS BASED ON ACTIVE COMPARISON MODE
    // ==============================================================
    let targetLeftX = 0;
    let targetLeftY = floatY + py;
    let targetLeftZ = 0;
    let targetLeftRotX = floatRotX + tiltX;
    let targetLeftRotY = floatRotY + tiltY;

    let targetRightX = 0;
    let targetRightY = floatY + py;
    let targetRightZ = 0.004; // Hair in front to prevent z-fighting in merged modes
    let targetRightRotX = floatRotX + tiltX;
    let targetRightRotY = floatRotY + tiltY;

    if (mode === 'split') {
      // 1. INTERACTIVE SPLIT: Both cards merge into exact center aligned coordinate space
      targetLeftX = px;
      targetLeftY = floatY + py;
      targetLeftZ = -0.002;
      targetLeftRotX = floatRotX + tiltX;
      targetLeftRotY = floatRotY * 0.5 + tiltY;

      targetRightX = px;
      targetRightY = floatY + py;
      targetRightZ = 0.002;
      targetRightRotX = floatRotX + tiltX;
      targetRightRotY = floatRotY * 0.5 + tiltY;
    } else if (mode === 'side-by-side') {
      // 2. SIDE-BY-SIDE: Physically separate into two independent 3D cards rotating outward
      const baseOutwardRot = isMobile ? 0 : 0.14;
      targetLeftX = -sepX + px;
      targetLeftY = floatY + py;
      targetLeftZ = 0.05;
      targetLeftRotX = floatRotX + tiltX;
      targetLeftRotY = baseOutwardRot + floatRotY + tiltY;

      targetRightX = sepX + px;
      targetRightY = floatY + py;
      targetRightZ = 0.05;
      targetRightRotX = floatRotX + tiltX;
      targetRightRotY = -baseOutwardRot + floatRotY + tiltY;
    } else if (mode === 'laser-reveal') {
      // 3. LASER REVEAL: Overlapping cards; original slightly behind, restored slightly forward
      targetLeftX = px;
      targetLeftY = floatY + py;
      targetLeftZ = -0.05;
      targetLeftRotX = floatRotX + tiltX;
      targetLeftRotY = floatRotY * 0.5 + tiltY;

      targetRightX = px;
      targetRightY = floatY + py;
      targetRightZ = 0.05;
      targetRightRotX = floatRotX + tiltX;
      targetRightRotY = floatRotY * 0.5 + tiltY;
    } else if (mode === 'inspector') {
      // 4. DETAIL INSPECTOR: Separated cards facing frontally for synchronized magnification
      const baseInspectorRot = isMobile ? 0 : 0.05;
      targetLeftX = -sepX + px;
      targetLeftY = floatY + py;
      targetLeftZ = 0.02;
      targetLeftRotX = floatRotX + tiltX;
      targetLeftRotY = baseInspectorRot + floatRotY + tiltY;

      targetRightX = sepX + px;
      targetRightY = floatY + py;
      targetRightZ = 0.02;
      targetRightRotX = floatRotX + tiltX;
      targetRightRotY = -baseInspectorRot + floatRotY + tiltY;
    }

    const finalScale = zoomLevel * (isMobile ? 0.9 : 1.0);
    const lerpSpeed = reducedMotion ? 18 : 8.0;

    // Smoothly animate Left Card (Original Degraded)
    if (leftCardRef.current) {
      leftCardRef.current.position.x = THREE.MathUtils.damp(leftCardRef.current.position.x, targetLeftX, lerpSpeed, delta);
      leftCardRef.current.position.y = THREE.MathUtils.damp(leftCardRef.current.position.y, targetLeftY, lerpSpeed, delta);
      leftCardRef.current.position.z = THREE.MathUtils.damp(leftCardRef.current.position.z, targetLeftZ, lerpSpeed, delta);
      leftCardRef.current.rotation.x = THREE.MathUtils.damp(leftCardRef.current.rotation.x, targetLeftRotX, lerpSpeed, delta);
      leftCardRef.current.rotation.y = THREE.MathUtils.damp(leftCardRef.current.rotation.y, targetLeftRotY, lerpSpeed, delta);
      leftCardRef.current.scale.setScalar(THREE.MathUtils.damp(leftCardRef.current.scale.x, finalScale, lerpSpeed, delta));
    }

    // Smoothly animate Right Card (Restored Digital Asset)
    if (rightCardRef.current) {
      rightCardRef.current.position.x = THREE.MathUtils.damp(rightCardRef.current.position.x, targetRightX, lerpSpeed, delta);
      rightCardRef.current.position.y = THREE.MathUtils.damp(rightCardRef.current.position.y, targetRightY, lerpSpeed, delta);
      rightCardRef.current.position.z = THREE.MathUtils.damp(rightCardRef.current.position.z, targetRightZ, lerpSpeed, delta);
      rightCardRef.current.rotation.x = THREE.MathUtils.damp(rightCardRef.current.rotation.x, targetRightRotX, lerpSpeed, delta);
      rightCardRef.current.rotation.y = THREE.MathUtils.damp(rightCardRef.current.rotation.y, targetRightRotY, lerpSpeed, delta);
      rightCardRef.current.scale.setScalar(THREE.MathUtils.damp(rightCardRef.current.scale.x, finalScale, lerpSpeed, delta));
    }

    // Dynamic 3D Split Divider & Clipping Plane
    const splitOffset = ((splitPos / 100) - 0.5) * docW;
    if (mode === 'split') {
      splitClipPlane.constant = -splitOffset;
      if (divider3DRef.current) {
        divider3DRef.current.position.x = splitOffset + px;
        divider3DRef.current.position.y = floatY + py;
        divider3DRef.current.position.z = 0.015;
        divider3DRef.current.rotation.x = targetRightRotX;
        divider3DRef.current.rotation.y = targetRightRotY;
        divider3DRef.current.visible = true;
      }
    } else {
      splitClipPlane.constant = 1000; // Do not clip when not in split mode
      if (divider3DRef.current) divider3DRef.current.visible = false;
    }

    // Dynamic 3D Laser Reveal Beam & Clipping Plane
    const laserOffset = ((laserPos / 100) - 0.5) * docW;
    if (mode === 'laser-reveal') {
      laserClipPlane.constant = laserOffset;
      if (laserBeamRef.current) {
        laserBeamRef.current.position.x = laserOffset + px;
        laserBeamRef.current.position.y = floatY + py;
        laserBeamRef.current.position.z = 0.08;
        laserBeamRef.current.rotation.x = targetRightRotX;
        laserBeamRef.current.rotation.y = targetRightRotY;
        laserBeamRef.current.visible = true;
      }
    } else {
      laserClipPlane.constant = 1000;
      if (laserBeamRef.current) laserBeamRef.current.visible = false;
    }
  });

  // Calculate active clipping planes for the restored material
  const activeClippingPlanes = useMemo(() => {
    if (mode === 'split') return [splitClipPlane];
    if (mode === 'laser-reveal') return [laserClipPlane];
    return [];
  }, [mode, splitClipPlane, laserClipPlane]);

  return (
    <group>
      {/* ============================================================== */}
      {/* 3D DOCUMENT CARD 1: ORIGINAL DEGRADED (1987 ARCHIVE)           */}
      {/* ============================================================== */}
      <group ref={leftCardRef} position={[mode === 'side-by-side' ? -sepX : 0, 0, 0]}>
        {/* Physical Shallow Card Slab Base (Positioned cleanly behind surface) */}
        <mesh position={[0, 0, -0.011]} castShadow receiveShadow>
          <boxGeometry args={[docW, docH, 0.02]} />
          <meshStandardMaterial
            color="#0B1117"
            roughness={0.45}
            metalness={0.65}
          />
        </mesh>

        {/* Front Textured Surface with Guaranteed Texture Binding */}
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[docW * 0.985, docH * 0.985]} />
          {textures.original ? (
            <meshStandardMaterial
              key={`orig-tex-${textures.original.uuid}`}
              map={textures.original}
              color="#FFFFFF"
              roughness={0.3}
              metalness={0.08}
              toneMapped={false}
            />
          ) : (
            <meshStandardMaterial
              key="orig-loading"
              color="#101820"
              roughness={0.5}
            />
          )}
        </mesh>

        {/* Amber Precision Edge Rim (Archival Indicator) */}
        <lineSegments position={[0, 0, 0.004]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(docW, docH)]} />
          <lineBasicMaterial
            color="#FFB547"
            transparent
            opacity={mode === 'side-by-side' || mode === 'inspector' ? 0.8 : 0.35}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>

        {/* Corner Alignment Crosshairs */}
        {[-docW / 2, docW / 2].map((cx, i) =>
          [-docH / 2, docH / 2].map((cy, j) => (
            <mesh key={`l-cross-${i}-${j}`} position={[cx, cy, 0.005]}>
              <ringGeometry args={[0.025, 0.055, 12]} />
              <meshBasicMaterial color="#FFB547" transparent opacity={0.7} />
            </mesh>
          ))
        )}
      </group>

      {/* ============================================================== */}
      {/* 3D DOCUMENT CARD 2: RESTORED DIGITAL ASSET (IDRESTORE AI)       */}
      {/* ============================================================== */}
      <group ref={rightCardRef} position={[mode === 'side-by-side' ? sepX : 0, 0, 0.004]}>
        {/* Physical Shallow Card Slab Base */}
        <mesh position={[0, 0, -0.011]} castShadow receiveShadow>
          <boxGeometry args={[docW, docH, 0.02]} />
          <meshStandardMaterial
            color="#0B1117"
            roughness={0.25}
            metalness={0.8}
            clippingPlanes={mode === 'split' ? activeClippingPlanes : []}
            clipShadows
          />
        </mesh>

        {/* Front Textured Surface with Local Clipping Plane */}
        <mesh position={[0, 0, 0.002]}>
          <planeGeometry args={[docW * 0.985, docH * 0.985]} />
          {textures.restored ? (
            <meshStandardMaterial
              key={`rest-tex-${textures.restored.uuid}`}
              map={textures.restored}
              color="#FFFFFF"
              roughness={0.15}
              metalness={0.15}
              clippingPlanes={activeClippingPlanes}
              clipShadows
              toneMapped={false}
            />
          ) : (
            <meshStandardMaterial
              key="rest-loading"
              color="#101820"
              roughness={0.5}
            />
          )}
        </mesh>

        {/* Electric Cyan / Laser Mint Glow Rim */}
        <lineSegments position={[0, 0, 0.004]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(docW, docH)]} />
          <lineBasicMaterial
            color="#00FFA3"
            transparent
            opacity={mode === 'side-by-side' || mode === 'inspector' ? 0.9 : 0.4}
            blending={THREE.AdditiveBlending}
          />
        </lineSegments>

        {/* Corner Hologram Rings */}
        {[-docW / 2, docW / 2].map((cx, i) =>
          [-docH / 2, docH / 2].map((cy, j) => (
            <mesh key={`r-ring-${i}-${j}`} position={[cx, cy, 0.005]}>
              <ringGeometry args={[0.025, 0.055, 12]} />
              <meshBasicMaterial color="#00E5FF" transparent opacity={0.85} />
            </mesh>
          ))
        )}
      </group>

      {/* ============================================================== */}
      {/* 3D ILLUMINATED SPLIT DIVIDER (MODE === 'SPLIT')                 */}
      {/* ============================================================== */}
      <group ref={divider3DRef} visible={mode === 'split'}>
        {/* Core Electric Cyan Vertical Beam */}
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[0.022, docH * 1.02]} />
          <meshBasicMaterial
            color="#00E5FF"
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Soft Halo Glow */}
        <mesh position={[0, 0, 0.003]}>
          <planeGeometry args={[0.12, docH * 1.02]} />
          <meshBasicMaterial
            color="#00FFA3"
            transparent
            opacity={0.3}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        {/* Top & Bottom Anchor Nodes */}
        <mesh position={[0, docH * 0.51, 0.01]}>
          <circleGeometry args={[0.065, 16]} />
          <meshBasicMaterial color="#00E5FF" />
        </mesh>
        <mesh position={[0, -docH * 0.51, 0.01]}>
          <circleGeometry args={[0.065, 16]} />
          <meshBasicMaterial color="#00FFA3" />
        </mesh>
      </group>

      {/* ============================================================== */}
      {/* 3D LASER SWEEP BEAM (MODE === 'LASER-REVEAL')                   */}
      {/* ============================================================== */}
      <group ref={laserBeamRef} visible={mode === 'laser-reveal'}>
        <mesh position={[0, 0, 0.01]}>
          <planeGeometry args={[0.045, docH * 1.05]} />
          <meshBasicMaterial
            color="#00E5FF"
            transparent
            opacity={0.95}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <planeGeometry args={[0.35, docH * 1.05]} />
          <meshBasicMaterial
            color="#00FFA3"
            transparent
            opacity={0.35}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>
    </group>
  );
}

// Background Holographic Gimbal Rings (Subtle, non-dominating framing)
function ChamberGimbalRings() {
  const g1 = useRef();
  const g2 = useRef();

  useFrame((state, delta) => {
    if (g1.current) g1.current.rotation.z += delta * 0.15;
    if (g2.current) g2.current.rotation.y += delta * 0.12;
  });

  return (
    <group position={[0, 0, -3.6]} rotation={[0.08, 0, 0]}>
      <mesh ref={g1}>
        <torusGeometry args={[4.6, 0.01, 16, 64]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.18} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh ref={g2} rotation={[Math.PI / 3.2, 0, 0]}>
        <torusGeometry args={[5.2, 0.008, 16, 64]} />
        <meshBasicMaterial color="#00FFA3" transparent opacity={0.14} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

// Atmospheric Cyber Particles (Light ambient dust)
function ChamberAtmosphericDust({ count = 35 }) {
  const pointsRef = useRef();

  const [coords, colors] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const cols = new Float32Array(count * 3);
    const c1 = new THREE.Color('#00E5FF');
    const c2 = new THREE.Color('#00FFA3');

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 7;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 3;

      const pick = Math.random();
      const c = pick > 0.5 ? c1 : c2;
      cols[i * 3] = c.r;
      cols[i * 3 + 1] = c.g;
      cols[i * 3 + 2] = c.b;
    }
    return [pos, cols];
  }, [count]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const array = pointsRef.current.geometry.attributes.position.array;
    for (let i = 0; i < count; i++) {
      array[i * 3 + 1] += Math.sin(state.clock.elapsedTime * 1.2 + i) * 0.0012;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.rotation.y += delta * 0.015;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={coords} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={count} array={colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        vertexColors
        transparent
        opacity={0.45}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

// Camera Rig: Anchored position with subtle scroll progress (NO cursor fighting)
function CameraRig({ scrollProgress = 0, reducedMotion = false }) {
  useFrame((state, delta) => {
    if (reducedMotion) return;
    const scrollAngle = (scrollProgress - 0.5) * 0.15;
    // Maintain stable camera orientation; card tilts naturally via its own rotation
    state.camera.position.x = THREE.MathUtils.damp(state.camera.position.x, 0, 4, delta);
    state.camera.position.y = THREE.MathUtils.damp(state.camera.position.y, scrollAngle, 4, delta);
    state.camera.lookAt(0, 0, 0);
  });

  return null;
}

// ==============================================================
// MASTER COMPONENT: RESTORATION CHAMBER 3D
// ==============================================================
export default function RestorationChamber3D({
  demoData,
  demoLoading,
  loadLiveDemo,
  scrollProgress = 0,
}) {
  // 1. Independent comparison mode state:
  // 'split' (Interactive Split) | 'side-by-side' | 'laser-reveal' | 'inspector'
  const [mode, setMode] = useState('split');

  // 2. Interactive Split state
  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);

  // 3. Laser Reveal state
  const [laserPos, setLaserPos] = useState(50);
  const [laserPlaying, setLaserPlaying] = useState(true);

  // 4. Detail Inspector state
  const [inspectorCoords, setInspectorCoords] = useState({ x: 0.5, y: 0.5 });
  const [zoomLevel, setZoomLevel] = useState(1.0);

  // 5. System, UI & Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(1200);

  // 6. Real Image Metadata
  const [imgMeta, setImgMeta] = useState({
    width: 0,
    height: 0,
    aspect: 1.5,
    status: 'INITIALIZING'
  });

  // DOM Refs
  const containerRef = useRef(null);
  const canvasWrapperRef = useRef(null);
  const pointerRef = useRef({ x: 0, y: 0 }); // Mouse position stored in Ref to prevent re-renders!
  const [textures, setTextures] = useState({ original: null, restored: null });

  // Check window dimensions and motion preferences
  useEffect(() => {
    const checkViewport = () => {
      const w = window.innerWidth;
      setViewportWidth(w);
      setIsMobile(w < 768);
    };

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionQuery.matches);
    const motionListener = (e) => setReducedMotion(e.matches);

    checkViewport();
    window.addEventListener('resize', checkViewport);
    if (motionQuery.addEventListener) {
      motionQuery.addEventListener('change', motionListener);
    }

    return () => {
      window.removeEventListener('resize', checkViewport);
      if (motionQuery.removeEventListener) {
        motionQuery.removeEventListener('change', motionListener);
      }
    };
  }, []);

  // Synchronized Fullscreen API listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Robust Parallel Texture Loading with Guaranteed Fallback
  useEffect(() => {
    let isMounted = true;
    const loader = new THREE.TextureLoader();

    // URLs with fallback to bundled public benchmark samples
    const origPrimary = demoData?.original_url || '/samples/demo_original_degraded.jpg';
    const restPrimary = demoData?.restored_url || '/samples/demo_restored_clean.jpg';
    const origFallback = '/samples/demo_original_degraded.jpg';
    const restFallback = '/samples/demo_restored_clean.jpg';

    setImgMeta((prev) => ({ ...prev, status: 'LOADING' }));

    // Read natural dimensions
    const imgMeasure = new Image();
    imgMeasure.onload = () => {
      if (!isMounted) return;
      const w = imgMeasure.naturalWidth || 900;
      const h = imgMeasure.naturalHeight || 600;
      setImgMeta({
        width: w,
        height: h,
        aspect: w / h,
        status: 'READY'
      });
    };
    imgMeasure.onerror = () => {
      if (!isMounted) return;
      setImgMeta((prev) => ({ ...prev, status: 'FALLBACK' }));
    };
    imgMeasure.src = origPrimary;

    // Helper to load texture with automatic fallback
    const loadTextureSafe = (primaryUrl, fallbackUrl, onSuccess) => {
      loader.load(
        primaryUrl,
        (tex) => {
          if (!isMounted) { tex.dispose(); return; }
          tex.colorSpace = THREE.SRGBColorSpace;
          tex.minFilter = THREE.LinearFilter;
          tex.generateMipmaps = false;
          tex.needsUpdate = true;
          onSuccess(tex);
        },
        undefined,
        (err) => {
          console.warn(`Could not load primary texture from ${primaryUrl}, trying fallback ${fallbackUrl}:`, err);
          if (primaryUrl !== fallbackUrl) {
            loader.load(
              fallbackUrl,
              (fallbackTex) => {
                if (!isMounted) { fallbackTex.dispose(); return; }
                fallbackTex.colorSpace = THREE.SRGBColorSpace;
                fallbackTex.minFilter = THREE.LinearFilter;
                fallbackTex.generateMipmaps = false;
                fallbackTex.needsUpdate = true;
                onSuccess(fallbackTex);
              },
              undefined,
              (fallbackErr) => {
                console.error(`Fatal: Failed fallback texture from ${fallbackUrl}:`, fallbackErr);
                if (isMounted) setImgMeta((prev) => ({ ...prev, status: 'ERROR' }));
              }
            );
          } else {
            if (isMounted) setImgMeta((prev) => ({ ...prev, status: 'ERROR' }));
          }
        }
      );
    };

    // Load original degraded texture
    loadTextureSafe(origPrimary, origFallback, (origTex) => {
      setTextures((prev) => {
        if (prev.original) prev.original.dispose();
        return { ...prev, original: origTex };
      });
    });

    // Load restored enhanced texture
    loadTextureSafe(restPrimary, restFallback, (restTex) => {
      setTextures((prev) => {
        if (prev.restored) prev.restored.dispose();
        return { ...prev, restored: restTex };
      });
    });

    return () => {
      isMounted = false;
    };
  }, [demoData?.original_url, demoData?.restored_url]);

  // Clean up textures on final component unmount
  useEffect(() => {
    return () => {
      setTextures((prev) => {
        if (prev.original) prev.original.dispose();
        if (prev.restored) prev.restored.dispose();
        return { original: null, restored: null };
      });
    };
  }, []);

  // Natural Pointer Tracker:
  // Cursor UP -> normY is POSITIVE (+1)
  // Cursor DOWN -> normY is NEGATIVE (-1)
  // Cursor RIGHT -> normX is POSITIVE (+1)
  // Cursor LEFT -> normX is NEGATIVE (-1)
  const handlePointerMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const normY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    pointerRef.current.x = Math.max(-1, Math.min(1, normX));
    pointerRef.current.y = Math.max(-1, Math.min(1, normY));
  }, []);

  // Smooth neutral return when pointer leaves the container
  const handlePointerLeave = useCallback(() => {
    pointerRef.current.x = 0;
    pointerRef.current.y = 0;
  }, []);

  // ==============================================================
  // INTERACTIVE SPLIT DRAGGING & TOUCH HANDLERS
  // ==============================================================
  const updateSplitFromClientX = useCallback((clientX) => {
    if (!canvasWrapperRef.current) return;
    const rect = canvasWrapperRef.current.getBoundingClientRect();
    const rawX = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (rawX / rect.width) * 100));
    setSplitPos(percent);
  }, []);

  const handleSplitPointerDown = useCallback((e) => {
    if (mode !== 'split') return;
    setIsDraggingSplit(true);
    updateSplitFromClientX(e.clientX || (e.touches && e.touches[0].clientX));
  }, [mode, updateSplitFromClientX]);

  useEffect(() => {
    if (!isDraggingSplit) return;

    const onPointerMove = (e) => {
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      if (clientX !== undefined) updateSplitFromClientX(clientX);
    };

    const onPointerUp = () => setIsDraggingSplit(false);

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);

    return () => {
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
    };
  }, [isDraggingSplit, updateSplitFromClientX]);

  // Keyboard navigation for Split Divider
  const handleSplitKeyDown = (e) => {
    if (mode !== 'split') return;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      e.preventDefault();
      setSplitPos((p) => Math.max(0, p - 2));
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      e.preventDefault();
      setSplitPos((p) => Math.min(100, p + 2));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSplitPos(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSplitPos(100);
    }
  };

  // ==============================================================
  // LASER REVEAL AUTOMATED SWEEP ANIMATION
  // ==============================================================
  useEffect(() => {
    if (mode !== 'laser-reveal' || !laserPlaying) return;
    let animId;
    let start = performance.now();

    const sweepLoop = (now) => {
      const elapsed = (now - start) / 1000;
      // Oscillate across 0% to 100% every 3.5 seconds
      const current = (Math.sin(elapsed * 1.8 - Math.PI / 2) * 0.5 + 0.5) * 100;
      setLaserPos(current);
      animId = requestAnimationFrame(sweepLoop);
    };

    animId = requestAnimationFrame(sweepLoop);
    return () => cancelAnimationFrame(animId);
  }, [mode, laserPlaying]);

  // ==============================================================
  // DETAIL INSPECTOR COORDINATE TRACKING
  // ==============================================================
  const handleInspectorMove = (e) => {
    if (mode !== 'inspector' || !canvasWrapperRef.current) return;
    const rect = canvasWrapperRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const normX = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const normY = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height));
    setInspectorCoords({ x: normX, y: normY });
  };

  const handleInspectorKeyDown = (e) => {
    if (mode !== 'inspector') return;
    const step = e.shiftKey ? 0.05 : 0.02;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setInspectorCoords((c) => ({ ...c, x: Math.max(0, c.x - step) }));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setInspectorCoords((c) => ({ ...c, x: Math.min(1, c.x + step) }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setInspectorCoords((c) => ({ ...c, y: Math.max(0, c.y - step) }));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setInspectorCoords((c) => ({ ...c, y: Math.min(1, c.y + step) }));
    }
  };

  // Action Tools
  const handleZoom = (delta) => {
    setZoomLevel((z) => Math.min(2.0, Math.max(0.75, +(z + delta).toFixed(2))));
  };

  const handleReset = () => {
    setZoomLevel(1.0);
    setSplitPos(50);
    setLaserPos(50);
    setLaserPlaying(true);
    setInspectorCoords({ x: 0.5, y: 0.5 });
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = textures.restored?.image?.src || demoData?.restored_url || '/samples/demo_restored_clean.jpg';
    link.download = demoData?.original_filename
      ? `IDRestore_${demoData.original_filename}`
      : 'Restored_Employee_Record_1987.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch((err) => {
          console.warn('Fullscreen request failed:', err);
        });
      } else if (containerRef.current.webkitRequestFullscreen) {
        containerRef.current.webkitRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch((err) => {
          console.warn('Exit fullscreen failed:', err);
        });
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      }
    }
  };

  // Determine whether metrics are from live backend processing or synthetic demonstration
  const isSyntheticDemo = !demoData?.is_live && (
    demoData?.id === 'sample-emp-record-1987' ||
    !demoData?.metrics ||
    demoData?.original_url?.includes('demo_')
  );

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="3D Restoration Chamber Comparison Portal"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onKeyDown={(e) => {
        if (mode === 'split') handleSplitKeyDown(e);
        if (mode === 'inspector') handleInspectorKeyDown(e);
      }}
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 select-none focus:outline-none"
    >
      <div className="relative w-full rounded-3xl bg-[#0B1117]/95 backdrop-blur-2xl border border-[#22323D] overflow-hidden p-4 sm:p-7 shadow-[0_20px_70px_rgba(0,0,0,0.85)]">
        
        {/* Holographic Scanline Overlay & Corner Laser Guides */}
        <div className="absolute inset-0 scanline-grid opacity-15 pointer-events-none" />
        <div className="absolute -top-1 -left-1 w-6 h-6 border-t-2 border-l-2 border-[#00E5FF] z-40 pointer-events-none" />
        <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#00E5FF] z-40 pointer-events-none" />
        <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#00FFA3] z-40 pointer-events-none" />
        <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-2 border-r-2 border-[#00FFA3] z-40 pointer-events-none" />

        {/* ============================================================== */}
        {/* TOP HUD: SYSTEM TELEMETRY, ACTIVE MODE & RESOLUTION METADATA   */}
        {/* ============================================================== */}
        <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#22323D]/80 text-xs font-mono">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00FFA3] animate-pulse" />
            <span className="text-[#00E5FF] font-bold tracking-wider">
              3D RESTORATION PORTAL &bull; ZERO-GRAVITY CHAMBER
            </span>
            <span className="hidden md:inline text-[#94A3B8]">
              | REAL-TIME 3D RECONFIGURATION
            </span>
          </div>

          <div className="flex items-center space-x-3 text-[11px] text-[#94A3B8]">
            <span className="px-2.5 py-0.5 rounded bg-[#101820] border border-[#22323D] text-[#00FFA3]">
              MODE: {mode.toUpperCase().replace('-', ' ')}
            </span>
            {/* Dynamic metadata computed directly from loaded image asset */}
            <span className="hidden sm:inline text-[#DCE7EC]">
              {imgMeta.width > 0 ? `${imgMeta.width} \u00D7 ${imgMeta.height} PX (${imgMeta.aspect.toFixed(2)}:1)` : 'MEASURING SENSORS...'}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] ${
              imgMeta.status === 'READY'
                ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30'
                : imgMeta.status === 'ERROR'
                ? 'bg-[#FF5C5C]/15 text-[#FF5C5C] border border-[#FF5C5C]/30'
                : 'bg-[#FFB547]/15 text-[#FFB547] border border-[#FFB547]/30'
            }`}>
              {imgMeta.status}
            </span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* 4 MODE BUTTONS & ACTION CONTROLS TOOLBAR                       */}
        {/* ============================================================== */}
        <div className="relative z-30 flex flex-wrap items-center justify-between gap-3 mb-4">
          {/* THE FOUR COMPARISON MODE BUTTONS */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-[#101820] border border-[#22323D] text-xs font-mono">
            {[
              { id: 'split', label: 'Interactive Split', icon: SlidersHorizontal },
              { id: 'side-by-side', label: 'Side-by-Side', icon: Columns },
              { id: 'laser-reveal', label: 'Laser Reveal', icon: Scan },
              { id: 'inspector', label: 'Detail Inspector', icon: Crosshair },
            ].map((m) => {
              const Icon = m.icon;
              const isActive = mode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMode(m.id)}
                  aria-pressed={isActive}
                  className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all duration-200 focus:outline-none focus:ring-1 focus:ring-[#00E5FF] ${
                    isActive
                      ? 'bg-[#17232C] text-[#00E5FF] border border-[#00E5FF]/60 shadow-[0_0_14px_rgba(0,229,255,0.35)] font-bold'
                      : 'text-[#94A3B8] hover:text-[#DCE7EC] hover:bg-[#17232C]/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{m.label}</span>
                </button>
              );
            })}
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleZoom(0.2)}
              title="Zoom In"
              aria-label="Zoom In"
              className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00E5FF] border border-[#22323D] transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-0.2)}
              title="Zoom Out"
              aria-label="Zoom Out"
              className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00E5FF] border border-[#22323D] transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              title="Reset Controls"
              aria-label="Reset Controls"
              className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00FFA3] border border-[#22323D] transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-2 rounded-lg bg-[#101820] text-[#DCE7EC] hover:text-[#00E5FF] border border-[#22323D] transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={handleDownload}
              className="px-3.5 py-1.5 rounded-lg bg-[#00E5FF] text-black font-bold font-mono hover:bg-[#33EBFF] transition-all flex items-center space-x-1.5 shadow-cyan-strong active:scale-95 text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">DOWNLOAD</span>
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* REAL 3D CANVAS VIEWPORT                                        */}
        {/* ============================================================== */}
        <div
          ref={canvasWrapperRef}
          onPointerDown={handleSplitPointerDown}
          onMouseMove={handleInspectorMove}
          onTouchMove={handleInspectorMove}
          className="relative w-full h-[480px] sm:h-[540px] md:h-[600px] rounded-2xl overflow-hidden border border-[#22323D] bg-[#050709] flex items-center justify-center cursor-default"
        >
          {/* Real Three.js Canvas with Local Clipping Enabled */}
          <Canvas
            camera={{ position: [0, 0, 5.4], fov: 44 }}
            gl={{
              antialias: true,
              alpha: true,
              powerPreference: 'high-performance',
              localClippingEnabled: true,
            }}
            dpr={[1, 1.5]}
            style={{ background: 'transparent' }}
          >
            <ambientLight intensity={0.75} />
            <directionalLight position={[5, 6, 6]} intensity={2.2} color="#DCE7EC" />
            <directionalLight position={[-5, -4, -4]} intensity={1.5} color="#00E5FF" />
            <pointLight position={[0, 0, 3.2]} intensity={1.5} color="#00FFA3" distance={8} />

            {/* Background Gimbal Rings & Ambient Dust */}
            <ChamberGimbalRings />
            <ChamberAtmosphericDust count={30} />

            {/* Camera: Anchored view without parallax inversion */}
            <CameraRig
              scrollProgress={scrollProgress}
              reducedMotion={reducedMotion}
            />

            {/* Tiny Scroll-Reactive Sci-Fi Astronaut Companion */}
            <PortalAstronaut
              basePosition={[isMobile ? 1.55 : 2.45, 0.75, 0.35]}
              reducedMotion={reducedMotion}
              isMobile={isMobile}
            />

            {/* The Physical 3D Document Cards with Natural Mouse Tilt */}
            <Physical3DDocumentCards
              mode={mode}
              splitPos={splitPos}
              laserPos={laserPos}
              zoomLevel={zoomLevel}
              textures={textures}
              pointerRef={pointerRef}
              inspectorCoords={inspectorCoords}
              isMobile={isMobile}
              aspectRatio={imgMeta.aspect}
              reducedMotion={reducedMotion}
              viewportWidth={viewportWidth}
            />
          </Canvas>

          {/* ============================================================== */}
          {/* HTML ACCESSIBLE INTERACTION OVERLAYS                           */}
          {/* ============================================================== */}

          {/* 1. INTERACTIVE SPLIT OVERLAY (MODE === 'SPLIT') */}
          {mode === 'split' && (
            <div className="absolute inset-0 z-30 pointer-events-none">
              {/* Left / Right Aligned Document Labels */}
              <div className="absolute top-4 inset-x-0 flex justify-between px-6 sm:px-12 text-xs font-mono">
                <div className="px-3 py-1 rounded bg-[#050709]/85 border border-[#FFB547]/50 text-[#FFB547] backdrop-blur-sm shadow-[0_0_12px_rgba(255,181,71,0.2)]">
                  ORIGINAL DEGRADED (1987)
                </div>
                <div className="px-3 py-1 rounded bg-[#050709]/85 border border-[#00FFA3]/60 text-[#00FFA3] font-bold backdrop-blur-sm shadow-[0_0_16px_rgba(0,255,163,0.25)]">
                  ENHANCED DIGITAL ASSET (AI)
                </div>
              </div>

              {/* Draggable Divider Handle Line */}
              <div
                className="absolute inset-y-0"
                style={{ left: `${splitPos}%`, transform: 'translateX(-50%)' }}
              >
                {/* Thin illuminated vertical guide */}
                <div className="w-[2px] h-full bg-[#00E5FF] shadow-[0_0_12px_rgba(0,229,255,0.8)] opacity-90 mx-auto" />

                {/* Central Cyan Grab Handle */}
                <div
                  tabIndex={0}
                  role="slider"
                  aria-label="Interactive Split Divider"
                  aria-valuenow={Math.round(splitPos)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  onKeyDown={handleSplitKeyDown}
                  className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 left-1/2 w-9 h-12 rounded-xl bg-[#0B1117] border-2 border-[#00E5FF] shadow-[0_0_20px_rgba(0,229,255,0.7)] flex flex-col items-center justify-center cursor-ew-resize pointer-events-auto hover:scale-105 active:scale-95 transition-transform focus:outline-none focus:ring-2 focus:ring-[#00FFA3]"
                >
                  <SlidersHorizontal className="w-4 h-4 text-[#00E5FF]" />
                  <div className="flex space-x-0.5 mt-0.5">
                    <span className="w-0.5 h-2 bg-[#00FFA3] rounded-full" />
                    <span className="w-0.5 h-2 bg-[#00FFA3] rounded-full" />
                  </div>
                </div>

                {/* Floating percentage badge */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-[#050709]/90 border border-[#00E5FF]/50 text-[10px] font-mono text-[#00E5FF] whitespace-nowrap shadow-md pointer-events-none">
                  SPLIT: {splitPos.toFixed(0)}%
                </div>
              </div>

              {/* Bottom Quick-Presets for Split */}
              <div className="absolute bottom-3 right-4 flex items-center space-x-1.5 pointer-events-auto">
                <span className="text-[10px] font-mono text-[#94A3B8] hidden sm:inline mr-1">QUICK:</span>
                {[25, 50, 75].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSplitPos(preset);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                      Math.round(splitPos) === preset
                        ? 'bg-[#17232C] text-[#00E5FF] border-[#00E5FF]'
                        : 'bg-[#101820]/80 text-[#94A3B8] border-[#22323D] hover:text-[#DCE7EC]'
                    }`}
                  >
                    {preset}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 2. SIDE-BY-SIDE OVERLAY (MODE === 'SIDE-BY-SIDE') */}
          {mode === 'side-by-side' && (
            <div className="absolute inset-x-0 top-4 z-30 flex justify-between px-6 sm:px-14 pointer-events-none text-xs font-mono">
              <div className="px-3.5 py-1.5 rounded-lg bg-[#050709]/85 border border-[#FFB547]/50 text-[#FFB547] backdrop-blur-sm shadow-[0_0_15px_rgba(255,181,71,0.2)]">
                ORIGINAL ARCHIVAL RECORD (1987)
              </div>
              <div className="px-3.5 py-1.5 rounded-lg bg-[#050709]/85 border border-[#00FFA3]/60 text-[#00FFA3] font-bold backdrop-blur-sm shadow-[0_0_20px_rgba(0,255,163,0.25)]">
                RESTORED DIGITAL ASSET (IDRESTORE AI)
              </div>
            </div>
          )}

          {/* 3. LASER REVEAL CONTROLS OVERLAY (MODE === 'LASER-REVEAL') */}
          {mode === 'laser-reveal' && (
            <div className="absolute inset-x-0 bottom-4 z-30 px-6 pointer-events-auto">
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-[#0B1117]/95 backdrop-blur-md border border-[#22323D] text-xs font-mono max-w-xl mx-auto shadow-[0_8px_30px_rgba(0,0,0,0.85)]">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setLaserPlaying((p) => !p)}
                    className="px-3 py-1.5 rounded-lg bg-[#17232C] hover:bg-[#22323D] text-[#00E5FF] border border-[#00E5FF]/40 flex items-center space-x-1.5 transition-colors"
                  >
                    {laserPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{laserPlaying ? 'PAUSE SWEEP' : 'RESUME SWEEP'}</span>
                  </button>

                  <button
                    onClick={() => {
                      setLaserPos(0);
                      setLaserPlaying(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-[#17232C] hover:bg-[#22323D] text-[#DCE7EC] border border-[#22323D] flex items-center space-x-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>RESET</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-56">
                  <span className="text-[#94A3B8] text-[10px] whitespace-nowrap">
                    REVEAL: {laserPos.toFixed(0)}%
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    aria-label="Laser Sweep Scrubber"
                    value={laserPos}
                    onChange={(e) => {
                      setLaserPlaying(false);
                      setLaserPos(parseFloat(e.target.value));
                    }}
                    className="w-full accent-[#00E5FF] cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* 4. DETAIL INSPECTOR SYNCHRONIZED LOUPES OVERLAY (MODE === 'INSPECTOR') */}
          {mode === 'inspector' && (
            <div className="absolute inset-0 z-30 p-4 pointer-events-auto flex flex-col justify-between">
              {/* Dual Magnification Loupe Displays */}
              <div className="grid grid-cols-2 gap-4 h-40 sm:h-48 pointer-events-none">
                {/* Left Loupe: Original Degraded */}
                <div className="relative rounded-xl overflow-hidden border border-[#FFB547]/50 bg-[#050709]/95 shadow-[0_0_15px_rgba(255,181,71,0.15)]">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${textures.original?.image?.src || demoData?.original_url || '/samples/demo_original_degraded.jpg'})`,
                      backgroundPosition: `${inspectorCoords.x * 100}% ${inspectorCoords.y * 100}%`,
                      backgroundSize: `${260 * zoomLevel}%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <div className="absolute top-2 left-2 px-2.5 py-0.5 rounded bg-[#050709]/90 text-[10px] font-mono text-[#FFB547] border border-[#FFB547]/30">
                    ORIGINAL ({(2.6 * zoomLevel).toFixed(1)}&times; LOUPE)
                  </div>
                  {/* Center reticle crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Crosshair className="w-6 h-6 text-[#FFB547]/60" />
                  </div>
                </div>

                {/* Right Loupe: Restored Asset */}
                <div className="relative rounded-xl overflow-hidden border border-[#00FFA3]/60 bg-[#050709]/95 shadow-[0_0_20px_rgba(0,255,163,0.2)]">
                  <div
                    className="w-full h-full"
                    style={{
                      backgroundImage: `url(${textures.restored?.image?.src || demoData?.restored_url || '/samples/demo_restored_clean.jpg'})`,
                      backgroundPosition: `${inspectorCoords.x * 100}% ${inspectorCoords.y * 100}%`,
                      backgroundSize: `${260 * zoomLevel}%`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                  <div className="absolute top-2 right-2 px-2.5 py-0.5 rounded bg-[#050709]/90 text-[10px] font-mono text-[#00FFA3] font-bold border border-[#00FFA3]/40">
                    RESTORED ({(2.6 * zoomLevel).toFixed(1)}&times; LOUPE)
                  </div>
                  {/* Center reticle crosshair */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <Crosshair className="w-6 h-6 text-[#00FFA3]/70" />
                  </div>
                </div>
              </div>

              {/* Inspector Presets & Coordinate HUD Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-[#0B1117]/95 border border-[#22323D] text-[11px] font-mono shadow-[0_8px_25px_rgba(0,0,0,0.8)]">
                <div className="flex items-center space-x-2 text-[#94A3B8]">
                  <span>COORDINATES:</span>
                  <span className="text-[#00E5FF]">X: {(inspectorCoords.x * 100).toFixed(0)}%</span>
                  <span className="text-[#00FFA3]">Y: {(inspectorCoords.y * 100).toFixed(0)}%</span>
                  <span className="hidden sm:inline text-[#DCE7EC]">
                    MAG: {(2.6 * zoomLevel).toFixed(1)}&times;
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[#94A3B8] hidden md:inline">TARGETS:</span>
                  {[
                    { label: 'PORTRAIT', x: 0.18, y: 0.35 },
                    { label: 'MICROTEXT', x: 0.52, y: 0.48 },
                    { label: 'SIGNATURE', x: 0.75, y: 0.82 },
                    { label: 'SEAL', x: 0.82, y: 0.55 },
                  ].map((p) => (
                    <button
                      key={p.label}
                      type="button"
                      onClick={() => setInspectorCoords({ x: p.x, y: p.y })}
                      className="px-2 py-0.5 rounded bg-[#17232C] hover:bg-[#22323D] text-[#DCE7EC] hover:text-[#00FFA3] border border-[#22323D] transition-colors text-[10px]"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Telemetry Badge (Bottom Left) */}
          <div className="absolute bottom-3 left-3 z-20 flex items-center space-x-2 px-3 py-1 rounded-lg bg-[#050709]/85 backdrop-blur-md border border-[#22323D] text-[10px] font-mono text-[#00E5FF] pointer-events-none">
            <Layers className="w-3.5 h-3.5 text-[#00FFA3]" />
            <span className="hidden sm:inline">3D PHYSICAL CARD MESHES &bull; CLICK TOOLBAR TO RECONFIGURE</span>
            <span className="sm:hidden">3D RECONFIGURABLE</span>
          </div>
        </div>

        {/* ============================================================== */}
        {/* QUANTITATIVE AUDIT METRICS STRIP                               */}
        {/* Transparent labelling: Synthetic Demo vs Live Processed Data   */}
        {/* ============================================================== */}
        <div className="relative z-30 mt-4 pt-4 border-t border-[#22323D]/60 space-y-3 font-mono">
          <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${isSyntheticDemo ? 'bg-[#FFB547]' : 'bg-[#00FFA3]'}`} />
              <span className="text-[#DCE7EC] font-bold">
                {isSyntheticDemo ? 'SYNTHETIC ARCHIVAL BENCHMARK (1987 DATASET)' : 'LIVE RESTORATION PIPELINE METRICS'}
              </span>
            </div>
            <span className="text-[10px] text-[#94A3B8]">
              {isSyntheticDemo ? 'SIMULATED CONTROL DATA' : 'MEASURED HARDWARE LATENCY'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            {/* Metric 1: Sharpness Gain */}
            <div className="p-2.5 rounded-xl bg-[#101820] border border-[#22323D]">
              <div className="text-[10px] text-[#94A3B8]">SHARPNESS GAIN</div>
              <div className="text-sm font-bold text-[#00FFA3]">
                {demoData?.metrics?.sharpness_gain_percent !== undefined
                  ? `+${demoData.metrics.sharpness_gain_percent}%`
                  : isSyntheticDemo
                  ? '+161.9%'
                  : 'N/A'}
              </div>
              <div className="text-[9px] text-[#94A3B8] mt-0.5">
                {isSyntheticDemo ? 'SYNTHETIC BENCHMARK' : 'LAPLACIAN VARIANCE'}
              </div>
            </div>

            {/* Metric 2: Structural SSIM */}
            <div className="p-2.5 rounded-xl bg-[#101820] border border-[#22323D]">
              <div className="text-[10px] text-[#94A3B8]">STRUCTURAL SSIM</div>
              <div className="text-sm font-bold text-[#00E5FF]">
                {demoData?.metrics?.ssim !== undefined
                  ? Number(demoData.metrics.ssim).toFixed(3)
                  : isSyntheticDemo
                  ? '0.774'
                  : 'N/A'}
              </div>
              <div className="text-[9px] text-[#94A3B8] mt-0.5">
                {isSyntheticDemo ? 'BENCHMARK ALIGNMENT' : 'REQUIRES REFERENCE'}
              </div>
            </div>

            {/* Metric 3: Fidelity PSNR */}
            <div className="p-2.5 rounded-xl bg-[#101820] border border-[#22323D]">
              <div className="text-[10px] text-[#94A3B8]">FIDELITY PSNR</div>
              <div className="text-sm font-bold text-[#DCE7EC]">
                {demoData?.metrics?.psnr_db !== undefined
                  ? `${Number(demoData.metrics.psnr_db).toFixed(1)} dB`
                  : isSyntheticDemo
                  ? '12.1 dB'
                  : 'N/A'}
              </div>
              <div className="text-[9px] text-[#94A3B8] mt-0.5">
                {isSyntheticDemo ? 'SYNTHETIC REFERENCE' : 'PEAK SNR'}
              </div>
            </div>

            {/* Metric 4: Processing Duration */}
            <div className="p-2.5 rounded-xl bg-[#101820] border border-[#22323D]">
              <div className="text-[10px] text-[#94A3B8]">PROCESSING LATENCY</div>
              <div className="text-sm font-bold text-[#00FFA3]">
                {demoData?.metrics?.processing_time_ms !== undefined
                  ? `${Number(demoData.metrics.processing_time_ms).toFixed(1)} ms`
                  : isSyntheticDemo
                  ? '254.2 ms'
                  : 'N/A'}
              </div>
              <div className="text-[9px] text-[#94A3B8] mt-0.5">
                {isSyntheticDemo ? 'BENCHMARK RUN' : 'WALL-CLOCK DURATION'}
              </div>
            </div>
          </div>

          {/* Scientific Disclaimer & Integrity Advisory */}
          <div className="flex items-start space-x-2 text-[10px] text-[#94A3B8] bg-[#050709]/60 p-2.5 rounded-lg border border-[#22323D]/50">
            <Info className="w-3.5 h-3.5 text-[#00E5FF] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <span className="text-[#DCE7EC] font-semibold">Integrity Advisory:</span> SSIM and PSNR values describe mathematical pixel fidelity against reference benchmarks and do not substitute for formal ground-truth validation. Portrait micro-contrast restoration is an optical visual enhancement and is not certified as verified biometric truth in legal identity proceedings.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
