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
      // ✅ TS 엔트리를 직접 지정해서 JS 산출물을 고정 이름으로 만든다
      input: {
        offscreen: resolve(__dirname, 'src/offscreen/offscreen.ts'),
      },
      output: {
         entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'offscreen') return 'offscreen.js';
          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
      },
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
