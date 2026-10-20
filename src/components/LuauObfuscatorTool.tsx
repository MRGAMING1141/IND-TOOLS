import React, { useState, useEffect } from 'react';
import {
  ROBLOX_PRESETS,
  obfuscateLuauVM,
  ObfuscationOptions,
  PresetScript,
} from '../utils/luauEngine';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  Download,
  Lock,
  Zap,
  Sliders,
  FileCode,
  Sparkles,
  Terminal,
  Activity,
} from 'lucide-react';

interface LuauObfuscatorToolProps {
  copy: (t: string) => void;
  copied: boolean;
}

export const LuauObfuscatorTool: React.FC<LuauObfuscatorToolProps> = ({ copy, copied }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('anti-tamper-network');
  const [sourceCode, setSourceCode] = useState<string>(ROBLOX_PRESETS[2].code);
  const [options, setOptions] = useState<ObfuscationOptions>({
    vmLevel: 'standard',
    antiTamper: true,
    encryptStrings: true,
    flattenControlFlow: true,
    robloxOptimized: true,
  });
  const [obfuscatedOutput, setObfuscatedOutput] = useState<string>('');
  const [stats, setStats] = useState<{
    originalSize: number;
    obfuscatedSize: number;
    opcodesCount: number;
    stringsEncrypted: number;
  }>({
    originalSize: 0,
    obfuscatedSize: 0,
    opcodesCount: 0,
    stringsEncrypted: 0,
  });
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runObfuscation = () => {
    if (!sourceCode.trim()) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const res = obfuscateLuauVM(sourceCode, options);
      setObfuscatedOutput(res.output);
      setStats({
        originalSize: res.originalSize,
        obfuscatedSize: res.obfuscatedSize,
        opcodesCount: res.opcodesCount,
        stringsEncrypted: res.stringsEncrypted,
      });
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e?.message || 'Failed to obfuscate script');
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    runObfuscation();
  }, [sourceCode, options]);

  const handleDownload = () => {
    const blob = new Blob([obfuscatedOutput], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'obfuscated_script.luau';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Luau Virtual Machine (VM) Obfuscator</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Anti-Tamper & VM Security
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Protect Roblox Luau scripts with virtual machine instruction virtualization, constant string XOR encryption, and debug anti-tamper safeguards.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={runObfuscation}
            disabled={isProcessing}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isProcessing ? 'Compiling VM...' : 'Re-Obfuscate'}</span>
          </button>
        </div>
      </div>

      {/* Preset & Protection Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 text-xs">
        <div>
          <label className="block text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Load Luau Sample Preset</span>
          </label>
          <select
            value={selectedPresetId}
            onChange={(e) => {
              setSelectedPresetId(e.target.value);
              const p = ROBLOX_PRESETS.find((x) => x.id === e.target.value);
              if (p) setSourceCode(p.code);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
          >
            {ROBLOX_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>

        {/* Security Options */}
        <div className="space-y-2">
          <label className="block text-slate-400 font-medium flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protection Architecture Features</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={options.antiTamper}
                onChange={(e) => setOptions({ ...options, antiTamper: e.target.checked })}
                className="rounded accent-emerald-500"
              />
              <span className="text-[11px]">Anti-Tamper Scan</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={options.encryptStrings}
                onChange={(e) => setOptions({ ...options, encryptStrings: e.target.checked })}
                className="rounded accent-emerald-500"
              />
              <span className="text-[11px]">XOR String Masking</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={options.flattenControlFlow}
                onChange={(e) => setOptions({ ...options, flattenControlFlow: e.target.checked })}
                className="rounded accent-emerald-500"
              />
              <span className="text-[11px]">Control Flow Flatten</span>
            </label>

            <label className="flex items-center gap-2 p-2 rounded bg-slate-950 border border-slate-800 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={options.robloxOptimized}
                onChange={(e) => setOptions({ ...options, robloxOptimized: e.target.checked })}
                className="rounded accent-emerald-500"
              />
              <span className="text-[11px]">Roblox VM Dispatch</span>
            </label>
          </div>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Source Size</span>
          <span className="text-base font-bold font-mono text-slate-200">
            {stats.originalSize.toLocaleString()} bytes
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Protected VM Size</span>
          <span className="text-base font-bold font-mono text-emerald-400">
            {stats.obfuscatedSize.toLocaleString()} bytes
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Constants Encrypted</span>
          <span className="text-base font-bold font-mono text-blue-400">
            {stats.stringsEncrypted} strings
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">VM Opcode Instructions</span>
          <span className="text-base font-bold font-mono text-purple-400">
            {stats.opcodesCount} opcodes
          </span>
        </div>
      </div>

      {/* Code Editor Panels (Input vs Obfuscated) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Source Script */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-blue-400" />
              <span>Input Luau Script</span>
            </span>
            <button
              onClick={() => copy(sourceCode)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>Copy</span>
            </button>
          </div>
          <textarea
            value={sourceCode}
            onChange={(e) => setSourceCode(e.target.value)}
            rows={14}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-500 resize-y"
          />
        </div>

        {/* Obfuscated VM Payload */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hardened VM Bytecode Payload</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => copy(obfuscatedOutput)}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Copy Payload</span>
              </button>
              <button
                onClick={handleDownload}
                className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>.luau</span>
              </button>
            </div>
          </div>
          {errorMessage ? (
            <div className="w-full bg-red-950/40 border border-red-500/30 rounded-lg p-3 text-xs text-red-300 font-mono space-y-2">
              <div className="flex items-center gap-2 text-red-400 font-semibold">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Compilation / Parser Diagnostic</span>
              </div>
              <p className="text-[11px] text-red-200/90 leading-relaxed whitespace-pre-wrap">{errorMessage}</p>
            </div>
          ) : (
            <textarea
              value={obfuscatedOutput}
              readOnly
              rows={14}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-emerald-400 font-mono focus:outline-none resize-y"
            />
          )}
        </div>
      </div>
    </div>
  );
};
