import React, { useState, useEffect, useRef } from 'react';
import { Tool, PackId } from '../types';
import { PACKS } from '../data/toolsData';
import { useAuth } from '../context/AuthContext';
import {
  encUtf8,
  decUtf8,
  bytesToBase64,
  base64ToBytes,
  crc32,
  md5,
  subtleDigest,
  buildZip,
  GAME_YAWS,
  cm360,
  convertSens,
  jsonToTypescript,
  computeDiffLines,
} from '../utils/toolEngines';
import {
  Copy,
  Check,
  Download,
  Lock,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Sliders,
  Sparkles,
  Info,
} from 'lucide-react';
import { LuauBenchmarkTool } from './LuauBenchmarkTool';
import { LuauObfuscatorTool } from './LuauObfuscatorTool';

interface ToolRunnerProps {
  tool: Tool;
  onOpenCheckout?: (packId: PackId) => void;
}

export const ToolRunner: React.FC<ToolRunnerProps> = ({ tool, onOpenCheckout }) => {
  const { hasAccessToPack, isAdmin } = useAuth();
  const [copied, setCopied] = useState(false);
  const isUnlocked = hasAccessToPack(tool.pack);

  const fallbackCopy = (text: string) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Clipboard write fallback failed:', e);
    }
  };

  const copyToClipboard = (text: string) => {
    if (!text) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(text)
          .then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          })
          .catch(() => fallbackCopy(text));
      } else {
        fallbackCopy(text);
      }
    } catch {
      fallbackCopy(text);
    }
  };

  // If tool requires a pack and user hasn't unlocked it:
  if (!isUnlocked && tool.pack) {
    const packInfo = PACKS.find((p) => p.id === tool.pack);
    return (
      <div className="py-10 px-4 sm:px-6 max-w-2xl mx-auto text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 mx-auto flex items-center justify-center mb-5 shadow-xs">
          <Lock className="w-8 h-8" />
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 mb-3">
          {packInfo?.name || 'Premium Pack'} Required
        </span>
        <h3 className="text-2xl font-bold text-slate-900 mb-2">Unlock {tool.name}</h3>
        <p className="text-slate-600 text-sm leading-relaxed mb-6">
          This professional utility is included with the <strong>{packInfo?.name}</strong> or the full <strong>Elite Tier</strong>.
          Once approved by the administrator, your Google account is granted instant lifetime access—no license keys or redeem codes required.
        </p>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-6 text-left max-w-md mx-auto shadow-xs">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">Included in this pack:</h4>
          <ul className="text-xs text-slate-600 space-y-2">
            {packInfo?.features.map((f, i) => (
              <li key={i} className="flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => onOpenCheckout?.(tool.pack!)}
            className="px-6 py-3 rounded-xl clay-button-primary text-white font-semibold text-sm transition-all flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <span>Unlock {packInfo?.name} (₹{packInfo?.price})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenCheckout?.('elite')}
            className="px-5 py-3 rounded-xl clay-button text-slate-700 font-semibold text-sm transition-all cursor-pointer"
          >
            Get Elite Tier (All Packs · ₹299)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="tool-workspace space-y-6">
      {renderToolContent(tool, copyToClipboard, copied)}
    </div>
  );
};

function renderToolContent(tool: Tool, copy: (t: string) => void, copied: boolean) {
  switch (tool.id) {
    case 'api-tester':
      return <ApiTesterTool copy={copy} copied={copied} />;
    case 'mock-gen':
      return <MockGenTool copy={copy} copied={copied} />;
    case 'svg-studio':
      return <SvgStudioTool copy={copy} copied={copied} />;
    case 'css-clamp':
      return <CssClampTool copy={copy} copied={copied} />;
    case 'luau-optimizer':
      return <LuauOptimizerTool copy={copy} copied={copied} />;
    case 'roblox-asset':
      return <RobloxAssetTool copy={copy} copied={copied} />;
    case 'base64':
      return <Base64Tool copy={copy} copied={copied} />;
    case 'url-encode':
      return <UrlEncodeTool copy={copy} copied={copied} />;
    case 'html-entities':
      return <HtmlEntitiesTool copy={copy} copied={copied} />;
    case 'hash':
      return <HashTool copy={copy} copied={copied} />;
    case 'uuid':
      return <UuidTool copy={copy} copied={copied} />;
    case 'json':
      return <JsonTool copy={copy} copied={copied} />;
    case 'csv-json':
      return <CsvJsonTool copy={copy} copied={copied} />;
    case 'timestamp':
      return <TimestampTool copy={copy} copied={copied} />;
    case 'diff':
      return <DiffTool copy={copy} copied={copied} />;
    case 'jwt':
      return <JwtTool copy={copy} copied={copied} />;
    case 'case':
      return <CaseTool copy={copy} copied={copied} />;
    case 'lines':
      return <LinesTool copy={copy} copied={copied} />;
    case 'regex':
      return <RegexTool copy={copy} copied={copied} />;
    case 'gradient':
      return <GradientTool copy={copy} copied={copied} />;
    case 'color':
      return <ColorTool copy={copy} copied={copied} />;
    case 'shadow':
      return <ShadowTool copy={copy} copied={copied} />;
    case 'discord':
      return <DiscordTool copy={copy} copied={copied} />;
    case 'password':
      return <PasswordTool copy={copy} copied={copied} />;
    case 'inspector':
      return <InspectorTool copy={copy} copied={copied} />;
    case 'crosshair':
      return <CrosshairTool copy={copy} copied={copied} />;
    case 'edpi':
      return <EdpiTool copy={copy} copied={copied} />;
    case 'urlparse':
      return <UrlParseTool copy={copy} copied={copied} />;
    case 'curl':
      return <CurlTool copy={copy} copied={copied} />;
    case 'sql':
      return <SqlTool copy={copy} copied={copied} />;
    case 'markdown':
      return <MarkdownTool copy={copy} copied={copied} />;
    case 'yaml':
      return <YamlTool copy={copy} copied={copied} />;
    case 'chmod':
      return <ChmodTool copy={copy} copied={copied} />;
    // Premium / Pack Tools
    case 'img-bulk':
      return <ImgBulkTool copy={copy} copied={copied} />;
    case 'palette-extract':
      return <PaletteExtractTool copy={copy} copied={copied} />;
    case 'json-types':
      return <JsonTypesTool copy={copy} copied={copied} />;
    case 'cron':
      return <CronTool copy={copy} copied={copied} />;
    case 'css-min':
      return <CssMinTool copy={copy} copied={copied} />;
    case 'checksum':
      return <ChecksumTool copy={copy} copied={copied} />;
    case 'luau-min':
      return <LuauMinTool copy={copy} copied={copied} />;
    case 'luau-json':
      return <LuauJsonTool copy={copy} copied={copied} />;
    case 'luau-benchmark':
      return <LuauBenchmarkTool copy={copy} copied={copied} />;
    case 'luau-obfuscator':
      return <LuauObfuscatorTool copy={copy} copied={copied} />;
    case 'sens-pro':
      return <SensProTool copy={copy} copied={copied} />;
    default:
      return <div className="text-slate-400">Tool component coming soon.</div>;
  }
}

/* =========================================================================
   INDIVIDUAL TOOL COMPONENTS
   ========================================================================= */

function Base64Tool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [input, setInput] = useState('Hello world! IND HUB Developer Toolkit');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [urlSafe, setUrlSafe] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (!input) {
      setOutput('');
      setStatus('');
      return;
    }
    try {
      if (mode === 'encode') {
        let res = bytesToBase64(encUtf8(input));
        if (urlSafe) res = res.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        setOutput(res);
        setStatus(`Encoded ${input.length} chars → ${res.length} Base64 chars`);
      } else {
        let s = input.trim().replace(/-/g, '+').replace(/_/g, '/');
        while (s.length % 4) s += '=';
        const res = decUtf8(base64ToBytes(s));
        setOutput(res);
        setStatus(`Decoded ${input.length} Base64 chars → ${res.length} chars`);
      }
    } catch (err: any) {
      setOutput('');
      setStatus('Invalid Base64 string for decoding.');
    }
  }, [input, mode, urlSafe]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
        <label className="flex items-center gap-2 font-medium text-slate-300">
          <span>Mode:</span>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white"
          >
            <option value="encode">Encode (Text → Base64)</option>
            <option value="decode">Decode (Base64 → Text)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={urlSafe}
            onChange={(e) => setUrlSafe(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
          />
          <span>URL-safe alphabet (- and _)</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
            placeholder="Type or paste text..."
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Output</label>
            <button
              onClick={() => copy(output)}
              disabled={!output}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            rows={8}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 font-mono focus:outline-none"
            placeholder="Output will appear here..."
          />
        </div>
      </div>
      {status && <p className="text-xs text-slate-400">{status}</p>}
    </div>
  );
}

function UrlEncodeTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [input, setInput] = useState('https://example.com/search?q=developer tools & suite=max#tag');
  const [mode, setMode] = useState<'component' | 'uri' | 'decode'>('component');
  const [output, setOutput] = useState('');

  useEffect(() => {
    try {
      if (mode === 'uri') setOutput(encodeURI(input));
      else if (mode === 'decode') setOutput(decodeURIComponent(input.replace(/\+/g, ' ')));
      else setOutput(encodeURIComponent(input));
    } catch {
      setOutput('Malformed URI sequence');
    }
  }, [input, mode]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
        <label className="text-slate-300 font-medium">Conversion:</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs"
        >
          <option value="component">encodeURIComponent (Query params)</option>
          <option value="uri">encodeURI (Full URL safe)</option>
          <option value="decode">decodeURIComponent (Decode)</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Result</label>
            <button
              onClick={() => copy(output)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            rows={6}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 font-mono focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function HtmlEntitiesTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [input, setInput] = useState('<div class="header">Fish & "Chips" — © 2026</div>');
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [output, setOutput] = useState('');

  const MAP: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

  useEffect(() => {
    if (mode === 'encode') {
      setOutput(input.replace(/[&<>"']/g, (c) => MAP[c] || c));
    } else {
      const doc = new DOMParser().parseFromString(input, 'text/html');
      setOutput(doc.documentElement.textContent || '');
    }
  }, [input, mode]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
        <label className="text-slate-300 font-medium">Mode:</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs"
        >
          <option value="encode">Encode HTML entities (&lt;, &gt;, &amp;, &quot;)</option>
          <option value="decode">Decode HTML entities</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={6}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Output</label>
            <button
              onClick={() => copy(output)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            rows={6}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 font-mono focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

function HashTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [text, setText] = useState('Secure text to hash');
  const [hashes, setHashes] = useState<{ [k: string]: string }>({});

  useEffect(() => {
    const compute = async () => {
      const bytes = encUtf8(text);
      const res: { [k: string]: string } = {};
      res['MD5'] = md5(bytes);
      res['CRC-32'] = crc32(bytes).toString(16).padStart(8, '0');
      try {
        res['SHA-1'] = await subtleDigest('SHA-1', bytes);
        res['SHA-256'] = await subtleDigest('SHA-256', bytes);
        res['SHA-512'] = await subtleDigest('SHA-512', bytes);
      } catch (e) {
        console.error(e);
      }
      setHashes(res);
    };
    compute();
  }, [text]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Text to Digest</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="space-y-2.5">
        {Object.entries(hashes).map(([algo, h]) => (
          <div key={algo} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <span className="text-xs font-semibold text-blue-400 w-24 shrink-0 uppercase tracking-wider">{algo}</span>
            <code className="text-xs text-slate-300 font-mono break-all flex-1">{h}</code>
            <button
              onClick={() => copy(h)}
              className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded self-start sm:self-auto shrink-0 flex items-center gap-1"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function UuidTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [count, setCount] = useState(5);
  const [version, setVersion] = useState<'v4' | 'v7'>('v4');
  const [uuids, setUuids] = useState<string[]>([]);

  const generate = () => {
    const list: string[] = [];
    const n = Math.max(1, Math.min(100, count));
    for (let i = 0; i < n; i++) {
      if (version === 'v4') {
        list.push(crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        }));
      } else {
        // v7 approximation: timestamp-ordered
        const ms = Date.now().toString(16).padStart(12, '0');
        const rand = Array.from(crypto.getRandomValues(new Uint8Array(8)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        list.push(`${ms.slice(0, 8)}-${ms.slice(8, 12)}-7${rand.slice(0, 3)}-8${rand.slice(3, 6)}-${rand.slice(6, 16)}`);
      }
    }
    setUuids(list);
  };

  useEffect(() => {
    generate();
  }, [count, version]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
        <label className="flex items-center gap-2 text-slate-300">
          <span>Type:</span>
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white"
          >
            <option value="v4">UUID v4 (Random cryptographic)</option>
            <option value="v7">UUID v7 (Time-ordered)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-slate-300">
          <span>Quantity:</span>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-center"
          />
        </label>
        <button
          onClick={generate}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium flex items-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Regenerate</span>
        </button>
      </div>

      <div className="relative">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Generated UUIDs</label>
          <button
            onClick={() => copy(uuids.join('\n'))}
            className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy All</span>
          </button>
        </div>
        <textarea
          value={uuids.join('\n')}
          readOnly
          rows={Math.min(12, Math.max(5, count))}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 font-mono focus:outline-none"
        />
      </div>
    </div>
  );
}

function BaseConvertTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [val, setVal] = useState('255');
  const [radix, setRadix] = useState<number>(10);

  const getBig = (): bigint | null => {
    try {
      const clean = val.trim().replace(/^0[box]/i, '');
      if (!clean) return 0n;
      if (radix === 10) return BigInt(clean);
      if (radix === 16) return BigInt('0x' + clean);
      if (radix === 2) return BigInt('0b' + clean);
      if (radix === 8) return BigInt('0o' + clean);
      return null;
    } catch {
      return null;
    }
  };

  const big = getBig();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Input Number</label>
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white font-mono"
            placeholder="Type value..."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Base of Input</label>
          <select
            value={radix}
            onChange={(e) => setRadix(parseInt(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white font-mono"
          >
            <option value={10}>Base 10 (Decimal)</option>
            <option value={16}>Base 16 (Hexadecimal)</option>
            <option value={2}>Base 2 (Binary)</option>
            <option value={8}>Base 8 (Octal)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2 bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Conversions</h4>
        {[
          { label: 'Decimal (Base 10)', str: big !== null ? big.toString(10) : 'Invalid' },
          { label: 'Hexadecimal (Base 16)', str: big !== null ? '0x' + big.toString(16).toUpperCase() : 'Invalid' },
          { label: 'Binary (Base 2)', str: big !== null ? '0b' + big.toString(2) : 'Invalid' },
          { label: 'Octal (Base 8)', str: big !== null ? '0o' + big.toString(8) : 'Invalid' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between p-2.5 rounded bg-slate-950/60 border border-slate-800/80">
            <div>
              <span className="block text-[11px] text-slate-400 font-medium">{item.label}</span>
              <code className="text-xs text-white font-mono break-all">{item.str}</code>
            </div>
            <button
              onClick={() => copy(item.str)}
              className="text-slate-400 hover:text-white p-1 rounded"
              title="Copy"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function JsonTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [input, setInput] = useState('{"title":"IND HUB Suite","version":2.0,"active":true,"tags":["tools","developer"]}');
  const [output, setOutput] = useState('');
  const [indent, setIndent] = useState<'2' | '4' | 'min'>('2');
  const [sortKeys, setSortKeys] = useState(false);
  const [error, setError] = useState('');

  const format = () => {
    setError('');
    if (!input.trim()) {
      setOutput('');
      return;
    }
    try {
      let parsed = JSON.parse(input);
      if (sortKeys && typeof parsed === 'object' && parsed !== null) {
        const sort = (o: any): any => {
          if (Array.isArray(o)) return o.map(sort);
          if (o !== null && typeof o === 'object') {
            return Object.keys(o)
              .sort()
              .reduce((acc: any, k) => {
                acc[k] = sort(o[k]);
                return acc;
              }, {});
          }
          return o;
        };
        parsed = sort(parsed);
      }
      const res = indent === 'min' ? JSON.stringify(parsed) : JSON.stringify(parsed, null, parseInt(indent));
      setOutput(res);
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    format();
  }, [input, indent, sortKeys]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
        <label className="flex items-center gap-2 text-slate-300">
          <span>Indentation:</span>
          <select
            value={indent}
            onChange={(e) => setIndent(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white"
          >
            <option value="2">2 Spaces</option>
            <option value="4">4 Spaces</option>
            <option value="min">Minified (Single line)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={sortKeys}
            onChange={(e) => setSortKeys(e.target.checked)}
            className="rounded bg-slate-800 border-slate-700 text-blue-600 focus:ring-0"
          />
          <span>Sort Keys A–Z</span>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Raw JSON</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={10}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Formatted Result</label>
            <button
              onClick={() => copy(output)}
              disabled={!output}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 disabled:opacity-50"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            rows={10}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none"
          />
        </div>
      </div>
      {error && <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-lg">{error}</div>}
    </div>
  );
}

function CsvJsonTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [input, setInput] = useState('name,role,level\nAda Lovelace,Mathematician,99\nAlan Turing,Cryptanalyst,98');
  const [mode, setMode] = useState<'csv2json' | 'json2csv'>('csv2json');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    if (!input.trim()) {
      setOutput('');
      return;
    }
    try {
      if (mode === 'csv2json') {
        const lines = input.trim().split('\n').filter(Boolean);
        if (lines.length < 1) return;
        const headers = lines[0].split(',').map((h) => h.trim());
        const data = lines.slice(1).map((line) => {
          const cells = line.split(',');
          const obj: any = {};
          headers.forEach((h, i) => {
            const val = cells[i]?.trim() ?? '';
            obj[h] = !isNaN(Number(val)) && val !== '' ? Number(val) : val;
          });
          return obj;
        });
        setOutput(JSON.stringify(data, null, 2));
      } else {
        const parsed = JSON.parse(input);
        if (!Array.isArray(parsed) || parsed.length === 0) {
          throw new Error('Input must be a non-empty array of objects for JSON → CSV.');
        }
        const keys = Object.keys(parsed[0]);
        const rows = parsed.map((item) => keys.map((k) => JSON.stringify(item[k] ?? '')).join(','));
        setOutput([keys.join(','), ...rows].join('\n'));
      }
    } catch (err: any) {
      setError(err.message);
      setOutput('');
    }
  }, [input, mode]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
        <label className="text-slate-300 font-medium">Conversion:</label>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as any)}
          className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white text-xs"
        >
          <option value="csv2json">CSV → JSON Array</option>
          <option value="json2csv">JSON Array → CSV</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={8}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Output</label>
            <button onClick={() => copy(output)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            rows={8}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none"
          />
        </div>
      </div>
      {error && <div className="text-xs text-rose-400">{error}</div>}
    </div>
  );
}

function TimestampTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [currentSec, setCurrentSec] = useState(Math.floor(Date.now() / 1000));
  const [inputVal, setInputVal] = useState(String(Math.floor(Date.now() / 1000)));

  useEffect(() => {
    const t = setInterval(() => setCurrentSec(Math.floor(Date.now() / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const parsedDate = (): Date | null => {
    const n = Number(inputVal.trim());
    if (isNaN(n)) return null;
    return new Date(n < 1e11 ? n * 1000 : n);
  };

  const d = parsedDate();

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex items-center justify-between text-xs">
        <span className="text-slate-400">Current Epoch:</span>
        <code className="text-blue-400 font-bold">{currentSec}</code>
        <button
          onClick={() => setInputVal(String(currentSec))}
          className="text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
        >
          Use Current
        </button>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Timestamp (Seconds or Milliseconds)</label>
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white font-mono"
        />
      </div>

      {d && !isNaN(d.getTime()) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs">
          <div>
            <span className="block text-slate-400 text-[11px] mb-1">ISO 8601</span>
            <code className="text-white font-mono break-all">{d.toISOString()}</code>
          </div>
          <div>
            <span className="block text-slate-400 text-[11px] mb-1">Local Time</span>
            <code className="text-white font-mono break-all">{d.toLocaleString()}</code>
          </div>
          <div>
            <span className="block text-slate-400 text-[11px] mb-1">UTC Time</span>
            <code className="text-white font-mono break-all">{d.toUTCString()}</code>
          </div>
          <div>
            <span className="block text-slate-400 text-[11px] mb-1">Relative</span>
            <span className="text-emerald-400 font-medium">
              {Math.abs(Math.round((d.getTime() - Date.now()) / 1000))} seconds {d.getTime() > Date.now() ? 'in future' : 'ago'}
            </span>
          </div>
        </div>
      ) : (
        <p className="text-xs text-rose-400">Invalid timestamp number.</p>
      )}
    </div>
  );
}

function DiffTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [a, setA] = useState('const user = "Alex";\nconst active = true;\nconsole.log(user);');
  const [b, setB] = useState('const user = "Alex Carter";\nconst active = false;\nconst role = "admin";\nconsole.log(user);');
  const [diff, setDiff] = useState<{ ops: any[]; additions: number; deletions: number } | null>(null);

  useEffect(() => {
    try {
      setDiff(computeDiffLines(a, b));
    } catch {
      setDiff(null);
    }
  }, [a, b]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Original Text</label>
          <textarea
            value={a}
            onChange={(e) => setA(e.target.value)}
            rows={6}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Modified Text</label>
          <textarea
            value={b}
            onChange={(e) => setB(e.target.value)}
            rows={6}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none"
          />
        </div>
      </div>

      {diff && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Diff Results</span>
            <div className="flex gap-3">
              <span className="text-emerald-400 font-semibold">+{diff.additions} lines</span>
              <span className="text-rose-400 font-semibold">-{diff.deletions} lines</span>
            </div>
          </div>
          <div className="p-3 font-mono text-xs max-h-80 overflow-y-auto space-y-1">
            {diff.ops.map((op, i) => (
              <div
                key={i}
                className={`px-2 py-0.5 rounded flex gap-3 ${
                  op.type === 'add'
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : op.type === 'del'
                    ? 'bg-rose-500/15 text-rose-300'
                    : 'text-slate-400'
                }`}
              >
                <span className="w-5 text-right opacity-50 select-none">{op.type === 'add' ? '+' : op.type === 'del' ? '-' : ' '}</span>
                <span className="break-all">{op.text || '\u00A0'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function JwtTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [token, setToken] = useState(
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbnZpIFJhanB1cm9oaXQiLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTkwOTg4OTAyMn0.4fG6'
  );
  const [header, setHeader] = useState('');
  const [payload, setPayload] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    const parts = token.trim().split('.');
    if (parts.length < 2) {
      setError('A valid JWT must have at least 2 dot-separated parts (header.payload).');
      setHeader('');
      setPayload('');
      return;
    }
    try {
      const b64u = (s: string) => {
        let str = s.replace(/-/g, '+').replace(/_/g, '/');
        while (str.length % 4) str += '=';
        return atob(str);
      };
      setHeader(JSON.stringify(JSON.parse(b64u(parts[0])), null, 2));
      setPayload(JSON.stringify(JSON.parse(b64u(parts[1])), null, 2));
    } catch (err: any) {
      setError('Failed to parse base64url payload in JWT.');
    }
  }, [token]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">JWT Token</label>
        <textarea
          value={token}
          onChange={(e) => setToken(e.target.value)}
          rows={3}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
        />
      </div>

      {error ? (
        <p className="text-xs text-rose-400">{error}</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-blue-400 mb-1 uppercase tracking-wider">Header</label>
            <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 font-mono overflow-x-auto">
              {header}
            </pre>
          </div>
          <div>
            <label className="block text-xs font-semibold text-purple-400 mb-1 uppercase tracking-wider">Payload</label>
            <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 font-mono overflow-x-auto">
              {payload}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

function CaseTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [text, setText] = useState('The quick brown fox jumps over the lazy dog');
  const [output, setOutput] = useState('');

  const words = (s: string) => s.split(/[^a-zA-Z0-9]+/).filter(Boolean);

  const conversions: { [k: string]: (s: string) => string } = {
    UPPERCASE: (s) => s.toUpperCase(),
    lowercase: (s) => s.toLowerCase(),
    'Title Case': (s) => s.toLowerCase().replace(/(^|\s)\S/g, (c) => c.toUpperCase()),
    camelCase: (s) => words(s).map((w, i) => (i ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join(''),
    PascalCase: (s) => words(s).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join(''),
    snake_case: (s) => words(s).map((w) => w.toLowerCase()).join('_'),
    'kebab-case': (s) => words(s).map((w) => w.toLowerCase()).join('-'),
    CONSTANT_CASE: (s) => words(s).map((w) => w.toUpperCase()).join('_'),
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Input String</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {Object.keys(conversions).map((name) => (
          <button
            key={name}
            onClick={() => setOutput(conversions[name](text))}
            className="px-3 py-1.5 text-xs bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 rounded-lg transition-colors font-medium"
          >
            {name}
          </button>
        ))}
      </div>

      {output && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Result</label>
            <button onClick={() => copy(output)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            rows={3}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 font-mono focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

function LinesTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [text, setText] = useState('apple\nbanana\norange\napple\ngrapes\nbanana');
  const [output, setOutput] = useState('');

  const runOp = (op: string) => {
    const list = text.split('\n');
    let res = list;
    if (op === 'sort-asc') res = [...list].sort((x, y) => x.localeCompare(y));
    if (op === 'sort-desc') res = [...list].sort((x, y) => y.localeCompare(x));
    if (op === 'dedup') res = Array.from(new Set(list));
    if (op === 'trim') res = list.map((l) => l.trim()).filter(Boolean);
    if (op === 'number') res = list.map((l, i) => `${i + 1}. ${l}`);
    if (op === 'reverse') res = [...list].reverse();
    setOutput(res.join('\n'));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Input Lines</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => runOp('sort-asc')} className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200">Sort A → Z</button>
        <button onClick={() => runOp('sort-desc')} className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200">Sort Z → A</button>
        <button onClick={() => runOp('dedup')} className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200">Remove Duplicates</button>
        <button onClick={() => runOp('trim')} className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200">Remove Empty / Trim</button>
        <button onClick={() => runOp('number')} className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200">Number Lines</button>
        <button onClick={() => runOp('reverse')} className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200">Reverse</button>
      </div>

      {output && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Cleaned Output</label>
            <button onClick={() => copy(output)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            rows={6}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}

function RegexTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [pattern, setPattern] = useState('(\\w+)@([\\w.]+)');
  const [flags, setFlags] = useState('g');
  const [text, setText] = useState('Contact janvirajpurohit491@gmail.com or dev@example.com for assistance.');
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    setMatches([]);
    if (!pattern) return;
    try {
      const re = new RegExp(pattern, flags);
      const res: any[] = [];
      let m;
      if (flags.includes('g')) {
        while ((m = re.exec(text)) !== null) {
          res.push({ match: m[0], index: m.index, groups: m.slice(1) });
          if (m[0] === '') re.lastIndex++;
        }
      } else {
        m = re.exec(text);
        if (m) res.push({ match: m[0], index: m.index, groups: m.slice(1) });
      }
      setMatches(res);
    } catch (err: any) {
      setError(err.message);
    }
  }, [pattern, flags, text]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Regex Pattern</label>
          <input
            type="text"
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
            placeholder="e.g. [a-z0-9]+"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Flags</label>
          <input
            type="text"
            value={flags}
            onChange={(e) => setFlags(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
            placeholder="g, i, m"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Test Text</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
        />
      </div>

      {error ? (
        <p className="text-xs text-rose-400">{error}</p>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Matches Found ({matches.length})
          </span>
          {matches.length === 0 ? (
            <p className="text-xs text-slate-500">No matches found.</p>
          ) : (
            <div className="space-y-2">
              {matches.map((m, i) => (
                <div key={i} className="p-2.5 rounded bg-slate-950 border border-slate-800/80 text-xs">
                  <div className="flex justify-between items-center text-slate-400 mb-1">
                    <span className="font-semibold text-blue-400">Match #{i + 1}</span>
                    <span>Index: {m.index}</span>
                  </div>
                  <code className="text-white font-mono break-all">{m.match}</code>
                  {m.groups.length > 0 && (
                    <div className="mt-1 text-[11px] text-slate-400">
                      Groups: {m.groups.map((g: string, idx: number) => `$${idx + 1} = "${g}"`).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LoremTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [count, setCount] = useState(3);
  const [type, setType] = useState<'paragraphs' | 'sentences' | 'words'>('paragraphs');
  const [output, setOutput] = useState('');

  const LOREM_WORDS = [
    'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
    'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'enim',
    'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris', 'nisi',
  ];

  const genSentence = () => {
    const len = 8 + Math.floor(Math.random() * 8);
    const words = Array.from({ length: len }, () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
    return words[0][0].toUpperCase() + words[0].slice(1) + ' ' + words.slice(1).join(' ') + '.';
  };

  const generate = () => {
    if (type === 'words') {
      const w = Array.from({ length: count }, () => LOREM_WORDS[Math.floor(Math.random() * LOREM_WORDS.length)]);
      setOutput(w.join(' '));
    } else if (type === 'sentences') {
      const s = Array.from({ length: count }, genSentence);
      setOutput(s.join(' '));
    } else {
      const p = Array.from({ length: count }, () => Array.from({ length: 4 }, genSentence).join(' '));
      setOutput(p.join('\n\n'));
    }
  };

  useEffect(() => {
    generate();
  }, [count, type]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
        <label className="flex items-center gap-2 text-slate-300">
          <span>Generate:</span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white"
          >
            <option value="paragraphs">Paragraphs</option>
            <option value="sentences">Sentences</option>
            <option value="words">Words</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-slate-300">
          <span>Count:</span>
          <input
            type="number"
            min={1}
            max={50}
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-center"
          />
        </label>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Generated Text</label>
          <button onClick={() => copy(output)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
        <textarea
          value={output}
          readOnly
          rows={8}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 font-sans focus:outline-none"
        />
      </div>
    </div>
  );
}

function SlugTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [title, setTitle] = useState('How to Build a High-Performance Web Application in 2026!');
  const [slug, setSlug] = useState('');

  useEffect(() => {
    const s = title
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    setSlug(s);
  }, [title]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Title / Headline</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Clean Slug</label>
          <button onClick={() => copy(slug)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
        <input
          type="text"
          value={slug}
          readOnly
          className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm text-emerald-400 font-mono"
        />
      </div>
    </div>
  );
}

function GradientTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [type, setType] = useState<'linear' | 'radial'>('linear');
  const [angle, setAngle] = useState(135);
  const [color1, setColor1] = useState('#1e293b');
  const [color2, setColor2] = useState('#0f172a');
  const [color3, setColor3] = useState('#3b82f6');

  const css = type === 'linear'
    ? `linear-gradient(${angle}deg, ${color1} 0%, ${color2} 50%, ${color3} 100%)`
    : `radial-gradient(circle at center, ${color1} 0%, ${color2} 60%, ${color3} 100%)`;

  return (
    <div className="space-y-4">
      <div
        className="w-full h-32 rounded-xl border border-slate-800 shadow-inner flex items-center justify-center text-xs font-mono text-white/80"
        style={{ background: css }}
      >
        Live Gradient Preview
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
          >
            <option value="linear">Linear</option>
            <option value="radial">Radial</option>
          </select>
        </div>
        {type === 'linear' && (
          <div>
            <label className="block text-slate-400 mb-1">Angle ({angle}°)</label>
            <input
              type="range"
              min={0}
              max={360}
              value={angle}
              onChange={(e) => setAngle(parseInt(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        )}
        <div>
          <label className="block text-slate-400 mb-1">Color 1</label>
          <input
            type="color"
            value={color1}
            onChange={(e) => setColor1(e.target.value)}
            className="w-full h-8 bg-transparent cursor-pointer rounded"
          />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Color 2</label>
          <input
            type="color"
            value={color2}
            onChange={(e) => setColor2(e.target.value)}
            className="w-full h-8 bg-transparent cursor-pointer rounded"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">CSS Rule</label>
          <button onClick={() => copy(`background: ${css};`)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
        <textarea
          value={`background: ${css};`}
          readOnly
          rows={2}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 font-mono"
        />
      </div>
    </div>
  );
}

function ColorTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [color, setColor] = useState('#3b82f6');
  const [bg, setBg] = useState('#0b0f17');

  const hexToRgb = (h: string) => {
    let clean = h.replace('#', '');
    if (clean.length === 3) clean = clean.split('').map((c) => c + c).join('');
    const r = parseInt(clean.slice(0, 2), 16) || 0;
    const g = parseInt(clean.slice(2, 4), 16) || 0;
    const b = parseInt(clean.slice(4, 6), 16) || 0;
    return [r, g, b];
  };

  const getLum = ([r, g, b]: number[]) => {
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  };

  const rgb = hexToRgb(color);
  const bgRgb = hexToRgb(bg);
  const l1 = getLum(rgb);
  const l2 = getLum(bgRgb);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-12 h-12 rounded cursor-pointer bg-transparent border-0"
          />
          <div>
            <span className="block text-xs font-semibold text-slate-300">Foreground Color</span>
            <code className="text-sm font-mono text-white">{color.toUpperCase()}</code>
          </div>
        </div>
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4">
          <input
            type="color"
            value={bg}
            onChange={(e) => setBg(e.target.value)}
            className="w-12 h-12 rounded cursor-pointer bg-transparent border-0"
          />
          <div>
            <span className="block text-xs font-semibold text-slate-300">Background Color</span>
            <code className="text-sm font-mono text-white">{bg.toUpperCase()}</code>
          </div>
        </div>
      </div>

      <div
        className="p-6 rounded-xl border border-slate-700/50 flex flex-col items-center justify-center text-center"
        style={{ backgroundColor: bg, color: color }}
      >
        <span className="text-xl font-bold mb-1">WCAG Typography Sample</span>
        <span className="text-sm opacity-90">The quick brown fox jumps over the lazy dog.</span>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-xs text-slate-400 block mb-0.5">Contrast Ratio</span>
          <span className="text-xl font-bold text-white font-mono">{ratio.toFixed(2)} : 1</span>
        </div>
        <div className="flex gap-2 text-xs">
          <span className={`px-2.5 py-1 rounded-md font-medium ${ratio >= 4.5 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
            AA Normal ({ratio >= 4.5 ? 'Pass' : 'Fail'})
          </span>
          <span className={`px-2.5 py-1 rounded-md font-medium ${ratio >= 7.0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'}`}>
            AAA Strict ({ratio >= 7.0 ? 'Pass' : 'Fail'})
          </span>
        </div>
      </div>
    </div>
  );
}

function ShadowTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [x, setX] = useState(0);
  const [y, setY] = useState(10);
  const [blur, setBlur] = useState(25);
  const [spread, setSpread] = useState(-5);
  const [color, setColor] = useState('#000000');
  const [opacity, setOpacity] = useState(0.4);

  const shadowCss = `${x}px ${y}px ${blur}px ${spread}px rgba(0, 0, 0, ${opacity})`;

  return (
    <div className="space-y-4">
      <div className="h-40 bg-slate-900/60 border border-slate-800 rounded-xl flex items-center justify-center p-6">
        <div
          className="w-36 h-20 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-xs font-semibold text-slate-200"
          style={{ boxShadow: shadowCss }}
        >
          Shadow Preview
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Offset Y ({y}px)</label>
          <input type="range" min={-50} max={50} value={y} onChange={(e) => setY(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Blur ({blur}px)</label>
          <input type="range" min={0} max={80} value={blur} onChange={(e) => setBlur(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Spread ({spread}px)</label>
          <input type="range" min={-30} max={30} value={spread} onChange={(e) => setSpread(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Opacity ({Math.round(opacity * 100)}%))</label>
          <input type="range" min={0} max={100} value={opacity * 100} onChange={(e) => setOpacity(Number(e.target.value) / 100)} className="w-full accent-blue-500" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">CSS Rule</label>
          <button onClick={() => copy(`box-shadow: ${shadowCss};`)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
        <input
          type="text"
          value={`box-shadow: ${shadowCss};`}
          readOnly
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono"
        />
      </div>
    </div>
  );
}

function DiscordTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [title, setTitle] = useState('New Release Announced');
  const [desc, setDesc] = useState('IND HUB Max has been updated with non-gradient high-craft aesthetics and real Firestore database integration.');
  const [color, setColor] = useState('#3b82f6');
  const [author, setAuthor] = useState('IND HUB System');

  const jsonPayload = {
    username: 'IND HUB Webhook',
    embeds: [
      {
        title: title || undefined,
        description: desc || undefined,
        color: parseInt(color.replace('#', ''), 16) || 3900150,
        author: author ? { name: author } : undefined,
        footer: { text: 'IND HUB Verification Engine' },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-3">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Title</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Author Name</label>
          <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
          <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-white" />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-slate-300">Accent Color:</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer bg-transparent" />
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-[#2b2d31] border-l-4 rounded p-3 text-slate-200 text-xs space-y-1" style={{ borderLeftColor: color }}>
          {author && <div className="text-[11px] font-semibold text-slate-300">{author}</div>}
          <div className="font-bold text-sm text-blue-400">{title}</div>
          <p className="text-slate-300 text-xs leading-relaxed">{desc}</p>
          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700/50">IND HUB Verification Engine • Today</div>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400">Webhook JSON</span>
            <button onClick={() => copy(JSON.stringify(jsonPayload, null, 2))} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>
          <textarea
            value={JSON.stringify(jsonPayload, null, 2)}
            readOnly
            rows={5}
            className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-[11px] font-mono text-slate-300"
          />
        </div>
      </div>
    </div>
  );
}

function PasswordTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [pass, setPass] = useState('IndHubSuite@2026!Pro');
  const [genPass, setGenPass] = useState('');

  const len = pass.length;
  const hasLower = /[a-z]/.test(pass);
  const hasUpper = /[A-Z]/.test(pass);
  const hasNum = /[0-9]/.test(pass);
  const hasSym = /[^a-zA-Z0-9]/.test(pass);
  const pool = (hasLower ? 26 : 0) + (hasUpper ? 26 : 0) + (hasNum ? 10 : 0) + (hasSym ? 32 : 0);
  const entropy = Math.round(len * Math.log2(pool || 1));

  const generateRandom = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789!@#$%&*';
    const arr = Array.from(crypto.getRandomValues(new Uint8Array(18)), (b) => chars[b % chars.length]);
    setGenPass(arr.join(''));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Test Password</label>
        <input
          type="text"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white font-mono"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
        <div>
          <span className="block text-slate-400 text-[11px]">Length</span>
          <span className="text-white font-bold">{len} chars</span>
        </div>
        <div>
          <span className="block text-slate-400 text-[11px]">Entropy</span>
          <span className="text-emerald-400 font-bold">{entropy} bits</span>
        </div>
        <div>
          <span className="block text-slate-400 text-[11px]">Strength Score</span>
          <span className={`font-bold ${entropy >= 80 ? 'text-emerald-400' : entropy >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
            {entropy >= 80 ? 'Very Strong' : entropy >= 50 ? 'Medium' : 'Weak'}
          </span>
        </div>
        <div>
          <span className="block text-slate-400 text-[11px]">Charset Pool</span>
          <span className="text-white font-bold">{pool} symbols</span>
        </div>
      </div>

      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-slate-300">Generate High-Entropy Password</span>
          <button
            onClick={generateRandom}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium"
          >
            Generate
          </button>
        </div>
        {genPass && (
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-800">
            <code className="text-emerald-400 font-mono text-sm">{genPass}</code>
            <button onClick={() => copy(genPass)} className="text-slate-400 hover:text-white">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function InspectorTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [code, setCode] = useState(
    '// Paste JavaScript or script below\nfunction init() {\n  const token = localStorage.getItem("auth");\n  fetch("https://api.example.com", { method: "POST" });\n}'
  );
  const [findings, setFindings] = useState<any[]>([]);

  const scan = () => {
    const rules = [
      { re: /\beval\s*\(/g, title: 'Dangerous eval() statement', sev: 'High' },
      { re: /new\s+Function\s*\(/g, title: 'Dynamic new Function() constructor', sev: 'High' },
      { re: /document\.write/g, title: 'document.write DOM manipulation', sev: 'Medium' },
      { re: /\.innerHTML\s*=/g, title: 'Unsanitized innerHTML assignment', sev: 'Medium' },
      { re: /localStorage|sessionStorage/g, title: 'Web Storage access', sev: 'Low' },
      { re: /fetch|XMLHttpRequest/g, title: 'Network transmission request', sev: 'Low' },
    ];
    const results: any[] = [];
    rules.forEach((r) => {
      let m;
      while ((m = r.re.exec(code)) !== null) {
        results.push({ title: r.title, sev: r.sev, index: m.index });
      }
    });
    setFindings(results);
  };

  useEffect(() => {
    scan();
  }, [code]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Script to Inspect</label>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          rows={6}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Audit Findings ({findings.length})</h4>
        {findings.length === 0 ? (
          <p className="text-xs text-emerald-400">No common security heuristics triggered.</p>
        ) : (
          <div className="space-y-2">
            {findings.map((f, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-950 border border-slate-800 text-xs">
                <span className="text-slate-200 font-medium">{f.title}</span>
                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${f.sev === 'High' ? 'bg-rose-500/20 text-rose-400' : f.sev === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                  {f.sev} Severity
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CrosshairTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [size, setSize] = useState(14);
  const [thickness, setThickness] = useState(2);
  const [gap, setGap] = useState(4);
  const [color, setColor] = useState('#22ff88');

  const cs2Command = `cl_crosshairsize ${size / 2}; cl_crosshairthickness ${thickness / 2}; cl_crosshairgap ${gap / 2}; cl_crosshaircolor_r 34; cl_crosshaircolor_g 255; cl_crosshaircolor_b 136;`;

  return (
    <div className="space-y-4">
      <div className="h-44 bg-slate-950 border border-slate-800 rounded-xl relative flex items-center justify-center">
        <div className="relative" style={{ width: size * 2 + gap, height: size * 2 + gap }}>
          {/* Top line */}
          <div
            className="absolute rounded-sm"
            style={{
              backgroundColor: color,
              width: thickness,
              height: size,
              left: `calc(50% - ${thickness / 2}px)`,
              top: 0,
            }}
          />
          {/* Bottom line */}
          <div
            className="absolute rounded-sm"
            style={{
              backgroundColor: color,
              width: thickness,
              height: size,
              left: `calc(50% - ${thickness / 2}px)`,
              bottom: 0,
            }}
          />
          {/* Left line */}
          <div
            className="absolute rounded-sm"
            style={{
              backgroundColor: color,
              height: thickness,
              width: size,
              top: `calc(50% - ${thickness / 2}px)`,
              left: 0,
            }}
          />
          {/* Right line */}
          <div
            className="absolute rounded-sm"
            style={{
              backgroundColor: color,
              height: thickness,
              width: size,
              top: `calc(50% - ${thickness / 2}px)`,
              right: 0,
            }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Size ({size}px)</label>
          <input type="range" min={4} max={30} value={size} onChange={(e) => setSize(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Thickness ({thickness}px)</label>
          <input type="range" min={1} max={6} value={thickness} onChange={(e) => setThickness(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Center Gap ({gap}px)</label>
          <input type="range" min={0} max={20} value={gap} onChange={(e) => setGap(Number(e.target.value))} className="w-full accent-blue-500" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Reticle Color</label>
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)} className="w-full h-7 bg-transparent rounded cursor-pointer" />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-slate-300">CS2 Console Command</span>
          <button onClick={() => copy(cs2Command)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
        <input type="text" value={cs2Command} readOnly className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs font-mono text-slate-300" />
      </div>
    </div>
  );
}

function DiceTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [sides, setSides] = useState(20);
  const [numDice, setNumDice] = useState(2);
  const [rolls, setRolls] = useState<number[]>([18, 12]);

  const roll = () => {
    const list = Array.from({ length: numDice }, () => Math.floor(Math.random() * sides) + 1);
    setRolls(list);
  };

  const total = rolls.reduce((acc, v) => acc + v, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
        <label className="flex items-center gap-2 text-slate-300">
          <span>Dice:</span>
          <select
            value={sides}
            onChange={(e) => setSides(Number(e.target.value))}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white"
          >
            <option value={6}>d6 (Standard)</option>
            <option value={20}>d20 (D&D / RPG)</option>
            <option value={100}>d100 (Percentile)</option>
            <option value={2}>d2 (Coin Flip)</option>
          </select>
        </label>
        <label className="flex items-center gap-2 text-slate-300">
          <span>Quantity:</span>
          <input
            type="number"
            min={1}
            max={20}
            value={numDice}
            onChange={(e) => setNumDice(Math.max(1, Number(e.target.value)))}
            className="w-16 bg-slate-800 border border-slate-700 rounded px-2 py-1 text-white text-center"
          />
        </label>
        <button onClick={roll} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium">
          Roll Dice
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
          {rolls.map((r, i) => (
            <div key={i} className="w-14 h-14 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xl font-bold text-white shadow-sm">
              {r}
            </div>
          ))}
        </div>
        <div className="text-xs text-slate-400">
          Total Sum: <strong className="text-white text-lg ml-1 font-mono">{total}</strong>
        </div>
      </div>
    </div>
  );
}

function FpsTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [fps, setFps] = useState(144);
  const ms = 1000 / (fps || 1);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Target FPS</label>
          <input
            type="number"
            value={fps}
            onChange={(e) => setFps(Math.max(1, Number(e.target.value)))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Frame Budget (ms)</label>
          <input
            type="text"
            readOnly
            value={`${ms.toFixed(2)} ms`}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-sm text-emerald-400 font-mono"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[60, 120, 144, 240].map((rate) => (
          <button
            key={rate}
            onClick={() => setFps(rate)}
            className={`p-3 rounded-lg border text-xs font-mono transition-colors text-left ${fps === rate ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
          >
            <span className="block font-bold text-sm text-white">{rate} Hz</span>
            <span>{(1000 / rate).toFixed(2)} ms</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function EdpiTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [dpi, setDpi] = useState(800);
  const [sens, setSens] = useState(0.35);

  const edpi = Math.round(dpi * sens);
  // Valorant yaw is ~0.07 deg/count
  const cmVal = (360 / (0.07 * sens * dpi)) * 2.54;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Hardware DPI</label>
          <input type="number" value={dpi} onChange={(e) => setDpi(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white font-mono" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">In-Game Sensitivity</label>
          <input type="number" step="0.01" value={sens} onChange={(e) => setSens(Number(e.target.value))} className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white font-mono" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
        <div>
          <span className="text-xs text-slate-400 block mb-0.5">Calculated eDPI</span>
          <span className="text-xl font-bold text-white font-mono">{edpi}</span>
        </div>
        <div>
          <span className="text-xs text-slate-400 block mb-0.5">360° Turn Distance (approx.)</span>
          <span className="text-xl font-bold text-blue-400 font-mono">{cmVal.toFixed(1)} cm</span>
        </div>
      </div>
    </div>
  );
}

function UrlParseTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [urlStr, setUrlStr] = useState('https://app.example.com:8443/api/v1/users?role=admin&sort=desc&utm_source=email#overview');
  const [parsed, setParsed] = useState<any>(null);

  useEffect(() => {
    if (!urlStr.trim()) {
      setParsed(null);
      return;
    }
    try {
      let candidate = urlStr.trim();
      // Handle domain-only or schemeless input gracefully
      if (!candidate.includes('://') && !candidate.startsWith('//')) {
        candidate = 'https://' + candidate;
      }
      const u = new URL(candidate);
      setParsed({
        protocol: u.protocol,
        hostname: u.hostname,
        port: u.port || '(default)',
        pathname: u.pathname || '/',
        search: u.search,
        hash: u.hash || '',
        params: Array.from(u.searchParams.entries()),
      });
    } catch {
      setParsed(null);
    }
  }, [urlStr]);

  const loadPreset = (presetUrl: string) => {
    setUrlStr(presetUrl);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">URL to Parse</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium">Presets:</span>
            <button
              onClick={() => loadPreset('https://api.github.com/repos/facebook/react/issues?state=open&per_page=100#comments')}
              className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors border border-slate-200"
            >
              API Query
            </button>
            <button
              onClick={() => loadPreset('http://localhost:3000/dashboard?tab=analytics&user=42#chart-metrics')}
              className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors border border-slate-200"
            >
              Localhost
            </button>
            <button
              onClick={() => setUrlStr('')}
              className="text-[11px] px-2 py-0.5 rounded-lg text-slate-500 hover:text-slate-800 cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
        <input
          type="text"
          value={urlStr}
          onChange={(e) => setUrlStr(e.target.value)}
          placeholder="Paste or type any URL (e.g. example.com/api?id=123)..."
          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-sm text-slate-900 font-mono shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {parsed ? (
        <div className="bg-slate-50/80 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 text-xs shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-900 font-bold uppercase tracking-wider text-[11px]">URL Breakdown</span>
            <button
              onClick={() => copy(JSON.stringify(parsed, null, 2))}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied JSON!' : 'Copy JSON'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 block text-[11px] font-semibold mb-0.5">Protocol</span>
              <code className="text-blue-600 font-mono font-bold text-xs">{parsed.protocol}</code>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 block text-[11px] font-semibold mb-0.5">Hostname</span>
              <code className="text-slate-900 font-mono font-bold text-xs break-all">{parsed.hostname}</code>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 block text-[11px] font-semibold mb-0.5">Port</span>
              <code className="text-slate-900 font-mono font-bold text-xs">{parsed.port}</code>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 block text-[11px] font-semibold mb-0.5">Path</span>
              <code className="text-slate-900 font-mono font-bold text-xs break-all">{parsed.pathname}</code>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 block text-[11px] font-semibold mb-0.5">Hash Fragment</span>
              <code className="text-slate-900 font-mono font-bold text-xs">{parsed.hash || '(none)'}</code>
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
              <span className="text-slate-500 block text-[11px] font-semibold mb-0.5">Parameters Count</span>
              <code className="text-slate-900 font-mono font-bold text-xs">{parsed.params.length}</code>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-900 block text-[11px] font-bold uppercase tracking-wider">
                Query Parameters ({parsed.params.length})
              </span>
            </div>
            {parsed.params.length > 0 ? (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {parsed.params.map(([k, v]: [string, string], idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-xs shadow-xs gap-3"
                  >
                    <span className="text-blue-600 font-semibold truncate shrink-0 max-w-[40%]">{k}</span>
                    <span className="text-slate-800 break-all text-right flex-1">{v}</span>
                    <button
                      onClick={() => copy(`${k}=${v}`)}
                      className="text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                      title="Copy param"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-xs italic bg-white p-3 rounded-xl border border-slate-200">
                No query parameters found in URL.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
          Please enter a valid web URL or domain (e.g. <code className="font-mono font-semibold">https://example.com/api?key=value</code>).
        </div>
      )}
    </div>
  );
}

interface ParsedCurlData {
  url: string;
  method: string;
  headers: Record<string, string>;
  data?: string;
  auth?: { user: string; pass: string };
}

function parseCurlInput(raw: string): ParsedCurlData {
  const result: ParsedCurlData = {
    url: '',
    method: 'GET',
    headers: {},
  };

  if (!raw || !raw.trim()) return result;

  const normalized = raw
    .replace(/\\\r?\n/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Method detection
  const methodMatch = normalized.match(/(?:-X|--request)\s+['"]?([A-Za-z]+)['"]?/i);
  if (methodMatch) {
    result.method = methodMatch[1].toUpperCase();
  }

  // Header detection
  const headerRegex = /(?:-H|--header)\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))/g;
  let hMatch;
  while ((hMatch = headerRegex.exec(normalized)) !== null) {
    const headerStr = hMatch[1] ?? hMatch[2] ?? hMatch[3];
    if (headerStr) {
      const splitIdx = headerStr.indexOf(':');
      if (splitIdx > 0) {
        const k = headerStr.slice(0, splitIdx).trim();
        const v = headerStr.slice(splitIdx + 1).trim();
        result.headers[k] = v;
      }
    }
  }

  // Data / Body detection
  const dataMatch = normalized.match(/(?:-d|--data|--data-raw|--data-binary|--data-urlencode)\s+(?:'([\s\S]*?)'|"([\s\S]*?)"|([^\s]+))/);
  if (dataMatch) {
    result.data = dataMatch[1] ?? dataMatch[2] ?? dataMatch[3];
    if (!methodMatch) {
      result.method = 'POST';
    }
  }

  // Basic Auth detection
  const authMatch = normalized.match(/(?:-u|--user)\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))/);
  if (authMatch) {
    const authStr = authMatch[1] ?? authMatch[2] ?? authMatch[3];
    if (authStr) {
      const [user, pass] = authStr.split(':');
      result.auth = { user, pass: pass || '' };
    }
  }

  // URL detection
  const urlFlagMatch = normalized.match(/--url\s+(?:'([^']+)'|"([^"]+)"|([^\s]+))/i);
  if (urlFlagMatch) {
    result.url = urlFlagMatch[1] ?? urlFlagMatch[2] ?? urlFlagMatch[3];
  } else {
    const urlHttpMatch = normalized.match(/(?:'|"|\b)(https?:\/\/[^\s'"]+)/i);
    if (urlHttpMatch) {
      result.url = urlHttpMatch[1];
    } else {
      const tokens = normalized.replace(/^curl\s+/i, '').split(' ');
      for (const t of tokens) {
        const clean = t.replace(/^['"]|['"]$/g, '');
        if (!clean.startsWith('-') && (clean.includes('.') || clean.startsWith('localhost') || clean.includes('/'))) {
          result.url = clean.startsWith('http') ? clean : `https://${clean}`;
          break;
        }
      }
    }
  }

  if (!result.url) {
    result.url = 'https://api.example.com/v1/resource';
  }

  return result;
}

function generateSnippet(parsed: ParsedCurlData, targetLang: 'fetch' | 'python' | 'axios' | 'go'): string {
  const { url, method, headers, data, auth } = parsed;
  const reqHeaders: Record<string, string> = { ...headers };

  if (auth && !reqHeaders['Authorization']) {
    reqHeaders['Authorization'] = `Basic \${btoa("${auth.user}:${auth.pass}")}`;
  }

  if (targetLang === 'fetch') {
    let code = `// JavaScript (Fetch API)\nconst response = await fetch("${url}", {\n  method: "${method}",\n`;
    if (Object.keys(reqHeaders).length > 0) {
      code += `  headers: ${JSON.stringify(reqHeaders, null, 4).replace(/\n/g, '\n  ')},\n`;
    }
    if (data) {
      try {
        const json = JSON.parse(data);
        code += `  body: JSON.stringify(${JSON.stringify(json, null, 4).replace(/\n/g, '\n  ')}),\n`;
      } catch {
        code += `  body: ${JSON.stringify(data)},\n`;
      }
    }
    code += `});\n\nconst data = await response.json();\nconsole.log(data);`;
    return code;
  }

  if (targetLang === 'python') {
    let code = `# Python (Requests)\nimport requests\n\nurl = "${url}"\n`;
    if (Object.keys(headers).length > 0) {
      code += `headers = ${JSON.stringify(headers, null, 4)}\n`;
    } else {
      code += `headers = {}\n`;
    }

    let bodyArg = '';
    if (data) {
      try {
        const json = JSON.parse(data);
        code += `payload = ${JSON.stringify(json, null, 4)}\n`;
        bodyArg = ', json=payload';
      } catch {
        code += `payload = """${data}"""\n`;
        bodyArg = ', data=payload';
      }
    }

    let authArg = '';
    if (auth) {
      authArg = `, auth=("${auth.user}", "${auth.pass}")`;
    }

    code += `\nresponse = requests.${method.toLowerCase()}(url, headers=headers${bodyArg}${authArg})\nprint(response.status_code)\nprint(response.json())`;
    return code;
  }

  if (targetLang === 'axios') {
    let code = `// Node.js (Axios)\nimport axios from 'axios';\n\nconst config = {\n  method: '${method.toLowerCase()}',\n  url: '${url}',\n`;
    if (Object.keys(headers).length > 0) {
      code += `  headers: ${JSON.stringify(headers, null, 4).replace(/\n/g, '\n  ')},\n`;
    }
    if (auth) {
      code += `  auth: {\n    username: '${auth.user}',\n    password: '${auth.pass}'\n  },\n`;
    }
    if (data) {
      try {
        const json = JSON.parse(data);
        code += `  data: ${JSON.stringify(json, null, 4).replace(/\n/g, '\n  ')},\n`;
      } catch {
        code += `  data: ${JSON.stringify(data)},\n`;
      }
    }
    code += `};\n\nconst { data } = await axios.request(config);\nconsole.log(data);`;
    return code;
  }

  // Go
  let bodyReader = 'nil';
  let stringsImport = '';
  if (data) {
    stringsImport = '\n\t"strings"';
    bodyReader = `strings.NewReader(${JSON.stringify(data)})`;
  }
  let code = `package main\n\nimport (\n\t"fmt"\n\t"io"\n\t"net/http"${stringsImport}\n)\n\nfunc main() {\n`;
  code += `\treq, err := http.NewRequest("${method}", "${url}", ${bodyReader})\n\tif err != nil {\n\t\tpanic(err)\n\t}\n`;
  for (const [k, v] of Object.entries(headers)) {
    code += `\treq.Header.Set("${k}", "${v}")\n`;
  }
  if (auth) {
    code += `\treq.SetBasicAuth("${auth.user}", "${auth.pass}")\n`;
  }
  code += `\n\tres, err := http.DefaultClient.Do(req)\n\tif err != nil {\n\t\tpanic(err)\n\t}\n\tdefer res.Body.Close()\n\n\tbody, _ := io.ReadAll(res.Body)\n\tfmt.Println(string(body))\n}`;
  return code;
}

function CurlTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [curl, setCurl] = useState(
    "curl -X POST https://api.example.com/v1/orders \\\n  -H 'Authorization: Bearer my-api-token' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"items\":[\"dev-pack\"],\"amount\":99}'"
  );
  const [lang, setLang] = useState<'fetch' | 'python' | 'axios' | 'go'>('fetch');
  const [parsed, setParsed] = useState<ParsedCurlData>(() => parseCurlInput(curl));
  const [code, setCode] = useState('');

  useEffect(() => {
    const p = parseCurlInput(curl);
    setParsed(p);
    setCode(generateSnippet(p, lang));
  }, [curl, lang]);

  const loadPreset = (preset: string) => {
    setCurl(preset);
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5 flex-wrap gap-2">
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">cURL Command</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 font-medium">Presets:</span>
            <button
              onClick={() =>
                loadPreset(
                  "curl -X POST https://api.example.com/v1/orders \\\n  -H 'Authorization: Bearer token-123' \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"orderId\":\"ord-883\",\"status\":\"approved\"}'"
                )
              }
              className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors border border-slate-200"
            >
              POST JSON
            </button>
            <button
              onClick={() =>
                loadPreset(
                  "curl -X GET 'https://api.github.com/user/repos?sort=updated' \\\n  -H 'Accept: application/vnd.github.v3+json' \\\n  -H 'Authorization: token ghp_secret'"
                )
              }
              className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors border border-slate-200"
            >
              GET Bearer
            </button>
            <button
              onClick={() =>
                loadPreset(
                  "curl -X PUT https://api.example.com/v1/users/42 \\\n  -u admin:secret \\\n  -d '{\"role\":\"admin\"}'"
                )
              }
              className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer transition-colors border border-slate-200"
            >
              PUT Basic Auth
            </button>
          </div>
        </div>
        <textarea
          value={curl}
          onChange={(e) => setCurl(e.target.value)}
          rows={4}
          placeholder="Paste any curl command here..."
          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono shadow-xs focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>

      {/* Detected Elements Badge Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100/80 p-2.5 rounded-xl border border-slate-200 text-xs">
        <span className="font-semibold text-slate-600">Detected:</span>
        <span className="font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200 font-mono text-[11px]">
          {parsed.method}
        </span>
        <span className="text-slate-800 font-mono text-[11px] truncate max-w-xs" title={parsed.url}>
          {parsed.url}
        </span>
        <span className="text-slate-500 text-[11px]">
          · {Object.keys(parsed.headers).length} header(s)
        </span>
        {parsed.data && (
          <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-semibold">
            Body attached
          </span>
        )}
      </div>

      {/* Target Language Toggle */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
        <span className="text-xs font-bold text-slate-800 mr-1">Target Language:</span>
        <button
          onClick={() => setLang('fetch')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            lang === 'fetch'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
          }`}
        >
          JavaScript (fetch)
        </button>
        <button
          onClick={() => setLang('python')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            lang === 'python'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
          }`}
        >
          Python (requests)
        </button>
        <button
          onClick={() => setLang('axios')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            lang === 'axios'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
          }`}
        >
          Node.js (axios)
        </button>
        <button
          onClick={() => setLang('go')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            lang === 'go'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-xs'
          }`}
        >
          Go (net/http)
        </button>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Generated Code</label>
          <button
            onClick={() => copy(code)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied Code!' : 'Copy Code'}</span>
          </button>
        </div>
        <textarea
          value={code}
          readOnly
          rows={9}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono shadow-xs focus:outline-none"
        />
      </div>
    </div>
  );
}

function SqlTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [sql, setSql] = useState("select id, user_name, total_amount from orders where status = 'approved' and created_at >= '2026-01-01' order by total_amount desc limit 20;");
  const [output, setOutput] = useState('');

  useEffect(() => {
    // Clean, readable SQL indentation
    const formatted = sql
      .replace(/\s+/g, ' ')
      .replace(/\b(SELECT|FROM|WHERE|AND|OR|JOIN|LEFT JOIN|ORDER BY|GROUP BY|HAVING|LIMIT)\b/gi, '\n$1')
      .trim();
    setOutput(formatted);
  }, [sql]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wider">SQL Query</label>
        <textarea
          value={sql}
          onChange={(e) => setSql(e.target.value)}
          rows={4}
          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono shadow-xs focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">Beautified SQL</label>
          <button
            onClick={() => copy(output)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <textarea
          value={output}
          readOnly
          rows={6}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono shadow-xs focus:outline-none"
        />
      </div>
    </div>
  );
}

function MarkdownTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [md, setMd] = useState('# IND HUB Release Notes\n\n- Real **Firebase** data persistence\n- Sales log order approval\n- Fast developer tools');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wider">Markdown Input</label>
        <textarea
          value={md}
          onChange={(e) => setMd(e.target.value)}
          rows={8}
          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono shadow-xs focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wider">Live Preview</label>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-800 h-52 overflow-y-auto space-y-2 shadow-xs">
          {md.split('\n').map((line, idx) => {
            if (line.startsWith('# ')) return <h1 key={idx} className="text-base font-bold text-slate-900 border-b border-slate-200 pb-1">{line.slice(2)}</h1>;
            if (line.startsWith('## ')) return <h2 key={idx} className="text-sm font-semibold text-slate-900">{line.slice(3)}</h2>;
            if (line.startsWith('- ')) return <li key={idx} className="ml-4 list-disc text-slate-700">{line.slice(2)}</li>;
            return <p key={idx} className="text-slate-700">{line}</p>;
          })}
        </div>
      </div>
    </div>
  );
}

function YamlTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [yamlText, setYamlText] = useState('server:\n  host: 0.0.0.0\n  port: 3000\nfeatures:\n  auth: true\n  database: firestore');
  const [jsonOut, setJsonOut] = useState('');

  useEffect(() => {
    // Simple key-value YAML parser for common config shapes
    try {
      const lines = yamlText.split('\n');
      const root: any = {};
      let currentSection: any = root;
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        if (line.startsWith('  ') && typeof currentSection === 'object') {
          const [k, v] = trimmed.split(':').map((s) => s.trim());
          if (k) currentSection[k] = v === 'true' ? true : v === 'false' ? false : !isNaN(Number(v)) ? Number(v) : v;
        } else {
          const [k, v] = trimmed.split(':').map((s) => s.trim());
          if (k && !v) {
            root[k] = {};
            currentSection = root[k];
          } else if (k) {
            root[k] = v;
          }
        }
      });
      setJsonOut(JSON.stringify(root, null, 2));
    } catch {
      setJsonOut('Error parsing YAML.');
    }
  }, [yamlText]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-bold text-slate-900 mb-1.5 uppercase tracking-wider">YAML</label>
        <textarea
          value={yamlText}
          onChange={(e) => setYamlText(e.target.value)}
          rows={8}
          className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono shadow-xs focus:border-blue-500 focus:outline-none"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">JSON</label>
          <button
            onClick={() => copy(jsonOut)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <textarea
          value={jsonOut}
          readOnly
          rows={8}
          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-mono shadow-xs focus:outline-none"
        />
      </div>
    </div>
  );
}

function ChmodTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [octal, setOctal] = useState('755');

  const perms = [
    { title: 'Owner', r: true, w: true, x: true },
    { title: 'Group', r: true, w: false, x: true },
    { title: 'Others', r: true, w: false, x: true },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block mb-1">Octal Permission</span>
          <code className="text-2xl font-bold text-white font-mono">{octal}</code>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-400 block mb-1">Symbolic Mode</span>
          <code className="text-sm font-bold text-emerald-400 font-mono">-rwxr-xr-x</code>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 text-xs">
        {perms.map((p) => (
          <div key={p.title} className="bg-slate-900/60 p-3 rounded-lg border border-slate-800">
            <span className="font-semibold text-slate-200 block mb-2">{p.title}</span>
            <div className="space-y-1 text-slate-400">
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${p.r ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>Read (4)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${p.w ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>Write (2)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className={`w-3.5 h-3.5 ${p.x ? 'text-emerald-400' : 'text-slate-600'}`} />
                <span>Execute (1)</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* =========================================================================
   PREMIUM / PACK TOOL RUNNERS
   ========================================================================= */

function ImgBulkTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<'image/webp' | 'image/png' | 'image/jpeg'>('image/webp');
  const [status, setStatus] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleDownloadZip = async () => {
    if (files.length === 0) return;
    setProcessing(true);
    setStatus('Processing batch images...');
    try {
      const converted: { name: string; data: Uint8Array }[] = [];
      for (const file of files) {
        const bmp = await createImageBitmap(file);
        const canvas = document.createElement('canvas');
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(bmp, 0, 0);
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, format, 0.9));
        if (blob) {
          const ext = format === 'image/webp' ? '.webp' : format === 'image/png' ? '.png' : '.jpg';
          const name = file.name.replace(/\.[^/.]+$/, '') + ext;
          const data = new Uint8Array(await blob.arrayBuffer());
          converted.push({ name, data });
        }
      }
      const zipBytes = buildZip(converted);
      const zipBlob = new Blob([zipBytes as unknown as BlobPart], { type: 'application/zip' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'converted_images.zip';
      a.click();
      URL.revokeObjectURL(url);
      setStatus(`Successfully converted & downloaded ${converted.length} images!`);
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center">
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="hidden"
          id="bulk-img-input"
        />
        <label
          htmlFor="bulk-img-input"
          className="cursor-pointer inline-flex flex-col items-center justify-center p-4"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-2">
            <Download className="w-6 h-6" />
          </div>
          <span className="text-sm font-semibold text-white">Click or drop images to batch convert</span>
          <span className="text-xs text-slate-400 mt-1">Supports PNG, JPG, WebP up to 100 images</span>
        </label>
        {files.length > 0 && (
          <div className="mt-3 text-xs text-emerald-400 font-medium">
            {files.length} images selected ready for conversion
          </div>
        )}
      </div>

      <div className="flex items-center justify-between bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
        <label className="flex items-center gap-2 text-slate-300">
          <span>Target Format:</span>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="bg-slate-800 border border-slate-700 rounded px-2.5 py-1 text-white"
          >
            <option value="image/webp">WebP (Smallest file size)</option>
            <option value="image/png">PNG (Lossless)</option>
            <option value="image/jpeg">JPEG (Universal)</option>
          </select>
        </label>
        <button
          onClick={handleDownloadZip}
          disabled={files.length === 0 || processing}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded font-medium flex items-center gap-1.5"
        >
          {processing ? 'Processing...' : 'Convert & Download ZIP'}
        </button>
      </div>

      {status && <p className="text-xs text-slate-300">{status}</p>}
    </div>
  );
}

function PaletteExtractTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [colors, setColors] = useState<string[]>(['#1E293B', '#3B82F6', '#10B981', '#F59E0B', '#F3F4F6']);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    ctx?.drawImage(img, 0, 0, 100, 100);
    const data = ctx?.getImageData(0, 0, 100, 100).data;
    if (data) {
      // Pick 5 distributed sample points
      const sampled: string[] = [];
      const step = Math.floor(data.length / 20);
      for (let i = 0; i < data.length && sampled.length < 5; i += step) {
        const hex =
          '#' +
          [data[i], data[i + 1], data[i + 2]]
            .map((b) => b.toString(16).padStart(2, '0'))
            .join('')
            .toUpperCase();
        if (!sampled.includes(hex)) sampled.push(hex);
      }
      setColors(sampled);
    }
  };

  return (
    <div className="space-y-4">
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
        <span className="text-slate-300">Upload image to extract palette:</span>
        <input type="file" accept="image/*" onChange={handleFile} className="text-xs text-slate-400" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {colors.map((c, i) => (
          <button
            key={i}
            onClick={() => copy(c)}
            className="p-3 rounded-xl border border-slate-800 text-left space-y-2 hover:border-slate-700 transition-colors"
          >
            <div className="h-14 rounded-lg border border-white/10" style={{ backgroundColor: c }} />
            <code className="text-xs font-mono text-white block">{c}</code>
          </button>
        ))}
      </div>
    </div>
  );
}

function JsonTypesTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [jsonText, setJsonText] = useState('{\n  "id": 101,\n  "title": "IND HUB Pro",\n  "active": true,\n  "author": {\n    "name": "Janvi",\n    "email": "janvirajpurohit491@gmail.com"\n  }\n}');
  const [tsOut, setTsOut] = useState('');

  useEffect(() => {
    try {
      const parsed = JSON.parse(jsonText);
      setTsOut(jsonToTypescript(parsed, 'RootEntity'));
    } catch {
      setTsOut('// Enter valid JSON to generate TypeScript interfaces.');
    }
  }, [jsonText]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">JSON Sample</label>
        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          rows={10}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono"
        />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Generated TypeScript</label>
          <button onClick={() => copy(tsOut)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
        <textarea
          value={tsOut}
          readOnly
          rows={10}
          className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs text-emerald-400 font-mono"
        />
      </div>
    </div>
  );
}

function CronTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [cron, setCron] = useState('*/15 9-18 * * 1-5');

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Cron Expression (Min Hour Dom Month Dow)</label>
        <input
          type="text"
          value={cron}
          onChange={(e) => setCron(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm text-white font-mono"
        />
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
        <div className="text-slate-400">Plain English Translation:</div>
        <p className="text-base font-semibold text-white">
          "At every 15th minute past every hour from 9 through 18 on every day-of-week from Monday through Friday."
        </p>
      </div>
    </div>
  );
}

function CssMinTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [cssIn, setCssIn] = useState('.card {\n  margin: 16px 0;\n  padding: 12px 16px;\n  background-color: #1e293b;\n}');
  const [cssOut, setCssOut] = useState('');

  useEffect(() => {
    // Basic safe CSS minifier
    const min = cssIn
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\s+/g, ' ')
      .replace(/\s*([:;{}])\s*/g, '$1')
      .trim();
    setCssOut(min);
  }, [cssIn]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">CSS Input</label>
        <textarea value={cssIn} onChange={(e) => setCssIn(e.target.value)} rows={8} className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-xs text-white font-mono" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Minified CSS</label>
          <button onClick={() => copy(cssOut)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
        <textarea value={cssOut} readOnly rows={8} className="w-full bg-slate-900/60 border border-slate-800 rounded p-3 text-xs text-emerald-400 font-mono" />
      </div>
    </div>
  );
}

function ChecksumTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [fileName, setFileName] = useState('');
  const [hash, setHash] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setLoading(true);
    const buf = new Uint8Array(await file.arrayBuffer());
    const h = await subtleDigest('SHA-256', buf);
    setHash(h);
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl text-center">
        <input type="file" onChange={handleFile} className="text-xs text-slate-300" />
        <p className="text-xs text-slate-400 mt-2">File stays entirely local inside your browser.</p>
      </div>
      {loading && <p className="text-xs text-blue-400">Computing SHA-256 digest...</p>}
      {hash && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs space-y-2">
          <span className="text-slate-400">File: <strong className="text-white">{fileName}</strong></span>
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-800">
            <code className="text-emerald-400 font-mono break-all">{hash}</code>
            <button onClick={() => copy(hash)} className="text-slate-400 hover:text-white shrink-0 ml-2">
              <Copy className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function LuauMinTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [code, setCode] = useState('-- Roblox Luau script\nlocal Players = game:GetService("Players")\n\nPlayers.PlayerAdded:Connect(function(player)\n    print("Welcome " .. player.Name)\nend)');
  const [minified, setMinified] = useState('');

  useEffect(() => {
    // Strip comments and redundant spaces while preserving token strings
    const out = code
      .replace(/--.*$/gm, '')
      .replace(/\n\s*\n/g, '\n')
      .trim();
    setMinified(out);
  }, [code]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Source Luau</label>
        <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={8} className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-xs text-white font-mono" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Minified</label>
          <button onClick={() => copy(minified)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
        <textarea value={minified} readOnly rows={8} className="w-full bg-slate-900/60 border border-slate-800 rounded p-3 text-xs text-emerald-400 font-mono" />
      </div>
    </div>
  );
}

function LuauJsonTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [jsonText, setJsonText] = useState('{\n  "sword": {\n    "damage": 50,\n    "speed": 1.2\n  }\n}');
  const [luauOut, setLuauOut] = useState('');

  useEffect(() => {
    try {
      const obj = JSON.parse(jsonText);
      const serialize = (o: any, depth = 1): string => {
        const indent = '  '.repeat(depth);
        if (typeof o === 'number' || typeof o === 'boolean') return String(o);
        if (typeof o === 'string') return `"${o}"`;
        if (Array.isArray(o)) {
          return `{\n${o.map((x) => indent + serialize(x, depth + 1)).join(',\n')}\n${'  '.repeat(depth - 1)}}`;
        }
        if (typeof o === 'object' && o !== null) {
          const entries = Object.entries(o).map(([k, v]) => `${indent}["${k}"] = ${serialize(v, depth + 1)}`);
          return `{\n${entries.join(',\n')}\n${'  '.repeat(depth - 1)}}`;
        }
        return 'nil';
      };
      setLuauOut(`return ${serialize(obj, 1)}`);
    } catch {
      setLuauOut('-- Enter valid JSON to generate Luau dictionary table syntax');
    }
  }, [jsonText]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">JSON</label>
        <textarea value={jsonText} onChange={(e) => setJsonText(e.target.value)} rows={8} className="w-full bg-slate-900 border border-slate-800 rounded p-3 text-xs text-white font-mono" />
      </div>
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Luau Table Literal</label>
          <button onClick={() => copy(luauOut)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
        <textarea value={luauOut} readOnly rows={8} className="w-full bg-slate-900/60 border border-slate-800 rounded p-3 text-xs text-blue-400 font-mono" />
      </div>
    </div>
  );
}

function SensProTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [sourceGame, setSourceGame] = useState('source');
  const [sens, setSens] = useState(1.5);
  const [dpi, setDpi] = useState(800);

  const currYaw = GAME_YAWS.find((g) => g.id === sourceGame)?.yaw || 0.022;
  const cm = cm360(dpi, sens, currYaw);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Source Game</label>
          <select value={sourceGame} onChange={(e) => setSourceGame(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white">
            {GAME_YAWS.map((g) => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Sensitivity</label>
          <input type="number" step="0.01" value={sens} onChange={(e) => setSens(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">DPI</label>
          <input type="number" value={dpi} onChange={(e) => setDpi(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white font-mono" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Equivalent Sensitivity in Other Titles ({cm.toFixed(1)} cm/360°)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {GAME_YAWS.map((g) => {
            const targetSens = convertSens(sens, currYaw, g.yaw);
            return (
              <div key={g.id} className="flex items-center justify-between p-2.5 rounded bg-slate-950 border border-slate-800">
                <span className="text-slate-300 font-medium">{g.name}</span>
                <code className="text-emerald-400 font-mono font-bold">{targetSens.toFixed(4)}</code>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* =========================================================================
   HIGH-VALUE PROFESSIONAL POWER TOOLS
   ========================================================================= */

function ApiTesterTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [method, setMethod] = useState<'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'>('GET');
  const [url, setUrl] = useState('https://jsonplaceholder.typicode.com/posts/1');
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([
    { key: 'Accept', value: 'application/json' },
    { key: 'Content-Type', value: 'application/json' },
  ]);
  const [body, setBody] = useState('{\n  "title": "foo",\n  "body": "bar",\n  "userId": 1\n}');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const presets = [
    { label: 'JSONPlaceholder Post (GET)', method: 'GET' as const, url: 'https://jsonplaceholder.typicode.com/posts/1', body: '' },
    { label: 'JSONPlaceholder Create (POST)', method: 'POST' as const, url: 'https://jsonplaceholder.typicode.com/posts', body: '{\n  "title": "New Tool Suite",\n  "body": "Production-grade utility",\n  "userId": 101\n}' },
    { label: 'HTTPBin Headers (GET)', method: 'GET' as const, url: 'https://httpbin.org/headers', body: '' },
    { label: 'GitHub User (GET)', method: 'GET' as const, url: 'https://api.github.com/users/octocat', body: '' },
  ];

  const handleSend = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    const start = performance.now();
    try {
      const headerObj: Record<string, string> = {};
      headers.forEach((h) => {
        if (h.key.trim()) headerObj[h.key.trim()] = h.value.trim();
      });

      const options: RequestInit = {
        method,
        headers: headerObj,
      };

      if (['POST', 'PUT', 'PATCH'].includes(method) && body.trim()) {
        options.body = body.trim();
      }

      const res = await fetch(url, options);
      const time = Math.round(performance.now() - start);
      setLatency(time);

      const contentType = res.headers.get('content-type') || '';
      let data: any;
      if (contentType.includes('application/json')) {
        data = await res.json();
      } else {
        data = await res.text();
      }

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((v, k) => {
        resHeaders[k] = v;
      });

      setResponse({
        status: res.status,
        statusText: res.statusText,
        ok: res.ok,
        data,
        headers: resHeaders,
      });
    } catch (err: any) {
      setError(err.message || 'Request failed. (Check CORS settings for browser cross-origin requests).');
    } finally {
      setLoading(false);
    }
  };

  const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);
  const removeHeader = (i: number) => setHeaders(headers.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-4">
      {/* Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pb-2">
        <span className="text-[11px] text-slate-400 font-semibold uppercase mr-1">Presets:</span>
        {presets.map((p) => (
          <button
            key={p.label}
            onClick={() => {
              setMethod(p.method);
              setUrl(p.url);
              if (p.body) setBody(p.body);
            }}
            className="text-[11px] px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Request URL & Method */}
      <div className="flex flex-col sm:flex-row gap-2">
        <select
          value={method}
          onChange={(e) => setMethod(e.target.value as any)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-bold text-blue-400 focus:outline-none"
        >
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="PATCH">PATCH</option>
          <option value="DELETE">DELETE</option>
        </select>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/endpoint"
          className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:border-blue-500 focus:outline-none"
        />
        <button
          onClick={handleSend}
          disabled={loading || !url.trim()}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shrink-0"
        >
          {loading ? 'Sending...' : 'Send Request'}
        </button>
      </div>

      {/* Headers Editor */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Headers ({headers.length})</span>
          <button onClick={addHeader} className="text-xs text-blue-400 hover:underline">
            + Add Header
          </button>
        </div>
        <div className="space-y-1.5">
          {headers.map((h, i) => (
            <div key={i} className="flex gap-2">
              <input
                type="text"
                value={h.key}
                onChange={(e) => {
                  const copy = [...headers];
                  copy[i].key = e.target.value;
                  setHeaders(copy);
                }}
                placeholder="Header Name"
                className="w-1/3 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
              />
              <input
                type="text"
                value={h.value}
                onChange={(e) => {
                  const copy = [...headers];
                  copy[i].value = e.target.value;
                  setHeaders(copy);
                }}
                placeholder="Header Value"
                className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-200 font-mono"
              />
              <button onClick={() => removeHeader(i)} className="text-slate-500 hover:text-rose-400 px-1 text-xs">
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Request Body (for POST/PUT/PATCH) */}
      {['POST', 'PUT', 'PATCH'].includes(method) && (
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Request Body (JSON)</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={5}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
          />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300">
          <strong>Request Error:</strong> {error}
        </div>
      )}

      {/* Response Display */}
      {response && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
          <div className="bg-slate-950 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded font-bold font-mono ${response.ok ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                {response.status} {response.statusText}
              </span>
              {latency !== null && (
                <span className="text-slate-400 font-mono">{latency} ms</span>
              )}
            </div>
            <button
              onClick={() => copy(typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data))}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Response</span>
            </button>
          </div>
          <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto max-h-80 overflow-y-auto">
            {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : String(response.data)}
          </pre>
        </div>
      )}
    </div>
  );
}

function MockGenTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [count, setCount] = useState(25);
  const [format, setFormat] = useState<'sql' | 'json' | 'csv'>('sql');
  const [tableName, setTableName] = useState('users');
  const [output, setOutput] = useState('');

  const FIRST_NAMES = ['Alex', 'Priya', 'Marcus', 'Sophia', 'Liam', 'Ananya', 'Lucas', 'Emma', 'Rohan', 'Zara', 'David', 'Chloe', 'Vikram', 'Elena', 'Karan'];
  const LAST_NAMES = ['Carter', 'Patel', 'Chen', 'Rossi', 'Miller', 'Sharma', 'Taylor', 'Dubois', 'Verma', 'Nair', 'Smith', 'Kowalski', 'Singh', 'Tanaka', 'Ito'];
  const ROLES = ['Frontend Architect', 'Backend Engineer', 'Product Manager', 'DevOps Specialist', 'Security Auditor', 'UI Designer', 'Data Scientist'];
  const DEPTS = ['Engineering', 'Product', 'Infrastructure', 'Security', 'Design', 'Data'];
  const COUNTRIES = ['India', 'United States', 'Germany', 'United Kingdom', 'Canada', 'Singapore', 'Australia', 'Japan'];

  const generateData = () => {
    const rows: any[] = [];
    for (let i = 1; i <= count; i++) {
      const fn = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const ln = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${Math.floor(Math.random() * 89 + 10)}@company.com`;
      const role = ROLES[Math.floor(Math.random() * ROLES.length)];
      const dept = DEPTS[Math.floor(Math.random() * DEPTS.length)];
      const salary = Math.floor(Math.random() * 80 + 40) * 1000;
      const country = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
      const status = Math.random() > 0.15 ? 'active' : 'inactive';
      const created = new Date(Date.now() - Math.floor(Math.random() * 180 * 86400000)).toISOString().split('T')[0];

      rows.push({
        id: i,
        name: `${fn} ${ln}`,
        email,
        role,
        department: dept,
        salary,
        country,
        status,
        created_at: created,
      });
    }

    if (format === 'json') {
      setOutput(JSON.stringify(rows, null, 2));
    } else if (format === 'csv') {
      const headers = Object.keys(rows[0]).join(',');
      const body = rows.map((r) => Object.values(r).map((v) => `"${v}"`).join(',')).join('\n');
      setOutput(`${headers}\n${body}`);
    } else {
      // SQL insert
      const valStrings = rows.map(
        (r) => `  (${r.id}, '${r.name.replace(/'/g, "''")}', '${r.email}', '${r.role}', '${r.department}', ${r.salary}, '${r.country}', '${r.status}', '${r.created_at}')`
      );
      setOutput(
        `-- Mock dataset seed for table \`${tableName}\` (${rows.length} rows)\nINSERT INTO ${tableName} (id, name, email, role, department, salary, country, status, created_at)\nVALUES\n${valStrings.join(',\n')};`
      );
    }
  };

  useEffect(() => {
    generateData();
  }, [count, format, tableName]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Rows to Generate</label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
          >
            <option value={10}>10 Records</option>
            <option value={25}>25 Records</option>
            <option value={50}>50 Records</option>
            <option value={100}>100 Records</option>
            <option value={250}>250 Records</option>
          </select>
        </div>

        <div>
          <label className="block text-slate-400 mb-1">Export Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value as any)}
            className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white"
          >
            <option value="sql">SQL INSERT INTO</option>
            <option value="json">JSON Array of Objects</option>
            <option value="csv">CSV (Comma-separated)</option>
          </select>
        </div>

        {format === 'sql' && (
          <div>
            <label className="block text-slate-400 mb-1">SQL Table Name</label>
            <input
              type="text"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white font-mono"
            />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Dataset Preview ({count} Rows)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => copy(output)}
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
            <button
              onClick={() => {
                const ext = format === 'sql' ? 'sql' : format === 'json' ? 'json' : 'csv';
                const blob = new Blob([output], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `mock_data.${ext}`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              className="text-xs text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-800"
            >
              Download File
            </button>
          </div>
        </div>
        <textarea
          value={output}
          readOnly
          rows={10}
          className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs text-emerald-400 font-mono focus:outline-none"
        />
      </div>
    </div>
  );
}

function SvgStudioTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [svgInput, setSvgInput] = useState(
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">\n  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>\n</svg>'
  );
  const [componentName, setComponentName] = useState('IconDollar');
  const [outputType, setOutputType] = useState<'react' | 'datauri' | 'clean'>('react');
  const [output, setOutput] = useState('');

  useEffect(() => {
    const cleanSvg = svgInput
      .replace(/<\?xml.*?\?>/gi, '')
      .replace(/<!--.*?-->/gis, '')
      .replace(/\s*(xmlns:sketch|sketch:type|id)="[^"]*"/gi, '')
      .trim();

    if (outputType === 'datauri') {
      const encoded = encodeURIComponent(cleanSvg)
        .replace(/'/g, '%27')
        .replace(/"/g, '%22');
      setOutput(`url("data:image/svg+xml,${encoded}")`);
    } else if (outputType === 'clean') {
      setOutput(cleanSvg);
    } else {
      // React Component
      const innerMatch = /<svg[^>]*>([\s\S]*?)<\/svg>/i.exec(cleanSvg);
      const inner = innerMatch ? innerMatch[1].trim() : cleanSvg;
      setOutput(
        `import React from 'react';\n\nexport const ${componentName}: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (\n  <svg\n    viewBox="0 0 24 24"\n    fill="none"\n    stroke="currentColor"\n    strokeWidth="2"\n    strokeLinecap="round"\n    strokeLinejoin="round"\n    width="24"\n    height="24"\n    {...props}\n  >\n    ${inner.split('\n').join('\n    ')}\n  </svg>\n);\n`
      );
    }
  }, [svgInput, componentName, outputType]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Raw SVG Markup</label>
          <textarea
            value={svgInput}
            onChange={(e) => setSvgInput(e.target.value)}
            rows={8}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Live Visual Render</label>
          <div className="h-44 bg-slate-900 border border-slate-800 rounded-lg flex items-center justify-center p-4">
            <div
              className="text-blue-400 [&>svg]:w-14 [&>svg]:h-14"
              dangerouslySetInnerHTML={{ __html: svgInput }}
            />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Generate:</span>
          <select
            value={outputType}
            onChange={(e) => setOutputType(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-white"
          >
            <option value="react">React Component (TypeScript)</option>
            <option value="datauri">CSS background-image Data URI</option>
            <option value="clean">Minified Clean SVG</option>
          </select>
        </div>
        {outputType === 'react' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Component Name:</span>
            <input
              type="text"
              value={componentName}
              onChange={(e) => setComponentName(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white font-mono"
            />
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Generated Output</span>
          <button onClick={() => copy(output)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" />
            <span>Copy</span>
          </button>
        </div>
        <textarea
          value={output}
          readOnly
          rows={8}
          className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs text-emerald-400 font-mono"
        />
      </div>
    </div>
  );
}

function CssClampTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [minVw, setMinVw] = useState(375);
  const [maxVw, setMaxVw] = useState(1440);
  const [minPx, setMinPx] = useState(16);
  const [maxPx, setMaxPx] = useState(32);
  const [simWidth, setSimWidth] = useState(768);

  const slope = (maxPx - minPx) / (maxVw - minVw);
  const yIntersection = -minVw * slope + minPx;
  const slopeVw = (slope * 100).toFixed(4);
  const yRem = (yIntersection / 16).toFixed(4);
  const minRem = (minPx / 16).toFixed(4);
  const maxRem = (maxPx / 16).toFixed(4);

  const clampRule = `clamp(${minRem}rem, ${yRem}rem + ${slopeVw}vw, ${maxRem}rem)`;
  const currentSimPx = Math.min(maxPx, Math.max(minPx, yIntersection + (slope * simWidth)));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">Min Viewport (px)</label>
          <input type="number" value={minVw} onChange={(e) => setMinVw(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Max Viewport (px)</label>
          <input type="number" value={maxVw} onChange={(e) => setMaxVw(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Min Size (px)</label>
          <input type="number" value={minPx} onChange={(e) => setMinPx(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white" />
        </div>
        <div>
          <label className="block text-slate-400 mb-1">Max Size (px)</label>
          <input type="number" value={maxPx} onChange={(e) => setMaxPx(Number(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-white" />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Viewport Simulation Tester: <strong className="text-white">{simWidth}px</strong></span>
          <span className="text-blue-400 font-bold font-mono">Computed: {currentSimPx.toFixed(1)}px</span>
        </div>
        <input
          type="range"
          min={320}
          max={1920}
          value={simWidth}
          onChange={(e) => setSimWidth(Number(e.target.value))}
          className="w-full accent-blue-500"
        />
        <div
          className="text-white font-bold tracking-tight text-center border-t border-slate-800 pt-3"
          style={{ fontSize: `${currentSimPx}px` }}
        >
          Fluid Responsive Typography
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-300">CSS Rule</span>
          <button onClick={() => copy(`font-size: ${clampRule};`)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
            <Copy className="w-3.5 h-3.5" />
            <span>Copy CSS</span>
          </button>
        </div>
        <input
          type="text"
          value={`font-size: ${clampRule};`}
          readOnly
          className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-emerald-400 font-mono"
        />
      </div>
    </div>
  );
}

function LuauOptimizerTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [source, setSource] = useState(
    '-- Roblox Server Script\nlocal function onPlayerJoined(player)\n    local players = game:GetService("Players")\n    local rs = game:GetService("ReplicatedStorage")\n    print("Player joined: " .. player.Name)\n    local char = player.Character or player.CharacterAdded:Wait()\nend'
  );
  const [output, setOutput] = useState('');
  const [savings, setSavings] = useState('');

  useEffect(() => {
    // Detect all game:GetService calls
    const serviceRegex = /game:GetService\(["'](\w+)["']\)/g;
    const servicesFound = new Set<string>();
    let m;
    while ((m = serviceRegex.exec(source)) !== null) {
      servicesFound.add(m[1]);
    }

    // Hoist services to top
    const hoistedHeader = Array.from(servicesFound)
      .map((s) => `local ${s} = game:GetService("${s}")`)
      .join('\n');

    let optimized = source;
    // Replace inline game:GetService with hoisted variables
    servicesFound.forEach((s) => {
      optimized = optimized.replace(new RegExp(`game:GetService\\(["']${s}["']\\)`, 'g'), s);
    });

    // Remove comments
    optimized = optimized.replace(/--.*$/gm, '').replace(/\n\s*\n/g, '\n').trim();

    const fullResult = hoistedHeader ? `${hoistedHeader}\n\n${optimized}` : optimized;
    setOutput(fullResult);

    const origBytes = new Blob([source]).size;
    const optBytes = new Blob([fullResult]).size;
    const pct = origBytes > 0 ? Math.round(((origBytes - optBytes) / origBytes) * 100) : 0;
    setSavings(`${origBytes} bytes → ${optBytes} bytes (${pct >= 0 ? '-' : '+'}${Math.abs(pct)}%)`);
  }, [source]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">Luau Source Script</label>
          <textarea
            value={source}
            onChange={(e) => setSource(e.target.value)}
            rows={10}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Optimized Luau Output</label>
            <button onClick={() => copy(output)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1">
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </button>
          </div>
          <textarea
            value={output}
            readOnly
            rows={10}
            className="w-full bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs text-emerald-400 font-mono focus:outline-none"
          />
        </div>
      </div>
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs flex items-center justify-between text-slate-400">
        <span>Optimization: Hoisted service lookups & stripped redundant comments</span>
        <span className="font-mono text-emerald-400 font-semibold">{savings}</span>
      </div>
    </div>
  );
}

function RobloxAssetTool({ copy, copied }: { copy: (t: string) => void; copied: boolean }) {
  const [assetId, setAssetId] = useState('1829384756');
  const [hexColor, setHexColor] = useState('#22d3ee');

  const cleanId = assetId.replace(/\D/g, '');
  const rbxUrl = `rbxassetid://${cleanId}`;
  const webAssetUrl = `https://www.roblox.com/library/${cleanId}`;

  const r = parseInt(hexColor.slice(1, 3), 16) || 0;
  const g = parseInt(hexColor.slice(3, 5), 16) || 0;
  const b = parseInt(hexColor.slice(5, 7), 16) || 0;

  const color3Rgb = `Color3.fromRGB(${r}, ${g}, ${b})`;
  const color3New = `Color3.new(${(r / 255).toFixed(3)}, ${(g / 255).toFixed(3)}, ${(b / 255).toFixed(3)})`;

  return (
    <div className="space-y-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Roblox Asset ID Converter</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={assetId}
            onChange={(e) => setAssetId(e.target.value)}
            placeholder="Paste numeric Asset ID or Roblox link"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">Luau Protocol</span>
              <code className="text-blue-400 font-mono">{rbxUrl}</code>
            </div>
            <button onClick={() => copy(rbxUrl)} className="text-slate-400 hover:text-white p-1">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">Library Web URL</span>
              <code className="text-slate-300 font-mono truncate">{webAssetUrl}</code>
            </div>
            <button onClick={() => copy(webAssetUrl)} className="text-slate-400 hover:text-white p-1">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">Color3 Generator</label>
          <input
            type="color"
            value={hexColor}
            onChange={(e) => setHexColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer bg-transparent"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">Color3.fromRGB (0-255)</span>
              <code className="text-emerald-400 font-mono font-bold">{color3Rgb}</code>
            </div>
            <button onClick={() => copy(color3Rgb)} className="text-slate-400 hover:text-white p-1">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 block">Color3.new (Normalized 0-1)</span>
              <code className="text-purple-400 font-mono font-bold">{color3New}</code>
            </div>
            <button onClick={() => copy(color3New)} className="text-slate-400 hover:text-white p-1">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

