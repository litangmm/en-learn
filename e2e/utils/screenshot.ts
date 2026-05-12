import type { Page } from '@playwright/test';

/**
 * Screenshot configuration options
 */
export interface ScreenshotOptions {
  /** Screenshot filename (without extension) */
  name: string;
  /** Output directory for screenshots */
  outputDir?: string;
  /** Whether to capture the full page (default: false for components) */
  fullPage?: boolean;
  /** Additional locator selector to capture specific element */
  selector?: string;
  /** Clip region for screenshot */
  clip?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Captures a screenshot and saves it to the specified path.
 * @param page - Playwright Page instance
 * @param options - Screenshot configuration options
 * @returns Promise resolving to the screenshot file path
 */
export async function captureScreenshot(
  page: Page,
  options: ScreenshotOptions
): Promise<string> {
  const { name, outputDir = 'screenshots', fullPage = false, selector, clip } = options;

  // Ensure output directory exists
  const fs = await import('fs');
  const path = await import('path');
  const fullOutputDir = path.resolve(outputDir);

  if (!fs.existsSync(fullOutputDir)) {
    fs.mkdirSync(fullOutputDir, { recursive: true });
  }

  const screenshotOptions: Parameters<typeof page.screenshot>[0] = {
    fullPage,
    timeout: 30000,
  };

  // Add clip if specified
  if (clip) {
    screenshotOptions.clip = clip;
  }

  const screenshotPath = path.join(fullOutputDir, `${name}.png`);

  try {
    if (selector) {
      // Capture specific element
      const element = page.locator(selector);
      await element.waitFor({ state: 'visible', timeout: 10000 });
      await element.screenshot({ path: screenshotPath, ...screenshotOptions });
    } else {
      // Capture full page or viewport
      await page.screenshot({ path: screenshotPath, ...screenshotOptions });
    }
    return screenshotPath;
  } catch (error) {
    throw new Error(`Failed to capture screenshot "${name}": ${error}`);
  }
}

/**
 * Captures the header area of the page.
 * Assumes header has a specific structure - adjust selector as needed.
 * @param page - Playwright Page instance
 * @param options - Optional screenshot configuration
 * @returns Promise resolving to the screenshot file path
 */
export async function captureHeader(
  page: Page,
  options?: Partial<Omit<ScreenshotOptions, 'name' | 'selector'>>
): Promise<string> {
  // Common header selectors - adjust based on actual implementation
  const headerSelector = 'header, [data-testid="header"], .header, .app-header';

  return captureScreenshot(page, {
    name: `header-${Date.now()}`,
    selector: headerSelector,
    fullPage: false,
    ...options,
  });
}

/**
 * Captures the practice card component.
 * @param page - Playwright Page instance
 * @param options - Optional screenshot configuration
 * @returns Promise resolving to the screenshot file path
 */
export async function capturePracticeCard(
  page: Page,
  options?: Partial<Omit<ScreenshotOptions, 'name' | 'selector'>>
): Promise<string> {
  // Practice card selector - adjust based on actual implementation
  const practiceCardSelector = '[data-testid="practice-card"], .practice-card, .card';

  return captureScreenshot(page, {
    name: `practice-card-${Date.now()}`,
    selector: practiceCardSelector,
    fullPage: false,
    ...options,
  });
}

/**
 * Captures the dictionary browser component.
 * @param page - Playwright Page instance
 * @param options - Optional screenshot configuration
 * @returns Promise resolving to the screenshot file path
 */
export async function captureDictBrowser(
  page: Page,
  options?: Partial<Omit<ScreenshotOptions, 'name' | 'selector'>>
): Promise<string> {
  // Dictionary browser selector - adjust based on actual implementation
  const dictBrowserSelector = '[data-testid="dict-browser"], .dict-browser, .dictionary-browser';

  return captureScreenshot(page, {
    name: `dict-browser-${Date.now()}`,
    selector: dictBrowserSelector,
    fullPage: false,
    ...options,
  });
}

/**
 * Captures the more menu component.
 * @param page - Playwright Page instance
 * @param options - Optional screenshot configuration
 * @returns Promise resolving to the screenshot file path
 */
export async function captureMoreMenu(
  page: Page,
  options?: Partial<Omit<ScreenshotOptions, 'name' | 'selector'>>
): Promise<string> {
  // More menu selector - adjust based on actual implementation
  const moreMenuSelector = '[data-testid="more-menu"], .more-menu, .menu-dropdown, [aria-label="More menu"]';

  return captureScreenshot(page, {
    name: `more-menu-${Date.now()}`,
    selector: moreMenuSelector,
    fullPage: false,
    ...options,
  });
}

/**
 * Captures the leaderboard component.
 * @param page - Playwright Page instance
 * @param options - Optional screenshot configuration
 * @returns Promise resolving to the screenshot file path
 */
export async function captureLeaderboard(
  page: Page,
  options?: Partial<Omit<ScreenshotOptions, 'name' | 'selector'>>
): Promise<string> {
  // Leaderboard selector - adjust based on actual implementation
  const leaderboardSelector = '[data-testid="leaderboard"], .leaderboard, [aria-label*="leaderboard" i]';

  return captureScreenshot(page, {
    name: `leaderboard-${Date.now()}`,
    selector: leaderboardSelector,
    fullPage: false,
    ...options,
  });
}

/**
 * Captures all key view states in sequence.
 * @param page - Playwright Page instance
 * @param outputDir - Directory to save screenshots
 * @returns Promise resolving to array of screenshot file paths
 */
export async function captureAllViews(
  page: Page,
  outputDir: string = 'screenshots/baseline'
): Promise<string[]> {
  const results: string[] = [];

  const capturePromises = [
    captureHeader(page, { outputDir }),
    capturePracticeCard(page, { outputDir }),
    captureDictBrowser(page, { outputDir }),
    captureMoreMenu(page, { outputDir }),
    captureLeaderboard(page, { outputDir }),
  ];

  const settled = await Promise.allSettled(capturePromises);

  settled.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      results.push(result.value);
    } else {
      console.error(`Failed to capture view ${index}: ${result.reason}`);
    }
  });

  return results;
}