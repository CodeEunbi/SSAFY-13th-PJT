// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  base: '',
  build: {
    rollupOptions: {
      input: {
        // 기존 index.html 외에 offscreen.html도 엔트리로 빌드
        offscreen: resolve(__dirname, 'src/offscreen/offscreen.html'),
      },
      output: {
        entryFileNames: '[name].js',
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'assets/[name].js',
      }
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: 'localhost',
    hmr: { host: 'localhost', port: 5173 },
    cors: true,
  },
});
