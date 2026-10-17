import { defineConfig, devices } from '@playwright/test'

/**
 * End-to-end tests against a production build on desktop Chromium.
 *
 *   npm run e2e
 */
const APP = 'http://localhost:4173'

export default defineConfig({
  testDir: 'e2e',
  timeout: 30_000,
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    ...devices['Desktop Chrome'],
    baseURL: APP,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npx vite build --outDir dist-e2e && npx vite preview --outDir dist-e2e --port 4173 --strictPort',
    url: APP,
    timeout: 120_000,
    reuseExistingServer: false,
  },
})
