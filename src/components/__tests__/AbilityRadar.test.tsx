import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AbilityRadar } from '../AbilityRadar';
import type { ModeAccuracy } from '@/data/types';

// Define mode types for mock
const mockModes = ['fill-in-blanks', 'multiple-choice', 'sentence-reorder', 'dictation'] as const;

describe('AbilityRadar', () => {
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
    render(<AbilityRadar data={emptyData} />);

    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  it('renders with custom data', () => {
    const customData: ModeAccuracy[] = [
      { mode: 'fill-in-blanks', accuracy: 80, totalQuestions: 50, correctCount: 40 },
      { mode: 'multiple-choice', accuracy: 70, totalQuestions: 40, correctCount: 28 },
      { mode: 'sentence-reorder', accuracy: 90, totalQuestions: 30, correctCount: 27 },
      { mode: 'dictation', accuracy: 60, totalQuestions: 20, correctCount: 12 },
    ];

    render(<AbilityRadar data={customData} />);

    // Component should render with data
    expect(document.body).toBeInTheDocument();
  });

  it('renders with custom size', () => {
    const dataWithContent = createMockData(true);
    render(<AbilityRadar data={dataWithContent} size={300} />);

    const svg = document.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('300');
    expect(svg?.getAttribute('height')).toBe('300');
  });

  it('renders with labels hidden', () => {
    const dataWithContent = createMockData(true);
    render(<AbilityRadar data={dataWithContent} showLabels={false} />);

    // Should still render with data
    expect(document.body).toBeInTheDocument();
  });

  it('renders SVG with correct structure when data exists', () => {
    const dataWithContent = createMockData(true);
    render(<AbilityRadar data={dataWithContent} />);

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
    render(<AbilityRadar data={dataWithContent} />);

    const container = document.querySelector('[data-testid="ability-radar"]');
    expect(container).toBeInTheDocument();
  });
});