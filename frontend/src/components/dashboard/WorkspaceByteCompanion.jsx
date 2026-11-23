import React, { useState, useEffect, useRef, useCallback, Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  Sparkles,
  Eye,
  Layers,
  FileText,
  Users,
  BarChart3,
  Settings as SettingsIcon,
  HelpCircle,
  Send,
  RotateCcw,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Bot,
  Zap,
  Shield,
  ArrowRight,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Compass,
  MessageSquare,
  CornerDownLeft
} from 'lucide-react';
import { PetModel, HolographicPedestal } from '../pet/SecurityPet3D';
import { api } from '../../services/api';

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

// Error Boundary protecting the 3D Canvas
class ByteCanvasErrorBoundary extends React.Component {
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
  currentTab = 'overview',
  onNavigateTab,
  user
}) {
  const navigate = onNavigateTab || (() => {});

  // State: collapsed (compact dock pill) vs expanded
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const saved = localStorage.getItem('idrestore_byte_collapsed');
      return saved !== null ? JSON.parse(saved) : true; // Default collapsed on load so it doesn't block initially
    } catch {
      return true;
    }
  });

  const [isMaximized, setIsMaximized] = useState(false);
  const [hasWebGlError, setHasWebGlError] = useState(() => !checkWebGLSupport());
  const [aiStatus, setAiStatus] = useState('LOCAL_FALLBACK_ACTIVE'); // 'GEMINI_ONLINE' | 'LOCAL_FALLBACK_ACTIVE'
  const [inputValue, setInputValue] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [telemetry, setTelemetry] = useState(null);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const cursorRef = useRef({ x: 0, y: 0 });

  // Verified user display name
  const userName = user?.full_name ? user.full_name.trim() : '';

  // Initial welcome message
  const initialWelcomeText = useMemo(() => {
    const greetingPrefix = userName ? `Hello ${userName}! 👋` : 'Hello! 👋';
    return `${greetingPrefix} Welcome to IDRestore AI.

I'm BYTE, your intelligent document restoration assistant.

I can help you restore damaged documents, analyze image quality, manage restoration history, process multiple files, and understand your workspace.

What would you like to do today?`;
  }, [userName]);

  // Conversation history
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: initialWelcomeText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        { label: 'Restore Image', action: 'navigate', target: 'restore' },
        { label: 'Analyze Document', action: 'navigate', target: 'analysis' },
        { label: 'Document History', action: 'navigate', target: 'history' },
        { label: 'Show Statistics', action: 'query', text: 'How many documents have been processed?' }
      ]
    }
  ]);

  // Context-aware hints for the current page
  const tabContextData = useMemo(() => {
    const contexts = {
      overview: {
        title: 'Mission Control Overview',
        hint: 'Would you like to see your processing statistics or recent restorations?',
        suggestedPrompts: [
          'How many documents have been processed?',
          'Show my recent restorations',
          'Explain the holographic document scanner'
        ]
      },
      restore: {
        title: 'Restoration Studio',
        hint: 'I can guide you through uploading and enhancing a document with OpenCV filters.',
        suggestedPrompts: [
          'How can I restore a blurry employee document?',
          'Why is my image still blurry?',
          'How do bilateral filtering and CLAHE work?'
        ]
      },
      analysis: {
        title: 'AI Quality Analysis',
        hint: 'I can explain detected issues, defect severities, and recommended operations.',
        suggestedPrompts: [
          'Analyze the quality of my uploaded image',
          'What is Gemini AI used for?',
          'What do the defect ratings mean?'
        ]
      },
      batch: {
        title: 'Batch Processing',
        hint: 'I can guide you through processing multiple employee dossiers simultaneously.',
        suggestedPrompts: [
          'How does batch processing work?',
          'What are the batch processing limits?',
          'Show my batch processing status'
        ]
      },
      history: {
        title: 'Document History & Audit',
        hint: 'I can help you locate, compare, or download previous restorations and audit reports.',
        suggestedPrompts: [
          'Show my recent restorations',
          'How can I download my restored document?',
          'What is in the forensic PDF audit certificate?'
        ]
      },
      migration: {
        title: 'HR Migration Center',
        hint: 'I can assist with bulk employee dossier onboarding into your enterprise HRMS.',
        suggestedPrompts: [
          'How does HR migration work?',
          'How do I map personnel files?',
          'Is data encrypted during HRMS transfer?'
        ]
      },
      analytics: {
        title: 'Restoration Analytics',
        hint: 'I can explain charts, defect distributions, and restoration throughput velocity.',
        suggestedPrompts: [
          'How many documents have been processed?',
          'What are our most common damage types?',
          'What is our SSIM fidelity rate?'
        ]
      },
      settings: {
        title: 'Workspace Settings',
        hint: 'I can help configure your Gemini API key, inspect neural models, and manage storage.',
        suggestedPrompts: [
          'Is Gemini AI currently connected?',
          'What neural models are registered?',
          'What is our storage retention policy?'
        ]
      }
    };
    return contexts[currentTab] || contexts.overview;
  }, [currentTab]);

  // Fetch initial telemetry to check AI config and stats
  useEffect(() => {
    let isMounted = true;
    api.getSettings()
      .then((settings) => {
        if (!isMounted) return;
        if (settings?.gemini?.is_configured) {
          setAiStatus('GEMINI_ONLINE');
        } else {
          setAiStatus('LOCAL_FALLBACK_ACTIVE');
        }
      })
      .catch(() => {
        if (isMounted) setAiStatus('LOCAL_FALLBACK_ACTIVE');
      });

    api.getDashboardStats()
      .then((statsRes) => {
        if (isMounted && statsRes?.stats) {
          setTelemetry(statsRes.stats);
        }
      })
      .catch(() => {});

    return () => { isMounted = false; };
  }, []);

  // Save collapsed state
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

  // Scroll to bottom of message list
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (!collapsed) {
      scrollToBottom();
    }
  }, [messages, collapsed]);

  // Track cursor for 3D mascot tilt
  const handlePointerMove = (e) => {
    const cx = window.innerWidth - 150;
    const cy = window.innerHeight - 200;
    const x = Math.max(-1.5, Math.min(1.5, (e.clientX - cx) / 200));
    const y = Math.max(-1.5, Math.min(1.5, (e.clientY - cy) / 200));
    cursorRef.current.x = x;
    cursorRef.current.y = y;
  };

  // Send message to backend
  const handleSendMessage = async (textToSend = null) => {
    const text = (textToSend !== null ? textToSend : inputValue).trim();
    if (!text || isSending) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg = {
      id: userMsgId,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    if (textToSend === null) setInputValue('');
    setIsSending(true);

    try {
      // Build conversation history for API
      const historyPayload = messages.slice(-6).map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content
      }));

      const res = await api.chatWithCopilot({
        message: text,
        currentPage: currentTab,
        currentTab: currentTab,
        conversationHistory: historyPayload,
        history: historyPayload
      });

      if (res.ai_status) {
        setAiStatus(res.ai_status);
      }
      if (res.live_data) {
        setTelemetry(res.live_data);
      }

      const botMsg = {
        id: `byte-${Date.now()}`,
        role: 'assistant',
        content: res.reply || 'I am standing by to assist with your document restoration.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedNavigation: res.suggested_navigation,
        suggestedActions: res.suggested_actions || [],
        liveData: res.live_data,
        contextHint: res.context_hint
      };

      setMessages((prev) => [...prev, botMsg]);

      // If user clearly commanded navigation (e.g. "open restore", "go to settings"),
      // and suggested_navigation is returned, trigger navigation automatically
      const lowerText = text.toLowerCase();
      if (
        (lowerText.startsWith('open ') || lowerText.startsWith('go to ') || lowerText.startsWith('take me to ')) &&
        res.suggested_navigation
      ) {
        navigate(res.suggested_navigation);
      }
    } catch (err) {
      console.error('Chat error:', err);
      const errorMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${err.message || 'Unable to process query. Please check server connection.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        suggestedActions: [
          { label: 'Retry Query', action: 'query', text: text },
          { label: 'Check Settings', action: 'navigate', target: 'settings' }
        ]
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key in input
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Reset conversation
  const handleClearConversation = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        content: initialWelcomeText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: [
          { label: 'Restore Image', action: 'navigate', target: 'restore' },
          { label: 'Analyze Document', action: 'navigate', target: 'analysis' },
          { label: 'Document History', action: 'navigate', target: 'history' },
          { label: 'Show Statistics', action: 'query', text: 'How many documents have been processed?' }
        ]
      }
    ]);
  };

  // Execute quick action
  const handleActionClick = (action) => {
    const rawTarget = action.target || (action.route ? action.route.replace('/dashboard/', '').replace('/', '') : null);
    if ((action.action === 'navigate' || action.route || action.target) && rawTarget) {
      navigate(rawTarget);
    } else if ((action.action === 'query' || action.text) && action.text) {
      handleSendMessage(action.text);
    }
  };

  // 8 Smart Quick Action Cards for Welcome Experience
  const quickActionCards = [
    {
      title: 'Restore Image',
      sub: 'Open enhancement studio',
      icon: Sparkles,
      color: '#00E5FF',
      onClick: () => navigate('restore')
    },
    {
      title: 'Analyze Document',
      sub: 'Detect optical defects',
      icon: Eye,
      color: '#00FFA3',
      onClick: () => navigate('analysis')
    },
    {
      title: 'Batch Processing',
      sub: 'Bulk multi-document queue',
      icon: Layers,
      color: '#DCE7EC',
      onClick: () => navigate('batch')
    },
    {
      title: 'Document History',
      sub: 'Audit manifests & records',
      icon: FileText,
      color: '#00E5FF',
      onClick: () => navigate('history')
    },
    {
      title: 'HR Migration Center',
      sub: 'Personnel dossier sync',
      icon: Users,
      color: '#00FFA3',
      onClick: () => navigate('migration')
    },
    {
      title: 'View Analytics',
      sub: 'Throughput & defect trends',
      icon: BarChart3,
      color: '#FFB547',
      onClick: () => navigate('analytics')
    },
    {
      title: 'Workspace Settings',
      sub: 'Gemini keys & registries',
      icon: SettingsIcon,
      color: '#DCE7EC',
      onClick: () => navigate('settings')
    },
    {
      title: 'Help & Support',
      sub: 'Guided walkthrough',
      icon: HelpCircle,
      color: '#00E5FF',
      onClick: () => handleSendMessage('Explain what IDRestore AI does and how it works.')
    }
  ];

  return (
    <div
      onMouseMove={handlePointerMove}
      className="fixed bottom-5 right-5 z-50 select-none flex flex-col items-end"
    >
      {/* ============================================================== */}
      {/* EXPANDED FULL-FEATURED COPILOT CHATBOT PANEL */}
      {/* ============================================================== */}
      {!collapsed && (
        <div
          className={`rounded-3xl bg-[#0B1117]/98 backdrop-blur-2xl border border-[#00E5FF]/40 shadow-[0_20px_80px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden transition-all duration-300 relative ${
            isMaximized
              ? 'w-[96vw] sm:w-[580px] h-[92vh] max-h-[850px] mb-2'
              : 'w-[92vw] sm:w-[460px] h-[640px] max-h-[86vh] mb-2'
          }`}
        >
          {/* Decorative Corner Accents */}
          <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#00E5FF] pointer-events-none z-30" />
          <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#00FFA3] pointer-events-none z-30" />
          <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#00FFA3] pointer-events-none z-30" />
          <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#00E5FF] pointer-events-none z-30" />

          {/* Top Gradient Ambient Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00E5FF] to-transparent opacity-90 z-30" />

          {/* 1. COPILOT HEADER WITH 3D AVATAR */}
          <div className="relative z-20 p-3.5 sm:p-4 border-b border-[#22323D] bg-[#050709]/80 backdrop-blur-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Mini 3D Avatar Mascot Box */}
              <div className="w-11 h-11 rounded-2xl bg-[#101820] border border-[#00E5FF]/50 relative overflow-hidden flex items-center justify-center shadow-cyan-glow group">
                {hasWebGlError ? (
                  <Bot className="w-6 h-6 text-[#00E5FF]" />
                ) : (
                  <ByteCanvasErrorBoundary fallback={<Bot className="w-6 h-6 text-[#00E5FF]" />}>
                    <Canvas
                      camera={{ position: [0, 0.1, 2.5], fov: 42 }}
                      gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
                      dpr={[1, 1.2]}
                      style={{ background: 'transparent' }}
                    >
                      <ambientLight intensity={1.4} color="#101820" />
                      <directionalLight position={[3.0, 4.0, 3.5]} intensity={2.2} color="#DCE7EC" />
                      <directionalLight position={[-3.0, -1.0, -2.0]} intensity={2.4} color="#00E5FF" />
                      <pointLight position={[0, -2.0, 1.0]} intensity={0.9} color="#00FFA3" distance={4} />

                      <Suspense fallback={null}>
                        <HolographicPedestal />
                        <PetModel
                          passwordVisible={false}
                          passwordFocused={false}
                          isTypingPassword={isSending}
                          loginPending={isSending}
                          loginResult={isSending ? 'success' : 'idle'}
                          reducedMotion={false}
                          cursorRef={cursorRef}
                        />
                      </Suspense>
                    </Canvas>
                  </ByteCanvasErrorBoundary>
                )}
                {/* Status Dot */}
                <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-[#00FFA3] ring-2 ring-[#050709] animate-pulse" />
              </div>

              {/* Title & AI Status Pill */}
              <div className="flex flex-col text-left">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono font-extrabold tracking-wider text-[#F8FAFC]">
                    BYTE
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 font-bold">
                    AI COPILOT
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 mt-0.5">
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      aiStatus === 'GEMINI_ONLINE' ? 'bg-[#00FFA3]' : 'bg-[#FFB547]'
                    }`}
                  />
                  <span className="text-[9px] font-mono text-[#94A3B8]">
                    {aiStatus === 'GEMINI_ONLINE' ? 'GEMINI 2.5 ONLINE' : 'OFFLINE CV INTELLIGENCE'}
                  </span>
                </div>
              </div>
            </div>

            {/* Header Control Buttons */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleClearConversation}
                title="Clear Conversation"
                className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#101820] transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setIsMaximized(!isMaximized)}
                title={isMaximized ? 'Restore Size' : 'Maximize Panel'}
                className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#00E5FF] hover:bg-[#101820] transition-colors hidden sm:inline-flex"
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={toggleCollapsed}
                title="Minimize BYTE"
                className="p-1.5 rounded-xl text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#101820] transition-colors"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. CONTEXT-AWARE ASSISTANCE STRIP */}
          <div className="relative z-10 px-3.5 py-2 bg-[#101820]/90 border-b border-[#22323D] flex items-center justify-between text-left">
            <div className="flex items-center space-x-2 truncate">
              <Compass className="w-3.5 h-3.5 text-[#00E5FF] shrink-0" />
              <span className="text-[10px] font-mono text-[#00E5FF] font-bold uppercase truncate">
                {tabContextData.title}
              </span>
              <span className="text-[10px] font-mono text-[#94A3B8] truncate hidden sm:inline">
                &bull; {tabContextData.hint}
              </span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#050709] border border-[#22323D] text-[#DCE7EC] shrink-0 ml-2">
              CONTEXT ACTIVE
            </span>
          </div>

          {/* 3. SCROLLABLE CONVERSATION STREAM */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 text-left custom-scrollbar">
            {/* Quick Action Cards (Visible when conversation is starting) */}
            {messages.length <= 2 && (
              <div className="space-y-2 mb-4">
                <div className="text-[10px] font-mono font-bold tracking-wider text-[#94A3B8] uppercase flex items-center space-x-1.5">
                  <Zap className="w-3 h-3 text-[#00FFA3]" />
                  <span>SMART WORKSPACE QUICK ACTIONS</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {quickActionCards.map((card, idx) => {
                    const CardIcon = card.icon;
                    return (
                      <button
                        key={idx}
                        onClick={card.onClick}
                        className="p-2.5 rounded-xl bg-[#101820]/80 border border-[#22323D] hover:border-[#00E5FF]/50 hover:bg-[#17232C] transition-all flex items-start space-x-2 text-left group"
                      >
                        <div
                          className="p-1.5 rounded-lg shrink-0 group-hover:scale-110 transition-transform"
                          style={{
                            background: `${card.color}15`,
                            border: `1px solid ${card.color}30`
                          }}
                        >
                          <CardIcon className="w-3.5 h-3.5" style={{ color: card.color }} />
                        </div>
                        <div className="overflow-hidden">
                          <div className="text-xs font-mono font-bold text-[#F8FAFC] group-hover:text-[#00E5FF] transition-colors truncate">
                            {card.title}
                          </div>
                          <div className="text-[9px] font-mono text-[#94A3B8] truncate">
                            {card.sub}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Message Bubble List */}
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1.5`}
                >
                  <div className="flex items-center space-x-1.5 text-[9px] font-mono text-[#94A3B8]">
                    <span>{isUser ? (userName || 'You') : 'BYTE'}</span>
                    <span>&bull;</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl max-w-[90%] text-xs font-mono leading-relaxed whitespace-pre-wrap break-words ${
                      isUser
                        ? 'bg-[#17232C] text-[#F8FAFC] border border-[#00E5FF]/40 rounded-tr-sm shadow-[0_4px_20px_rgba(0,229,255,0.15)]'
                        : msg.isError
                        ? 'bg-[#FF5C5C]/10 text-[#FF5C5C] border border-[#FF5C5C]/40 rounded-tl-sm'
                        : 'bg-[#101820]/95 text-[#DCE7EC] border border-[#22323D] rounded-tl-sm shadow-[0_4px_20px_rgba(0,0,0,0.5)]'
                    }`}
                  >
                    {msg.content}

                    {/* Live Data Badge Pills if returned */}
                    {msg.liveData && (
                      <div className="mt-3 pt-2.5 border-t border-[#22323D] grid grid-cols-2 gap-2 text-[10px] font-mono">
                        {msg.liveData.total_documents !== undefined && (
                          <div className="p-1.5 rounded-lg bg-[#050709] border border-[#22323D]">
                            <span className="text-[#94A3B8]">Total Ingested: </span>
                            <span className="font-bold text-[#00E5FF]">{msg.liveData.total_documents}</span>
                          </div>
                        )}
                        {msg.liveData.success_rate_percent !== undefined && (
                          <div className="p-1.5 rounded-lg bg-[#050709] border border-[#22323D]">
                            <span className="text-[#94A3B8]">SSIM Fidelity: </span>
                            <span className="font-bold text-[#00FFA3]">{msg.liveData.success_rate_percent}%</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Suggested Navigation Action Card */}
                    {msg.suggestedNavigation && (
                      <div className="mt-3 p-2.5 rounded-xl bg-[#050709] border border-[#00E5FF]/40 flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-[10px] font-mono text-[#00E5FF] font-bold uppercase">
                          <Zap className="w-3.5 h-3.5" />
                          <span>Direct Route Ready</span>
                        </div>
                        <button
                          onClick={() => navigate(msg.suggestedNavigation)}
                          className="px-3 py-1 rounded-lg bg-[#00E5FF] text-black font-bold text-[10px] hover:bg-[#33EBFF] transition-all flex items-center space-x-1 shadow-cyan-glow"
                        >
                          <span>Open {msg.suggestedNavigation.toUpperCase()}</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {/* Suggested Follow-up Action Chips */}
                    {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-[#22323D]/60 flex flex-wrap gap-1.5">
                        {msg.suggestedActions.map((act, i) => (
                          <button
                            key={i}
                            onClick={() => handleActionClick(act)}
                            className="px-2.5 py-1 rounded-lg bg-[#050709] hover:bg-[#17232C] border border-[#00FFA3]/30 hover:border-[#00FFA3] text-[#00FFA3] hover:text-[#F8FAFC] text-[10px] font-mono font-semibold transition-all flex items-center space-x-1 active:scale-95"
                          >
                            <span>{act.label}</span>
                            <ArrowRight className="w-2.5 h-2.5 opacity-70" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isSending && (
              <div className="flex items-center space-x-2 text-xs font-mono text-[#00E5FF] p-2">
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-[#DCE7EC] animate-bounce [animation-delay:0.4s]" />
                </div>
                <span className="text-[10px] text-[#94A3B8]">BYTE is analyzing telemetry...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* 4. CONTEXTUAL PROMPT CHIPS */}
          <div className="px-3 py-1.5 bg-[#050709]/60 border-t border-[#22323D] flex items-center space-x-1.5 overflow-x-auto custom-scrollbar">
            <span className="text-[9px] font-mono text-[#94A3B8] shrink-0 uppercase">Suggestions:</span>
            {tabContextData.suggestedPrompts.map((promptText, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(promptText)}
                className="px-2 py-0.5 rounded-full bg-[#101820] hover:bg-[#17232C] border border-[#22323D] hover:border-[#00E5FF]/40 text-[#DCE7EC] text-[9px] font-mono whitespace-nowrap transition-colors"
              >
                {promptText}
              </button>
            ))}
          </div>

          {/* 5. MESSAGE INPUT BAR */}
          <div className="p-3 bg-[#050709]/95 border-t border-[#22323D] flex items-center space-x-2">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              placeholder={`Ask BYTE about ${tabContextData.title.toLowerCase()} or restoration...`}
              className="flex-1 bg-[#101820] border border-[#22323D] focus:border-[#00E5FF] rounded-xl px-3.5 py-2.5 text-xs font-mono text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#00E5FF] transition-all disabled:opacity-50"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputValue.trim() || isSending}
              className="p-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00FFA3] text-black font-bold hover:shadow-cyan-glow transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 shrink-0"
            >
              <Send className="w-4 h-4 text-black" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* COLLAPSED DOCKED COMPACT PILL / BADGE */}
      {/* ============================================================== */}
      {collapsed && (
        <button
          onClick={toggleCollapsed}
          title="Open BYTE AI Copilot"
          className="group relative flex items-center space-x-2.5 px-3.5 py-2.5 rounded-full bg-[#0B1117]/95 border border-[#00E5FF]/50 backdrop-blur-md shadow-[0_10px_35px_rgba(0,0,0,0.85)] hover:border-[#00E5FF] hover:shadow-cyan-glow transition-all duration-300"
        >
          {/* Outer Pulse Sheen */}
          <span className="absolute -inset-0.5 rounded-full bg-gradient-to-r from-[#00E5FF] to-[#00FFA3] opacity-25 group-hover:opacity-75 blur-sm transition-opacity" />

          {/* 3D Mini Mascot Orb */}
          <div className="relative z-10 w-7 h-7 rounded-full bg-[#101820] border border-[#00E5FF] flex items-center justify-center overflow-hidden">
            <Bot className="w-4 h-4 text-[#00E5FF] group-hover:scale-110 transition-transform" />
          </div>

          {/* Text Labels */}
          <div className="relative z-10 flex flex-col text-left">
            <div className="flex items-center space-x-1.5 leading-none">
              <span className="text-[11px] font-mono font-extrabold text-[#F8FAFC] tracking-wider">
                BYTE
              </span>
              <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#00FFA3]/20 text-[#00FFA3] font-bold">
                COPILOT
              </span>
            </div>
            <span className="text-[8px] font-mono text-[#94A3B8] leading-none mt-1 flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] inline-block mr-1 animate-pulse" />
              {tabContextData.title.split(' ')[0]} Active
            </span>
          </div>

          <ChevronUp className="relative z-10 w-4 h-4 text-[#94A3B8] group-hover:text-[#00E5FF] transition-colors ml-1" />
        </button>
      )}
    </div>
  );
}
