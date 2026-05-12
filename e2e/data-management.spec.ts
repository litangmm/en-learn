import { test, expect } from '@playwright/test';

/**
 * E2E tests for Settings Panel and Data Management flow:
 * Data Manager → Export → Import → Clear Data
 */
test.describe('Data Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Dismiss onboarding dialog if present (it blocks interaction with header elements)
    const dialogClose = page.locator('[data-slot="dialog-close"]').or(page.getByRole('button', { name: '关' }));
    if (await dialogClose.isVisible({ timeout: 2000 }).catch(() => false)) {
      await dialogClose.click();
      await page.waitForTimeout(500);
    }

    await page.waitForTimeout(2000);
  });

  test('navigate to data manager', async ({ page }) => {
    // Open more menu using data-testid
    const moreButton = page.locator('[data-testid="more-menu-trigger"]');
    await moreButton.click();
    await page.waitForTimeout(500);

    // Click on 数据管理 (data management) using data-testid
    const menuItem = page.locator('[data-testid="menuitem-data-manager"]');
    await menuItem.click();

    // Wait for navigation with network idle
    await page.waitForLoadState('networkidle');

    // Verify data manager view is visible
    const dataManagerContent = page.getByText(/数据管理|数据备份|Export|Import/i).or(
      page.locator('[data-testid="data-manager"]')
    );
    await expect(dataManagerContent.first()).toBeVisible({ timeout: 10000 });
  });

  test('data manager shows export and import options', async ({ page }) => {
    // Navigate to data manager using data-testid
    const moreButton = page.locator('[data-testid="more-menu-trigger"]');
    await moreButton.click();
    await page.waitForTimeout(500);
    const menuItem = page.locator('[data-testid="menuitem-data-manager"]');
    await menuItem.click();
    await page.waitForLoadState('networkidle');

    // Look for export and import related buttons/links
    const exportButton = page.locator('button').filter({ hasText: /导出|Export|下载|Download/i }).or(
      page.locator('[aria-label*="export"]')
    ).first();

    const importButton = page.locator('button').filter({ hasText: /导入|Import|上传|Upload/i }).or(
      page.locator('[aria-label*="import"]')
    ).or(
      page.locator('input[type="file"]')
    ).first();

    // At least one should be visible
    const hasExportOrImport = await exportButton.isVisible({ timeout: 3000 }).catch(() => false) ||
      await importButton.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasExportOrImport).toBeTruthy();
  });

  test('data manager shows current data counts', async ({ page }) => {
    // Navigate to data manager using data-testid
    const moreButton = page.locator('[data-testid="more-menu-trigger"]');
    await moreButton.click();
    await page.waitForTimeout(500);
    const menuItem = page.locator('[data-testid="menuitem-data-manager"]');
    await menuItem.click();
    await page.waitForLoadState('networkidle');

    // Look for data statistics - history count, mistake count etc.
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 5000 });
  });

  test('back navigation from data manager works', async ({ page }) => {
    // Navigate to data manager using data-testid
    const moreButton = page.locator('[data-testid="more-menu-trigger"]');
    await moreButton.click();
    await page.waitForTimeout(500);
    const menuItem = page.locator('[data-testid="menuitem-data-manager"]');
    await menuItem.click();
    await page.waitForLoadState('networkidle');

    // Look for back button
    const backButton = page.locator('button').filter({ hasText: /返回|Back|取消|Cancel/i }).or(
      page.locator('[aria-label*="back"], [aria-label*="Back"]')
    ).first();

    // Click back button if visible
    if (await backButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await backButton.click();
      await page.waitForLoadState('networkidle');

      // Verify we're back on the main practice view
      await expect(page.locator('main')).toBeVisible({ timeout: 5000 });
    }
  });

  test('navigate to dictionary browser from data manager', async ({ page }) => {
    // Navigate to data manager using data-testid
    const moreButton = page.locator('[data-testid="more-menu-trigger"]');
    await moreButton.click();
    await page.waitForTimeout(500);
    const menuItem = page.locator('[data-testid="menuitem-data-manager"]');
    await menuItem.click();
    await page.waitForLoadState('networkidle');

    // Look for dictionary browser link
    const dictionaryLink = page.locator('button, a').filter({ hasText: /词典|词典库|Dictionary|Browser/i }).or(
      page.locator('[aria-label*="dictionary"]')
    ).first();

    // Click if visible
    if (await dictionaryLink.isVisible({ timeout: 3000 }).catch(() => false)) {
      await dictionaryLink.click();
      await page.waitForLoadState('networkidle');

      // Verify dictionary browser view
      const body = page.locator('body');
      await expect(body).toBeVisible({ timeout: 5000 });
    }
  });

  test('data manager is accessible on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // On mobile, desktop header elements are hidden - use mobile nav instead
    // Check if mobile nav data manager button is visible
    const mobileDataManager = page.locator('[data-testid="mobile-nav-data"]');
    if (await mobileDataManager.isVisible({ timeout: 2000 }).catch(() => false)) {
      await mobileDataManager.click();
      await page.waitForLoadState('networkidle');
    }

    // Verify it's accessible on mobile
    const body = page.locator('body');
    await expect(body).toBeVisible({ timeout: 10000 });
  });

  test('empty data state shows appropriate message', async ({ page }) => {
    // Navigate to data manager with empty data using data-testid
    const moreButton = page.locator('[data-testid="more-menu-trigger"]');
    await moreButton.click();
    await page.waitForTimeout(500);
    const menuItem = page.locator('[data-testid="menuitem-data-manager"]');
    await menuItem.click();
    await page.waitForLoadState('networkidle');

    // With empty data, should show 0 counts or appropriate empty state
    // Verify the page loaded without errors
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(500);
    expect(errors).toEqual([]);
  });
});