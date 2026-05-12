import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useInviteMetrics } from '../useInviteMetrics';

// Simple localStorage mock that stores data in memory
// This follows the pattern used in useShareMetrics.test.ts
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

// Set up localStorage before tests
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('useInviteMetrics', () => {
  const INVITE_METRICS_KEY = 'en-learn-invite-metrics';

  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('Initial state', () => {
    it('initializes metrics on mount', () => {
      const { result } = renderHook(() => useInviteMetrics());

      // Should initialize with default values
      expect(result.current.invitesSent).toBe(0);
      expect(result.current.invitesAccepted).toBe(0);
      expect(result.current.rewardsEarned).toBe(0);
    });

    it('inviteCode is exposed correctly', () => {
      const { result } = renderHook(() => useInviteMetrics());

      // Should generate an 8-character code
      expect(result.current.inviteCode).not.toBeNull();
      expect(result.current.inviteCode!.length).toBe(8);
    });

    it('invitesSent defaults to 0', () => {
      const { result } = renderHook(() => useInviteMetrics());

      expect(result.current.invitesSent).toBe(0);
    });

    it('invitesAccepted defaults to 0', () => {
      const { result } = renderHook(() => useInviteMetrics());

      expect(result.current.invitesAccepted).toBe(0);
    });

    it('rewardsEarned defaults to 0', () => {
      const { result } = renderHook(() => useInviteMetrics());

      expect(result.current.rewardsEarned).toBe(0);
    });

    it('generates invite code on first mount if none exists', () => {
      const { result } = renderHook(() => useInviteMetrics());

      // Should generate an 8-character code
      expect(result.current.inviteCode).not.toBeNull();
      expect(result.current.inviteCode!.length).toBe(8);
      // Should be uppercase alphanumeric
      expect(result.current.inviteCode!).toMatch(/^[A-Z0-9]+$/);
    });
  });

  describe('shareInviteCode', () => {
    it('increments invitesSent and updates lastSharedAt', async () => {
      const { result } = renderHook(() => useInviteMetrics());
      const initialCode = result.current.inviteCode;

      await act(async () => {
        await result.current.shareInviteCode();
      });

      expect(result.current.invitesSent).toBe(1);
      expect(result.current.inviteCode).toBe(initialCode);

      // Check localStorage was updated
      const savedData = JSON.parse(localStorageMock.getItem(INVITE_METRICS_KEY)!);
      expect(savedData.invitesSent).toBe(1);
      expect(savedData.lastSharedAt).toBeDefined();
    });

    it('accumulates multiple shares', async () => {
      const { result } = renderHook(() => useInviteMetrics());

      await act(async () => {
        await result.current.shareInviteCode();
      });
      await act(async () => {
        await result.current.shareInviteCode();
      });
      await act(async () => {
        await result.current.shareInviteCode();
      });

      expect(result.current.invitesSent).toBe(3);
    });

    it('updates createdAt on first share', async () => {
      const { result } = renderHook(() => useInviteMetrics());

      // Before sharing
      const savedBefore = JSON.parse(localStorageMock.getItem(INVITE_METRICS_KEY)!);
      expect(savedBefore.createdAt).not.toBeNull();

      await act(async () => {
        await result.current.shareInviteCode();
      });

      // After sharing, createdAt should still be set
      const savedAfter = JSON.parse(localStorageMock.getItem(INVITE_METRICS_KEY)!);
      expect(savedAfter.createdAt).toBeDefined();
    });
  });

  describe('claimInvite', () => {
    it('validates 8-char format - rejects too short', async () => {
      const { result } = renderHook(() => useInviteMetrics());

      const claimResult = await act(async () => {
        return await result.current.claimInvite('ABC');
      });
      expect(claimResult.success).toBe(false);
      expect(claimResult.message).toBe('邀请码格式不正确，请输入 8 位邀请码');
    });

    it('validates 8-char format - rejects too long', async () => {
      const { result } = renderHook(() => useInviteMetrics());

      const claimResult = await act(async () => {
        return await result.current.claimInvite('ABCDEFGHIJK');
      });
      expect(claimResult.success).toBe(false);
      expect(claimResult.message).toBe('邀请码格式不正确，请输入 8 位邀请码');
    });

    it('validates 8-char format - rejects empty', async () => {
      const { result } = renderHook(() => useInviteMetrics());

      const claimResult = await act(async () => {
        return await result.current.claimInvite('');
      });
      expect(claimResult.success).toBe(false);
      expect(claimResult.message).toBe('邀请码格式不正确，请输入 8 位邀请码');
    });

    it('validates 8-char format - rejects whitespace only', async () => {
      const { result } = renderHook(() => useInviteMetrics());

      const claimResult = await act(async () => {
        return await result.current.claimInvite('   ');
      });
      expect(claimResult.success).toBe(false);
      expect(claimResult.message).toBe('邀请码格式不正确，请输入 8 位邀请码');
    });

    it('processes valid invite and awards XP', async () => {
      const { result } = renderHook(() => useInviteMetrics());

      // 8-character invite code
      const friendCode = 'FRIEND12';
      const claimResult = await act(async () => {
        return await result.current.claimInvite(friendCode);
      });

      expect(claimResult.success).toBe(true);
      expect(claimResult.rewardXP).toBe(50); // Default from DEFAULT_INVITE_CONFIG
      expect(claimResult.message).toContain('绑定成功');
      expect(claimResult.message).toContain('50'); // XP reward amount

      // Check state was updated
      expect(result.current.invitesAccepted).toBe(1);
      expect(result.current.rewardsEarned).toBe(50);
    });

    it('handles multiple claims', async () => {
      const { result } = renderHook(() => useInviteMetrics());

      // 8-character invite code
      const friendCode = 'CLAIM123';

      // First claim
      await act(async () => {
        await result.current.claimInvite(friendCode);
      });
      expect(result.current.invitesAccepted).toBe(1);
      expect(result.current.rewardsEarned).toBe(50);

      // Second claim (simulating a second friend)
      await act(async () => {
        await result.current.claimInvite(friendCode);
      });
      expect(result.current.invitesAccepted).toBe(2);
    });

    it('normalizes code to uppercase', async () => {
      const { result } = renderHook(() => useInviteMetrics());

      const claimResult = await act(async () => {
        return await result.current.claimInvite('friend12');
      });

      expect(claimResult.success).toBe(true);
    });

    it('trims whitespace from code', async () => {
      const { result } = renderHook(() => useInviteMetrics());

      // Code with 8 meaningful chars + whitespace padding
      const claimResult = await act(async () => {
        return await result.current.claimInvite('  FRIEND12  ');
      });

      expect(claimResult.success).toBe(true);
    });
  });

  describe('rewardConfig', () => {
    it('exposes default reward config', () => {
      const { result } = renderHook(() => useInviteMetrics());

      expect(result.current.rewardConfig.rewardXPPerInvite).toBe(50);
      expect(result.current.rewardConfig.maxInvitesAllowed).toBe(0);
    });
  });

  describe('data persistence', () => {
    it('survives re-render', async () => {
      const { result } = renderHook(() => useInviteMetrics());

      await act(async () => {
        await result.current.shareInviteCode();
      });

      // Create new hook instance (simulating re-render)
      const { result: result2 } = renderHook(() => useInviteMetrics());

      expect(result2.current.invitesSent).toBe(1);
    });
  });
});
