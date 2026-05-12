import { useCallback } from 'react';
import { toast } from 'sonner';
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
import { useShareExport } from '@/hooks/useShareExport';
import { useShareMetrics } from '@/hooks/useShareMetrics';
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
  /** Trigger type for share tracking */
  triggerType?: string;
}

/**
 * Dialog component that wraps ShareCard with share action buttons.
 * Allows users to view their session summary and share it.
 */
export function ShareDialog({
  open,
  onOpenChange,
  sessionResult,
  triggerType = 'result-modal',
}: ShareDialogProps) {
  // Aggregate data from various hooks for the share card
  const shareCardData = useShareCardData(sessionResult);

  // Hook for share export functionality
  const { setCardRef, downloadImage, copyText } = useShareExport();

  // Hook for share metrics tracking
  const { trackShare, getMetrics } = useShareMetrics();

  // Get current metrics for display
  const metrics = getMetrics();

  // Handler for generating and downloading share image
  const handleGenerateImage = useCallback(async () => {
    const success = await downloadImage(shareCardData);
    if (success) {
      toast.success('图片已保存');
      trackShare('image', triggerType);
    } else {
      toast.error('保存失败，请重试');
    }
  }, [downloadImage, shareCardData, trackShare, triggerType]);

  // Handler for copying share text to clipboard
  const handleCopyText = useCallback(async () => {
    const success = await copyText(shareCardData);
    if (success) {
      toast.success('文本已复制到剪贴板');
      trackShare('text', triggerType);
    } else {
      toast.error('复制失败，请重试');
    }
  }, [copyText, shareCardData, trackShare, triggerType]);

  // Format metrics for display
  const shareCountText = metrics.totalShareCount > 0
    ? `已分享 ${metrics.totalShareCount} 次`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>分享你的成绩</DialogTitle>
          <DialogDescription>
            查看你的学习成果并分享给朋友
          </DialogDescription>
        </DialogHeader>

        {/* Share card display with ref wrapper */}
        <div className="py-4" ref={setCardRef}>
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

        {/* Share metrics summary */}
        {shareCountText && (
          <div className="text-center text-sm text-muted-foreground pt-2">
            {shareCountText}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
