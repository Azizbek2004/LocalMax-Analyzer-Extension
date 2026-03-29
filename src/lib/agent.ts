/**
 * AI Analysis Agent — Advanced Chess.com-Style Classification
 *
 * Classification logic (in priority order):
 *
 * ── BAD MOVES (checked first by severity) ──
 * BLUNDER (??)  — CPL ≥ 200, OR eval flips sign (winning→losing), OR missed forced mate
 * MISS          — Had winning eval (>300cp) but lost significant advantage (CPL>150)
 * MISTAKE (?)   — CPL 100–200
 * INACCURACY (?!) — CPL 50–100
 *
 * ── GOOD MOVES (checked with context) ──
 * BRILLIANT (!!) — Near-best move + sacrifice (piece worth more than captured) + eval maintained
 *                  OR: finding the only winning move in a position where all others lose
 * GREAT (!)     — Best move + second-best is ≥100cp worse (only winning move)
 * BEST          — Matches engine #1 choice (CPL ≤ 2)
 * EXCELLENT     — CPL < 10
 * GOOD          — CPL < 30
 * BOOK          — First ≤10 moves with CPL < 5 (opening theory)
 * FORCED        — Only one legal move (no classification needed)
 */

import { Chess, type Move } from 'chess.js';
import type { MoveAnalysis } from './stockfishWorker';
import {
    classifyMove as classifyByCpl,
    winProbability,
    moveAccuracy,
    gameAccuracy,
    estimateRating,
    ratingLabel,
    detectPhase,
    type MoveClassification,
    type GamePhase,
} from '../utils/helpers';

// ───── Types ─────

export type TacticalMotif =
    | 'fork' | 'pin' | 'skewer' | 'discovered_attack' | 'double_check'
    | 'deflection' | 'sacrifice' | 'back_rank' | 'removal_of_guard'
    | 'zwischenzug' | 'trapped_piece';

export interface MoveInsight {
    moveIndex: number;
    move: string;
    classification: MoveClassification;
    cpl: number;
    commentary: string;
    motifs: TacticalMotif[];
    isWhite: boolean;
    isTurningPoint: boolean;
    winProbBefore: number;
    winProbAfter: number;
    accuracy: number;
    bestMove: string;
    whatIf?: string;
}

export interface PhaseAnalysis {
    phase: GamePhase;
    accuracy: number;
    moves: number;
    avgCpl: number;
    summary: string;
}

export interface GameInsights {
    moveInsights: MoveInsight[];
    whiteAccuracy: number;
    blackAccuracy: number;
    whiteRating: number;
    blackRating: number;
    whiteRatingLabel: string;
    blackRatingLabel: string;
    phaseAnalysis: PhaseAnalysis[];
    turningPoints: number[];
    topMistakes: MoveInsight[];
    gameSummary: string;
    classificationCounts: {
        white: Record<MoveClassification, number>;
        black: Record<MoveClassification, number>;
    };
}

// ───── Exact CARA Move Classifier ─────

function classifyMoveAdvanced(
    ma: MoveAnalysis,
    moveObj: Move | null,
    secondBestEval: number | null,
    legalMoveCount: number,
    chessInstance: Chess,
): MoveClassification {
    const { cpl, evalBefore, evalAfter, isWhite, move, bestMove, mateBefore, mateAfter } = ma;

    // 0. FORCED: only one legal move
    if (legalMoveCount === 1) return 'best';

    const movesMatch = move === bestMove;

    // 1. BRILLIANT: Approximation (sacrifice + best)
    if (movesMatch && moveObj) {
        const isSacrificialCapture = moveObj.captured && isSacrificeMove(moveObj);
        const isPieceSacrifice = !moveObj.captured && isPieceHanging(moveObj);
        
        const evalBeforeStm = isWhite ? evalBefore : -evalBefore;
        const evalAfterStm = isWhite ? evalAfter : -evalAfter;
        const evalMaintained = evalAfterStm > evalBeforeStm - 30;

        if ((isSacrificialCapture || isPieceSacrifice) && evalMaintained) {
            return 'brilliant';
        }
    }

    // 2. BEST MOVE
    if (movesMatch) {
        return 'best';
    }

    // 3. MISS: Failed to capitalize on tactical opportunity
    if (cpl >= 100 && moveObj) {
        const bestMoveIsMate = isWhite ? (mateBefore !== null && mateBefore > 0) : (mateBefore !== null && mateBefore < 0);
        let bestMoveIsCapture = false;
        try {
            const tempChess = new Chess(ma.fen);
            const bestMoveObj = tempChess.move(bestMove);
            bestMoveIsCapture = !!bestMoveObj.captured;
        } catch { /* ignore */ }

        const bestMoveIsTactical = bestMoveIsMate || bestMoveIsCapture;
        const playedMoveIsMate = isWhite ? (mateAfter !== null && mateAfter > 0) : (mateAfter !== null && mateAfter < 0);
        const playedMoveIsCapture = !!moveObj.captured;

        if (bestMoveIsTactical && !playedMoveIsCapture && !playedMoveIsMate) {
            return 'miss';
        }
    }

    // 4. CARA CPL Thresholds
    if (cpl <= 50) return 'good';
    if (cpl <= 100) return 'inaccuracy';
    if (cpl <= 200) return 'mistake';
    
    // 5. BLUNDER
    return 'blunder';
}

