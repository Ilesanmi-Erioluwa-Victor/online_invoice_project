import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vite config — builds the React app into /dist, which Vercel deploys automatically.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
});
