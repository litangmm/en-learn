import { motion, AnimatePresence } from 'framer-motion';

interface XPGainPopupProps {
  amount: number;
  multiplier: number;
  visible: boolean;
  triggerKey: number | string;
  position?: 'top' | 'center';
}

export function XPGainPopup({
  amount,
  multiplier,
  visible,
  triggerKey,
  position = 'top',
}: XPGainPopupProps) {
  const hasMultiplier = multiplier > 1.0;
  const textColor = hasMultiplier ? 'text-orange-500' : 'text-amber-500';
  const positionClasses =
    position === 'center'
      ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
      : 'top-4 left-1/2 -translate-x-1/2';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {visible && (
          <motion.div
            key={triggerKey}
            initial={{ y: 0, opacity: 1 }}
            animate={{ y: -40, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className={`absolute ${positionClasses} flex flex-col items-center gap-1`}
            data-testid="xp-gain-popup"
          >
            <span className={`text-2xl font-bold ${textColor}`}>+{amount} XP</span>
            {hasMultiplier && (
              <span className="text-sm font-medium text-orange-400 bg-orange-50 px-2 py-0.5 rounded-full">
                x{multiplier.toFixed(1)} 连击奖励
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
