import { motion } from 'framer-motion';

interface ProgressBarProps {
  progress: number;
  current: number;
  total: number;
}

export function ProgressBar({ progress, current, total }: ProgressBarProps) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-slate-600">
          进度
        </span>
        <span className="text-sm text-slate-500">
          {current} / {total}
        </span>
      </div>
      <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-blue-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}
