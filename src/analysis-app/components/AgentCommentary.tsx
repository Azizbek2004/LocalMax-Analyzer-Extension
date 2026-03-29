import { useAppStore } from '../../store/store';
import { classificationColor, classificationLabel } from '../../utils/helpers';
import { MessageSquare, Lightbulb, AlertTriangle } from 'lucide-react';

export default function AgentCommentary() {
    const insights = useAppStore(s => s.analysis.insights);
    const currentIndex = useAppStore(s => s.ui.currentMoveIndex);

    if (!insights) {
        return (
            <div className="flex items-center justify-center h-full text-gray-600">
                <div className="text-center">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">AI Coach commentary will appear here</p>
                    <p className="text-xs text-gray-700 mt-1">Complete analysis to unlock coaching insights</p>
                </div>
            </div>
        );
    }

    // Show commentary for current move or overall summary
    const currentInsight = currentIndex > 0 ? insights.moveInsights[currentIndex - 1] : null;

    return (
        <div className="space-y-4">
            {/* Current Move Commentary */}
            {currentInsight ? (
                <div className="animate-slide-up">
                    <div className="flex items-center gap-2 mb-2">
                        <div
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: classificationColor(currentInsight.classification) }}
                        />
                        <span className="text-xs font-semibold uppercase tracking-wider"
                            style={{ color: classificationColor(currentInsight.classification) }}
                        >
                            {classificationLabel(currentInsight.classification)}
                        </span>
                        <span className="text-xs text-gray-600 font-mono">
                            Move {Math.floor(currentInsight.moveIndex / 2) + 1}
                            {currentInsight.isWhite ? '.' : '…'} {currentInsight.move}
                        </span>
                    </div>

                    <div className="glass-panel-sm p-3 border-l-2"
                        style={{ borderColor: classificationColor(currentInsight.classification) }}
                    >
                        <p className="text-sm text-gray-300 leading-relaxed">
                            {currentInsight.commentary}
                        </p>
                    </div>

                    {/* Tactical Motifs */}
                    {currentInsight.motifs.length > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                            <Lightbulb className="w-3.5 h-3.5 text-yellow-400" />
                            <div className="flex gap-1.5">
                                {currentInsight.motifs.map(motif => (
                                    <span key={motif} className="px-2 py-0.5 bg-yellow-400/10 text-yellow-400 rounded text-[10px] font-medium">
                                        {motif.replace('_', ' ')}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* What-If */}
                    {currentInsight.whatIf && (
                        <div className="flex items-start gap-2 mt-2 glass-panel-sm p-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-eval-mistake shrink-0 mt-0.5" />
                            <p className="text-xs text-gray-400">{currentInsight.whatIf}</p>
                        </div>
                    )}

                    {/* Win Probability Change */}
                    <div className="flex items-center gap-4 mt-3 text-[11px] text-gray-500">
                        <span>
                            WP Before: <span className="text-gray-300 font-mono">{(currentInsight.winProbBefore * 100).toFixed(1)}%</span>
                        </span>
                        <span>→</span>
                        <span>
                            WP After: <span className="text-gray-300 font-mono">{(currentInsight.winProbAfter * 100).toFixed(1)}%</span>
                        </span>
                        {currentInsight.isTurningPoint && (
                            <span className="text-eval-blunder font-semibold">⚡ Turning Point</span>
                        )}
                    </div>
                </div>
            ) : (
                /* Game Summary (when no move selected) */
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-cyan" />
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Game Summary</h4>
                    </div>
                    <div className="glass-panel-sm p-3 border-l-2 border-cyan">
                        <p className="text-sm text-gray-300 leading-relaxed">{insights.gameSummary}</p>
                    </div>

                    {/* Phase Summaries */}
                    {insights.phaseAnalysis.map(phase => (
                        <div key={phase.phase} className="glass-panel-sm p-3 mt-2">
                            <h5 className="text-xs font-semibold text-cyan capitalize mb-1">{phase.phase}</h5>
                            <p className="text-xs text-gray-400">{phase.summary}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
