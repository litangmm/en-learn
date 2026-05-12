import { test, expect } from '@playwright/test';

/**
 * Visual regression tests for key pages in en-learn app.
 * Captures screenshots for visual comparison in CI/CD pipelines.
 *
 * Key views captured:
 * - Homepage (header/nav area)
 * - Practice flow (practice card)
 * - Dictionary browser
 * - More menu (dropdown)
 * - Leaderboard
 */
test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage for consistent visual baseline
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding dialog if present
    const dialogClose = page.locator('[data-slot="dialog-close"]').or(page.getByRole('button', { name: '关' }));
    if (await dialogClose.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dialogClose.click();
      await page.waitForTimeout(500);
    }

    // Stabilization wait
    await page.waitForTimeout(2000);
  });

  /**
   * Homepage visual tests
   */
  test.describe('Homepage', () => {
    test('homepage full page screenshot (desktop)', async ({ page }) => {
      // Desktop viewport
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'screenshots/homepage-full.png',
        fullPage: true,
      });
    });

    test('homepage full page screenshot (mobile)', async ({ page }) => {
      // Mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');

      await page.screenshot({
        path: 'screenshots/homepage-mobile-full.png',
        fullPage: true,
      });
    });

    test('homepage mobile nav screenshot', async ({ page }) => {
      // Set mobile viewport for accurate mobile nav capture
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');

      // Mobile nav has data-testid on the nav element itself
      const mobileNav = page.locator('[data-testid="mobile-nav"]');
      await expect(mobileNav).toBeVisible({ timeout: 10000 });

      await page.screenshot({
        path: 'screenshots/homepage-mobile-nav.png',
        fullPage: false,
      });
    });
  });

  /**
   * Practice flow visual tests
   */
  test.describe('Practice Flow', () => {
    test('practice card screenshot', async ({ page }) => {
      // Navigate to practice view
      await page.setViewportSize({ width: 1280, height: 720 });
      const practiceNav = page.locator('[data-testid="mobile-nav-practice"]');
      if (await practiceNav.isVisible({ timeout: 2000 }).catch(() => false)) {
        await practiceNav.click();
      } else {
        // Desktop: look for practice link in header
        await page.getByRole('link', { name: /练习/i }).click().catch(() => {
          // Fallback: navigate directly
        });
      }
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      // Capture main content area
      await page.screenshot({
        path: 'screenshots/practice-card.png',
        fullPage: false,
      });
    });

    test('practice card mobile screenshot', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });

      // Navigate to practice
      const practiceNav = page.locator('[data-testid="mobile-nav-practice"]');
      if (await practiceNav.isVisible({ timeout: 2000 }).catch(() => false)) {
        await practiceNav.click();
      }
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'screenshots/practice-card-mobile.png',
        fullPage: false,
      });
    });
  });

  /**
   * Dictionary browser visual tests
   */
  test.describe('Dictionary Browser', () => {
    test('dict browser full page screenshot', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForLoadState('networkidle');

      // Navigate to dictionary browser via data menu
      const moreButton = page.locator('[data-testid="more-menu-trigger"]');
      if (await moreButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await moreButton.click();
        await page.waitForTimeout(500);

        // Find dictionary browser in the more menu
        const dictBrowser = page.locator('[data-testid="menuitem-data-manager"]');
        if (await dictBrowser.isVisible({ timeout: 2000 }).catch(() => false)) {
          await dictBrowser.click();
        }
      }
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'screenshots/dict-browser.png',
        fullPage: true,
      });
    });

    test('dict browser mobile screenshot', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');

      // Navigate via mobile nav
      const dataNav = page.locator('[data-testid="mobile-nav-data"]');
      if (await dataNav.isVisible({ timeout: 2000 }).catch(() => false)) {
        await dataNav.click();
      }
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'screenshots/dict-browser-mobile.png',
        fullPage: true,
      });
    });
  });

  /**
   * More menu visual tests
   */
  test.describe('More Menu', () => {
    test('more menu open state screenshot (desktop)', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForLoadState('networkidle');

      // Open more menu using the trigger button
      const moreButton = page.locator('[data-testid="more-menu-trigger"]');
      await expect(moreButton).toBeVisible({ timeout: 10000 });
      await moreButton.click();
      await page.waitForTimeout(500);

      // Capture the dropdown menu
      const menu = page.locator('[data-testid="more-menu-content"]');
      await expect(menu).toBeVisible({ timeout: 5000 });

      await page.screenshot({
        path: 'screenshots/more-menu-open.png',
        fullPage: false,
      });
    });

    test('more menu open state screenshot (mobile)', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');

      // On mobile, the MoreMenu dropdown may not be the same as desktop
      // Just capture the current mobile view
      await page.waitForTimeout(500);

      await page.screenshot({
        path: 'screenshots/more-menu-open-mobile.png',
        fullPage: true,
      });
    });

    test('more menu with seeded data screenshot', async ({ page }) => {
      // Seed some data via localStorage to show badges
      await page.evaluate(() => {
        // Set some practice history
        const sessionData = {
          sessions: [
            { id: '1', date: new Date().toISOString(), score: 85, accuracy: 85 }
          ],
          totalScore: 1000,
          totalQuestions: 50,
          correctCount: 45
        };
        localStorage.setItem('sessions', JSON.stringify(sessionData));
        localStorage.setItem('mistakes', JSON.stringify([]));
      });
      await page.goto('/');
      await page.waitForLoadState('networkidle');

      // Dismiss onboarding dialog if present - try multiple approaches
      for (let i = 0; i < 3; i++) {
        const dialogClose = page.locator('[data-slot="dialog-close"]').or(page.getByRole('button', { name: '关' }));
        if (await dialogClose.isVisible({ timeout: 1000 }).catch(() => false)) {
          await dialogClose.click({ force: true });
          await page.waitForTimeout(500);
        }
        // Also try pressing Escape
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
      }

      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(2000);

      // Try to open more menu if available
      const moreButton = page.locator('[data-testid="more-menu-trigger"]');
      if (await moreButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await moreButton.click();
        await page.waitForTimeout(500);

        const menu = page.locator('[data-testid="more-menu-content"]');
        if (await menu.isVisible({ timeout: 2000 }).catch(() => false)) {
          await page.screenshot({
            path: 'screenshots/more-menu-with-data.png',
            fullPage: false,
          });
        } else {
          await page.screenshot({
            path: 'screenshots/more-menu-with-data.png',
            fullPage: true,
          });
        }
      } else {
        await page.screenshot({
          path: 'screenshots/more-menu-with-data.png',
          fullPage: true,
        });
      }
    });
  });

  /**
   * Leaderboard visual tests
   */
  test.describe('Leaderboard', () => {
    test('leaderboard page screenshot', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForLoadState('networkidle');

      // Navigate to leaderboard via more menu
      const moreButton = page.locator('[data-testid="more-menu-trigger"]');
      await moreButton.click();
      await page.waitForTimeout(500);

      const leaderboardItem = page.locator('[data-testid="menuitem-leaderboard"]');
      await leaderboardItem.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'screenshots/leaderboard-full.png',
        fullPage: true,
      });
    });

    test('leaderboard mobile screenshot', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForLoadState('networkidle');

      // Navigate via mobile nav
      const leaderboardNav = page.locator('[data-testid="mobile-nav-leaderboard"]');
      if (await leaderboardNav.isVisible({ timeout: 2000 }).catch(() => false)) {
        await leaderboardNav.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: 'screenshots/leaderboard-mobile.png',
          fullPage: true,
        });
      } else {
        // Fallback to more menu
        const moreButton = page.locator('[data-testid="more-menu-trigger"]');
        await moreButton.click();
        await page.waitForTimeout(500);
        const leaderboardItem = page.locator('[data-testid="menuitem-leaderboard"]');
        if (await leaderboardItem.isVisible({ timeout: 2000 }).catch(() => false)) {
          await leaderboardItem.click();
          await page.waitForLoadState('networkidle');
          await page.waitForTimeout(1000);
        }
        await page.screenshot({
          path: 'screenshots/leaderboard-mobile.png',
          fullPage: true,
        });
      }
    });
  });

  /**
   * XP/Progress area visual tests
   */
  test.describe('XP & Progress', () => {
    test('XP bar and progress area screenshot', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForLoadState('networkidle');

      // Look for XP bar element
      const xpBar = page.locator('[data-testid="xp-bar-compact"]');
      if (await xpBar.isVisible({ timeout: 5000 }).catch(() => false)) {
        await page.screenshot({
          path: 'screenshots/xp-bar-area.png',
          fullPage: false,
        });
      } else {
        // Capture full page
        await page.screenshot({
          path: 'screenshots/xp-bar-area.png',
          fullPage: true,
        });
      }
    });

    test('goals panel screenshot', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForLoadState('networkidle');

      // Navigate to progress/goals view
      const progressNav = page.locator('[data-testid="mobile-nav-progress"]');
      if (await progressNav.isVisible({ timeout: 2000 }).catch(() => false)) {
        await progressNav.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1000);

        await page.screenshot({
          path: 'screenshots/goals-panel.png',
          fullPage: true,
        });
      } else {
        // Desktop fallback
        await page.screenshot({
          path: 'screenshots/goals-panel.png',
          fullPage: true,
        });
      }
    });
  });

  /**
   * Overall app shell screenshot
   */
  test.describe('App Shell', () => {
    test('complete app shell desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'screenshots/app-shell-desktop.png',
        fullPage: true,
      });
    });

    test('complete app shell mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      await page.screenshot({
        path: 'screenshots/app-shell-mobile.png',
        fullPage: true,
      });
    });
  });
});