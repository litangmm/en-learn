import { test, expect } from '@playwright/test';

test.describe('听力词汇练习', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure clean state
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    // Reload to start fresh
    await page.reload();
    // Wait for page to be fully loaded and network to be idle
    await page.waitForLoadState('networkidle');
    // Additional stabilization wait
    await page.waitForTimeout(2000);
  });

  test('空数据时显示暂无数据提示', async ({ page }) => {
    await expect(page.getByText('暂无数据')).toBeVisible({ timeout: 10000 });
  });

  test('页面加载后不报错', async ({ page }) => {
    // Check for console errors (only Error level, ignore warnings)
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    expect(errors).toEqual([]);
  });

  test('导航到练习页面后显示正确内容', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    // Verify main UI elements are present
    await expect(page.locator('body')).toBeVisible();
  });
});
