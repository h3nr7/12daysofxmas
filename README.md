# React + TypeScript + Vite

## Rendering: WebGPU only

The scenes render on three's `WebGPURenderer` (`src/three/webgpu-canvas/`)
and nothing else. A browser without a WebGPU device gets no canvas, and the
home page says so in one line. Project code imports `three/webgpu` and
`three/tsl`; a Vite alias in `vite.config.ts` sends every bare `three`
import, including drei's, to `src/three-webgpu.ts`, so there is one copy of
three (the recipe and its reasons are in the canvas folder's README).
`pnpm test:e2e` runs the scene routes on headless WebGPU (Chromium with
`--enable-unsafe-webgpu`) where the browser gives a device, and skips them
with the reason where it doesn't. Design:
`docs/plans/2026-11-21-webgpu-design.md`.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
