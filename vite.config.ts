import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import glsl from 'vite-plugin-glsl';
import react from '@vitejs/plugin-react-swc'
import restart from 'vite-plugin-restart'
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    restart({ 
      restart: [
        './src/**/*.glsl',
        './public/**'
      ],
      reload: [
        './src/**/*.(tsx|ts|scss)'
      ]
    }),
    glsl()
  ],
  // One copy of three: the bare name, which dependencies such as drei import,
  // resolves to the WebGPU build through the shim. `three/webgpu` and
  // `three/tsl` are left alone. See src/three/webgpu-canvas/README.md. The
  // target is an absolute file path: a root-relative '/src/...' works in the
  // build but the dev server's dependency optimiser resolves it relative to
  // each dependency and fails.
  resolve: {
    alias: [
      { find: /^three$/, replacement: fileURLToPath(new URL('./src/three-webgpu.ts', import.meta.url)) },
    ],
  },
})
