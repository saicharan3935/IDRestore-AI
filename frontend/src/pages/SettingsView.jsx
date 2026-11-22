import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Database,
  HardDrive,
  Cpu,
  Shield,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles
} from 'lucide-react';
import { api } from '../services/api';

export default function SettingsView() {
  const [settingsData, setSettingsData] = useState(null);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await api.getSettings();
      setSettingsData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async () => {
    try {
      const res = await api.updateGeminiKey(apiKeyInput);
      setMsg({ type: 'success', text: res.message });
      setApiKeyInput('');
      loadSettings();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="w-full p-6 space-y-6 max-w-7xl mx-auto text-left">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#22323D]">
        <div>
          <h1 className="text-2xl font-bold font-sans uppercase text-[#F8FAFC]">
            SYSTEM SETTINGS & MODEL CONFIGURATION
          </h1>
          <p className="text-xs font-mono text-[#94A3B8]">
            Configure neural models, vision API keys, storage retention, and platform telemetry.
          </p>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-xs font-mono flex items-center space-x-2 ${
          msg.type === 'success' 
            ? 'bg-[#00FFA3]/10 border border-[#00FFA3]/30 text-[#00FFA3]'
            : 'bg-[#FF5C5C]/10 border border-[#FF5C5C]/30 text-[#FF5C5C]'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{msg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Gemini Vision API Configuration */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-[#101820] border border-[#22323D] space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#22323D]">
              <div className="flex items-center space-x-2 text-xs font-mono font-bold text-[#F8FAFC]">
                <Key className="w-4 h-4 text-[#00E5FF]" />
                <span>GOOGLE GEMINI VISION INTEGRATION</span>
              </div>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                settingsData?.gemini?.is_configured
                  ? 'bg-[#00FFA3]/15 text-[#00FFA3] border border-[#00FFA3]/30'
                  : 'bg-[#FFB547]/15 text-[#FFB547] border border-[#FFB547]/30'
              }`}>
                {settingsData?.gemini?.is_configured ? 'API ACTIVE' : 'OFFLINE CV ACTIVE'}
              </span>
            </div>

            <p className="text-xs font-mono text-[#94A3B8] leading-relaxed">
              IDRestore AI utilizes the official Google Gen AI Python SDK. If no API key is provided, the platform seamlessly operates using deterministic OpenCV computer vision algorithms.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-[#94A3B8] uppercase">
                Runtime Session API Key
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder={settingsData?.gemini?.is_configured ? '••••••••••••••••••••••••' : 'Enter Gemini API Key...'}
                  className="w-full px-4 py-2.5 pr-10 rounded-xl bg-[#050709] border border-[#22323D] text-xs font-mono text-[#F8FAFC] focus:outline-none focus:border-[#00E5FF]"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#00E5FF]"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleSaveKey}
                className="px-4 py-2.5 rounded-xl font-mono text-xs font-bold bg-[#00E5FF] text-black hover:bg-[#33EBFF] transition-all"
              >
                Save & Connect Key
              </button>
            </div>
          </div>

          {/* Storage & Retention Policy */}
          <div className="p-6 rounded-2xl bg-[#101820] border border-[#22323D] space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-[#22323D] text-xs font-mono font-bold text-[#F8FAFC]">
              <HardDrive className="w-4 h-4 text-[#00FFA3]" />
              <span>STORAGE & RETENTION QUOTA</span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs font-mono">
              <div className="p-3 rounded-xl bg-[#0B1117] border border-[#22323D]">
                <span className="text-[10px] text-[#94A3B8] block">TOTAL STORAGE</span>
                <span className="text-base font-bold text-[#DCE7EC]">
                  {settingsData?.storage?.total_megabytes || 0} MB
                </span>
              </div>
              <div className="p-3 rounded-xl bg-[#0B1117] border border-[#22323D]">
                <span className="text-[10px] text-[#94A3B8] block">RETENTION PERIOD</span>
                <span className="text-base font-bold text-[#00E5FF]">
                  {settingsData?.limits?.retention_period_days || 30} Days
                </span>
              </div>
            </div>

            <div className="text-[11px] font-mono text-[#94A3B8] leading-relaxed">
              In accordance with enterprise HR security compliance, historical employee records are assigned random UUIDs and permanently erased upon deletion request.
            </div>
          </div>
        </div>

        {/* Model Availability Registry */}
        <div className="lg:col-span-6 space-y-6">
          <div className="p-6 rounded-2xl bg-[#101820] border border-[#22323D] space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-[#22323D] text-xs font-mono font-bold text-[#F8FAFC]">
              <Cpu className="w-4 h-4 text-[#00E5FF]" />
              <span>NEURAL MODEL REGISTRY & FALLBACKS</span>
            </div>

            <div className="space-y-3">
              {settingsData?.models &&
                Object.entries(settingsData.models).map(([k, v]) => (
                  <div key={k} className="p-3.5 rounded-xl bg-[#0B1117] border border-[#22323D] text-xs font-mono space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#F8FAFC]">{k}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] ${
                        v.available ? 'bg-[#00FFA3]/15 text-[#00FFA3]' : 'bg-[#FFB547]/15 text-[#FFB547]'
                      }`}>
                        {v.available ? 'PRETRAINED WEIGHTS READY' : 'OPENCV ENGINE ACTIVE'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#94A3B8]">{v.notes}</div>
                    <div className="text-[10px] text-[#00E5FF]">Fallback: {v.fallback}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
