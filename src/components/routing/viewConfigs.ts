import type { ViewConfig } from './index';

/**
 * View configurations for the application routing system.
 * This is the single source of truth for all view definitions.
 */
export const VIEW_CONFIGS: ViewConfig[] = [
  { id: 'practice', title: '练习', icon: 'practice', metadata: { primary: true } },
  { id: 'progress', title: '学习进度', icon: 'progress' },
  { id: 'profile', title: '个人资料', icon: 'profile' },
  { id: 'efficiency', title: '学习效率', icon: 'efficiency' },
  { id: 'mistake-book', title: '错题本', icon: 'mistake-book' },
  { id: 'history', title: '练习历史', icon: 'history' },
  { id: 'data', title: '数据管理', icon: 'data' },
  { id: 'review', title: '智能复习', icon: 'review' },
  { id: 'weakness', title: '弱点分析', icon: 'weakness' },
  { id: 'challenges', title: '每日挑战', icon: 'challenges' },
  { id: 'badges', title: '成就徽章', icon: 'badges' },
  { id: 'leaderboard', title: '排行榜', icon: 'leaderboard' },
  { id: 'invite', title: '邀请好友', icon: 'invite' },
  { id: 'dictionary-browser', title: '词典浏览', icon: 'dictionary' },
  { id: 'goals', title: '目标设置', icon: 'goals' },
  { id: 'churn-dashboard', title: '流失预警', icon: 'churn' },
  { id: 'learn-insight', title: '学习洞察', icon: 'insight' },
  { id: 'learn-insight-dashboard', title: '学习仪表盘', icon: 'dashboard' },
  { id: 'learning-report', title: '学习报告', icon: 'report' },
];