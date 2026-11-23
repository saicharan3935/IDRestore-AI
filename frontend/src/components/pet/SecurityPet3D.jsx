import React, { useRef, useState, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Shield, EyeOff, KeyRound, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import { usePetAnimation } from './usePetAnimation';
import PetHead from './PetHead';
import PetArms from './PetArms';

// ==============================================================
// 3D BYTE ROBOTIC CHARACTER MESH
// ==============================================================
export function PetModel({
  passwordVisible = false,
  passwordFocused = false,
  isTypingPassword = false,
  loginPending = false,
  loginResult = 'idle',
  reducedMotion = false,
  cursorRef,
}) {
  const bodyGroupRef = useRef();
  const chestCoreRef = useRef();
  const thrusterRef = useRef();

  const { stateRef, update } = usePetAnimation({
    passwordVisible,
    passwordFocused,
    isTypingPassword,
    loginPending,
    loginResult,
    reducedMotion,
    cursorRef,
  });

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();
    const s = update(delta, time);

    if (!bodyGroupRef.current) return;

    // Idle floating zero-gravity levitation
    const motionScale = reducedMotion ? 0.05 : 1.0;
    const floatY = Math.sin(time * 2.0) * 0.045 * motionScale;
    const breathScale = 1.0 + Math.sin(time * 2.8) * 0.012 * motionScale;

    // Total Y combines idle floating and victory jump
    bodyGroupRef.current.position.y = -0.15 + floatY + s.jumpY;

    // Celebration 360 spin
    if (s.celebrateSpin > 0) {
      bodyGroupRef.current.rotation.y = s.celebrateSpin;
    } else {
      bodyGroupRef.current.rotation.y = THREE.MathUtils.damp(
        bodyGroupRef.current.rotation.y,
        0,
        6,
        delta
      );
    }

    bodyGroupRef.current.scale.set(breathScale, breathScale, breathScale);

    // Dynamic chest core color / intensity pulse
    if (chestCoreRef.current) {
      chestCoreRef.current.material.emissive.copy(s.eyeColor);
      chestCoreRef.current.material.emissiveIntensity = s.eyeIntensity * 0.8;
    }

    // Dynamic thruster ring pulse
    if (thrusterRef.current) {
      thrusterRef.current.material.opacity = 0.5 + Math.sin(time * 6) * 0.25;
    }
  });

  const isSuccess = loginResult === 'success';

  return (
    <group ref={bodyGroupRef} position={[0, -0.15, 0]}>
      {/* 1. TORSO: Sleek Black Chrome Capsule Pod */}
      <mesh position={[0, -0.12, 0]} castShadow receiveShadow>
        <capsuleGeometry args={[0.31, 0.44, 16, 24]} />
        <meshStandardMaterial
          color="#0B1117"
          roughness={0.25}
          metalness={0.92}
        />
      </mesh>

      {/* 2. CHEST SECURITY CYBER-CORE */}
      <mesh ref={chestCoreRef} position={[0, -0.06, 0.32]}>
        <cylinderGeometry args={[0.075, 0.075, 0.02, 24]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial
          color="#00E5FF"
          emissive="#00E5FF"
          emissiveIntensity={2.0}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Chest Core Outer Bezel Ring */}
      <mesh position={[0, -0.06, 0.325]}>
        <ringGeometry args={[0.08, 0.098, 24]} />
        <meshStandardMaterial color="#101820" roughness={0.3} metalness={0.9} />
      </mesh>

      {/* 3. ANTI-GRAVITY LEVITATION RING (Base Thruster) */}
      <mesh ref={thrusterRef} position={[0, -0.42, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.22, 0.015, 16, 32]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.65} />
      </mesh>

      {/* 4. HEAD ASSEMBLY */}
      <PetHead animState={stateRef} isSuccess={isSuccess} />

      {/* 5. ARMS ASSEMBLY (Articulated for Peek-a-Boo covering eyes) */}
      <PetArms animState={stateRef} />
    </group>
  );
}

// Holographic Floor Pedestal beneath BYTE
export function HolographicPedestal() {
  const ring1 = useRef();
  const ring2 = useRef();

  useFrame((_, delta) => {
    if (ring1.current) ring1.current.rotation.z += delta * 0.2;
    if (ring2.current) ring2.current.rotation.z -= delta * 0.15;
  });

  return (
    <group position={[0, -1.05, 0]} rotation={[-Math.PI / 2.3, 0, 0]}>
      {/* Outer Cyan Ring */}
      <mesh ref={ring1}>
        <ringGeometry args={[0.95, 0.98, 48]} />
        <meshBasicMaterial color="#00E5FF" transparent opacity={0.3} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Inner Mint Ring */}
      <mesh ref={ring2}>
        <ringGeometry args={[0.62, 0.64, 32]} />
        <meshBasicMaterial color="#00FFA3" transparent opacity={0.25} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* Soft Ground Shadow Disc */}
      <mesh position={[0, 0, -0.02]}>
        <circleGeometry args={[0.7, 32]} />
        <meshBasicMaterial color="#000000" transparent opacity={0.45} />
      </mesh>
    </group>
  );
}

