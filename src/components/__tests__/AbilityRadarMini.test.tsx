import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AbilityRadarMini } from '../AbilityRadarMini';
import type { ModeAccuracy } from '@/data/types';

// Define mode types for mock
const mockModes = ['fill-in-blanks', 'multiple-choice', 'sentence-reorder', 'dictation'] as const;

describe('AbilityRadarMini', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createMockData = (withData = false): ModeAccuracy[] =>
    mockModes.map(mode => ({
      mode,
      accuracy: withData ? 75 : 0,
      totalQuestions: withData ? 100 : 0,
      correctCount: withData ? 75 : 0,
    }));

  it('renders empty state when no data', () => {
    const emptyData = createMockData(false);
    render(<AbilityRadarMini data={emptyData} />);

    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  it('renders empty state by default (no data prop)', () => {
    render(<AbilityRadarMini />);

    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  it('renders with data when provided', () => {
    const dataWithContent = createMockData(true);
    render(<AbilityRadarMini data={dataWithContent} />);

    // Should render SVG without empty state message
    expect(screen.queryByText('暂无数据')).not.toBeInTheDocument();

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    const dataWithContent = createMockData(true);
    render(<AbilityRadarMini data={dataWithContent} size={160} />);

    const svg = document.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('160');
    expect(svg?.getAttribute('height')).toBe('160');
  });

  it('uses default size of 140px', () => {
    const dataWithContent = createMockData(true);
    render(<AbilityRadarMini data={dataWithContent} />);

    const svg = document.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('140');
    expect(svg?.getAttribute('height')).toBe('140');
  });

  it('renders SVG with correct structure when data exists', () => {
    const dataWithContent = createMockData(true);
    render(<AbilityRadarMini data={dataWithContent} />);

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Should have polygon for data
    const polygons = svg?.querySelectorAll('polygon');
    expect(polygons && polygons.length > 0).toBeTruthy();

    // Should have circles for data points
    const circles = svg?.querySelectorAll('circle');
    expect(circles && circles.length > 0).toBeTruthy();
  });

  it('has correct data-testid', () => {
    const dataWithContent = createMockData(true);
    render(<AbilityRadarMini data={dataWithContent} />);

    const container = document.querySelector('[data-testid="ability-radar-mini"]');
    expect(container).toBeInTheDocument();
  });

  it('renders with custom data showing different accuracies', () => {
    const customData: ModeAccuracy[] = [
      { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
      { mode: 'multiple-choice', accuracy: 70, totalQuestions: 40, correctCount: 28 },
      { mode: 'sentence-reorder', accuracy: 90, totalQuestions: 30, correctCount: 27 },
      { mode: 'dictation', accuracy: 60, totalQuestions: 20, correctCount: 12 },
    ];

    render(<AbilityRadarMini data={customData} />);

    // Component should render with data
    expect(document.body).toBeInTheDocument();
    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders accuracy labels on data points', () => {
    const customData: ModeAccuracy[] = [
      { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
      { mode: 'multiple-choice', accuracy: 70, totalQuestions: 40, correctCount: 28 },
      { mode: 'sentence-reorder', accuracy: 90, totalQuestions: 30, correctCount: 27 },
      { mode: 'dictation', accuracy: 60, totalQuestions: 20, correctCount: 12 },
    ];

    render(<AbilityRadarMini data={customData} />);

    // Should show accuracy percentages
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('70%')).toBeInTheDocument();
    expect(screen.getByText('90%')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
  });

  it('has data points for each mode', () => {
    const dataWithContent = createMockData(true);
    render(<AbilityRadarMini data={dataWithContent} />);

    // Should have 4 data points (one for each mode)
    const circles = document.querySelectorAll('circle');
    expect(circles.length).toBe(4);
  });

  it('renders grid rings in empty state', () => {
    const emptyData = createMockData(false);
    render(<AbilityRadarMini data={emptyData} />);

    const svg = document.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // Should have dashed lines for empty state
    const lines = svg?.querySelectorAll('line');
    expect(lines && lines.length > 0).toBeTruthy();
  });

  describe('click interaction', () => {
    it('does not have click handlers on data points (mini version is read-only)', () => {
      const dataWithContent = createMockData(true);
      render(<AbilityRadarMini data={dataWithContent} />);

      // In the mini version, circles should not be in clickable groups
      const clickableGroups = document.querySelectorAll('g.cursor-pointer');
      expect(clickableGroups.length).toBe(0);
    });
  });
});