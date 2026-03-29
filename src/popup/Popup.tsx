import { useState } from 'react';
import { Microscope, ExternalLink, Clipboard, CheckCircle, ChevronRight, Zap, Shield, Wifi } from 'lucide-react';

export default function Popup() {
    const [pgnPasted, setPgnPasted] = useState(false);
    const [pgn, setPgn] = useState('');

    function openAnalyzer() {
        if (typeof chrome !== 'undefined' && chrome.tabs) {
            chrome.tabs.create({ url: chrome.runtime.getURL('analysis.html') });
        } else {
            window.open('/analysis.html', '_blank');
        }
    }

    function handlePasteAnalyze() {
        if (pgn.trim().length < 5) return;

        if (typeof chrome !== 'undefined' && chrome.storage?.session) {
            chrome.storage.session.set({
                analysisGame: pgn.trim(),
                sourceUrl: 'manual-paste',
                sourceSite: 'manual',
                timestamp: Date.now(),
            }, () => {
                openAnalyzer();
            });
        }
    }

    return (
        <div className="w-[360px] min-h-[480px] flex flex-col bg-navy-950">
            {/* Header */}
            <div className="p-5 text-center border-b border-navy-700/30">
                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-cyan/20 to-cyan/5 border border-cyan/30 flex items-center justify-center glow-cyan">
                    <Microscope className="w-7 h-7 text-cyan" />
                </div>
                <h1 className="text-xl font-bold">
                    <span className="text-gradient-cyan">LocalMax</span>{' '}
                    <span className="text-gray-300">Analyzer</span>
                </h1>
                <p className="text-xs text-gray-500 mt-1">100% offline chess analysis with AI coaching</p>
            </div>

            {/* Quick Actions */}
            <div className="p-4 space-y-2">
                <button
                    onClick={openAnalyzer}
                    className="w-full btn-primary flex items-center justify-center gap-2 py-3 text-base"
                >
                    <ExternalLink className="w-4 h-4" />
                    Open Analyzer
                </button>

                {/* PGN Paste */}
                <div className="glass-panel-sm p-3 mt-3">
                    <label className="text-xs text-gray-400 font-medium mb-2 block">Quick Analyze (paste PGN)</label>
                    <textarea
                        value={pgn}
                        onChange={e => { setPgn(e.target.value); setPgnPasted(false); }}
                        placeholder="Paste PGN here..."
                        className="w-full h-20 p-2 bg-navy-800/50 border border-navy-600/30 rounded-md
                       text-xs font-mono text-gray-300 placeholder:text-gray-700
                       focus:outline-none focus:border-cyan/30 resize-none"
                    />
                    <button
                        onClick={handlePasteAnalyze}
                        disabled={pgn.trim().length < 5}
                        className="w-full mt-2 btn-primary py-2 text-sm disabled:opacity-30 disabled:cursor-not-allowed
                       flex items-center justify-center gap-1.5"
                    >
                        <Zap className="w-3.5 h-3.5" />
                        Analyze
                    </button>
                </div>
            </div>

            {/* Features */}
            <div className="p-4 mt-auto border-t border-navy-700/30">
                <div className="space-y-2">
                    <Feature icon={Shield} text="100% offline — nothing leaves your device" />
                    <Feature icon={Zap} text="Unlimited depth — no premium required" />
                    <Feature icon={Wifi} text="Works on Chess.com & Lichess" />
                </div>
            </div>

            {/* Footer */}
            <div className="px-4 pb-3 text-center">
                <p className="text-[10px] text-gray-700">v1.0.0 • Powered by Stockfish WASM</p>
            </div>
        </div>
    );
}

function Feature({ icon: Icon, text }: { icon: typeof Shield; text: string }) {
    return (
        <div className="flex items-center gap-2 text-xs text-gray-500">
            <Icon className="w-3.5 h-3.5 text-cyan/60 shrink-0" />
            <span>{text}</span>
        </div>
    );
}
