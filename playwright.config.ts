import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  // Disable parallel to reduce test flakiness from shared state
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  // Always retry on failure to handle transient failures
  retries: 2,
  // Single worker for maximum stability (no parallel interference)
  workers: 1,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
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