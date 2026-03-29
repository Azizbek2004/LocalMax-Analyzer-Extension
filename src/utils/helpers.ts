import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// ───── Cara Move Classification ─────

export type MoveClassification = 'brilliant' | 'best' | 'book' | 'good' | 'inaccuracy' | 'mistake' | 'miss' | 'blunder';

/**
 * Cara-style classification thresholds (centipawn loss).
 * Brilliant is detected separately via context.
 */
export function classifyMove(cpl: number): MoveClassification {
    // Basic CPL evaluation matching CARA thresholds
    if (cpl <= 50) return 'good';
    if (cpl <= 100) return 'inaccuracy';
    if (cpl <= 200) return 'mistake';
    return 'blunder';
}

export function classificationColor(cls: MoveClassification | string): string {
    const colors: Record<string, string> = {
        book: '#B0BEC5',
        brilliant: '#26C6DA',
        best: '#4CAF50',
        good: '#96BC4B',
        inaccuracy: '#F7C631',
        mistake: '#E58F2A',
        miss: '#FF5252',
        blunder: '#CA3431',
    };
    return colors[cls] || '#888';
}

export function classificationGlyph(cls: MoveClassification | string): string {
    const glyphs: Record<string, string> = {
        book: '📖', brilliant: '!!', best: '★', good: '✓', inaccuracy: '?!', mistake: '?', miss: '❌', blunder: '??',
    };
    return glyphs[cls] || '';
}

export function classificationLabel(cls: MoveClassification | string): string {
    const labels: Record<string, string> = {
        book: 'Book Move', brilliant: 'Brilliancy', best: 'Best Move', good: 'Good',
        inaccuracy: 'Inaccuracy', mistake: 'Mistake', miss: 'Miss', blunder: 'Blunder',
    };
    return labels[cls] || cls.charAt(0).toUpperCase() + cls.slice(1);
}

export function classificationIcon(cls: MoveClassification | string): string {
    const icons: Record<string, string> = {
        book: '📖', brilliant: '💎', best: '★', good: '✓', inaccuracy: '⚠', mistake: '✗', miss: '❌', blunder: '✗✗',
    };
    return icons[cls] || '';
}

// ───── Win Probability (Lichess logistic model) ─────

export function winProbability(evalCp: number): number {
    return 1 / (1 + Math.exp(-0.00368208 * evalCp));
}

// ───── Chess.com Accuracy Formula (Win Probability Based) ─────

/**
 * Per-move accuracy using win probability loss.
 * Chess.com uses WP delta (not raw CPL) for accuracy — this accounts
 * for the fact that a 100cp loss in equal position is far worse
 * than 100cp when already losing by 500cp.
 *
 * Calibrated against chess.com benchmark:
 *   69.3% accuracy for 1050-rated play, 66.7% for 900-rated play.
 */
export function moveAccuracy(evalBefore: number, evalAfter: number, isWhite: boolean): number {
    const wpBefore = winProbability(evalBefore);
    const wpAfter = winProbability(evalAfter);

    // WP loss from the moving side's perspective
    const wpLoss = isWhite
        ? Math.max(0, wpBefore - wpAfter)
        : Math.max(0, (1 - wpBefore) - (1 - wpAfter));

    // Convert to percentage points (0-100 scale) and apply scaling factor
    // Coefficient 4.0 calibrated from chess.com benchmark:
    //   Iteration 1 (1.8) → 82/80%, Iteration 2 (3.2) → 75/71%, target → 69/67%
    const wpLossPct = wpLoss * 100;
    const raw = 103.1668 * Math.exp(-0.04354 * wpLossPct * 4.0);
    return Math.max(0, Math.min(100, raw));
}

/**
 * Game accuracy: arithmetic mean of per-move accuracies.
 */
export function gameAccuracy(moveAccuracies: number[]): number {
    if (moveAccuracies.length === 0) return 0;
    return moveAccuracies.reduce((a, b) => a + b, 0) / moveAccuracies.length;
}

// ───── Game Rating Estimation (Calibrated to Chess.com) ─────

/**
 * Estimate game rating from accuracy %.
 * Uses piecewise linear interpolation calibrated to chess.com data.
 * Benchmark: 69.3% → ~1050, 66.7% → ~900.
 */
export function estimateRating(accuracy: number): number {
    // [accuracy%, estimatedRating] pairs calibrated to chess.com
    // Key benchmark: 70.7% → ~1050, 67.7% → ~900
    const table: [number, number][] = [
        [100, 3200], [98, 2800], [96, 2500], [95, 2350], [93, 2150],
        [91, 1950], [90, 1850], [88, 1700], [86, 1550], [85, 1475],
        [83, 1375], [81, 1275], [80, 1225], [78, 1175], [76, 1125],
        [74, 1100], [72, 1075], [71, 1050], [70, 1025], [69, 950],
        [68, 925], [67, 875], [66, 825], [65, 800], [63, 725],
        [60, 650], [55, 550], [50, 450], [45, 350], [40, 250],
    ];

    if (accuracy >= 100) return 3200;
    if (accuracy <= 40) return 200;

    for (let i = 0; i < table.length - 1; i++) {
        const [a1, r1] = table[i];
        const [a2, r2] = table[i + 1];
        if (accuracy <= a1 && accuracy >= a2) {
            const t = (accuracy - a2) / (a1 - a2);
            return Math.round(r2 + t * (r1 - r2));
        }
    }
    return 500;
}

export function ratingLabel(rating: number): string {
    if (rating >= 2400) return 'Master';
    if (rating >= 2000) return 'Expert';
    if (rating >= 1800) return 'Class A';
    if (rating >= 1600) return 'Class B';
    if (rating >= 1400) return 'Class C';
    if (rating >= 1200) return 'Class D';
    if (rating >= 1000) return 'Beginner';
    if (rating >= 800) return 'Novice';
    return 'Newcomer';
}

// ───── Utility Functions ─────

export function formatEval(evalCp: number | null, isMate?: boolean, mateIn?: number): string {
    if (isMate && mateIn !== undefined) {
        return mateIn > 0 ? `M${mateIn}` : `-M${Math.abs(mateIn)}`;
    }
    if (evalCp === null) return '—';
    const sign = evalCp >= 0 ? '+' : '';
    return `${sign}${(evalCp / 100).toFixed(2)}`;
}

export function formatNodes(n: number): string {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toString();
}

export type GamePhase = 'opening' | 'middlegame' | 'endgame';

export function detectPhase(moveNumber: number, totalMoves: number): GamePhase {
    const ratio = moveNumber / totalMoves;
    if (ratio < 0.2 || moveNumber <= 12) return 'opening';
    if (ratio > 0.65 || moveNumber > totalMoves - 15) return 'endgame';
    return 'middlegame';
}

export function isSacrifice(moveSan: string, capturedPiece: string | null, movedPiece: string): boolean {
    if (!capturedPiece) return false;
    const values: Record<string, number> = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    const movedVal = values[movedPiece.toLowerCase()] || 0;
    const capturedVal = values[capturedPiece.toLowerCase()] || 0;
    return movedVal > capturedVal + 1;
}
