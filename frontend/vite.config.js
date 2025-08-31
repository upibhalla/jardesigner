import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// No need for 'resolve' from 'path' unless you add path aliases later
export default defineConfig({
  plugins: [react()],
  // The 'base' and 'build' options can be removed for a standard setup.
  base: '/jardesigner/',
});
