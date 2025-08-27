import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { viteSingleFile } from 'vite-plugin-singlefile';

export default defineConfig({
  plugins: [
    react(),
    viteSingleFile()
  ],
  base: './',
  build: {
    sourcemap: true, // <-- ADD THIS LINE
    rollupOptions: {
      input: {
        standalone: resolve(__dirname, 'standalone.html'),
      },
    },
  },
});
