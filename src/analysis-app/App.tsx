import { useEffect, useCallback } from 'react';
import { useAppStore } from '../store/store';
import { parsePGN } from '../lib/chessLogic';
import { useEngine } from './hooks/useEngine';
import Board from './components/Board';
import EvalBar from './components/EvalBar';
import MoveList from './components/MoveList';
import EngineLines from './components/EngineLines';
import WinProbGraph from './components/WinProbGraph';
import StatsPanel from './components/StatsPanel';
import AgentCommentary from './components/AgentCommentary';
import SettingsPanel from './components/SettingsPanel';
import ProgressBar from './components/ProgressBar';
import Header from './components/Header';
import TabBar from './components/TabBar';
import PgnInput from './components/PgnInput';
import { Microscope, Play, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function App() {
    const game = useAppStore(s => s.game);
    const ui = useAppStore(s => s.ui);
    const engine = useAppStore(s => s.engine);
    const analysis = useAppStore(s => s.analysis);
    const setGame = useAppStore(s => s.setGame);
    const setFens = useAppStore(s => s.setFens);
    const setMoves = useAppStore(s => s.setMoves);
    const setHeaders = useAppStore(s => s.setHeaders);
    const nextMove = useAppStore(s => s.nextMove);
    const prevMove = useAppStore(s => s.prevMove);
    const firstMove = useAppStore(s => s.firstMove);
    const lastMove = useAppStore(s => s.lastMove);

    // Engine lifecycle
    const { engineStatus, engineError, analyzeFullGame } = useEngine();

    // Load game from session storage on mount
    useEffect(() => {
        async function loadGame() {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage?.session) {
                    chrome.storage.session.get(['analysisGame', 'sourceUrl', 'sourceSite'], (data: any) => {
                        if (data.analysisGame) {
                            handleLoadPGN(data.analysisGame, data.sourceUrl, data.sourceSite);
                        }
                    });
                }
            } catch (e) {
                console.log('[LocalMax] Not in extension context, using manual PGN input');
            }
        }
        loadGame();
    }, []);

    // Keyboard shortcuts
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

        switch (e.key) {
            case 'ArrowRight': nextMove(); break;
            case 'ArrowLeft': prevMove(); break;
            case 'Home': firstMove(); break;
            case 'End': lastMove(); break;
        }
    }, [nextMove, prevMove, firstMove, lastMove]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    function handleLoadPGN(pgn: string, sourceUrl?: string, sourceSite?: string) {
        try {
            const parsed = parsePGN(pgn);
            setGame(pgn, sourceUrl, sourceSite);
            setFens(parsed.fens);
            setMoves(parsed.moves);
            setHeaders(parsed.headers);
        } catch (e) {
            console.error('[LocalMax] Failed to parse PGN:', e);
        }
    }

    const currentEval = analysis.moveAnalyses[ui.currentMoveIndex - 1]?.evalAfter ?? 0;

    // If no game loaded, show PGN input
    if (!game.pgn) {
        return (
            <div className="min-h-screen bg-navy-950 flex flex-col">
                <Header />
                <div className="flex-1 flex items-center justify-center p-8">
                    <div className="glass-panel p-8 max-w-2xl w-full animate-fade-in">
                        <div className="flex items-center gap-3 mb-6">
                            <Microscope className="w-8 h-8 text-cyan" />
                            <div>
                                <h2 className="text-2xl font-bold text-white">Load a Game</h2>
                                <p className="text-gray-400 text-sm">Paste a PGN or use the extension on Chess.com / Lichess</p>
                            </div>
                        </div>

                        {/* Engine Status */}
                        <div className="mb-4 glass-panel-sm p-3 flex items-center gap-2">
                            {engineStatus === 'loading' && (
                                <>
                                    <Loader2 className="w-4 h-4 text-cyan animate-spin" />
                                    <span className="text-sm text-gray-400">Loading Stockfish engine…</span>
                                </>
                            )}
                            {engineStatus === 'ready' && (
                                <>
                                    <CheckCircle className="w-4 h-4 text-eval-good" />
                                    <span className="text-sm text-eval-good">Stockfish 18 ready</span>
                                </>
                            )}
                            {engineStatus === 'error' && (
                                <>
                                    <AlertCircle className="w-4 h-4 text-eval-blunder" />
                                    <span className="text-sm text-eval-blunder">Engine error: {engineError}</span>
                                </>
                            )}
                            {engineStatus === 'idle' && (
                                <span className="text-sm text-gray-600">Engine not initialized</span>
                            )}
                        </div>

                        <PgnInput onLoad={handleLoadPGN} />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-navy-950 flex flex-col">
            <Header />

            {/* Engine status + Analyze button bar */}
            <div className="bg-navy-900/60 border-b border-navy-700/30 px-6 py-2 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {engineStatus === 'loading' && (
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Loader2 className="w-4 h-4 animate-spin text-cyan" />
                            Loading Stockfish…
                        </div>
                    )}
                    {engineStatus === 'ready' && !engine.isAnalyzing && !analysis.isComplete && (
                        <div className="flex items-center gap-2 text-sm text-eval-good">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Engine ready
                        </div>
                    )}
                    {engineStatus === 'error' && (
                        <div className="flex items-center gap-2 text-sm text-eval-blunder">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {engineError}
                        </div>
                    )}
                    {analysis.isComplete && (
                        <div className="flex items-center gap-2 text-sm text-eval-good">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Analysis complete — {analysis.moveAnalyses.length} moves analyzed
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {engineStatus === 'ready' && !engine.isAnalyzing && !analysis.isComplete && (
                        <button
                            onClick={analyzeFullGame}
                            className="btn-primary flex items-center gap-2 animate-pulse-cyan"
                        >
                            <Play className="w-4 h-4" />
                            Analyze Game
                        </button>
                    )}
                    {engine.isAnalyzing && (
                        <span className="text-sm text-cyan font-mono">
                            Move {engine.progress.currentMove}/{engine.progress.totalMoves} • Depth {engine.progress.depth}
                        </span>
                    )}
                </div>
            </div>

            {engine.isAnalyzing && <ProgressBar progress={engine.progress} />}

            <div className="flex-1 flex gap-4 p-4 max-w-[1800px] mx-auto w-full">
                {/* Left Panel — Board + Eval */}
                <div className="flex gap-2 shrink-0">
                    <EvalBar evalCp={currentEval} />
                    <div className="flex flex-col gap-3">
                        <Board />
                        {/* Navigation Controls */}
                        <div className="glass-panel-sm p-2 flex justify-center gap-2">
                            <button onClick={firstMove} className="btn-ghost px-3" title="First move (Home)">⏮</button>
                            <button onClick={prevMove} className="btn-ghost px-3" title="Previous move (←)">◀</button>
                            <span className="text-sm text-gray-400 flex items-center px-2 font-mono">
                                {ui.currentMoveIndex} / {game.fens.length - 1}
                            </span>
                            <button onClick={nextMove} className="btn-ghost px-3" title="Next move (→)">▶</button>
                            <button onClick={lastMove} className="btn-ghost px-3" title="Last move (End)">⏭</button>
                        </div>
                    </div>
                </div>

                {/* Right Panel — Analysis */}
                <div className="flex-1 flex flex-col gap-3 min-w-0">
                    {/* Move List + Engine Lines */}
                    <div className="flex gap-3 flex-1 min-h-0">
                        <MoveList />
                        <div className="flex-1 flex flex-col gap-3 min-w-0">
                            <EngineLines />

                            {/* Tab Content */}
                            <TabBar />
                            <div className="flex-1 glass-panel p-4 overflow-auto animate-fade-in">
                                {ui.activeTab === 'overview' && (
                                    <StatsPanel />
                                )}
                                {ui.activeTab === 'graph' && (
                                    <WinProbGraph />
                                )}
                                {ui.activeTab === 'stats' && (
                                    <StatsPanel />
                                )}
                                {ui.activeTab === 'coach' && (
                                    <AgentCommentary />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {ui.showSettings && <SettingsPanel />}
        </div>
    );
}
