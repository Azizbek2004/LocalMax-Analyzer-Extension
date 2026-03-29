import { Chessboard } from 'react-chessboard';
import { useAppStore } from '../../store/store';
import { fenAtMoveIndex } from '../../lib/chessLogic';
import { classificationColor, classificationGlyph } from '../../utils/helpers';

function getSquareCoords(sq: string, orientation: 'white' | 'black') {
    const file = sq.charCodeAt(0) - 97; // 'a' is 0
    const rank = parseInt(sq[1], 10) - 1; // '1' is 0
    const x = orientation === 'white' ? file : 7 - file;
    const y = orientation === 'white' ? 7 - rank : rank;
    return { x, y };
}



export default function Board() {
    const fens = useAppStore(s => s.game.fens);
    const currentIndex = useAppStore(s => s.ui.currentMoveIndex);
    const orientation = useAppStore(s => s.ui.boardOrientation);
    const moveAnalyses = useAppStore(s => s.analysis.moveAnalyses);
    const insights = useAppStore(s => s.analysis.insights);

    const fen = fenAtMoveIndex(fens, currentIndex);

    // Current move insight (if analysis is done)
    const currentInsight = currentIndex > 0 && insights?.moveInsights
        ? insights.moveInsights[currentIndex - 1]
        : null;

    const currentAnalysis = currentIndex > 0 ? moveAnalyses[currentIndex - 1] : null;

    // ── Arrows ──
    const arrows: Array<[string, string, string]> = [];

    if (currentAnalysis) {
        // Show engine best move as green arrow (when different from played)
        if (currentAnalysis.bestUci && currentAnalysis.bestUci.length >= 4) {
            const bestFrom = currentAnalysis.bestUci.slice(0, 2);
            const bestTo = currentAnalysis.bestUci.slice(2, 4);

            // If the player's move was different, show best as blue arrow
            if (currentAnalysis.uciMove && currentAnalysis.uciMove !== currentAnalysis.bestUci) {
                arrows.push([bestFrom, bestTo, 'rgba(96, 165, 250, 0.6)']); // blue = engine best
            } else {
                arrows.push([bestFrom, bestTo, 'rgba(150, 188, 75, 0.6)']); // green = correct
            }
        }
    }

    // ── Square Highlights ──
    const customSquareStyles: Record<string, React.CSSProperties> = {};
    let badgeSq: string | null = null;
    let badgeColor = '';
    let badgeText = '';

    if (currentAnalysis && currentInsight) {
        const cls = currentInsight.classification;
        const color = classificationColor(cls);

        // Highlight last move squares based on classification
        if (currentAnalysis.uciMove && currentAnalysis.uciMove.length >= 4) {
            const from = currentAnalysis.uciMove.slice(0, 2);
            const to = currentAnalysis.uciMove.slice(2, 4);

            customSquareStyles[from] = {
                background: `${color}25`, // slightly stronger inside square
                borderRadius: '2px',
            };
            customSquareStyles[to] = {
                background: `${color}35`, // slightly stronger inside square
                borderRadius: '2px',
            };

            // Badge overlay data
            badgeSq = to;
            badgeColor = color;
            badgeText = classificationGlyph(cls);
        }
    }

    let badgeOverlay = null;
    if (badgeSq && badgeText) {
        const { x, y } = getSquareCoords(badgeSq!, orientation);
        // Position at top-right of the square (-12px offset so it overlaps edges like chess.com)
        badgeOverlay = (
            <div
                className="absolute flex items-center justify-center font-bold shadow-lg"
                style={{
                    top: `calc(${y * 12.5}% - 8px)`,
                    left: `calc(${(x + 1) * 12.5}% - 14px)`,
                    width: '24px',
                    height: '24px',
                    backgroundColor: badgeColor,
                    color: 'white',
                    borderRadius: '50%',
                    fontSize: badgeText.length > 1 ? '12px' : '14px',
                    lineHeight: '1',
                    border: '2px solid white', // Chess.com style white outline
                    zIndex: 20
                }}
            >
                {badgeText}
            </div>
        );
    }

    const isBadMove = currentInsight && ['inaccuracy', 'mistake', 'miss', 'blunder'].includes(currentInsight.classification);
    const isGreatMove = currentInsight && ['brilliant', 'best'].includes(currentInsight.classification);

    return (
        <div className="glass-panel p-2 md:p-3 w-full max-w-[520px] mx-auto min-w-[280px] hover:glow-cyan transition-shadow duration-500">
            <div className="relative w-full aspect-square">
                <Chessboard
                    id="analysis-board"
                    position={fen}
                    boardOrientation={orientation}
                    arePiecesDraggable={false}
                    customBoardStyle={{
                        borderRadius: '8px',
                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                    }}
                    customDarkSquareStyle={{ backgroundColor: '#1A3264' }}
                    customLightSquareStyle={{ backgroundColor: '#2A4A7A' }}
                    customSquareStyles={customSquareStyles}
                    customArrows={arrows as any}
                />

                {/* ── Chess.com Style Classification Badge (Inside Square) ── */}
                {badgeOverlay}
            </div>

            {/* ── Commentary tooltip (for bad/great moves) kept outside board ── */}
            {(isBadMove || isGreatMove) && currentInsight && (
                <div
                    className="mt-4 px-4 py-3 rounded-lg backdrop-blur-md shadow-lg text-sm leading-relaxed"
                    style={{
                        backgroundColor: `${badgeColor}15`,
                        border: `1px solid ${badgeColor}30`,
                        color: '#e2e8f0',
                    }}
                >
                    {currentInsight.commentary}
                </div>
            )}
        </div>
    );
}
