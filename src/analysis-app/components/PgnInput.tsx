import { useState } from 'react';
import { Upload, ClipboardPaste } from 'lucide-react';

interface Props {
    onLoad: (pgn: string) => void;
}

// Sample game for demo purposes
const SAMPLE_PGN = `[Event "Casual Game"]
[Site "LocalMax Demo"]
[Date "2026.03.07"]
[White "Magnus"]
[Black "Hikaru"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 6. Re1 b5 7. Bb3 d6
8. c3 O-O 9. h3 Nb8 10. d4 Nbd7 11. Nbd2 Bb7 12. Bc2 Re8 13. Nf1 Bf8
14. Ng3 g6 15. a4 c5 16. d5 c4 17. Bg5 Nc5 18. Qd2 h6 19. Be3 Ncd7
20. Qd1 Bg7 21. b4 cxb3 22. Bxb3 Nc5 23. Bc2 Qc7 24. Bd2 a5 25. Rc1 Qd7
26. Nh2 Qe7 27. f3 Nfd7 28. Nf1 f5 29. Ne3 Nf6 30. Kh1 Kh7 31. Rf1 Rf8
32. f4 exf4 33. Bxf4 fxe4 34. Nxe4 Ncxe4 35. Bxe4 Nxe4 36. Rxf8 Rxf8
37. Qg4 Qf6 38. Rf1 Qe5 39. Rxf8 Bxf8 40. Qe2 Nd2 41. Qf2 Nf3 1-0`;

export default function PgnInput({ onLoad }: Props) {
    const [pgn, setPgn] = useState('');
    const [error, setError] = useState('');

    function handleSubmit() {
        const text = pgn.trim();
        if (text.length < 5) {
            setError('Please paste a valid PGN');
            return;
        }
        setError('');
        onLoad(text);
    }

    function handlePaste() {
        navigator.clipboard.readText().then(text => {
            setPgn(text);
        }).catch(() => {
            setError('Failed to read clipboard. Please paste manually.');
        });
    }

    function loadSample() {
        onLoad(SAMPLE_PGN);
    }

    return (
        <div className="space-y-4">
            <div className="relative">
                <textarea
                    value={pgn}
                    onChange={(e) => { setPgn(e.target.value); setError(''); }}
                    placeholder={'Paste your PGN here...\n\nExample:\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6...'}
                    className="w-full h-48 p-4 bg-navy-800/50 border border-navy-600/50 rounded-lg
                     text-sm font-mono text-gray-300 placeholder:text-gray-700
                     focus:outline-none focus:border-cyan/40 focus:ring-1 focus:ring-cyan/20
                     resize-none transition-colors"
                />
                <button
                    onClick={handlePaste}
                    className="absolute top-3 right-3 p-1.5 rounded-md bg-navy-700/50 hover:bg-navy-600/50
                     text-gray-500 hover:text-gray-300 transition-colors"
                    title="Paste from clipboard"
                >
                    <ClipboardPaste className="w-4 h-4" />
                </button>
            </div>

            {error && (
                <p className="text-xs text-eval-blunder">{error}</p>
            )}

            <div className="flex gap-3">
                <button onClick={handleSubmit} className="btn-primary flex items-center gap-2 flex-1 justify-center">
                    <Upload className="w-4 h-4" />
                    Analyze Game
                </button>
                <button onClick={loadSample} className="btn-ghost border border-navy-600/50 px-4">
                    Load Sample
                </button>
            </div>

            <p className="text-xs text-gray-600 text-center">
                Or use the 🔬 button on Chess.com / Lichess to auto-import
            </p>
        </div>
    );
}
