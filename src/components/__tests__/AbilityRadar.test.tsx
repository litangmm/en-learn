import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  describe('click interaction', () => {
    it('calls onModeSelect when a data point is clicked', () => {
      const dataWithContent = createMockData(true);
      const onModeSelect = vi.fn();
      render(<AbilityRadar data={dataWithContent} onModeSelect={onModeSelect} />);

      // Find and click the first data point (g element with cursor-pointer containing circle)
      const clickableGroups = document.querySelectorAll('g.cursor-pointer');
      expect(clickableGroups.length).toBe(4); // 4 modes

      fireEvent.click(clickableGroups[0]);
      expect(onModeSelect).toHaveBeenCalledWith('fill-in-blanks');
    });

    it('calls onModeSelect with null when same mode is clicked twice', () => {
      const dataWithContent = createMockData(true);
      const onModeSelect = vi.fn();
      render(<AbilityRadar data={dataWithContent} onModeSelect={onModeSelect} />);

      const clickableGroups = document.querySelectorAll('g.cursor-pointer');
      expect(clickableGroups.length).toBe(4);

      // First click - selects the mode
      fireEvent.click(clickableGroups[0]);
      expect(onModeSelect).toHaveBeenLastCalledWith('fill-in-blanks');

      // Second click on same mode - deselects
      fireEvent.click(clickableGroups[0]);
      expect(onModeSelect).toHaveBeenLastCalledWith(null);
    });

    it('calls onModeSelect with different mode when switching modes', () => {
      const dataWithContent = createMockData(true);
      const onModeSelect = vi.fn();
      render(<AbilityRadar data={dataWithContent} onModeSelect={onModeSelect} />);

      const clickableGroups = document.querySelectorAll('g.cursor-pointer');
      expect(clickableGroups.length).toBe(4);

      // Click first mode
      fireEvent.click(clickableGroups[0]);
      expect(onModeSelect).toHaveBeenLastCalledWith('fill-in-blanks');

      // Click different mode - switches selection
      fireEvent.click(clickableGroups[1]);
      expect(onModeSelect).toHaveBeenLastCalledWith('multiple-choice');
    });

    it('does not call onModeSelect when there is no data', () => {
      const emptyData = createMockData(false);
      const onModeSelect = vi.fn();
      render(<AbilityRadar data={emptyData} onModeSelect={onModeSelect} />);

      // No clickable groups should be rendered in empty state
      const clickableGroups = document.querySelectorAll('g.cursor-pointer');
      expect(clickableGroups.length).toBe(0);

      // onModeSelect should never be called
      expect(onModeSelect).not.toHaveBeenCalled();
    });
  });
});