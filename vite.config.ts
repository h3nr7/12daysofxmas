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
})
