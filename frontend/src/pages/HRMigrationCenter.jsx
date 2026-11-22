import React, { useState, useEffect } from 'react';
import {
  Building2,
  FileSpreadsheet,
  Download,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  FileCheck,
  ArrowRight,
  Database
} from 'lucide-react';
import { api } from '../services/api';

export default function HRMigrationCenter({ onNavigateTab }) {
  const [stats, setStats] = useState(null);
  const [historyItems, setHistoryItems] = useState([]);
  const [reviewItems, setReviewItems] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const statsRes = await api.getDashboardStats();
      setStats(statsRes.stats);
      const allDocs = await api.getHistory('', 'ALL', 100, 0);
      setHistoryItems(allDocs.items || []);
      const reviewDocs = await api.getHistory('', 'REQUIRES_REVIEW', 100, 0);
      setReviewItems(reviewDocs.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadCsv = () => {
    window.location.href = '/api/migration/manifest';
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(historyItems, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hrms_migration_manifest_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="w-full p-6 space-y-6 max-w-7xl mx-auto text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#22323D]">
        <div>
          <h1 className="text-2xl font-bold font-sans uppercase text-[#F8FAFC]">
            HR MIGRATION DISPATCH CENTER
          </h1>
          <p className="text-xs font-mono text-[#94A3B8]">
            Prepare, audit, and export restored historical archives for HRMS database ingestion.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#00FFA3] text-black hover:bg-[#33FFB5] transition-all flex items-center space-x-2 shadow-mint-glow"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>EXPORT HRMS MANIFEST (CSV)</span>
          </button>
          <button
            onClick={handleExportJson}
            className="px-4 py-2 rounded-xl text-xs font-mono text-[#DCE7EC] bg-[#101820] border border-[#22323D] hover:border-[#00E5FF] transition-all flex items-center space-x-2"
          >
            <Download className="w-4 h-4 text-[#00E5FF]" />
            <span>EXPORT JSON</span>
          </button>
        </div>
      </div>

      {/* Migration Readiness KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#101820] border border-[#00FFA3]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-[#94A3B8]">CLEARED FOR HRMS IMPORT</span>
            <CheckCircle2 className="w-4 h-4 text-[#00FFA3]" />
          </div>
          <div className="text-3xl font-mono font-extrabold text-[#00FFA3]">
            {stats?.successful_restorations ?? 0}
          </div>
          <span className="text-[10px] font-mono text-[#94A3B8]">
            Verified quality delta &bull; Master UUID assigned
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#101820] border border-[#FFB547]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-[#94A3B8]">REQUIRES MANUAL REVIEW</span>
            <AlertTriangle className="w-4 h-4 text-[#FFB547]" />
          </div>
          <div className="text-3xl font-mono font-extrabold text-[#FFB547]">
            {stats?.requiring_review ?? 0}
          </div>
          <span className="text-[10px] font-mono text-[#94A3B8]">
            Gradient sharpness caution or ambiguous damage
          </span>
        </div>

        <div className="p-5 rounded-2xl bg-[#101820] border border-[#00E5FF]/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-[#94A3B8]">MIGRATION PROGRESS</span>
            <Database className="w-4 h-4 text-[#00E5FF]" />
          </div>
          <div className="text-3xl font-mono font-extrabold text-[#00E5FF]">
            {stats?.total_documents ? Math.round((stats.successful_restorations / stats.total_documents) * 100) : 100}%
          </div>
          <span className="text-[10px] font-mono text-[#94A3B8]">
            Archival ingestion readiness score
          </span>
        </div>
      </div>

      {/* Attention Required Queue */}
      <div className="p-6 rounded-2xl bg-[#101820] border border-[#22323D] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#22323D]">
          <div>
            <h3 className="text-sm font-bold font-mono text-[#FFB547] uppercase flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#FFB547]" />
              <span>RECORDS REQUIRING HR SPECIALIST REVIEW ({reviewItems.length})</span>
            </h3>
            <p className="text-[11px] font-mono text-[#94A3B8]">
              Flagged by integrity checks before final ingestion into enterprise HRMS.
            </p>
          </div>
        </div>

        {reviewItems.length > 0 ? (
          <div className="space-y-3">
            {reviewItems.map((doc) => (
              <div
                key={doc.id}
                className="p-4 rounded-xl bg-[#0B1117] border border-[#FFB547]/30 flex items-center justify-between text-xs font-mono"
              >
                <div>
                  <div className="font-bold text-[#F8FAFC]">{doc.original_filename}</div>
                  <div className="text-[10px] text-[#FFB547] mt-1">
                    Warnings: {(doc.integrity_warnings || []).join(' | ')}
                  </div>
                </div>
                <button
                  onClick={() => onNavigateTab('history')}
                  className="px-3 py-1.5 rounded-lg bg-[#17232C] hover:bg-[#00E5FF] hover:text-black transition-colors"
                >
                  Review
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-xs font-mono text-[#94A3B8]">
            Zero flagged records. All documents conform to HRMS import tolerances.
          </div>
        )}
      </div>

      {/* Manifest Specification Guidelines */}
      <div className="p-5 rounded-2xl bg-[#0B1117] border border-[#22323D] text-xs font-mono text-[#94A3B8] space-y-2">
        <span className="text-[#00E5FF] font-bold block">ENTERPRISE COMPLIANCE NOTICE:</span>
        <p>
          IDRestore AI manifest files adhere to RFC 4180 CSV specifications and include cryptographic UUIDs, original/restored dimension deltas, mathematical sharpness gains, and integrity flags. Ensure your HRMS staging connector maps `Document_ID` to the employee personnel attachment store.
        </p>
      </div>
    </div>
  );
}
