/**
 * Pure calculation & conversion engines for developer tools
 */

export const encUtf8 = (s: string) => new TextEncoder().encode(s);
export const decUtf8 = (b: Uint8Array) => new TextDecoder().decode(b);

export function bytesToBase64(bytes: Uint8Array): string {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + 0x8000)));
  }
  return btoa(s);
}

export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  let padded = clean;
  while (padded.length % 4 !== 0) padded += '=';
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

// CRC-32
const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  CRC_TABLE[n] = c >>> 0;
}
export function crc32(bytes: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// MD5 Pure JS implementation
const MD5_K = new Int32Array(64);
const MD5_S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
for (let i = 0; i < 64; i++) MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;

export function md5(bytes: Uint8Array): string {
  let a0 = 0x67452301,
    b0 = 0xefcdab89 | 0,
    c0 = 0x98badcfe | 0,
    d0 = 0x10325476;
  const n = bytes.length,
    full = n >>> 6,
    r = n - full * 64;
  const tail = new Uint8Array(r + 8 < 57 ? 64 : 128);
  tail.set(bytes.subarray(full * 64));
  tail[r] = 0x80;
  const tv = new DataView(tail.buffer);
  tv.setUint32(tail.length - 8, (n << 3) >>> 0, true);
  tv.setUint32(tail.length - 4, Math.floor(n / 536870912), true);
  const bv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const M = new Int32Array(16);

  const block = (dv: DataView, off: number) => {
    for (let i = 0; i < 16; i++) M[i] = dv.getInt32(off + i * 4, true);
    let A = a0,
      B = b0,
      C = c0,
      D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) & 15;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) & 15;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) & 15;
      }
      F = (F + A + MD5_K[i] + M[g]) | 0;
      A = D;
      D = C;
      C = B;
      const s = MD5_S[(i >> 4) * 4 + (i & 3)];
      B = (B + ((F << s) | (F >>> (32 - s)))) | 0;
    }
    a0 = (a0 + A) | 0;
    b0 = (b0 + B) | 0;
    c0 = (c0 + C) | 0;
    d0 = (d0 + D) | 0;
  };

  for (let k = 0; k < full; k++) block(bv, k * 64);
  for (let k = 0; k < tail.length; k += 64) block(tv, k);

  const out = new DataView(new ArrayBuffer(16));
  out.setInt32(0, a0, true);
  out.setInt32(4, b0, true);
  out.setInt32(8, c0, true);
  out.setInt32(12, d0, true);
  return Array.from(new Uint8Array(out.buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function subtleDigest(algo: string, bytes: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest(algo, bytes as unknown as BufferSource);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Simple ZIP builder for bulk image export
export function buildZip(files: { name: string; data: Uint8Array }[]): Uint8Array {
  const enc = (s: string) => new TextEncoder().encode(s);
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  const d = new Date();
  const dosTime = (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1);
  const dosDate = (Math.max(0, d.getFullYear() - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate();

  files.forEach((f) => {
    const nameBytes = enc(f.name);
    const crc = crc32(f.data);
    const size = f.data.length;

    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true);
    lh.setUint16(4, 20, true);
    lh.setUint16(6, 0x0800, true);
    lh.setUint16(8, 0, true);
    lh.setUint16(10, dosTime, true);
    lh.setUint16(12, dosDate, true);
    lh.setUint32(14, crc, true);
    lh.setUint32(18, size, true);
    lh.setUint32(22, size, true);
    lh.setUint16(26, nameBytes.length, true);
    lh.setUint16(28, 0, true);

    chunks.push(new Uint8Array(lh.buffer), nameBytes, f.data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true);
    ch.setUint16(4, 20, true);
    ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true);
    ch.setUint16(10, 0, true);
    ch.setUint16(12, dosTime, true);
    ch.setUint16(14, dosDate, true);
    ch.setUint32(16, crc, true);
    ch.setUint32(20, size, true);
    ch.setUint32(24, size, true);
    ch.setUint16(28, nameBytes.length, true);
    ch.setUint32(42, offset, true);

    central.push(new Uint8Array(ch.buffer), nameBytes);
    offset += 30 + nameBytes.length + size;
  });

  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);

  const all = chunks.concat(central, [new Uint8Array(end.buffer)]);
  const totalLen = all.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(totalLen);
  let p = 0;
  for (const c of all) {
    out.set(c, p);
    p += c.length;
  }
  return out;
}

// Gaming Sensitivity Definitions
export const GAME_YAWS = [
  { id: 'source', name: 'CS2 / CS:GO / Source / Apex', yaw: 0.022 },
  { id: 'valorant', name: 'Valorant', yaw: 0.07 },
  { id: 'overwatch', name: 'Overwatch 2', yaw: 0.0066 },
  { id: 'cod', name: 'Call of Duty (MW / Warzone)', yaw: 0.0066 },
  { id: 'r6', name: 'Rainbow Six Siege', yaw: 0.00572957795 },
  { id: 'quake', name: 'Quake Champions', yaw: 0.022 },
];
export const cm360 = (dpi: number, sens: number, yaw: number) => (360 / (yaw * sens * dpi)) * 2.54;
export const convertSens = (sens: number, fromYaw: number, toYaw: number) => (sens * fromYaw) / toYaw;

// JSON to types generator
export function jsonToTypescript(val: unknown, rootName = 'Root'): string {
  const interfaces: string[] = [];
  const seenTypes = new Set<string>();

  function generate(obj: any, name: string): string {
    if (obj === null) return 'null';
    if (Array.isArray(obj)) {
      if (obj.length === 0) return 'unknown[]';
      const itemType = generate(obj[0], name + 'Item');
      return `${itemType}[]`;
    }
    if (typeof obj === 'object') {
      const typeName = name[0].toUpperCase() + name.slice(1);
      if (seenTypes.has(typeName)) return typeName;
      seenTypes.add(typeName);

      const props = Object.entries(obj).map(([k, v]) => {
        const safeKey = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(k) ? k : JSON.stringify(k);
        const propType = generate(v, `${typeName}_${k}`);
        return `  ${safeKey}: ${propType};`;
      });

      interfaces.push(`export interface ${typeName} {\n${props.join('\n')}\n}`);
      return typeName;
    }
    return typeof obj;
  }

  generate(val, rootName);
  return interfaces.reverse().join('\n\n');
}

// Text Diff calculation
export interface DiffLine {
  type: 'add' | 'del' | 'same';
  text: string;
  lineA?: number;
  lineB?: number;
}

export function computeDiffLines(aText: string, bText: string): { ops: DiffLine[]; additions: number; deletions: number } {
  const A = aText === '' ? [] : aText.replace(/\r\n/g, '\n').split('\n');
  const B = bText === '' ? [] : bText.replace(/\r\n/g, '\n').split('\n');
  const n = A.length,
    m = B.length;

  // Simple Myers / DP for reasonably sized inputs
  if (n * m > 4e6) {
    throw new Error(`Comparison input is too large (${n} vs ${m} lines). Please compare smaller chunks.`);
  }

  const w = m + 1;
  const L = new Uint32Array((n + 1) * w);

  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      L[i * w + j] = A[i] === B[j] ? L[(i + 1) * w + j + 1] + 1 : Math.max(L[(i + 1) * w + j], L[i * w + j + 1]);
    }
  }

  const ops: DiffLine[] = [];
  let i = 0,
    j = 0;
  let additions = 0,
    deletions = 0;

  while (i < n && j < m) {
    if (A[i] === B[j]) {
      ops.push({ type: 'same', text: A[i], lineA: i + 1, lineB: j + 1 });
      i++;
      j++;
    } else if (L[(i + 1) * w + j] >= L[i * w + j + 1]) {
      ops.push({ type: 'del', text: A[i], lineA: i + 1 });
      deletions++;
      i++;
    } else {
      ops.push({ type: 'add', text: B[j], lineB: j + 1 });
      additions++;
      j++;
    }
  }

  while (i < n) {
    ops.push({ type: 'del', text: A[i], lineA: i + 1 });
    deletions++;
    i++;
  }
  while (j < m) {
    ops.push({ type: 'add', text: B[j], lineB: j + 1 });
    additions++;
    j++;
  }

  return { ops, additions, deletions };
}
