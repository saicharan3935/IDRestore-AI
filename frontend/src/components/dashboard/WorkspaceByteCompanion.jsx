import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Sparkles,
  ChevronDown,
  ChevronUp,
  Bot,
  MessageSquare,
  Shield,
  Zap,
  ArrowRight
} from 'lucide-react';
import { PetModel, HolographicPedestal } from '../pet/SecurityPet3D';

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

// Dedicated Error Boundary protecting BYTE canvas
class ByteErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err) {
    console.warn('[WorkspaceByteCompanion] 3D canvas caught error:', err?.message);
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

export default function WorkspaceByteCompanion({
  stats,
  onNavigateTab
}) {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('idrestore_byte_collapsed');
      return saved !== null ? JSON.parse(saved) : false;
    } catch {
      return false;
    }
  });

  const [hasWebGlError, setHasWebGlError] = useState(() => !checkWebGLSupport());
  const [messageIndex, setMessageIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const cursorRef = useRef({ x: 0, y: 0 });

  // Persist collapsed state
  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('idrestore_byte_collapsed', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save companion state:', e);
      }
      return next;
    });
  };

  // Generate contextual telemetry speeches
  const getContextualMessages = useCallback(() => {
    const msgs = [];
    const total = stats?.total_documents || 0;
    const review = stats?.requiring_review || 0;
    const successRate = stats?.success_rate_percent || 100;
    const avgTime = stats?.average_processing_time_ms || 0;

    if (review > 0) {
      msgs.push(`Operator Alert: ${review} document${review > 1 ? 's' : ''} flagged for manual review.`);
    }

    if (total > 0) {
      msgs.push(`Restoration matrix optimal: ${successRate}% fidelity across ${total} records.`);
    } else {
      msgs.push('Mission Control online. Ready for archival document ingestion.');
    }

    if (avgTime > 0) {
      msgs.push(`Average OpenCV inference latency: ${avgTime}ms per document.`);
    }

    msgs.push('Argon2id identity enclaves secure. Zero telemetry leakage.');
    return msgs;
  }, [stats]);

  const messages = getContextualMessages();

  // Cycle speech bubbles periodically
  useEffect(() => {
    if (collapsed) return;
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % messages.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [collapsed, messages.length]);

  // Subtle mouse tracking relative to companion pod
  const handlePointerMove = (e) => {
    const cx = window.innerWidth - 130;
    const cy = window.innerHeight - 150;
    const x = Math.max(-1.5, Math.min(1.5, (e.clientX - cx) / 200));
    const y = Math.max(-1.5, Math.min(1.5, (e.clientY - cy) / 200));
    cursorRef.current.x = x;
    cursorRef.current.y = y;
  };

  const handleCompanionClick = () => {
    setIsInteracting(true);
    setMessageIndex((prev) => (prev + 1) % messages.length);
    setTimeout(() => setIsInteracting(false), 2000);
  };

  return (
    <div
      onMouseMove={handlePointerMove}
      className="fixed bottom-5 right-5 z-40 select-none flex flex-col items-end"
    >
      {/* Expanded Companion Pod */}
      {!collapsed && (
        <div className="w-72 rounded-2xl bg-[#0B1117]/95 backdrop-blur-xl border border-[#00E5FF]/30 shadow-[0_12px_40px_rgba(0,0,0,0.85)] p-3 mb-2 flex flex-col relative transition-all duration-300">
          {/* Top Decorative Cyber Accents */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-80" />
          <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-[#00E5FF]" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-[#00FFA3]" />

          {/* Pod Header Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-[#22323D]/60 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
              <span className="font-bold text-[#F8FAFC]">BYTE</span>
              <span className="text-[10px] text-[#94A3B8]">AI COPILOT</span>
            </div>

            <div className="flex items-center space-x-1">
              <button
                onClick={handleCompanionClick}
                title="Next status message"
                className="p-1 rounded text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#101820] transition-colors"
              >
                <MessageSquare className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={toggleCollapsed}
                title="Minimize BYTE"
                className="p-1 rounded text-[#94A3B8] hover:text-[#DCE7EC] hover:bg-[#101820] transition-colors"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* 3D Character Viewport */}
          <div
            onClick={handleCompanionClick}
            className="relative w-full h-36 flex items-center justify-center cursor-pointer group"
          >
            {hasWebGlError ? (
              <div className="flex flex-col items-center justify-center text-center p-2 font-mono">
                <div className="w-12 h-12 rounded-full bg-[#101820] border border-[#00E5FF]/40 flex items-center justify-center mb-1 shadow-cyan-glow">
                  <Bot className="w-6 h-6 text-[#00E5FF]" />
                </div>
                <div className="text-[10px] text-[#00FFA3]">2D ENCLAVE MODE</div>
              </div>
            ) : (
              <ByteErrorBoundary
                fallback={
                  <div className="flex flex-col items-center justify-center text-center p-2 font-mono">
                    <Bot className="w-8 h-8 text-[#00E5FF] mb-1" />
                    <span className="text-[10px] text-[#94A3B8]">BYTE Online</span>
                  </div>
                }
              >
                <Canvas
                  camera={{ position: [0, 0.15, 2.5], fov: 42 }}
                  gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
                  dpr={[1, 1.5]}
                  style={{ background: 'transparent' }}
                  onCreated={({ gl }) => {
                    gl.setClearColor(0x000000, 0);
                  }}
                >
                  <ambientLight intensity={1.2} color="#101820" />
                  <directionalLight position={[3.5, 4.5, 4.0]} intensity={2.0} color="#DCE7EC" />
                  <directionalLight position={[-3.5, -1.0, -2.5]} intensity={2.2} color="#00E5FF" />
                  <pointLight position={[0, -2.0, 1.2]} intensity={0.8} color="#00FFA3" distance={5} />

                  <Suspense fallback={null}>
                    <HolographicPedestal />
                    <PetModel
                      passwordVisible={false}
                      passwordFocused={false}
                      isTypingPassword={false}
                      loginPending={false}
                      loginResult={isInteracting ? 'success' : 'idle'}
                      reducedMotion={false}
                      cursorRef={cursorRef}
                    />
                  </Suspense>
                </Canvas>
              </ByteErrorBoundary>
            )}

            {/* Tap to interact hint */}
            <div className="absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity text-[9px] font-mono text-[#00E5FF]/70">
              CLICK TO CHAT
            </div>
          </div>

          {/* Contextual Speech Bubble */}
          <div className="p-2.5 rounded-xl bg-[#050709]/80 border border-[#22323D] text-[11px] font-mono text-[#DCE7EC] relative min-h-[44px] flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] shrink-0 mr-2 animate-pulse" />
            <p className="line-clamp-2 leading-tight">
              {messages[messageIndex] || 'Telemetry active.'}
            </p>
          </div>

          {/* Fast Navigation Shortcut */}
          {onNavigateTab && (
            <div className="mt-2 pt-2 border-t border-[#22323D]/50 flex items-center justify-between text-[10px] font-mono">
              <button
                onClick={() => onNavigateTab('restore')}
                className="text-[#00E5FF] hover:underline flex items-center space-x-1"
              >
                <Zap className="w-3 h-3" />
                <span>Launch Studio</span>
                <ArrowRight className="w-2.5 h-2.5" />
              </button>
              <button
                onClick={() => onNavigateTab('history')}
                className="text-[#94A3B8] hover:text-[#DCE7EC] transition-colors"
              >
                Audit Records
              </button>
            </div>
          )}
        </div>
      )}

      {/* Minimized Docked Capsule Button */}
      {collapsed && (
        <button
          onClick={toggleCollapsed}
          title="Open BYTE AI Companion"
          className="group relative flex items-center space-x-2 px-3 py-2 rounded-full bg-[#0B1117]/95 border border-[#00E5FF]/40 backdrop-blur-md shadow-[0_8px_25px_rgba(0,0,0,0.8)] hover:border-[#00E5FF] hover:shadow-cyan-glow transition-all duration-300"
        >
          {/* Subtle Outer Pulse Glow */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#00FFA3] opacity-20 group-hover:opacity-60 blur-sm transition-opacity" />

          <div className="relative z-10 w-6 h-6 rounded-full bg-[#101820] border border-[#00E5FF] flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-[#00E5FF] group-hover:scale-110 transition-transform" />
          </div>

          <div className="relative z-10 flex flex-col text-left">
            <span className="text-[10px] font-mono font-bold text-[#F8FAFC] tracking-wider leading-none">
              BYTE
            </span>
            <span className="text-[8px] font-mono text-[#00FFA3] leading-none mt-0.5 flex items-center">
              <span className="w-1 h-1 rounded-full bg-[#00FFA3] inline-block mr-1 animate-pulse" />
              ACTIVE
            </span>
          </div>

          <ChevronUp className="relative z-10 w-3.5 h-3.5 text-[#94A3B8] group-hover:text-[#00E5FF] transition-colors ml-1" />
        </button>
      )}
    </div>
  );
}
