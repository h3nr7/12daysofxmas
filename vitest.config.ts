import { defineConfig } from 'vitest/config'

// Unit tests only. The browser smoke test lives in e2e/ and runs with Playwright.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
