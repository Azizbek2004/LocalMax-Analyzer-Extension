import { useAppStore } from '../../store/store';
import { classificationColor, classificationGlyph, type MoveClassification } from '../../utils/helpers';
import { cn } from '../../utils/helpers';

export default function MoveList() {
    const moves = useAppStore(s => s.game.moves);
    const currentIndex = useAppStore(s => s.ui.currentMoveIndex);
    const goToMove = useAppStore(s => s.goToMove);
    const insights = useAppStore(s => s.analysis.insights);

    // Group moves into pairs (white + black)
    const movePairs: Array<{
        number: number;
        white: { san: string; index: number; cls?: MoveClassification; color?: string; glyph?: string };
        black?: { san: string; index: number; cls?: MoveClassification; color?: string; glyph?: string };
    }> = [];

    for (let i = 0; i < moves.length; i += 2) {
        const whiteInsight = insights?.moveInsights[i];
        const blackInsight = i + 1 < moves.length ? insights?.moveInsights[i + 1] : undefined;

        movePairs.push({
            number: Math.floor(i / 2) + 1,
            white: {
                san: moves[i],
                index: i + 1,
                cls: whiteInsight?.classification,
                color: whiteInsight ? classificationColor(whiteInsight.classification) : undefined,
                glyph: whiteInsight ? classificationGlyph(whiteInsight.classification) : undefined,
            },
            black: i + 1 < moves.length
                ? {
                    san: moves[i + 1],
                    index: i + 2,
                    cls: blackInsight?.classification,
                    color: blackInsight ? classificationColor(blackInsight.classification) : undefined,
                    glyph: blackInsight ? classificationGlyph(blackInsight.classification) : undefined,
                }
                : undefined,
        });
    }

    return (
        <div className="glass-panel p-3 w-full md:w-[260px] overflow-y-auto max-h-[200px] md:max-h-[600px] shrink-0">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Moves</h3>
            <div className="space-y-0.5">
                {movePairs.map((pair) => (
                    <div key={pair.number} className="flex items-center text-sm">
                        {/* Move number */}
                        <span className="w-8 text-gray-600 text-xs font-mono shrink-0">{pair.number}.</span>

                        {/* White move */}
                        <MoveButton
                            san={pair.white.san}
                            index={pair.white.index}
                            cls={pair.white.cls}
                            color={pair.white.color}
                            glyph={pair.white.glyph}
                            isActive={currentIndex === pair.white.index}
                            onClick={() => goToMove(pair.white.index)}
                        />

                        {/* Black move */}
                        {pair.black ? (
                            <MoveButton
                                san={pair.black.san}
                                index={pair.black.index}
                                cls={pair.black.cls}
                                color={pair.black.color}
                                glyph={pair.black.glyph}
                                isActive={currentIndex === pair.black.index}
                                onClick={() => goToMove(pair.black!.index)}
                            />
                        ) : (
                            <div className="flex-1" />
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

function MoveButton({
    san, index, cls, color, glyph, isActive, onClick,
}: {
    san: string;
    index: number;
    cls?: MoveClassification;
    color?: string;
    glyph?: string;
    isActive: boolean;
    onClick: () => void;
}) {
    // Classification indicator dot
    const showDot = cls && !['best', 'book', 'good'].includes(cls);
    const showIcon = cls === 'brilliant';

    return (
        <button
            onClick={onClick}
            className={cn(
                'flex-1 px-2 py-0.5 text-left rounded transition-all duration-150 font-mono text-sm flex items-center gap-1',
                isActive
                    ? 'bg-cyan/15 text-cyan border-l-2 border-cyan'
                    : 'text-gray-300 hover:bg-navy-700/50'
            )}
        >
            {/* Classification dot */}
            {showDot && (
                <span
                    className="w-2 h-2 rounded-full shrink-0 inline-block"
                    style={{ backgroundColor: color }}
                />
            )}
            {showIcon && (
                <span className="text-[10px] shrink-0" style={{ color }}>
                    {cls === 'brilliant' ? '💎' : ''}
                </span>
            )}

            {/* Move SAN */}
            <span style={color && showDot ? { color } : undefined}>
                {san}
            </span>

            {/* Glyph annotation */}
            {glyph && (
                <span className="text-[10px] font-bold ml-0.5" style={{ color }}>
                    {glyph}
                </span>
            )}
        </button>
    );
}
