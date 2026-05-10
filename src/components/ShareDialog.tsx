import { useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useShareCardData, type SessionResult } from '@/hooks/useShareCardData';
import { ShareCard } from './ShareCard';

/**
 * Props for the ShareDialog component.
 */
export interface ShareDialogProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Handler for dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Optional session result data to display */
  sessionResult?: SessionResult;
}

/**
 * Dialog component that wraps ShareCard with share action buttons.
 * Allows users to view their session summary and share it.
 */
export function ShareDialog({
  open,
  onOpenChange,
  sessionResult,
}: ShareDialogProps) {
  // Aggregate data from various hooks for the share card
  const shareCardData = useShareCardData(sessionResult);

  // Placeholder handler for generating share image
  // TODO (iter-002): Implement actual image export functionality
  const handleGenerateImage = useCallback(() => {
    alert('图片分享功能将在 iter-002 中实现');
  }, []);

  // Placeholder handler for copying share text
  // TODO (iter-002): Implement actual text copy functionality
  const handleCopyText = useCallback(() => {
    alert('文本复制功能将在 iter-002 中实现');
  }, []);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>分享你的成绩</DialogTitle>
          <DialogDescription>
            查看你的学习成果并分享给朋友
          </DialogDescription>
        </DialogHeader>

        {/* Share card display */}
        <div className="py-4">
          <ShareCard data={shareCardData} />
        </div>

        {/* Share action buttons */}
        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            onClick={handleCopyText}
            className="flex-1"
          >
            复制文本
          </Button>
          <Button
            onClick={handleGenerateImage}
            className="flex-1"
          >
            生成分享图片
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
