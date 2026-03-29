import { useAppStore } from '../../store/store';
import { classificationColor, classificationLabel, type MoveClassification } from '../../utils/helpers';
import { BarChart3, Target, Zap, Trophy } from 'lucide-react';

const ALL_CLASSIFICATIONS: MoveClassification[] = [
    'brilliant', 'best', 'book', 'good', 'inaccuracy', 'mistake', 'miss', 'blunder',
];

export default function StatsPanel() {
    const insights = useAppStore(s => s.analysis.insights);
    const moveAnalyses = useAppStore(s => s.analysis.moveAnalyses);
    const game = useAppStore(s => s.game);

    if (!insights && moveAnalyses.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-600">
                <div className="text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Analysis statistics will appear here</p>
                    <p className="text-xs text-gray-700 mt-1">Load a game and run analysis to see stats</p>
                </div>
            </div>
        );
    }

    const whiteAccuracy = insights?.whiteAccuracy ?? 0;
    const blackAccuracy = insights?.blackAccuracy ?? 0;
    const whiteCounts = insights?.classificationCounts?.white;
    const blackCounts = insights?.classificationCounts?.black;

    return (
        <div className="space-y-4">
            {/* Game Summary */}
            {insights?.gameSummary && (
                <div className="glass-panel-sm p-3 border-l-2 border-cyan">
                    <p className="text-sm text-gray-300 leading-relaxed">{insights.gameSummary}</p>
                </div>
            )}

            {/* Accuracy + Rating Meters */}
            <div className="grid grid-cols-2 gap-4">
                <AccuracyCard
                    label={game.headers?.White || 'White'}
                    accuracy={whiteAccuracy}
                    rating={insights?.whiteRating}
                    ratingLabel={insights?.whiteRatingLabel}
                    isWhite={true}
                />
                <AccuracyCard
                    label={game.headers?.Black || 'Black'}
                    accuracy={blackAccuracy}
                    rating={insights?.blackRating}
                    ratingLabel={insights?.blackRatingLabel}
                    isWhite={false}
                />
            </div>

            {/* Move Classification Breakdown */}
            {whiteCounts && blackCounts && (
                <div className="grid grid-cols-2 gap-4">
                    <ClassificationBreakdown title="White" counts={whiteCounts} />
                    <ClassificationBreakdown title="Black" counts={blackCounts} />
                </div>
            )}

            {/* Phase Analysis */}
            {insights?.phaseAnalysis && insights.phaseAnalysis.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> Phase Breakdown
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                        {insights.phaseAnalysis.map(phase => (
                            <div key={phase.phase} className="glass-panel-sm p-3 text-center">
                                <div className="text-xs text-gray-500 capitalize mb-1">{phase.phase}</div>
                                <div className="text-lg font-bold text-cyan">{phase.accuracy.toFixed(0)}%</div>
                                <div className="text-[10px] text-gray-600">{phase.moves} moves</div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Critical Moments */}
            {insights?.topMistakes && insights.topMistakes.length > 0 && (
                <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> Critical Moments
                    </h4>
                    <div className="space-y-1">
                        {insights.topMistakes.slice(0, 4).map((mistake, i) => (
                            <div key={i} className="glass-panel-sm p-2 flex items-center gap-3">
                                <span className="text-xs font-mono text-gray-600">
                                    #{Math.floor(mistake.moveIndex / 2) + 1}
                                </span>
                                <span
                                    className="w-2 h-2 rounded-full shrink-0"
                                    style={{ backgroundColor: classificationColor(mistake.classification) }}
                                />
                                <span className="font-mono text-sm" style={{ color: classificationColor(mistake.classification) }}>
                                    {mistake.move}
                                </span>
                                <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold"
                                    style={{
                                        backgroundColor: classificationColor(mistake.classification) + '20',
                                        color: classificationColor(mistake.classification),
                                    }}
                                >
                                    {classificationLabel(mistake.classification)}
                                </span>
                                <span className="text-xs text-gray-500 flex-1 truncate">{mistake.commentary}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function AccuracyCard({
    label, accuracy, rating, ratingLabel: ratLabel, isWhite,
}: {
    label: string;
    accuracy: number;
    rating?: number;
    ratingLabel?: string;
    isWhite: boolean;
}) {
    const color = accuracy > 90 ? '#96BC4B' : accuracy > 75 ? '#F7C631' : accuracy > 60 ? '#E58F2A' : '#CA3431';

    return (
        <div className="glass-panel-sm p-4 text-center">
            <div className="text-xs text-gray-500 mb-2 truncate font-semibold">{label}</div>

            {/* Accuracy Ring */}
            <div className="relative w-20 h-20 mx-auto mb-2">
                <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
                    <circle cx="40" cy="40" r="34" stroke="#1A3264" strokeWidth="6" fill="none" />
                    <circle
                        cx="40" cy="40" r="34"
                        stroke={color}
                        strokeWidth="6"
                        fill="none"
                        strokeLinecap="round"
                        strokeDasharray={`${(accuracy / 100) * 213.6} 213.6`}
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl font-bold" style={{ color }}>
                        {accuracy.toFixed(1)}%
                    </span>
                </div>
            </div>
            <div className="text-[10px] text-gray-500 mb-2">Accuracy</div>

            {/* Estimated Rating */}
            {rating !== undefined && (
                <div className="glass-panel-sm px-2 py-1 inline-flex items-center gap-1.5 mt-1">
                    <Trophy className="w-3 h-3 text-yellow-500" />
                    <span className="text-xs font-bold text-white">~{rating}</span>
                    <span className="text-[10px] text-gray-500">{ratLabel}</span>
                </div>
            )}
        </div>
    );
}

function ClassificationBreakdown({
    title, counts,
}: {
    title: string;
    counts: Record<MoveClassification, number>;
}) {
    // Only show classifications that have counts > 0 or are important
    const visibleClassifications = ALL_CLASSIFICATIONS.filter(
        cls => counts[cls] > 0 || ['inaccuracy', 'mistake', 'blunder'].includes(cls)
    );

    return (
        <div className="glass-panel-sm p-3">
            <div className="text-xs font-semibold text-gray-400 mb-2">{title}</div>
            <div className="space-y-1">
                {visibleClassifications.map(cls => (
                    <div key={cls} className="flex items-center gap-2">
                        <div
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: classificationColor(cls) }}
                        />
                        <span className="text-[11px] text-gray-400 flex-1">{classificationLabel(cls)}</span>
                        <span className="text-[11px] font-mono font-bold" style={{
                            color: counts[cls] > 0 ? classificationColor(cls) : '#444',
                        }}>
                            {counts[cls]}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
