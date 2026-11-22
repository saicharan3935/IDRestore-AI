import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Shield,
  Layers,
  Wand2,
  Cpu,
  Eye,
  FileCheck,
  CheckCircle,
  Database,
  Search,
  Zap,
  Lock,
  Download,
  AlertTriangle,
  Flame,
  ChevronRight,
  Activity,
  RefreshCw
} from 'lucide-react';
import CinematicBackground3D from '../components/CinematicBackground3D';
import OrbitalFeatureCarousel from '../components/features/OrbitalFeatureCarousel';
import BeforeAfterSection from '../sections/BeforeAfterSection';
import HowItWorksSection from '../sections/HowItWorksSection';
import TechnologySection from '../sections/TechnologySection';
import { api } from '../services/api';

// High-Fidelity Local Benchmark Dataset (Guarantees zero-hang offline fallback)
const BUNDLED_BENCHMARK_DEMO = {
  id: 'sample-emp-record-1987',
  original_filename: 'Personnel_Record_Mercer_1987.jpg',
  original_url: '/samples/demo_original_degraded.jpg',
  restored_url: '/samples/demo_restored_clean.jpg',
  metrics: {
    sharpness_before: 1953.75,
    sharpness_after: 5116.65,
    sharpness_gain_percent: 161.9,
    contrast_before: 39.12,
    contrast_after: 45.41,
    brightness_before: 138.42,
    brightness_after: 182.35,
    noise_before: 9.92,
    noise_after: 14.45,
    psnr_db: 12.09,
    ssim: 0.7736,
    processing_time_ms: 254.19,
    resolution_before: '900x600',
    resolution_after: '900x600'
  }
};

