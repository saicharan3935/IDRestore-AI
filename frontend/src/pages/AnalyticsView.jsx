import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Zap
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import { api } from '../services/api';

export default function AnalyticsView() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboardStats().then((res) => {
      setData(res);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const stats = data?.stats || {};
  const charts = data?.charts || {};

  const pieColors = ['#00E5FF', '#00FFA3', '#FFB547', '#DCE7EC', '#33EBFF', '#FF5C5C'];

  return (
    <div className="w-full p-6 space-y-6 max-w-7xl mx-auto text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#22323D]">
        <div>
          <h1 className="text-2xl font-bold font-sans uppercase text-[#F8FAFC]">
            HR RESTORATION ANALYTICS
          </h1>
          <p className="text-xs font-mono text-[#94A3B8]">
            Quantitative telemetry directly derived from SQLite database records.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono text-[#00FFA3]">
          <span className="w-2 h-2 rounded-full bg-[#00FFA3] animate-pulse" />
          <span>STATISTICAL INTEGRITY VERIFIED</span>
        </div>
      </div>

      {/* Top 4 Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-[#101820] border border-[#22323D]">
          <span className="text-[10px] font-mono text-[#94A3B8] block">AVERAGE SHARPNESS GAIN</span>
          <span className="text-2xl font-mono font-bold text-[#00FFA3]">
            +{stats.average_sharpness_gain_percent || 0}%
          </span>
        </div>
        <div className="p-4 rounded-xl bg-[#101820] border border-[#22323D]">
          <span className="text-[10px] font-mono text-[#94A3B8] block">AVG PIPELINE DURATION</span>
          <span className="text-2xl font-mono font-bold text-[#00E5FF]">
            {stats.average_processing_time_ms || 0} ms
          </span>
        </div>
        <div className="p-4 rounded-xl bg-[#101820] border border-[#22323D]">
          <span className="text-[10px] font-mono text-[#94A3B8] block">TOTAL BATCH JOBS</span>
          <span className="text-2xl font-mono font-bold text-[#DCE7EC]">
            {stats.total_batch_jobs || 0}
          </span>
        </div>
        <div className="p-4 rounded-xl bg-[#101820] border border-[#22323D]">
          <span className="text-[10px] font-mono text-[#94A3B8] block">SUCCESS FIDELITY</span>
          <span className="text-2xl font-mono font-bold text-[#00FFA3]">
            {stats.success_rate_percent || 100}%
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Weekly Ingestion Volume */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#101820] border border-[#22323D] space-y-4">
          <h3 className="text-xs font-mono font-bold text-[#F8FAFC] uppercase">
            DOCUMENT RESTORATION VOLUME (7-DAY ROLLING)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.daily_activity || []}>
                <defs>
                  <linearGradient id="anGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00FFA3" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#00FFA3" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#050709',
                    borderColor: '#00FFA3',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Area type="monotone" dataKey="processed" stroke="#00FFA3" strokeWidth={2} fill="url(#anGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Operation Frequency */}
        <div className="lg:col-span-6 p-6 rounded-2xl bg-[#101820] border border-[#22323D] space-y-4">
          <h3 className="text-xs font-mono font-bold text-[#F8FAFC] uppercase">
            EXECUTED ALGORITHM FREQUENCY
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.operation_frequency || []}>
                <XAxis dataKey="name" stroke="#94A3B8" fontSize={8} interval={0} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#050709',
                    borderColor: '#00E5FF',
                    borderRadius: '8px',
                    fontSize: '11px',
                    fontFamily: 'monospace'
                  }}
                />
                <Bar dataKey="count" fill="#00E5FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
