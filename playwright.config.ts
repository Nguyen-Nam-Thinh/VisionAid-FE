import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './src/app/e2e',
  testMatch: '**/*.spec.ts',
  testIgnore: '**/api-auth.spec.ts',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  expect: { timeout: 8000 },
  use: {
    baseURL: 'http://127.0.0.1:5177',
    channel: 'msedge',
    headless: true,
    viewport: { width: 1440, height: 1000 },
    trace: 'retain-on-failure',
  },
  webServer: { command: 'npm run dev -- --host 127.0.0.1 --port 5177 --strictPort', url: 'http://127.0.0.1:5177', reuseExistingServer: true, env: { VITE_SERVICE_MODE: 'mock' } },
  reporter: [['list'], ['html', { open: 'never' }]],
});