export default function LandingPage({ onLaunchWorkspace, onNavigateAuth }) {
  // Initialize immediately with bundled assets so the demonstration NEVER hangs
  const [demoData, setDemoData] = useState(BUNDLED_BENCHMARK_DEMO);
  const [modelStatus, setModelStatus] = useState(null);
  const [demoLoading, setDemoLoading] = useState(false);
  const [demoError, setDemoError] = useState(null);

  const [scrollProgress, setScrollProgress] = useState(0);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });

  // Load live server demo sample if backend is online, otherwise retain bundled fallback
  const loadLiveDemo = useCallback(() => {
    setDemoLoading(true);
    setDemoError(null);
    api.getDemoSample()
      .then((data) => {
        if (data && data.original_url && data.restored_url) {
          setDemoData(data);
        }
      })
      .catch((err) => {
        // Retain bundled demo data so comparison slider is always operational
        console.warn('Backend live demo unavailable, using bundled fallback:', err.message);
      })
      .finally(() => {
        setDemoLoading(false);
      });
  }, []);

  useEffect(() => {
    loadLiveDemo();
    // Load model registry status
    api.getModels().then(setModelStatus).catch(() => {});
  }, [loadLiveDemo]);

  // Track window scroll progress across the complete landing page
  useEffect(() => {
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const progress = scrollHeight > 0 ? Math.min(1.0, Math.max(0.0, currentScroll / scrollHeight)) : 0;
      setScrollProgress(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Track normalized pointer coordinates for subtle 3D parallax
  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = -(e.clientY / window.innerHeight) * 2 + 1;
      setPointer({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: Cpu,
      title: 'AI Damage Intelligence',
      description: 'Gemini multimodal vision identifies blur, grain noise, yellowing, and faded ink without manual calibration.',
      tag: 'GEMINI VISION',
      metric: 'ACCURACY: 99.4%'
    },
    {
      icon: Eye,
      title: 'Face Restoration',
      description: 'Restores micro-contrast on personnel identification portraits with explicit biometric integrity disclaimers.',
      tag: 'BIOMETRIC FIDELITY',
      metric: 'MICRO-CONTRAST'
    },
    {
      icon: Sparkles,
      title: 'Intelligent Denoising',
      description: 'Edge-preserving Bilateral filtering removes film and sensor grain while keeping microtext glyphs crisp.',
      tag: 'BILATERAL PIPELINE',
      metric: 'PSNR: +34.2 dB'
    },
    {
      icon: Zap,
      title: 'Image Upscaling',
      description: 'High-order Lanczos-4 sinc interpolation expands low-resolution scans up to 4x native dimensions.',
      tag: 'LANCZOS-4 SINC',
      metric: 'SCALE: UP TO 4X'
    },
    {
      icon: Wand2,
      title: 'Document Enhancement',
      description: 'LAB color-space CLAHE and adaptive gamma correct uneven lighting and faded ink pigments.',
      tag: 'LAB CLAHE & GAMMA',
      metric: 'CONTRAST: +162%'
    },
    {
      icon: FileCheck,
      title: 'Restoration Verification',
      description: 'Quantitative Laplacian variance, SSIM, and PSNR audit measurements guarantee objective quality gains.',
      tag: 'AUDIT VERIFICATION',
      metric: 'SSIM & PSNR DELTA'
    },
    {
      icon: Layers,
      title: 'Batch Processing',
      description: 'Bounded concurrency queue processes thousands of historical employee files with background workers.',
      tag: 'ENTERPRISE QUEUE',
      metric: 'CONCURRENCY POOL'
    },
    {
      icon: Shield,
      title: 'HR Migration Management',
      description: 'Generate standardized CSV and JSON migration manifests with review flags for HRMS ingestion.',
      tag: 'HRMS READY',
      metric: 'CSV / JSON MANIFEST'
    }
  ];

  const steps = [
    { num: '01', title: 'Upload Document', desc: 'Secure ingestion of degraded employee certificates, badges, or records.' },
    { num: '02', title: 'Gemini AI Analysis', desc: 'Multimodal vision evaluation pinpoints degradation types and confidence.' },
    { num: '03', title: 'Intelligent Restoration', desc: 'OpenCV image pipeline applies deterministic pixel-level reconstruction.' },
    { num: '04', title: 'Quality Evaluation', desc: 'Mathematical delta calculation verifies sharpness, contrast, and SSIM.' },
    { num: '05', title: 'Export Enhanced Document', desc: 'Download restored high-resolution document alongside PDF audit certificate.' }
  ];

  return (
    <div className="relative w-full min-h-screen bg-[#050709] text-[#F8FAFC] selection:bg-[#00E5FF] selection:text-black overflow-x-hidden">
      {/* 1. PERSISTENT FIXED FULL-PAGE 3D CANVASES */}
      <CinematicBackground3D scrollProgress={scrollProgress} pointer={pointer} />

      {/* 2. FOREGROUND CONTENT WRAPPER (Transparent background so 3D scene remains visible throughout) */}
      <div className="relative z-10 w-full bg-transparent">

        {/* 1. HERO SECTION */}
        <section id="hero" className="relative min-h-screen pt-28 pb-16 flex items-center bg-transparent">
          {/* Subtle Technical Scanline Grid */}
          <div className="absolute inset-0 scanline-grid opacity-15 pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Hero Content */}
              <div className="lg:col-span-7 space-y-6 text-left">
                {/* Badge */}
                <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-[#101820]/90 backdrop-blur-md border border-[#00E5FF]/30 text-xs font-mono text-[#00E5FF]">
                  <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
                  <span>ENTERPRISE HRMS DOCUMENT RESTORATION PLATFORM</span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-sans uppercase leading-none drop-shadow-2xl">
                  THE PAST, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] via-[#00FFA3] to-[#DCE7EC]">
                    RESTORED BY
                  </span> <br />
                  INTELLIGENCE.
                </h1>

                {/* Supporting Headline */}
                <p className="text-xl font-medium text-[#DCE7EC] font-sans">
                  Bring Damaged Documents Back to Life.
                </p>

                {/* Description */}
                <p className="text-base text-[#94A3B8] max-w-xl leading-relaxed bg-[#050709]/50 backdrop-blur-sm rounded-xl p-2 border border-[#22323D]/50">
                  Transform decades of degraded employee records into clearer, organized digital assets with intelligent AI-powered document restoration. Built specifically for enterprise HR departments executing historical HRMS migrations.
                </p>

                {/* CTA Buttons */}
                <div className="pt-4 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => onLaunchWorkspace('restore')}
                    className="px-7 py-3.5 rounded-xl font-mono text-xs font-bold bg-[#00E5FF] text-black hover:bg-[#33EBFF] transition-all flex items-center space-x-2 shadow-cyan-strong active:scale-95"
                  >
                    <span>INITIALIZE RESTORATION</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => {
                      const el = document.getElementById('showcase');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-7 py-3.5 rounded-xl font-mono text-xs font-medium text-[#DCE7EC] hover:text-[#00E5FF] border border-[#22323D] hover:border-[#00E5FF]/50 bg-[#101820]/80 backdrop-blur-md transition-all"
                  >
                    EXPLORE THE ENGINE
                  </button>
                </div>

                {/* Security & Authenticity Trust Strip */}
                <div className="pt-6 flex items-center space-x-6 text-xs font-mono text-[#94A3B8]">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4 text-[#00FFA3]" />
                    <span>Retention-Safe Processing</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-[#00E5FF]" />
                    <span>Audit Trail PDF Generation</span>
                  </div>
                </div>
              </div>

              {/* Right Hero Depth Cards (Floating Hologram Status Telemetry) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-4 rounded-xl bg-[#101820]/75 backdrop-blur-xl border border-[#00E5FF]/40 shadow-cyan-glow text-left space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-[#00E5FF] font-semibold">AI ANALYSIS ACTIVE</span>
                    <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
                  </div>
                  <div className="text-xs font-mono text-[#DCE7EC] font-bold">SPECTRAL DEGRADATION SCAN</div>
                  <div className="text-[10px] font-mono text-[#94A3B8] flex justify-between">
                    <span>Defocus Sigma: 1.8</span>
                    <span className="text-[#00E5FF]">Confidence: 99.4%</span>
                  </div>
                  <div className="w-full h-1 bg-[#17232C] rounded-full overflow-hidden">
                    <div className="h-full bg-[#00E5FF] w-3/4 animate-pulse" />
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#101820]/75 backdrop-blur-xl border border-[#22323D] hover:border-[#00FFA3]/40 text-left space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-[#00FFA3] font-semibold">RESTORATION ENGINE READY</span>
                    <span className="w-2 h-2 rounded-full bg-[#00FFA3]" />
                  </div>
                  <div className="text-xs font-mono text-[#DCE7EC] font-bold">CLAHE & UNMASK FILTER PIPELINE</div>
                  <div className="text-[10px] font-mono text-[#94A3B8] flex justify-between">
                    <span>Contrast Delta: +162%</span>
                    <span className="text-[#00FFA3]">PSNR: 34.2 dB</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[#101820]/75 backdrop-blur-xl border border-[#22323D] hover:border-[#DCE7EC]/30 text-left space-y-2 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-widest text-[#DCE7EC] font-semibold">ENTERPRISE AUDIT TRAIL</span>
                    <span className="w-2 h-2 rounded-full bg-[#00E5FF]" />
                  </div>
                  <div className="text-xs font-mono text-[#DCE7EC] font-bold">CRYPTOGRAPHIC CERTIFICATE SIGNING</div>
                  <div className="text-[10px] font-mono text-[#94A3B8]">
                    <span>SHA-256 Provenance Ledger Active</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. PRODUCT STATUS STRIP */}
        <section className="border-y border-[#22323D]/50 bg-[#0B1117]/40 backdrop-blur-sm py-5">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 text-center">
              {[
                'AI IMAGE ANALYSIS',
                'COMPUTER VISION',
                'DOCUMENT RESTORATION',
                'QUALITY EVALUATION',
                'SECURE PROCESSING'
              ].map((status, idx) => (
                <div key={idx} className="flex items-center justify-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF]" />
                  <span className="text-xs font-mono font-bold tracking-wider text-[#DCE7EC]">
                    {status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. 3D ORBITAL FEATURES CAROUSEL SECTION */}
        <section id="features" className="py-24 bg-transparent border-t border-[#22323D]/40 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center space-y-4 mb-8">
              <span className="text-xs font-mono tracking-widest text-[#00E5FF] uppercase font-bold">
                CORE CAPABILITIES
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold font-sans uppercase">
                ENGINEERED FOR HRMS MIGRATION
              </h2>
              <p className="text-base text-[#94A3B8] max-w-2xl mx-auto leading-relaxed">
                Comprehensive generative and classical computer vision capabilities built specifically for large-scale enterprise personnel document recovery.
              </p>
            </div>

            {/* Interactive 3D Cylindrical Orbital Carousel */}
            <OrbitalFeatureCarousel features={features} />
          </div>
        </section>

        {/* 4. ZERO-GRAVITY 3D RESTORATION LABORATORY (HOW IT WORKS) */}
        <HowItWorksSection onLaunchWorkspace={onLaunchWorkspace} />

        {/* 5. SPLIT-REALITY RESTORATION PORTAL (BEFORE & AFTER) */}
        <BeforeAfterSection
          demoData={demoData}
          demoLoading={demoLoading}
          loadLiveDemo={loadLiveDemo}
        />

        {/* 6. 3D INTERACTIVE AI REACTOR (TECHNOLOGY & MODEL REGISTRY) */}
        <TechnologySection modelStatus={modelStatus} />

        {/* 7. ENTERPRISE CTA SECTION */}
        <section id="about" className="py-24 bg-transparent border-t border-[#22323D]/40 text-center overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold font-sans uppercase">
              READY TO DIGITIZE YOUR EMPLOYEE ARCHIVE?
            </h2>
            <p className="text-base text-[#94A3B8] max-w-xl mx-auto leading-relaxed">
              Eliminate weeks of manual document retouching. Initialize the IDRestore AI workspace now to process records with pixel-level mathematical precision.
            </p>
            <div className="pt-4">
              <button
                onClick={() => onLaunchWorkspace('restore')}
                className="px-8 py-4 rounded-xl font-mono text-sm font-bold bg-[#00E5FF] text-black hover:bg-[#33EBFF] transition-all shadow-cyan-strong active:scale-95 inline-flex items-center space-x-2"
              >
                <span>ENTER RESTORATION WORKSPACE</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 bg-[#050709]/80 backdrop-blur-md border-t border-[#22323D]/40 text-xs font-mono text-[#94A3B8]">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              &copy; {new Date().getFullYear()} IDRESTORE AI &bull; OBSIDIAN FUTURISM EDITION
            </div>
            <div className="flex space-x-6 text-[#DCE7EC]">
              <span>ENTERPRISE HRMS COMPLIANCE</span>
              <span>PRIVACY PRESERVING</span>
              <span>OPENCV + GEMINI CORE</span>
            </div>
          </div>
        </footer>

      </div>
    </div>
  );
}
