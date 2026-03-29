/**
 * Stockfish Worker Wrapper
 * Manages communication with Stockfish WASM via Web Worker.
 * Optimized: movetime-based search, hash reuse, smart MultiPV.
 */

export interface EngineEvaluation {
    depth: number;
    score: number;         // centipawns (from side-to-move perspective)
    mate: number | null;   // null if not mate, positive = side-to-move mates in N
    pv: string[];          // principal variation moves
    pvIndex: number;       // which PV this is (0-based)
    nodes: number;
    nps: number;           // nodes per second
    time: number;          // ms
}

export interface MoveAnalysis {
    moveNumber: number;
    fen: string;
    move: string;          // SAN
    uciMove: string;
    bestMove: string;      // engine best move (SAN)
    bestUci: string;
    evalBefore: number;    // centipawns from White's perspective
    evalAfter: number;     // centipawns from White's perspective
    mateBefore: number | null;
    mateAfter: number | null;
    cpl: number;           // centipawn loss
    depth: number;
    lines: EngineEvaluation[];
    isWhite: boolean;
}

export interface AnalysisProgress {
    currentMove: number;
    totalMoves: number;
    depth: number;
    nodes: number;
    status: 'idle' | 'analyzing' | 'complete' | 'error';
}

type MessageHandler = (data: any) => void;

export class StockfishEngine {
    private worker: Worker | null = null;
    private isReady = false;
    private messageHandlers: Map<string, MessageHandler[]> = new Map();
    private currentEvals: EngineEvaluation[] = [];

    async init(): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                let stockfishJsUrl: string;
                let stockfishWasmUrl: string;

                // Auto-detect: use multi-threaded if SharedArrayBuffer is available
                const canUseMultiThread = typeof SharedArrayBuffer !== 'undefined';
                const variant = canUseMultiThread ? 'stockfish' : 'stockfish-single';
                console.log(`[StockfishEngine] Using ${canUseMultiThread ? 'multi-threaded' : 'single-threaded'} WASM`);

                if (typeof chrome !== 'undefined' && chrome.runtime?.getURL) {
                    stockfishJsUrl = chrome.runtime.getURL(`stockfish/${variant}.js`);
                    stockfishWasmUrl = chrome.runtime.getURL(`stockfish/${variant}.wasm`);
                } else {
                    stockfishJsUrl = `/stockfish/${variant}.js`;
                    stockfishWasmUrl = new URL(`/stockfish/${variant}.wasm`, window.location.origin).href;
                }

                const workerUrl = stockfishJsUrl + '#' + encodeURIComponent(stockfishWasmUrl);
                this.worker = new Worker(workerUrl);

                this.worker.onmessage = (e) => {
                    const data = typeof e.data === 'string' ? e.data : String(e.data);
                    this.handleMessage(data);
                };

                this.worker.onerror = (e) => {
                    console.error('[StockfishEngine] Worker error:', e);
                    reject(new Error('Failed to load Stockfish: ' + e.message));
                };

                const readyTimer = setTimeout(() => {
                    reject(new Error('Stockfish init timeout'));
                }, 15000);

                this.on('readyok', () => {
                    clearTimeout(readyTimer);
                    this.isReady = true;
                    console.log('[StockfishEngine] ✅ Engine ready');
                    resolve();
                });

