import { describe, it, expect } from 'vitest';
import { isRecentShareTrigger, type ShareTrigger } from '@/lib/shareTriggers';

describe('isRecentShareTrigger frequency control', () => {
  it('returns false for empty triggers array', () => {
    expect(isRecentShareTrigger([], 'levelup', '2')).toBe(false);
  });

  it('returns true for same type+id within 5 minutes', () => {
    const now = Date.now();
    const triggers: ShareTrigger[] = [{ type: 'levelup', id: '2', timestamp: now }];
    expect(isRecentShareTrigger(triggers, 'levelup', '2')).toBe(true);
  });

  it('returns false for same type+id after 5 minutes', () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000 - 1;
    const triggers: ShareTrigger[] = [{ type: 'levelup', id: '2', timestamp: fiveMinutesAgo }];
    expect(isRecentShareTrigger(triggers, 'levelup', '2')).toBe(false);
  });

  it('returns false for different type', () => {
    const now = Date.now();
    const triggers: ShareTrigger[] = [{ type: 'badge', id: '1', timestamp: now }];
    expect(isRecentShareTrigger(triggers, 'levelup', '2')).toBe(false);
  });

  it('returns false for different id', () => {
    const now = Date.now();
    const triggers: ShareTrigger[] = [{ type: 'levelup', id: '3', timestamp: now }];
    expect(isRecentShareTrigger(triggers, 'levelup', '2')).toBe(false);
  });

  it('returns true when one of multiple triggers matches within 5 minutes', () => {
    const now = Date.now();
    const triggers: ShareTrigger[] = [
      { type: 'badge', id: '1', timestamp: now - 60000 },
      { type: 'levelup', id: '2', timestamp: now },
      { type: 'levelup', id: '3', timestamp: now - 120000 },
    ];
    expect(isRecentShareTrigger(triggers, 'levelup', '2')).toBe(true);
  });

  it('filters out old triggers before checking', () => {
    const now = Date.now();
    const threeMinutesAgo = now - 3 * 60 * 1000;
    const sixMinutesAgo = now - 6 * 60 * 1000;
    const triggers: ShareTrigger[] = [
      { type: 'levelup', id: '1', timestamp: sixMinutesAgo },
      { type: 'levelup', id: '2', timestamp: threeMinutesAgo },
    ];
    // id '1' should be filtered out (older than 5 minutes), id '2' should still match
    expect(isRecentShareTrigger(triggers, 'levelup', '2')).toBe(true);
    expect(isRecentShareTrigger(triggers, 'levelup', '1')).toBe(false);
  });

  it('handles exact 5-minute boundary correctly', () => {
    const exactlyFiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const triggers: ShareTrigger[] = [{ type: 'levelup', id: '2', timestamp: exactlyFiveMinutesAgo }];
    // At exactly 5 minutes, the trigger is NOT included (uses > not >=)
    expect(isRecentShareTrigger(triggers, 'levelup', '2')).toBe(false);
  });

  it('works with badge type triggers', () => {
    const now = Date.now();
    const triggers: ShareTrigger[] = [{ type: 'badge', id: 'first-badge', timestamp: now }];
    expect(isRecentShareTrigger(triggers, 'badge', 'first-badge')).toBe(true);
    expect(isRecentShareTrigger(triggers, 'badge', 'other-badge')).toBe(false);
  });
});