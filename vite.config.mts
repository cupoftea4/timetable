import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build',
    sourcemap: true
  },
  resolve: {
    tsconfigPaths: true
  },
  define: {
    // Changes with every build, so each deploy installs a new service worker
    BUILD_ID: JSON.stringify(Date.now().toString(36)),
  },
  server: {
    port: 5174
  }
});
