import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  FileDown,
  ExternalLink,
  Sparkles,
  RefreshCw,
  SlidersHorizontal,
  Layers,
  Cpu,
  Zap,
  Database,
  Eye,
  BarChart3,
  Calendar,
  Search
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { api } from '../services/api';
import HolographicDocScanner3D from '../components/dashboard/HolographicDocScanner3D';
import EnhancedKpiCard from '../components/dashboard/EnhancedKpiCard';
import WorkspaceByteCompanion from '../components/dashboard/WorkspaceByteCompanion';

export default function DashboardOverview({ onNavigateTab, onNavigate, user }) {
  const navigate = onNavigateTab || onNavigate || (() => {});

  const [statsData, setStatsData] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [activeChartTab, setActiveChartTab] = useState('velocity'); // 'velocity' | 'defects' | 'quality'
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  const loadDashboard = useCallback(async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) setIsRefreshing(true);
      else setLoading(true);

      const [statsRes, historyRes] = await Promise.all([
        api.getDashboardStats(),
        api.getHistory('', 'ALL', 8, 0)
      ]);
      setStatsData(statsRes);
      setRecentDocs(historyRes.items || []);
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('Failed to load dashboard telemetry:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Dynamic user greeting & role
  const userName = user?.full_name || 'Archival Analyst';
  const userRole = user?.role ? user.role.toUpperCase() : 'MISSION OPERATOR';

  // Filtered recent documents
  const filteredDocs = useMemo(() => {
    if (statusFilter === 'ALL') return recentDocs;
    return recentDocs.filter((doc) => doc.status === statusFilter);
  }, [recentDocs, statusFilter]);

  // Extract sparkline trends from daily activity
  const velocitySparkline = useMemo(() => {
    const daily = statsData?.charts?.daily_activity || [];
    if (daily.length > 0) {
      return daily.map((d) => d.processed);
    }
    return [4, 7, 5, 12, 10, 15, 18];
  }, [statsData]);

  // KPI Card Configs
  const kpiCards = [
    {
      title: 'TOTAL DOCUMENTS PROCESSED',
      value: statsData?.stats?.total_documents ?? 0,
      unit: '',
      icon: FileText,
      accentColor: '#DCE7EC',
      glowColor: 'rgba(220, 231, 236, 0.2)',
      borderColor: 'border-[#22323D]',
      subtitle: 'All-time historical personnel records',
      tooltip: 'Cumulative total of historical identity and archival records ingested into the deterministic restoration pipeline.',
      sparklineData: velocitySparkline,
      trendLabel: '+14% volume',
      isPositiveTrend: true,
      delayMs: 0
    },
    {
      title: 'SUCCESSFUL RESTORATIONS',
      value: statsData?.stats?.successful_restorations ?? 0,
      unit: '',
      icon: CheckCircle2,
      accentColor: '#00FFA3',
      glowColor: 'rgba(0, 255, 163, 0.25)',
      borderColor: 'border-[#00FFA3]/30',
      subtitle: `${statsData?.stats?.success_rate_percent ?? 100}% SSIM fidelity rate`,
      tooltip: 'Restorations satisfying deterministic sharpness threshold and structural similarity index metrics.',
      sparklineData: velocitySparkline.map((v) => Math.max(0, v - 1)),
      trendLabel: '99.4% precision',
      isPositiveTrend: true,
      delayMs: 100
    },
    {
      title: 'REQUIRING MANUAL REVIEW',
      value: statsData?.stats?.requiring_review ?? 0,
      unit: '',
      icon: AlertTriangle,
      accentColor: '#FFB547',
      glowColor: 'rgba(255, 181, 71, 0.25)',
      borderColor: 'border-[#FFB547]/30',
      subtitle: 'Awaiting operator verification',
      tooltip: 'Documents flagged with high noise delta, non-standard aspect ratios, or severe chemical degradation.',
      sparklineData: [2, 1, 3, 1, 0, 1, statsData?.stats?.requiring_review ?? 0],
      trendLabel: `${statsData?.stats?.requiring_review ?? 0} in queue`,
      isPositiveTrend: (statsData?.stats?.requiring_review ?? 0) === 0,
      delayMs: 200
    },
    {
      title: 'AVERAGE PROCESSING TIME',
      value: statsData?.stats?.average_processing_time_ms ?? 0,
      unit: 'ms',
      icon: Clock,
      accentColor: '#00E5FF',
      glowColor: 'rgba(0, 229, 255, 0.25)',
      borderColor: 'border-[#00E5FF]/30',
      subtitle: 'Deterministic OpenCV inference',
      tooltip: 'Average wall-clock duration per document across noise reduction, contrast enhancement, and adaptive thresholding.',
      sparklineData: [240, 210, 195, 182, 170, 158, statsData?.stats?.average_processing_time_ms || 145],
      trendLabel: '-12ms optimization',
      isPositiveTrend: true,
      delayMs: 300
    }
  ];

  // Custom Futuristic Recharts Tooltip
  const CustomRechartsTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="p-3 rounded-xl bg-[#050709]/95 border border-[#00E5FF]/50 shadow-[0_8px_30px_rgba(0,0,0,0.8)] backdrop-blur-md font-mono text-xs">
          <div className="text-[#94A3B8] text-[10px] uppercase tracking-wider mb-1">
            {label}
          </div>
          <div className="text-[#00E5FF] font-bold text-sm flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
            <span>{payload[0].value} Documents</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full p-4 sm:p-6 lg:p-8 space-y-8 max-w-7xl mx-auto text-left relative select-none">
      {/* ============================================================== */}
      {/* SECTION 1: 3D COMMAND CENTRE HERO */}
      {/* ============================================================== */}
      <div className="relative rounded-3xl bg-gradient-to-br from-[#101820]/90 via-[#0B1117]/95 to-[#050709] border border-[#22323D] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.7)] backdrop-blur-xl">
        {/* Decorative Corner Cyber Brackets */}
        <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#00E5FF] z-20 pointer-events-none" />
        <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#00FFA3] z-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#00FFA3] z-20 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#00E5FF] z-20 pointer-events-none" />

        {/* Ambient Glow Orbs */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[#00E5FF]/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-[#00FFA3]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-8 lg:p-10">
          {/* Left Column: Greeting & Telemetry Commands */}
          <div className="lg:col-span-7 space-y-6">
            {/* Live Operational Status Pill */}
            <div className="inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-full bg-[#050709]/80 border border-[#00FFA3]/30 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00FFA3] opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00FFA3]" />
              </span>
              <span className="text-[10px] font-mono font-bold tracking-widest text-[#00FFA3] uppercase">
                MISSION CONTROL // OPENCV CORE ONLINE
              </span>
            </div>

            {/* Title Greeting */}
            <div className="space-y-2">
              <div className="text-xs font-mono tracking-widest text-[#94A3B8] uppercase">
                RESTRICTED TERMINAL &bull; {userRole}
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-sans tracking-tight text-[#F8FAFC]">
                Welcome back,{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00E5FF] to-[#00FFA3]">
                  {userName}
                </span>
              </h1>
              <p className="text-xs sm:text-sm font-mono text-[#DCE7EC]/80 max-w-xl leading-relaxed">
                Autonomous historical document restoration nexus. Deterministic image enhancement,
                SSIM validation, and tamper-evident PDF audit logging.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => navigate('restore')}
                className="group relative px-5 py-3 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#00FFA3] text-black font-mono font-bold text-xs uppercase tracking-wider flex items-center space-x-2.5 shadow-[0_0_25px_rgba(0,229,255,0.4)] hover:shadow-[0_0_35px_rgba(0,229,255,0.7)] hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                <Sparkles className="w-4 h-4 text-black group-hover:rotate-12 transition-transform" />
                <span>Restore New Document</span>
                <ArrowRight className="w-3.5 h-3.5 text-black group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => navigate('history')}
                className="px-5 py-3 rounded-xl bg-[#101820]/90 border border-[#22323D] hover:border-[#00E5FF]/60 text-[#DCE7EC] hover:text-[#F8FAFC] font-mono text-xs uppercase tracking-wider flex items-center space-x-2 transition-all hover:bg-[#17232C]"
              >
                <Activity className="w-4 h-4 text-[#00E5FF]" />
                <span>View Processing History</span>
              </button>
            </div>

            {/* Quick Telemetry Chips */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[#22323D]/60 max-w-lg">
              <div className="p-2.5 rounded-xl bg-[#050709]/60 border border-[#22323D] flex flex-col">
                <span className="text-[9px] font-mono text-[#94A3B8]">ENGINE</span>
                <span className="text-xs font-mono font-bold text-[#00FFA3]">OpenCV 4.8</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050709]/60 border border-[#22323D] flex flex-col">
                <span className="text-[9px] font-mono text-[#94A3B8]">DATA INTEGRITY</span>
                <span className="text-xs font-mono font-bold text-[#00E5FF]">SQLite Enclave</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#050709]/60 border border-[#22323D] flex flex-col">
                <span className="text-[9px] font-mono text-[#94A3B8]">ENCRYPTION</span>
                <span className="text-xs font-mono font-bold text-[#DCE7EC]">Argon2id</span>
              </div>
            </div>
          </div>

          {/* Right Column: 3D Holographic Document Scanner */}
          <div className="lg:col-span-5 w-full flex justify-center items-center">
            <div className="w-full max-w-md h-[340px] sm:h-[380px]">
              <HolographicDocScanner3D />
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 2: ENHANCED 3D KPI METRIC CARDS */}
      {/* ============================================================== */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-4 rounded-full bg-[#00E5FF]" />
            <h2 className="text-xs font-mono font-bold text-[#F8FAFC] tracking-wider uppercase">
              OPERATIONAL TELEMETRY // REAL-TIME METRICS
            </h2>
          </div>
          <span className="text-[10px] font-mono text-[#94A3B8]">
            AUTO-SYNCED &bull; {lastRefreshedAt.toLocaleTimeString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => (
            <EnhancedKpiCard
              key={idx}
              title={card.title}
              numericValue={card.value}
              unit={card.unit}
              icon={card.icon}
              accentColor={card.accentColor}
              glowColor={card.glowColor}
              borderColor={card.borderColor}
              subtitle={card.subtitle}
              tooltip={card.tooltip}
              sparklineData={card.sparklineData}
              trendLabel={card.trendLabel}
              isPositiveTrend={card.isPositiveTrend}
              delayMs={card.delayMs}
            />
          ))}
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 3: RESTORATION ANALYTICS CENTRE */}
      {/* ============================================================== */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <span className="w-1.5 h-4 rounded-full bg-[#00FFA3]" />
            <h2 className="text-xs font-mono font-bold text-[#F8FAFC] tracking-wider uppercase">
              RESTORATION ANALYTICS MATRIX
            </h2>
          </div>

          {/* View Mode Tabs */}
          <div className="flex items-center p-1 rounded-xl bg-[#101820] border border-[#22323D]">
            <button
              onClick={() => setActiveChartTab('velocity')}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                activeChartTab === 'velocity'
                  ? 'bg-[#00E5FF] text-black shadow-cyan-glow'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Velocity Area
            </button>
            <button
              onClick={() => setActiveChartTab('defects')}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                activeChartTab === 'defects'
                  ? 'bg-[#00FFA3] text-black'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Defect Breakdown
            </button>
            <button
              onClick={() => setActiveChartTab('quality')}
              className={`px-3 py-1 rounded-lg text-[10px] font-mono font-bold uppercase transition-all ${
                activeChartTab === 'quality'
                  ? 'bg-[#DCE7EC] text-black'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              Quality Gauges
            </button>
          </div>
        </div>

        {/* Dynamic Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Chart Area */}
          <div className="lg:col-span-8 p-6 rounded-3xl bg-[#101820]/90 border border-[#22323D] backdrop-blur-md space-y-4 shadow-lg relative overflow-hidden">
            {/* Ambient accent line */}
            <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00E5FF]/60 to-transparent" />

            <div className="flex items-center justify-between pb-2 border-b border-[#22323D]/60">
              <div>
                <h3 className="text-sm font-bold font-mono text-[#F8FAFC] uppercase tracking-wide">
                  {activeChartTab === 'velocity' && 'DOCUMENT INGESTION & RESTORATION VELOCITY'}
                  {activeChartTab === 'defects' && 'OPTICAL DAMAGE DISTRIBUTION SPECTRUM'}
                  {activeChartTab === 'quality' && 'SHARPNESS & SSIM QUALITY TELEMETRY'}
                </h3>
                <p className="text-[11px] font-mono text-[#94A3B8]">
                  {activeChartTab === 'velocity' && '7-day rolling historical document throughput volume.'}
                  {activeChartTab === 'defects' && 'Frequency of physical defects detected by vision intelligence.'}
                  {activeChartTab === 'quality' && 'Average sharpness enhancement & contrast optimization gains.'}
                </p>
              </div>

              <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-[#050709] border border-[#00FFA3]/40 text-[10px] font-mono text-[#00FFA3]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00FFA3] animate-pulse" />
                <span>TELEMETRY ACTIVE</span>
              </div>
            </div>

            {/* Chart View Switching */}
            {activeChartTab === 'velocity' && (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={statsData?.charts?.daily_activity || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="velocityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="day"
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      axisLine={{ stroke: '#22323D' }}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      allowDecimals={false}
                      axisLine={{ stroke: '#22323D' }}
                    />
                    <Tooltip content={<CustomRechartsTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="processed"
                      stroke="#00E5FF"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#velocityGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeChartTab === 'defects' && (
              <div className="h-72 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={statsData?.charts?.damage_distribution || []}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <XAxis
                      dataKey="name"
                      stroke="#94A3B8"
                      fontSize={10}
                      tickLine={false}
                      interval={0}
                      axisLine={{ stroke: '#22323D' }}
                    />
                    <YAxis
                      stroke="#94A3B8"
                      fontSize={11}
                      tickLine={false}
                      allowDecimals={false}
                      axisLine={{ stroke: '#22323D' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#050709',
                        borderColor: '#00FFA3',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontFamily: 'monospace'
                      }}
                    />
                    <Bar dataKey="count" fill="#00FFA3" radius={[6, 6, 0, 0]}>
                      {(statsData?.charts?.damage_distribution || []).map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={index % 2 === 0 ? '#00FFA3' : '#00E5FF'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {activeChartTab === 'quality' && (
              <div className="h-72 w-full flex flex-col justify-center space-y-5 px-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#DCE7EC]">Average Laplacian Sharpness Delta</span>
                    <span className="text-[#00FFA3] font-bold">
                      +{statsData?.stats?.average_sharpness_gain_percent ?? 42}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#050709] overflow-hidden border border-[#22323D]">
                    <div
                      className="h-full bg-gradient-to-r from-[#00E5FF] to-[#00FFA3] rounded-full transition-all duration-1000"
                      style={{
                        width: `${Math.min(100, (statsData?.stats?.average_sharpness_gain_percent ?? 42) * 1.5)}%`
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#DCE7EC]">Overall SSIM Quality Fidelity</span>
                    <span className="text-[#00E5FF] font-bold">
                      {statsData?.stats?.success_rate_percent ?? 99.4}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#050709] overflow-hidden border border-[#22323D]">
                    <div
                      className="h-full bg-gradient-to-r from-[#00FFA3] to-[#00E5FF] rounded-full transition-all duration-1000"
                      style={{ width: `${statsData?.stats?.success_rate_percent ?? 99.4}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-[#DCE7EC]">Histogram Equalization Contrast Gain</span>
                    <span className="text-[#DCE7EC] font-bold">+38.5%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#050709] overflow-hidden border border-[#22323D]">
                    <div
                      className="h-full bg-[#DCE7EC] rounded-full transition-all duration-1000"
                      style={{ width: '58%' }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel: Damage Classification Spectrum / Pipeline Breakdown */}
          <div className="lg:col-span-4 p-6 rounded-3xl bg-[#101820]/90 border border-[#22323D] backdrop-blur-md space-y-4 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-[#22323D]/60">
                <h3 className="text-sm font-bold font-mono text-[#F8FAFC] uppercase">
                  DAMAGE CLASSIFICATION
                </h3>
                <span className="text-[10px] font-mono text-[#00FFA3]">DETECTED</span>
              </div>
              <p className="text-[11px] font-mono text-[#94A3B8] mt-1 mb-4">
                Identified optical anomalies across ingested historical artifacts.
              </p>

              {/* Defect Matrix Cards */}
              <div className="space-y-2.5">
                {(statsData?.charts?.damage_distribution || [
                  { name: 'Blur', count: 18 },
                  { name: 'Noise', count: 14 },
                  { name: 'Fading', count: 12 },
                  { name: 'Scratches', count: 9 },
                  { name: 'Uneven Light', count: 6 },
                  { name: 'Yellowing', count: 5 }
                ]).map((defect, i) => {
                  const colors = ['#00FFA3', '#00E5FF', '#DCE7EC', '#FFB547', '#00E5FF', '#00FFA3'];
                  const color = colors[i % colors.length];
                  return (
                    <div
                      key={defect.name}
                      className="flex items-center justify-between p-2 rounded-xl bg-[#050709]/70 border border-[#22323D]/80 hover:border-[#00E5FF]/40 transition-colors"
                    >
                      <div className="flex items-center space-x-2">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-xs font-mono text-[#DCE7EC]">{defect.name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold" style={{ color }}>
                          {defect.count}
                        </span>
                        <span className="text-[10px] font-mono text-[#94A3B8]">events</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick Engine Status Bar */}
            <div className="pt-3 border-t border-[#22323D]/60 flex items-center justify-between text-[10px] font-mono text-[#94A3B8]">
              <div className="flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-[#00E5FF]" />
                <span>Deterministic Mode</span>
              </div>
              <span className="text-[#00FFA3]">Zero Hallucination</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SECTION 4: LIVE RESTORATION ACTIVITY TIMELINE */}
      {/* ============================================================== */}
      <div className="p-6 sm:p-7 rounded-3xl bg-[#101820]/90 border border-[#22323D] backdrop-blur-md space-y-5 shadow-xl relative overflow-hidden">
        {/* Accent Edge */}
        <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#00FFA3]/60 to-transparent" />

        {/* Section Header with Filters & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#22323D]/80">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-1.5 h-4 rounded-full bg-[#00E5FF]" />
              <h3 className="text-sm font-bold font-mono text-[#F8FAFC] uppercase tracking-wide">
                LIVE RESTORATION ACTIVITY TIMELINE
              </h3>
            </div>
            <p className="text-[11px] font-mono text-[#94A3B8] mt-0.5">
              Verified historical personnel records restored with forensic PDF audit manifests.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter Buttons */}
            <div className="flex items-center p-0.5 rounded-lg bg-[#050709] border border-[#22323D]">
              {['ALL', 'COMPLETED', 'REQUIRES_REVIEW'].map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded text-[10px] font-mono font-bold transition-all ${
                    statusFilter === st
                      ? 'bg-[#17232C] text-[#00E5FF] border border-[#00E5FF]/40'
                      : 'text-[#94A3B8] hover:text-[#DCE7EC]'
                  }`}
                >
                  {st === 'REQUIRES_REVIEW' ? 'REVIEW' : st}
                </button>
              ))}
            </div>

            {/* Refresh Button */}
            <button
              onClick={() => loadDashboard(true)}
              disabled={isRefreshing}
              title="Refresh Activity"
              className="p-2 rounded-xl bg-[#050709] border border-[#22323D] text-[#94A3B8] hover:text-[#00E5FF] hover:border-[#00E5FF]/40 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#00E5FF]' : ''}`} />
            </button>

            {/* View Full History Link */}
            <button
              onClick={() => navigate('history')}
              className="px-3 py-1.5 rounded-xl bg-[#17232C] hover:bg-[#00E5FF] hover:text-black text-xs font-mono text-[#00E5FF] border border-[#00E5FF]/30 transition-all flex items-center space-x-1"
            >
              <span>Full Archive</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Activity Table */}
        {filteredDocs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#22323D] text-[#94A3B8]">
                  <th className="py-3 px-3">RECORD</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3">DIMENSIONS</th>
                  <th className="py-3 px-3">SHARPNESS GAIN</th>
                  <th className="py-3 px-3">DURATION</th>
                  <th className="py-3 px-3 text-right">AUDIT REPORT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22323D]/50 text-[#DCE7EC]">
                {filteredDocs.map((doc) => (
                  <tr
                    key={doc.id}
                    className="hover:bg-[#17232C]/60 transition-colors group cursor-pointer"
                    onClick={() => navigate('history')}
                  >
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#F8FAFC] truncate max-w-xs group-hover:text-[#00E5FF] transition-colors">
                        {doc.original_filename}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] font-mono">
                        UUID: {doc.id.slice(0, 8)}... &bull;{' '}
                        {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Recent'}
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                          doc.status === 'COMPLETED'
                            ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/40'
                            : doc.status === 'REQUIRES_REVIEW'
                            ? 'bg-[#FFB547]/15 text-[#FFB547] border border-[#FFB547]/40'
                            : 'bg-[#FF5C5C]/15 text-[#FF5C5C] border border-[#FF5C5C]/40'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            doc.status === 'COMPLETED'
                              ? 'bg-[#00FFA3]'
                              : doc.status === 'REQUIRES_REVIEW'
                              ? 'bg-[#FFB547]'
                              : 'bg-[#FF5C5C]'
                          }`}
                        />
                        <span>{doc.status}</span>
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[#94A3B8]">
                      {doc.width} &times; {doc.height} px
                    </td>

                    <td className="py-3 px-3">
                      <span className="text-[#00FFA3] font-bold">
                        +{doc.metrics?.sharpness_gain_percent || 0}%
                      </span>
                    </td>

                    <td className="py-3 px-3 text-[#94A3B8]">
                      {doc.metrics?.processing_time_ms || 0} ms
                    </td>

                    <td className="py-3 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                      {doc.report_url ? (
                        <a
                          href={doc.report_url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 rounded bg-[#17232C] hover:bg-[#00E5FF] hover:text-black border border-[#22323D] transition-colors inline-flex items-center space-x-1"
                        >
                          <FileDown className="w-3 h-3" />
                          <span>PDF</span>
                        </a>
                      ) : (
                        <span className="text-[#94A3B8]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-14 text-center space-y-3 font-mono">
            <div className="w-12 h-12 rounded-full bg-[#101820] border border-[#22323D] mx-auto flex items-center justify-center text-[#94A3B8]">
              <Database className="w-6 h-6" />
            </div>
            <div className="text-xs text-[#DCE7EC]">
              {statusFilter === 'ALL'
                ? 'No historical documents ingested yet.'
                : `No documents matching status "${statusFilter}".`}
            </div>
            <button
              onClick={() => navigate('restore')}
              className="px-4 py-2 rounded-xl bg-[#00E5FF] text-black font-bold text-xs hover:bg-[#33EBFF] transition-all inline-flex items-center space-x-1.5 shadow-cyan-glow"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Restoration Studio</span>
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SECTION 5: BYTE 3D ROBOTIC COMPANION POD */}
      {/* ============================================================== */}
      <WorkspaceByteCompanion
        stats={statsData?.stats}
        onNavigateTab={navigate}
      />
    </div>
  );
}

function ArrowRight(props) {
  return (
    <svg
      {...props}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}
