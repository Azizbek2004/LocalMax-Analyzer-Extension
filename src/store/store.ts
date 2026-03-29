/**
 * Zustand Store — Application State
 * Manages game data, engine state, analysis results, and UI state.
 */

import { create } from 'zustand';
import type { MoveAnalysis, AnalysisProgress, EngineEvaluation } from '../lib/stockfishWorker';
import type { GameInsights, MoveInsight } from '../lib/agent';
import type { EngineConfig } from '../lib/engineConfig';
import { getDefaultConfig } from '../lib/engineConfig';

export type Tab = 'overview' | 'graph' | 'stats' | 'explorer' | 'coach';

interface GameState {
    pgn: string | null;
    sourceUrl: string | null;
    sourceSite: string | null;
    fens: string[];
    moves: string[];
    headers: Record<string, string>;
}

interface EngineState {
    isLoaded: boolean;
    isAnalyzing: boolean;
    progress: AnalysisProgress;
    config: EngineConfig;
    currentLines: EngineEvaluation[];
}

interface AnalysisState {
    moveAnalyses: MoveAnalysis[];
    insights: GameInsights | null;
    isComplete: boolean;
}

interface UIState {
    currentMoveIndex: number;
    activeTab: Tab;
    showOnboarding: boolean;
    showSettings: boolean;
    boardOrientation: 'white' | 'black';
}

interface AppStore {
    game: GameState;
    engine: EngineState;
    analysis: AnalysisState;
    ui: UIState;

    // Game actions
    setGame: (pgn: string, sourceUrl?: string, sourceSite?: string) => void;
    setFens: (fens: string[]) => void;
    setMoves: (moves: string[]) => void;
    setHeaders: (headers: Record<string, string>) => void;

    // Engine actions
    setEngineLoaded: (loaded: boolean) => void;
    setAnalyzing: (analyzing: boolean) => void;
    setProgress: (progress: Partial<AnalysisProgress>) => void;
    setEngineConfig: (config: Partial<EngineConfig>) => void;
    setCurrentLines: (lines: EngineEvaluation[]) => void;

    // Analysis actions
    addMoveAnalysis: (analysis: MoveAnalysis) => void;
    setInsights: (insights: GameInsights) => void;
    setAnalysisComplete: (complete: boolean) => void;
    resetAnalysis: () => void;

    // UI actions
    setCurrentMoveIndex: (index: number) => void;
    setActiveTab: (tab: Tab) => void;
    setShowOnboarding: (show: boolean) => void;
    setShowSettings: (show: boolean) => void;
    flipBoard: () => void;
    goToMove: (index: number) => void;
    nextMove: () => void;
    prevMove: () => void;
    firstMove: () => void;
    lastMove: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
    game: {
        pgn: null,
        sourceUrl: null,
        sourceSite: null,
        fens: [],
        moves: [],
        headers: {},
    },
    engine: {
        isLoaded: false,
        isAnalyzing: false,
        progress: { currentMove: 0, totalMoves: 0, depth: 0, nodes: 0, status: 'idle' },
        config: getDefaultConfig(),
        currentLines: [],
    },
    analysis: {
        moveAnalyses: [],
        insights: null,
        isComplete: false,
    },
    ui: {
        currentMoveIndex: 0,
        activeTab: 'overview',
        showOnboarding: false,
        showSettings: false,
        boardOrientation: 'white',
    },

    // ───── Game Actions ─────
    setGame: (pgn, sourceUrl, sourceSite) =>
        set(s => ({ game: { ...s.game, pgn, sourceUrl: sourceUrl ?? null, sourceSite: sourceSite ?? null } })),
    setFens: (fens) => set(s => ({ game: { ...s.game, fens } })),
    setMoves: (moves) => set(s => ({ game: { ...s.game, moves } })),
    setHeaders: (headers) => set(s => ({ game: { ...s.game, headers } })),

    // ───── Engine Actions ─────
    setEngineLoaded: (loaded) => set(s => ({ engine: { ...s.engine, isLoaded: loaded } })),
    setAnalyzing: (analyzing) => set(s => ({ engine: { ...s.engine, isAnalyzing: analyzing } })),
    setProgress: (progress) =>
        set(s => ({ engine: { ...s.engine, progress: { ...s.engine.progress, ...progress } } })),
    setEngineConfig: (config) =>
        set(s => ({ engine: { ...s.engine, config: { ...s.engine.config, ...config } } })),
    setCurrentLines: (lines) => set(s => ({ engine: { ...s.engine, currentLines: lines } })),

    // ───── Analysis Actions ─────
    addMoveAnalysis: (analysis) =>
        set(s => ({ analysis: { ...s.analysis, moveAnalyses: [...s.analysis.moveAnalyses, analysis] } })),
    setInsights: (insights) => set(s => ({ analysis: { ...s.analysis, insights } })),
    setAnalysisComplete: (complete) => set(s => ({ analysis: { ...s.analysis, isComplete: complete } })),
    resetAnalysis: () =>
        set({
            analysis: { moveAnalyses: [], insights: null, isComplete: false },
            engine: {
                ...get().engine,
                isAnalyzing: false,
                progress: { currentMove: 0, totalMoves: 0, depth: 0, nodes: 0, status: 'idle' },
            },
        }),

    // ───── UI Actions ─────
    setCurrentMoveIndex: (index) => set(s => ({ ui: { ...s.ui, currentMoveIndex: index } })),
    setActiveTab: (tab) => set(s => ({ ui: { ...s.ui, activeTab: tab } })),
    setShowOnboarding: (show) => set(s => ({ ui: { ...s.ui, showOnboarding: show } })),
    setShowSettings: (show) => set(s => ({ ui: { ...s.ui, showSettings: show } })),
    flipBoard: () =>
        set(s => ({ ui: { ...s.ui, boardOrientation: s.ui.boardOrientation === 'white' ? 'black' : 'white' } })),

    goToMove: (index) => {
        const fens = get().game.fens;
        const clamped = Math.max(0, Math.min(index, fens.length - 1));
        set(s => ({ ui: { ...s.ui, currentMoveIndex: clamped } }));
    },
    nextMove: () => {
        const { currentMoveIndex } = get().ui;
        const maxIndex = get().game.fens.length - 1;
        if (currentMoveIndex < maxIndex) {
            set(s => ({ ui: { ...s.ui, currentMoveIndex: currentMoveIndex + 1 } }));
        }
    },
    prevMove: () => {
        const { currentMoveIndex } = get().ui;
        if (currentMoveIndex > 0) {
            set(s => ({ ui: { ...s.ui, currentMoveIndex: currentMoveIndex - 1 } }));
        }
    },
    firstMove: () => set(s => ({ ui: { ...s.ui, currentMoveIndex: 0 } })),
    lastMove: () => {
        const maxIndex = get().game.fens.length - 1;
        set(s => ({ ui: { ...s.ui, currentMoveIndex: Math.max(0, maxIndex) } }));
    },
}));
