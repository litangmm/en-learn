import { Headphones, BookOpen, History, Database, Award, TrendingUp, BarChart3, AlertTriangle } from 'lucide-react';
import type { View } from './routing';

interface MobileNavProps {
  currentView: View;
  onNavigate: (view: View) => void;
  mistakeCount?: number;
  historyCount?: number;
  reviewDueCount?: number;
  weaknessCount?: number;
}

const NAV_ITEMS: { id: View; label: string; icon: typeof Headphones }[] = [
  { id: 'practice', label: '练习', icon: Headphones },
  { id: 'progress', label: '进度', icon: BarChart3 },
  { id: 'mistake-book', label: '错题', icon: BookOpen },
  { id: 'history', label: '记录', icon: History },
  { id: 'data', label: '数据', icon: Database },
  { id: 'badges', label: '成就', icon: Award },
  { id: 'leaderboard', label: '排行', icon: TrendingUp },
  { id: 'weakness', label: '薄弱', icon: AlertTriangle },
];

export function MobileNav({
  currentView,
  onNavigate,
  mistakeCount = 0,
  historyCount = 0,
  reviewDueCount = 0,
  weaknessCount = 0,
}: MobileNavProps) {
  const getBadge = (id: View) => {
    if (id === 'mistake-book' && mistakeCount > 0) {
      return (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
          {mistakeCount > 99 ? '99+' : mistakeCount}
        </span>
      );
    }
    if (id === 'history' && historyCount > 0) {
      return (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-slate-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
          {historyCount > 99 ? '99+' : historyCount}
        </span>
      );
    }
    if (id === 'review' && reviewDueCount > 0) {
      return (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
          {reviewDueCount > 99 ? '99+' : reviewDueCount}
        </span>
      );
    }
    if (id === 'weakness' && weaknessCount > 0) {
      return (
        <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-red-500 text-white text-[10px] font-medium rounded-full flex items-center justify-center">
          {weaknessCount > 99 ? '99+' : weaknessCount}
        </span>
      );
    }
    return null;
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      data-testid="mobile-nav"
    >
      <div className="flex items-center justify-around h-14">
        {NAV_ITEMS.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors duration-200 ${
                isActive
                  ? 'text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              data-testid={`mobile-nav-${item.id}`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {getBadge(item.id)}
              </div>
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
