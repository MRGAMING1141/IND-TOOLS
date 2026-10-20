import React, { useState, useEffect } from 'react';
import {
  ROBLOX_PRESETS,
  runLuauBenchmark,
  BenchmarkMetrics,
  PresetScript,
} from '../utils/luauEngine';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Zap,
  Activity,
  Layers,
  Code,
  FileCode,
  Cpu,
  Shield,
  Gauge,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  BarChart3,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';

interface LuauBenchmarkToolProps {
  copy: (t: string) => void;
  copied: boolean;
}

export const LuauBenchmarkTool: React.FC<LuauBenchmarkToolProps> = ({ copy, copied }) => {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('character-controller');
  const [sourceCode, setSourceCode] = useState<string>(ROBLOX_PRESETS[0].code);
  const [iterations, setIterations] = useState<number>(100);
  const [selectedEngine, setSelectedEngine] = useState<'all' | 'minify' | 'optimize' | 'compress' | 'obfuscate'>('all');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [results, setResults] = useState<BenchmarkMetrics[] | null>(null);
  const [activeTab, setActiveTab] = useState<'metrics' | 'chart' | 'code'>('metrics');
  const [selectedResultIndex, setSelectedResultIndex] = useState<number>(0);
  const [metricView, setMetricView] = useState<'latency' | 'throughput' | 'size'>('latency');

  // Load preset on change
  const handlePresetSelect = (preset: PresetScript) => {
    setSelectedPresetId(preset.id);
    setSourceCode(preset.code);
  };

  // Run benchmark with real performance.now()
  const handleRunBenchmark = async () => {
    if (!sourceCode.trim()) return;
    setIsRunning(true);
    // Let browser render the loading state first
    await new Promise((r) => setTimeout(r, 60));

    try {
      const benchmarkData = await runLuauBenchmark(sourceCode, selectedEngine, iterations);
      setResults(benchmarkData);
      setSelectedResultIndex(0);
    } catch (err) {
      console.error('Benchmark execution error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  // Auto-run once on initial load with 50 iterations so user sees immediate live data
  useEffect(() => {
    let mounted = true;
    const initialRun = async () => {
      setIsRunning(true);
      await new Promise((r) => setTimeout(r, 40));
      if (!mounted) return;
      const initialData = await runLuauBenchmark(sourceCode, 'all', 50);
      if (mounted) {
        setResults(initialData);
        setIsRunning(false);
      }
    };
    initialRun();
    return () => {
      mounted = false;
    };
  }, []);

  const activeResult = results && results[selectedResultIndex] ? results[selectedResultIndex] : null;

  // Chart data preparation
  const chartData = results
    ? results.map((r) => ({
        name: r.engineName.replace('Luau ', '').replace('Bytecode ', ''),
        latency: r.avgLatencyMs,
        ops: r.opsPerSec,
        size: r.outputSizeBytes,
        originalSize: r.originalSizeBytes,
        ratio: r.sizeRatioPct,
      }))
    : [];

  const ENGINE_COLORS: Record<string, string> = {
    'Token Minifier': '#3b82f6',
    'AST Service Optimizer': '#06b6d4',
    'Hardcoded Byte Compressor': '#f59e0b',
    'VM Obfuscator': '#10b981',
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <Gauge className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">In-Browser Luau Engine Benchmarker</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                High-Resolution (µs)
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Accurately test latency, execution duration, throughput (ops/sec), and compression ratios across Luau AST tools.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunBenchmark}
          disabled={isRunning || !sourceCode.trim()}
          className={`px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-sm transition-all shrink-0 ${
            isRunning
              ? 'bg-blue-600/50 text-blue-200 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer active:scale-95'
          }`}
        >
          {isRunning ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              <span>Benchmarking ({iterations} runs)...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Execute Benchmark</span>
            </>
          )}
        </button>
      </div>

      {/* Benchmark Configurations Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800 text-xs">
        {/* Preset Selector */}
        <div>
          <label className="block text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <FileCode className="w-3.5 h-3.5 text-blue-400" />
            <span>Roblox Script Benchmark Preset</span>
          </label>
          <select
            value={selectedPresetId}
            onChange={(e) => {
              const p = ROBLOX_PRESETS.find((x) => x.id === e.target.value);
              if (p) handlePresetSelect(p);
            }}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          >
            {ROBLOX_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>
        </div>

        {/* Engine Target */}
        <div>
          <label className="block text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>Target Tool Engine</span>
          </label>
          <select
            value={selectedEngine}
            onChange={(e) => setSelectedEngine(e.target.value as any)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="all">All Engines (Head-to-Head Comparison)</option>
            <option value="minify">Luau Token Minifier</option>
            <option value="optimize">Luau AST Service Optimizer</option>
            <option value="compress">Hardcoded Byte Compressor</option>
            <option value="obfuscate">Luau VM Bytecode Obfuscator</option>
          </select>
        </div>

        {/* Iteration Cycles */}
        <div>
          <label className="block text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>Benchmark Stress Iterations</span>
          </label>
          <div className="flex items-center gap-1.5">
            {[50, 100, 250, 500, 1000].map((it) => (
              <button
                key={it}
                onClick={() => setIterations(it)}
                className={`flex-1 py-1.5 rounded-lg text-center font-mono text-[11px] font-semibold border transition-colors ${
                  iterations === it
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {it}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Collapsible Source Code Preview */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Benchmark Input Script
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({new TextEncoder().encode(sourceCode).length} bytes · {sourceCode.split('\n').length} lines)
            </span>
          </div>
          <button
            onClick={() => copy(sourceCode)}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Source'}</span>
          </button>
        </div>
        <textarea
          value={sourceCode}
          onChange={(e) => {
            setSourceCode(e.target.value);
            setSelectedPresetId('custom');
          }}
          rows={6}
          placeholder="Paste or write custom Roblox Luau code here..."
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500 resize-y"
        />
      </div>

      {/* High-Level Statistical Metric Cards */}
      {results && results.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Fastest Engine Latency</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {Math.min(...results.map((r) => r.avgLatencyMs)).toFixed(3)}
              </span>
              <span className="text-xs text-slate-400">ms/run</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Top speed: {results.find((r) => r.avgLatencyMs === Math.min(...results.map((x) => x.avgLatencyMs)))?.engineName}
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Peak Engine Throughput</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-blue-400">
                {Math.max(...results.map((r) => r.opsPerSec)).toLocaleString()}
              </span>
              <span className="text-xs text-slate-400">ops/sec</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">
              Stress tested across {iterations} sequential passes
            </span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Data Processing Rate</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-amber-400">
                {Math.max(...results.map((r) => r.bandwidthMBs)).toFixed(2)}
              </span>
              <span className="text-xs text-slate-400">MB/s</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">In-browser raw byte pipeline</span>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-[11px] text-slate-400 font-medium block mb-1">Highest Code Compression</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-cyan-400">
                {Math.min(...results.map((r) => r.sizeRatioPct))}%
              </span>
              <span className="text-xs text-slate-400">reduction</span>
            </div>
            <span className="text-[10px] text-slate-400 block mt-1">Token & whitespace optimization</span>
          </div>
        </div>
      )}

      {/* Tabs: Metrics Table, Recharts Graphs, Output Code Inspection */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 pt-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('metrics')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'metrics'
                  ? 'border-blue-500 text-white bg-slate-950/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Performance Breakdown</span>
            </button>

            <button
              onClick={() => setActiveTab('chart')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'chart'
                  ? 'border-blue-500 text-white bg-slate-950/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Visual Chart</span>
            </button>

            <button
              onClick={() => setActiveTab('code')}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'code'
                  ? 'border-blue-500 text-white bg-slate-950/60'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>Transformed Output ({results?.length || 0})</span>
            </button>
          </div>

          {activeTab === 'chart' && (
            <div className="flex items-center gap-1 pb-1">
              <button
                onClick={() => setMetricView('latency')}
                className={`px-2.5 py-1 text-[11px] rounded font-medium ${
                  metricView === 'latency' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Latency (ms)
              </button>
              <button
                onClick={() => setMetricView('throughput')}
                className={`px-2.5 py-1 text-[11px] rounded font-medium ${
                  metricView === 'throughput' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Throughput (ops/s)
              </button>
              <button
                onClick={() => setMetricView('size')}
                className={`px-2.5 py-1 text-[11px] rounded font-medium ${
                  metricView === 'size' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Output Size (Bytes)
              </button>
            </div>
          )}
        </div>

        {/* Tab 1: Detailed Metrics Table */}
        {activeTab === 'metrics' && (
          <div className="p-4 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase text-[10px] tracking-wider">
                    <th className="py-2.5 px-3">Engine</th>
                    <th className="py-2.5 px-3">Avg Latency</th>
                    <th className="py-2.5 px-3">Min / Max</th>
                    <th className="py-2.5 px-3">P95 Latency</th>
                    <th className="py-2.5 px-3">Throughput</th>
                    <th className="py-2.5 px-3">Bandwidth</th>
                    <th className="py-2.5 px-3">Size Delta</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {results &&
                    results.map((r, idx) => (
                      <tr
                        key={r.engineId}
                        className={`hover:bg-slate-800/30 transition-colors ${
                          selectedResultIndex === idx ? 'bg-blue-500/5' : ''
                        }`}
                      >
                        <td className="py-3 px-3 font-sans font-medium text-slate-200">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2.5 h-2.5 rounded-full"
                              style={{
                                backgroundColor:
                                  r.engineId === 'minify'
                                    ? '#3b82f6'
                                    : r.engineId === 'optimize'
                                    ? '#06b6d4'
                                    : r.engineId === 'compress'
                                    ? '#f59e0b'
                                    : '#10b981',
                              }}
                            />
                            <span>{r.engineName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-emerald-400 font-bold">
                          {r.avgLatencyMs.toFixed(3)} ms
                        </td>
                        <td className="py-3 px-3 text-slate-400">
                          {r.minLatencyMs.toFixed(3)} / {r.maxLatencyMs.toFixed(3)} ms
                        </td>
                        <td className="py-3 px-3 text-blue-400">
                          {r.p95LatencyMs.toFixed(3)} ms
                        </td>
                        <td className="py-3 px-3 text-amber-400 font-bold">
                          {r.opsPerSec.toLocaleString()} ops/s
                        </td>
                        <td className="py-3 px-3 text-slate-300">
                          {r.bandwidthMBs.toFixed(2)} MB/s
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                              r.sizeRatioPct < 0
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            }`}
                          >
                            {r.sizeRatioPct < 0 ? (
                              <TrendingDown className="w-3 h-3" />
                            ) : (
                              <TrendingUp className="w-3 h-3" />
                            )}
                            <span>{r.sizeRatioPct}%</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setSelectedResultIndex(idx);
                              setActiveTab('code');
                            }}
                            className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-sans font-medium transition-colors"
                          >
                            Inspect
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* Checkpoint Breakdown for selected result */}
            {activeResult && activeResult.checkpoints.length > 0 && (
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-400" />
                    <span>Internal Pipeline Checkpoints: {activeResult.engineName}</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Total: {activeResult.avgLatencyMs.toFixed(3)} ms
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                  {activeResult.checkpoints.map((c, i) => (
                    <div key={i} className="bg-slate-900 p-2.5 rounded-lg border border-slate-800/80">
                      <span className="text-[10px] text-slate-400 block truncate">{c.name}</span>
                      <span className="text-xs font-mono font-bold text-blue-400">
                        {c.timeUs} µs
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Recharts Visualizations */}
        {activeTab === 'chart' && (
          <div className="p-4 space-y-4">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis
                    dataKey="name"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#475569' }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={{ stroke: '#475569' }}
                    tickFormatter={(v) =>
                      metricView === 'latency'
                        ? `${v}ms`
                        : metricView === 'throughput'
                        ? `${v}`
                        : `${v}B`
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '0.5rem',
                      color: '#f8fafc',
                      fontSize: '12px',
                    }}
                    cursor={{ fill: 'rgba(51, 65, 85, 0.2)' }}
                  />
                  <Bar
                    dataKey={
                      metricView === 'latency'
                        ? 'latency'
                        : metricView === 'throughput'
                        ? 'ops'
                        : 'size'
                    }
                    radius={[4, 4, 0, 0]}
                  >
                    {chartData.map((entry, index) => {
                      const color =
                        index === 0
                          ? '#3b82f6'
                          : index === 1
                          ? '#06b6d4'
                          : index === 2
                          ? '#f59e0b'
                          : '#10b981';
                      return <Cell key={`cell-${index}`} fill={color} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-slate-800">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-slate-300">Minifier</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-slate-800">
                <div className="w-3 h-3 rounded bg-cyan-500" />
                <span className="text-slate-300">Optimizer</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-slate-800">
                <div className="w-3 h-3 rounded bg-amber-500" />
                <span className="text-slate-300">Byte Compressor</span>
              </div>
              <div className="flex items-center gap-2 p-2 bg-slate-950 rounded border border-slate-800">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-slate-300">VM Obfuscator</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Generated Transformed Output Inspection */}
        {activeTab === 'code' && (
          <div className="p-4 space-y-4">
            {results && results.length > 0 ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {results.map((r, idx) => (
                      <button
                        key={r.engineId}
                        onClick={() => setSelectedResultIndex(idx)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          selectedResultIndex === idx
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {r.engineName}
                      </button>
                    ))}
                  </div>

                  {activeResult && (
                    <button
                      onClick={() => copy(activeResult.sampleOutput)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1.5 transition-colors border border-slate-700"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied Payload' : 'Copy Output'}</span>
                    </button>
                  )}
                </div>

                {activeResult && (
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1.5">
                      <span>
                        Generated Output: <strong className="text-white">{activeResult.engineName}</strong>
                      </span>
                      <span className="font-mono text-emerald-400">
                        {activeResult.outputSizeBytes.toLocaleString()} bytes ({activeResult.sampleOutput.split('\n').length} lines)
                      </span>
                    </div>
                    <textarea
                      value={activeResult.sampleOutput}
                      readOnly
                      rows={12}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-emerald-400 font-mono focus:outline-none"
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No benchmark data available. Click "Execute Benchmark" to start.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
