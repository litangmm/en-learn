import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ShareCard } from '../ShareCard';
import type { ShareCardData } from '@/data/types';

describe('ShareCard', () => {
  const mockShareData: ShareCardData = {
    xp: { totalXP: 500, currentLevel: 5, levelProgress: 75 },
    session: { score: 85, accuracy: 0.85, streak: 10 },
    badges: [
      { id: 'badge-1', icon: 'Trophy' },
      { id: 'badge-2', icon: 'Star' },
      { id: 'badge-3', icon: 'Flame' },
    ],
    rank: 3,
    appName: 'en-learn',
  };

  it('renders share card with all data fields correctly displayed', () => {
    render(<ShareCard data={mockShareData} />);

    // Brand area
    expect(screen.getByText('en-learn')).toBeInTheDocument();
    expect(screen.getByText('成就分享')).toBeInTheDocument();

    // Level badge
    expect(screen.getByText('Lv.5')).toBeInTheDocument();

    // XP progress
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText(/500 XP/)).toBeInTheDocument();

    // Stats - streak and accuracy
    expect(screen.getByText('10')).toBeInTheDocument(); // streak
    expect(screen.getByText('85%')).toBeInTheDocument(); // accuracy
    expect(screen.getByText('连续答题')).toBeInTheDocument();
    expect(screen.getByText('正确率')).toBeInTheDocument();

    // Score
    expect(screen.getByText('本次得分')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument();

    // Badges section
    expect(screen.getByText('获得成就')).toBeInTheDocument();

    // Rank
    expect(screen.getByText('第 3 名')).toBeInTheDocument();
    expect(screen.getByText('排行榜')).toBeInTheDocument();
  });

  it('hides rank section when rank is 0', () => {
    const dataWithoutRank = { ...mockShareData, rank: 0 };
    render(<ShareCard data={dataWithoutRank} />);

    expect(screen.queryByText(/第.*名/)).not.toBeInTheDocument();
    expect(screen.queryByText('排行榜')).not.toBeInTheDocument();
  });

  it('hides badges section when badges array is empty', () => {
    const dataWithoutBadges = { ...mockShareData, badges: [] };
    render(<ShareCard data={dataWithoutBadges} />);

    expect(screen.queryByText('获得成就')).not.toBeInTheDocument();
  });

  it('shows up to 3 badges', () => {
    render(<ShareCard data={mockShareData} />);

    // Badge section header should be visible
    expect(screen.getByText('获得成就')).toBeInTheDocument();

    // All 3 badges should be rendered as flex items with icons
    // Count the badge items rendered with amber background
    const badgeItems = document.querySelectorAll('.bg-amber-50');
    expect(badgeItems.length).toBe(3);
  });

  it('shows overflow indicator when more than 3 badges', () => {
    const dataWithManyBadges: ShareCardData = {
      ...mockShareData,
      badges: [
        { id: 'badge-1', icon: 'Trophy' },
        { id: 'badge-2', icon: 'Star' },
        { id: 'badge-3', icon: 'Flame' },
        { id: 'badge-4', icon: 'Footprints' },
        { id: 'badge-5', icon: 'CheckCircle2' },
      ],
    };
    render(<ShareCard data={dataWithManyBadges} />);

    // Badge section header should be visible
    expect(screen.getByText('获得成就')).toBeInTheDocument();

    // Should show +2 overflow indicator
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('XP progress bar displays correct percentage', () => {
    render(<ShareCard data={mockShareData} />);

    // The progress indicator uses translateX to show progress
    // Progress of 75% means translateX(-25%) since it translates from the right
    const progressIndicator = document.querySelector('[data-slot="progress-indicator"]');
    expect(progressIndicator).toBeInTheDocument();
    expect(progressIndicator).toHaveStyle({ transform: 'translateX(-25%)' });
  });

  it('accuracy displays as percentage (e.g., 85% for 0.85)', () => {
    // Test different accuracy values
    const data85: ShareCardData = {
      ...mockShareData,
      session: { ...mockShareData.session, accuracy: 0.85 },
    };
    const data100: ShareCardData = {
      ...mockShareData,
      session: { ...mockShareData.session, accuracy: 1.0 },
    };
    const data50: ShareCardData = {
      ...mockShareData,
      session: { ...mockShareData.session, accuracy: 0.5 },
    };

    // Test 0.85 -> 85%
    const { rerender } = render(<ShareCard data={data85} />);
    expect(screen.getByText('85%')).toBeInTheDocument();

    // Test 1.0 -> 100%
    rerender(<ShareCard data={data100} />);
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Test 0.5 -> 50%
    rerender(<ShareCard data={data50} />);
    expect(screen.getByText('50%')).toBeInTheDocument();
  });

  it('accepts custom className', () => {
    const { container } = render(
      <ShareCard data={mockShareData} className="custom-class" />
    );
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('renders total XP with formatted number', () => {
    const dataWithLargeXP: ShareCardData = {
      ...mockShareData,
      xp: { totalXP: 15000, currentLevel: 12, levelProgress: 45 },
    };
    render(<ShareCard data={dataWithLargeXP} />);

    // Should use toLocaleString for formatting large numbers
    expect(screen.getByText(/15,000 XP/)).toBeInTheDocument();
  });

  it('renders with share card data-testid', () => {
    const { getByTestId } = render(<ShareCard data={mockShareData} />);
    expect(getByTestId('share-card')).toBeInTheDocument();
  });
});
