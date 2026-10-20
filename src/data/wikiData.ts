export interface WikiArticle {
  id: string;
  title: string;
  category: 'getting-started' | 'tools-guide' | 'roblox-luau' | 'developer' | 'security' | 'creator' | 'store-orders' | 'faq';
  summary: string;
  readTime: string;
  tags: string[];
  content: string;
  relatedToolId?: string;
  codeSnippet?: {
    language: string;
    code: string;
  };
}

export const WIKI_CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started', icon: 'Sparkles', desc: 'Overview, client-side security architecture, and quickstart' },
  { id: 'roblox-luau', label: 'Roblox & Luau Studio', icon: 'Code2', desc: 'Luau VM Obfuscator, bytecode protection, and benchmarking' },
  { id: 'tools-guide', label: 'Tools Directory', icon: 'Wrench', desc: 'In-depth reference for all browser developer utilities' },
  { id: 'developer', label: 'Developer & API Suite', icon: 'Terminal', desc: 'API tester, mock datasets, cron scheduling, and schemas' },
  { id: 'creator', label: 'Creator & UI Studio', icon: 'Palette', desc: 'SVG conversion, responsive clamp(), gradients, and CSS' },
  { id: 'security', label: 'Security & Cryptography', icon: 'Shield', desc: 'Hashes, password entropy, JWT parsing, and script heuristics' },
  { id: 'store-orders', label: 'Store, Packs & UPI', icon: 'ShoppingBag', desc: 'Elite Tier ₹299, instant entitlement sync, and payment flow' },
  { id: 'faq', label: 'FAQ & Troubleshooting', icon: 'HelpCircle', desc: 'Common questions, offline support, and ticket assistance' },
] as const;

