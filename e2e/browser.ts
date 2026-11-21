// Shared browser settings for the capture script and the Playwright tests.

// Chromium flags that keep WebGL available in headless mode.
// Recent Chromium no longer falls back to SwiftShader on its own.
export const LAUNCH_ARGS = ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist']

export const VIEWPORT = { width: 1280, height: 800 }
