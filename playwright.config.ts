import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/ui',
  fullyParallel: false,
  workers: 1,
  use: {
    launchOptions: { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE },
    baseURL: 'http://127.0.0.1:5173',
    viewport: { width: 1360, height: 900 },
    locale: 'zh-CN',
    reducedMotion: 'reduce',
    screenshot: 'only-on-failure',
  },
  webServer: { command: 'pnpm dev:web', url: 'http://127.0.0.1:5173', reuseExistingServer: true },
});
