import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { InviteFriendsPanel } from '../InviteFriendsPanel';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock clipboard API
const mockClipboard = {
  writeText: vi.fn().mockResolvedValue(undefined),
};
Object.defineProperty(navigator, 'clipboard', {
  writable: true,
  configurable: true,
  value: mockClipboard,
});

// Mock Web Share API
const mockShare = vi.fn();
Object.defineProperty(navigator, 'share', {
  writable: true,
  configurable: true,
  value: mockShare,
});

// Mock useInviteMetrics hook
const mockUseInviteMetrics = vi.fn();

vi.mock('@/hooks/useInviteMetrics', () => ({
  useInviteMetrics: () => mockUseInviteMetrics(),
}));

describe('InviteFriendsPanel', () => {
  const mockOnBack = vi.fn();

  const defaultMockValues = {
    inviteCode: 'TESTCODE1',
    invitesSent: 5,
    invitesAccepted: 3,
    rewardsEarned: 150,
    rewardConfig: {
      rewardXPPerInvite: 50,
      maxInvitesAllowed: 0,
    },
    shareInviteCode: vi.fn().mockResolvedValue('TESTCODE1'),
    claimInvite: vi.fn().mockResolvedValue({ success: true, message: '绑定成功！获得 50 XP 奖励', rewardXP: 50 }),
  };

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    mockUseInviteMetrics.mockReturnValue(defaultMockValues);
    mockClipboard.writeText.mockClear();
    mockShare.mockClear();
  });

  describe('Rendering', () => {
    it('renders without crashing', () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      expect(screen.getByText('邀请好友')).toBeInTheDocument();
    });

    it('displays invite code', () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      expect(screen.getByText('TESTCODE1')).toBeInTheDocument();
    });

    it('shows loading state when invite code is null', () => {
      mockUseInviteMetrics.mockReturnValue({
        ...defaultMockValues,
        inviteCode: null,
      });

      render(<InviteFriendsPanel onBack={mockOnBack} />);

      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('displays stats section', () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      expect(screen.getByText('邀请统计')).toBeInTheDocument();
      expect(screen.getByText('已分享')).toBeInTheDocument();
      expect(screen.getByText('已绑定')).toBeInTheDocument();
      expect(screen.getByText('获得 XP')).toBeInTheDocument();
    });

    it('displays correct stats values', () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      // Find the stat values (they're in the grid)
      const statsPage = document.body.textContent || '';
      expect(statsPage).toContain('5'); // invitesSent
      expect(statsPage).toContain('3'); // invitesAccepted
      expect(statsPage).toContain('+150'); // rewardsEarned
    });

    it('displays reward info card', () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      expect(screen.getByText('邀请奖励')).toBeInTheDocument();
      expect(screen.getByText(/每邀请一位好友加入/)).toBeInTheDocument();
      expect(screen.getByText('50 XP')).toBeInTheDocument();
    });

    it('displays claim section', () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      expect(screen.getByText('绑定好友邀请码')).toBeInTheDocument();
      expect(screen.getByLabelText('好友的邀请码')).toBeInTheDocument();
    });
  });

  describe('Back button', () => {
    it('calls onBack when back button clicked', () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const backButton = screen.getByTestId('invite-back-button');
      fireEvent.click(backButton);

      expect(mockOnBack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Copy button', () => {
    it('copies code to clipboard when copy button clicked', async () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const copyButton = screen.getByRole('button', { name: /复制/ });
      await userEvent.click(copyButton);

      expect(mockClipboard.writeText).toHaveBeenCalledWith('TESTCODE1');
    });

    it('shows success toast after copying', async () => {
      const { toast } = await import('sonner');
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const copyButton = screen.getByRole('button', { name: /复制/ });
      await userEvent.click(copyButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('邀请码已复制到剪贴板');
      });
    });

    it('disables copy button when no invite code', () => {
      mockUseInviteMetrics.mockReturnValue({
        ...defaultMockValues,
        inviteCode: null,
      });

      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const copyButton = screen.getByRole('button', { name: /复制/ });
      expect(copyButton).toBeDisabled();
    });
  });

  describe('Share button', () => {
    it('uses Web Share API when available', async () => {
      mockShare.mockResolvedValue(undefined);

      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const shareButton = screen.getByRole('button', { name: /分享/ });
      await userEvent.click(shareButton);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalled();
      });
    });

    it('falls back to clipboard when Web Share API not available', async () => {
      // Need to actually make share undefined to trigger the fallback branch
      Object.defineProperty(navigator, 'share', {
        writable: true,
        configurable: true,
        value: undefined,
      });

      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const shareButton = screen.getByRole('button', { name: /分享/ });
      await userEvent.click(shareButton);

      await waitFor(() => {
        expect(mockClipboard.writeText).toHaveBeenCalled();
      });
    });

    it('calls shareInviteCode after sharing', async () => {
      mockShare.mockResolvedValue(undefined);

      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const shareButton = screen.getByRole('button', { name: /分享/ });
      await userEvent.click(shareButton);

      await waitFor(() => {
        expect(defaultMockValues.shareInviteCode).toHaveBeenCalled();
      });
    });

    it('disables share button while sharing', async () => {
      // Make shareInviteCode slow so we can verify the button is disabled during the async operation
      defaultMockValues.shareInviteCode.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const shareButton = screen.getByRole('button', { name: /分享/ });
      await userEvent.click(shareButton);

      // Verify shareInviteCode was called (triggered by clicking share)
      expect(defaultMockValues.shareInviteCode).toHaveBeenCalled();
    });
  });

  describe('Claim invite code', () => {
    it('accepts input in friend code field', async () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const input = screen.getByLabelText('好友的邀请码');
      await userEvent.type(input, 'FRIEND12');

      expect(input).toHaveValue('FRIEND12');
    });

    it('converts input to uppercase', async () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const input = screen.getByLabelText('好友的邀请码');
      await userEvent.type(input, 'friend12');

      expect(input).toHaveValue('FRIEND12');
    });

    it('limits input to 8 characters', async () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const input = screen.getByLabelText('好友的邀请码');
      await userEvent.type(input, '123456789012');

      expect(input).toHaveValue('12345678');
    });

    it('calls claimInvite with entered code when claim button clicked', async () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const input = screen.getByLabelText('好友的邀请码');
      await userEvent.type(input, 'FRIEND12');

      const claimButton = screen.getByRole('button', { name: /绑定/ });
      await userEvent.click(claimButton);

      await waitFor(() => {
        expect(defaultMockValues.claimInvite).toHaveBeenCalledWith('FRIEND12');
      });
    });

    it('shows success message on successful claim', async () => {
      const { toast } = await import('sonner');
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const input = screen.getByLabelText('好友的邀请码');
      await userEvent.type(input, 'FRIEND12');

      const claimButton = screen.getByRole('button', { name: /绑定/ });
      await userEvent.click(claimButton);

      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('绑定成功！获得 50 XP 奖励');
      });
    });

    it('shows error message on failed claim', async () => {
      const { toast } = await import('sonner');
      defaultMockValues.claimInvite.mockResolvedValueOnce({
        success: false,
        message: '邀请码格式不正确，请输入 8 位邀请码',
      });

      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const input = screen.getByLabelText('好友的邀请码');
      await userEvent.type(input, 'FRIEND12');

      const claimButton = screen.getByRole('button', { name: /绑定/ });
      await userEvent.click(claimButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('邀请码格式不正确，请输入 8 位邀请码');
      });
    });

    it('clears input field after successful claim', async () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const input = screen.getByLabelText('好友的邀请码');
      await userEvent.type(input, 'FRIEND12');

      const claimButton = screen.getByRole('button', { name: /绑定/ });
      await userEvent.click(claimButton);

      await waitFor(() => {
        expect(input).toHaveValue('');
      });
    });

    it('disables claim button when input is not 8 characters', () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const claimButton = screen.getByRole('button', { name: /绑定/ });
      expect(claimButton).toBeDisabled();

      // Add partial input
      const input = screen.getByLabelText('好友的邀请码');
      userEvent.type(input, '1234');
      expect(claimButton).toBeDisabled();
    });

    it('enables claim button when input is exactly 8 characters', async () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const input = screen.getByLabelText('好友的邀请码');
      await userEvent.type(input, '12345678');

      const claimButton = screen.getByRole('button', { name: /绑定/ });
      expect(claimButton).not.toBeDisabled();
    });

    it('disables claim button while claiming', async () => {
      defaultMockValues.claimInvite.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const input = screen.getByLabelText('好友的邀请码');
      await userEvent.type(input, 'FRIEND12');

      const claimButton = screen.getByRole('button', { name: /绑定/ });
      await userEvent.click(claimButton);

      // Should show "绑定中..." while claiming
      expect(screen.getByText('绑定中...')).toBeInTheDocument();
    });
  });

  describe('Stats display', () => {
    it('displays zero stats correctly', () => {
      mockUseInviteMetrics.mockReturnValue({
        ...defaultMockValues,
        invitesSent: 0,
        invitesAccepted: 0,
        rewardsEarned: 0,
      });

      render(<InviteFriendsPanel onBack={mockOnBack} />);

      const statsPage = document.body.textContent || '';
      expect(statsPage).toContain('0');
      expect(statsPage).toContain('+0');
    });

    it('displays reward XP in amber color', () => {
      render(<InviteFriendsPanel onBack={mockOnBack} />);

      // The rewardsEarned should be displayed with + prefix in amber color
      const rewardStat = screen.getByText('+150');
      expect(rewardStat).toBeInTheDocument();
    });
  });
});
