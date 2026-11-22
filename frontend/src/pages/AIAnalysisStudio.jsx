import React, { useState, useRef } from 'react';
import {
  ScanEye,
  Upload,
  Cpu,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Shield,
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { api } from '../services/api';

export default function AIAnalysisStudio({ onNavigateTab }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setAnalysis(null);
      setErrorMsg(null);
    }
  };

  const runAnalysis = async () => {
    if (!selectedFile) return;
    setIsAnalyzing(true);
    setErrorMsg(null);
    try {
      const res = await api.analyzeDocument(selectedFile);
      setAnalysis(res.analysis);
    } catch (err) {
      setErrorMsg(err.message || 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const loadSample = async () => {
    try {
      const demo = await api.getDemoSample();
      if (demo) {
        setSelectedFile(null);
        setPreviewUrl(demo.original_url);
        setAnalysis(demo.gemini_analysis);
      }
    } catch (err) {
      setErrorMsg('Failed to load sample: ' + err.message);
    }
  };

  return (
    <div className="w-full p-6 space-y-6 max-w-7xl mx-auto text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#22323D]">
        <div>
          <h1 className="text-2xl font-bold font-sans uppercase text-[#F8FAFC]">
            AI DAMAGE INTELLIGENCE STUDIO
          </h1>
          <p className="text-xs font-mono text-[#94A3B8]">
            Gemini Multimodal Vision + OpenCV heuristic optical degradation evaluation.
          </p>
        </div>
        <button
          onClick={loadSample}
          className="px-3.5 py-2 rounded-xl text-xs font-mono text-[#00FFA3] border border-[#00FFA3]/40 bg-[#101820] hover:bg-[#00FFA3]/10 transition-all flex items-center space-x-2"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Load 1987 Fictional Archive</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 text-[#FF5C5C] text-xs font-mono flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Document Ingestion & Viewer */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-2xl bg-[#101820] border border-[#22323D] space-y-4">
            <span className="text-xs font-mono font-bold text-[#00E5FF] block">
              TARGET PERSONNEL DOCUMENT
            </span>

            {!previewUrl ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="w-full h-80 rounded-xl border-2 border-dashed border-[#22323D] hover:border-[#00E5FF] bg-[#050709] flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Upload className="w-8 h-8 text-[#00E5FF] mb-2" />
                <span className="text-xs font-mono font-bold text-[#F8FAFC]">
                  UPLOAD RECORD FOR VISION AUDIT
                </span>
                <span className="text-[10px] text-[#94A3B8] mt-1">
                  JPG, PNG, or WEBP up to 25MB
                </span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-[#050709] border border-[#22323D] flex items-center justify-center min-h-[300px]">
                  <img
                    src={previewUrl}
                    alt="Target document"
                    className="max-h-[320px] w-auto object-contain"
                  />
                </div>
                {selectedFile && !analysis && (
                  <button
                    onClick={runAnalysis}
                    disabled={isAnalyzing}
                    className="w-full py-3.5 rounded-xl font-mono text-xs font-bold bg-[#00E5FF] text-black hover:bg-[#33EBFF] transition-all flex items-center justify-center space-x-2 shadow-cyan-glow"
                  >
                    <Cpu className="w-4 h-4" />
                    <span>{isAnalyzing ? 'RUNNING VISION ANALYSIS...' : 'ANALYZE DAMAGE PATTERNS'}</span>
                  </button>
                )}
                {previewUrl && (
                  <button
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      setAnalysis(null);
                      setErrorMsg(null);
                    }}
                    className="w-full py-2 rounded-xl font-mono text-xs text-[#94A3B8] hover:text-[#FF5C5C] border border-[#22323D] hover:border-[#FF5C5C]/30 bg-[#0B1117] transition-all"
                  >
                    Reset & Upload New Document
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* AI Analysis Structured Results */}
        <div className="lg:col-span-6 space-y-4">
          {analysis ? (
            <div className="space-y-4">
              {/* Overall Assessment Card */}
              <div className="p-5 rounded-2xl bg-[#101820] border border-[#22323D] space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-[#22323D]">
                  <span className="text-xs font-mono font-bold text-[#F8FAFC]">
                    OVERALL QUALITY ASSESSMENT
                  </span>
                  <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    analysis.image_quality?.rating === 'good' || analysis.image_quality?.rating === 'excellent'
                      ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30'
                      : 'bg-[#FFB547]/15 text-[#FFB547] border border-[#FFB547]/30'
                  }`}>
                    {analysis.image_quality?.rating || 'EVALUATED'}
                  </span>
                </div>
                <p className="text-xs font-mono text-[#DCE7EC] leading-relaxed">
                  {analysis.image_quality?.assessment}
                </p>
                <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] font-mono text-[#94A3B8]">
                  <div>
                    <span>READABILITY: </span>
                    <span className="text-[#00E5FF] font-bold uppercase">{analysis.document_readability}</span>
                  </div>
                  <div>
                    <span>CONFIDENCE: </span>
                    <span className="text-[#00FFA3] font-bold">
                      {Math.round((analysis.image_quality?.confidence || 0.85) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Detected Issues */}
              <div className="p-5 rounded-2xl bg-[#101820] border border-[#22323D] space-y-3">
                <span className="text-xs font-mono font-bold text-[#FFB547] block">
                  DETECTED OPTICAL DEFECTS
                </span>
                <div className="space-y-2">
                  {(analysis.detected_issues || []).map((iss, i) => (
                    <div key={i} className="p-3 rounded-xl bg-[#0B1117] border border-[#22323D] text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[#F8FAFC] font-bold uppercase">{iss.issue}</span>
                        <span className="text-[10px] text-[#FFB547]">{iss.severity}</span>
                      </div>
                      <p className="text-[11px] text-[#94A3B8]">{iss.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Operations */}
              <div className="p-5 rounded-2xl bg-[#101820] border border-[#22323D] space-y-3">
                <span className="text-xs font-mono font-bold text-[#00FFA3] block">
                  RECOMMENDED RESTORATION PIPELINE
                </span>
                <div className="flex flex-wrap gap-2">
                  {(analysis.recommended_operations || []).map((op, i) => (
                    <span key={i} className="px-3 py-1 rounded-lg text-xs font-mono bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30">
                      {op.replace('_', ' ')}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => onNavigateTab('restore')}
                  className="w-full mt-3 py-2.5 rounded-xl font-mono text-xs font-bold bg-[#00FFA3] text-black hover:bg-[#33FFB5] transition-all flex items-center justify-center space-x-2"
                >
                  <span>PROCEED TO RESTORATION STUDIO</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-2xl bg-[#101820] border border-[#22323D] text-center space-y-3 h-full flex flex-col items-center justify-center">
              <ScanEye className="w-12 h-12 text-[#94A3B8]" />
              <div className="text-sm font-mono font-bold text-[#DCE7EC]">AWAITING DOCUMENT INPUT</div>
              <p className="text-xs font-mono text-[#94A3B8] max-w-sm">
                Upload an employee badge, personnel file, or legacy certificate to inspect optical defects.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
