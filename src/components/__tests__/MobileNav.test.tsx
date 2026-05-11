import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { MobileNav } from '../MobileNav';

describe('MobileNav', () => {
  const mockOnNavigate = vi.fn();

  beforeEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders 6 nav items with correct labels', () => {
    render(
      <MobileNav currentView="practice" onNavigate={mockOnNavigate} />
    );

    expect(screen.getByLabelText('练习')).toBeInTheDocument();
    expect(screen.getByLabelText('进度')).toBeInTheDocument();
    expect(screen.getByLabelText('错题')).toBeInTheDocument();
    expect(screen.getByLabelText('记录')).toBeInTheDocument();
    expect(screen.getByLabelText('数据')).toBeInTheDocument();
    expect(screen.getByLabelText('成就')).toBeInTheDocument();
  });

  it('highlights active view with blue styling', () => {
    render(
      <MobileNav currentView="practice" onNavigate={mockOnNavigate} />
    );

    const practiceButton = screen.getByLabelText('练习');
    expect(practiceButton).toHaveClass('text-blue-600');

    const progressButton = screen.getByLabelText('进度');
    expect(progressButton).toHaveClass('text-slate-400');
  });

  it('fires onNavigate with correct view id when clicked', () => {
    render(
      <MobileNav currentView="practice" onNavigate={mockOnNavigate} />
    );

    fireEvent.click(screen.getByLabelText('进度'));
    expect(mockOnNavigate).toHaveBeenCalledWith('progress');

    fireEvent.click(screen.getByLabelText('错题'));
    expect(mockOnNavigate).toHaveBeenCalledWith('mistake-book');

    fireEvent.click(screen.getByLabelText('记录'));
    expect(mockOnNavigate).toHaveBeenCalledWith('history');

    fireEvent.click(screen.getByLabelText('数据'));
    expect(mockOnNavigate).toHaveBeenCalledWith('data');
  });

  it('shows mistake count badge when > 0', () => {
    render(
      <MobileNav
        currentView="practice"
        onNavigate={mockOnNavigate}
        mistakeCount={5}
      />
    );

    const mistakeButton = screen.getByLabelText('错题');
    expect(mistakeButton.textContent).toContain('5');
  });

  it('shows history count badge when > 0', () => {
    render(
      <MobileNav
        currentView="practice"
        onNavigate={mockOnNavigate}
        historyCount={3}
      />
    );

    const historyButton = screen.getByLabelText('记录');
    expect(historyButton.textContent).toContain('3');
  });

  it('hides badges when counts are 0', () => {
    render(
      <MobileNav
        currentView="practice"
        onNavigate={mockOnNavigate}
        mistakeCount={0}
        historyCount={0}
        reviewDueCount={0}
      />
    );

    expect(screen.getByLabelText('错题').textContent).not.toMatch(/\d/);
    expect(screen.getByLabelText('记录').textContent).not.toMatch(/\d/);
  });

  it('has md:hidden class to hide on desktop', () => {
    render(
      <MobileNav currentView="practice" onNavigate={mockOnNavigate} />
    );

    const nav = screen.getByTestId('mobile-nav');
    expect(nav).toHaveClass('md:hidden');
  });
});
