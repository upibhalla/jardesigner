import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // This section configures the build output
    rollupOptions: {
      // This tells Vite to look for multiple HTML files as entry points
      input: {
        // 'main' is the key for the main app bundle
        main: resolve(__dirname, 'index.html'),
        // 'standalone' is the key for the new viewer bundle
        standalone: resolve(__dirname, 'standalone.html'),
      },
    },
  },
});
