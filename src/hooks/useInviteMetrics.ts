import { useState, useCallback } from 'react';
import { storage } from '@/services/storage';
import type { InviteMetrics, InviteConfig } from '@/data/types';

export interface UseInviteMetricsReturn {
  /** The user's invite code */
  inviteCode: string | null;
  /** Number of invite codes shared/sent */
  invitesSent: number;
  /** Number of invites that were accepted by friends */
  invitesAccepted: number;
  /** Total XP rewards earned from accepted invites */
  rewardsEarned: number;
  /** Current reward configuration */
  rewardConfig: InviteConfig;
  /** Share the invite code (generates new code if needed, updates lastSharedAt) */
  shareInviteCode: () => Promise<string>;
  /** Claim an invite from a friend */
  claimInvite: (friendCode: string) => Promise<{ success: boolean; message: string; rewardXP?: number }>;
}

/**
 * Hook for managing invite metrics and rewards.
 * Provides methods to track invite code usage and claim rewards from friends.
 */
export function useInviteMetrics(): UseInviteMetricsReturn {
  const [metrics, setMetrics] = useState<InviteMetrics>(() => {
    // Initialize on first render (lazy initialization)
    return storage.initInviteMetrics();
  });
  const [rewardConfig] = useState<InviteConfig>(() => storage.getInviteConfig());

  /**
   * Share the invite code - generates new code if needed, updates lastSharedAt
   */
  const shareInviteCode = useCallback(async (): Promise<string> => {
    const currentMetrics = storage.getInviteMetrics();
    const now = Date.now();

    // Generate new code if none exists, or update lastSharedAt
    let newCode = currentMetrics.inviteCode;
    if (!newCode) {
      newCode = storage.generateInviteCode();
    }

    const updated = storage.updateInviteMetrics((prev) => ({
      inviteCode: newCode,
      invitesSent: prev.invitesSent + 1,
      lastSharedAt: now,
      createdAt: prev.createdAt ?? now,
    }));

    setMetrics(updated);
    return newCode;
  }, []);

  /**
   * Claim an invite from a friend.
   * Validates the code and processes the reward if valid.
   */
  const claimInvite = useCallback(async (
    friendCode: string
  ): Promise<{ success: boolean; message: string; rewardXP?: number }> => {
    // Normalize the code (uppercase, trim)
    const normalizedCode = friendCode.trim().toUpperCase();

    // Validate code format
    if (!normalizedCode || normalizedCode.length !== 8) {
      return { success: false, message: '邀请码格式不正确，请输入 8 位邀请码' };
    }

    // Check if it's the user's own code
    const currentMetrics = storage.getInviteMetrics();
    if (normalizedCode === currentMetrics.inviteCode) {
      return { success: false, message: '不能填写自己的邀请码' };
    }

    // Get reward config
    const config = storage.getInviteConfig();

    // In a real app, this would validate against a server
    // For now, we simulate successful claim
    // TODO: Implement server-side validation for production
    const rewardXP = config.rewardXPPerInvite;

    // Update metrics - increment accepted count and rewards
    const updated = storage.updateInviteMetrics((prev) => ({
      invitesAccepted: prev.invitesAccepted + 1,
      rewardsEarned: prev.rewardsEarned + rewardXP,
    }));

    setMetrics(updated);

    return {
      success: true,
      message: `绑定成功！获得 ${rewardXP} XP 奖励`,
      rewardXP,
    };
  }, []);

  return {
    inviteCode: metrics.inviteCode,
    invitesSent: metrics.invitesSent,
    invitesAccepted: metrics.invitesAccepted,
    rewardsEarned: metrics.rewardsEarned,
    rewardConfig,
    shareInviteCode,
    claimInvite,
  };
}

export default useInviteMetrics;
