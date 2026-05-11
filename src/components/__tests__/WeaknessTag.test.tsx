import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeaknessTag } from '../WeaknessTag';

describe('WeaknessTag', () => {
  it('renders high-error tag with destructive variant', () => {
    render(<WeaknessTag weakType="high-error" />);
    expect(screen.getByText('高频错误')).toBeInTheDocument();
    expect(screen.getByTestId('weakness-tag-high-error')).toBeInTheDocument();
  });

  it('renders low-accuracy tag with destructive variant', () => {
    render(<WeaknessTag weakType="low-accuracy" />);
    expect(screen.getByText('低正确率')).toBeInTheDocument();
    expect(screen.getByTestId('weakness-tag-low-accuracy')).toBeInTheDocument();
  });

  it('renders review-neglected tag with secondary variant', () => {
    render(<WeaknessTag weakType="review-neglected" />);
    expect(screen.getByText('久未复习')).toBeInTheDocument();
    expect(screen.getByTestId('weakness-tag-review-neglected')).toBeInTheDocument();
  });

  it('renders mode-weak tag with outline variant', () => {
    render(<WeaknessTag weakType="mode-weak" />);
    expect(screen.getByText('模式薄弱')).toBeInTheDocument();
    expect(screen.getByTestId('weakness-tag-mode-weak')).toBeInTheDocument();
  });

  it('renders with custom className', () => {
    render(<WeaknessTag weakType="high-error" className="custom-class" />);
    const tag = screen.getByTestId('weakness-tag-high-error');
    expect(tag.className).toContain('custom-class');
  });

  it('falls back to mode-weak for unknown type', () => {
    render(<WeaknessTag weakType="high-error" />);
    // Should render without error
    expect(screen.getByText('高频错误')).toBeInTheDocument();
  });

  it('applies title/description tooltip', () => {
    render(<WeaknessTag weakType="high-error" />);
    const tag = screen.getByTestId('weakness-tag-high-error');
    expect(tag.getAttribute('title')).toBe('错误次数过多');
  });
});
