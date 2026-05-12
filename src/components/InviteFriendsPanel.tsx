import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Share2, Check, Gift, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useInviteMetrics } from '@/hooks/useInviteMetrics';

interface InviteFriendsPanelProps {
  onBack: () => void;
}

/**
 * InviteFriendsPanel component.
 * Displays the user's invite code and allows them to share it or claim rewards from friends.
 */
export function InviteFriendsPanel({ onBack }: InviteFriendsPanelProps) {
  const {
    inviteCode,
    invitesSent,
    invitesAccepted,
    rewardsEarned,
    rewardConfig,
    shareInviteCode,
    claimInvite,
  } = useInviteMetrics();

  const [friendCode, setFriendCode] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyCode = useCallback(async () => {
    if (!inviteCode) return;

    try {
      await navigator.clipboard.writeText(inviteCode);
      setIsCopied(true);
      toast.success('邀请码已复制到剪贴板');
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      toast.error('复制失败，请手动复制');
    }
  }, [inviteCode]);

  const handleShare = useCallback(async () => {
    if (!inviteCode) return;

    setIsSharing(true);
    try {
      // Share via Web Share API if available
      if (navigator.share) {
        await navigator.share({
          title: '邀请好友一起学英语',
          text: `我的 en-learn 邀请码是 ${inviteCode}，一起学习还能获得 XP 奖励！`,
          url: window.location.href,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(inviteCode);
        toast.success('邀请码已复制到剪贴板');
      }

      // Track the share
      await shareInviteCode();
      toast.success('分享成功！每有一位好友加入，你将获得奖励');
    } catch {
      // User cancelled share or error
      toast.error('分享失败');
    } finally {
      setIsSharing(false);
    }
  }, [inviteCode, shareInviteCode]);

  const handleClaimReward = useCallback(async () => {
    if (!friendCode.trim()) {
      toast.error('请输入好友的邀请码');
      return;
    }

    setIsClaiming(true);
    try {
      const result = await claimInvite(friendCode.trim());
      if (result.success) {
        toast.success(result.message);
        setFriendCode('');
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error('绑定失败，请稍后重试');
    } finally {
      setIsClaiming(false);
    }
  }, [friendCode, claimInvite]);

  return (
    <div className="max-w-4xl mx-auto px-3 md:px-4 py-4 md:py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack} className="text-slate-500" data-testid="invite-back-button">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-500" />
            <h1 className="text-xl font-bold text-slate-800">邀请好友</h1>
          </div>
        </div>
      </div>

      {/* Invite Code Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Gift className="w-5 h-5 text-blue-500" />
              我的邀请码
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Invite Code Display */}
            <div className="bg-white rounded-lg p-4 mb-4 text-center border border-blue-100">
              <p className="text-3xl font-mono font-bold text-blue-600 tracking-widest">
                {inviteCode || '加载中...'}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2"
                onClick={handleCopyCode}
                disabled={!inviteCode}
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {isCopied ? '已复制' : '复制'}
              </Button>
              <Button
                className="flex-1 gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
                onClick={handleShare}
                disabled={!inviteCode || isSharing}
              >
                <Share2 className="w-4 h-4" />
                {isSharing ? '分享中...' : '分享'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">邀请统计</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-800">{invitesSent}</p>
                <p className="text-xs text-slate-500 mt-1">已分享</p>
              </div>
              <div className="text-center p-3 bg-slate-50 rounded-lg">
                <p className="text-2xl font-bold text-slate-800">{invitesAccepted}</p>
                <p className="text-xs text-slate-500 mt-1">已绑定</p>
              </div>
              <div className="text-center p-3 bg-amber-50 rounded-lg">
                <p className="text-2xl font-bold text-amber-600">+{rewardsEarned}</p>
                <p className="text-xs text-slate-500 mt-1">获得 XP</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Reward Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <Card className="border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                <Gift className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">邀请奖励</p>
                <p className="text-sm text-slate-600">
                  每邀请一位好友加入，双方均可获得 <span className="font-bold text-amber-600">{rewardConfig.rewardXPPerInvite} XP</span> 奖励
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Claim Invite Code Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">绑定好友邀请码</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="friend-code">好友的邀请码</Label>
                <Input
                  id="friend-code"
                  placeholder="输入 8 位邀请码"
                  value={friendCode}
                  onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                  maxLength={8}
                  className="font-mono text-center text-lg tracking-widest"
                />
              </div>
              <Button
                className="w-full"
                onClick={handleClaimReward}
                disabled={friendCode.length !== 8 || isClaiming}
              >
                {isClaiming ? '绑定中...' : '绑定并领取奖励'}
              </Button>
              <p className="text-xs text-slate-500 text-center">
                输入好友的邀请码，双方都可获得 {rewardConfig.rewardXPPerInvite} XP 奖励
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

export default InviteFriendsPanel;
