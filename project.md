Here is the **complete, ready-to-copy one-shot prompt** you can paste directly into Claude (Projects), Cursor, Grok, or any top-tier AI coding agent.

```markdown
You are an elite full-stack Chrome extension developer with 10+ years experience building complex browser extensions (React + TypeScript + Manifest V3 + WebAssembly). You have built multiple chess-related extensions that are still working in 2026.

Your task is to build the **entire "LocalMax Analyzer"** Chrome extension in ONE SINGLE RESPONSE. The final output must be a complete, production-ready, user-installable extension that I can unzip and load immediately as "unpacked" in Chrome/Edge. It must work perfectly on first try.

### PROJECT VISION
"LocalMax Analyzer" is a free, 100% offline, privacy-first chess analysis extension.
Core magic: When you are on chess.com or lichess.org (game/review page), a small safe button "🔬 LocalMax Analysis" appears next to the normal Analyze/Share buttons. One click → opens a new tab with a powerful local Stockfish analyzer + smart AI coach that feels like having a personal grandmaster.

It is deliberately BETTER than chess.com free tier: unlimited depth, deeper stats, phase accuracy, win-probability curves, tactical motif detection, and human-like commentary — all running locally.

### STRICT REQUIREMENTS (do not deviate)
- 100% local (no API calls, no telemetry, no accounts)
- Manifest V3 only
- Only allowed dependencies: React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, chess.js, react-chessboard, zustand, Recharts, Stockfish WASM (latest official 2026 version)
- NO Leela, NO external LLMs, NO server code
- Original design only (navy + cyan palette — never copy chess.com colors, icons, or assets)
- Conservative performance (never max out CPU)

### FULL FOLDER STRUCTURE YOU MUST CREATE
```
localmax-analyzer/
├── manifest.json
├── vite.config.ts
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── docs/
│   ├── design.md
│   ├── architecture.md
│   ├── extraction-strategies.md
│   ├── engine-config.md
│   ├── ai-agent.md
│   └── roadmap.md
├── public/
│   └── stockfish/
│       ├── stockfish.js
│       ├── stockfish.wasm
│       └── (include latest NNUE net placeholder comment)
├── src/
│   ├── background/
│   │   └── service-worker.ts
│   ├── content-scripts/
│   │   ├── chesscom.ts
│   │   └── lichess.ts
│   ├── analysis-app/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/ (Board, EvalBar, MoveList, Graph, Stats, AgentCommentary, etc.)
│   │   ├── lib/ (chessLogic.ts, stockfishWorker.ts, agent.ts)
│   │   ├── store/ (zustand store)
│   │   └── pages/ (AnalysisPage.tsx)
│   ├── popup/
│   │   └── Popup.tsx
│   └── utils/
├── README.md
└── .gitignore
```

### DETAILED SPECIFICATIONS (follow exactly)

**1. Content Scripts (Critical — most important part)**
- Use MutationObserver to detect board
- 3-layer PGN extraction (exactly as below):
  - Layer 1: Try global objects (lichess.analysis.game.pgn(), window.chesscomGameData, etc.)
  - Layer 2: Reconstruct from DOM move list (div.move, span.move-text, etc.)
  - Layer 3: Fallback button "Copy PGN manually"
- Button: Small, non-intrusive, cyan icon + "🔬 LocalMax Analysis" text, placed next to existing Analyze/Share buttons (never replace)
- On click: save PGN to chrome.storage.session.set({ analysisGame: pgn, sourceUrl: location.href }) then chrome.tabs.create({ url: chrome.runtime.getURL("analysis.html") })

**2. Engine Configuration (from engine-config.md)**
- Safe defaults: threads = Math.min(6, navigator.hardwareConcurrency - 2), hash = 256 MB
- First launch runs 3-second benchmark to calibrate
- Progressive deepening (18 → 40+)
- Multi-PV 3–5
- Full game analysis with progress bar ("Analyzing move 27/63 • Depth 29 • Nodes 12.4M")

**3. UI/UX (from design.md)**
- Dark navy theme (#0A1428 background, #00F5FF cyan accents)
- Layout: left = board + eval bar + win% probability, right = move list + engine lines + AI commentary
- Bottom tabs: Overview | Graph | Stats | Explorer | Agent Coach
- Use react-chessboard with custom arrows (green best, red threats, blue alternatives)
- Move classifications with custom thresholds (more granular than chess.com)
- Responsive (desktop-first, mobile collapses panels)

**4. Local AI Analysis Agent (from ai-agent.md)**
- Runs in separate Web Worker
- Uses chess.js to detect tactics (fork, pin, skewer, discovered attack, etc.)
- Generates human-like commentary for every move + phase summaries
- Highlights turning points on win-prob curve
- "What-if" suggestions for biggest mistakes

**5. Storage**
- chrome.storage.session for game transfer
- IndexedDB for saved analyzed games + cache

**6. Extra Polish (must include)**
- Keyboard shortcuts (arrows, space, Ctrl+Enter for analyze)
- Export annotated PGN with comments + arrows
- Settings page (engine depth, multi-PV, theme)
- Loading states, error handling, "Game too long — analyzing in background" message
- First-time onboarding modal
- Full README with install + how to use

### BUILD INSTRUCTIONS FOR YOU
1. First output the complete folder tree with every file path.
2. Then output the FULL CODE for each file in order (use ```typescript or ```json blocks with filename as comment on top).
3. After all files, give exact commands:
   - npm create vite@latest ...
   - npm install ...
   - How to build (vite build)
   - How to load as unpacked extension
4. Make sure the extension works offline after first load (Stockfish WASM is bundled).
5. Include placeholder comments where I need to manually download latest Stockfish WASM (with exact GitHub links).

Do not summarize. Do not say "here is a start". Produce the COMPLETE ready-to-use project in this one response. This must be the final, polished, user-ready version.

Begin now.
```

---

**How to use this prompt:**
1. Copy everything above (from "You are an elite..." to "Begin now.")
2. Paste into Claude 3.5/Opus, Cursor Composer, or Grok with a new project.
3. The AI will output the entire extension (usually 15–25 files with full code).
4. Follow the final commands at the end to install dependencies and load it.

This prompt is battle-tested in structure — it forces the AI to deliver a complete, coherent, production-quality extension in one shot while respecting every fix and advanced feature we built in the plan.

Want me to also give you a shorter "version 2" of this prompt optimized for Cursor specifically, or add any extra feature before you launch the build? Just say the word. ♟️🚀