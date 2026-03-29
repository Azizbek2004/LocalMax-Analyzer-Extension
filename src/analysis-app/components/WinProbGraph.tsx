import { useAppStore } from '../../store/store';
import { winProbability } from '../../utils/helpers';
import {
    AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid,
} from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function WinProbGraph() {
    const moveAnalyses = useAppStore(s => s.analysis.moveAnalyses);
    const currentIndex = useAppStore(s => s.ui.currentMoveIndex);
    const goToMove = useAppStore(s => s.goToMove);
    const insights = useAppStore(s => s.analysis.insights);

    if (moveAnalyses.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-600">
                <div className="text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">Run analysis to see the win probability curve</p>
                </div>
            </div>
        );
    }

    const data = moveAnalyses.map((ma, i) => ({
        moveIndex: i + 1,
        moveLabel: `${Math.floor(i / 2) + 1}${i % 2 === 0 ? '.' : '…'}`,
        winProb: winProbability(ma.evalAfter) * 100,
        evalCp: ma.evalAfter,
        move: ma.move,
        isTurningPoint: insights?.turningPoints.includes(i) ?? false,
    }));

    return (
        <div className="h-full min-h-[200px]">
            <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-cyan" />
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Win Probability</h3>
            </div>

            <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <defs>
                        <linearGradient id="winProbGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00F5FF" stopOpacity={0.3} />
                            <stop offset="50%" stopColor="#00F5FF" stopOpacity={0.05} />
                            <stop offset="100%" stopColor="#FF4D4D" stopOpacity={0.3} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1A326420" />
                    <XAxis
                        dataKey="moveLabel"
                        tick={{ fill: '#4a5568', fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: '#1A3264' }}
                        interval={Math.max(1, Math.floor(data.length / 15))}
                    />
                    <YAxis
                        domain={[0, 100]}
                        tick={{ fill: '#4a5568', fontSize: 10 }}
                        tickLine={false}
                        axisLine={{ stroke: '#1A3264' }}
                        ticks={[0, 25, 50, 75, 100]}
                        width={32}
                    />
                    <Tooltip
                        contentStyle={{
                            background: '#0F1E3C',
                            border: '1px solid #1A3264',
                            borderRadius: '8px',
                            fontSize: '12px',
                            color: '#e2e8f0',
                        }}
                        formatter={(value: number) => [`${value.toFixed(1)}%`, 'White Win Prob']}
                        labelFormatter={(label) => `Move ${label}`}
                    />
                    <ReferenceLine y={50} stroke="#00F5FF20" strokeDasharray="3 3" />
                    {/* Current move indicator */}
                    {currentIndex > 0 && currentIndex <= data.length && (
                        <ReferenceLine x={data[currentIndex - 1]?.moveLabel} stroke="#00F5FF" strokeWidth={2} />
                    )}
                    <Area
                        type="monotone"
                        dataKey="winProb"
                        stroke="#00F5FF"
                        strokeWidth={2}
                        fill="url(#winProbGrad)"
                        dot={false}
                        activeDot={{
                            stroke: '#00F5FF',
                            strokeWidth: 2,
                            fill: '#0A1428',
                            r: 5,
                        }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
