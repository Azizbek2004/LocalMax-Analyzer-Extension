import { winProbability, formatEval } from '../../utils/helpers';

interface Props {
    evalCp: number;
}

export default function EvalBar({ evalCp }: Props) {
    const wp = winProbability(evalCp);
    const whitePercent = Math.max(2, Math.min(98, wp * 100));
    const isMate = Math.abs(evalCp) > 25000;

    return (
        <div className="flex flex-col items-center gap-2 w-8">
            {/* Eval value */}
            <div className="text-[10px] font-mono font-bold text-gray-400 whitespace-nowrap">
                {formatEval(evalCp)}
            </div>

            {/* Bar */}
            <div className="flex-1 w-6 rounded-full overflow-hidden bg-white relative border border-navy-700/50"
                style={{ minHeight: '400px' }}
            >
                {/* Black portion (top) */}
                <div
                    className="absolute top-0 left-0 right-0 bg-navy-900 transition-all duration-500 ease-out"
                    style={{ height: `${100 - whitePercent}%` }}
                />
                {/* White portion (bottom) */}
                <div
                    className="absolute bottom-0 left-0 right-0 bg-gray-100 transition-all duration-500 ease-out"
                    style={{ height: `${whitePercent}%` }}
                />
                {/* Center line */}
                <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan/40" />
                {/* Win % indicator */}
                <div
                    className="absolute left-1/2 -translate-x-1/2 text-[8px] font-bold transition-all duration-500"
                    style={{
                        top: `${100 - whitePercent}%`,
                        transform: 'translateX(-50%) translateY(-50%)',
                        color: whitePercent > 50 ? '#0A1428' : '#e2e8f0',
                    }}
                >
                    {Math.round(whitePercent)}
                </div>
            </div>

            {/* Win prob label */}
            <div className="text-[10px] text-gray-500 font-mono">
                W%
            </div>
        </div>
    );
}
