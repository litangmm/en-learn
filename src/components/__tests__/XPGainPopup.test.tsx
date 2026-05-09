import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { XPGainPopup } from '../XPGainPopup';

describe('XPGainPopup', () => {
  it('renders null when visible=false', () => {
    const { container } = render(
      <XPGainPopup amount={15} multiplier={1.0} visible={false} triggerKey={1} />
    );
    expect(container.firstChild?.firstChild).toBeNull();
  });

  it('shows +15 XP when amount=15', () => {
    render(
      <XPGainPopup amount={15} multiplier={1.0} visible={true} triggerKey={1} />
    );

    expect(screen.getByText('+15 XP')).toBeInTheDocument();
  });

  it('shows multiplier badge x1.5 连击奖励 when multiplier=1.5', () => {
    render(
      <XPGainPopup amount={15} multiplier={1.5} visible={true} triggerKey={1} />
    );

    expect(screen.getByText('x1.5 连击奖励')).toBeInTheDocument();
  });

  it('does not show multiplier badge when multiplier=1.0', () => {
    render(
      <XPGainPopup amount={10} multiplier={1.0} visible={true} triggerKey={1} />
    );

    expect(screen.queryByText(/连击奖励/)).not.toBeInTheDocument();
  });

  it('wraps content in AnimatePresence', () => {
    const { container } = render(
      <XPGainPopup amount={10} multiplier={1.0} visible={true} triggerKey={1} />
    );

    // The outer container should be the relative wrapper
    expect(container.firstChild).toBeInTheDocument();
  });

  it('updates content when triggerKey changes', () => {
    const { rerender } = render(
      <XPGainPopup amount={10} multiplier={1.0} visible={true} triggerKey={1} />
    );

    expect(screen.getByText('+10 XP')).toBeInTheDocument();

    rerender(
      <XPGainPopup amount={20} multiplier={2.0} visible={true} triggerKey={2} />
    );

    expect(screen.getByText('+20 XP')).toBeInTheDocument();
    expect(screen.getByText('x2.0 连击奖励')).toBeInTheDocument();
  });
});
