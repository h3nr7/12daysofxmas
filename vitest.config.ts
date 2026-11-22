import { defineConfig } from 'vitest/config'

// Unit tests only. The browser smoke test lives in e2e/ and runs with Playwright.
// `*.spec.ts` is the flock reference's naming (src/three/flock), so its two
// specs run here with the project's own `*.test.ts`.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
  },
})
