// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('secrets/key.pem'),
      cert: fs.readFileSync('secrets/cert.pem'),
    },
    port: 5173,
  },
});
