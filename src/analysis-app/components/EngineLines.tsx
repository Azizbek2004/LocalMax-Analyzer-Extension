import { useAppStore } from '../../store/store';
import { formatEval, formatNodes } from '../../utils/helpers';
import { Cpu } from 'lucide-react';

export default function EngineLines() {
    const currentLines = useAppStore(s => s.engine.currentLines);
    const currentIndex = useAppStore(s => s.ui.currentMoveIndex);
    const moveAnalyses = useAppStore(s => s.analysis.moveAnalyses);
    const engineLoaded = useAppStore(s => s.engine.isLoaded);

    // Use stored analysis for current move if available
    const currentAnalysis = currentIndex > 0 ? moveAnalyses[currentIndex - 1] : null;
    const lines = currentAnalysis?.lines ?? currentLines;

    if (!lines.length && !currentAnalysis) {
        return (
            <div className="glass-panel-sm p-3">
                <div className="flex items-center gap-2 mb-2">
                    <Cpu className="w-4 h-4 text-cyan/50" />
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Engine Lines</h3>
                </div>
                <div className="text-sm text-gray-600 italic">
                    {engineLoaded ? 'Navigate to a move to see analysis' : 'Engine not loaded — see Settings'}
                </div>
            </div>
        );
    }

    return (
        <div className="glass-panel-sm p-3">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan" />
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Engine Lines</h3>
                </div>
                {lines[0] && (
                    <span className="text-[10px] text-gray-600 font-mono">
                        d{lines[0].depth} • {formatNodes(lines[0].nodes)} nodes
                    </span>
                )}
            </div>

            <div className="space-y-1">
                {lines.slice(0, 3).map((line, i) => (
                    <div
                        key={i}
                        className={`flex items-start gap-3 p-2 rounded-lg transition-colors ${i === 0 ? 'bg-cyan/5 border border-cyan/10' : 'hover:bg-navy-700/30'
                            }`}
                    >
                        {/* Eval */}
                        <div className={`font-mono text-sm font-bold shrink-0 w-16 text-right ${i === 0 ? 'text-cyan' : 'text-gray-400'
                            }`}>
                            {formatEval(line.score, line.mate !== null, line.mate ?? undefined)}
                        </div>

                        {/* Moves */}
                        <div className="text-sm text-gray-300 font-mono leading-relaxed truncate">
                            {line.pv.slice(0, 8).join(' ')}
                            {line.pv.length > 8 && <span className="text-gray-600">…</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
