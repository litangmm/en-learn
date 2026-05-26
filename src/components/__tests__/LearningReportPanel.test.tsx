import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LearningReportPanel } from '../LearningReportPanel';
import type { LearningReport } from '@/data/types';

// Mock data
const mockReport: LearningReport = {
  id: 'report-2024-01-01',
  periodLabel: '1月1-7日学习报告',
  generatedAt: Date.now(),
  period: {
    startDate: '2024-01-01',
    endDate: '2024-01-07',
  },
  healthScore: {
    score: 75,
    level: 'medium',
    label: '良好',
  },
  xp: {
    total: 1000,
    level: 3,
    weeklyGained: 150,
  },
  accuracy: {
    total: 72,
    trend: 'up',
  },
  streak: {
    current: 5,
    best: 10,
  },
  practice: {
    totalQuestions: 100,
    totalSessions: 10,
    modesPracticed: 4,
  },
  weakModeRecommendation: {
    mode: 'dictation',
    accuracy: 45,
    suggestion: '听写需要多听音频，跟读练习会很有帮助',
    priority: 1,
  },
  achievements: [
    {
      id: 'badge-1',
      title: '初次尝试',
      description: '完成第一道题',
      icon: 'Star',
    },
  ],
  insights: [
    {
      id: 'insight-1',
      section: 'health',
      title: '学习状态良好',
      description: '继续保持',
      priority: 1,
      generatedAt: Date.now(),
    },
  ],
  nextActions: ['加强听写模式的练习'],
};

// Mock the hook
vi.mock('@/hooks/useLearningReport', () => ({
  useLearningReport: vi.fn(() => mockReport),
}));

// Mock html2canvas functions
vi.mock('@/hooks/useBadgeExport', () => ({
  generateBadgeImage: vi.fn().mockResolvedValue(new Blob()),
  downloadBadgeBlob: vi.fn(),
}));

describe('LearningReportPanel', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('renders nothing when isOpen is false', () => {
      render(<LearningReportPanel isOpen={false} onClose={mockOnClose} />);

      expect(screen.queryByTestId('learning-report-panel-overlay')).toBeNull();
    });

    it('renders panel when isOpen is true', () => {
      render(<LearningReportPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('learning-report-panel-overlay')).toBeInTheDocument();
      expect(screen.getByTestId('learning-report-panel-content')).toBeInTheDocument();
    });

    it('displays report header with period label', () => {
      render(<LearningReportPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getAllByText('学习健康报告')).toHaveLength(2); // header and card
      expect(screen.getByText('1月1-7日学习报告')).toBeInTheDocument();
    });

    it('displays health score', () => {
      render(<LearningReportPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('75')).toBeInTheDocument();
      expect(screen.getByText('良好')).toBeInTheDocument();
    });

    it('displays XP stats', () => {
      render(<LearningReportPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('+150')).toBeInTheDocument();
    });

    it('displays accuracy with trend icon', () => {
      render(<LearningReportPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('72%')).toBeInTheDocument();
    });

    it('displays streak information', () => {
      render(<LearningReportPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('5 天')).toBeInTheDocument();
    });

    it('displays weak mode recommendation', () => {
      render(<LearningReportPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText(/薄弱环节/)).toBeInTheDocument();
      expect(screen.getByText(/45%/)).toBeInTheDocument();
    });

    it('displays achievements', () => {
      render(<LearningReportPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('achievement-badge-badge-1')).toBeInTheDocument();
      expect(screen.getByText('初次尝试')).toBeInTheDocument();
    });

    it('displays next actions', () => {
      render(<LearningReportPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByText('加强听写模式的练习')).toBeInTheDocument();
    });
  });

  describe('interaction', () => {
    it('calls onClose when close button is clicked', () => {
      render(<LearningReportPanel isOpen={true} onClose={mockOnClose} />);

      fireEvent.click(screen.getByTestId('report-close-button'));
      expect(mockOnClose).toHaveBeenCalled();
    });

    it('calls onShare when share button is clicked', () => {
      const mockOnShare = vi.fn();
      render(
        <LearningReportPanel
          isOpen={true}
          onClose={mockOnClose}
          onShare={mockOnShare}
        />
      );

      fireEvent.click(screen.getByTestId('report-share-button'));
      expect(mockOnShare).toHaveBeenCalledWith(mockReport);
    });

    it('has export button', () => {
      render(<LearningReportPanel isOpen={true} onClose={mockOnClose} />);

      expect(screen.getByTestId('report-export-button')).toBeInTheDocument();
    });
  });

  describe('export functionality', () => {
    it('shows exporting state when enableInternalExport is true', async () => {
      const { rerender } = render(
        <LearningReportPanel isOpen={true} onClose={mockOnClose} enableInternalExport={true} />
      );

      // Click export button
      fireEvent.click(screen.getByTestId('report-export-button'));

      // Rerender to show exporting state
      rerender(
        <LearningReportPanel
          isOpen={true}
          onClose={mockOnClose}
          enableInternalExport={true}
          isExporting={true}
        />
      );

      expect(screen.getByText('导出中...')).toBeInTheDocument();
    });
  });
});