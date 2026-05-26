import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ForgettingCurveChart, ForgettingCurveChartMini } from '../ForgettingCurveChart';
import type { ForgettingCurveData } from '@/hooks/useForgettingCurve';

describe('ForgettingCurveChart', () => {
  const createMockData = (overrides?: Partial<ForgettingCurveData>): ForgettingCurveData => ({
    sentenceId: 'test-sentence',
    dictionaryId: 'cet6',
    dataPoints: [],
    intervalContext: {
      currentInterval: 3,
      reviewCount: 1,
    },
    nextReviewAt: Date.now() + 3 * 24 * 60 * 60 * 1000,
    daysUntilReview: 3,
    memoryRetentionScore: 75,
    isOverdue: false,
    urgencyLevel: 1,
    ...overrides,
  });

  describe('rendering', () => {
    it('should render chart with correct data-testid', () => {
      const data = createMockData();
      render(<ForgettingCurveChart data={data} />);

      expect(screen.getByTestId('forgetting-curve-chart')).toBeInTheDocument();
    });

    it('should render with custom dimensions', () => {
      const data = createMockData();
      const { container } = render(
        <ForgettingCurveChart data={data} width={400} height={250} />
      );

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('400');
      expect(svg?.getAttribute('height')).toBe('250');
    });

    it('should hide labels when showLabels is false', () => {
      const data = createMockData();
      const { container: c } = render(<ForgettingCurveChart data={data} showLabels={false} />);

      const svg = c.querySelector('svg');
      // When labels are hidden, there should be fewer text elements
      const textElements = svg?.querySelectorAll('text');
      expect(textElements?.length).toBeLessThan(10);
    });
  });

  describe('curve visualization', () => {
    it('should render SVG with all required elements', () => {
      const data = createMockData();
      render(<ForgettingCurveChart data={data} />);

      const svg = document.querySelector('svg');
      expect(svg).toBeInTheDocument();

      // Check for curve path
      const pathElements = svg?.querySelectorAll('path');
      expect(pathElements?.length).toBeGreaterThan(0);

      // Check for current retention marker (circle)
      const circles = svg?.querySelectorAll('circle');
      expect(circles?.length).toBeGreaterThan(0);
    });

    it('should display retention percentage label', () => {
      const data = createMockData({ memoryRetentionScore: 85 });
      render(<ForgettingCurveChart data={data} />);

      // The retention label should contain the percentage
      const retentionText = document.body.textContent;
      expect(retentionText).toContain('85%');
    });

    it('should show legend items', () => {
      const data = createMockData();
      render(<ForgettingCurveChart data={data} />);

      // Legend should contain labels
      expect(screen.getByText('艾宾浩斯曲线')).toBeInTheDocument();
      expect(screen.getByText('当前保留')).toBeInTheDocument();
    });
  });

  describe('color coding', () => {
    it('should show green for good retention (>=60%)', () => {
      const data = createMockData({ memoryRetentionScore: 75 });
      render(<ForgettingCurveChart data={data} />);

      const circles = document.querySelectorAll('circle');
      const retentionCircle = circles[circles.length - 1]; // Last circle is current retention
      expect(retentionCircle).toHaveAttribute('fill', '#22c55e');
    });

    it('should show amber for medium retention (30-59%)', () => {
      const data = createMockData({ memoryRetentionScore: 45 });
      render(<ForgettingCurveChart data={data} />);

      const circles = document.querySelectorAll('circle');
      const retentionCircle = circles[circles.length - 1];
      expect(retentionCircle).toHaveAttribute('fill', '#f59e0b');
    });

    it('should show red for low retention (<30%)', () => {
      const data = createMockData({ memoryRetentionScore: 20 });
      render(<ForgettingCurveChart data={data} />);

      const circles = document.querySelectorAll('circle');
      const retentionCircle = circles[circles.length - 1];
      expect(retentionCircle).toHaveAttribute('fill', '#ef4444');
    });
  });

  describe('mini chart', () => {
    it('should render mini chart', () => {
      const data = createMockData();
      render(<ForgettingCurveChartMini data={data} />);

      expect(screen.getByTestId('forgetting-curve-chart')).toBeInTheDocument();
    });

    it('should render with smaller dimensions', () => {
      const data = createMockData();
      const { container } = render(
        <ForgettingCurveChartMini data={data} width={100} height={60} />
      );

      const svg = container.querySelector('svg');
      expect(svg?.getAttribute('width')).toBe('100');
      expect(svg?.getAttribute('height')).toBe('60');
    });
  });
});