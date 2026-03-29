import { useAppStore } from '../../store/store';
import { getDefaultConfig, validateConfig } from '../../lib/engineConfig';
import { X, Cpu, Palette, Volume2 } from 'lucide-react';
import { useState } from 'react';

export default function SettingsPanel() {
    const config = useAppStore(s => s.engine.config);
    const setEngineConfig = useAppStore(s => s.setEngineConfig);
    const setShowSettings = useAppStore(s => s.setShowSettings);

    const [threads, setThreads] = useState(config.threads);
    const [hash, setHash] = useState(config.hash);
    const [depth, setDepth] = useState(config.depth);
    const [multiPV, setMultiPV] = useState(config.multiPV);
    const [moveTime, setMoveTime] = useState(config.moveTime);

    const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;

    function handleSave() {
        const validated = validateConfig({ threads, hash, depth, multiPV, moveTime });
        setEngineConfig(validated);
        setShowSettings(false);
    }

    function handleReset() {
        const defaults = getDefaultConfig();
        setThreads(defaults.threads);
        setHash(defaults.hash);
        setDepth(defaults.depth);
        setMultiPV(defaults.multiPV);
        setMoveTime(defaults.moveTime);
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="glass-panel max-w-lg w-full mx-4 glow-cyan animate-slide-up">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-navy-700/50">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Cpu className="w-5 h-5 text-cyan" />
                        Settings
                    </h2>
                    <button onClick={() => setShowSettings(false)} className="btn-ghost p-1.5">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 space-y-5">
                    {/* Engine Settings */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
                            <Cpu className="w-4 h-4 text-cyan" /> Engine Configuration
                        </h3>

                        <div className="space-y-4">
                            {/* Threads */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <label className="text-gray-400">Threads</label>
                                    <span className="text-cyan font-mono">{threads}</span>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={Math.max(1, cores - 1)}
                                    value={threads}
                                    onChange={e => setThreads(Number(e.target.value))}
                                    className="w-full accent-cyan"
                                />
                                <p className="text-[10px] text-gray-600 mt-0.5">
                                    {cores} cores detected • Recommended: {Math.min(6, cores - 2)}
                                </p>
                            </div>

                            {/* Hash */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <label className="text-gray-400">Hash (MB)</label>
                                    <span className="text-cyan font-mono">{hash}</span>
                                </div>
                                <input
                                    type="range"
                                    min={16}
                                    max={2048}
                                    step={16}
                                    value={hash}
                                    onChange={e => setHash(Number(e.target.value))}
                                    className="w-full accent-cyan"
                                />
                            </div>

                            {/* Move Time */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <label className="text-gray-400">Time per Position</label>
                                    <span className="text-cyan font-mono">{moveTime < 1000 ? `${moveTime}ms` : `${(moveTime / 1000).toFixed(1)}s`}</span>
                                </div>
                                <input
                                    type="range"
                                    min={200}
                                    max={5000}
                                    step={100}
                                    value={moveTime}
                                    onChange={e => setMoveTime(Number(e.target.value))}
                                    className="w-full accent-cyan"
                                />
                                <p className="text-[10px] text-gray-600 mt-0.5">
                                    Lower = faster analysis • 800ms recommended
                                </p>
                            </div>

                            {/* Depth */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <label className="text-gray-400">Analysis Depth</label>
                                    <span className="text-cyan font-mono">{depth}</span>
                                </div>
                                <input
                                    type="range"
                                    min={10}
                                    max={50}
                                    value={depth}
                                    onChange={e => setDepth(Number(e.target.value))}
                                    className="w-full accent-cyan"
                                />
                                <p className="text-[10px] text-gray-600 mt-0.5">
                                    Higher = stronger but slower analysis
                                </p>
                            </div>

                            {/* Multi-PV */}
                            <div>
                                <div className="flex justify-between text-sm mb-1">
                                    <label className="text-gray-400">Engine Lines (Multi-PV)</label>
                                    <span className="text-cyan font-mono">{multiPV}</span>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={5}
                                    value={multiPV}
                                    onChange={e => setMultiPV(Number(e.target.value))}
                                    className="w-full accent-cyan"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className="glass-panel-sm p-3 text-xs text-gray-500">
                        <p>⚡ Analysis uses movetime-based search for fast results. Lower time = faster but shallower.</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-between p-4 border-t border-navy-700/50">
                    <button onClick={handleReset} className="btn-ghost">
                        Reset to Defaults
                    </button>
                    <div className="flex gap-2">
                        <button onClick={() => setShowSettings(false)} className="btn-ghost">Cancel</button>
                        <button onClick={handleSave} className="btn-primary">Save</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
