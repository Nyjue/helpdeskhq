import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the React dev server (port 5173) forwards /api calls to the
// Express server (port 3000). In production Express serves the built files,
// so both live on one URL and no proxy is needed.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: { '/api': 'http://localhost:3000' },
  },
});
