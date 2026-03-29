import { useAppStore, type Tab } from '../../store/store';
import { BarChart3, TrendingUp, Target, Compass, MessageSquare } from 'lucide-react';
import { cn } from '../../utils/helpers';

const tabs: { id: Tab; label: string; icon: typeof BarChart3 }[] = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'graph', label: 'Graph', icon: TrendingUp },
    { id: 'stats', label: 'Stats', icon: Target },
    { id: 'explorer', label: 'Explorer', icon: Compass },
    { id: 'coach', label: 'AI Coach', icon: MessageSquare },
];

export default function TabBar() {
    const activeTab = useAppStore(s => s.ui.activeTab);
    const setActiveTab = useAppStore(s => s.setActiveTab);

    return (
        <div className="flex border-b border-navy-700/50">
            {tabs.map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            'flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-all duration-200 border-b-2',
                            isActive
                                ? 'text-cyan border-cyan'
                                : 'text-gray-500 border-transparent hover:text-gray-300 hover:border-navy-600'
                        )}
                    >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                );
            })}
        </div>
    );
}
