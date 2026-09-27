import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './src/app/e2e',
  testMatch: '**/api-auth.spec.ts',
  workers: 1,
  timeout: 45000,
  use: {
    baseURL: 'http://localhost:5176',
    channel: 'msedge',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev -- --host localhost --port 5176 --strictPort',
    url: 'http://localhost:5176',
    reuseExistingServer: true,
    env: { VITE_SERVICE_MODE: 'api', VITE_API_BASE_URL: 'http://localhost:5176' },
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
