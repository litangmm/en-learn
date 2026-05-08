import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';

describe('ProgressBar', () => {
  it('renders progress label and current/total count', () => {
    render(<ProgressBar progress={50} current={3} total={6} />);

    expect(screen.getByText('进度')).toBeInTheDocument();
    expect(screen.getByText('3 / 6')).toBeInTheDocument();
  });

  it('renders with 0 progress', () => {
    render(<ProgressBar progress={0} current={0} total={10} />);

    expect(screen.getByText('0 / 10')).toBeInTheDocument();
  });

  it('renders with 100 progress', () => {
    render(<ProgressBar progress={100} current={10} total={10} />);

    expect(screen.getByText('10 / 10')).toBeInTheDocument();
  });

  it('renders the progress bar track and fill', () => {
    const { container } = render(<ProgressBar progress={75} current={6} total={8} />);

    const progressFill = container.querySelector('[style*="width"]');
    expect(progressFill).toBeInTheDocument();
  });
});