/**
 * Check if a capture is a sacrifice (captured piece worth less than moved piece).
 */
function isSacrificeMove(moveObj: Move): boolean {
    const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    const movedVal = values[moveObj.piece] || 0;
    const capturedVal = moveObj.captured ? values[moveObj.captured] || 0 : 0;
    return movedVal > capturedVal + 1; // Sacrifice = losing material in the trade
}

/**
 * Check if a non-capture move puts a piece in danger (simplified heuristic).
 * For a proper check, we'd need to verify if the destination square is attacked.
 * Here we use a simple heuristic: if a non-pawn piece moves to a square that was
 * previously occupied in a tense position, it might be a sacrifice.
 */
function isPieceHanging(moveObj: Move): boolean {
    // Non-pawn, non-king piece moving could be a sacrifice
    // This is a simplified heuristic — full check would need board analysis
    return moveObj.piece !== 'p' && moveObj.piece !== 'k' && !moveObj.captured;
}

function generateCommentary(
    classification: MoveClassification,
    moveSan: string,
    bestMove: string,
    cpl: number,
    isWhite: boolean,
    wpSwing: number,
    legalMoveCount: number,
): string {
    const side = isWhite ? 'White' : 'Black';
    const cplStr = (cpl / 100).toFixed(1);

    switch (classification) {
        case 'brilliant':
            return `💎 ${moveSan} is a brilliancy! ${side} finds a creative and powerful idea.`;
        case 'best':
            return `★ ${moveSan} is the best move.`;
        case 'good':
            return `${moveSan} is a good play.${cpl > 0 ? ` ${bestMove} was slightly better (−${cplStr}).` : ''}`;
        case 'inaccuracy':
            return `${moveSan} is an inaccuracy (−${cplStr}). ${bestMove} was better.`;
        case 'mistake':
            return `${moveSan} is a mistake! ${side} should have played ${bestMove} (−${cplStr}).`;
        case 'miss':
            return `${moveSan} is a miss! ${side} missed a tactical opportunity. ${bestMove} was critical.`;
        case 'blunder':
            return `${moveSan} is a blunder! ${side} loses ${(wpSwing * 100).toFixed(0)}% winning chances. ${bestMove} was critical.`;
        default:
            return `${moveSan} — continuation by ${side}.`;
    }
}

// ───── Phase Summary ─────

function generatePhaseSummary(phase: GamePhase, whiteAcc: number, blackAcc: number): string {
    const name = phase.charAt(0).toUpperCase() + phase.slice(1);
    if (whiteAcc > 95 && blackAcc > 95) return `${name}: Exceptional play by both sides.`;
    if (whiteAcc > 90 && blackAcc > 90) return `${name}: Solid play from both sides.`;
    if (whiteAcc > blackAcc + 15) return `${name}: White outperformed Black significantly.`;
    if (blackAcc > whiteAcc + 15) return `${name}: Black outperformed White significantly.`;
    return `${name}: Competitive play from both sides.`;
}

// ───── Main Analysis Function ─────

