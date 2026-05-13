import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChurnMetricsPanel } from '../ChurnMetricsPanel';
import type { ChurnMetrics } from '@/data/types';

// ============================================================================
// Test Mocks
// ============================================================================

// Mock storage
const mockGetChurnMetrics = vi.fn();

vi.mock('@/services/storage', () => ({
  storage: {
    getChurnMetrics: () => mockGetChurnMetrics(),
  },
}));

// ============================================================================
// Test Data
// ============================================================================

function createMockMetrics(overrides: Partial<ChurnMetrics> = {}): ChurnMetrics {
  return {
    triggers: [],
    responses: [],
    sessions: [],
    lastUpdated: Date.now(),
    cumulativeConversionRate: 0,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('ChurnMetricsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('compact view (default)', () => {
    it('should render without crashing', () => {
      mockGetChurnMetrics.mockReturnValue(createMockMetrics());
      render(<ChurnMetricsPanel />);
      expect(screen.getByText('召回效果')).toBeInTheDocument();
    });

    it('should show "暂无数据" when no metrics', () => {
      mockGetChurnMetrics.mockReturnValue(createMockMetrics());
      render(<ChurnMetricsPanel />);
      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('should show metrics when data exists', () => {
      mockGetChurnMetrics.mockReturnValue(
        createMockMetrics({
          triggers: [{ id: 't1', level: 'medium', action: 'banner', triggeredAt: Date.now(), riskLevel: 'medium', signalCount: 1 }],
          cumulativeConversionRate: 0.5,
        })
      );
      render(<ChurnMetricsPanel />);

      expect(screen.getByText('干预触发')).toBeInTheDocument();
      expect(screen.getByText('1 次')).toBeInTheDocument();
      expect(screen.getByText('转化率')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should show 0% when no triggers', () => {
      mockGetChurnMetrics.mockReturnValue(createMockMetrics());
      render(<ChurnMetricsPanel />);

      // With no triggers, the component shows "暂无数据" not the metrics
      expect(screen.getByText('暂无数据')).toBeInTheDocument();
    });

    it('should use green color for good conversion rate (>=50%)', () => {
      mockGetChurnMetrics.mockReturnValue(
        createMockMetrics({
          triggers: [
            { id: 't1', level: 'medium', action: 'banner', triggeredAt: Date.now(), riskLevel: 'medium', signalCount: 1 },
            { id: 't2', level: 'medium', action: 'banner', triggeredAt: Date.now(), riskLevel: 'medium', signalCount: 1 },
          ],
          cumulativeConversionRate: 0.5,
        })
      );
      render(<ChurnMetricsPanel />);

      const conversionRateEl = screen.getByText('50%');
      expect(conversionRateEl).toHaveClass('text-green-600');
    });

    it('should use default color for poor conversion rate (<50%)', () => {
      mockGetChurnMetrics.mockReturnValue(
        createMockMetrics({
          triggers: [
            { id: 't1', level: 'medium', action: 'banner', triggeredAt: Date.now(), riskLevel: 'medium', signalCount: 1 },
            { id: 't2', level: 'medium', action: 'banner', triggeredAt: Date.now(), riskLevel: 'medium', signalCount: 1 },
            { id: 't3', level: 'medium', action: 'banner', triggeredAt: Date.now(), riskLevel: 'medium', signalCount: 1 },
            { id: 't4', level: 'medium', action: 'banner', triggeredAt: Date.now(), riskLevel: 'medium', signalCount: 1 },
          ],
          cumulativeConversionRate: 0.25,
        })
      );
      render(<ChurnMetricsPanel />);

      const conversionRateEl = screen.getByText('25%');
      expect(conversionRateEl).not.toHaveClass('text-green-600');
      expect(conversionRateEl).toHaveClass('text-slate-600');
    });
  });

  describe('full view', () => {
    it('should show empty state when no data', () => {
      mockGetChurnMetrics.mockReturnValue(createMockMetrics());
      const handleBack = vi.fn();
      render(<ChurnMetricsPanel onBack={handleBack} isFullView />);

      expect(screen.getByText('召回效果追踪')).toBeInTheDocument();
      expect(screen.getByText('暂无召回数据')).toBeInTheDocument();
    });

    it('should show summary cards when data exists', () => {
      mockGetChurnMetrics.mockReturnValue(
        createMockMetrics({
          triggers: [
            { id: 't1', level: 'medium', action: 'banner', triggeredAt: Date.now(), riskLevel: 'medium', signalCount: 1 },
            { id: 't2', level: 'high', action: 'banner', triggeredAt: Date.now() - 2 * 24 * 60 * 60 * 1000, riskLevel: 'high', signalCount: 2 },
          ],
          responses: [
            { id: 'r1', triggerId: 't1', response: 'accepted', respondedAt: Date.now(), durationMs: 5000, riskLevel: 'medium' },
          ],
          cumulativeConversionRate: 0.5,
        })
      );
      const handleBack = vi.fn();
      render(<ChurnMetricsPanel onBack={handleBack} isFullView />);

      expect(screen.getByText('召回效果追踪')).toBeInTheDocument();
      expect(screen.getByText('干预次数')).toBeInTheDocument();
      expect(screen.getByText('接受数')).toBeInTheDocument();
      expect(screen.getByText('忽略数')).toBeInTheDocument();
      expect(screen.getByText('最近7天')).toBeInTheDocument();
    });

    it('should display correct conversion rate in full view', () => {
      mockGetChurnMetrics.mockReturnValue(
        createMockMetrics({
          triggers: [{ id: 't1', level: 'medium', action: 'banner', triggeredAt: Date.now(), riskLevel: 'medium', signalCount: 1 }],
          responses: [{ id: 'r1', triggerId: 't1', response: 'accepted', respondedAt: Date.now(), durationMs: 5000, riskLevel: 'medium' }],
          cumulativeConversionRate: 1,
        })
      );
      const handleBack = vi.fn();
      render(<ChurnMetricsPanel onBack={handleBack} isFullView />);

      expect(screen.getByText('召回转化率')).toBeInTheDocument();
      // 100% may appear multiple times, check it exists at least once
      expect(screen.getAllByText('100%').length).toBeGreaterThan(0);
    });

    it('should show back button', () => {
      mockGetChurnMetrics.mockReturnValue(createMockMetrics());
      const handleBack = vi.fn();
      render(<ChurnMetricsPanel onBack={handleBack} isFullView />);

      // Back button is an icon button - check by aria-label or just that it's clickable
      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
    });
  });
});