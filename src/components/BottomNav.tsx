import { LayoutDashboard, Map, Heart, Zap } from 'lucide-react';
import type { TabId } from '@/types/mentoring';

const tabs: { id: TabId; icon: typeof LayoutDashboard; label: string }[] = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'главная' },
  { id: 'roadmaps', icon: Map, label: 'карты' },
  { id: 'tracking', icon: Heart, label: 'трекинг' },
  { id: 'protocols', icon: Zap, label: 'протоколы' },
];

interface BottomNavProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      <div className="max-w-md mx-auto px-4 pb-4">
        <div className="glass-strong card-round flex items-center justify-around p-2">
          {tabs.map((item) => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`flex flex-col items-center justify-center p-3 rounded-3xl transition-all duration-300 min-w-0 flex-1 ${
                activeTab === item.id
                  ? 'bg-primary text-primary-foreground shadow-xl shadow-lime-glow scale-105'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {item.id === 'tracking' ? (
                <Heart size={20} fill={activeTab === item.id ? 'currentColor' : 'none'} />
              ) : (
                <item.icon size={20} />
              )}
              <span className="text-[9px] font-bold uppercase tracking-wider mt-1">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default BottomNav;
