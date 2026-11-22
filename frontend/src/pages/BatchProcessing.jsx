import React, { useState, useRef } from 'react';
import {
  Layers,
  Upload,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Download,
  FileCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function BatchProcessing() {
  const [files, setFiles] = useState([]);
  const [batchName, setBatchName] = useState('HR_Historical_Batch_1985');
  const [activeBatch, setActiveBatch] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleFiles = (e) => {
    if (e.target.files) {
      const fileList = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...fileList]);
    }
  };

  const removeFile = (idx) => {
    setFiles(files.filter((_, i) => i !== idx));
  };

  const startBatch = async () => {
    if (files.length === 0) {
      setErrorMsg('Please select at least one document for batch processing.');
      return;
    }
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const res = await api.createBatch(files, batchName, {
        automatic_enhancement: true,
        denoise: true,
        contrast_enhancement: true,
        sharpening: true,
        color_correction: true,
        document_cleanup: true,
      });
      setActiveBatch(res);
      // Poll batch status
      pollBatchStatus(res.batch_id);
    } catch (err) {
      setErrorMsg(err.message || 'Batch creation failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollBatchStatus = async (batchId) => {
    try {
      const statusRes = await api.getBatchStatus(batchId);
      setActiveBatch(statusRes);
      if (statusRes.batch.status === 'PROCESSING') {
        setTimeout(() => pollBatchStatus(batchId), 2000);
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  };

  return (
    <div className="w-full p-6 space-y-6 max-w-7xl mx-auto text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#22323D]">
        <div>
          <h1 className="text-2xl font-bold font-sans uppercase text-[#F8FAFC]">
            HR BATCH RESTORATION CENTER
          </h1>
          <p className="text-xs font-mono text-[#94A3B8]">
            Multi-record queue with bounded concurrency and asynchronous background workers.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={batchName}
            onChange={(e) => setBatchName(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-[#101820] border border-[#22323D] text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#00E5FF]"
            placeholder="Batch identifier"
          />
          <button
            onClick={startBatch}
            disabled={isSubmitting || files.length === 0}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold bg-[#00E5FF] text-black hover:bg-[#33EBFF] disabled:opacity-50 transition-all flex items-center space-x-2 shadow-cyan-glow"
          >
            <Play className="w-3.5 h-3.5" />
            <span>START BATCH QUEUE</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 text-[#FF5C5C] text-xs font-mono">
          {errorMsg}
        </div>
      )}

      {/* Batch Active Status Tracker */}
      {activeBatch && (
        <div className="p-5 rounded-2xl bg-[#101820] border border-[#00E5FF]/40 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#22323D]">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#00FFA3] animate-ping" />
              <span className="text-xs font-mono font-bold text-[#F8FAFC]">
                BATCH QUEUE: {activeBatch.batch?.name || activeBatch.name}
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#00E5FF]/15 text-[#00E5FF] border border-[#00E5FF]/30 uppercase">
              {activeBatch.batch?.status || activeBatch.status}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="p-3 rounded-xl bg-[#0B1117] border border-[#22323D]">
              <span className="text-[10px] text-[#94A3B8] block">TOTAL FILES</span>
              <span className="text-lg font-bold text-[#DCE7EC]">
                {activeBatch.batch?.total_items || activeBatch.total_items}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0B1117] border border-[#00FFA3]/30">
              <span className="text-[10px] text-[#94A3B8] block">COMPLETED</span>
              <span className="text-lg font-bold text-[#00FFA3]">
                {activeBatch.batch?.completed_items ?? 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0B1117] border border-[#FFB547]/30">
              <span className="text-[10px] text-[#94A3B8] block">NEEDS REVIEW</span>
              <span className="text-lg font-bold text-[#FFB547]">
                {activeBatch.batch?.review_items ?? 0}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0B1117] border border-[#FF5C5C]/30">
              <span className="text-[10px] text-[#94A3B8] block">FAILED</span>
              <span className="text-lg font-bold text-[#FF5C5C]">
                {activeBatch.batch?.failed_items ?? 0}
              </span>
            </div>
          </div>

          {/* Action buttons & manifest download */}
          <div className="flex items-center justify-between pt-2 border-t border-[#22323D]">
            <span className="text-xs font-mono text-[#94A3B8]">
              {activeBatch.batch?.status === 'COMPLETED' ? 'All queue items processed.' : 'Processing queued documents asynchronously...'}
            </span>
            {(activeBatch.batch_id || activeBatch.batch?.id) && (
              <a
                href={`/api/batch/${activeBatch.batch_id || activeBatch.batch?.id}/manifest`}
                className="px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold bg-[#00FFA3] text-black hover:bg-[#33FFB5] transition-all flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Batch Manifest (CSV)</span>
              </a>
            )}
          </div>

          {/* Completed Batch Documents List */}
          {activeBatch.items && activeBatch.items.length > 0 && (
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-mono font-bold text-[#F8FAFC]">
                PROCESSED BATCH ARTIFACTS
              </span>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {activeBatch.items.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-lg bg-[#050709] border border-[#22323D] flex items-center justify-between text-xs font-mono"
                  >
                    <div className="truncate max-w-sm text-[#DCE7EC]">
                      {doc.original_filename}
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        doc.status === 'COMPLETED' ? 'text-[#00FFA3]' : 'text-[#FFB547]'
                      }`}>
                        {doc.status}
                      </span>
                      {doc.restored_url && (
                        <a
                          href={doc.restored_url}
                          download={`restored_${doc.original_filename}`}
                          className="text-[#00E5FF] hover:underline flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>Download</span>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload & Staging Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dropzone */}
        <div className="lg:col-span-5 space-y-4">
          <div
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-72 rounded-2xl border-2 border-dashed border-[#22323D] hover:border-[#00E5FF] bg-[#101820]/60 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFiles}
              className="hidden"
            />
            <Layers className="w-10 h-10 text-[#00E5FF] mb-3" />
            <span className="text-xs font-mono font-bold text-[#F8FAFC]">
              SELECT MULTIPLE EMPLOYEE RECORDS
            </span>
            <span className="text-[10px] text-[#94A3B8] mt-1">
              Supports mass selection of JPG, PNG, WEBP files
            </span>
          </div>
        </div>

        {/* Staged Document List */}
        <div className="lg:col-span-7 space-y-3">
          <div className="p-4 rounded-2xl bg-[#101820] border border-[#22323D] flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-[#F8FAFC]">
              STAGED RECORDS ({files.length})
            </span>
            {files.length > 0 && (
              <button
                onClick={() => setFiles([])}
                className="text-[11px] font-mono text-[#FF5C5C] hover:underline"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
            {files.map((f, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-[#0B1117] border border-[#22323D] flex items-center justify-between text-xs font-mono"
              >
                <div className="truncate max-w-sm text-[#DCE7EC]">{f.name}</div>
                <div className="flex items-center space-x-3 text-[#94A3B8]">
                  <span>{Math.round(f.size / 1024)} KB</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="text-[#FF5C5C] hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {files.length === 0 && (
              <div className="p-8 text-center text-xs font-mono text-[#94A3B8] bg-[#101820] rounded-2xl border border-[#22323D]">
                No documents staged for batch yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