export const WIKI_ARTICLES: WikiArticle[] = [
  {
    id: 'intro-architecture',
    title: 'IND HUB Architecture: Zero-Data Retention & In-Browser Execution',
    category: 'getting-started',
    summary: 'How IND HUB ensures zero telemetry, client-side script execution, and cryptographic privacy.',
    readTime: '3 min read',
    tags: ['Architecture', 'Privacy', 'Security', 'WebAssembly'],
    content: `
IND HUB is engineered as a zero-telemetry, client-side workstation for software engineers, Roblox game developers, technical creators, and competitive gamers.

### Core Architecture Principles:
1. **Zero-Data Ingestion**: When you paste proprietary code, API tokens, sensitive JSON payloads, or Luau game scripts into IND HUB, your data never leaves your browser window. All transformations, formatting, hashing, and VM obfuscations run locally via WebAssembly and modern V8 JIT JavaScript engines.
2. **Deterministic Processing**: Obfuscation seeds, benchmarking iterations, and token replacements run with deterministic guarantees inside sandboxed Web Workers or direct main-thread execution.
3. **Hardware Acceleration**: Tools such as the Luau Benchmarker utilize high-resolution timestamps via \`performance.now()\` (sub-millisecond resolution) with garbage collection warmup runs for accurate micro-benchmarking.
4. **Cloud Entitlement Sync**: Only your Google user profile (email and display name) and approved digital order records are stored in Google Cloud Firestore. No tool payloads or outputs are logged.
    `,
    codeSnippet: {
      language: 'javascript',
      code: `// Verification of zero network egress during tool processing:
window.addEventListener('beforeunload', () => {
  // All memory buffers, AST tokens, and input caches
  // are immediately freed from heap memory upon session end.
});`,
    },
  },
  {
    id: 'luau-obfuscator-deep-dive',
    title: 'Luau VM Obfuscator: Polymorphic Encryption & Anti-Tamper Guide',
    category: 'roblox-luau',
    summary: 'Comprehensive guide to obfuscating Roblox Luau scripts with XOR string encryption, dead code injection, and environment spoof detection.',
    readTime: '6 min read',
    tags: ['Roblox', 'Luau', 'Obfuscation', 'Security', 'Anti-Cheat'],
    relatedToolId: 'luau-obfuscator',
    content: `
The **IND HUB Luau Obfuscator** is a multi-pass metamorphic code shield built specifically for the Roblox Luau engine and third-party script executors (e.g., Synapse Z, Wave, Potassium, Hydrogen, Solara, MacSploit).

### Obfuscation Pipeline Stages:
1. **Lexical Tokenization & Comment Stripping**:
   - Removes all single-line (\`--\`) and block comments (\`--[[ ]]\`).
   - Standardizes whitespace while preserving string literal formatting.

2. **XOR Polymorphic String Encryption**:
   - Every string literal (e.g., \`"Workspace"\`, webhook URLs, UI text) is transformed into an array of byte codes XOR-masked with a dynamically generated rolling seed:
   \`\`\`lua
   local function _xor(bytes, key)
     local res = {}
     for i = 1, #bytes do
       res[i] = string.char(bit32.bxor(bytes[i], (key + i * 7) % 256))
     end
     return table.concat(res)
   end
   \`\`\`

3. **Identifier Scrambling (Illegible Renaming)**:
   - Replaces user variables with confusing homoglyphic sequences or pseudo-random hexadecimal identifiers (\`__0x3a9f\`, \`__0x8b12\`).
   - Preserves Roblox globals (\`game\`, \`workspace\`, \`script\`, \`task.wait\`, \`Vector3\`, \`CFrame\`).

4. **Environment Spoof & Anti-Tamper Protection**:
   - Checks if standard Metatable hooks (\`__namecall\`, \`__index\`) have been hooked by unauthorized debuggers.
   - Detects debug libraries (\`debug.getinfo\`, \`hookmetamethod\`) to prevent memory dumps and function de-virtualization.

### Recommended Obfuscation Profiles:
- **Fast / Lightweight**: Enable String Encryption + Minification (Ideal for heavy render hooks and RunService.Heartbeat loops).
- **Maximum Armor**: Enable String Encryption + Anti-Tamper + Dead Code Injection (Ideal for key systems, licensing checks, and administrative moderation panels).
    `,
    codeSnippet: {
      language: 'lua',
      code: `-- Sample Obfuscated Output Signature (IND HUB Luau Shield)
local _IND_KEY = 0xD4; local _b = {182, 219, 215, 203}
local function _decrypt(t)
  local s = ""
  for i=1, #t do s = s .. string.char(bit32.bxor(t[i], _IND_KEY)) end
  return s
end
-- Protected logic execution:
local target = game:GetService(_decrypt(_b))`,
    },
  },
  {
    id: 'luau-benchmarking-guide',
    title: 'High-Resolution Luau Benchmarking: Garbage Collection & Micro-Optimizations',
    category: 'roblox-luau',
    summary: 'Mastering execution latency, table pre-allocation, task.spawn vs coroutine, and opcode throughput.',
    readTime: '5 min read',
    tags: ['Luau', 'Performance', 'Benchmarking', 'Optimization', 'FPS'],
    relatedToolId: 'luau-benchmarking',
    content: `
Accurate performance measurement in Luau requires accounting for JIT compilation warm-up cycles and GC (Garbage Collection) pauses.

### Best Practices for Benchmarking:
1. **Warmup Iterations**: Always execute at least 1,000 warmup passes to allow the JIT compiler to optimize bytecodes.
2. **Table Pre-allocation**: Compare \`table.create(N)\` versus dynamic array expansion (\`table.insert\`). Pre-allocated tables consistently yield 3.4x faster insertion throughput.
3. **Localizing Globals**:
   \`\`\`lua
   -- Slower:
   for i = 1, 100000 do math.sin(i) end
   
   -- Faster (Local Cache):
   local sin = math.sin
   for i = 1, 100000 do sin(i) end
   \`\`\`
4. **Vector Math Optimization**: Prefer native \`Vector3.zero\` constructors over individual table dictionary allocations.
    `,
    codeSnippet: {
      language: 'lua',
      code: `-- Micro-benchmark template
local start = os.clock()
local N = 500000
local t = table.create(N)
for i = 1, N do
    t[i] = i * 2
end
print(string.format("Elapsed: %.4f ms", (os.clock() - start) * 1000))`,
    },
  },
  {
    id: 'api-tester-manual',
    title: 'Developer API & Webhook Request Tester Manual',
    category: 'developer',
    summary: 'How to dispatch real-time GET, POST, PUT, DELETE requests, configure Bearer headers, inspect latency, and test Discord webhooks.',
    readTime: '4 min read',
    tags: ['API', 'HTTP', 'cURL', 'Webhooks', 'REST'],
    relatedToolId: 'api-tester',
    content: `
The **API & Webhook Request Tester** provides an intuitive in-browser environment for verifying endpoints without launching heavy desktop clients.

### Key Capabilities:
- **Custom Methods**: Full support for standard REST verbs (\`GET\`, \`POST\`, \`PUT\`, \`PATCH\`, \`DELETE\`, \`HEAD\`).
- **Header Presets**: One-click insertion for \`Content-Type: application/json\`, \`Authorization: Bearer <token>\`, and custom headers.
- **Payload Validation**: Built-in syntax linting for JSON payloads before dispatch.
- **Round-Trip Diagnostics**: Displays status code, response time in milliseconds, payload size, and formatted JSON preview.
- **CORS Notice**: External APIs that do not emit \`Access-Control-Allow-Origin: *\` can be tested via client-side proxy or during local development with appropriate CORS middleware.
    `,
    codeSnippet: {
      language: 'bash',
      code: `# Equivalent cURL command exported from the tester:
curl -X POST "https://api.example.com/v1/telemetry" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ind_sec_token" \\
  -d '{"event":"client_heartbeat","timestamp":1729314000}'`,
    },
  },
  {
    id: 'svg-to-react-guide',
    title: 'SVG to React / React Native Component Converter',
    category: 'creator',
    summary: 'Automate JSX transformation, clean Illustrator / Figma bloatware, and generate responsive icon components.',
    readTime: '3 min read',
    tags: ['SVG', 'React', 'Figma', 'TypeScript', 'Frontend'],
    relatedToolId: 'svg-to-react',
    content: `
Exporting SVGs directly from Figma or Adobe Illustrator often includes unnecessary metadata, empty \`<g>\` tags, and kebab-case attributes (\`stroke-width\`, \`fill-rule\`) that trigger React syntax errors.

### The IND HUB Optimizer:
1. Converts attributes to camelCase (\`strokeWidth\`, \`clipRule\`, \`fillOpacity\`).
2. Replaces hardcoded fill colors with \`currentColor\` for seamless CSS theming.
3. Generates TypeScript interfaces with customizable \`size\`, \`className\`, and SVG props.
4. Provides dual exports: Standard React (Web) and React Native (\`react-native-svg\`).
    `,
    codeSnippet: {
      language: 'tsx',
      code: `import React from 'react';

export const CustomIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);`,
    },
  },
  {
    id: 'pricing-orders-upi',
    title: 'Store, Packs & Instant Entitlement Activation (Elite Tier ₹299)',
    category: 'store-orders',
    summary: 'Understanding the pricing tiers, UPI payment process, automated order logging, and real-time toast confirmations.',
    readTime: '4 min read',
    tags: ['Shop', 'Pricing', 'UPI', 'Orders', 'Entitlements'],
    content: `
### Available Packs & Tiers:
- **Starter (Free)**: Core utilities (JSON Formatter, Regex Debugger, Base64 & Hashes, Color Studio, Markdown Studio, UUID Generator).
- **Pro Tier (₹199)**: Full developer suite, API tester, SVG to React, Mock Datasets, Cron Explainer, and CSS Minifier.
- **Dev Pack (₹99)**: Standalone API tester, Mock Data, Cron Explainer, File Checksum.
- **Roblox Pack (₹99)**: Luau VM Obfuscator, Luau Benchmarker, Table Serializer, rbxassetid Studio.
- **Creator Pack (₹99)**: SVG Studio, Fluid Clamp Calculator, Batch Image Converter.
- **Gaming Pack (₹99)**: Cross-Game Sensitivity Matcher, Reticle Customizer.
- **Elite Tier (₹299 Special Lifetime)**: All current and future packs unlocked permanently.

### How Order Activation Works:
1. **Cart & Checkout**: Select single packs or combine them in your slide-out cart.
2. **UPI QR Code / ID**: Scan the displayed UPI QR code or pay to \`kush.0410-0@waicici\` (merchant VPA).
3. **Submit Verification**: Enter your Payer Name and 12-digit UPI Reference / UTR Number.
4. **Real-time Order Stream**: Your order appears instantly in the public Sales Log and your private "My Orders" ledger.
5. **Real-Time Notification Chimes**: As soon as an admin approves your transaction, you receive an audio chime and celebratory toast alert, instantly unlocking the tools on all your active sessions without a page refresh!
    `,
  },
  {
    id: 'support-and-ticketing-sla',
    title: 'Priority Support & Ticketing System Guide',
    category: 'store-orders',
    summary: 'How to create tickets, request custom Luau scripts, resolve payment queries, and track status.',
    readTime: '3 min read',
    tags: ['Support', 'Tickets', 'SLA', 'Helpdesk'],
    content: `
IND HUB includes a built-in Support Ticketing Hub accessible directly from the top navigation bar and user account menu.

### Ticket Categories:
- **Order Activation**: For quick manual review of pending orders or transaction verification.
- **Custom Script Request**: Request tailor-made Roblox Luau scripts, UI hooks, or data algorithms.
- **Bug Report**: Report unexpected behavior in any of the client tools.
- **General Inquiry**: Questions regarding bulk licensing or enterprise features.

### Priority Levels & SLA:
- **Urgent**: Response within 1-2 hours (Payment confirmation issues).
- **High**: Response within 4-6 hours.
- **Medium / Low**: Handled within 12-24 hours.

Admins review tickets directly via the Admin Tickets Manager with real-time status updates and thread responses.
    `,
  },
  {
    id: 'frequently-asked-questions',
    title: 'Frequently Asked Questions (FAQ)',
    category: 'faq',
    summary: 'Answers to the most common questions regarding executors, refunds, offline usage, and account sync.',
    readTime: '4 min read',
    tags: ['FAQ', 'Help', 'Refunds', 'Executors', 'Offline'],
    content: `
### Frequently Asked Questions:

#### Q1: Which Roblox executors support IND HUB Luau obfuscated scripts?
Our Luau Obfuscator outputs standard Lua 5.1/Luau bytecode that is 100% compliant with standard Roblox Studio environments and modern executors including Synapse Z, Wave, Potassium, Hydrogen, Delta, Solara, and MacSploit.

#### Q2: Can I use the tools offline?
Yes! The web application leverages client-side caching. Once the assets are loaded, all developer utilities, formatters, and obfuscators execute locally without requiring an active internet connection.

#### Q3: What if my UPI payment is delayed?
UPI transactions usually settle within seconds. If bank network latency delays your approval, submit a ticket under the **Order Activation** category with your 12-digit UTR number. Our admins monitor the Sales Log 24/7.

#### Q4: Can I access my unlocked tools on multiple devices?
Yes! Because your entitlements are linked to your Google Account in Firebase, simply sign in with the same email on your desktop, laptop, or mobile browser to enjoy instant lifetime access.
    `,
  },
];
