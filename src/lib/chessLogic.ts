/**
 * Chess Logic Utilities
 * PGN parsing, FEN generation, and move list extraction using chess.js.
 */

import { Chess } from 'chess.js';

export interface ParsedGame {
    fens: string[];       // FEN at every position (including start)
    moves: string[];      // SAN moves
    uciMoves: string[];   // UCI moves
    headers: Record<string, string>;
    result: string;
}

/**
 * Parse a PGN string into structured game data
 */
export function parsePGN(pgn: string): ParsedGame {
    const chess = new Chess();
    let loaded = false;

    // Attempt 1: Direct loadPgn
    try {
        chess.loadPgn(pgn);
        loaded = true;
    } catch {
        // Attempt 2: Strip headers and try again
        try {
            const cleanPgn = pgn.replace(/\[.*?\]\s*/g, '').trim();
            chess.loadPgn(cleanPgn);
            loaded = true;
        } catch {
            // Attempt 3: Parse moves individually
            try {
                chess.reset();
                const cleanMoves = pgn
                    .replace(/\[.*?\]\s*/g, '')                    // remove headers
                    .replace(/\{[^}]*\}/g, '')                     // remove comments
                    .replace(/\(.*?\)/g, '')                       // remove variations
                    .replace(/\d+\.\.\./g, '')                     // remove "1..."
                    .replace(/\d+\./g, '')                         // remove move numbers
                    .replace(/(1-0|0-1|1\/2-1\/2|\*)\s*$/g, '')    // remove result
                    .trim();

                const tokens = cleanMoves.split(/\s+/).filter(t => t.length > 0 && t.length < 10);
                for (const token of tokens) {
                    try {
                        chess.move(token);
                    } catch {
                        break; // stop at first invalid move
                    }
                }

                if (chess.history().length > 0) {
                    loaded = true;
                }
            } catch {
                // Fall through
            }
        }
    }

    if (!loaded || chess.history().length === 0) {
        throw new Error('Invalid PGN format');
    }

    const headers = chess.header() as Record<string, string>;
    const history = chess.history({ verbose: true });
    const result = headers.Result || '*';

    // Reset and replay to get FENs
    chess.reset();
    const fens: string[] = [chess.fen()]; // starting position
    const moves: string[] = [];
    const uciMoves: string[] = [];

    for (const move of history) {
        chess.move(move.san);
        fens.push(chess.fen());
        moves.push(move.san);
        uciMoves.push(`${move.from}${move.to}${move.promotion || ''}`);
    }

    return { fens, moves, uciMoves, headers, result };
}

/**
 * Get the FEN for a specific move index
 * index 0 = starting position, index 1 = after first move, etc.
 */
export function fenAtMoveIndex(fens: string[], index: number): string {
    return fens[Math.max(0, Math.min(index, fens.length - 1))];
}

/**
 * Check if it's White's turn in a FEN
 */
export function isWhiteTurn(fen: string): boolean {
    return fen.split(' ')[1] === 'w';
}

/**
 * Get move number from half-move index
 */
export function moveNumberFromIndex(index: number): number {
    return Math.floor((index - 1) / 2) + 1;
}

/**
 * Validate a PGN string
 */
export function validatePGN(pgn: string): boolean {
    try {
        parsePGN(pgn);
        return true;
    } catch {
        return false;
    }
}

/**
 * Generate annotated PGN with comments and eval annotations
 */
export function generateAnnotatedPGN(
    pgn: string,
    annotations: Array<{ moveIndex: number; comment: string; eval?: number }>,
): string {
    const chess = new Chess();
    chess.loadPgn(pgn);
    const history = chess.history();

    chess.reset();
    const lines: string[] = [];

    // Add headers
    const headers = chess.header() as Record<string, string>;
    for (const [key, value] of Object.entries(headers)) {
        lines.push(`[${key} "${value}"]`);
    }
    lines.push(`[Annotator "LocalMax Analyzer"]`);
    lines.push('');

    let pgn_str = '';
    for (let i = 0; i < history.length; i++) {
        const moveNum = Math.floor(i / 2) + 1;
        if (i % 2 === 0) {
            pgn_str += `${moveNum}. `;
        }
        pgn_str += history[i];

        // Add annotation if exists
        const annotation = annotations.find(a => a.moveIndex === i);
        if (annotation) {
            if (annotation.eval !== undefined) {
                pgn_str += ` { [%eval ${annotation.eval / 100}] ${annotation.comment} }`;
            } else {
                pgn_str += ` { ${annotation.comment} }`;
            }
        }

        pgn_str += ' ';
    }

    lines.push(pgn_str.trim());
    return lines.join('\n');
}
