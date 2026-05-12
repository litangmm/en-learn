import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { MilestonePath } from '../MilestonePath';
import { MILESTONE_DEFINITIONS, type Milestone } from '@/data/types';

// Test milestone data
const mockMilestones: Milestone[] = [
  { id: '7-days', unlockedAt: Date.now() },
  { id: '14-days', unlockedAt: Date.now() },
];

describe('MilestonePath', () => {
  // -------------------------------------------------------------------------
  // Basic Rendering Tests
  // -------------------------------------------------------------------------

  describe('Basic Rendering', () => {
    it('renders all milestone nodes', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      // Check that all milestone nodes are rendered
      MILESTONE_DEFINITIONS.forEach((milestone) => {
        expect(screen.getByTestId(`milestone-node-${milestone.id}`)).toBeInTheDocument();
      });
    });

    it('renders the milestone path container', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      expect(screen.getByTestId('milestone-path')).toBeInTheDocument();
    });

    it('renders correct number of milestone nodes', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      const nodes = screen.getAllByTestId(/^milestone-node-/);
      expect(nodes).toHaveLength(MILESTONE_DEFINITIONS.length);
    });
  });

  // -------------------------------------------------------------------------
  // Milestone Content Tests
  // -------------------------------------------------------------------------

  describe('Milestone Content', () => {
    it('shows correct icons for each milestone', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      // Check first milestone icon (☀️)
      const firstNode = screen.getByTestId('milestone-node-7-days');
      expect(firstNode).toHaveTextContent('☀️');

      // Check second milestone icon (🌟)
      const secondNode = screen.getByTestId('milestone-node-14-days');
      expect(secondNode).toHaveTextContent('🌟');
    });

    it('displays days threshold for each milestone', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      expect(screen.getByText('7天')).toBeInTheDocument();
      expect(screen.getByText('14天')).toBeInTheDocument();
      expect(screen.getByText('30天')).toBeInTheDocument();
      expect(screen.getByText('60天')).toBeInTheDocument();
      expect(screen.getByText('90天')).toBeInTheDocument();
      expect(screen.getByText('180天')).toBeInTheDocument();
      expect(screen.getByText('365天')).toBeInTheDocument();
    });

    it('displays milestone titles', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      expect(screen.getByText('初露锋芒')).toBeInTheDocument();
      expect(screen.getByText('坚持不懈')).toBeInTheDocument();
      expect(screen.getByText('月度学习者')).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // SVG Connecting Lines Tests
  // -------------------------------------------------------------------------

  describe('SVG Connecting Lines', () => {
    it('renders SVG connecting lines', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      const svgElement = document.querySelector('svg');
      expect(svgElement).toBeInTheDocument();
    });

    it('renders correct number of connecting lines', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      // Should have (count - 1) lines connecting nodes
      const lines = document.querySelectorAll('svg line');
      expect(lines).toHaveLength(MILESTONE_DEFINITIONS.length - 1);
    });

    it('connects all milestone nodes with lines', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS.slice(0, 3)}
          unlockedMilestones={[]}
        />
      );

      const lines = document.querySelectorAll('svg line');
      expect(lines).toHaveLength(2); // 3 milestones = 2 lines
    });
  });

  // -------------------------------------------------------------------------
  // Unlocked State Tests
  // -------------------------------------------------------------------------

  describe('Unlocked State', () => {
    it('shows checkmark on unlocked nodes', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={mockMilestones}
        />
      );

      // First two milestones should have checkmarks
      const unlockedNode1 = screen.getByTestId('milestone-node-7-days');
      const unlockedNode2 = screen.getByTestId('milestone-node-14-days');

      // Check for the checkmark SVG inside unlocked nodes
      const checkmark1 = unlockedNode1.parentElement?.querySelector('.bg-green-500');
      const checkmark2 = unlockedNode2.parentElement?.querySelector('.bg-green-500');

      expect(checkmark1).toBeInTheDocument();
      expect(checkmark2).toBeInTheDocument();
    });

    it('does not show checkmark on locked nodes', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={mockMilestones}
        />
      );

      // Third milestone (30-days) should not have checkmark
      const lockedNode = screen.getByTestId('milestone-node-30-days');
      const checkmark = lockedNode.parentElement?.querySelector('.bg-green-500');

      expect(checkmark).not.toBeInTheDocument();
    });

    it('applies unlocked styling to unlocked nodes', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={mockMilestones}
        />
      );

      const unlockedNode = screen.getByTestId('milestone-node-7-days');
      expect(unlockedNode).toHaveClass('bg-indigo-500');
      expect(unlockedNode).toHaveClass('text-white');
    });

    it('applies locked styling to locked nodes', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      const lockedNode = screen.getByTestId('milestone-node-7-days');
      expect(lockedNode).toHaveClass('bg-slate-100');
      expect(lockedNode).toHaveClass('text-slate-400');
    });
  });

  // -------------------------------------------------------------------------
  // Popup Tests
  // -------------------------------------------------------------------------

  describe('Detail Popup', () => {
    it('opens detail popup on node click', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      // Click on a milestone node
      fireEvent.click(screen.getByTestId('milestone-node-7-days'));

      // Popup should appear
      expect(screen.getByTestId('milestone-popup')).toBeInTheDocument();
      expect(screen.getByTestId('milestone-popup-overlay')).toBeInTheDocument();
    });

    it('displays milestone details in popup', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      fireEvent.click(screen.getByTestId('milestone-node-7-days'));

      // Check popup content - use getAllByText for elements that appear multiple times
      const popup = screen.getByTestId('milestone-popup');
      expect(within(popup).getByText('初露锋芒')).toBeInTheDocument();
      expect(within(popup).getByText('First Week')).toBeInTheDocument();
      expect(within(popup).getByText('7 天学习')).toBeInTheDocument();
    });

    it('displays XP reward in popup', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      fireEvent.click(screen.getByTestId('milestone-node-7-days'));

      expect(screen.getByText('20 XP')).toBeInTheDocument();
    });

    it('shows unlocked status in popup for unlocked milestones', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={mockMilestones}
        />
      );

      fireEvent.click(screen.getByTestId('milestone-node-7-days'));

      expect(screen.getByText('已解锁')).toBeInTheDocument();
    });

    it('shows locked status in popup for locked milestones', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      fireEvent.click(screen.getByTestId('milestone-node-7-days'));

      expect(screen.getByText('未解锁')).toBeInTheDocument();
    });

    it('closes popup on close button click', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      fireEvent.click(screen.getByTestId('milestone-node-7-days'));
      expect(screen.getByTestId('milestone-popup')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('milestone-popup-close'));
      expect(screen.queryByTestId('milestone-popup')).not.toBeInTheDocument();
    });

    it('closes popup on overlay click', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      fireEvent.click(screen.getByTestId('milestone-node-7-days'));
      expect(screen.getByTestId('milestone-popup')).toBeInTheDocument();

      fireEvent.click(screen.getByTestId('milestone-popup-overlay'));
      expect(screen.queryByTestId('milestone-popup')).not.toBeInTheDocument();
    });

    it('does not close popup when clicking inside popup', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      fireEvent.click(screen.getByTestId('milestone-node-7-days'));
      expect(screen.getByTestId('milestone-popup')).toBeInTheDocument();

      // Click on the popup content (not on overlay or close button)
      const popupContent = screen.getByTestId('milestone-popup');
      fireEvent.click(popupContent);

      // Popup should still be visible
      expect(screen.getByTestId('milestone-popup')).toBeInTheDocument();
    });

    it('closes popup on close button inside popup', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      fireEvent.click(screen.getByTestId('milestone-node-7-days'));
      expect(screen.getByTestId('milestone-popup')).toBeInTheDocument();

      // Click the close button inside the popup
      fireEvent.click(screen.getByText('关闭'));
      expect(screen.queryByTestId('milestone-popup')).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Callback Tests
  // -------------------------------------------------------------------------

  describe('Callbacks', () => {
    it('calls onMilestoneClick when node is clicked', () => {
      const handleMilestoneClick = vi.fn();
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
          onMilestoneClick={handleMilestoneClick}
        />
      );

      fireEvent.click(screen.getByTestId('milestone-node-14-days'));
      expect(handleMilestoneClick).toHaveBeenCalledTimes(1);
      expect(handleMilestoneClick).toHaveBeenCalledWith(
        expect.objectContaining({ id: '14-days' })
      );
    });

    it('does not crash when onMilestoneClick is not provided', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      // Should not throw
      expect(() => {
        fireEvent.click(screen.getByTestId('milestone-node-7-days'));
      }).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Edge Cases
  // -------------------------------------------------------------------------

  describe('Edge Cases', () => {
    it('handles empty milestone definitions', () => {
      render(
        <MilestonePath
          milestoneDefinitions={[]}
          unlockedMilestones={[]}
        />
      );

      expect(screen.getByTestId('milestone-path')).toBeInTheDocument();
      const nodes = screen.queryAllByTestId(/^milestone-node-/);
      expect(nodes).toHaveLength(0);
    });

    it('handles single milestone', () => {
      render(
        <MilestonePath
          milestoneDefinitions={[MILESTONE_DEFINITIONS[0]]}
          unlockedMilestones={[]}
        />
      );

      const nodes = screen.getAllByTestId(/^milestone-node-/);
      expect(nodes).toHaveLength(1);

      // No lines for single node
      const lines = document.querySelectorAll('svg line');
      expect(lines).toHaveLength(0);
    });

    it('handles all milestones unlocked', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={MILESTONE_DEFINITIONS.map((m) => ({ id: m.id, unlockedAt: Date.now() }))}
        />
      );

      // All nodes should have checkmarks
      MILESTONE_DEFINITIONS.forEach((milestone) => {
        const node = screen.getByTestId(`milestone-node-${milestone.id}`);
        const checkmark = node.parentElement?.querySelector('.bg-green-500');
        expect(checkmark).toBeInTheDocument();
      });
    });

    it('updates popup content when clicking different nodes', () => {
      render(
        <MilestonePath
          milestoneDefinitions={MILESTONE_DEFINITIONS}
          unlockedMilestones={[]}
        />
      );

      // Click first milestone
      fireEvent.click(screen.getByTestId('milestone-node-7-days'));
      let popup = screen.getByTestId('milestone-popup');
      expect(within(popup).getByText('初露锋芒')).toBeInTheDocument();
      expect(within(popup).getByText('20 XP')).toBeInTheDocument();

      // Close popup
      fireEvent.click(screen.getByTestId('milestone-popup-close'));

      // Click second milestone
      fireEvent.click(screen.getByTestId('milestone-node-14-days'));
      popup = screen.getByTestId('milestone-popup');
      expect(within(popup).getByText('坚持不懈')).toBeInTheDocument();
      expect(within(popup).getByText('50 XP')).toBeInTheDocument();
    });
  });
});
