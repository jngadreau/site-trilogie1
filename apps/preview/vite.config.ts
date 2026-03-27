import { defineConfig } from 'vite';

export default defineConfig({
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
    },
  },
});