export function analyzeGame(moveAnalyses: MoveAnalysis[], fens?: string[]): GameInsights {
    const chess = new Chess();
    const insights: MoveInsight[] = [];
    const totalMoves = moveAnalyses.length;

    const whiteAccuracies: number[] = [];
    const blackAccuracies: number[] = [];

    const phaseData: Record<GamePhase, { whiteAccs: number[]; blackAccs: number[]; count: number }> = {
        opening: { whiteAccs: [], blackAccs: [], count: 0 },
        middlegame: { whiteAccs: [], blackAccs: [], count: 0 },
        endgame: { whiteAccs: [], blackAccs: [], count: 0 },
    };

    const counts: GameInsights['classificationCounts'] = {
        white: { brilliant: 0, best: 0, book: 0, good: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0 },
        black: { brilliant: 0, best: 0, book: 0, good: 0, inaccuracy: 0, mistake: 0, miss: 0, blunder: 0 },
    };

    for (let i = 0; i < moveAnalyses.length; i++) {
        const ma = moveAnalyses[i];
        const cpl = Math.max(0, ma.cpl);
        const wpBefore = winProbability(ma.evalBefore);
        const wpAfter = winProbability(ma.evalAfter);
        const wpSwing = Math.abs(wpAfter - wpBefore);
        const phase = detectPhase(ma.moveNumber, totalMoves);
        const isTurningPoint = wpSwing > 0.15;

        // Parse the move with chess.js for piece/capture info
        let moveObj: Move | null = null;
        let legalMoveCount = 0;
        try {
            chess.load(ma.fen);
            legalMoveCount = chess.moves().length;
            moveObj = chess.move(ma.move);
        } catch { /* skip */ }

        // Get second-best eval from engine lines
        const secondBestEval = ma.lines.length > 1 ? ma.lines[1].score : null;

        // ── Advanced classification ──
        const classification = classifyMoveAdvanced(ma, moveObj, secondBestEval, legalMoveCount, chess);

        // Per-move accuracy (WP-based)
        const acc = moveAccuracy(ma.evalBefore, ma.evalAfter, ma.isWhite);

        const commentary = generateCommentary(
            classification, ma.move, ma.bestMove,
            cpl, ma.isWhite, wpSwing, legalMoveCount,
        );

        const whatIf = (['blunder', 'mistake', 'inaccuracy', 'miss'] as MoveClassification[]).includes(classification)
            ? `Best was ${ma.bestMove} (eval ${(ma.evalBefore / 100).toFixed(2)}).`
            : undefined;

        const insight: MoveInsight = {
            moveIndex: i,
            move: ma.move,
            classification,
            cpl,
            commentary,
            motifs: [],
            isWhite: ma.isWhite,
            isTurningPoint,
            winProbBefore: wpBefore,
            winProbAfter: wpAfter,
            accuracy: acc,
            bestMove: ma.bestMove,
            whatIf,
        };

        insights.push(insight);

        // Track per-side accuracies
        if (ma.isWhite) {
            whiteAccuracies.push(acc);
            counts.white[classification]++;
            phaseData[phase].whiteAccs.push(acc);
        } else {
            blackAccuracies.push(acc);
            counts.black[classification]++;
            phaseData[phase].blackAccs.push(acc);
        }
        phaseData[phase].count++;
    }

    // Overall accuracy
    const whiteAccuracy = gameAccuracy(whiteAccuracies);
    const blackAccuracy = gameAccuracy(blackAccuracies);

    // Estimated ratings
    const whiteRating = estimateRating(whiteAccuracy);
    const blackRating = estimateRating(blackAccuracy);

    // Phase analysis
    const phaseAnalysis: PhaseAnalysis[] = (['opening', 'middlegame', 'endgame'] as GamePhase[])
        .filter(p => phaseData[p].count > 0)
        .map(p => {
            const pd = phaseData[p];
            const wAcc = pd.whiteAccs.length > 0 ? gameAccuracy(pd.whiteAccs) : 100;
            const bAcc = pd.blackAccs.length > 0 ? gameAccuracy(pd.blackAccs) : 100;
            const avgAcc = (wAcc + bAcc) / 2;
            return {
                phase: p,
                accuracy: avgAcc,
                moves: pd.count,
                avgCpl: 0,
                summary: generatePhaseSummary(p, wAcc, bAcc),
            };
        });

    // Turning points
    const turningPoints = insights
        .filter(m => m.isTurningPoint)
        .map(m => m.moveIndex);

    // Top mistakes
    const topMistakes = insights
        .filter(m => ['blunder', 'mistake', 'inaccuracy', 'miss'].includes(m.classification))
        .sort((a, b) => b.cpl - a.cpl)
        .slice(0, 6);

    // Game summary
    const gameSummary = generateGameSummary(whiteAccuracy, blackAccuracy, whiteRating, blackRating, turningPoints.length);

    return {
        moveInsights: insights,
        whiteAccuracy,
        blackAccuracy,
        whiteRating,
        blackRating,
        whiteRatingLabel: ratingLabel(whiteRating),
        blackRatingLabel: ratingLabel(blackRating),
        phaseAnalysis,
        turningPoints,
        topMistakes,
        gameSummary,
        classificationCounts: counts,
    };
}

function generateGameSummary(
    whiteAcc: number, blackAcc: number,
    whiteRating: number, blackRating: number,
    turningPoints: number,
): string {
    const lines: string[] = [];

    if (whiteAcc > 95 && blackAcc > 95) {
        lines.push('An exceptionally well-played game by both sides.');
    } else if (whiteAcc > 90 && blackAcc > 90) {
        lines.push('A high-quality game with only minor inaccuracies.');
    } else if (Math.abs(whiteAcc - blackAcc) > 15) {
        const better = whiteAcc > blackAcc ? 'White' : 'Black';
        lines.push(`${better} outperformed significantly in this game.`);
    } else {
        lines.push('A competitive game with interesting moments.');
    }

    if (turningPoints > 3) {
        lines.push(`The game featured ${turningPoints} turning points — a real battle!`);
    }

    lines.push(
        `White: ${whiteAcc.toFixed(1)}% accuracy (~${whiteRating} ELO) | ` +
        `Black: ${blackAcc.toFixed(1)}% accuracy (~${blackRating} ELO)`
    );

    return lines.join(' ');
}
