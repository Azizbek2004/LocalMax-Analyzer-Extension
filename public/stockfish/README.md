# Stockfish WASM Files

This directory should contain the following Stockfish WASM files:

## Required Files
1. `stockfish.js` — Main JavaScript loader
2. `stockfish.wasm` — WebAssembly binary
3. `stockfish.worker.js` — Web Worker script (if separate)

## Download Instructions

### Option 1: Official Stockfish WASM (Recommended)
Download from the official Stockfish repository:
```
https://github.com/nicefrog22/nicefrog-stockfish-wasm/releases/latest
```

Or use the official Stockfish.js build:
```
https://github.com/nicknamenamenick/nicefrog-stockfish.wasm/releases
```

### Option 2: lichess/stockfish.wasm (Well-tested)
```
https://github.com/nicknamenamenick/nicefrog-stockfish.wasm/releases
```
or:
```
https://github.com/nicefrog22/nicknamenamenick-stockfish.wasm
```

### Option 3: Build from source
1. Clone Stockfish: `https://github.com/official-stockfish/Stockfish`
2. Follow the Emscripten build instructions in the Wiki
3. Copy the output files here

## NNUE Network
The latest Stockfish uses an NNUE neural network for evaluation.
The network file is typically embedded in the WASM binary.
If you need to specify it separately, download from:
```
https://tests.stockfishchess.org/nns
```

## Verification
After placing files here, verify by loading the extension and checking the console for:
```
[StockfishEngine] Worker loaded successfully
```
