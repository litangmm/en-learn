import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViewNavigator } from '../ViewRouter';
import type { View } from '../ViewRouter';

describe('ViewNavigator', () => {
  describe('Constructor', () => {
    it('throws error if setView is not a function', () => {
      expect(() => new ViewNavigator(null as unknown as (_view: View) => void)).toThrow(
        'ViewNavigator requires a setView function',
      );
    });

    it('throws error if setView is null', () => {
      expect(() => new ViewNavigator(null as unknown as (_view: View) => void)).toThrow(
        'ViewNavigator requires a setView function',
      );
    });

    it('throws error if setView is undefined', () => {
      expect(() => new ViewNavigator(undefined as unknown as (_view: View) => void)).toThrow(
        'ViewNavigator requires a setView function',
      );
    });

    it('throws error if setView is a number', () => {
      expect(() => new ViewNavigator(123 as unknown as (_view: View) => void)).toThrow(
        'ViewNavigator requires a setView function',
      );
    });

    it('throws error if setView is an object', () => {
      expect(() => new ViewNavigator({} as unknown as (_view: View) => void)).toThrow(
        'ViewNavigator requires a setView function',
      );
    });

    it('accepts valid setView function', () => {
      const setView = vi.fn();
      expect(() => new ViewNavigator(setView)).not.toThrow();
    });
  });

  describe('navigate()', () => {
    let setView: (_view: View) => void;
    let navigator: ViewNavigator;

    beforeEach(() => {
      setView = vi.fn();
      navigator = new ViewNavigator(setView);
    });

    it('calls setView with practice', () => {
      navigator.navigate('practice');
      expect(setView).toHaveBeenCalledWith('practice');
    });

    it('calls setView with progress', () => {
      navigator.navigate('progress');
      expect(setView).toHaveBeenCalledWith('progress');
    });

    it('calls setView with profile', () => {
      navigator.navigate('profile');
      expect(setView).toHaveBeenCalledWith('profile');
    });

    it('calls setView with efficiency', () => {
      navigator.navigate('efficiency');
      expect(setView).toHaveBeenCalledWith('efficiency');
    });

    it('calls setView with mistake-book', () => {
      navigator.navigate('mistake-book');
      expect(setView).toHaveBeenCalledWith('mistake-book');
    });

    it('calls setView with history', () => {
      navigator.navigate('history');
      expect(setView).toHaveBeenCalledWith('history');
    });

    it('calls setView with data', () => {
      navigator.navigate('data');
      expect(setView).toHaveBeenCalledWith('data');
    });

    it('calls setView with review', () => {
      navigator.navigate('review');
      expect(setView).toHaveBeenCalledWith('review');
    });

    it('calls setView with weakness', () => {
      navigator.navigate('weakness');
      expect(setView).toHaveBeenCalledWith('weakness');
    });

    it('calls setView with challenges', () => {
      navigator.navigate('challenges');
      expect(setView).toHaveBeenCalledWith('challenges');
    });

    it('calls setView with badges', () => {
      navigator.navigate('badges');
      expect(setView).toHaveBeenCalledWith('badges');
    });

    it('calls setView with leaderboard', () => {
      navigator.navigate('leaderboard');
      expect(setView).toHaveBeenCalledWith('leaderboard');
    });

    it('calls setView with invite', () => {
      navigator.navigate('invite');
      expect(setView).toHaveBeenCalledWith('invite');
    });

    it('calls setView with dictionary-browser', () => {
      navigator.navigate('dictionary-browser');
      expect(setView).toHaveBeenCalledWith('dictionary-browser');
    });

    it('calls setView with goals', () => {
      navigator.navigate('goals');
      expect(setView).toHaveBeenCalledWith('goals');
    });

    it('calls setView with churn-dashboard', () => {
      navigator.navigate('churn-dashboard');
      expect(setView).toHaveBeenCalledWith('churn-dashboard');
    });

    it('calls setView with learn-insight', () => {
      navigator.navigate('learn-insight');
      expect(setView).toHaveBeenCalledWith('learn-insight');
    });
  });

  describe('goBack()', () => {
    it('calls setView with practice', () => {
      const setView = vi.fn();
      const navigator = new ViewNavigator(setView);

      navigator.goBack();

      expect(setView).toHaveBeenCalledWith('practice');
    });

    it('calls setView only once', () => {
      const setView = vi.fn();
      const navigator = new ViewNavigator(setView);

      navigator.goBack();

      expect(setView).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integration', () => {
    it('multiple navigate calls work sequentially', () => {
      const setView = vi.fn();
      const navigator = new ViewNavigator(setView);

      navigator.navigate('progress');
      navigator.navigate('badges');
      navigator.navigate('leaderboard');

      expect(setView).toHaveBeenCalledTimes(3);
      expect(setView).toHaveBeenNthCalledWith(1, 'progress');
      expect(setView).toHaveBeenNthCalledWith(2, 'badges');
      expect(setView).toHaveBeenNthCalledWith(3, 'leaderboard');
    });

    it('goBack after navigate returns to practice', () => {
      const setView = vi.fn();
      const navigator = new ViewNavigator(setView);

      navigator.navigate('progress');
      navigator.goBack();

      expect(setView).toHaveBeenCalledTimes(2);
      expect(setView).toHaveBeenNthCalledWith(1, 'progress');
      expect(setView).toHaveBeenNthCalledWith(2, 'practice');
    });

    it('can navigate back after navigating to multiple views', () => {
      const setView = vi.fn();
      const navigator = new ViewNavigator(setView);

      navigator.navigate('history');
      navigator.navigate('mistake-book');
      navigator.navigate('review');
      navigator.goBack();

      expect(setView).toHaveBeenCalledTimes(4);
      expect(setView).toHaveBeenNthCalledWith(4, 'practice');
    });
  });
});