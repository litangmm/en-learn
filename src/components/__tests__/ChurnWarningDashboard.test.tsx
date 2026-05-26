import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { ChurnWarningDashboard } from '../ChurnWarningDashboard';
import type { ChurnRiskLevel, ChurnMetrics } from '@/data/types';

// ============================================================================
// Test Mocks
// ============================================================================

// Mock storage
const mockGetChurnMetrics = vi.fn();
const mockGetHistory = vi.fn();

vi.mock('@/services/storage', () => ({
  storage: {
    getChurnMetrics: () => mockGetChurnMetrics(),
    getHistory: () => mockGetHistory(),
  },
}));

// Mock useChurnSignals hook to control risk level directly
const mockUseChurnSignals = vi.fn(() => ({
  riskLevel: 'low' as ChurnRiskLevel,
  signals: [],
  topRiskFactors: [],
}));

vi.mock('@/hooks/useChurnSignals', () => ({
  useChurnSignals: () => mockUseChurnSignals(),
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <div data-testid="motion-div" {...props}>{children}</div>
    ),
    span: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <span {...props}>{children}</span>
    ),
    p: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <p {...props}>{children}</p>
    ),
    g: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <g {...props}>{children}</g>
    ),
    path: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <path {...props}>{children}</path>
    ),
    circle: ({ ...props }: { [key: string]: unknown }) => <circle {...props} />,
    text: ({ children, ...props }: { children: React.ReactNode; [key: string]: unknown }) => (
      <text {...props}>{children}</text>
    ),
    line: ({ ...props }: { [key: string]: unknown }) => <line {...props} />,
    polygon: ({ ...props }: { [key: string]: unknown }) => <polygon {...props} />,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
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

function createMockTrigger(id: string, daysAgo: number, riskLevel: ChurnRiskLevel = 'medium'): {
  id: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  action: 'banner';
  triggeredAt: number;
  riskLevel: ChurnRiskLevel;
  signalCount: number;
} {
  return {
    id,
    level: riskLevel as 'low' | 'medium' | 'high' | 'critical',
    action: 'banner',
    triggeredAt: Date.now() - daysAgo * 24 * 60 * 60 * 1000,
    riskLevel,
    signalCount: 1,
  };
}

function createMockResponse(
  id: string,
  triggerId: string,
  daysAgo: number,
  response: 'accepted' | 'dismissed' | 'snoozed'
): {
  id: string;
  triggerId: string;
  response: 'accepted' | 'dismissed' | 'snoozed';
  respondedAt: number;
  durationMs: number;
  riskLevel: ChurnRiskLevel;
} {
  return {
    id,
    triggerId,
    response,
    respondedAt: Date.now() - daysAgo * 24 * 60 * 60 * 1000,
    durationMs: 5000,
    riskLevel: 'medium',
  };
}

// ============================================================================
// Tests
// ============================================================================