// WebGL Fallback Card (in case 3D context is lost or unsupported)
function PetFallback({ passwordVisible }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center select-none font-mono">
      <div className="w-24 h-24 rounded-full bg-[#101820] border-2 border-[#00E5FF]/40 flex items-center justify-center shadow-cyan-glow mb-4 relative">
        <Sparkles className="w-10 h-10 text-[#00E5FF]" />
        {passwordVisible && (
          <div className="absolute inset-0 bg-[#050709]/90 rounded-full flex items-center justify-center border border-[#00FFA3]">
            <EyeOff className="w-8 h-8 text-[#00FFA3]" />
          </div>
        )}
      </div>
      <div className="text-xs font-bold text-[#F8FAFC]">BYTE &bull; SECURITY COMPANION</div>
      <div className="text-[10px] text-[#94A3B8] mt-1">2D ENCLAVE MONITOR ACTIVE</div>
    </div>
  );
}

// Dedicated Error Boundary protecting the 3D Canvas
class PetCanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    console.warn('[SecurityPet3D] WebGL or 3D character error caught by boundary:', error?.message);
    if (this.props.onError) {
      this.props.onError(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

function checkWebGLSupport() {
  if (typeof window === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2'))
    );
  } catch {
    return false;
  }
}

// ==============================================================
// MASTER EXPORT COMPONENT: SECURITY PET 3D
// ==============================================================
export default function SecurityPet3D({
  passwordVisible = false,
  passwordFocused = false,
  isTypingPassword = false,
  loginPending = false,
  loginResult = 'idle', // 'idle' | 'success' | 'error'
  className = '',
}) {
  const containerRef = useRef(null);
  const cursorRef = useRef({ x: 0, y: 0 });
  const [hasWebGlError, setHasWebGlError] = useState(() => !checkWebGLSupport());
  const [reducedMotion, setReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const handler = (e) => setReducedMotion(e.matches);
    if (query.addEventListener) query.addEventListener('change', handler);
    return () => {
      if (query.removeEventListener) query.removeEventListener('change', handler);
    };
  }, []);

  // Window-wide cursor tracking (Damped inside 3D useFrame, 0 React re-renders!)
  const handlePointerMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = Math.max(-1.5, Math.min(1.5, (e.clientX - centerX) / (window.innerWidth * 0.4)));
    const y = Math.max(-1.5, Math.min(1.5, (e.clientY - centerY) / (window.innerHeight * 0.4)));

    cursorRef.current.x = x;
    cursorRef.current.y = y;
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    return () => window.removeEventListener('mousemove', handlePointerMove);
  }, [handlePointerMove]);

  // Dynamic telemetry status badge text & icon
  const getStatusBadge = () => {
    if (loginResult === 'success') {
      return {
        text: 'IDENTITY CONFIRMED // ACCESS GRANTED',
        color: 'text-[#00FFA3] border-[#00FFA3]/50 bg-[#00FFA3]/10',
        icon: CheckCircle2,
      };
    }
    if (loginResult === 'error') {
      return {
        text: 'CREDENTIAL MISMATCH // ACCESS DENIED',
        color: 'text-[#FF5C5C] border-[#FF5C5C]/50 bg-[#FF5C5C]/10',
        icon: AlertCircle,
      };
    }
    if (loginPending) {
      return {
        text: 'VALIDATING ARGON2ID KEYSTREAM...',
        color: 'text-[#00E5FF] border-[#00E5FF]/50 bg-[#00E5FF]/10 animate-pulse',
        icon: Shield,
      };
    }
    if (passwordVisible) {
      return {
        text: 'EYE-SHIELD PROTOCOL ENGAGED (NO PEEKING)',
        color: 'text-[#00FFA3] border-[#00FFA3]/50 bg-[#00FFA3]/10',
        icon: EyeOff,
      };
    }
    if (passwordFocused) {
      return {
        text: 'KEYSTROKE PRIVACY ACTIVE',
        color: 'text-[#00E5FF] border-[#00E5FF]/50 bg-[#00E5FF]/10',
        icon: KeyRound,
      };
    }
    return {
      text: 'SENTINEL ACTIVE // TRACKING ENCLAVE',
      color: 'text-[#94A3B8] border-[#22323D] bg-[#101820]/80',
      icon: Shield,
    };
  };

  const status = getStatusBadge();
  const StatusIcon = status.icon;

  return (
    <div
      ref={containerRef}
      className={`relative rounded-3xl bg-[#0B1117]/85 backdrop-blur-2xl border border-[#22323D] overflow-hidden flex flex-col justify-between select-none shadow-[0_20px_60px_rgba(0,0,0,0.8)] ${className}`}
    >
      {/* Background Cyber Grid Accent */}
      <div className="absolute inset-0 scanline-grid opacity-15 pointer-events-none" />
      <div className="absolute -top-1 -left-1 w-5 h-5 border-t-2 border-l-2 border-[#00E5FF] z-20 pointer-events-none" />
      <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-2 border-r-2 border-[#00FFA3] z-20 pointer-events-none" />

      {/* Top Header HUD Strip */}
      <div className="relative z-20 p-4 border-b border-[#22323D]/70 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
          <span className="font-bold tracking-wider text-[#F8FAFC]">BYTE</span>
          <span className="text-[10px] text-[#94A3B8] hidden sm:inline">&bull; 3D SECURITY SENTINEL</span>
        </div>

        <div className="px-2.5 py-0.5 rounded-full bg-[#101820] border border-[#22323D] text-[10px] font-mono text-[#00FFA3]">
          v2.6 SEC-CORE
        </div>
      </div>

      {/* Center 3D Viewport */}
      <div className="relative flex-1 w-full min-h-[260px] sm:min-h-[320px] flex items-center justify-center">
        {hasWebGlError ? (
          <PetFallback passwordVisible={passwordVisible} />
        ) : (
          <PetCanvasErrorBoundary
            onError={() => setHasWebGlError(true)}
            fallback={<PetFallback passwordVisible={passwordVisible} />}
          >
            <Canvas
              camera={{ position: [0, 0.15, 2.7], fov: 42 }}
              gl={{
                antialias: true,
                alpha: true,
                powerPreference: 'high-performance',
              }}
              dpr={[1, 1.5]}
              style={{ background: 'transparent' }}
              onCreated={({ gl }) => {
                try {
                  gl.setClearColor(0x000000, 0);
                  if (gl.domElement) {
                    gl.domElement.addEventListener('webglcontextlost', (e) => {
                      e.preventDefault();
                      console.warn('[SecurityPet3D] WebGL context lost. Engaging 2D fallback.');
                      setHasWebGlError(true);
                    }, false);
                  }
                } catch (e) {
                  console.warn('[SecurityPet3D] gl onCreated error:', e?.message);
                }
              }}
            >
              {/* Obsidian Futurism 3-Point Lighting */}
              <ambientLight intensity={1.2} color="#101820" />
              <directionalLight position={[3.5, 4.5, 4.0]} intensity={2.2} color="#DCE7EC" />
              <directionalLight position={[-3.5, -1.0, -2.5]} intensity={2.4} color="#00E5FF" />
              <pointLight position={[0, -2.0, 1.2]} intensity={0.9} color="#00FFA3" distance={6} />

              <Suspense fallback={null}>
                <HolographicPedestal />
                <PetModel
                  passwordVisible={passwordVisible}
                  passwordFocused={passwordFocused}
                  isTypingPassword={isTypingPassword}
                  loginPending={loginPending}
                  loginResult={loginResult}
                  reducedMotion={reducedMotion}
                  cursorRef={cursorRef}
                />
              </Suspense>
            </Canvas>
          </PetCanvasErrorBoundary>
        )}

        {/* Peek-a-Boo Tooltip when covering eyes */}
        {passwordVisible && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 px-3 py-1 rounded-full bg-[#050709]/95 border border-[#00FFA3]/60 text-[10px] font-mono text-[#00FFA3] shadow-[0_0_15px_rgba(0,255,163,0.3)] animate-bounce pointer-events-none">
            🙈 EYES COVERED FOR PRIVACY
          </div>
        )}
      </div>

      {/* Bottom Reactive Status Strip */}
      <div className="relative z-20 p-3.5 border-t border-[#22323D]/70 bg-[#050709]/75 backdrop-blur-md">
        <div className={`flex items-center justify-center space-x-2 px-3 py-1.5 rounded-xl border text-[11px] font-mono transition-all duration-300 ${status.color}`}>
          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
          <span className="tracking-wide text-center truncate">{status.text}</span>
        </div>
      </div>
    </div>
  );
}
