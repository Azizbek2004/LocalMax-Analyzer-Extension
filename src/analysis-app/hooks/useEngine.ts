/**
 * useEngine Hook — Chess.com Style Analysis
 * 
 * Analysis pipeline matching chess.com game review:
 * 1. Evaluate each position with MultiPV=2 (gets best move + eval)
 * 2. Compare player's move eval to engine's best
 * 3. Calculate CPL and classify moves
 * 4. Detect brilliant moves (sacrifice + best move)
 * 5. Re-analyze critical positions at higher depth  
 * 6. Calculate accuracy % and estimate rating
 */

import { useEffect, useRef, useCallback, useState } from 'react';
import { useAppStore } from '../../store/store';
import { StockfishEngine } from '../../lib/stockfishWorker';
import type { MoveAnalysis, EngineEvaluation } from '../../lib/stockfishWorker';
import { analyzeGame } from '../../lib/agent';
import { isWhiteTurn } from '../../lib/chessLogic';

export function useEngine() {
    const engineRef = useRef<StockfishEngine | null>(null);
    const [engineStatus, setEngineStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle');
    const [engineError, setEngineError] = useState<string | null>(null);
    const abortRef = useRef(false);

    const game = useAppStore(s => s.game);
    const config = useAppStore(s => s.engine.config);
    const setEngineLoaded = useAppStore(s => s.setEngineLoaded);
    const setAnalyzing = useAppStore(s => s.setAnalyzing);
    const setProgress = useAppStore(s => s.setProgress);
    const addMoveAnalysis = useAppStore(s => s.addMoveAnalysis);
    const setInsights = useAppStore(s => s.setInsights);
    const setAnalysisComplete = useAppStore(s => s.setAnalysisComplete);
    const setCurrentLines = useAppStore(s => s.setCurrentLines);

    // Initialize engine on mount
    useEffect(() => {
        async function initEngine() {
            setEngineStatus('loading');
            setEngineError(null);

            const engine = new StockfishEngine();
            try {
                await engine.init();
                engine.configure(config.threads, config.hash, 2); // MultiPV=2 default
                engineRef.current = engine;
                setEngineLoaded(true);
                setEngineStatus('ready');
                console.log('[useEngine] ✅ Stockfish loaded and configured');
            } catch (err) {
                const msg = err instanceof Error ? err.message : 'Unknown error';
                console.error('[useEngine] ❌ Failed to init engine:', msg);
                setEngineError(msg);
                setEngineStatus('error');
                setEngineLoaded(false);
            }
        }

        initEngine();

        return () => {
            abortRef.current = true;
            engineRef.current?.destroy();
            engineRef.current = null;
        };
    }, []);

    /**
     * Chess.com-style full game analysis.
     * 
     * For each move:
     * 1. Evaluate position BEFORE the move (MultiPV=2 → gets best move + second best)
     * 2. Record bestMove, bestEval
     * 3. Use eval of the next position as "eval after player's move"
     * 4. CPL = bestEval - playerMoveEval
     * 5. Classify based on CPL + sacrifice detection
     */
    const analyzeFullGame = useCallback(async () => {
        const engine = engineRef.current;
        if (!engine || !game.fens || game.fens.length < 2) return;

        const fens = game.fens;
        const moves = game.moves;
        const totalMoves = moves.length;
        const movetime = config.moveTime;

        abortRef.current = false;
        setAnalyzing(true);
        setProgress({ currentMove: 0, totalMoves, depth: 0, nodes: 0, status: 'analyzing' });

        engine.newGame();

        const moveAnalyses: MoveAnalysis[] = [];
        const startTime = Date.now();

        // Phase 1: Evaluate each position BEFORE the move with MultiPV=2
        // This gives us: best move, best eval, and second-best eval
        interface PositionEval {
            bestMove: string;      // engine best move (UCI)
            bestEval: number;      // eval of best move (from side-to-move perspective)
            bestMate: number | null;
            secondEval: number;    // eval of second-best move
            depth: number;
            nodes: number;
            lines: EngineEvaluation[];
        }

        const posEvals: PositionEval[] = [];

        for (let i = 0; i < totalMoves; i++) {
            if (abortRef.current) break;

            const fen = fens[i];

            try {
                // MultiPV=2 for best move comparison
                const evals = await engine.evaluatePositionTimed(fen, movetime, 2);

                const best = evals[0];
                const second = evals.length > 1 ? evals[1] : null;

                posEvals.push({
                    bestMove: best?.pv[0] || '',
                    bestEval: best?.score || 0,
                    bestMate: best?.mate ?? null,
                    secondEval: second?.score || best?.score || 0,
                    depth: best?.depth || 0,
                    nodes: best?.nodes || 0,
                    lines: evals,
                });

                setCurrentLines(evals);
                setProgress({
                    currentMove: i + 1,
                    totalMoves,
                    depth: best?.depth || 0,
                    nodes: best?.nodes || 0,
                    status: 'analyzing',
                });
            } catch (err) {
                console.error(`[useEngine] Error evaluating position ${i}:`, err);
                posEvals.push({
                    bestMove: '', bestEval: 0, bestMate: null,
                    secondEval: 0, depth: 0, nodes: 0, lines: [],
                });
            }
        }

        // Also evaluate the final position (after last move)
        if (!abortRef.current && fens.length > totalMoves) {
            try {
                const finalEvals = await engine.evaluatePositionTimed(fens[totalMoves], movetime, 1);
                const finalBest = finalEvals[0];
                posEvals.push({
                    bestMove: finalBest?.pv[0] || '',
                    bestEval: finalBest?.score || 0,
                    bestMate: finalBest?.mate ?? null,
                    secondEval: 0, depth: finalBest?.depth || 0,
                    nodes: finalBest?.nodes || 0, lines: finalEvals,
                });
            } catch {
                posEvals.push({
                    bestMove: '', bestEval: 0, bestMate: null,
                    secondEval: 0, depth: 0, nodes: 0, lines: [],
                });
            }
        }

        // Phase 2: Derive move analyses from position evaluations
        for (let i = 0; i < totalMoves; i++) {
            if (i >= posEvals.length) break;

            const white = isWhiteTurn(fens[i]);
            const posEval = posEvals[i];

            // Eval BEFORE the move = engine's best eval for this position
            // (from side-to-move perspective)
            const evalBeforeStm = posEval.bestEval;
            // Convert to White's perspective
            const evalBeforeWhite = white ? evalBeforeStm : -evalBeforeStm;

            // Eval AFTER the player's move = engine's eval of the next position
            // (from the OTHER side's perspective, so negate)
            let evalAfterWhite = evalBeforeWhite; // fallback
            if (i + 1 < posEvals.length) {
                const nextWhite = isWhiteTurn(fens[i + 1]);
                const nextEvalStm = posEvals[i + 1].bestEval;
                evalAfterWhite = nextWhite ? nextEvalStm : -nextEvalStm;
            }

            // CPL = how much worse the player's move is vs the engine's best
            // From the moving side's perspective:
            const cpl = Math.max(0, white
                ? evalBeforeWhite - evalAfterWhite
                : evalAfterWhite - evalBeforeWhite
            );

            const ma: MoveAnalysis = {
                moveNumber: Math.floor(i / 2) + 1,
                fen: fens[i],
                move: moves[i],
                uciMove: '',
                bestMove: posEval.bestMove,
                bestUci: posEval.bestMove,
                evalBefore: evalBeforeWhite,
                evalAfter: evalAfterWhite,
                mateBefore: posEval.bestMate !== null ? (white ? posEval.bestMate : -posEval.bestMate) : null,
                mateAfter: i + 1 < posEvals.length && posEvals[i + 1].bestMate !== null
                    ? (isWhiteTurn(fens[i + 1]) ? posEvals[i + 1].bestMate! : -(posEvals[i + 1].bestMate!))
                    : null,
                cpl,
                depth: posEval.depth,
                lines: posEval.lines,
                isWhite: white,
            };

            moveAnalyses.push(ma);
            addMoveAnalysis(ma);
        }

        // Phase 3: Re-analyze critical moves at higher depth (chess.com secret)
        if (!abortRef.current) {
            const criticalMoves = moveAnalyses
                .map((ma, i) => ({ ma, i }))
                .filter(({ ma }) => ma.cpl >= 100) // Cara Mistake threshold
                .slice(0, 5); // Max 5 re-analyses

            if (criticalMoves.length > 0) {
                setProgress({ status: 'analyzing', currentMove: totalMoves, totalMoves, depth: 0, nodes: 0 });

                for (const { ma, i } of criticalMoves) {
                    if (abortRef.current) break;
                    try {
                        // Re-analyze at 2x movetime for accuracy
                        const deepEvals = await engine.evaluatePositionTimed(ma.fen, movetime * 2, 2);
                        if (deepEvals[0]) {
                            const white = ma.isWhite;
                            const deepBestStm = deepEvals[0].score;
                            const deepBestWhite = white ? deepBestStm : -deepBestStm;

                            // Recalculate CPL with deeper analysis
                            const deepCpl = Math.max(0, white
                                ? deepBestWhite - ma.evalAfter
                                : ma.evalAfter - deepBestWhite
                            );

                            moveAnalyses[i] = {
                                ...ma,
                                cpl: deepCpl,
                                bestMove: deepEvals[0].pv[0] || ma.bestMove,
                                bestUci: deepEvals[0].pv[0] || ma.bestUci,
                                depth: deepEvals[0].depth,
                                lines: deepEvals,
                            };
                        }
                    } catch {
                        // Skip failed re-analysis
                    }
                }
            }
        }

        // Phase 4: Run AI agent analysis (classification, accuracy, rating)
        if (!abortRef.current) {
            try {
                const insights = analyzeGame(moveAnalyses, fens);
                setInsights(insights);
            } catch (err) {
                console.error('[useEngine] Agent analysis error:', err);
            }
        }

        setAnalysisComplete(true);
        setAnalyzing(false);

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        setProgress({ status: 'complete', currentMove: totalMoves, totalMoves, depth: 0, nodes: 0 });
        console.log(`[useEngine] ✅ Analysis complete — ${totalMoves} moves in ${elapsed}s`);
    }, [game.fens, game.moves, config.moveTime]);

    /**
     * On-demand position evaluation with MultiPV=3 for engine lines display.
     */
    const evaluatePosition = useCallback(async (fen: string) => {
        const engine = engineRef.current;
        if (!engine) return;

        try {
            const evals = await engine.evaluatePositionTimed(fen, config.moveTime * 2, config.multiPV);
            setCurrentLines(evals);
        } catch (err) {
            console.error('[useEngine] Position eval error:', err);
        }
    }, [config.moveTime, config.multiPV]);

    return {
        engineStatus,
        engineError,
        analyzeFullGame,
        evaluatePosition,
        stopAnalysis: () => { abortRef.current = true; },
    };
}
