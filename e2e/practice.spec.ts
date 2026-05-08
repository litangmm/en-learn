import { test, expect } from '@playwright/test';

test.describe('听力词汇练习', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);
  });

  test('空数据时显示暂无数据提示', async ({ page }) => {
    await expect(page.getByText('暂无数据')).toBeVisible();
  });

  test('页面加载后不报错', async ({ page }) => {
    // 检查控制台没有严重错误
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    expect(errors).toEqual([]);
  });
});
