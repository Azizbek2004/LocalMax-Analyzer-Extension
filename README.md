# LocalMax Analyzer 🔬♟️

**One-click. Maximum Stockfish depth. Zero limits. 100% private.**

A free, fully offline Chrome extension that provides professional-grade chess analysis with an AI coaching agent. Works on Chess.com and Lichess.

## Features

- 🔬 **Unlimited Depth Analysis** — Stockfish WASM with progressive deepening up to depth 40+
- 🤖 **AI Coach** — Rule-based analysis agent provides human-like commentary, tactical motif detection, and "what-if" suggestions
- 📊 **Win Probability Curve** — Visual game flow with turning point highlights
- 🎯 **Move Classification** — Brilliant / Excellent / Good / Inaccuracy / Mistake / Blunder with dynamic CPL thresholds
- 📈 **Phase Accuracy** — Opening / Middlegame / Endgame breakdown
- 🔒 **100% Offline** — No API calls, no accounts, no telemetry
- 🎨 **Premium Dark Theme** — Navy + cyan palette with glassmorphism and micro-animations

## Installation

### 1. Prerequisites
- Node.js 18+ and npm

### 2. Install Dependencies
```bash
cd chess-analyzer-extension
npm install
```

### 3. Download Stockfish WASM
Download the latest Stockfish WASM from [official releases](https://github.com/nicknamenamenick/nicefrog-stockfish.wasm/releases) and place `stockfish.js` and `stockfish.wasm` in `public/stockfish/`.

### 4. Build
```bash
npm run build
```

### 5. Load in Chrome
1. Open `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `dist/` folder
5. Done! The extension icon appears in your toolbar

## Usage

### Auto-Import from Chess.com / Lichess
1. Go to any game on Chess.com or Lichess
2. Click the **🔬 LocalMax Analysis** button (appears near Share/Analyze buttons)
3. A new tab opens with the full analyzer

### Manual PGN
1. Click the extension icon → **Open Analyzer**
2. Paste your PGN and click **Analyze Game**

### Keyboard Shortcuts
- `← →` — Navigate moves
- `Home / End` — Jump to start / end

## Tech Stack

- React 18 + TypeScript + Vite
- TailwindCSS + Radix UI primitives
- chess.js + react-chessboard
- Zustand (state management)
- Recharts (graphs)
- Stockfish WASM (engine)
- Chrome Extension Manifest V3

## Development

```bash
npm run dev   # Start dev server (analysis app only)
npm run build # Production build for extension loading
```

## License

MIT
