import { defineConfig } from '@playwright/test'
import { LAUNCH_ARGS, VIEWPORT } from './e2e/browser'

const PORT = 4173

export default defineConfig({
  testDir: './e2e',
  testMatch: '**/*.spec.ts',
  fullyParallel: true,
  // WebGL runs on the CPU (SwiftShader) here, so too many pages at once
  // starve each other's main thread.
  workers: process.env.CI ? 2 : 4,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    browserName: 'chromium',
    viewport: VIEWPORT,
    launchOptions: { args: LAUNCH_ARGS },
  },
  // Tests run against the production build, not the dev server.
  webServer: {
    command: `pnpm build && pnpm preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
