import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InterventionPanel } from '../InterventionPanel';
import type { Intervention, InterventionLevel, SnoozeConfig } from '@/data/types';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create a mock intervention.
 */
function createIntervention(
  level: InterventionLevel = 'high',
  snoozeOptions: SnoozeConfig[] = [
    { duration: 24 * 60 * 60 * 1000, label: '稍后提醒' },
    { duration: 48 * 60 * 60 * 1000, label: '两天后再看' },
    { duration: 7 * 24 * 60 * 60 * 1000, label: '下周再说' },
  ]
): Intervention {
  return {
    id: `intervention_${level}`,
    level,
    action: level === 'critical' ? 'modal' : level === 'high' ? 'banner' : 'toast',
    message: level === 'critical'
      ? '流失风险危急！请立即行动恢复学习！'
      : level === 'high'
      ? '流失风险较高。今天开始练习，避免学习中断。'
      : '保持学习节奏。建议今天完成一次练习。',
    ctaText: level === 'critical' ? '立即开始' : level === 'high' ? '开始练习' : '去练习',
    snoozeOptions,
    createdAt: Date.now(),
  };
}

// ============================================================================
// InterventionPanel Tests
// ============================================================================

describe('InterventionPanel', () => {
  describe('Render', () => {
    it('renders panel with correct testid', () => {
      const intervention = createIntervention('high');
      render(
        <InterventionPanel
          intervention={intervention}
          onEngage={() => {}}
          onDismiss={() => {}}
          onSnooze={() => {}}
        />
      );

      expect(screen.getByTestId('intervention-panel')).toBeTruthy();
    });

    it('renders backdrop with correct testid', () => {
      const intervention = createIntervention('critical');
      render(
        <InterventionPanel
          intervention={intervention}
          onEngage={() => {}}
          onDismiss={() => {}}
          onSnooze={() => {}}
        />
      );

      expect(screen.getByTestId('intervention-panel-backdrop')).toBeTruthy();
    });

    it('renders dismiss button with correct testid', () => {
      const intervention = createIntervention('critical');
      render(
        <InterventionPanel
          intervention={intervention}
          onEngage={() => {}}
          onDismiss={() => {}}
          onSnooze={() => {}}
        />
      );

      expect(screen.getByTestId('intervention-panel-dismiss')).toBeTruthy();
    });

    it('renders engage button with correct testid', () => {
      const intervention = createIntervention('high');
      render(
        <InterventionPanel
          intervention={intervention}
          onEngage={() => {}}
          onDismiss={() => {}}
          onSnooze={() => {}}
        />
      );

      expect(screen.getByTestId('intervention-panel-engage')).toBeTruthy();
    });
  });

  describe('Severity variants', () => {
    it('renders correctly for critical level', () => {
      const intervention = createIntervention('critical');
      const { container } = render(
        <InterventionPanel
          intervention={intervention}
          onEngage={() => {}}
          onDismiss={() => {}}
          onSnooze={() => {}}
        />
      );

      // Should render without error
      expect(container).toBeTruthy();
    });

    it('renders correctly for high level', () => {
      const intervention = createIntervention('high');
      const { container } = render(
        <InterventionPanel
          intervention={intervention}
          onEngage={() => {}}
          onDismiss={() => {}}
          onSnooze={() => {}}
        />
      );

      expect(container).toBeTruthy();
    });

    it('renders correctly for medium level', () => {
      const intervention = createIntervention('medium');
      const { container } = render(
        <InterventionPanel
          intervention={intervention}
          onEngage={() => {}}
          onDismiss={() => {}}
          onSnooze={() => {}}
        />
      );

      expect(container).toBeTruthy();
    });
  });

  describe('Snooze buttons', () => {
    it('renders snooze buttons when snooze options provided', () => {
      const snoozeOptions = [
        { duration: 24 * 60 * 60 * 1000, label: '24小时' },
        { duration: 48 * 60 * 60 * 1000, label: '48小时' },
      ];
      const intervention = createIntervention('high', snoozeOptions);
      render(
        <InterventionPanel
          intervention={intervention}
          onEngage={() => {}}
          onDismiss={() => {}}
          onSnooze={() => {}}
          snoozeOptions={snoozeOptions}
        />
      );

      expect(screen.getByTestId('intervention-panel-snooze-0')).toBeTruthy();
      expect(screen.getByTestId('intervention-panel-snooze-1')).toBeTruthy();
    });

    it('does not render snooze buttons when no options provided', () => {
      const intervention = createIntervention('critical', []);
      render(
        <InterventionPanel
          intervention={intervention}
          onEngage={() => {}}
          onDismiss={() => {}}
          onSnooze={() => {}}
          snoozeOptions={[]}
        />
      );

      expect(screen.queryByTestId('intervention-panel-snooze-0')).toBeNull();
    });
  });

  describe('Callbacks', () => {
    it('calls onEngage when engage button clicked', () => {
      const onEngage = vi.fn();
      const intervention = createIntervention('high');
      render(
        <InterventionPanel
          intervention={intervention}
          onEngage={onEngage}
          onDismiss={() => {}}
          onSnooze={() => {}}
        />
      );

      fireEvent.click(screen.getByTestId('intervention-panel-engage'));
      expect(onEngage).toHaveBeenCalledTimes(1);
    });

    it('calls onDismiss when dismiss button clicked', () => {
      const onDismiss = vi.fn();
      const intervention = createIntervention('critical');
      render(
        <InterventionPanel
          intervention={intervention}
          onEngage={() => {}}
          onDismiss={onDismiss}
          onSnooze={() => {}}
        />
      );

      fireEvent.click(screen.getByTestId('intervention-panel-dismiss'));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('calls onSnooze when snooze button clicked', () => {
      const onSnooze = vi.fn();
      const snoozeOptions = [
        { duration: 24 * 60 * 60 * 1000, label: '24小时' },
      ];
      const intervention = createIntervention('high', snoozeOptions);
      render(
        <InterventionPanel
          intervention={intervention}
          onEngage={() => {}}
          onDismiss={() => {}}
          onSnooze={onSnooze}
          snoozeOptions={snoozeOptions}
        />
      );

      fireEvent.click(screen.getByTestId('intervention-panel-snooze-0'));
      expect(onSnooze).toHaveBeenCalledWith(24 * 60 * 60 * 1000);
    });
  });
});