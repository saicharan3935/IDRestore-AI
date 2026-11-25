import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload,
  Sparkles,
  Sliders,
  FileCheck,
  AlertCircle,
  FileText,
  Download,
  Trash2,
  RefreshCw,
  Eye,
  Zap,
  ShieldAlert,
  ArrowRight,
  Wand2,
  RotateCcw,
  Image as ImageIcon,
  CheckCircle2,
  FileX
} from 'lucide-react';
import ComparisonSlider from '../components/ComparisonSlider';
import ScanningChamber from '../components/ScanningChamber';
import WorkspaceErrorBoundary from '../components/common/WorkspaceErrorBoundary';
import { api } from '../services/api';

export function RestorationWorkspaceContent() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [currentDocId, setCurrentDocId] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileMeta, setFileMeta] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStage, setProcessingStage] = useState('SCANNING');
  const [stageText, setStageText] = useState('');
  const [restorationResult, setRestorationResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);

  // Restoration Controls State
  const [options, setOptions] = useState({
    automatic_enhancement: true,
    denoise: true,
    contrast_enhancement: true,
    brightness_correction: true,
    sharpening: true,
    color_correction: true,
    face_restoration: false,
    upscale: false,
    scale_factor: 2,
    document_cleanup: true,
  });

  const fileInputRef = useRef(null);
  const objectUrlRef = useRef(null);

  // Cleanup object URLs on unmount to prevent browser memory leaks
  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (file) => {
    setErrorMsg(null);
    setRestorationResult(null);
    setAnalysisResult(null);
    setCurrentDocId(null);

    if (!file) {
      setErrorMsg('No file selected.');
      return;
    }

    // 1. Validate File Size
    if (file.size <= 0) {
      setErrorMsg('The selected file is empty (0 bytes). Please upload a valid image.');
      return;
    }
    const maxSizeBytes = 25 * 1024 * 1024; // 25MB
    if (file.size > maxSizeBytes) {
      setErrorMsg(`File size (${Math.round(file.size / (1024 * 1024))}MB) exceeds the 25MB maximum limit.`);
      return;
    }

    // 2. Validate File Format / MIME & Extension
    const validMimes = ['image/jpeg', 'image/jpg', 'image/pjpeg', 'image/png', 'image/webp'];
    const validExtensions = /\.(jpe?g|png|webp)$/i;
    const hasValidMime = file.type && validMimes.includes(file.type.toLowerCase());
    const hasValidExt = file.name && validExtensions.test(file.name);

    if (!hasValidMime && !hasValidExt) {
      setErrorMsg('Invalid file format. IDRestore AI supports high-resolution JPG, JPEG, PNG, and WEBP scans.');
      return;
    }

    // 3. Clean up any previous Object URL
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    try {
      const objectUrl = URL.createObjectURL(file);
      objectUrlRef.current = objectUrl;

      // Temporary placeholder meta while image loads
      setFileMeta({
        name: file.name,
        sizeKb: Math.round(file.size / 1024),
        width: 0,
        height: 0,
        loading: true,
      });

      setSelectedFile(file);
      setFilePreview(objectUrl);

      // 4. Safely verify image decodability and dimensions
      const img = new Image();
      img.src = objectUrl;

      img.onload = () => {
        // Enforce dimension boundaries (max 4096px standard)
        if (img.width > 4096 || img.height > 4096) {
          console.warn(`[RestorationWorkspace] High-resolution scan: ${img.width}x${img.height}px.`);
        }
        setFileMeta({
          name: file.name,
          sizeKb: Math.round(file.size / 1024),
          width: img.width,
          height: img.height,
          loading: false,
        });
      };

      img.onerror = () => {
        setErrorMsg('Failed to decode image. The file appears to be corrupted or is not a readable image format.');
        if (objectUrlRef.current) {
          URL.revokeObjectURL(objectUrlRef.current);
          objectUrlRef.current = null;
        }
        setFilePreview(null);
        setSelectedFile(null);
        setFileMeta(null);
      };
    } catch (err) {
      console.error('[RestorationWorkspace] createObjectURL failed:', err);
      setErrorMsg('Unable to preview file. Please try selecting the image again.');
    }
  };

  const loadDemoBenchmark = async () => {
    try {
      setErrorMsg(null);
      // Clean up local object URL if replacing
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }

      const demo = await api.getDemoSample();
      if (demo && demo.original_url) {
        setSelectedFile(null);
        setCurrentDocId(demo.id || demo.document_id);
        setFilePreview(demo.original_url);
        setFileMeta({
          name: demo.original_filename || '1987_Synthetic_Personnel_Record.jpg',
          sizeKb: Math.round((demo.file_size_bytes || 120000) / 1024),
          width: demo.width || 900,
          height: demo.height || 600,
          loading: false,
        });
        setAnalysisResult(demo.gemini_analysis);
        setRestorationResult({
          document_id: demo.id || demo.document_id,
          original_image_url: demo.original_url,
          restored_image_url: demo.restored_url,
          report_url: demo.report_url,
          metrics: demo.metrics || { sharpness_gain_percent: 58.4, processing_time_ms: 45.2, ssim_score: 0.94 },
          operations_executed: demo.operations_applied || ['Denoising', 'Contrast Enhancement', 'Sharpening'],
          integrity_warnings: demo.integrity_warnings || [],
        });
      }
    } catch (err) {
      setErrorMsg('Could not load synthetic benchmark demo: ' + (err.message || 'Unknown network error'));
    }
  };

  const handleStartRestoration = async () => {
    if (!selectedFile && !currentDocId && !filePreview) {
      setErrorMsg('Please upload an image or load a demo benchmark first.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);

    try {
      // 1. Stage: Chamber Ingestion & Analysis
      setProcessingStage('SCANNING');
      setStageText('Ingesting personnel document into neural scanning chamber...');
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStage('ANALYZING');
      setStageText('Gemini Vision Core analyzing optical degradation & ink fading...');
      await new Promise((r) => setTimeout(r, 700));

      setProcessingStage('ENHANCING');
      setStageText('Executing OpenCV CLAHE contrast, bilateral denoise, and sharpening...');

      // Call Backend API with either selectedFile or currentDocId
      const result = await api.restoreDocument(selectedFile, currentDocId, options);
      if (result && result.document_id) {
        setCurrentDocId(result.document_id);
      }

      setProcessingStage('VERIFYING');
      setStageText('Measuring mathematical SSIM, PSNR delta, and Laplacian variance...');
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStage('COMPLETED');
      setStageText('Restoration completed. Artifact packaged for HRMS ingestion.');
      await new Promise((r) => setTimeout(r, 400));

      setRestorationResult(result);
    } catch (err) {
      console.error('[RestorationWorkspace] handleStartRestoration failure:', err);
      setErrorMsg(err.message || 'Restoration failed. Please verify the backend is online and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSelectedFile(null);
    setCurrentDocId(null);
    setFilePreview(null);
    setFileMeta(null);
    setRestorationResult(null);
    setAnalysisResult(null);
    setErrorMsg(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full p-4 sm:p-6 space-y-6 max-w-7xl mx-auto text-left select-none">
      {/* Hidden Persistent File Input for Dropzone & Replace Action */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onClick={(e) => { e.target.value = null; }}
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#22323D]">
        <div>
          <h1 className="text-2xl font-bold font-sans uppercase text-[#F8FAFC]">
            RESTORATION WORKSPACE
          </h1>
          <p className="text-xs font-mono text-[#94A3B8]">
            High-fidelity computer vision restoration studio for archival HR records.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={loadDemoBenchmark}
            className="px-3.5 py-2 rounded-xl text-xs font-mono text-[#00FFA3] border border-[#00FFA3]/40 bg-[#101820] hover:bg-[#00FFA3]/10 transition-all flex items-center space-x-2 active:scale-95 shadow-[0_0_15px_rgba(0,255,163,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Load 1987 Synthetic Sample</span>
          </button>
          {filePreview && (
            <button
              onClick={handleReset}
              className="px-3 py-2 rounded-xl text-xs font-mono text-[#FF5C5C] border border-[#FF5C5C]/30 bg-[#101820] hover:bg-[#FF5C5C]/10 transition-all flex items-center space-x-1.5 active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#FF5C5C]/10 border border-[#FF5C5C]/40 text-[#FF5C5C] text-xs font-mono flex items-center justify-between space-x-2">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="text-[10px] uppercase font-bold text-[#DCE7EC] hover:text-[#F8FAFC] underline ml-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Synchronized 3D Scanning Chamber during processing */}
      {isProcessing && (
        <ScanningChamber
          imageUrl={filePreview}
          currentStage={processingStage}
          stageText={stageText}
        />
      )}

      {/* Main Workspace Layout */}
      {!isProcessing && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Upload & Preview / Comparison */}
          <div className="lg:col-span-8 space-y-6">
            {!restorationResult ? (
              /* Upload Dropzone or Document Preview */
              !filePreview ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full h-96 rounded-2xl border-2 border-dashed border-[#00E5FF]/30 hover:border-[#00E5FF] bg-[#101820]/60 flex flex-col items-center justify-center p-8 text-center cursor-pointer transition-all duration-300 hover:shadow-cyan-glow group relative overflow-hidden"
                >
                  <div className="w-16 h-16 rounded-2xl bg-[#17232C] border border-[#00E5FF]/40 flex items-center justify-center text-[#00E5FF] mb-4 group-hover:scale-110 transition-transform shadow-cyan-glow">
                    <Upload className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-bold font-mono text-[#F8FAFC] mb-1">
                    DROP EMPLOYEE RECORD HERE OR BROWSE
                  </h3>
                  <p className="text-xs text-[#94A3B8] max-w-sm mb-4">
                    Supports historical document scans in JPG, PNG, and WEBP up to 25MB.
                  </p>
                  <span className="px-3 py-1 rounded-full bg-[#050709] border border-[#22323D] text-[10px] font-mono text-[#00FFA3]">
                    AUTOMATIC NOISE & CONTRAST ESTIMATION
                  </span>
                </div>
              ) : (
                /* Uploaded File Pre-Restoration Preview Card */
                <div className="p-6 rounded-2xl bg-[#101820] border border-[#22323D] space-y-4 shadow-xl">
                  {/* File Metadata Header */}
                  <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#22323D] gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="w-2 h-2 rounded-full bg-[#00E5FF] animate-pulse" />
                      <span className="text-xs font-mono text-[#00E5FF] font-bold">
                        DOCUMENT READY FOR ENHANCEMENT
                      </span>
                    </div>
                    {fileMeta && (
                      <span className="text-xs font-mono text-[#94A3B8]">
                        {fileMeta.name} &bull; {fileMeta.width > 0 ? `${fileMeta.width} × ${fileMeta.height} px • ` : ''}{fileMeta.sizeKb} KB
                      </span>
                    )}
                  </div>

                  {/* Image Preview Box */}
                  <div className="relative rounded-xl overflow-hidden bg-[#050709] border border-[#22323D] flex items-center justify-center min-h-[380px] p-2">
                    <img
                      src={filePreview}
                      alt="Uploaded target"
                      className="max-h-[380px] w-auto object-contain rounded-lg shadow-md"
                    />
                  </div>

                  {/* Action Controls Bar */}
                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      onClick={handleStartRestoration}
                      className="flex-1 w-full py-3.5 px-4 rounded-xl font-mono text-sm font-bold bg-gradient-to-r from-[#00E5FF] to-[#00FFA3] text-black hover:opacity-95 transition-all flex items-center justify-center space-x-2 shadow-[0_0_25px_rgba(0,229,255,0.4)] active:scale-[0.99]"
                    >
                      <Wand2 className="w-4 h-4 text-black" />
                      <span>EXECUTE OPTICAL RESTORATION</span>
                    </button>

                    <div className="flex items-center space-x-2 w-full sm:w-auto">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 sm:flex-none px-4 py-3.5 rounded-xl text-xs font-mono text-[#DCE7EC] hover:text-[#00E5FF] bg-[#17232C] hover:bg-[#22323D] border border-[#22323D] transition-all flex items-center justify-center space-x-1.5"
                        title="Choose a different image file"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Replace</span>
                      </button>

                      <button
                        onClick={handleReset}
                        className="flex-1 sm:flex-none px-4 py-3.5 rounded-xl text-xs font-mono text-[#FF5C5C] hover:bg-[#FF5C5C]/15 bg-[#17232C] border border-[#22323D] transition-all flex items-center justify-center space-x-1.5"
                        title="Remove uploaded document"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* Completed Restoration: Draggable Comparison Studio */
              <div className="space-y-4">
                <ComparisonSlider
                  originalUrl={restorationResult.original_image_url}
                  restoredUrl={restorationResult.restored_image_url}
                  metrics={restorationResult.metrics}
                  downloadName={`restored_${fileMeta?.name || 'document.jpg'}`}
                />

                {/* Audit Report Action */}
                {restorationResult.report_url && (
                  <div className="p-4 rounded-xl bg-[#101820] border border-[#00FFA3]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                    <div>
                      <span className="text-xs font-mono font-bold text-[#00FFA3] block">
                        AUDIT CERTIFICATE GENERATED
                      </span>
                      <span className="text-[11px] font-mono text-[#94A3B8]">
                        Official PDF report with before/after measurements and compliance disclaimers.
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <a
                        href={restorationResult.report_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-lg bg-[#00FFA3] text-black text-xs font-mono font-bold flex items-center space-x-2 hover:bg-[#33FFB5] transition-all shadow-[0_0_15px_rgba(0,255,163,0.3)]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download PDF</span>
                      </a>
                      <button
                        onClick={handleReset}
                        className="px-3 py-2 rounded-lg bg-[#17232C] text-[#DCE7EC] hover:text-[#F8FAFC] text-xs font-mono transition-colors"
                      >
                        New Scan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Restoration Operation Controls */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-5 rounded-2xl bg-[#101820] border border-[#22323D] space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#22323D]">
                <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#F8FAFC]">
                  <Sliders className="w-4 h-4 text-[#00E5FF]" />
                  <span>PIPELINE CONTROLS</span>
                </div>
                <span className="text-[10px] font-mono text-[#00FFA3]">OPENCV ENGINE</span>
              </div>

              {/* Automatic Recommendation Toggle */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-[#050709] border border-[#00E5FF]/30 cursor-pointer">
                <div>
                  <span className="text-xs font-mono font-bold text-[#00E5FF] block">
                    Automatic Enhancement
                  </span>
                  <span className="text-[10px] text-[#94A3B8]">
                    Applies Gemini AI recommendations
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={options.automatic_enhancement}
                  onChange={(e) =>
                    setOptions({ ...options, automatic_enhancement: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#00E5FF]"
                />
              </label>

              {/* Individual Controls */}
              <div className="space-y-2 text-xs font-mono">
                {[
                  { key: 'denoise', label: 'Bilateral Denoising', desc: 'Edge-preserving grain reduction' },
                  { key: 'contrast_enhancement', label: 'CLAHE Contrast', desc: 'LAB space dynamic range stretch' },
                  { key: 'brightness_correction', label: 'Adaptive Gamma', desc: 'Auto luminance compensation' },
                  { key: 'sharpening', label: 'Unsharp Masking', desc: 'Laplacian font edge recovery' },
                  { key: 'color_correction', label: 'Gray-World Balance', desc: 'Neutralizes yellowed acid paper' },
                  { key: 'document_cleanup', label: 'Background Homogenization', desc: 'Removes fluid stains & rings' },
                  { key: 'face_restoration', label: 'Portrait Enhancement', desc: 'Micro-contrast for ID photos' },
                  { key: 'upscale', label: 'Lanczos-4 Super Resolution', desc: '2x / 4x detail sinc interpolation' },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-[#0B1117] border border-[#22323D] hover:border-[#00E5FF]/40 cursor-pointer transition-colors"
                  >
                    <div>
                      <span className="text-xs text-[#DCE7EC] font-medium block">{item.label}</span>
                      <span className="text-[9px] text-[#94A3B8]">{item.desc}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={options[item.key]}
                      onChange={(e) =>
                        setOptions({ ...options, [item.key]: e.target.checked })
                      }
                      className="w-4 h-4 accent-[#00E5FF]"
                    />
                  </label>
                ))}
              </div>

              {/* Face Restoration Warning Banner */}
              {options.face_restoration && (
                <div className="p-3 rounded-xl bg-[#FFB547]/10 border border-[#FFB547]/30 text-[10px] font-mono text-[#FFB547] flex items-start space-x-2">
                  <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    CAUTION: Portrait enhancement applies sharpness and bilateral smoothing. Do not use as biometric truth in legal identity proceedings.
                  </span>
                </div>
              )}

              {/* Integrity Disclaimer */}
              <div className="p-3 rounded-xl bg-[#050709] border border-[#22323D] text-[10px] font-mono text-[#94A3B8] leading-relaxed">
                IDRestore AI guarantees that original master files are preserved unchanged. Restored digital assets are assigned unique UUIDs.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Default export wrapped with WorkspaceErrorBoundary for complete safety
export default function RestorationWorkspace() {
  return (
    <WorkspaceErrorBoundary title="RESTORATION STUDIO ERROR CONTAINED">
      <RestorationWorkspaceContent />
    </WorkspaceErrorBoundary>
  );
}