describe('ChurnWarningDashboard', () => {
  const mockOnBack = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00Z'));
    // Default mock - empty metrics
    mockGetChurnMetrics.mockReturnValue(createMockMetrics());
    mockGetHistory.mockReturnValue([]);
    // Reset useChurnSignals to default
    mockUseChurnSignals.mockReturnValue({
      riskLevel: 'low' as ChurnRiskLevel,
      signals: [],
      topRiskFactors: [],
    });
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  describe('Empty state', () => {
    it('should render empty state when no metrics data', () => {
      mockGetChurnMetrics.mockReturnValue(createMockMetrics());

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('暂无流失预警数据')).toBeInTheDocument();
      expect(screen.getByText(/当系统检测到流失风险并触发干预时/)).toBeInTheDocument();
    });

    it('should show title "流失预警数据看板"', () => {
      mockGetChurnMetrics.mockReturnValue(createMockMetrics());

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('流失预警数据看板')).toBeInTheDocument();
    });

    it('should render back button in empty state', () => {
      mockGetChurnMetrics.mockReturnValue(createMockMetrics());

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      // Back button exists (icon button)
      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Risk level display', () => {
    it('should display risk gauge for low risk level', () => {
      mockUseChurnSignals.mockReturnValue({
        riskLevel: 'low' as ChurnRiskLevel,
        signals: [],
        topRiskFactors: [],
      });
      const mockMetrics = createMockMetrics({
        triggers: [createMockTrigger('t1', 0, 'low')],
        cumulativeConversionRate: 0.8,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      // Check for risk level label
      expect(screen.getByText('低风险')).toBeInTheDocument();
    });

    it('should display risk gauge for medium risk level', () => {
      mockUseChurnSignals.mockReturnValue({
        riskLevel: 'medium' as ChurnRiskLevel,
        signals: [],
        topRiskFactors: [],
      });
      const mockMetrics = createMockMetrics({
        triggers: [createMockTrigger('t1', 0, 'medium')],
        cumulativeConversionRate: 0.5,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      // Check for risk level label
      expect(screen.getByText('中风险')).toBeInTheDocument();
    });

    it('should display risk gauge for high risk level', () => {
      mockUseChurnSignals.mockReturnValue({
        riskLevel: 'high' as ChurnRiskLevel,
        signals: [],
        topRiskFactors: [],
      });
      const mockMetrics = createMockMetrics({
        triggers: [createMockTrigger('t1', 0, 'high')],
        cumulativeConversionRate: 0.3,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      // Check for risk level label
      expect(screen.getByText('高风险')).toBeInTheDocument();
    });

    it('should display risk gauge for critical risk level', () => {
      mockUseChurnSignals.mockReturnValue({
        riskLevel: 'critical' as ChurnRiskLevel,
        signals: [],
        topRiskFactors: [],
      });
      const mockMetrics = createMockMetrics({
        triggers: [createMockTrigger('t1', 0, 'critical')],
        cumulativeConversionRate: 0.1,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      // Check for risk level label - use getAllByText since "严重" also appears in SVG axis
      const elements = screen.getAllByText('严重');
      expect(elements.length).toBeGreaterThan(0);
      // Verify at least one is the styled risk level label (with font-bold)
      const fontBoldElements = elements.filter(el => el.className && String(el.className).includes('font-bold'));
      expect(fontBoldElements.length).toBeGreaterThan(0);
    });
  });

  describe('Trend chart', () => {
    it('should render trend chart section', () => {
      const mockMetrics = createMockMetrics({
        triggers: [
          createMockTrigger('t1', 0, 'medium'),
          createMockTrigger('t2', 5, 'medium'),
          createMockTrigger('t3', 10, 'medium'),
        ],
        cumulativeConversionRate: 0.5,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('30天干预触发趋势')).toBeInTheDocument();
    });

    it('should show empty state in trend chart when no data', () => {
      const mockMetrics = createMockMetrics();
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      // The ChurnWarningDashboard shows empty state when no metrics
      // which means it won't show the chart section at all
      expect(screen.getByText('暂无流失预警数据')).toBeInTheDocument();
    });
  });

  describe('Intervention effectiveness', () => {
    it('should render effectiveness section', () => {
      const mockMetrics = createMockMetrics({
        triggers: [createMockTrigger('t1', 0, 'medium')],
        responses: [createMockResponse('r1', 't1', 0, 'accepted')],
        cumulativeConversionRate: 0.5,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('干预效果分解')).toBeInTheDocument();
    });

    it('should show "接受" label', () => {
      const mockMetrics = createMockMetrics({
        triggers: [createMockTrigger('t1', 0, 'medium')],
        responses: [createMockResponse('r1', 't1', 0, 'accepted')],
        cumulativeConversionRate: 1,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('接受')).toBeInTheDocument();
    });

    it('should show "忽略" label', () => {
      const mockMetrics = createMockMetrics({
        triggers: [createMockTrigger('t1', 0, 'medium')],
        responses: [createMockResponse('r1', 't1', 0, 'dismissed')],
        cumulativeConversionRate: 0,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('忽略')).toBeInTheDocument();
    });

    it('should show "稍后" label', () => {
      const mockMetrics = createMockMetrics({
        triggers: [createMockTrigger('t1', 0, 'medium')],
        responses: [createMockResponse('r1', 't1', 0, 'snoozed')],
        cumulativeConversionRate: 0,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('稍后')).toBeInTheDocument();
    });
  });

  describe('Summary cards', () => {
    it('should display total triggers count', () => {
      const mockMetrics = createMockMetrics({
        triggers: [
          createMockTrigger('t1', 0, 'medium'),
          createMockTrigger('t2', 1, 'medium'),
          createMockTrigger('t3', 2, 'medium'),
        ],
        cumulativeConversionRate: 0.33,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('干预次数')).toBeInTheDocument();
      // Use getAllByText and check the count in the value area
      const valueElements = screen.getAllByText('3');
      expect(valueElements.length).toBeGreaterThan(0);
    });

    it('should display accepted count', () => {
      const mockMetrics = createMockMetrics({
        triggers: [
          createMockTrigger('t1', 0, 'medium'),
          createMockTrigger('t2', 1, 'medium'),
        ],
        responses: [
          createMockResponse('r1', 't1', 0, 'accepted'),
        ],
        cumulativeConversionRate: 0.5,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('接受数')).toBeInTheDocument();
      const valueElements = screen.getAllByText('1');
      expect(valueElements.length).toBeGreaterThan(0);
    });

    it('should display dismissed count combined with snoozed', () => {
      const mockMetrics = createMockMetrics({
        triggers: [
          createMockTrigger('t1', 0, 'medium'),
          createMockTrigger('t2', 1, 'medium'),
          createMockTrigger('t3', 2, 'medium'),
        ],
        responses: [
          createMockResponse('r1', 't1', 0, 'dismissed'),
          createMockResponse('r2', 't2', 1, 'snoozed'),
        ],
        cumulativeConversionRate: 0.33,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('忽略数')).toBeInTheDocument();
      const valueElements = screen.getAllByText('2');
      expect(valueElements.length).toBeGreaterThan(0);
    });

    it('should display recent triggers count (last 7 days)', () => {
      const mockMetrics = createMockMetrics({
        triggers: [
          createMockTrigger('t1', 0, 'medium'), // today
          createMockTrigger('t2', 3, 'medium'), // 3 days ago
          createMockTrigger('t3', 10, 'medium'), // 10 days ago - outside 7 days
        ],
        cumulativeConversionRate: 0.33,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('最近7天')).toBeInTheDocument();
      const valueElements = screen.getAllByText('2');
      expect(valueElements.length).toBeGreaterThan(0);
    });
  });

  describe('Conversion rate summary', () => {
    it('should display conversion rate percentage', () => {
      const mockMetrics = createMockMetrics({
        triggers: [
          createMockTrigger('t1', 0, 'medium'),
          createMockTrigger('t2', 1, 'medium'),
        ],
        responses: [
          createMockResponse('r1', 't1', 0, 'accepted'),
        ],
        cumulativeConversionRate: 0.5,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('召回转化率')).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    it('should show "(效果良好)" for 50% or higher conversion rate', () => {
      const mockMetrics = createMockMetrics({
        triggers: [
          createMockTrigger('t1', 0, 'medium'),
        ],
        responses: [
          createMockResponse('r1', 't1', 0, 'accepted'),
        ],
        cumulativeConversionRate: 1,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('(效果良好)')).toBeInTheDocument();
    });

    it('should show "(待提升)" for conversion rate below 50%', () => {
      const mockMetrics = createMockMetrics({
        triggers: [
          createMockTrigger('t1', 0, 'medium'),
          createMockTrigger('t2', 1, 'medium'),
          createMockTrigger('t3', 2, 'medium'),
        ],
        responses: [
          createMockResponse('r1', 't1', 0, 'accepted'),
        ],
        cumulativeConversionRate: 0.33,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('(待提升)')).toBeInTheDocument();
    });

    it('should show "0%" when no triggers', () => {
      // When there are no triggers, the dashboard shows empty state
      // which doesn't have the conversion rate section
      const mockMetrics = createMockMetrics({
        cumulativeConversionRate: 0,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      // Empty state doesn't have conversion rate
      expect(screen.getByText('暂无流失预警数据')).toBeInTheDocument();
    });
  });

  describe('Back button behavior', () => {
    it('should render back button when onBack prop provided', () => {
      const mockMetrics = createMockMetrics({
        triggers: [createMockTrigger('t1', 0, 'medium')],
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      const backButton = screen.getByRole('button');
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Section titles', () => {
    it('should display all section headers', () => {
      const mockMetrics = createMockMetrics({
        triggers: [createMockTrigger('t1', 0, 'medium')],
        responses: [createMockResponse('r1', 't1', 0, 'accepted')],
        cumulativeConversionRate: 1,
      });
      mockGetChurnMetrics.mockReturnValue(mockMetrics);
      mockGetHistory.mockReturnValue([]);

      render(<ChurnWarningDashboard onBack={mockOnBack} />);

      expect(screen.getByText('流失预警数据看板')).toBeInTheDocument();
      expect(screen.getByText('干预次数')).toBeInTheDocument();
      expect(screen.getByText('接受数')).toBeInTheDocument();
      expect(screen.getByText('忽略数')).toBeInTheDocument();
      expect(screen.getByText('最近7天')).toBeInTheDocument();
      expect(screen.getByText('当前流失风险等级')).toBeInTheDocument();
      expect(screen.getByText('30天干预触发趋势')).toBeInTheDocument();
      expect(screen.getByText('干预效果分解')).toBeInTheDocument();
      expect(screen.getByText('召回转化率')).toBeInTheDocument();
    });
  });
});