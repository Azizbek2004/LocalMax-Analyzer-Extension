import type { AnalysisProgress } from '../../lib/stockfishWorker';
import { formatNodes } from '../../utils/helpers';

interface Props {
    progress: AnalysisProgress;
}

export default function ProgressBar({ progress }: Props) {
    const percent = progress.totalMoves > 0
        ? (progress.currentMove / progress.totalMoves) * 100
        : 0;

    return (
        <div className="bg-navy-900/80 backdrop-blur-sm border-b border-navy-700/30 px-6 py-2">
            <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                <span className="font-medium text-cyan">
                    Analyzing move {progress.currentMove}/{progress.totalMoves}
                </span>
                <span className="font-mono">
                    Depth {progress.depth} • {formatNodes(progress.nodes)} nodes
                </span>
            </div>
            <div className="w-full h-1.5 bg-navy-800 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-cyan rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
}