                this.send('uci');
                this.send('isready');
            } catch (e) {
                reject(e);
            }
        });
    }

    configure(threads: number, hash: number, multiPV: number): void {
        this.send(`setoption name Threads value ${threads}`);
        this.send(`setoption name Hash value ${hash}`);
        this.send(`setoption name MultiPV value ${multiPV}`);
        this.send('isready');
    }

    /** Prepare for a new game analysis — clears hash table once */
    newGame(): void {
        this.send('ucinewgame');
        this.send('isready');
    }

    /**
     * Evaluate a position using movetime (time-based search).
     * Much faster than fixed depth — adapts to hardware speed.
     */
    async evaluatePositionTimed(
        fen: string,
        movetime: number,
        multiPV: number = 1,
    ): Promise<EngineEvaluation[]> {
        return new Promise((resolve) => {
            this.currentEvals = [];

            this.send(`setoption name MultiPV value ${multiPV}`);
            this.send(`position fen ${fen}`);
            this.send('isready');

            this.once('readyok', () => {
                this.on('info', (data: string) => {
                    const evaluation = this.parseInfoLine(data);
                    if (evaluation) {
                        const idx = this.currentEvals.findIndex(e => e.pvIndex === evaluation.pvIndex);
                        if (idx >= 0) {
                            this.currentEvals[idx] = evaluation;
                        } else {
                            this.currentEvals.push(evaluation);
                        }
                        this.emit('eval-update', [...this.currentEvals]);
                    }
                });

                this.once('bestmove', () => {
                    this.off('info');
                    resolve([...this.currentEvals]);
                });

                this.send(`go movetime ${movetime}`);
            });
        });
    }

    /**
     * Evaluate a position to a fixed depth (used for on-demand deep analysis).
     */
    async evaluatePosition(
        fen: string,
        depth: number,
        multiPV: number = 3,
    ): Promise<EngineEvaluation[]> {
        return new Promise((resolve) => {
            this.currentEvals = [];

            this.send(`setoption name MultiPV value ${multiPV}`);
            this.send(`position fen ${fen}`);
            this.send('isready');

            this.once('readyok', () => {
                this.on('info', (data: string) => {
                    const evaluation = this.parseInfoLine(data);
                    if (evaluation) {
                        const idx = this.currentEvals.findIndex(e => e.pvIndex === evaluation.pvIndex);
                        if (idx >= 0) {
                            this.currentEvals[idx] = evaluation;
                        } else {
                            this.currentEvals.push(evaluation);
                        }
                        this.emit('eval-update', [...this.currentEvals]);
                    }
                });

                this.once('bestmove', () => {
                    this.off('info');
                    resolve([...this.currentEvals]);
                });

                this.send(`go depth ${depth}`);
            });
        });
    }

    stop(): void {
        this.send('stop');
    }

    destroy(): void {
        this.stop();
        this.worker?.terminate();
        this.worker = null;
        this.isReady = false;
    }

    private send(cmd: string): void {
        this.worker?.postMessage(cmd);
    }

    private handleMessage(data: string): void {
        if (typeof data !== 'string') return;

        if (data === 'readyok') {
            this.emit('readyok', null);
        } else if (data.startsWith('bestmove')) {
            const parts = data.split(' ');
            this.emit('bestmove', { move: parts[1], ponder: parts[3] });
        } else if (data.startsWith('info')) {
            this.emit('info', data);
        }
    }

    private parseInfoLine(line: string): EngineEvaluation | null {
        if (!line.includes('score') || !line.includes(' pv ')) return null;

        const depth = this.extractInt(line, 'depth');
        const pvIndex = (this.extractInt(line, 'multipv') || 1) - 1;
        const nodes = this.extractInt(line, 'nodes') || 0;
        const nps = this.extractInt(line, 'nps') || 0;
        const time = this.extractInt(line, 'time') || 0;

        let score = 0;
        let mate: number | null = null;
        const cpMatch = line.match(/score cp (-?\d+)/);
        const mateMatch = line.match(/score mate (-?\d+)/);

        if (mateMatch) {
            mate = parseInt(mateMatch[1]);
            score = mate > 0 ? 30000 - mate : -30000 - mate;
        } else if (cpMatch) {
            score = parseInt(cpMatch[1]);
        }

        const pvMatch = line.match(/ pv (.+)/);
        const pv = pvMatch ? pvMatch[1].trim().split(' ') : [];

        if (depth === null || pv.length === 0) return null;

        return { depth, score, mate, pv, pvIndex, nodes, nps, time };
    }

    private extractInt(line: string, key: string): number | null {
        const match = line.match(new RegExp(`${key} (\\d+)`));
        return match ? parseInt(match[1]) : null;
    }

    // Simple event system
    private on(event: string, handler: MessageHandler): void {
        if (!this.messageHandlers.has(event)) {
            this.messageHandlers.set(event, []);
        }
        this.messageHandlers.get(event)!.push(handler);
    }

    private once(event: string, handler: MessageHandler): void {
        const wrapper = (data: any) => {
            this.off(event, wrapper);
            handler(data);
        };
        this.on(event, wrapper);
    }

    private off(event: string, handler?: MessageHandler): void {
        if (!handler) {
            this.messageHandlers.delete(event);
            return;
        }
        const handlers = this.messageHandlers.get(event);
        if (handlers) {
            const idx = handlers.indexOf(handler);
            if (idx >= 0) handlers.splice(idx, 1);
        }
    }

    private emit(event: string, data: any): void {
        const handlers = this.messageHandlers.get(event);
        if (handlers) {
            [...handlers].forEach(h => h(data));
        }
    }
}
