import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // Enable parallel execution for faster test runs
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // Retry on failure to handle transient failures
  retries: 2,
  // 2 workers for balanced parallelization without overwhelming resources
  workers: process.env.CI ? 2 : 2,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    // Record video on retry for CI debugging
    video: 'on-first-retry',
    // Stable timeouts for CI reliability
    actionTimeout: 15000,
    expect: {
      timeout: 10000,
    },
  },
  // 60s per test overall timeout
  timeout: 60000,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
  },
});