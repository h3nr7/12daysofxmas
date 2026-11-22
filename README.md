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

## Deploys: Cloudflare Pages

The site is the Cloudflare Pages project `12daysofxmas`. Cloudflare's GitHub
app builds every push with `pnpm build` and serves `dist`.

| Branch | Environment | URL |
|---|---|---|
| `main` | Production | https://12daysofxmas.h3nr7.com, https://twelvedaysofxmas.h3nr7.com and https://12daysofxmas.pages.dev |
| any other, such as `develop` | Preview | `https://<branch>.12daysofxmas.pages.dev`, the branch name made URL-safe, and one URL per deploy at `https://<id>.12daysofxmas.pages.dev` |

On GitHub, each commit and pull request carries a "Cloudflare Pages" check
with its preview URL.

**Where the settings live.**

- `wrangler.toml` holds these settings. The dashboard shows them read-only, so change them here:
  - the project name
  - the output folder (`dist`)
  - the compatibility date
  - production's `NODE_VERSION` and `PNPM_VERSION`
- The dashboard holds the rest, under Workers & Pages → 12daysofxmas → Settings:
  - the build command
  - the production branch
  - the custom domains
  - which branches build

**From the terminal.** These need `wrangler login` once, to the Cloudflare
account that owns the project.

```sh
pnpm pages:deployments   # recent deploys: environment, branch, commit, URL and status
pnpm pages:production    # production deploys only; the newest successful one is live
pnpm pages:project       # the project and its domains
```

**Roll back or redeploy.** Wrangler has no Pages command for either. Use the
[project's Deployments page](https://dash.cloudflare.com/?to=/:account/pages/view/12daysofxmas):

- **Roll back:** a production deploy's ⋯ menu has "Rollback to this deployment".
- **Redeploy a failed build:** its ⋯ menu has "Retry deployment".

Pushing a commit to a branch also builds it again.

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
