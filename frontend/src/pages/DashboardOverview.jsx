import React, { useState, useEffect } from 'react';
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
  Sparkles
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
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { api } from '../services/api';

export default function DashboardOverview({ onNavigateTab }) {
  const [statsData, setStatsData] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const [statsRes, historyRes] = await Promise.all([
        api.getDashboardStats(),
        api.getHistory('', 'ALL', 6, 0)
      ]);
      setStatsData(statsRes);
      setRecentDocs(historyRes.items || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'TOTAL DOCUMENTS PROCESSED',
      value: statsData?.stats?.total_documents ?? 0,
      icon: FileText,
      color: 'text-[#DCE7EC]',
      border: 'border-[#22323D]',
      sub: 'All time historical records'
    },
    {
      title: 'SUCCESSFUL RESTORATIONS',
      value: statsData?.stats?.successful_restorations ?? 0,
      icon: CheckCircle2,
      color: 'text-[#00FFA3]',
      border: 'border-[#00FFA3]/30',
      sub: `${statsData?.stats?.success_rate_percent ?? 100}% fidelity rate`
    },
    {
      title: 'REQUIRING MANUAL REVIEW',
      value: statsData?.stats?.requiring_review ?? 0,
      icon: AlertTriangle,
      color: 'text-[#FFB547]',
      border: 'border-[#FFB547]/30',
      sub: 'High sharpness or low contrast delta'
    },
    {
      title: 'AVERAGE PROCESSING TIME',
      value: `${statsData?.stats?.average_processing_time_ms ?? 0} ms`,
      icon: Clock,
      color: 'text-[#00E5FF]',
      border: 'border-[#00E5FF]/30',
      sub: 'Deterministic OpenCV inference'
    }
  ];

  const pieColors = ['#00E5FF', '#00FFA3', '#FFB547', '#DCE7EC', '#FF5C5C', '#33EBFF'];

  return (
    <div className="w-full p-6 space-y-6 max-w-7xl mx-auto text-left">
      {/* Welcome Heading */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#22323D]">
        <div>
          <h1 className="text-2xl font-bold font-sans uppercase text-[#F8FAFC]">
            WELCOME TO IDRESTORE AI
          </h1>
          <p className="text-xs font-mono text-[#94A3B8]">
            Your intelligent document restoration workspace &bull; Real-time SQLite telemetry.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => onNavigateTab('restore')}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#00E5FF] text-black hover:bg-[#33EBFF] transition-all flex items-center space-x-2 shadow-cyan-glow"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Restoration Studio</span>
          </button>
        </div>
      </div>

      {/* 4 Statistics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, idx) => {
          const IconComp = card.icon;
          return (
            <div
              key={idx}
              className={`p-5 rounded-2xl bg-[#101820] border ${card.border} flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-mono tracking-wider text-[#94A3B8]">
                  {card.title}
                </span>
                <IconComp className={`w-4 h-4 ${card.color}`} />
              </div>
              <div className={`text-2xl font-mono font-extrabold ${card.color} mb-1`}>
                {card.value}
              </div>
              <div className="text-[10px] font-mono text-[#94A3B8]">{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Charts Row: Weekly Processing & Damage Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Activity Area Chart */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-[#101820] border border-[#22323D] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold font-mono text-[#F8FAFC] uppercase">
                DOCUMENT RESTORATION VELOCITY
              </h3>
              <p className="text-[11px] font-mono text-[#94A3B8]">
                Daily volume of historical personnel files processed.
              </p>
            </div>
            <div className="flex items-center space-x-1.5 text-xs font-mono text-[#00FFA3]">
              <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={statsData?.charts?.daily_activity || []}>
                <defs>
                  <linearGradient id="cyanGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00E5FF" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00E5FF" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1117',
                    borderColor: '#00E5FF',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="processed"
                  stroke="#00E5FF"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#cyanGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Damage Category Distribution Bar Chart */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-[#101820] border border-[#22323D] space-y-4">
          <h3 className="text-sm font-bold font-mono text-[#F8FAFC] uppercase">
            DAMAGE CLASSIFICATION
          </h3>
          <p className="text-[11px] font-mono text-[#94A3B8]">
            Frequency of optical defects identified by vision intelligence.
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statsData?.charts?.damage_distribution || []}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={9} interval={0} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0B1117',
                    borderColor: '#00FFA3',
                    borderRadius: '8px',
                    fontSize: '12px',
                    fontFamily: 'monospace'
                  }}
                />
                <Bar dataKey="count" fill="#00FFA3" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Document Restoration Activity Table */}
      <div className="p-6 rounded-2xl bg-[#101820] border border-[#22323D] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#22323D]">
          <div>
            <h3 className="text-sm font-bold font-mono text-[#F8FAFC] uppercase">
              RECENT RESTORATION ACTIVITY
            </h3>
            <p className="text-[11px] font-mono text-[#94A3B8]">
              Latest documents restored with verification audit certificates.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('history')}
            className="text-xs font-mono text-[#00E5FF] hover:underline flex items-center space-x-1"
          >
            <span>View All History</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentDocs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-[#22323D] text-[#94A3B8]">
                  <th className="py-2.5 px-3">RECORD</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3">DIMENSIONS</th>
                  <th className="py-2.5 px-3">SHARPNESS GAIN</th>
                  <th className="py-2.5 px-3">DURATION</th>
                  <th className="py-2.5 px-3 text-right">AUDIT REPORT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#22323D]/50 text-[#DCE7EC]">
                {recentDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#17232C]/50 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-bold text-[#F8FAFC] truncate max-w-xs">
                        {doc.original_filename}
                      </div>
                      <div className="text-[10px] text-[#94A3B8]">{doc.id.slice(0, 8)}...</div>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          doc.status === 'COMPLETED'
                            ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30'
                            : doc.status === 'REQUIRES_REVIEW'
                            ? 'bg-[#FFB547]/15 text-[#FFB547] border border-[#FFB547]/30'
                            : 'bg-[#FF5C5C]/15 text-[#FF5C5C]'
                        }`}
                      >
                        {doc.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-[#94A3B8]">
                      {doc.width} &times; {doc.height}
                    </td>
                    <td className="py-3 px-3 text-[#00FFA3] font-bold">
                      +{doc.metrics?.sharpness_gain_percent || 0}%
                    </td>
                    <td className="py-3 px-3 text-[#94A3B8]">
                      {doc.metrics?.processing_time_ms || 0} ms
                    </td>
                    <td className="py-3 px-3 text-right">
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
          <div className="py-12 text-center text-xs font-mono text-[#94A3B8]">
            No documents processed yet. Click "Launch Restoration Studio" to begin.
          </div>
        )}
      </div>
    </div>
  );
}
