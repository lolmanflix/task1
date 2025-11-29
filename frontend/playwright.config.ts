import { defineConfig } from '@playwright/test';

export default defineConfig({
  timeout: 60_000,
  testDir: 'tests/e2e',
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    viewport: { width: 1280, height: 800 },
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
