import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(root, 'index.html'),
        landingDetailed: path.resolve(root, 'landing-detailed/index.html'),
      },
    },
  },
  server: {
    port: 5175,
    proxy: {
      '/ai': {
        target: 'http://127.0.0.1:3040',
        changeOrigin: true,
      },
      '/site': {
        target: 'http://127.0.0.1:3040',
        changeOrigin: true,
      },
      '/cards': {
        target: 'http://127.0.0.1:3040',
        changeOrigin: true,
      },
    },
  },
});
