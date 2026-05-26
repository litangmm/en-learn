import { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Response type for intervention effectiveness.
 */
export type ResponseType = 'accepted' | 'dismissed' | 'snoozed';

/**
 * Data for a single response type.
 */
export interface EffectivenessData {
  /** Count of accepted responses */
  accepted: number;
  /** Count of dismissed responses */
  dismissed: number;
  /** Count of snoozed responses */
  snoozed: number;
}

/**
 * Configuration for each response type.
 */
const RESPONSE_CONFIG: Record<ResponseType, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  accepted: {
    label: '接受',
    color: '#22c55e', // green-500
    bgColor: 'bg-green-500',
  },
  dismissed: {
    label: '忽略',
    color: '#f97316', // orange-500
    bgColor: 'bg-orange-500',
  },
  snoozed: {
    label: '稍后',
    color: '#3b82f6', // blue-500
    bgColor: 'bg-blue-500',
  },
};

/**
 * Props for the InterventionEffectiveness component.
 */
export interface InterventionEffectivenessProps {
  /** Effectiveness data to display */
  data: EffectivenessData;
  /** Animation delay in seconds. Defaults to 0. */
  delay?: number;
}

/**
 * Horizontal bar chart showing accept/dismiss/snooze response ratios.
 * Displays percentage labels with color-coded bars.
 */
export function InterventionEffectiveness({
  data,
  delay = 0,
}: InterventionEffectivenessProps) {
  const { accepted, dismissed, snoozed } = data;
  const total = accepted + dismissed + snoozed;

  // Calculate percentages
  const percentages = useMemo(() => ({
    accepted: total > 0 ? Math.round((accepted / total) * 100) : 0,
    dismissed: total > 0 ? Math.round((dismissed / total) * 100) : 0,
    snoozed: total > 0 ? Math.round((snoozed / total) * 100) : 0,
  }), [accepted, dismissed, snoozed, total]);

  // Bar width (percentage of container)
  const getBarWidth = (pct: number) => `${pct}%`;

  // Check if there's any data
  const hasData = total > 0;

  const responseTypes: ResponseType[] = ['accepted', 'dismissed', 'snoozed'];

  if (!hasData) {
    return (
      <motion.div
        className="flex flex-col items-center justify-center py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay }}
      >
        <p className="text-sm text-slate-400">暂无响应数据</p>
        <p className="text-xs text-slate-400 mt-1">用户响应数据将在这里显示</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="space-y-3"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      {/* Row for each response type */}
      {responseTypes.map((type) => {
        const config = RESPONSE_CONFIG[type];
        const value = type === 'accepted' ? accepted : type === 'dismissed' ? dismissed : snoozed;
        const percentage = percentages[type];

        return (
          <motion.div
            key={type}
            className="space-y-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.1 + responseTypes.indexOf(type) * 0.1 }}
          >
            {/* Label row */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                {/* Color dot */}
                <span
                  className={`w-2 h-2 rounded-full ${config.bgColor}`}
                />
                <span className="text-slate-600">{config.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-xs">{value} 次</span>
                <span
                  className="font-medium text-sm min-w-[3rem] text-right"
                  style={{ color: config.color }}
                >
                  {percentage}%
                </span>
              </div>
            </div>

            {/* Bar background */}
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              {/* Animated bar fill */}
              <motion.div
                className={`h-full rounded-full ${config.bgColor}`}
                initial={{ width: 0 }}
                animate={{ width: getBarWidth(percentage) }}
                transition={{
                  delay: delay + 0.2 + responseTypes.indexOf(type) * 0.1,
                  duration: 0.5,
                  ease: 'easeOut',
                }}
              />
            </div>
          </motion.div>
        );
      })}

      {/* Total row */}
      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>总响应数</span>
        <span className="font-medium text-slate-700">{total} 次</span>
      </div>
    </motion.div>
  );
}

export default InterventionEffectiveness;