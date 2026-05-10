import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2 } from 'lucide-react';
import type { SharePrompt } from '@/App';
import { ShareDialog } from '@/components/ShareDialog';
import type { SessionResult } from '@/hooks/useShareCardData';

interface SharePromptToastProps {
  prompt: SharePrompt | null;
  onDismiss: () => void;
}

function LevelUpContent({ level, onShare }: { level: number; onShare: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <p className="text-sm font-bold text-amber-700">🎉 升级到 Lv.{level}！</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShare();
        }}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-lg bg-amber-100 hover:bg-amber-200 active:bg-amber-300 transition-colors touch-manipulation"
        aria-label="分享"
      >
        <Share2 className="text-amber-600" size={18} />
      </button>
    </div>
  );
}

function BadgeContent({ onShare }: { onShare: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1">
        <p className="text-sm font-bold text-amber-700">🎉 获得新成就！</p>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onShare();
        }}
        className="flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-lg bg-amber-100 hover:bg-amber-200 active:bg-amber-300 transition-colors touch-manipulation"
        aria-label="分享"
      >
        <Share2 className="text-amber-600" size={18} />
      </button>
    </div>
  );
}

export function SharePromptToast({ prompt, onDismiss }: SharePromptToastProps) {
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    if (!prompt) return;

    const timer = setTimeout(() => {
      onDismiss();
    }, 1500);

    return () => clearTimeout(timer);
  }, [prompt, onDismiss]);

  const handleDismiss = () => {
    onDismiss();
  };

  if (!prompt) return null;

  return (
    <>
      <AnimatePresence>
        {prompt && (
          <motion.div
            key={`share-prompt-${prompt.type}-${prompt.level ?? prompt.badge?.id ?? 'unknown'}`}
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm px-4"
            onClick={handleDismiss}
            data-testid="share-prompt-toast"
          >
            <div className="relative bg-white rounded-xl shadow-lg p-4 cursor-pointer">
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-300 p-[2px]">
                <div className="w-full h-full bg-white rounded-[10px]" />
              </div>

              <div className="relative">
                {prompt.type === 'levelup' && prompt.level && (
                  <LevelUpContent level={prompt.level} onShare={() => setShowDialog(true)} />
                )}
                {prompt.type === 'badge' && (
                  <BadgeContent onShare={() => setShowDialog(true)} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ShareDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        sessionResult={getEmptySessionResult()}
      />
    </>
  );
}

function getEmptySessionResult(): SessionResult {
  return {
    score: 0,
    accuracy: 0,
    streak: 0,
  };
}