import { CalendarDays, HelpCircle, Target, Flame } from 'lucide-react';
import { useLearningProfile } from '@/hooks/useLearningProfile';

export interface LearningProfileCardProps {
  className?: string;
}

/**
 * LearningProfileCard displays 4 key statistics in a card layout:
 * 1. Total learning days
 * 2. Total questions answered
 * 3. Total accuracy percentage
 * 4. Maximum streak ever achieved
 */
export function LearningProfileCard({ className }: LearningProfileCardProps) {
  const profile = useLearningProfile();

  const stats = [
    {
      icon: CalendarDays,
      label: '总学习天数',
      value: profile.totalLearningDays,
      color: 'bg-blue-50 text-blue-500',
    },
    {
      icon: HelpCircle,
      label: '总答题数',
      value: profile.totalQuestions,
      color: 'bg-purple-50 text-purple-500',
    },
    {
      icon: Target,
      label: '总正确率',
      value: profile.totalAccuracy > 0 ? `${profile.totalAccuracy}%` : '0%',
      color: 'bg-green-50 text-green-500',
    },
    {
      icon: Flame,
      label: '最高连击',
      value: profile.maxStreakEver,
      color: 'bg-orange-50 text-orange-500',
    },
  ];

  return (
    <div
      className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className ?? ''}`}
      data-testid="learning-profile-card"
    >
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            data-testid={`stat-card-${index}`}
            className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${stat.color}`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-slate-500 truncate">{stat.label}</p>
                <p className="text-xl font-bold text-slate-800 mt-0.5">
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}