import { useAppStore } from '../../store/store';
import { Microscope, Settings, RotateCcw, Download, FlipHorizontal } from 'lucide-react';

export default function Header() {
    const game = useAppStore(s => s.game);
    const flipBoard = useAppStore(s => s.flipBoard);
    const setShowSettings = useAppStore(s => s.setShowSettings);
    const showSettings = useAppStore(s => s.ui.showSettings);
    const resetAnalysis = useAppStore(s => s.resetAnalysis);

    const whiteName = game.headers?.White || 'White';
    const blackName = game.headers?.Black || 'Black';
    const result = game.headers?.Result || '';

    return (
        <header className="bg-navy-900/90 backdrop-blur-md border-b border-navy-700/50 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan/20 to-cyan/5 border border-cyan/30 flex items-center justify-center glow-cyan">
                    <Microscope className="w-5 h-5 text-cyan" />
                </div>
                <div>
                    <h1 className="text-lg font-bold tracking-tight">
                        <span className="text-gradient-cyan">LocalMax</span>{' '}
                        <span className="text-gray-300">Analyzer</span>
                    </h1>
                    {game.pgn && (
                        <p className="text-xs text-gray-500">
                            {whiteName} vs {blackName} {result && `• ${result}`}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2">
                {game.pgn && (
                    <>
                        <button onClick={flipBoard} className="btn-ghost flex items-center gap-1.5" title="Flip board">
                            <FlipHorizontal className="w-4 h-4" />
                            <span className="hidden sm:inline">Flip</span>
                        </button>
                        <button onClick={resetAnalysis} className="btn-ghost flex items-center gap-1.5" title="Reset analysis">
                            <RotateCcw className="w-4 h-4" />
                            <span className="hidden sm:inline">Reset</span>
                        </button>
                        <button className="btn-ghost flex items-center gap-1.5" title="Export PGN">
                            <Download className="w-4 h-4" />
                            <span className="hidden sm:inline">Export</span>
                        </button>
                    </>
                )}
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className="btn-ghost flex items-center gap-1.5"
                    title="Settings"
                >
                    <Settings className="w-4 h-4" />
                    <span className="hidden sm:inline">Settings</span>
                </button>
            </div>
        </header>
    );
}
